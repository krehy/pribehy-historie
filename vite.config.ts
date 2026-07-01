import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Na GitHub Pages běží web na podadrese /pribehy-historie/.
// Lokální dev zůstává na "/". Přepínáme přes env proměnnou GITHUB_PAGES.
const base = process.env.GITHUB_PAGES ? "/pribehy-historie/" : "/";

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
