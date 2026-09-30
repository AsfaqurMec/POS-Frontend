import { en } from "./en";
import { ar } from "./ar";

export type Language = "en" | "ar";
export type TranslationKey = typeof en;

export const translations = { en, ar };

export function getTranslation(lang: Language) {
  return translations[lang] || translations.en;
}
