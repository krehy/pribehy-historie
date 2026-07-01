/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Světlý pergamen — sdíleno s src/config/mapTheme.ts
        paper: "#f8f1de",
        "paper-light": "#fdfaf0",
        "paper-dark": "#efe4c8",
        country: "#efe4c8",
        "country-hover": "#e6d5a8",
        "country-selected": "#dcc48f",
        stroke: "#b89b6a",
        ink: "#6b5836",
        "ink-soft": "#8a7a55",
        accent: "#c9a24b",
      },
      fontFamily: {
        display: ['"Cinzel"', "serif"],
        serif: ['"EB Garamond"', "Georgia", "serif"],
        script: ['"Cormorant Garamond"', "serif"],
      },
      boxShadow: {
        parchment: "0 10px 40px -12px rgba(107, 88, 54, 0.35)",
        "parchment-lg": "0 24px 70px -20px rgba(107, 88, 54, 0.45)",
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
      },
      animation: {
        "fade-in": "fade-in 0.6s ease-out both",
        "compass-spin": "compass-spin 90s linear infinite",
      },
    },
  },
  plugins: [],
};
