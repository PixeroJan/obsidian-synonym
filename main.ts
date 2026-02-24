import { Editor, MarkdownFileInfo, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, Menu, Modal, App } from 'obsidian';
import { SynonymerSettings, DEFAULT_SETTINGS } from './settings';
import { SynonymService } from './synonymService';
// Import without .js extension for TypeScript compatibility
import { AssetDictionaryLoader } from './assetDictionaryLoader';
import { CustomDictionaryManager } from './customDictionaryManager';
import { t, Translations } from './i18n';

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
		
		contentEl.createEl('h2', { text: this.tr.addSynonymTitle(this.word) });

		const inputEl = contentEl.createEl('input', {
			type: 'text',
			placeholder: this.tr.addSynonymPlaceholder
		});
		inputEl.style.width = '100%';
		inputEl.style.marginBottom = '10px';

		const buttonContainer = contentEl.createDiv();
		buttonContainer.style.display = 'flex';
		buttonContainer.style.justifyContent = 'flex-end';
		buttonContainer.style.gap = '10px';

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

	async onload() {
		this.addStyles();
		await this.loadSettings();
		
		// Initialize custom dictionary manager - pass app instead of vault
		this.customManager = new CustomDictionaryManager(this.app, this.manifest.dir!);
		await this.customManager.load();
		
		// Load assets dictionary - pass app instead of vault
		const assetLoader = new AssetDictionaryLoader(this.app, this.manifest.dir!);
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
					this.showSynonyms(selection, editor);
				} else {
					new Notice(tr.selectWordNotice);
				}
			} else {
				new Notice(tr.markdownOnlyNotice);
			}
		});

		// Add a command to show synonyms for the selected word
		this.addCommand({
			id: 'show-synonyms',
			name: t(this.settings.uiLanguage).commandShowSynonyms,
			editorCallback: (editor: Editor, ctx: MarkdownView | MarkdownFileInfo) => {
				const tr = t(this.settings.uiLanguage);
				if (ctx instanceof MarkdownView) {
					const selection = editor.getSelection();
					if (selection) {
						this.showSynonyms(selection, editor);
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
								this.promptAddSynonym(selection);
							});
					});

					menu.addItem((item) => {
						item.setTitle(tr.contextFindSynonyms)
							.setIcon('search')
							.onClick(() => {
								this.showSynonyms(selection, editor);
							});
					});
				}
			})
		);

		// Add settings tab
		this.addSettingTab(new SynonymerSettingTab(this.app, this));
	}

	getWordAtCursor(editor: Editor): string {
		const cursor = editor.getCursor();
		const line = editor.getLine(cursor.line);
		
		let start = cursor.ch;
		let end = cursor.ch;
		
		// Word characters including Swedish/European characters and hyphens
		const wordChar = /[\w\u00C0-\u00ff\-]/; 

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

	async promptAddSynonym(word: string) {
		const tr = t(this.settings.uiLanguage);
		new AddSynonymModal(this.app, word, tr, async (synonym) => {
			try {
				await this.customManager.addSynonym(word, synonym);
				
				// Reload the synonym service to include the new custom synonym
				const assetLoader = new AssetDictionaryLoader(this.app, this.manifest.dir!);
				const assetDict = await assetLoader.loadDictionary(this.settings.selectedLanguage);
				this.synonymService = new SynonymService(this.settings, assetDict, this.customManager);
				
				new Notice(tr.synonymAddedNotice(synonym, word));
			} catch (error) {
				console.error('Error adding synonym:', error);
				new Notice(tr.couldNotAddSynonym + (error instanceof Error ? error.message : tr.unknownError));
			}
		}).open();
	}

	// Replace loadStyles with addStyles that adds CSS directly
	addStyles() {
		// Add styles directly to document
		const styleEl = document.createElement('style');
		styleEl.id = 'synonym-plugin-styles';
		styleEl.textContent = `
			/* Synonym Plugin Custom Styles */
			.synonymer-menu-item {
			  padding: 8px 12px;
			  cursor: pointer;
			  display: flex;
			  align-items: center;
			  font-size: 14px;
			  width: 100%;
			  text-align: left;
			}
			
			.synonymer-menu-item:hover {
			  background-color: var(--background-modifier-hover);
			  color: var(--text-accent);
			}
			
			.synonymer-notice {
			  font-size: 14px;
			  padding: 8px;
			  background-color: var(--background-primary);
			  border-left: 4px solid var(--text-accent);
			  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
			}
			
			/* Make the toolbar icon black and white */
			.side-dock-ribbon-action[aria-label="Synonym"] svg {
			  color: var(--icon-color) !important;
			}
		`;
		document.head.appendChild(styleEl);
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
				const selection = window.getSelection();
				
				if (selection && selection.rangeCount > 0) {
					const range = selection.getRangeAt(0);
					const domRect = range.getBoundingClientRect();
					rect = { left: domRect.left, bottom: domRect.bottom };
				} else {
					throw new Error("No selection ranges available");
				}
			} catch (e) {
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

	onunload() {
		// Clean up styles when plugin is disabled
		const styleEl = document.getElementById('synonym-plugin-styles');
		if (styleEl) styleEl.remove();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SynonymerSettingTab extends PluginSettingTab {
	plugin: SynonymerPlugin;

	constructor(app: any, plugin: SynonymerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		const tr = t(this.plugin.settings.uiLanguage);

		containerEl.createEl('h2', {text: tr.settingsHeading});

		// UI Language selection
		new Setting(containerEl)
			.setName(tr.uiLanguageName)
			.setDesc(tr.uiLanguageDesc)
			.addDropdown(dropdown => dropdown
				.addOption('en', tr.uiLanguageEnglish)
				.addOption('sv', tr.uiLanguageSwedish)
				.setValue(this.plugin.settings.uiLanguage)
				.onChange(async (value: string) => {
					this.plugin.settings.uiLanguage = value as 'en' | 'sv';
					// Also switch online source to match UI language
					this.plugin.settings.apiSource = value === 'sv' ? 'svenska_se' : 'thesaurus_com';
					await this.plugin.saveSettings();
					// Re-render settings tab with new language
					this.display();
				}));

		// Dictionary language selection
		new Setting(containerEl)
			.setName(tr.dictLanguageName)
			.setDesc(tr.dictLanguageDesc)
			.addDropdown(async (dropdown) => {
				const loader = new AssetDictionaryLoader(this.app, this.plugin.manifest.dir!);
				const languages = await loader.getAvailableLanguages();
				
				// Add language options with better display names
				if (languages.length === 0) {
					dropdown.addOption('', tr.noDictionariesFound);
				} else {
					languages.forEach(lang => {
						// Display language code as-is (e.g., sv_SE, en_US)
						dropdown.addOption(lang, lang);
					});
				}
				
				dropdown.setValue(this.plugin.settings.selectedLanguage)
					.onChange(async (value) => {
						this.plugin.settings.selectedLanguage = value;
						await this.plugin.saveSettings();
						new Notice(tr.reloadPluginNotice);
					});
			});

		new Setting(containerEl)
			.setName(tr.enableOnlineName)
			.setDesc(tr.enableOnlineDesc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableOnlineLookup)
				.onChange(async (value) => {
					this.plugin.settings.enableOnlineLookup = value;
					await this.plugin.saveSettings();
				}));
			
		new Setting(containerEl)
			.setName(tr.onlineSourceName)
			.setDesc(tr.onlineSourceDesc)
			.addDropdown(dropdown => dropdown
				.addOption('thesaurus_com', tr.onlineSourceThesaurus)
				.addOption('svenska_se', tr.onlineSourceSwedish)
				.setValue(this.plugin.settings.apiSource)
				.onChange(async (value) => {
					this.plugin.settings.apiSource = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(tr.apiKeyName)
			.setDesc(tr.apiKeyDesc)
			.addText(text => text
				.setPlaceholder(tr.apiKeyPlaceholder)
				.setValue(this.plugin.settings.apiKey)
				.onChange(async (value) => {
					this.plugin.settings.apiKey = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(tr.maxSynonymsName)
			.setDesc(tr.maxSynonymsDesc)
			.addSlider(slider => slider
				.setLimits(3, 25, 1)
				.setValue(this.plugin.settings.maxSynonyms)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.maxSynonyms = value;
					await this.plugin.saveSettings();
				}));

		// Custom synonyms section removed - see README for file location
	}
}
