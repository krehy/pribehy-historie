/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Papír (krémová slonovina) — sdíleno s src/config/mapTheme.ts
        paper: "#f8f1de",
        "paper-light": "#fdfaf0",
        "paper-dark": "#efe4c8",
        country: "#efe4c8",
        "country-hover": "#e6d5a8",
        "country-selected": "#dcc48f",
        stroke: "#b89b6a",
        // Text — tmavý uhlově-hnědý inkoust (hravý, vysoký kontrast jako na IG)
        ink: "#2f2a24",
        "ink-soft": "#6f6558",
        // Hořčičková žlutá — hlavní akcent značky (badge, CTA, timeline)
        sun: "#f4c430",
        "sun-light": "#ffd94a",
        "sun-deep": "#e0a91e",
        // Tlumené zlato — jemnější sekundární akcent (mapa, linky)
        accent: "#c9a24b",
        // Hravé doplňkové barvy (konfety, doodly)
        coral: "#ef7d57",
        teal: "#4bae8c",
        grape: "#7b6cc4",
      },
      fontFamily: {
        // Kulatý, hravý „marker" font pro nadpisy a značku
        display: ['"Baloo 2"', "system-ui", "sans-serif"],
        // Čitelný kulatý sans pro běžný text
        sans: ['"Nunito"', "system-ui", "sans-serif"],
        // Elegantní serif — jen pro noblesní mapu a ozdobné akcenty
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        parchment: "0 10px 30px -12px rgba(47, 42, 36, 0.25)",
        "parchment-lg": "0 24px 60px -20px rgba(47, 42, 36, 0.32)",
        sticker: "0 6px 0 0 rgba(47, 42, 36, 0.12)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "compass-spin": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        wiggle: {
          "0%,100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.6s ease-out both",
        "compass-spin": "compass-spin 90s linear infinite",
        wiggle: "wiggle 2.5s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
