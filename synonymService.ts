/// <reference lib="dom" />
/// <reference path="./swedishSynonyms.d.ts" />
import { requestUrl, RequestUrlResponse } from 'obsidian';
import { SynonymerSettings } from './settings';
import { fullSwedishDictionary } from './swedishSynonyms';

export class SynonymService {
    constructor(private settings: SynonymerSettings) {
        console.log("SynonymService initialized with settings:", 
            JSON.stringify({
                enableOnlineLookup: settings.enableOnlineLookup,
                apiSource: settings.apiSource,
                hasApiKey: !!settings.apiKey,
                maxSynonyms: settings.maxSynonyms,
                fallbackToLocalDictionary: settings.fallbackToLocalDictionary,
                alwaysTryOnline: settings.alwaysTryOnline
            })
        );
    }

    async getSynonyms(word: string): Promise<string[]> {
        console.log(`Getting synonyms for: "${word}"`);
        
        // First check the local dictionary
        const localSynonyms = this.getLocalSynonyms(word);
        console.log(`Found ${localSynonyms.length} local synonyms`);
        
        // If we have local synonyms and don't need to try online, or if online lookup is disabled
        if ((localSynonyms.length > 0 && !this.settings.alwaysTryOnline) || 
            !this.settings.enableOnlineLookup) {
            return localSynonyms.slice(0, this.settings.maxSynonyms);
        }
        
        // Try online lookup with improved error handling
        try {
            console.log(`Trying online lookup from ${this.settings.apiSource}`);
            const onlineSynonyms = await this.getOnlineSynonyms(word);
            console.log(`Found ${onlineSynonyms.length} online synonyms`);
            
            // If we got online synonyms, return them
            if (onlineSynonyms.length > 0) {
                return onlineSynonyms.slice(0, this.settings.maxSynonyms);
            }
            
            // Otherwise, fall back to local dictionary if we have results and fallback is enabled
            if (localSynonyms.length > 0 && this.settings.fallbackToLocalDictionary) {
                console.log("Using local synonyms as fallback");
                return localSynonyms.slice(0, this.settings.maxSynonyms);
            }
            
            // No synonyms found anywhere
            console.log("No synonyms found anywhere");
            return [];
        } catch (error) {
            console.error("Error fetching online synonyms:", error);
            
            // If we have local results as fallback and fallback is enabled, return those
            if (localSynonyms.length > 0 && this.settings.fallbackToLocalDictionary) {
                console.log("Error occurred, using local synonyms as fallback");
                return localSynonyms.slice(0, this.settings.maxSynonyms);
            }
            
            // Re-throw the error if we have no fallback
            throw new Error(`Kunde inte hämta synonymer: ${error instanceof Error ? error.message : 'CORS-fel eller nätverksproblem'}`);
        }
    }

    private getLocalSynonyms(word: string): string[] {
        const normalizedWord = word.toLowerCase().trim();
        return fullSwedishDictionary[normalizedWord] || [];
    }

    private async getOnlineSynonyms(word: string): Promise<string[]> {
        console.log(`Attempting to find online synonyms for: ${word}`);
        
        // Start with synonymer.se since it's most reliable based on logs
        const synonymsFromSynonymer = await this.getSynonymsFromSynonymerSe(word);
        
        // If we already have enough synonyms from synonymer.se, just return those
        if (synonymsFromSynonymer.length >= this.settings.maxSynonyms) {
            return synonymsFromSynonymer;
        }
        
        // Otherwise try other sources as well
        const synonymsFromSvenska = await this.getSynonymsFromSvenskaSe(word);
        
        // Combine results from both sources
        const allSynonyms = [...synonymsFromSynonymer, ...synonymsFromSvenska];
        
        // Remove duplicates and return
        return [...new Set(allSynonyms)];
    }

    private async getSynonymsFromSvenskaSe(word: string): Promise<string[]> {
        // Only try sources that seemed to work based on your logs
        try {
            const url = `https://www.synonymlexikon.se/sv-syn/${encodeURIComponent(word.toLowerCase())}`;
            console.log(`Trying direct access to: ${url}`);
            
            const response = await requestUrl({
                url: url,
                method: 'GET',
                headers: {
                    'Accept': 'text/html',
                    'User-Agent': 'Mozilla/5.0 (compatible; ObsidianSynonymPlugin/1.0)'
                },
                throw: false
            });
            
            if (response.status === 200) {
                console.log("Successfully fetched from synonymlexikon.se");
                const html = response.text;
                
                // Extract synonyms from the HTML response
                const synonyms: string[] = [];
                
                // Look for synonym items in the HTML structure
                const synonymPattern = /<li class="synonym-item">.*?>(.*?)<\/a>/gi;
                let match;
                
                while ((match = synonymPattern.exec(html)) !== null) {
                    if (match[1]) {
                        const synonym = match[1].trim();
                        if (synonym.toLowerCase() !== word.toLowerCase()) {
                            synonyms.push(synonym);
                        }
                    }
                }
                
                // If no matches found with that pattern, try another approach
                if (synonyms.length === 0) {
                    const altPattern = /<dd class="word">(.*?)<\/dd>/gi;
                    while ((match = altPattern.exec(html)) !== null) {
                        if (match[1]) {
                            const synonym = match[1].trim();
                            if (synonym.toLowerCase() !== word.toLowerCase()) {
                                synonyms.push(synonym);
                            }
                        }
                    }
                }
                
                if (synonyms.length > 0) {
                    console.log(`Found ${synonyms.length} synonyms from synonymlexikon.se`);
                    // Remove duplicates
                    return [...new Set(synonyms)];
                }
            }
            
            console.log(`Failed with status: ${response.status}`);
        } catch (error) {
            console.error("Error with synonymlexikon.se:", error);
        }
        
        // Skipping ord.se and folkets-lexikon as they're not working reliably
        
        console.log("Synonymlexikon attempts completed");
        return [];
    }

