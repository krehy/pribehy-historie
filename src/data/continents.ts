/**
 * continents.ts — metadata světadílů pro dvojúrovňovou navigaci mapy.
 * Uživatel nejdřív vybere světadíl (mapa se přiblíží a „rozdělí" na státy),
 * pak vybere stát.
 */

import { CONTINENT_BY_NUMERIC, type ContinentId } from "./continentByNumeric";
import { countryByA3 } from "./countries";

export type { ContinentId };

export interface ContinentMeta {
  id: ContinentId;
  /** Český název */
  name: string;
  /** Střed pro přiblížení projekce [lon, lat] */
  center: [number, number];
  /** Cílový zoom po výběru světadílu */
  zoom: number;
}

export const CONTINENTS: ContinentMeta[] = [
  { id: "europe", name: "Evropa", center: [15, 52], zoom: 3.6 },
  { id: "asia", name: "Asie", center: [92, 42], zoom: 2.1 },
  { id: "africa", name: "Afrika", center: [20, 3], zoom: 2.1 },
  { id: "north-america", name: "Severní Amerika", center: [-98, 44], zoom: 2.1 },
  { id: "south-america", name: "Jižní Amerika", center: [-60, -22], zoom: 2.5 },
  { id: "oceania", name: "Oceánie", center: [140, -25], zoom: 2.6 },
];

const byId = new Map(CONTINENTS.map((c) => [c.id, c]));

export function continentMeta(id: ContinentId): ContinentMeta | undefined {
  return byId.get(id);
}

export function continentName(id: ContinentId): string {
  return byId.get(id)?.name ?? id;
}

/** Světadíl podle numerického ISO kódu (přímo z topojson geo.id). */
export function continentOfNumeric(numeric: string): ContinentId | undefined {
  return CONTINENT_BY_NUMERIC[numeric];
}

/** Světadíl podle ISO A3 (přes převod na numeric). */
export function continentOfA3(a3: string): ContinentId | undefined {
  const numeric = countryByA3(a3)?.numeric;
  return numeric ? CONTINENT_BY_NUMERIC[numeric] : undefined;
}
