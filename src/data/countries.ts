/**
 * countries.ts — převodní tabulka mezi numerickým ISO kódem (který používá
 * topojson world-atlas) a ISO A3 kódem (který používají příběhy), plus české
 * názvy států. Countries pro navigaci se odvozují z dat příběhů, tato tabulka
 * slouží jen k propojení geometrie mapy s příběhy.
 */

export interface CountryMeta {
  /** ISO 3166-1 alpha-3 */
  a3: string;
  /** ISO 3166-1 numeric (string, jak ho vrací topojson) */
  numeric: string;
  /** Český název */
  name: string;
}

export const COUNTRIES: CountryMeta[] = [
  { a3: "EGY", numeric: "818", name: "Egypt" },
  { a3: "GRC", numeric: "300", name: "Řecko" },
  { a3: "ITA", numeric: "380", name: "Itálie" },
  { a3: "CZE", numeric: "203", name: "Česko" },
  { a3: "FRA", numeric: "250", name: "Francie" },
  { a3: "GBR", numeric: "826", name: "Spojené království" },
  { a3: "DEU", numeric: "276", name: "Německo" },
  { a3: "CHN", numeric: "156", name: "Čína" },
  { a3: "JPN", numeric: "392", name: "Japonsko" },
  { a3: "IND", numeric: "356", name: "Indie" },
  { a3: "PER", numeric: "604", name: "Peru" },
  { a3: "MEX", numeric: "484", name: "Mexiko" },
  { a3: "TUR", numeric: "792", name: "Turecko" },
  { a3: "IRQ", numeric: "368", name: "Irák" },
  { a3: "RUS", numeric: "643", name: "Rusko" },
  { a3: "USA", numeric: "840", name: "Spojené státy" },
];

const byNumeric = new Map(COUNTRIES.map((c) => [c.numeric, c]));
const byA3 = new Map(COUNTRIES.map((c) => [c.a3, c]));

export function countryByNumeric(numeric: string): CountryMeta | undefined {
  return byNumeric.get(numeric);
}

export function countryByA3(a3: string): CountryMeta | undefined {
  return byA3.get(a3);
}

export function countryName(a3: string): string {
  return byA3.get(a3)?.name ?? a3;
}
