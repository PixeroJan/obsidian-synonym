import { Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, Menu, Modal, App, DropdownComponent, normalizePath } from 'obsidian';
import { SynonymerSettings, DEFAULT_SETTINGS } from './settings';
import { SynonymService } from './synonymService';
// Import without .js extension for TypeScript compatibility
import { AssetDictionaryLoader } from './assetDictionaryLoader';
import { CustomDictionaryManager } from './customDictionaryManager';
import { t, Translations } from './i18n';

type DeclarativeSettingDefinition = {
	name: string;
	desc?: string;
	control:
		| { type: 'toggle'; key: string }
		| { type: 'dropdown'; key: string; options: Record<string, string> }
		| { type: 'text'; key: string; placeholder?: string }
		| { type: 'slider'; key: string; min: number; max: number; step: number };
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function getPersistedSettings(value: unknown): Partial<SynonymerSettings> {
	if (!isRecord(value)) {
		return {};
	}

	const settings: Partial<SynonymerSettings> = {};
	if (typeof value.enableOnlineLookup === 'boolean') {
		settings.enableOnlineLookup = value.enableOnlineLookup;
	}
	if (typeof value.apiSource === 'string') {
		settings.apiSource = value.apiSource;
	}
	if (typeof value.apiKey === 'string') {
		settings.apiKey = value.apiKey;
	}
	if (typeof value.maxSynonyms === 'number' && Number.isFinite(value.maxSynonyms)) {
		settings.maxSynonyms = value.maxSynonyms;
	}
	if (typeof value.selectedLanguage === 'string') {
		settings.selectedLanguage = value.selectedLanguage;
	}
	if (value.uiLanguage === 'en' || value.uiLanguage === 'sv') {
		settings.uiLanguage = value.uiLanguage;
	}

	return settings;
}

// Add a new modal class for adding synonyms
class AddSynonymModal extends Modal {
	word: string;
	onSubmit: (synonym: string) => void;
	tr: Translations;

	constructor(app: App, word: string, tr: Translations, onSubmit: (synonym: string) => void) {
		super(app);
		this.word = word;
		this.tr = tr;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;

		new Setting(contentEl).setName(this.tr.addSynonymTitle(this.word)).setHeading();

		const inputEl = contentEl.createEl('input', {
			type: 'text',
			placeholder: this.tr.addSynonymPlaceholder,
			cls: 'synonymer-add-input'
		});

		const buttonContainer = contentEl.createDiv({ cls: 'synonymer-modal-buttons' });

		const cancelBtn = buttonContainer.createEl('button', { text: this.tr.cancel });
		cancelBtn.onclick = () => this.close();

		const submitBtn = buttonContainer.createEl('button', { 
			text: this.tr.add,
			cls: 'mod-cta'
		});
		submitBtn.onclick = () => {
			const synonym = inputEl.value.trim();
			if (synonym) {
				this.onSubmit(synonym);
				this.close();
			}
		};

		inputEl.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				const synonym = inputEl.value.trim();
				if (synonym) {
					this.onSubmit(synonym);
					this.close();
				}
			}
		});

		inputEl.focus();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export default class SynonymerPlugin extends Plugin {
	settings!: SynonymerSettings;
	synonymService!: SynonymService;
	customManager!: CustomDictionaryManager;
	availableDictionaryLanguages: string[] = [];
	selectedDictionaryAvailable = false;

	async onload() {
		await this.loadSettings();
		const pluginDir = this.getPluginDir();

		const assetLoader = new AssetDictionaryLoader(this.app, pluginDir);
		const availableLanguages = await assetLoader.getAvailableLanguages();
		this.availableDictionaryLanguages = [...availableLanguages];
		const selectedLanguageAvailable = await assetLoader.hasDictionary(this.settings.selectedLanguage);
		this.selectedDictionaryAvailable = availableLanguages.includes(this.settings.selectedLanguage) || selectedLanguageAvailable;
		if (availableLanguages.length > 0 && !availableLanguages.includes(this.settings.selectedLanguage) && !selectedLanguageAvailable) {
			this.settings.selectedLanguage = availableLanguages[0];
			await this.saveSettings();
		}

		// Initialize custom dictionary manager - pass app instead of vault
		this.customManager = new CustomDictionaryManager(this.app, pluginDir, this.settings.selectedLanguage);
		await this.customManager.load();
		
		// Load assets dictionary - pass app instead of vault
		const assetDict = await assetLoader.loadDictionary(this.settings.selectedLanguage);
		
		this.synonymService = new SynonymService(this.settings, assetDict, this.customManager);

		// Add ribbon icon to the left sidebar - using Obsidian's built-in ClipboardType icon
		this.addRibbonIcon('clipboard-list', t(this.settings.uiLanguage).ribbonTooltip, (evt: MouseEvent) => {
			const tr = t(this.settings.uiLanguage);
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (view) {
				const editor = view.editor;
				const selection = editor.getSelection();
				if (selection) {
					void this.showSynonyms(selection, editor);
				} else {
					new Notice(tr.selectWordNotice);
				}
			} else {
				new Notice(tr.markdownOnlyNotice);
			}
		});

		// Add a command to show synonyms for the selected word
		this.addCommand({
			id: 'show',
			name: t(this.settings.uiLanguage).commandShowSynonyms,
			editorCallback: (editor: Editor, ctx) => {
				const tr = t(this.settings.uiLanguage);
				if (ctx instanceof MarkdownView) {
					const selection = editor.getSelection();
					if (selection) {
						void this.showSynonyms(selection, editor);
					} else {
						new Notice(tr.selectWordNotice);
					}
				} else {
					new Notice(tr.markdownOnlyNotice);
				}
			}
		});

		// Add editor context menu item (right-click menu)
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu: Menu, editor: Editor) => {
				const tr = t(this.settings.uiLanguage);
				let selection = editor.getSelection();

				// If no selection, try to get word under cursor
				if (!selection || selection.trim() === '') {
					selection = this.getWordAtCursor(editor);
				}

				if (selection && selection.trim() !== '') {
					// Add option to add custom synonym
					menu.addItem((item) => {
						item.setTitle(tr.contextAddSynonym)
							.setIcon('pencil')
							.onClick(() => {
								void this.promptAddSynonym(selection);
							});
					});

					menu.addItem((item) => {
						item.setTitle(tr.contextFindSynonyms)
							.setIcon('search')
							.onClick(() => {
								void this.showSynonyms(selection, editor);
							});
					});
				}
			})
		);

		// Add settings tab
		this.addSettingTab(new SynonymerSettingTab(this.app, this));
	}

	getPluginDir(): string {
		const configDir = normalizePath(this.app.vault.configDir).replace(/\/+$/, '');
		const canonicalDir = `${configDir}/plugins/${this.manifest.id}`;
		const manifestDir = this.manifest.dir ? normalizePath(this.manifest.dir).replace(/\/+$/, '') : '';

		if (manifestDir === canonicalDir) {
			return manifestDir;
		}

		if (manifestDir === `plugins/${this.manifest.id}`) {
			return `${configDir}/${manifestDir}`;
		}

		return normalizePath(canonicalDir);
	}

	getWordAtCursor(editor: Editor): string {
		const cursor = editor.getCursor();
		const line = editor.getLine(cursor.line);
		
		let start = cursor.ch;
		let end = cursor.ch;
		
		// Word characters including Swedish/European characters and hyphens
		const wordChar = /[\w\u00C0-\u00ff-]/;

		// Walk backwards
		while (start > 0 && wordChar.test(line.charAt(start - 1))) {
			start--;
		}
		
		// Walk forwards
		while (end < line.length && wordChar.test(line.charAt(end))) {
			end++;
		}
		
		return line.slice(start, end);
	}

	promptAddSynonym(word: string) {
		const tr = t(this.settings.uiLanguage);
		new AddSynonymModal(this.app, word, tr, (synonym) => {
			void (async () => {
				try {
					await this.customManager.addSynonym(word, synonym);

					// Reload the synonym service to include the new custom synonym
					const assetLoader = new AssetDictionaryLoader(this.app, this.getPluginDir());
					const assetDict = await assetLoader.loadDictionary(this.settings.selectedLanguage);
					this.synonymService = new SynonymService(this.settings, assetDict, this.customManager);

					new Notice(tr.synonymAddedNotice(synonym, word));
				} catch (error) {
					console.error('Error adding synonym:', error);
					new Notice(tr.couldNotAddSynonym + (error instanceof Error ? error.message : tr.unknownError));
				}
			})();
		}).open();
	}


	async showSynonyms(word: string, editor: Editor) {
		const tr = t(this.settings.uiLanguage);
		try {
			new Notice(tr.searchingNotice(word), 2000);
			
			const synonyms = await this.synonymService.getSynonyms(word);
			
			if (synonyms.length === 0) {
				new Notice(tr.noSynonymsNotice(word), 3000);
				return;
			}

			const menu = this.createSynonymMenu(synonyms, (synonym) => {
				editor.replaceSelection(synonym);
			});

			// Fix for iOS: Use safer selection coordinate detection
			let rect: { left: number; bottom: number; };

			try {
				const selection = activeWindow.getSelection();

				if (selection && selection.rangeCount > 0) {
					const range = selection.getRangeAt(0);
					const domRect = range.getBoundingClientRect();
					rect = { left: domRect.left, bottom: domRect.bottom };
				} else {
					throw new Error("No selection ranges available");
				}
			} catch {
				// Safe fallback without using getScrollerElement
				const pos = editor.getCursor();
				const lineHeight = 20;
				
				rect = {
					left: 100,
					bottom: 200 + ((pos.line + 1) * lineHeight)
				};
			}

			menu.showAtPosition({ x: rect.left, y: rect.bottom });
		} catch (error) {
			console.error('Error fetching synonyms:', error);
			
			// Better error handling for network errors
			let errorMessage: string;
			if (error instanceof Error) {
				// Check for DNS or network errors
				if (error.message.includes('ERR_NAME_NOT_RESOLVED') || 
					error.message.includes('ERR_CONNECTION_REFUSED') ||
					error.message.includes('NetworkError')) {
					errorMessage = tr.connectionError;
				} else {
					errorMessage = error.message;
				}
			} else {
				errorMessage = tr.unknownError;
			}
			
			new Notice(`${tr.couldNotFetchSynonyms}${errorMessage}`, 4000);
		}
	}

	createSynonymMenu(synonyms: string[], onSelect: (synonym: string) => void) {
		const menu = new Menu();
		
		const tr = t(this.settings.uiLanguage);
		// Show a header with count
		menu.addItem((item) => {
			item.setTitle(tr.foundSynonymsHeader(synonyms.length))
				.setDisabled(true);
		});
		
		menu.addSeparator();
		
		if (synonyms.length > 10) {
			// Create submenu for better organization when many synonyms
			const submenuSize = Math.ceil(synonyms.length / 2);
			const firstHalf = synonyms.slice(0, submenuSize);
			const secondHalf = synonyms.slice(submenuSize);
			
			firstHalf.forEach((synonym) => {
				menu.addItem((item) => {
					// Fix: Only set title and onClick once to avoid errors
					item.setTitle(synonym)
						.onClick(() => onSelect(synonym));
				});
			});
			
			if (secondHalf.length > 0) {
				menu.addSeparator();
				
				secondHalf.forEach((synonym) => {
					menu.addItem((item) => {
						// Fix: Only set title and onClick once to avoid errors
						item.setTitle(synonym)
							.onClick(() => onSelect(synonym));
					});
				});
			}
		} else {
			// Simpler menu for fewer synonyms
			synonyms.forEach((synonym) => {
				menu.addItem((item) => {
					item.setTitle(synonym)
						.onClick(() => onSelect(synonym));
				});
			});
		}
		
		return menu;
	}

	async loadSettings() {
		const savedSettings = (await this.loadData()) as unknown;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, getPersistedSettings(savedSettings));
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SynonymerSettingTab extends PluginSettingTab {
	plugin: SynonymerPlugin;

	constructor(app: App, plugin: SynonymerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	private async saveSettingsAndRefresh(): Promise<void> {
		await this.plugin.saveSettings();
		this.display();
	}

	private async saveSettingsAndNotify(tr: Translations): Promise<void> {
		await this.plugin.saveSettings();
		new Notice(tr.reloadPluginNotice);
	}

	getControlValue(key: string): unknown {
		return (this.plugin.settings as unknown as Record<string, unknown>)[key];
	}

	getSettingDefinitions(): DeclarativeSettingDefinition[] {
		const tr = t(this.plugin.settings.uiLanguage);
		const languages = [...this.plugin.availableDictionaryLanguages];
		if (!languages.includes(this.plugin.settings.selectedLanguage) && this.plugin.selectedDictionaryAvailable) {
			languages.push(this.plugin.settings.selectedLanguage);
		}

		return [
			{
				name: tr.uiLanguageName,
				desc: tr.uiLanguageDesc,
				control: {
					type: 'dropdown',
					key: 'uiLanguage',
					options: {
						en: tr.uiLanguageEnglish,
						sv: tr.uiLanguageSwedish
					}
				}
			},
			{
				name: tr.dictLanguageName,
				desc: tr.dictLanguageDesc,
				control: {
					type: 'dropdown',
					key: 'selectedLanguage',
					options: languages.reduce<Record<string, string>>((options, language) => {
						options[language] = language;
						return options;
					}, {})
				}
			},
			{
				name: tr.enableOnlineName,
				desc: tr.enableOnlineDesc,
				control: {
					type: 'toggle',
					key: 'enableOnlineLookup'
				}
			},
			{
				name: tr.onlineSourceName,
				desc: tr.onlineSourceDesc,
				control: {
					type: 'dropdown',
					key: 'apiSource',
					options: {
						thesaurus_com: tr.onlineSourceThesaurus,
						svenska_se: tr.onlineSourceSwedish
					}
				}
			},
			{
				name: tr.apiKeyName,
				desc: tr.apiKeyDesc,
				control: {
					type: 'text',
					key: 'apiKey',
					placeholder: tr.apiKeyPlaceholder
				}
			},
			{
				name: tr.maxSynonymsName,
				desc: tr.maxSynonymsDesc,
				control: {
					type: 'slider',
					key: 'maxSynonyms',
					min: 3,
					max: 25,
					step: 1
				}
			}
		];
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		switch (key) {
			case 'uiLanguage':
				if (value !== 'en' && value !== 'sv') {
					throw new Error(`Invalid UI language: ${String(value)}`);
				}
				this.plugin.settings.uiLanguage = value;
				this.plugin.settings.apiSource = value === 'sv' ? 'svenska_se' : 'thesaurus_com';
				break;
			case 'selectedLanguage':
				if (typeof value !== 'string' || value.trim() === '') {
					throw new Error(`Invalid dictionary language: ${String(value)}`);
				}
				this.plugin.settings.selectedLanguage = value;
				break;
			case 'enableOnlineLookup':
				if (typeof value !== 'boolean') {
					throw new Error(`Invalid online lookup setting: ${String(value)}`);
				}
				this.plugin.settings.enableOnlineLookup = value;
				break;
			case 'apiSource':
				if (value !== 'thesaurus_com' && value !== 'svenska_se') {
					throw new Error(`Invalid online source: ${String(value)}`);
				}
				this.plugin.settings.apiSource = value;
				break;
			case 'apiKey':
				if (typeof value !== 'string') {
					throw new Error(`Invalid API key: ${String(value)}`);
				}
				this.plugin.settings.apiKey = value;
				break;
			case 'maxSynonyms':
				if (typeof value !== 'number' || !Number.isFinite(value) || value < 3 || value > 25) {
					throw new Error(`Invalid maximum synonym count: ${String(value)}`);
				}
				this.plugin.settings.maxSynonyms = value;
				break;
			default:
				throw new Error(`Unsupported setting: ${key}`);
		}

		await this.plugin.saveSettings();
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		const tr = t(this.plugin.settings.uiLanguage);

		new Setting(containerEl).setName(tr.settingsHeading).setHeading();

		// UI Language selection
		new Setting(containerEl)
			.setName(tr.uiLanguageName)
			.setDesc(tr.uiLanguageDesc)
			.addDropdown(dropdown => dropdown
				.addOption('en', tr.uiLanguageEnglish)
				.addOption('sv', tr.uiLanguageSwedish)
				.setValue(this.plugin.settings.uiLanguage)
				.onChange((value: string): void => {
					this.plugin.settings.uiLanguage = value as 'en' | 'sv';
					// Also switch online source to match UI language
					this.plugin.settings.apiSource = value === 'sv' ? 'svenska_se' : 'thesaurus_com';
					void this.saveSettingsAndRefresh();
				}));

		// Dictionary language selection
		const languages = [...this.plugin.availableDictionaryLanguages];
		if (!languages.includes(this.plugin.settings.selectedLanguage) && this.plugin.selectedDictionaryAvailable) {
			languages.push(this.plugin.settings.selectedLanguage);
		}

		new Setting(containerEl)
			.setName(tr.dictLanguageName)
			.setDesc(tr.dictLanguageDesc)
			.addDropdown((dropdown) => {
				if (languages.length === 0) {
					dropdown.addOption('', tr.noDictionariesFound).setValue('');
					return;
				}

				languages.forEach((language) => dropdown.addOption(language, language));
				const selectedLanguage = languages.includes(this.plugin.settings.selectedLanguage)
					? this.plugin.settings.selectedLanguage
					: languages[0];

				if (selectedLanguage !== this.plugin.settings.selectedLanguage) {
					this.plugin.settings.selectedLanguage = selectedLanguage;
					void this.plugin.saveSettings();
				}

				dropdown.setValue(selectedLanguage).onChange((value): void => {
					this.plugin.settings.selectedLanguage = value;
					void this.saveSettingsAndNotify(tr);
				});
			});

		new Setting(containerEl)
			.setName(tr.enableOnlineName)
			.setDesc(tr.enableOnlineDesc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableOnlineLookup)
				.onChange((value): void => {
					this.plugin.settings.enableOnlineLookup = value;
					void this.plugin.saveSettings();
				}));
			
		new Setting(containerEl)
			.setName(tr.onlineSourceName)
			.setDesc(tr.onlineSourceDesc)
			.addDropdown(dropdown => dropdown
				.addOption('thesaurus_com', tr.onlineSourceThesaurus)
				.addOption('svenska_se', tr.onlineSourceSwedish)
				.setValue(this.plugin.settings.apiSource)
				.onChange((value): void => {
					this.plugin.settings.apiSource = value;
					void this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(tr.apiKeyName)
			.setDesc(tr.apiKeyDesc)
			.addText(text => text
				.setPlaceholder(tr.apiKeyPlaceholder)
				.setValue(this.plugin.settings.apiKey)
				.onChange((value): void => {
					this.plugin.settings.apiKey = value;
					void this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(tr.maxSynonymsName)
			.setDesc(tr.maxSynonymsDesc)
			.addSlider(slider => slider
				.setLimits(3, 25, 1)
				.setValue(this.plugin.settings.maxSynonyms)
				.setDynamicTooltip()
				.onChange((value): void => {
					this.plugin.settings.maxSynonyms = value;
					void this.plugin.saveSettings();
				}));

		// Custom synonyms section removed - see README for file location
	}
}
