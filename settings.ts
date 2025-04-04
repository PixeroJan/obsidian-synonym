export interface SynonymerSettings {
    enableOnlineLookup: boolean;
    apiSource: string;
    apiKey: string;
    maxSynonyms: number;
    fallbackToLocalDictionary: boolean; // Use local dictionary as fallback
    alwaysTryOnline: boolean; // Always try online even if local synonyms are found
}

export const DEFAULT_SETTINGS: SynonymerSettings = {
    enableOnlineLookup: true,
    apiSource: 'svenskaSe',
    apiKey: '',
    maxSynonyms: 10,
    fallbackToLocalDictionary: true,
    alwaysTryOnline: false
}
