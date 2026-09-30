import { create } from "zustand";
import { Language, getTranslation } from "@/i18n";

interface LangState {
  lang: Language;
  dir: "ltr" | "rtl";
  t: ReturnType<typeof getTranslation>;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
}

export const useLangStore = create<LangState>((set, get) => {
  const initialLang: Language =
    typeof window !== "undefined" && localStorage.getItem("pos_lang") === "ar" ? "ar" : "en";
  const initialDir = initialLang === "ar" ? "rtl" : "ltr";

  if (typeof window !== "undefined") {
    document.documentElement.setAttribute("dir", initialDir);
    document.documentElement.setAttribute("lang", initialLang);
  }

  return {
    lang: initialLang,
    dir: initialDir,
    t: getTranslation(initialLang),
    setLang: (lang: Language) => {
      const dir = lang === "ar" ? "rtl" : "ltr";
      if (typeof window !== "undefined") {
        localStorage.setItem("pos_lang", lang);
        document.documentElement.setAttribute("dir", dir);
        document.documentElement.setAttribute("lang", lang);
      }
      set({ lang, dir, t: getTranslation(lang) });
    },
    toggleLang: () => {
      const nextLang: Language = get().lang === "en" ? "ar" : "en";
      get().setLang(nextLang);
    },
  };
});