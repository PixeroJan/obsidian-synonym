import { normalizePath, TFile, Vault, App } from 'obsidian';

export interface AssetDictionary {
    [word: string]: string[];
}

export class AssetDictionaryLoader {
    private vault: Vault;
    private app: App;
    private basePath: string;

    constructor(app: App, pluginDir: string) {
        this.app = app;
        this.vault = app.vault;
        // The pluginDir already contains the full path from vault root
        this.basePath = normalizePath(`${pluginDir}/assets`);
    }

    async loadDictionary(languageCode: string): Promise<AssetDictionary> {
        // For Swedish, try Synlex.xml first
        if (languageCode === 'sv_SE') {
            const xmlPath = normalizePath(`${this.basePath}/Synlex.xml`);
            try {
                const fileContent = await this.app.vault.adapter.read(xmlPath);
                return this.parseSynlexXml(fileContent);
            } catch (error) {
                // Synlex.xml not found, fall back to .dat file
            }
        }
        
        // Fall back to .dat file
        const fileName = `th_${languageCode}_v2.dat`;
        const filePath = normalizePath(`${this.basePath}/${fileName}`);
        
        try {
            // Use the vault adapter to read the file directly
            const fileContent = await this.app.vault.adapter.read(filePath);
            return this.parseDatFile(fileContent);
        } catch (error) {
            console.error(`Error loading dictionary from ${filePath}:`, error);
            return {};
        }
    }

    private parseSynlexXml(content: string): AssetDictionary {
        const dictionary: AssetDictionary = {};
        
        // Parse XML using regex (simple approach for this structured format)
        // Use global flag without 's' flag for compatibility
        const synPattern = /<syn level="([\d.]+)">\s*<w1>(.*?)<\/w1>\s*<w2>(.*?)<\/w2>\s*<\/syn>/g;
        let match;
        let pairCount = 0;
        
        while ((match = synPattern.exec(content)) !== null) {
            const level = parseFloat(match[1]);
            const word1 = match[2].trim().toLowerCase();
            const word2 = match[3].trim().toLowerCase();
            
            // Only include synonyms with quality level >= 3.0
            if (level >= 3.0 && word1 && word2) {
                // Add word2 as synonym of word1
                if (!dictionary[word1]) {
                    dictionary[word1] = [];
                }
                if (!dictionary[word1].includes(word2)) {
                    dictionary[word1].push(word2);
                }
                
                // Add word1 as synonym of word2 (bidirectional)
                if (!dictionary[word2]) {
                    dictionary[word2] = [];
                }
                if (!dictionary[word2].includes(word1)) {
                    dictionary[word2].push(word1);
                }
                
                pairCount++;
            }
        }
        
        return dictionary;
    }

    private parseDatFile(content: string): AssetDictionary {
        const dictionary: AssetDictionary = {};
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]?.trim();
            if (!line) continue;
            
            // Parse format: word|count or word|synonyms
            const parts = line.split('|');
            if (parts.length < 2) continue;
            
            const word = parts[0].toLowerCase().trim();
            if (!word) continue;
            
            // Check if this is a single-line format (word|count on one line, synonyms on next)
            // or inline format (word|synonym1|synonym2|...)
            const secondPart = parts[1].trim();
            
            // If second part is just a number, synonyms are on the next line
            if (/^\d+$/.test(secondPart)) {
                i++;
                if (i >= lines.length) break;
                const synonymLine = lines[i]?.trim();
                if (!synonymLine) continue;
                
                // Parse synonyms from the line (may or may not start with |)
                const synonyms = synonymLine
                    .replace(/^\|/, '') // Remove leading | if present
                    .split('|')
                    .map(s => {
                        // Extract just the word, removing (noun), (verb), etc.
                        return s.replace(/\([^)]*\)/g, '').trim();
                    })
                    .filter(s => s.length > 0 && s !== word);
                
                if (synonyms.length > 0) {
                    dictionary[word] = synonyms;
                }
            } else {
                // Inline format: all synonyms on same line
                const synonyms = parts.slice(1)
                    .map(s => {
                        // Extract just the word, removing (noun), (verb), etc.
                        return s.replace(/\([^)]*\)/g, '').trim();
                    })
                    .filter(s => s.length > 0 && s !== word && !/^\d+$/.test(s));
                
                if (synonyms.length > 0) {
                    dictionary[word] = synonyms;
                }
            }
        }
        
        return dictionary;
    }

    async getAvailableLanguages(): Promise<string[]> {
        const languages: string[] = [];
        
        try {
            // Read files directly from the assets folder using adapter
            const datPattern = /th_([^_]+_[^_]+)_v2\.dat$/;
            
            // List files in the assets directory
            const files = await this.app.vault.adapter.list(this.basePath);
            
            // Check for Synlex.xml (Swedish)
            for (const file of files.files) {
                const fileName = file.split('/').pop() || file.split('\\').pop() || file;
                if (fileName === 'Synlex.xml') {
                    languages.push('sv_SE');
                }
            }
            
            // Check .dat files
            for (const file of files.files) {
                const fileName = file.split('/').pop() || file.split('\\').pop() || file;
                const match = fileName.match(datPattern);
                if (match && match[1]) {
                    // Don't add sv_SE twice if we already found Synlex.xml
                    if (match[1] !== 'sv_SE' || !languages.includes('sv_SE')) {
                        languages.push(match[1]);
                    }
                }
            }
        } catch (error) {
            console.error('Error scanning for language files:', error);
        }

        return languages;
    }
}
