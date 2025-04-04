import { Editor, MarkdownFileInfo, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, Menu } from 'obsidian';
import { SynonymerSettings, DEFAULT_SETTINGS } from './settings';
import { SynonymService } from './synonymService';
// Import without .js extension for TypeScript compatibility
import { fullSwedishDictionary } from './swedishSynonyms';

export default class SynonymerPlugin extends Plugin {
	settings!: SynonymerSettings;
	synonymService!: SynonymService;

	async onload() {
		// Add custom styles directly instead of loading external file
		this.addStyles();
		
		await this.loadSettings();
		
		this.synonymService = new SynonymService(this.settings);

		// Add ribbon icon to the left sidebar - using Obsidian's built-in ClipboardType icon
		this.addRibbonIcon('clipboard-list', 'Synonymer', (evt: MouseEvent) => {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (view) {
				const editor = view.editor;
				const selection = editor.getSelection();
				if (selection) {
					this.showSynonyms(selection, editor);
				} else {
					new Notice('Markera ett ord för att hitta synonymer');
				}
			} else {
				new Notice('Den här funktionen stöds endast i Markdown-vy');
			}
		});

		// Add a command to show synonyms for the selected word
		this.addCommand({
			id: 'visa-synonymer',
			name: 'Visa synonymer för markerat ord',
			editorCallback: (editor: Editor, ctx: MarkdownView | MarkdownFileInfo) => {
				if (ctx instanceof MarkdownView) {
					const selection = editor.getSelection();
					if (selection) {
						this.showSynonyms(selection, editor);
					} else {
						new Notice('Markera ett ord för att hitta synonymer');
					}
				} else {
					new Notice('Den här funktionen stöds endast i Markdown-vy');
				}
			}
		});

		// Add editor context menu item (right-click menu)
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu: Menu, editor: Editor) => {
				const selection = editor.getSelection();
				if (selection && selection.trim() !== '') {
					menu.addItem((item) => {
						item.setTitle('Hitta synonymer')
							.setIcon('clipboard-list')
							.onClick(() => {
								this.showSynonyms(selection, editor);
							});
					});
				}
			})
		);

		// Add settings tab
		this.addSettingTab(new SynonymerSettingTab(this.app, this));
		
		// Testing output to help diagnose issues
		console.log("Synonym plugin loaded successfully");
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
			.side-dock-ribbon-action[aria-label="Synonymer"] svg {
			  color: var(--icon-color) !important;
			}
		`;
		document.head.appendChild(styleEl);
	}

	async showSynonyms(word: string, editor: Editor) {
		try {
			new Notice(`Söker efter synonymer för "${word}"...`, 2000);
			
			const synonyms = await this.synonymService.getSynonyms(word);
			
			if (synonyms.length === 0) {
				new Notice(`Inga synonymer hittades för "${word}"`, 3000);
				return;
			}

			const menu = this.createSynonymMenu(synonyms, (synonym) => {
				editor.replaceSelection(synonym);
			});

			 // Fix for iOS: Use safer selection coordinate detection
			 let rect: { left: number; bottom: number; };
        
			 try {
				 // Try to get coordinates from DOM selection if available
				 const selection = window.getSelection();
				 
				 // Only access rangeAt(0) if there are ranges
				 if (selection && selection.rangeCount > 0) {
					 const range = selection.getRangeAt(0);
					 const domRect = range.getBoundingClientRect();
					 rect = { left: domRect.left, bottom: domRect.bottom };
				 } else {
					 // Fallback to editor cursor position
					 throw new Error("No selection ranges available");
				 }
			 } catch (e) {
				 // If anything goes wrong with DOM selection, use editor cursor as fallback
				 console.log("Falling back to editor cursor for menu position");
				 
				 // Safe fallback for all platforms including iOS
				 const pos = editor.getCursor();
				 const editorOffset = { 
					 top: 200, // Default if all else fails
					 left: 100
				 };
				 
				 // Try to get editor offset if possible
				 try {
					 const editorEl = editor.getScrollerElement();
					 const editorRect = editorEl.getBoundingClientRect();
					 editorOffset.top = editorRect.top;
					 editorOffset.left = editorRect.left;
				 } catch (err) {
					 console.log("Couldn't get editor element position", err);
				 }
				 
				 const lineHeight = 20; // Default line height in pixels
				 
				 rect = {
					 left: editorOffset.left,
					 bottom: editorOffset.top + ((pos.line + 1) * lineHeight)
				 };
			 }
	 
			 // Position menu with the safe coordinates
			 menu.showAtPosition({ x: rect.left, y: rect.bottom });
		} catch (error) {
			console.error('Fel vid hämtning av synonymer:', error);
			
			// Better error handling for network errors
			let errorMessage: string;
			if (error instanceof Error) {
				// Check for DNS or network errors
				if (error.message.includes('ERR_NAME_NOT_RESOLVED') || 
					error.message.includes('ERR_CONNECTION_REFUSED') ||
					error.message.includes('NetworkError')) {
					errorMessage = 'Kunde inte ansluta till synonymtjänsten. Kontrollera din internetanslutning.';
				} else {
					errorMessage = error.message;
				}
			} else {
				errorMessage = 'Okänt fel';
			}
			
			new Notice(`Kunde inte hämta synonymer: ${errorMessage}`, 4000);
		}
	}

	createSynonymMenu(synonyms: string[], onSelect: (synonym: string) => void) {
		const menu = new Menu();
		
		// Show a header with count
		menu.addItem((item) => {
			item.setTitle(`Hittade ${synonyms.length} synonymer:`)
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

		containerEl.createEl('h2', {text: 'Inställningar för Synonymer'});

		new Setting(containerEl)
			.setName('Aktivera online-sökning')
			.setDesc('Sök efter synonymer online när de inte hittas i lokal ordlista')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableOnlineLookup)
				.onChange(async (value) => {
					this.plugin.settings.enableOnlineLookup = value;
					await this.plugin.saveSettings();
				}));
			
		new Setting(containerEl)
			.setName('API-källa')
			.setDesc('Välj vilken API-tjänst som ska användas för att hämta synonymer')
			.addDropdown(dropdown => dropdown
				.addOption('svenskaSe', 'Svenska.se')
				.addOption('synonymerSe', 'Synonymer.se (kräver API-nyckel)')
				.setValue(this.plugin.settings.apiSource)
				.onChange(async (value) => {
					this.plugin.settings.apiSource = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('API-nyckel')
			.setDesc('API-nyckel för synonymer.se (krävs endast om du valt Synonymer.se)')
			.addText(text => text
				.setPlaceholder('Ange API-nyckel')
				.setValue(this.plugin.settings.apiKey)
				.onChange(async (value) => {
					this.plugin.settings.apiKey = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Använd lokal ordlista som reserv')
			.setDesc('Om online-sökning misslyckas, använd lokal ordlista som reserv')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.fallbackToLocalDictionary)
				.onChange(async (value) => {
					this.plugin.settings.fallbackToLocalDictionary = value;
					await this.plugin.saveSettings();
					}));
				
		new Setting(containerEl)
			.setName('Alltid försök online-sökning')
			.setDesc('Sök online även om lokala synonymer hittas')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.alwaysTryOnline)
				.onChange(async (value) => {
					this.plugin.settings.alwaysTryOnline = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Max antal synonymer')
			.setDesc('Maximalt antal synonymer att visa')
			.addSlider(slider => slider
				.setLimits(3, 20, 1)
				.setValue(this.plugin.settings.maxSynonyms)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.maxSynonyms = value;
					await this.plugin.saveSettings();
				}));
	}
}
