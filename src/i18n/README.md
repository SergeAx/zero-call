# Internationalization (i18n) System

This directory contains the internationalization files for the Zero Call WebRTC application.

## Structure

- `strings.ts` - Main i18n module with async loading functionality
- `strings.{locale}.json` - Translation files for each supported locale

## Supported Locales

- `en` - English (default)
- `ru-RU` - Russian (Russia)
- `zh-CN` - Chinese (Simplified, China)
- `fa-IR` - Persian (Iran) - RTL support
- `ko-KP` - Korean (North Korea)

## Translation Files

Each locale has its own JSON file following the pattern `strings.{locale}.json`:

- `strings.en.json` - English translations
- `strings.ru-RU.json` - Russian translations
- `strings.zh-CN.json` - Chinese translations
- `strings.fa-IR.json` - Persian translations
- `strings.ko-KP.json` - Korean translations

## Adding New Translations

1. Add the new key-value pair to `strings.en.json` (the source language)
2. Add the corresponding translations to all other locale files
3. The system will automatically load and cache the translations

## Translation Tools Compatibility

This structure is compatible with automatic translation systems like:

- **Weblate** - Can directly work with the JSON files
- **Crowdin** - Supports JSON format
- **Lokalise** - Native JSON support
- **Transifex** - JSON file support

## Usage in Code

```typescript
import { t } from '../scripts/i18n.ts';

// Use translations
const message = t('invitation_link_copied');
```

## Dynamic Loading

The system uses dynamic imports to load translation files only when needed, improving performance and allowing for better code splitting in the final bundle.