    private async getSynonymsFromSynonymerSe(word: string): Promise<string[]> {
        // Try direct access to synonymer.se - this is our most reliable source
        try {
            const url = `https://synonymer.se/sv-syn/${encodeURIComponent(word.toLowerCase())}`;
            console.log(`Trying direct access to: ${url}`);
            
            const response = await requestUrl({
                url: url,
                method: 'GET',
                headers: {
                    'Accept': 'text/html',
                    'User-Agent': 'Mozilla/5.0 (compatible; ObsidianSynonymPlugin/1.0)'
                },
                throw: false
            });
            
            if (response.status === 200) {
                console.log("Successfully fetched from synonymer.se");
                const html = response.text;
                
                // Don't log HTML samples to keep console cleaner
                // Extract synonyms from the HTML response
                const synonyms: string[] = [];
                
                // Look for the main synonym containers
                const mainPattern = /<div[^>]*class="main"[^>]*>([\s\S]*?)<\/div>/gi;
                let mainMatch;
                while ((mainMatch = mainPattern.exec(html)) !== null) {
                    if (mainMatch[1]) {
                        // Look for synonym spans in each main div
                        const synonymPattern = /<a[^>]*>([^<]+)<\/a>/gi;
                        let match;
                        
                        while ((match = synonymPattern.exec(mainMatch[1])) !== null) {
                            if (match[1]) {
                                const synonym = match[1].trim();
                                if (synonym.toLowerCase() !== word.toLowerCase() && 
                                    !synonym.startsWith('/') && 
                                    synonym.length > 1) {
                                    synonyms.push(synonym);
                                }
                            }
                        }
                    }
                }
                
                // If no synonyms found in main divs, try a more general approach
                if (synonyms.length === 0) {
                    const patterns = [
                        /<span class="word"[^>]*>([^<]+)<\/span>/gi,
                        /<a href="\/sv-syn\/[^"]+"[^>]*>([^<]+)<\/a>/gi,
                        /<td class="word"[^>]*>([^<]+)<\/td>/gi
                    ];
                    
                    for (const pattern of patterns) {
                        let match;
                        while ((match = pattern.exec(html)) !== null) {
                            if (match[1]) {
                                const synonym = match[1].trim();
                                if (synonym.toLowerCase() !== word.toLowerCase() && 
                                    !synonym.startsWith('/') && 
                                    synonym.length > 1) {
                                    synonyms.push(synonym);
                                }
                            }
                        }
                    }
                }
                
                if (synonyms.length > 0) {
                    console.log(`Found ${synonyms.length} synonyms from synonymer.se`);
                    // Remove duplicates
                    return [...new Set(synonyms)];
                } else {
                    console.log("No synonyms found in the HTML from synonymer.se");
                }
            }
            
            console.log(`Failed with status: ${response.status}`);
        } catch (error) {
            console.error("Error with synonymer.se:", error);
        }
        
        // Try svenska-synonymer.se as backup
        try {
            const url = `https://svenska-synonymer.se/synonymer-till-${encodeURIComponent(word.toLowerCase())}`;
            console.log(`Trying direct access to: ${url}`);
            
            const response = await requestUrl({
                url: url,
                method: 'GET',
                headers: {
                    'Accept': 'text/html',
                    'User-Agent': 'Mozilla/5.0 (compatible; ObsidianSynonymPlugin/1.0)'
                },
                throw: false
            });
            
            if (response.status === 200) {
                console.log("Successfully fetched from svenska-synonymer.se");
                const html = response.text;
                
                // Extract synonyms from the HTML response
                const synonyms: string[] = [];
                
                // Look for the synonyms section
                const synonymSection = html.match(/<div[^>]*class="synonyms"[^>]*>([\s\S]*?)<\/div>/i);
                if (synonymSection && synonymSection[1]) {
                    const synonymPattern = /<a[^>]*>([^<]+)<\/a>/gi;
                    let match;
                    
                    while ((match = synonymPattern.exec(synonymSection[1])) !== null) {
                        if (match[1]) {
                            const synonym = match[1].trim();
                            if (synonym.toLowerCase() !== word.toLowerCase()) {
                                synonyms.push(synonym);
                            }
                        }
                    }
                }
                
                if (synonyms.length > 0) {
                    console.log(`Found ${synonyms.length} synonyms from svenska-synonymer.se`);
                    // Remove duplicates
                    return [...new Set(synonyms)];
                }
            }
            
            console.log(`Failed with status: ${response.status}`);
        } catch (error) {
            console.error("Error with svenska-synonymer.se:", error);
        }
        
        return [];
    }
}
