/**
 * history.ts — odvození dat pro navigaci z pole příběhů.
 * Countries i časová osa vznikají z mock dat, nic není natvrdo.
 */

import { STORIES, type Story } from "@/data/stories";
import { countryName } from "@/data/countries";
import { continentOfA3, type ContinentId } from "@/data/continents";

/** Příběh je veřejný (status chybí = považujeme za published). */
export function isPublished(s: Story): boolean {
  return (s.status ?? "published") === "published";
}

/**
 * Příběhy viditelné pro ČTENÁŘE (jen published). Reader-facing funkce (mapa, osa,
 * grid) berou tohle jako default; Studio/Admin si předávají plné `STORIES`.
 */
export const PUBLISHED_STORIES: Story[] = STORIES.filter(isPublished);

/** Příběhy jednoho autora (podle jména) — pro Studio dashboard. */
export function storiesByAuthor(name: string, stories: Story[] = STORIES): Story[] {
  return stories.filter((s) => s.author?.name === name);
}

/** Formátování roku: záporné = př. n. l. */
export function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} př. n. l.`;
  return `${year} n. l.`;
}

/** Kompaktní rozsah, např. „461–429 př. n. l." nebo „1348" */
export function formatRange(from: number, to: number): string {
  if (from === to) return formatYear(from);
  // Stejná éra (obě záporná / obě kladná) → sjednotíme příponu
  if (from < 0 && to < 0) return `${Math.abs(from)}–${Math.abs(to)} př. n. l.`;
  if (from > 0 && to > 0) return `${from}–${to} n. l.`;
  return `${formatYear(from)} – ${formatYear(to)}`;
}

export interface CountryWithStories {
  a3: string;
  name: string;
  count: number;
  yearFrom: number;
  yearTo: number;
}

/** Státy, které mají příběhy — odvozeno z dat. */
export function countriesWithStories(stories: Story[] = PUBLISHED_STORIES): CountryWithStories[] {
  const map = new Map<string, CountryWithStories>();
  for (const s of stories) {
    const existing = map.get(s.countryCode);
    if (existing) {
      existing.count += 1;
      existing.yearFrom = Math.min(existing.yearFrom, s.yearFrom);
      existing.yearTo = Math.max(existing.yearTo, s.yearTo);
    } else {
      map.set(s.countryCode, {
        a3: s.countryCode,
        name: countryName(s.countryCode),
        count: 1,
        yearFrom: s.yearFrom,
        yearTo: s.yearTo,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "cs"));
}

/** Množina A3 kódů států s příběhy — rychlý lookup pro mapu. */
export function countryCodesWithStories(stories: Story[] = PUBLISHED_STORIES): Set<string> {
  return new Set(stories.map((s) => s.countryCode));
}

/** Světadíly, které obsahují alespoň jeden příběh (počet zemí a příběhů). */
export interface ContinentWithStories {
  id: ContinentId;
  countryCount: number;
  storyCount: number;
}

export function continentsWithStories(
  stories: Story[] = PUBLISHED_STORIES
): Set<ContinentId> {
  const set = new Set<ContinentId>();
  for (const s of stories) {
    const c = continentOfA3(s.countryCode);
    if (c) set.add(c);
  }
  return set;
}

/** Statistika příběhů pro jeden světadíl. */
export function statsForContinent(
  continent: ContinentId,
  stories: Story[] = PUBLISHED_STORIES
): ContinentWithStories {
  const countries = new Set<string>();
  let storyCount = 0;
  for (const s of stories) {
    if (continentOfA3(s.countryCode) === continent) {
      countries.add(s.countryCode);
      storyCount += 1;
    }
  }
  return { id: continent, countryCount: countries.size, storyCount };
}

/** Země s příběhy patřící do daného světadílu. */
export function countriesInContinent(
  continent: ContinentId,
  stories: Story[] = PUBLISHED_STORIES
): CountryWithStories[] {
  return countriesWithStories(stories).filter(
    (c) => continentOfA3(c.a3) === continent
  );
}

/** Příběhy jednoho státu, seřazené chronologicky. */
export function storiesForCountry(a3: string, stories: Story[] = PUBLISHED_STORIES): Story[] {
  return stories
    .filter((s) => s.countryCode === a3)
    .sort((a, b) => a.yearFrom - b.yearFrom);
}

/** Příběhy jednoho kraje (ISO 3166-2), seřazené chronologicky. */
export function storiesForRegion(code: string, stories: Story[] = PUBLISHED_STORIES): Story[] {
  return stories
    .filter((s) => s.region === code)
    .sort((a, b) => a.yearFrom - b.yearFrom);
}

/** Množina kódů krajů, které mají alespoň jeden příběh. */
export function regionCodesWithStories(stories: Story[] = PUBLISHED_STORIES): Set<string> {
  const set = new Set<string>();
  for (const s of stories) if (s.region) set.add(s.region);
  return set;
}

export interface TimelineSegment {
  story: Story;
  /** Pozice středu na ose 0–1 */
  position: number;
  /** Šířka rozsahu na ose 0–1 */
  width: number;
}

/**
 * Časová osa pro stát: vrací rozsah (min–max) a jednotlivé body/segmenty
 * s normalizovanou pozicí, aby šla vykreslit lineárně.
 */
export function timelineForCountry(a3: string, stories: Story[] = PUBLISHED_STORIES) {
  const items = storiesForCountry(a3, stories);
  if (items.length === 0) {
    return { min: 0, max: 0, span: 0, segments: [] as TimelineSegment[] };
  }
  const min = Math.min(...items.map((s) => s.yearFrom));
  const max = Math.max(...items.map((s) => s.yearTo));
  // Doplníme okraje, ať body nelepí na kraj osy
  const pad = Math.max(20, Math.round((max - min) * 0.08));
  const lo = min - pad;
  const hi = max + pad;
  const span = hi - lo || 1;

  const segments: TimelineSegment[] = items.map((story) => {
    const mid = (story.yearFrom + story.yearTo) / 2;
    return {
      story,
      position: (mid - lo) / span,
      width: (story.yearTo - story.yearFrom) / span,
    };
  });

  return { min: lo, max: hi, span, segments };
}
