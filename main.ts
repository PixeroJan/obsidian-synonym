import { Editor, MarkdownFileInfo, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, Menu, Modal, App } from 'obsidian';
import { SynonymerSettings, DEFAULT_SETTINGS } from './settings';
import { SynonymService } from './synonymService';
// Import without .js extension for TypeScript compatibility
import { AssetDictionaryLoader } from './assetDictionaryLoader';
import { CustomDictionaryManager } from './customDictionaryManager';

// Add a new modal class for adding synonyms
class AddSynonymModal extends Modal {
	word: string;
	onSubmit: (synonym: string) => void;

	constructor(app: App, word: string, onSubmit: (synonym: string) => void) {
		super(app);
		this.word = word;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		
		contentEl.createEl('h2', { text: `Add synonym for "${this.word}"` });

		const inputEl = contentEl.createEl('input', {
			type: 'text',
			placeholder: 'Enter synonym...'
		});
		inputEl.style.width = '100%';
		inputEl.style.marginBottom = '10px';

		const buttonContainer = contentEl.createDiv();
		buttonContainer.style.display = 'flex';
		buttonContainer.style.justifyContent = 'flex-end';
		buttonContainer.style.gap = '10px';

		const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelBtn.onclick = () => this.close();

		const submitBtn = buttonContainer.createEl('button', { 
			text: 'Add',
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
		this.addRibbonIcon('clipboard-list', 'Synonym', (evt: MouseEvent) => {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (view) {
				const editor = view.editor;
				const selection = editor.getSelection();
				if (selection) {
					this.showSynonyms(selection, editor);
				} else {
					new Notice('Select a word to find synonyms');
				}
			} else {
				new Notice('This feature only works in Markdown view');
			}
		});

		// Add a command to show synonyms for the selected word
		this.addCommand({
			id: 'show-synonyms',
			name: 'Show synonyms for selected word',
			editorCallback: (editor: Editor, ctx: MarkdownView | MarkdownFileInfo) => {
				if (ctx instanceof MarkdownView) {
					const selection = editor.getSelection();
					if (selection) {
						this.showSynonyms(selection, editor);
					} else {
						new Notice('Select a word to find synonyms');
					}
				} else {
					new Notice('This feature only works in Markdown view');
				}
			}
		});

		// Add editor context menu item (right-click menu)
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu: Menu, editor: Editor) => {
				let selection = editor.getSelection();

				// If no selection, try to get word under cursor
				if (!selection || selection.trim() === '') {
					selection = this.getWordAtCursor(editor);
				}

				if (selection && selection.trim() !== '') {
					// Add option to add custom synonym
					menu.addItem((item) => {
						item.setTitle('Lägg till synonym')
							.setIcon('pencil') // Changed icon to verify visibility
							.onClick(() => {
								this.promptAddSynonym(selection);
							});
					});

					menu.addItem((item) => {
						item.setTitle('Hitta synonymer')
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
		new AddSynonymModal(this.app, word, async (synonym) => {
			try {
				await this.customManager.addSynonym(word, synonym);
				
				// Reload the synonym service to include the new custom synonym
				const assetLoader = new AssetDictionaryLoader(this.app, this.manifest.dir!);
				const assetDict = await assetLoader.loadDictionary(this.settings.selectedLanguage);
				this.synonymService = new SynonymService(this.settings, assetDict, this.customManager);
				
				new Notice(`Added "${synonym}" as a synonym for "${word}"`);
			} catch (error) {
				console.error('Error adding synonym:', error);
				new Notice('Could not add synonym: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
		try {
			new Notice(`Searching for synonyms for "${word}"...`, 2000);
			
			const synonyms = await this.synonymService.getSynonyms(word);
			
			if (synonyms.length === 0) {
				new Notice(`No synonyms found for "${word}"`, 3000);
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
					errorMessage = 'Could not connect to the synonym service. Check your internet connection.';
				} else {
					errorMessage = error.message;
				}
			} else {
				errorMessage = 'Unknown error';
			}
			
			new Notice(`Could not fetch synonyms: ${errorMessage}`, 4000);
		}
	}

	createSynonymMenu(synonyms: string[], onSelect: (synonym: string) => void) {
		const menu = new Menu();
		
		// Show a header with count
		menu.addItem((item) => {
			item.setTitle(`Found ${synonyms.length} synonyms:`)
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

		containerEl.createEl('h2', {text: 'Synonym Settings'});

		// Language selection
		new Setting(containerEl)
			.setName('Dictionary language')
			.setDesc('Select the language for the local synonym dictionary')
			.addDropdown(async (dropdown) => {
				const loader = new AssetDictionaryLoader(this.app, this.plugin.manifest.dir!);
				const languages = await loader.getAvailableLanguages();
				
				// Add language options with better display names
				if (languages.length === 0) {
					dropdown.addOption('', 'No dictionaries found');
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
						new Notice('Reload the plugin to use the new language');
					});
			});

		// Removed vulgar language filter

		new Setting(containerEl)
			.setName('Enable online lookup')
			.setDesc('Search for additional synonyms from online sources to complement local dictionary')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableOnlineLookup)
				.onChange(async (value) => {
					this.plugin.settings.enableOnlineLookup = value;
					await this.plugin.saveSettings();
				}));
			
		new Setting(containerEl)
			.setName('Online source')
			.setDesc('Select which online service to use for additional synonyms')
			.addDropdown(dropdown => dropdown
				.addOption('thesaurus_com', 'Thesaurus.com (English)')
				.addOption('svenska_se', 'Synonymer (Swedish)')
				.setValue(this.plugin.settings.apiSource)
				.onChange(async (value) => {
					this.plugin.settings.apiSource = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('API key')
			.setDesc('API key for online service (if required by the selected source)')
			.addText(text => text
				.setPlaceholder('Enter API key')
				.setValue(this.plugin.settings.apiKey)
				.onChange(async (value) => {
					this.plugin.settings.apiKey = value;
					await this.plugin.saveSettings();
				}));

		// Removed 'Use local dictionary as fallback' - local dictionary is always the primary source
		
		new Setting(containerEl)
			.setName('Maximum synonyms')
			.setDesc('Maximum number of synonyms to display')
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
