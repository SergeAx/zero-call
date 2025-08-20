type Dict = Record<string, string>;

// Dynamic import function for loading JSON translation files
const loadStrings = async (locale: string): Promise<Dict> => {
  try {
    const module = await import(`./strings.${locale}.json`);
    return module.default;
  } catch (error) {
    console.warn(`Failed to load strings for locale ${locale}, falling back to English`);
    const fallback = await import('./strings.en.json');
    return fallback.default;
  }
};

// Cache for loaded strings
const stringsCache: Record<string, Dict> = {};

// Main strings object with async loading
const STRINGS = {
  // Load strings for a specific locale
  async load(locale: string): Promise<Dict> {
    if (stringsCache[locale]) {
      return stringsCache[locale];
    }
    
    const strings = await loadStrings(locale);
    stringsCache[locale] = strings;
    return strings;
  },
  
  // Get cached strings (synchronous, returns empty object if not loaded)
  get(locale: string): Dict {
    return stringsCache[locale] || {};
  },
  
  // Check if locale is loaded
  isLoaded(locale: string): boolean {
    return !!stringsCache[locale];
  },
  
  // Preload all available locales
  async preloadAll(): Promise<void> {
    const locales = ['en', 'ru-RU', 'zh-CN', 'fa-IR', 'ko-KP', 'fr'];
    await Promise.all(locales.map(locale => this.load(locale)));
  }
};

export default STRINGS;
