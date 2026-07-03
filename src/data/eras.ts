/**
 * eras.ts — pojmenovaná historická období pro pás pod časovou osou.
 * Souvislý řetězec (from navazuje na to). Zatím česká periodizace; později lze
 * přidat období pro další země (klíčované countryCode).
 */
export interface Era {
  name: string;
  /** Rok počátku (záporné = př. n. l.). */
  from: number;
  /** Rok konce. */
  to: number;
  /** Podkladový nádech proužku (rgba, tmavé téma osy). */
  tint: string;
}

export const CZ_ERAS: Era[] = [
  { name: "Raný středověk", from: 600, to: 1197, tint: "rgba(122,92,58,.38)" },
  { name: "Vrcholný a pozdní středověk", from: 1197, to: 1526, tint: "rgba(158,116,50,.38)" },
  { name: "Habsburská monarchie", from: 1526, to: 1804, tint: "rgba(120,120,68,.34)" },
  { name: "Rakouské císařství · obrození", from: 1804, to: 1918, tint: "rgba(92,116,92,.34)" },
  { name: "Československo", from: 1918, to: 1992, tint: "rgba(88,104,128,.38)" },
  { name: "Česká republika", from: 1993, to: 2025, tint: "rgba(128,82,94,.38)" },
];

/**
 * Široká SVĚTOVÁ periodizace — posouvač času pro přehled napříč zeměmi (stránka
 * „Všechny příběhy") i jako fallback pro stát bez vlastní periodizace. Aby přehled
 * vypadal 1:1 jako na mapě, pás zón je vždy přítomný.
 */
export const WORLD_ERAS: Era[] = [
  { name: "Pravěk", from: -100000, to: -3001, tint: "rgba(107,86,54,.38)" },
  { name: "Starověk", from: -3000, to: 499, tint: "rgba(158,116,50,.38)" },
  { name: "Středověk", from: 500, to: 1499, tint: "rgba(122,92,58,.38)" },
  { name: "Novověk", from: 1500, to: 1799, tint: "rgba(92,116,92,.34)" },
  { name: "Dlouhé 19. století", from: 1800, to: 1913, tint: "rgba(88,104,128,.38)" },
  { name: "Moderní dějiny", from: 1914, to: 2025, tint: "rgba(128,82,94,.38)" },
];

/** Období pro daný stát (zatím jen Česko). */
export function erasForCountry(a3: string | null): Era[] | undefined {
  return a3 === "CZE" ? CZ_ERAS : undefined;
}

/** Období, do kterého spadá rok. */
export function eraForYear(year: number, eras: Era[]): Era | undefined {
  return eras.find((e) => year >= e.from && year <= e.to);
}

/** Název období, do kterého spadá rok. */
export function eraNameForYear(year: number, eras: Era[]): string | undefined {
  return eraForYear(year, eras)?.name;
}
