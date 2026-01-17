/// <reference lib="dom" />
/// <reference path="./swedishSynonyms.d.ts" />
import { requestUrl, RequestUrlResponse } from 'obsidian';
import { SynonymerSettings } from './settings';
import { AssetDictionary } from './assetDictionaryLoader';
import { CustomDictionaryManager } from './customDictionaryManager';

export class SynonymService {
    private assetDictionary: AssetDictionary = {};
    private customManager: CustomDictionaryManager | null = null;

    constructor(
        private settings: SynonymerSettings,
        assetDictionary?: AssetDictionary,
        customManager?: CustomDictionaryManager
    ) {
        if (assetDictionary) {
            this.assetDictionary = assetDictionary;
        }
        if (customManager) {
            this.customManager = customManager;
        }
    }

    async getSynonyms(word: string): Promise<string[]> {
        // Priority 1: Custom synonyms
        const customSynonyms = this.getCustomSynonyms(word);
        
        // Priority 2: Assets dictionary
        const assetSynonyms = this.getAssetSynonyms(word);
        
        // Priority 3: Built-in dictionary
        const localSynonyms = this.getLocalSynonyms(word);
        
        // Combine all local sources (remove duplicates)
        const allLocalSynonyms = [
            ...customSynonyms,
            ...assetSynonyms,
            ...localSynonyms.filter(s => !assetSynonyms.includes(s))
        ];
        
        // No vulgar filter, use all local synonyms
        const filteredLocal = allLocalSynonyms;
        
        // If we have local synonyms and online lookup is disabled, return local results
        if (filteredLocal.length > 0 && !this.settings.enableOnlineLookup) {
            return filteredLocal.slice(0, this.settings.maxSynonyms);
        }
        
        // Try online lookup
        try {
            const onlineSynonyms = await this.getOnlineSynonyms(word);
            
            // Combine with priority: Custom > Online > Other local
            const combined = [
                ...customSynonyms,
                ...onlineSynonyms.filter(s => !customSynonyms.includes(s)),
                ...filteredLocal.filter(s => !customSynonyms.includes(s) && !onlineSynonyms.includes(s))
            ];
            
            if (combined.length > 0) {
                return combined.slice(0, this.settings.maxSynonyms);
            }
            
            return filteredLocal.slice(0, this.settings.maxSynonyms);
        } catch (error) {
            console.error("Error fetching online synonyms:", error);
            
            // Always use local synonyms as fallback if available
            if (filteredLocal.length > 0) {
                return filteredLocal.slice(0, this.settings.maxSynonyms);
            }
            
            throw new Error(`Could not fetch synonyms: ${error instanceof Error ? error.message : 'Network error'}`);
        }
    }

    private getCustomSynonyms(word: string): string[] {
        if (!this.customManager) return [];
        return this.customManager.getSynonyms(word);
    }

    private getAssetSynonyms(word: string): string[] {
        const normalizedWord = word.toLowerCase().trim();
        return this.assetDictionary[normalizedWord] || [];
    }

    private getLocalSynonyms(word: string): string[] {
        // No local dictionary, always use asset dictionary
        return [];
    }

    // Removed filterVulgarWords method

    private async getOnlineSynonyms(word: string): Promise<string[]> {
        // Route to the appropriate source based on settings
        if (this.settings.apiSource === 'thesaurus_com') {
            return await this.getSynonymsFromThesaurusCom(word);
        } else if (this.settings.apiSource === 'svenska_se') {
            // For Swedish, try multiple sources as before
            const synonymerResults = await this.getSynonymsFromSynonymerSe(word);
            if (synonymerResults.length >= this.settings.maxSynonyms) {
                return synonymerResults;
            }
            
            const svenskaResults = await this.getSynonymsFromSvenskaSe(word);
            const combined = [...synonymerResults, ...svenskaResults];
            return [...new Set(combined)];
        } else {
            // Default to Thesaurus.com
            return await this.getSynonymsFromThesaurusCom(word);
        }
    }

