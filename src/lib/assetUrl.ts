/**
 * assetUrl — jediný seam pro veřejnou (public/) cestu k assetu.
 *
 * Sjednocuje dřív roztroušené lokální helpery (`src`, `url`, `img`, `${BASE}${…}`)
 * do jedné funkce se stejnou sémantikou napříč celou appkou:
 *   - undefined vstup → undefined výstup (nic k prefixování),
 *   - absolutní http(s):// URL → beze změny (externí zdroj),
 *   - jinak → BASE + path (Vite base: dev "/", GitHub Pages "/pribehy-historie/").
 */
const BASE = import.meta.env.BASE_URL;

export function assetUrl(path?: string): string | undefined {
  if (path == null) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return `${BASE}${path}`;
}
