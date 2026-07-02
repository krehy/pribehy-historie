/**
 * placeholder.ts — jeden modul pro SVG data-URI placeholdery.
 *
 * Sdílený SEAM: kodek (`svgDataUri`) a konvence dlaždice s monogramem
 * (`monogramTile` — gradient + písmeno v Cinzelu) žijí na JEDNOM místě.
 * Volající si drží jen svoji PALETU a případnou dekoraci (`overlay`),
 * takže interface je úzký a implementace (kódování + skeleton SVG) je DRY.
 */

/** Kodek: SVG string → `data:` URI (žádné API, čistě lokální). */
export function svgDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export interface MonogramTileOpts {
  /** Rozměry dlaždice v px. */
  w: number;
  h: number;
  /** Text uprostřed (monogram / iniciála / krátký titulek). */
  label: string;
  /** Hlavní dvojice barev přechodu. */
  from: string;
  to: string;
  /** Typ přechodu podkladu (default `radial`). */
  gradient?: "radial" | "linear";
  /** Volitelný horní „glow" stop u radiálního přechodu (0 % → 55 % → 100 %). */
  highlight?: string;
  highlightOpacity?: number;
  /** Parametry radiálního přechodu. */
  radial?: { cx?: string; cy?: string; r?: string };
  /** Vzhled monogramu. */
  fontFamily?: string;
  fontSize?: number;
  textFill?: string;
  textOpacity?: number;
  /** Účaří textu (default ~45 % výšky). */
  textY?: number;
  /** Dekorace vložená mezi podklad a monogram (obrysy, rám, silueta…). */
  overlay?: string;
}

/**
 * Dlaždice s monogramem: gradientní podklad + volitelná dekorace + text
 * v Cinzelu. Vrací hotový `data:` URI. Různá paleta u volajících, stejný kodek.
 */
export function monogramTile(o: MonogramTileOpts): string {
  const {
    w,
    h,
    label,
    from,
    to,
    gradient = "radial",
    highlight,
    highlightOpacity = 0.9,
    radial,
    fontFamily = "Cinzel, Georgia, serif",
    fontSize = Math.round(h * 0.3),
    textFill = "#ffffff",
    textOpacity = 0.9,
    textY = Math.round(h * 0.45),
    overlay = "",
  } = o;

  const grad =
    gradient === "linear"
      ? `<linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>` +
        `<stop offset='0%' stop-color='${from}'/>` +
        `<stop offset='100%' stop-color='${to}'/></linearGradient>`
      : `<radialGradient id='g' cx='${radial?.cx ?? "50%"}' cy='${radial?.cy ?? "40%"}' r='${radial?.r ?? "75%"}'>` +
        (highlight
          ? `<stop offset='0%' stop-color='${highlight}' stop-opacity='${highlightOpacity}'/>` +
            `<stop offset='55%' stop-color='${from}'/>` +
            `<stop offset='100%' stop-color='${to}'/>`
          : `<stop offset='0%' stop-color='${from}'/>` +
            `<stop offset='100%' stop-color='${to}'/>`) +
        `</radialGradient>`;

  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>` +
    `<defs>${grad}</defs>` +
    `<rect width='${w}' height='${h}' fill='url(#g)'/>` +
    overlay +
    `<text x='${w / 2}' y='${textY}' font-family='${fontFamily}' font-size='${fontSize}' ` +
    `fill='${textFill}' text-anchor='middle' opacity='${textOpacity}'>${label}</text>` +
    `</svg>`;

  return svgDataUri(svg);
}
