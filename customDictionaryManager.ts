import { normalizePath, TFile, Vault, App } from 'obsidian';

export interface CustomDictionary {
    [word: string]: string[];
}

export class CustomDictionaryManager {
    private vault: Vault;
    private app: App;
    private filePath: string;
    private dictionary: CustomDictionary = {};

    constructor(app: App, pluginDir: string) {
    this.app = app;
    this.vault = app.vault;
    // Use selectedLanguage from settings if available, fallback to 'en'
    const settings = (this.app as any).plugins?.plugins?.synonym?.settings;
    const lang = settings?.selectedLanguage || 'en';
    this.filePath = normalizePath(`${pluginDir}/assets/custom-synonyms-${lang}.json`);
    }

    async load(): Promise<CustomDictionary> {
        try {
            // Try to read the file directly using the adapter
            try {
                const content = await this.app.vault.adapter.read(this.filePath);
                this.dictionary = JSON.parse(content);
                return this.dictionary;
            } catch (readError) {
                // Custom synonyms file does not exist, will create on first save
                this.dictionary = {};
                return {};
            }
        } catch (error) {
            console.error('Error loading custom dictionary:', error);
            this.dictionary = {};
            return {};
        }
    }

    async save(dictionary?: CustomDictionary): Promise<void> {
        if (dictionary !== undefined) {
            this.dictionary = dictionary;
        }

        try {
            const content = JSON.stringify(this.dictionary, null, 2);
            
            // Simply write the file - the assets folder should already exist
            await this.app.vault.adapter.write(this.filePath, content);
        } catch (error) {
            console.error('Error saving custom dictionary:', error);
            throw error;
        }
    }

    async addSynonym(word: string, synonym: string): Promise<void> {
        const normalizedWord = word.toLowerCase().trim();
        const normalizedSynonym = synonym.trim();

        if (!this.dictionary[normalizedWord]) {
            this.dictionary[normalizedWord] = [];
        }

        if (!this.dictionary[normalizedWord].includes(normalizedSynonym)) {
            this.dictionary[normalizedWord].push(normalizedSynonym);
            await this.save();
        }
    }

    async removeSynonym(word: string, synonym: string): Promise<void> {
        const normalizedWord = word.toLowerCase().trim();
        
        if (this.dictionary[normalizedWord]) {
            this.dictionary[normalizedWord] = this.dictionary[normalizedWord]
                .filter(s => s !== synonym);
            
            if (this.dictionary[normalizedWord].length === 0) {
                delete this.dictionary[normalizedWord];
            }
            
            await this.save();
        }
    }

    getSynonyms(word: string): string[] {
        const normalizedWord = word.toLowerCase().trim();
        return this.dictionary[normalizedWord] || [];
    }

    getAllWords(): string[] {
        return Object.keys(this.dictionary).sort();
    }

    async openFile(): Promise<void> {
        try {
            // Ensure the file exists
            const fileExists = await this.app.vault.adapter.exists(this.filePath);
            
            if (!fileExists) {
                await this.save();
            }
            
            // Get the TFile object for the custom synonyms file
            let file = this.app.vault.getAbstractFileByPath(this.filePath);
            
            if (!file) {
                // Force vault to re-index if file isn't found
                // Trigger vault to notice the file
                await this.app.vault.adapter.stat(this.filePath);
                // Give vault time to index
                await new Promise(resolve => setTimeout(resolve, 500));
                file = this.app.vault.getAbstractFileByPath(this.filePath);
            }
            
            if (file instanceof TFile) {
                // Open the file in a new tab for editing
                const leaf = this.app.workspace.getLeaf('tab');
                await leaf.openFile(file);
            } else {
                console.error('Unable to open file - not recognized as TFile by vault');
                // As a fallback, show an error message
                throw new Error('Unable to open custom synonyms file. Please navigate to it manually in the file explorer.');
            }
        } catch (error) {
            console.error('Error opening custom synonyms file:', error);
            throw error;
        }
    }
}
