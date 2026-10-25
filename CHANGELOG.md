# Changelog

All notable changes to the Synonym plugin are documented here.


## [1.0.10]

### Fixed

- Fixed local dictionary discovery on Windows when Obsidian returns file paths with backslash separators.
- Fixed the settings dictionary dropdown callback so it does not return a Promise where Obsidian expects a void callback.
- Fixed dictionary discovery to support arbitrary language-coded `.dat` files in the assets folder.
- Fixed the settings dropdown so discovered dictionaries, including locally available files omitted by directory enumeration, are shown reliably.

## [1.0.9]

### Fixed

- Fixed the dictionary language dropdown so locally discovered dictionaries can be selected in settings.
- Added a fallback when the previously selected dictionary is no longer available.

## [1.0.8]

### Fixed

- Fixed local dictionary loading when Obsidian does not provide the plugin directory in its manifest.
- Added release packaging for bundled dictionary assets.

## [1.0.7]

### Fixed

- Fixed release metadata version alignment and settings compatibility warnings.

## [1.0.6]

### Fixed

- Fixed disabled online lookup falling through to an online source when the selected local dictionary had no match.

## [1.0.2]

### Added

- Added a bilingual UI with English and Swedish interface language support.
- Added automatic online source selection based on the interface language.

### Changed

- Changed the default UI language to English.

## [1.0.1]

### Added

- Added support for local dictionary files.
- Added custom synonyms.
- Added multi-language support.

### Changed

- Increased the maximum number of synonyms to 25.
- Improved online lookup reliability.

### Fixed

- Fixed iOS compatibility issues.

## [1.0.0]

### Added

- Initial release.
- Basic synonym lookup.
