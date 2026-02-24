import { UILanguage } from './i18n';

export interface SynonymerSettings {
    enableOnlineLookup: boolean;
    apiSource: string;
    apiKey: string;
    maxSynonyms: number;
    selectedLanguage: string;
    uiLanguage: UILanguage;
}

export const DEFAULT_SETTINGS: SynonymerSettings = {
    enableOnlineLookup: true,
    apiSource: 'thesaurus_com',
    apiKey: '',
    maxSynonyms: 10,
    selectedLanguage: 'en_US',
    uiLanguage: 'en'
}
