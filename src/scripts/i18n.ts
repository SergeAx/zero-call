// Lightweight client-side i18n helper for a static app
// - Detects locale from localStorage or browser
// - Applies translations to [data-i18n] elements
// - Supports attribute targets via data-i18n-attr (e.g., placeholder)
// - Persists choice and updates <html lang dir>

import STRINGS from "../i18n/strings.ts";

type Locale = "en" | "ru-RU" | "zh-CN" | "fa-IR" | "ko-KP" | "fr";

export type SupportedLocale = {
  code: Locale;
  label: string; // Native name for dropdown
  dir: "ltr" | "rtl";
  matchers: string[]; // accepted navigator.* matches
};

const SUPPORTED: SupportedLocale[] = [
  {
    code: "en",
    label: "English",
    dir: "ltr",
    matchers: ["en", "en-US", "en-GB", "en-*"],
  },
  {
    code: "fr",
    label: "Français",
    dir: "ltr",
    matchers: ["fr", "fr-FR", "fr-*"],
  },
  {
    code: "ru-RU",
    label: "Русский (Россия)",
    dir: "ltr",
    matchers: ["ru", "ru-RU", "ru-*"],
  },
  {
    code: "zh-CN",
    label: "简体中文（中国大陆）",
    dir: "ltr",
    matchers: ["zh", "zh-CN", "zh-Hans", "zh-*"],
  },
  {
    code: "fa-IR",
    label: "فارسی (ایران)",
    dir: "rtl",
    matchers: ["fa", "fa-IR", "fa-*", "prs", "pes"],
  },
  {
    code: "ko-KP",
    label: "조선말 (조선민주주의인민공화국)",
    dir: "ltr",
    matchers: ["ko", "ko-KP", "ko-*"],
  },
];

const STORAGE_KEY = "zero-call.lang";

let currentLocale: Locale = "en";
let currentDir: "ltr" | "rtl" = "ltr";

const subscribers = new Set<() => void>();

function normalize(code: string): string {
  return code.toLowerCase();
}

function findBestLocaleFromNavigator(): Locale {
  const nav = (navigator.languages && navigator.languages.length
    ? navigator.languages
    : [navigator.language]
  ).filter(Boolean) as string[];

  // Try exact
  for (const raw of nav) {
    const lc = normalize(raw);
    const exact = SUPPORTED.find((l) => l.matchers.map(normalize).includes(lc));
    if (exact) return exact.code;
  }

  // Try prefix (e.g., ru -> ru-RU)
  for (const raw of nav) {
    const base = normalize(raw).split("-")[0];
    const pref = SUPPORTED.find((l) => l.matchers.some((m) => normalize(m).startsWith(base)));
    if (pref) return pref.code;
  }

  return "en";
}

function applyHtmlLangDir(locale: Locale) {
  const meta = SUPPORTED.find((l) => l.code === locale)!;
  document.documentElement.setAttribute("lang", locale);
  document.documentElement.setAttribute("dir", meta.dir);
  currentDir = meta.dir;
}

export function getSupportedLocales(): SupportedLocale[] {
  return SUPPORTED.slice();
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: string): string {
  const dict = STRINGS.get(currentLocale);
  if (dict && key in dict) return dict[key];
  const en = STRINGS.get('en');
  return (en && en[key]) || key;
}

export function applyTranslations(root: ParentNode = document): void {
  // Text content translations
  root.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    const attr = el.getAttribute("data-i18n-attr");
    const val = t(key);
    if (attr) {
      el.setAttribute(attr, val);
    } else {
      // Prefer textContent, but avoid blowing away existing children structures if any
      if (el.children.length === 0) el.textContent = val;
      else el.setAttribute("data-i18n-text", val); // for complex nodes; consumer can read if needed
    }
  });
}

export function onLocaleChange(cb: () => void) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

function notify() {
  subscribers.forEach((cb) => {
    try { cb(); } catch {}
  });
}

export async function setLocale(locale: Locale): Promise<void> {
  if (!(SUPPORTED.some((l) => l.code === locale))) return;
  
  // Load the strings for this locale if not already loaded
  await STRINGS.load(locale);
  
  currentLocale = locale;
  localStorage.setItem(STORAGE_KEY, locale);
  applyHtmlLangDir(locale);
  applyTranslations();
  notify();
}

async function initLocale(): Promise<void> {
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
  const initial = stored || findBestLocaleFromNavigator();
  
  // Load the initial locale strings
  await STRINGS.load(initial);
  
  currentLocale = initial;
  applyHtmlLangDir(initial);
}

// Initialize function to be called by the app
export async function initializeI18n(): Promise<void> {
  await initLocale();
  // Preload all locales for better UX
  await STRINGS.preloadAll();
}

export default {
  t,
  setLocale,
  getLocale,
  getSupportedLocales,
  onLocaleChange,
  applyTranslations,
  initializeI18n,
};
