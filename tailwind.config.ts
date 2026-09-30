import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#160F0A",
          sidebar: "#19110B",
          header: "#18110B",
          active: "#2B1D16",
          surface: "#F7F3EE",
          gold: "#D4A373",
          border: "#E8DFD7",
          cream: "#FAF6F0",
        },
        coffee: {
          50: "#faf6f0",
          100: "#f3ebe0",
          200: "#e6d5bf",
          300: "#d6bc99",
          400: "#c49e72",
          500: "#ad804e",
          600: "#8f633a",
          700: "#744d2e",
          800: "#5b3c26",
          900: "#442d1e",
          950: "#271910",
        },
        warmgray: {
          50: "#FAF8F5",
          100: "#F3EFEA",
          200: "#E6DFD7",
          300: "#D2C7BC",
          400: "#948375",
          500: "#6B5C50",
          600: "#52443A",
          700: "#3D322A",
          800: "#2B221B",
          900: "#1A1410",
          950: "#100C09",
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "Cairo", "system-ui", "sans-serif"],
        serif: ["Cinzel", "Playfair Display", "serif"],
        script: ["'Alex Brush'", "'Caveat'", "cursive"],
        calligraphy: ["Amiri", "'Traditional Arabic'", "serif"],
        arabic: ["Cairo", "Tajawal", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
