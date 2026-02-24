export type UILanguage = 'en' | 'sv';

export interface Translations {
    // General
    synonym: string;
    cancel: string;
    add: string;

    // Ribbon / commands
    ribbonTooltip: string;
    commandShowSynonyms: string;

    // Context menu
    contextAddSynonym: string;
    contextFindSynonyms: string;

    // Add synonym modal
    addSynonymTitle: (word: string) => string;
    addSynonymPlaceholder: string;

    // Notices
    selectWordNotice: string;
    markdownOnlyNotice: string;
    searchingNotice: (word: string) => string;
    noSynonymsNotice: (word: string) => string;
    foundSynonymsHeader: (count: number) => string;
    synonymAddedNotice: (synonym: string, word: string) => string;
    couldNotAddSynonym: string;
    connectionError: string;
    couldNotFetchSynonyms: string;
    unknownError: string;
    reloadPluginNotice: string;

    // Settings
    settingsHeading: string;
    uiLanguageName: string;
    uiLanguageDesc: string;
    uiLanguageEnglish: string;
    uiLanguageSwedish: string;
    dictLanguageName: string;
    dictLanguageDesc: string;
    noDictionariesFound: string;
    enableOnlineName: string;
    enableOnlineDesc: string;
    onlineSourceName: string;
    onlineSourceDesc: string;
    onlineSourceThesaurus: string;
    onlineSourceSwedish: string;
    apiKeyName: string;
    apiKeyDesc: string;
    apiKeyPlaceholder: string;
    maxSynonymsName: string;
    maxSynonymsDesc: string;
}

const en: Translations = {
    synonym: 'Synonym',
    cancel: 'Cancel',
    add: 'Add',

    ribbonTooltip: 'Synonym',
    commandShowSynonyms: 'Show synonyms for selected word',

    contextAddSynonym: 'Add synonym',
    contextFindSynonyms: 'Find synonyms',

    addSynonymTitle: (word) => `Add synonym for "${word}"`,
    addSynonymPlaceholder: 'Enter synonym...',

    selectWordNotice: 'Select a word to find synonyms',
    markdownOnlyNotice: 'This feature only works in Markdown view',
    searchingNotice: (word) => `Searching for synonyms for "${word}"...`,
    noSynonymsNotice: (word) => `No synonyms found for "${word}"`,
    foundSynonymsHeader: (count) => `Found ${count} synonyms:`,
    synonymAddedNotice: (synonym, word) => `Added "${synonym}" as a synonym for "${word}"`,
    couldNotAddSynonym: 'Could not add synonym: ',
    connectionError: 'Could not connect to the synonym service. Check your internet connection.',
    couldNotFetchSynonyms: 'Could not fetch synonyms: ',
    unknownError: 'Unknown error',
    reloadPluginNotice: 'Reload the plugin to use the new language',

    settingsHeading: 'Synonym Settings',
    uiLanguageName: 'Interface language',
    uiLanguageDesc: 'Select the language for the plugin interface',
    uiLanguageEnglish: 'English',
    uiLanguageSwedish: 'Svenska',
    dictLanguageName: 'Dictionary language',
    dictLanguageDesc: 'Select the language for the local synonym dictionary',
    noDictionariesFound: 'No dictionaries found',
    enableOnlineName: 'Enable online lookup',
    enableOnlineDesc: 'Search for additional synonyms from online sources to complement local dictionary',
    onlineSourceName: 'Online source',
    onlineSourceDesc: 'Select which online service to use for additional synonyms',
    onlineSourceThesaurus: 'Thesaurus.com (English)',
    onlineSourceSwedish: 'Synonymer (Swedish)',
    apiKeyName: 'API key',
    apiKeyDesc: 'API key for online service (if required by the selected source)',
    apiKeyPlaceholder: 'Enter API key',
    maxSynonymsName: 'Maximum synonyms',
    maxSynonymsDesc: 'Maximum number of synonyms to display',
};

const sv: Translations = {
    synonym: 'Synonym',
    cancel: 'Avbryt',
    add: 'Lägg till',

    ribbonTooltip: 'Synonym',
    commandShowSynonyms: 'Visa synonymer för markerat ord',

    contextAddSynonym: 'Lägg till synonym',
    contextFindSynonyms: 'Hitta synonymer',

    addSynonymTitle: (word) => `Lägg till synonym för "${word}"`,
    addSynonymPlaceholder: 'Ange synonym...',

    selectWordNotice: 'Markera ett ord för att hitta synonymer',
    markdownOnlyNotice: 'Den här funktionen fungerar bara i Markdown-vy',
    searchingNotice: (word) => `Söker efter synonymer för "${word}"...`,
    noSynonymsNotice: (word) => `Inga synonymer hittades för "${word}"`,
    foundSynonymsHeader: (count) => `Hittade ${count} synonymer:`,
    synonymAddedNotice: (synonym, word) => `Lade till "${synonym}" som synonym för "${word}"`,
    couldNotAddSynonym: 'Kunde inte lägga till synonym: ',
    connectionError: 'Kunde inte ansluta till synonymtjänsten. Kontrollera din internetanslutning.',
    couldNotFetchSynonyms: 'Kunde inte hämta synonymer: ',
    unknownError: 'Okänt fel',
    reloadPluginNotice: 'Ladda om tillägget för att använda det nya språket',

    settingsHeading: 'Synonyminställningar',
    uiLanguageName: 'Gränssnittsspråk',
    uiLanguageDesc: 'Välj språk för tilläggets gränssnitt',
    uiLanguageEnglish: 'English',
    uiLanguageSwedish: 'Svenska',
    dictLanguageName: 'Ordlistans språk',
    dictLanguageDesc: 'Välj språk för den lokala synonymordlistan',
    noDictionariesFound: 'Inga ordlistor hittades',
    enableOnlineName: 'Aktivera onlinesökning',
    enableOnlineDesc: 'Sök efter ytterligare synonymer från onlinekällor för att komplettera lokal ordlista',
    onlineSourceName: 'Onlinekälla',
    onlineSourceDesc: 'Välj vilken onlinetjänst som ska användas för ytterligare synonymer',
    onlineSourceThesaurus: 'Thesaurus.com (engelska)',
    onlineSourceSwedish: 'Synonymer (svenska)',
    apiKeyName: 'API-nyckel',
    apiKeyDesc: 'API-nyckel för onlinetjänst (om det krävs av vald källa)',
    apiKeyPlaceholder: 'Ange API-nyckel',
    maxSynonymsName: 'Maximalt antal synonymer',
    maxSynonymsDesc: 'Maximalt antal synonymer att visa',
};

const translations: Record<UILanguage, Translations> = { en, sv };

export function t(lang: UILanguage): Translations {
    return translations[lang] || translations.en;
}
