import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { SessionProvider } from "@/context/session";
import "./index.css";

// HashRouter kvůli GitHub Pages — deep-linky i refresh fungují bez
// server-side fallbacku (důležité na mobilu).
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <SessionProvider>
        <App />
      </SessionProvider>
    </HashRouter>
  </React.StrictMode>
);