    private async getSynonymsFromSvenskaSe(word: string): Promise<string[]> {
        // Only try sources that seemed to work based on your logs
        try {
            const url = `https://www.synonymlexikon.se/sv-syn/${encodeURIComponent(word.toLowerCase())}`;
            
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
                    // Remove duplicates
                    return [...new Set(synonyms)];
                }
            }
        } catch (error) {
            console.error("Error with synonymlexikon.se:", error);
        }
        
        console.log("Synonymlexikon attempts completed");
        return [];
    }

    private async getSynonymsFromSynonymerSe(word: string): Promise<string[]> {
        // Try direct access to synonymer.se - this is our most reliable source
        try {
            const url = `https://www.synonymer.se/sv-syn/${encodeURIComponent(word.toLowerCase())}`;
            
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
                    // Remove duplicates
                    return [...new Set(synonyms)];
                }
            }
            
            console.log(`Failed with status: ${response.status}`);
        } catch (error) {
            console.error("Error with synonymer.se:", error);
        }
        
        return [];
    }

    private async getSynonymsFromThesaurusCom(word: string): Promise<string[]> {
        try {
            const url = `https://www.thesaurus.com/browse/${encodeURIComponent(word.toLowerCase())}`;

            const response = await requestUrl({
                url: url,
                method: 'GET',
                headers: {
                    'Accept': 'text/html',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                throw: false
            });

            if (response.status === 200) {
                const html = response.text;
                const synonyms: string[] = [];

                // Try multiple patterns to extract synonyms
                const patterns = [
                    // Pattern 1: data-testid="word-grid-container" with links
                    /<div[^>]*data-testid="word-grid-container"[^>]*>([\s\S]*?)<\/div>/gi,
                    // Pattern 2: Links with /browse/ in href
                    /<a[^>]*href="\/browse\/([^"]+)"[^>]*>([^<]+)<\/a>/gi,
                    // Pattern 3: Any section with id containing "synonym"
                    /<section[^>]*id="[^"]*synonym[^"]*"[^>]*>([\s\S]*?)<\/section>/gi,
                    // Pattern 4: ul with class containing "synonym"
                    /<ul[^>]*class="[^"]*synonym[^"]*"[^>]*>([\s\S]*?)<\/ul>/gi
                ];

                for (const pattern of patterns) {
                    let match;
                    while ((match = pattern.exec(html)) !== null) {
                        const content = match[1] || match[2] || '';
                        
                        // Extract words from links within this content
                        const linkPattern = /<a[^>]*>([^<]+)<\/a>/gi;
                        let linkMatch;
                        while ((linkMatch = linkPattern.exec(content)) !== null) {
                            const synonym = linkMatch[1].trim();
                            if (synonym && 
                                synonym.toLowerCase() !== word.toLowerCase() && 
                                synonym.length > 1 && 
                                synonym.length < 30 &&
                                !/^\d+$/.test(synonym) &&
                                !synonym.includes('...')) {
                                synonyms.push(synonym);
                            }
                        }
                    }
                    
                    if (synonyms.length > 0) break;
                }

                if (synonyms.length > 0) {
                    return [...new Set(synonyms)].slice(0, 20);
                }
            }
        } catch (error) {
            console.error("Error with Thesaurus.com:", error);
        }
        return [];
    }

    private async getSynonymsFromSynonymsNet(word: string): Promise<string[]> {
        try {
            const url = `https://www.synonyms.net/synonym/${encodeURIComponent(word.toLowerCase())}`;
            console.log(`Trying Synonyms.net: ${url}`);
            
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
                const html = response.text;
                const synonyms: string[] = [];
                
                // Multiple patterns to try for Synonyms.net
                const patterns = [
                    /<div class="syn">([^<]+)<\/div>/gi,
                    /<a[^>]*href="\/synonym\/[^"]*"[^>]*>([^<]+)<\/a>/gi,
                    /<li[^>]*>([^<]+)<\/li>/gi
                ];
                
                for (const pattern of patterns) {
                    let match;
                    while ((match = pattern.exec(html)) !== null) {
                        if (match[1]) {
                            const synonym = match[1].trim();
                            if (synonym.toLowerCase() !== word.toLowerCase() && 
                                synonym.length > 1 && 
                                !synonym.includes('http') &&
                                !/^\d+$/.test(synonym)) {
                                synonyms.push(synonym);
                            }
                        }
                    }
                    if (synonyms.length > 0) break;
                }
                
                if (synonyms.length > 0) {
                    console.log(`Found ${synonyms.length} synonyms from Synonyms.net`);
                    return [...new Set(synonyms)].slice(0, 20);
                }
            }
        } catch (error) {
            console.error("Error with Synonyms.net:", error);
        }
        return [];
    }

    private async getSynonymsFromSynonymeDe(word: string): Promise<string[]> {
        try {
            const url = `https://www.synonyme.de/${encodeURIComponent(word.toLowerCase())}/`;
            console.log(`Trying Synonyme.de: ${url}`);
            
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
                const html = response.text;
                const synonyms: string[] = [];
                
                // Multiple patterns for Synonyme.de
                const patterns = [
                    /<a[^>]*href="\/[^"]*"[^>]*>([^<]+)<\/a>/gi,
                    /<span[^>]*class="[^"]*syn[^"]*"[^>]*>([^<]+)<\/span>/gi,
                    /<li[^>]*>([^<]+)<\/li>/gi
                ];
                
                for (const pattern of patterns) {
                    let match;
                    while ((match = pattern.exec(html)) !== null) {
                        if (match[1]) {
                            const synonym = match[1].trim();
                            if (synonym.toLowerCase() !== word.toLowerCase() && 
                                synonym.length > 1 && 
                                !synonym.includes('http') &&
                                !/^\d+$/.test(synonym)) {
                                synonyms.push(synonym);
                            }
                        }
                    }
                    if (synonyms.length > 0) break;
                }
                
                if (synonyms.length > 0) {
                    console.log(`Found ${synonyms.length} synonyms from Synonyme.de`);
                    return [...new Set(synonyms)].slice(0, 20);
                }
            }
        } catch (error) {
            console.error("Error with Synonyme.de:", error);
        }
        return [];
    }

    private async getSynonymsFromSynonymesFr(word: string): Promise<string[]> {
        try {
            const url = `https://www.synonymes.com/synonyme.php?mot=${encodeURIComponent(word.toLowerCase())}`;
            console.log(`Trying Synonymes.com: ${url}`);
            
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
                const html = response.text;
                const synonyms: string[] = [];
                
                // Multiple patterns for Synonymes.com
                const patterns = [
                    /<a[^>]*href="synonyme\.php\?mot=[^"]*"[^>]*>([^<]+)<\/a>/gi,
                    /<a[^>]*href="\/synonyme\/[^"]*"[^>]*>([^<]+)<\/a>/gi,
                    /<span[^>]*class="[^"]*syn[^"]*"[^>]*>([^<]+)<\/span>/gi
                ];
                
                for (const pattern of patterns) {
                    let match;
                    while ((match = pattern.exec(html)) !== null) {
                        if (match[1]) {
                            const synonym = match[1].trim();
                            if (synonym.toLowerCase() !== word.toLowerCase() && 
                                synonym.length > 1 &&
                                !synonym.includes('http')) {
                                synonyms.push(synonym);
                            }
                        }
                    }
                    if (synonyms.length > 0) break;
                }
                
                if (synonyms.length > 0) {
                    console.log(`Found ${synonyms.length} synonyms from Synonymes.com`);
                    return [...new Set(synonyms)].slice(0, 20);
                }
            }
        } catch (error) {
            console.error("Error with Synonymes.com:", error);
        }
        return [];
    }

    private async getSynonymsFromSinonimosEs(word: string): Promise<string[]> {
        try {
            const url = `https://www.sinonimos.com/${encodeURIComponent(word.toLowerCase())}/`;
            console.log(`Trying Sinonimos.com: ${url}`);
            
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
                const html = response.text;
                const synonyms: string[] = [];
                
                // Multiple patterns for Sinonimos.com
                const patterns = [
                    /<a[^>]*href="\/[^"]*\/"[^>]*>([^<]+)<\/a>/gi,
                    /<span[^>]*class="[^"]*sin[^"]*"[^>]*>([^<]+)<\/span>/gi,
                    /<li[^>]*class="[^"]*"[^>]*>([^<]+)<\/li>/gi
                ];
                
                for (const pattern of patterns) {
                    let match;
                    while ((match = pattern.exec(html)) !== null) {
                        if (match[1]) {
                            const synonym = match[1].trim();
                            if (synonym.toLowerCase() !== word.toLowerCase() && 
                                synonym.length > 1 &&
                                !synonym.includes('http') &&
                                !/^\d+$/.test(synonym)) {
                                synonyms.push(synonym);
                            }
                        }
                    }
                    if (synonyms.length > 0) break;
                }
                
                if (synonyms.length > 0) {
                    console.log(`Found ${synonyms.length} synonyms from Sinonimos.com`);
                    return [...new Set(synonyms)].slice(0, 20);
                }
            }
        } catch (error) {
            console.error("Error with Sinonimos.com:", error);
        }
        return [];
    }

    private async getSynonymsFromSinonimosPt(word: string): Promise<string[]> {
        try {
            const url = `https://www.sinonimos.com.br/${encodeURIComponent(word.toLowerCase())}/`;
            console.log(`Trying Sinonimos.com.br: ${url}`);
            
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
                const html = response.text;
                const synonyms: string[] = [];
                
                // Multiple patterns for Sinonimos.com.br
                const patterns = [
                    /<a[^>]*href="\/[^"]*\/"[^>]*>([^<]+)<\/a>/gi,
                    /<span[^>]*class="[^"]*sin[^"]*"[^>]*>([^<]+)<\/span>/gi,
                    /<li[^>]*>([^<]+)<\/li>/gi
                ];
                
                for (const pattern of patterns) {
                    let match;
                    while ((match = pattern.exec(html)) !== null) {
                        if (match[1]) {
                            const synonym = match[1].trim();
                            if (synonym.toLowerCase() !== word.toLowerCase() && 
                                synonym.length > 1 &&
                                !synonym.includes('http') &&
                                !/^\d+$/.test(synonym)) {
                                synonyms.push(synonym);
                            }
                        }
                    }
                    if (synonyms.length > 0) break;
                }
                
                if (synonyms.length > 0) {
                    console.log(`Found ${synonyms.length} synonyms from Sinonimos.com.br`);
                    return [...new Set(synonyms)].slice(0, 20);
                }
            }
        } catch (error) {
            console.error("Error with Sinonimos.com.br:", error);
        }
        return [];
    }

    private async getSynonymsFromSinonimiIt(word: string): Promise<string[]> {
        try {
            const url = `https://www.sinonimi.org/sinonimi/${encodeURIComponent(word.toLowerCase())}.html`;
            console.log(`Trying Sinonimi.org: ${url}`);
            
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
                const html = response.text;
                const synonyms: string[] = [];
                
                // Multiple patterns for Sinonimi.org
                const patterns = [
                    /<a[^>]*href="\/sinonimi\/[^"]*"[^>]*>([^<]+)<\/a>/gi,
                    /<a[^>]*href="[^"]*"[^>]*>([^<]+)<\/a>/gi,
                    /<li[^>]*>([^<]+)<\/li>/gi
                ];
                
                for (const pattern of patterns) {
                    let match;
                    while ((match = pattern.exec(html)) !== null) {
                        if (match[1]) {
                            const synonym = match[1].trim();
                            if (synonym.toLowerCase() !== word.toLowerCase() && 
                                synonym.length > 1 &&
                                !synonym.includes('http') &&
                                !/^\d+$/.test(synonym)) {
                                synonyms.push(synonym);
                            }
                        }
                    }
                    if (synonyms.length > 0) break;
                }
                
                if (synonyms.length > 0) {
                    console.log(`Found ${synonyms.length} synonyms from Sinonimi.org`);
                    return [...new Set(synonyms)].slice(0, 20);
                }
            }
        } catch (error) {
            console.error("Error with Sinonimi.org:", error);
        }
        return [];
    }
}
