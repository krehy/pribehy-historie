/**
 * regions.ts — 3. úroveň mapy pro vybrané státy. U Česka je to rozpad na
 * HISTORICKÉ ZEMĚ Koruny české (Čechy, Morava, Slezsko), ne moderní kraje.
 * Geometrie je v public/cz-lands.json (3 features s {code, name}).
 */

const BASE = import.meta.env.BASE_URL;

export interface RegionCountry {
  a3: string;
  geoUrl: string;
  center: [number, number];
  zoom: number;
  label: string;
}

/** Státy s 3. úrovní (historické země). */
export const REGION_COUNTRIES: Record<string, RegionCountry> = {
  CZE: {
    a3: "CZE",
    geoUrl: `${BASE}cz-lands.json`,
    center: [15.35, 49.8],
    zoom: 46,
    label: "Země Koruny české",
  },
};

export function hasRegions(a3?: string | null): a3 is string {
  return !!a3 && a3 in REGION_COUNTRIES;
}

/** Názvy historických zemí podle kódu. */
export const REGION_NAMES: Record<string, string> = {
  cechy: "Čechy",
  morava: "Morava",
  slezsko: "Slezsko",
};

export function regionName(code: string): string {
  return REGION_NAMES[code] ?? code;
}
