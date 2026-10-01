import { create } from "zustand";

export type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const applyThemeToDOM = (theme: Theme) => {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
    root.setAttribute("data-theme", "dark");
  } else {
    root.classList.remove("dark");
    root.classList.add("light");
    root.setAttribute("data-theme", "light");
  }
};

export const useThemeStore = create<ThemeState>((set, get) => {
  const getInitialTheme = (): Theme => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("pos_theme") as Theme | null;
    if (saved === "light" || saved === "dark") {
      applyThemeToDOM(saved);
      return saved;
    }
    // No saved preference → always default to light theme
    applyThemeToDOM("light");
    return "light";
  };

  const initialTheme = getInitialTheme();

  return {
    theme: initialTheme,
    setTheme: (theme: Theme) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("pos_theme", theme);
        applyThemeToDOM(theme);
      }
      set({ theme });
    },
    toggleTheme: () => {
      const next = get().theme === "dark" ? "light" : "dark";
      get().setTheme(next);
    },
  };
});
