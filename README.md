# Swedish Synonyms Plugin for Obsidian

Find synonyms for Swedish words directly in Obsidian with local dictionary support and online lookup.

## Features

- **Local Dictionary**: Fast offline synonym lookup using comprehensive dictionary files
- **Online Lookup**: Fallback to online sources when local dictionary doesn't have results
- **Custom Synonyms**: Add your own custom synonyms that take priority over all other sources
- **Multi-language Support**: Automatically detects available language dictionaries in the assets folder
- **Context Menu Integration**: Right-click on any word to find synonyms
- **Keyboard Shortcut**: Quick access via command palette
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
2. **Right-click** and choose "Hitta synonymer" (Find synonyms)
3. **Click on a synonym** to replace the selected word

Alternative methods:

- Use the ribbon icon (clipboard icon) in the left sidebar
- Use the command palette: "Visa synonymer för markerat ord"

### Adding Custom Synonyms

#### Method 1: Via Right-Click Menu

1. Select a word
2. Right-click and choose "Lägg till synonym" (Add synonym)
3. Enter your custom synonym in the dialog

#### Method 2: Edit the Custom Synonyms File

1. Go to Settings → Swedish Synonyms
2. Click "Öppna anpassad synonymfil" (Open custom synonym file)
3. Edit the JSON file directly

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

**Example:**

```json
{
  "computer": ["pc", "machine", "mac"],
  "book": ["volume", "script", "work"],
  "fast": ["quick", "rapid", "speedy"]
}
```

## Settings

### Language Selection

Choose which language dictionary to use. The plugin automatically detects available `.dat` files in the assets folder.

### Filter Vulgar Language

Enable this to filter out vulgar words from synonym suggestions (default: OFF).

### Online Lookup

Enable/disable online synonym lookup when local dictionary doesn't have results.

### Always Try Online

Search online even if local synonyms are found (combines results from all sources).

### Max Synonyms

Set the maximum number of synonyms to display (3-25, default: 10).

## Source Priority

The plugin searches for synonyms in this order:

1. **Custom synonyms** (assets/custom-synonyms.json) - Highest priority
2. **Assets dictionary** (th_sv_SE_v2.dat) - Comprehensive local dictionary
3. **Online sources** When enabled, it adds synonyms if there are additional ones available online.

## Adding More Languages

To add support for additional languages, download thesaurus files from the LibreOffice dictionaries repository:

### Available Language Dictionaries

**English (US)**

- Files: `th_en_US_v2.dat` 
- Download: [en_US thesaurus](https://github.com/LibreOffice/dictionaries/tree/master/en)

**English (UK)**

- Files: `th_en_GB_v2.dat`
- Download: [en_GB thesaurus](https://github.com/LibreOffice/dictionaries/tree/master/en)
- Note: For online lookup, use Thesaurus.com or Synonyms.net (both work for UK English)

**Swedish**

- Synlex (Included)
- Files: `th_sv_SE_v2.dat` and `th_sv_SE_v2.idx`
- Download: [sv_SE thesaurus](https://github.com/LibreOffice/dictionaries/tree/master/sv_SE)

**German**

- Files: `th_de_DE_v2.dat`
- Download: [de_DE thesaurus](https://github.com/LibreOffice/dictionaries/tree/master/de)

**French**

- Files: `th_fr_FR_v2.dat` 
- Download: [fr_FR thesaurus](https://github.com/LibreOffice/dictionaries/tree/master/fr_FR)

**Spanish**

- Files: `th_es_ES_v2.dat` 
- Download: [es_ES thesaurus](https://github.com/LibreOffice/dictionaries/tree/master/es)

**Portuguese (Brazil)**

- Files: `th_pt_BR_v2.dat` 
- Download: [pt_BR thesaurus](https://github.com/LibreOffice/dictionaries/tree/master/pt_BR)

**Italian**

- Files: `th_it_IT_v2.dat` 
- Download: [it_IT thesaurus](https://github.com/LibreOffice/dictionaries/tree/master/it_IT)

### Installation Steps

1. Click on the link for your desired language

2. Download both the `.dat` and `.idx` files (look for files starting with `th_`)

3. Place the files in your plugin's `assets` folder:
   
   ```
   .obsidian/plugins/synonym/assets/
   ├── th_en_US_v2.dat
   ├── th_en_US_v2.idx
   ├── th_sv_SE_v2.dat
   ├── th_sv_SE_v2.idx
   └── ...
   ```

4. Reload the plugin

5. The new language will appear in the "Dictionary language" dropdown in settings

## Troubleshooting

### No synonyms found

- Check that the assets folder contains the dictionary files
- Verify your internet connection if using online lookup (swedish and english for now)

### Custom synonyms not working

- Ensure the JSON file is valid (use a JSON validator)
- Check that words are in lowercase
- Reload the plugin after editing custom-synonyms.json

### Plugin not loading

- Verify all required files are present
- Check the console (Ctrl+Shift+I) for error messages
- Try disabling and re-enabling the plugin

## Credits

- Dictionary data: Swedish thesaurus (th_sv_SE_v2)
- Online source: synonymer.se
- Icon: Obsidian's built-in clipboard-list icon

## License

MIT

## Version History

### 2.0.0

- Added support for local dictionary files (th_sv_SE_v2.dat)
- Added custom synonyms feature
- Added multi-language support
- Increased max synonyms to 25
- Improved online lookup reliability
- Fixed iOS compatibility issues

### 1.0.0

- Initial release
- Basic synonym lookup
