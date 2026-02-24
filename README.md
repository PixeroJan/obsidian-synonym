# Synonym Plugin for Obsidian

Synonyms for Swedish and English words with Multi-language Support. Add your own language files. Find synonyms directly in Obsidian with local dictionary support and online lookup.

## Features

- **Bilingual UI**: Switch between English and Swedish interface (default: English)
- **Local Dictionary**: Fast offline synonym lookup using comprehensive dictionary files
- **Online Lookup**: Complement local results with online sources (Thesaurus.com for English, Synonymer.se for Swedish)
- **Custom Synonyms**: Add your own custom synonyms that take priority over all other sources
- **Multi-language Support**: Automatically detects available language dictionaries in the assets folder
- **Context Menu Integration**: Right-click on any word to find or add synonyms
- **Command Palette**: Quick access via command palette
- **Ribbon Icon**: One-click access from the sidebar

## Installation

1. Copy the following files to your vault's plugin folder:
   
   ```
   .obsidian/plugins/synonym/
   ├── main.js
   ├── manifest.json
   └── assets/
       ├── th_sv_SE_v2.dat
       ├── th_sv_SE_v2.idx
       └── custom-synonyms.json
   ```

2. Enable the plugin in Obsidian's Community Plugins settings

## Usage

### Finding Synonyms

1. **Select a word** in your note
2. **Right-click** and choose "Find synonyms"
3. **Click on a synonym** to replace the selected word

Alternative methods:

- Use the ribbon icon (clipboard icon) in the left sidebar
- Use the command palette: "Show synonyms for selected word"

### Adding Custom Synonyms

#### Method 1: Via Right-Click Menu

1. Select a word
2. Right-click and choose "Add synonym"
3. Enter your custom synonym in the dialog

#### Method 2: Edit the Custom Synonyms File

Edit the `custom-synonyms.json` file directly in the plugin's `assets` folder.

#### Custom Synonyms File Format

The `custom-synonyms.json` file must be located in the plugin's assets folder:

```json
{
  "word": ["synonym-1", "synonym-2", "synonym-3"],
  "example": ["sample", "rolemodel"],
  "fast": ["quick", "speedy", "hasty"]
}
```

**Important formatting rules:**

- All words must be in **lowercase**
- Each word is a key with an array of synonyms
- Synonyms are case-sensitive in the results but matching is case-insensitive

## Settings

### Interface Language

Switch between English and Swedish UI. When changed, the default online source also switches automatically (English → Thesaurus.com, Swedish → Synonymer.se). Default: English.

### Dictionary Language

Choose which local language dictionary to use. The plugin automatically detects available `.dat` files in the assets folder.

### Online Lookup

Enable/disable online synonym lookup to complement local dictionary results.

### Online Source

Choose between Thesaurus.com (English) and Synonymer.se (Swedish). This is set automatically when switching interface language, but can be overridden manually.

### Max Synonyms

Set the maximum number of synonyms to display (3–25, default: 10).

## Source Priority

The plugin searches for synonyms in this order:

1. **Custom synonyms** (assets/custom-synonyms.json) – Highest priority
2. **Assets dictionary** (e.g. th_sv_SE_v2.dat) – Comprehensive local dictionary
3. **Online sources** – When enabled, adds additional synonyms from the web

## Adding More Languages

To add support for additional languages, download thesaurus files from the LibreOffice dictionaries repository:

### Available Language Dictionaries

| Language | Files | Download |
|---|---|---|
| English (US) | `th_en_US_v2.dat` | [en_US thesaurus](https://github.com/LibreOffice/dictionaries/tree/master/en) |
| English (UK) | `th_en_GB_v2.dat` | [en_GB thesaurus](https://github.com/LibreOffice/dictionaries/tree/master/en) |
| Swedish | `th_sv_SE_v2.dat`, `th_sv_SE_v2.idx` | [sv_SE thesaurus](https://github.com/LibreOffice/dictionaries/tree/master/sv_SE) |
| German | `th_de_DE_v2.dat` | [de_DE thesaurus](https://github.com/LibreOffice/dictionaries/tree/master/de) |
| French | `th_fr_FR_v2.dat` | [fr_FR thesaurus](https://github.com/LibreOffice/dictionaries/tree/master/fr_FR) |
| Spanish | `th_es_ES_v2.dat` | [es_ES thesaurus](https://github.com/LibreOffice/dictionaries/tree/master/es) |
| Portuguese (BR) | `th_pt_BR_v2.dat` | [pt_BR thesaurus](https://github.com/LibreOffice/dictionaries/tree/master/pt_BR) |
| Italian | `th_it_IT_v2.dat` | [it_IT thesaurus](https://github.com/LibreOffice/dictionaries/tree/master/it_IT) |

### Installation Steps

1. Download both the `.dat` and `.idx` files for your desired language
2. Place the files in your plugin's `assets` folder:
   ```
   .obsidian/plugins/synonym/assets/
   ```
3. Reload the plugin
4. The new language will appear in the "Dictionary language" dropdown in settings

## Troubleshooting

### No synonyms found

- Check that the assets folder contains the dictionary files
- Verify your internet connection if using online lookup

### Custom synonyms not working

- Ensure the JSON file is valid (use a JSON validator)
- Check that words are in lowercase
- Reload the plugin after editing custom-synonyms.json

### Plugin not loading

- Verify all required files are present
- Check the console (Ctrl+Shift+I) for error messages
- Try disabling and re-enabling the plugin

## Credits

- Dictionary data: Swedish thesaurus (th_sv_SE_v2), Synlex
- Online sources: Thesaurus.com, Synonymer.se
- Icon: Obsidian's built-in clipboard-list icon

## License

MIT

## Version History

### 1.0.2

- Added bilingual UI (English/Swedish) with language switcher in settings
- Interface language now automatically sets the default online source
- Default UI language changed to English

### 1.0.1

- Added support for local dictionary files (th_sv_SE_v2.dat)
- Added custom synonyms feature
- Added multi-language support
- Increased max synonyms to 25
- Improved online lookup reliability
- Fixed iOS compatibility issues

### 1.0.0

- Initial release
- Basic synonym lookup
