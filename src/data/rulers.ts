/**
 * rulers.ts — MOCK historické postavy (panovníci / hlavy státu) jako SAMOSTATNÁ
 * entita `Ruler`. Postava žije nezávisle na příbězích a používá se na víc místech:
 * parta „té doby" v časové ose, filtrace, kinematický úvod příběhu a PROFIL
 * postavy (/postava/:slug) — profesionální stránka s životní osou.
 *
 * Vazba na dobu je přes ROZSAH LET vlády (reignFrom/reignTo) i přes narození/úmrtí.
 * Obraz s fallbackem: reálný vyklíčovaný cutout (cutoutReady) → jinak reálná fotka
 * (portrait) → jinak monogram. Viz figureImage().
 */

import { CZ_FIGURES } from "./czCharacters";

/** Událost na životní ose postavy. */
export interface FigureEvent {
  /** Rok (záporné = př. n. l.). */
  year: number;
  title: string;
  text?: string;
}

/** Doména postavy — čím se proslavila (kurátovaný číselník). Viz DESIGN.md → Postavy. */
export type Category =
  | "ruler" | "statesman" | "military" | "diplomat"
  | "religious"
  | "scientist" | "inventor" | "physician" | "explorer"
  | "artist" | "writer" | "composer" | "architect" | "performer"
  | "activist" | "entrepreneur" | "commoner";

/** Důležitost — řídí hustotu osy (major vidět vždy, zbytek při přiblížení). */
export type Prominence = "major" | "notable" | "minor";

export const CATEGORY_LABEL: Record<Category, string> = {
  ruler: "panovník", statesman: "státník", military: "vojevůdce", diplomat: "diplomat",
  religious: "církevní", scientist: "vědec", inventor: "vynálezce", physician: "lékař",
  explorer: "cestovatel", artist: "umělec", writer: "spisovatel", composer: "skladatel",
  architect: "architekt", performer: "umělec (scéna)", activist: "aktivista",
  entrepreneur: "podnikatel", commoner: "obyčejný člověk",
};

/**
 * Character — historická (nebo fiktivní) postava. Zobecnění původního `Ruler`:
 * dvě nezávislé osy `real` (fakt/fikce) + `category` (doména); floruit `activeFrom/To`
 * ukotvuje postavu na ose a v epoše (u panovníka = roky vlády).
 */
export interface Character {
  slug: string;
  name: string;
  /** ISO alpha-3 (kvůli filtraci po zemi). */
  countryCode: string;
  region?: "cechy" | "morava" | "slezsko";

  // — Taxonomie (dvě nezávislé osy) —
  /** Reálná osoba vs fikce (drží fakt/fikce integritu). */
  real: boolean;
  /** Primární doména — ikona / track na ose / filtr. */
  category: Category;
  /** Další domény pro polyhistory (Leonardo: artist + inventor + scientist). */
  alsoCategories?: Category[];
  /** Důležitost pro ředění hustoty osy. */
  prominence: Prominence;
  /** Fikce patřící jednomu příběhu (neleze do globálního rejstříku). */
  ownerStory?: string;

  // — Čas —
  /** Floruit — období významnosti; ukotvuje osu i epochu. U panovníka = roky vlády. */
  activeFrom: number;
  activeTo: number;
  bornYear?: number;
  /** Přesné datum narození (textově, např. „14. května 1316"). */
  bornDate?: string;
  birthPlace?: string;
  diedYear?: number;
  diedDate?: string;
  deathPlace?: string;

  // — Panovník (jen category === "ruler") —
  reignFrom?: number;
  reignTo?: number;
  /** Titul / úřad — „Kníže", „Král", „Císař", „Prezident". */
  title?: string;
  /** Rod / dynastie / strana. */
  house?: string;

  // — Obraz (fallback) —
  /** Vyklíčovaná chroma podobizna (greenscreen). Může být placeholder. */
  character: string;
  /** true = `character` je REÁLNÝ vyklíčovaný cutout (ne sdílený placeholder). */
  cutoutReady?: boolean;
  /** Reálná (public-domain) fotka/obraz — fallback profilu, když není cutout. */
  portrait?: string;

  // — Obsah —
  bio?: string;
  /** Známé hlášky postavy — bublina na hover / po přesunu do gridu. */
  quotes?: string[];
  /** Zajímavosti / fakta o postavě — úvodní představení na začátku příběhu. */
  facts?: string[];
  /** Pokročilá životní osa — klíčové události života postavy. */
  timeline?: FigureEvent[];
}

/** Zpětně kompatibilní alias — postava = Character. */
export type Ruler = Character;

/** Vstupní tvar literálů panovníků; taxonomie/floruit se doplní `normalizeRuler`. */
type RulerSeed = Omit<Character, "real" | "category" | "prominence" | "activeFrom" | "activeTo"> &
  Partial<Pick<Character, "real" | "category" | "prominence" | "activeFrom" | "activeTo">> & {
    reignFrom: number;
    reignTo: number;
  };

/** Doplní panovníkovi taxonomii a floruit z roků vlády. */
function normalizeRuler(s: RulerSeed): Character {
  return {
    ...s,
    real: s.real ?? true,
    category: s.category ?? "ruler",
    prominence: s.prominence ?? "major",
    activeFrom: s.activeFrom ?? s.reignFrom,
    activeTo: s.activeTo ?? s.reignTo,
  };
}

// PLACEHOLDER cutout — dokud nedodáme reálné vyklíčované podobizny do public/stories/.
const PH = "stories/cze-charles-iv-green.jpg";

const RULER_SEEDS: RulerSeed[] = [
  // — Raný středověk (600–1197) —
  { slug: "borivoj-i", name: "Bořivoj I.", countryCode: "CZE", reignFrom: 872, reignTo: 889, title: "Kníže", house: "Přemyslovci", bornYear: 852, diedYear: 889, character: PH, bio: "První historicky doložený přemyslovský kníže, pokřtěný Metodějem." },
  { slug: "svaty-vaclav", name: "Svatý Václav", countryCode: "CZE", reignFrom: 921, reignTo: 935, title: "Kníže", house: "Přemyslovci", bornYear: 907, diedYear: 935, character: PH, bio: "Světec a zemský patron, zavražděný bratrem Boleslavem.", quotes: ["Nechci prolévat krev křesťanskou.", "Kdo přijde s pokojem, přijmi ho jako bratra."] },
  { slug: "vratislav-ii", name: "Vratislav II.", countryCode: "CZE", reignFrom: 1061, reignTo: 1092, title: "Král", house: "Přemyslovci", bornYear: 1035, diedYear: 1092, character: PH, bio: "První český král (korunován 1085), byť titul nebyl dědičný." },

  // — Vrcholný a pozdní středověk (1197–1526) —
  { slug: "premysl-otakar-ii", name: "Přemysl Otakar II.", countryCode: "CZE", reignFrom: 1253, reignTo: 1278, title: "Král", house: "Přemyslovci", bornYear: 1233, diedYear: 1278, character: PH, bio: "„Král železný a zlatý“, vládce od Krkonoš k Jadranu.", quotes: ["Mé království sahá od hor až k moři.", "Železo i zlato slouží koruně."] },
  {
    slug: "karel-iv",
    name: "Karel IV.",
    countryCode: "CZE",
    reignFrom: 1346,
    reignTo: 1378,
    title: "Císař",
    house: "Lucemburkové",
    bornYear: 1316,
    bornDate: "14. května 1316",
    birthPlace: "Praha",
    diedYear: 1378,
    diedDate: "29. listopadu 1378",
    deathPlace: "Praha",
    character: PH,
    cutoutReady: true,
    portrait: "stories/cze-charles-iv.jpg",
    bio: "Otec vlasti, český král a římský císař; založil univerzitu i Karlštejn. Nejvýznamnější panovník českých dějin — za jeho vlády se Praha stala politickým i kulturním srdcem Evropy.",
    quotes: ["Když jsem přišel do Čech, nenalezl jsem ani otce, ani matky, ani bratra.", "Vzdělání je poklad, který nikdo nevezme.", "Praha bude srdcem říše."],
    facts: ["Roku 1348 založil Pražskou univerzitu — první severně od Alp.", "Mluvil pěti jazyky a sepsal vlastní životopis Vita Caroli.", "Termín stavby Karlova mostu si prý nechal vypočítat podle hvězd.", "Za jeho vlády se Praha stala hlavním městem Svaté říše římské."],
    timeline: [
      { year: 1316, title: "Narození v Praze", text: "Přišel na svět jako Václav, syn Jana Lucemburského a Elišky Přemyslovny." },
      { year: 1323, title: "Výchova v Paříži", text: "Na francouzském dvoře přijal při biřmování jméno Karel." },
      { year: 1346, title: "Českým králem", text: "Po otcově smrti v bitvě u Kresčaku usedl na český trůn." },
      { year: 1348, title: "Univerzita a Nové Město", text: "Založil Pražskou univerzitu a Nové Město pražské; začal stavět Karlštejn." },
      { year: 1355, title: "Císařská korunovace", text: "V Římě korunován římským císařem — vrchol jeho moci." },
      { year: 1357, title: "Základní kámen Karlova mostu", text: "Podle pověsti 9. 7. 1357 v 5:31 ráno v magický palindromický okamžik." },
      { year: 1378, title: "Úmrtí v Praze", text: "Zemřel jako „Otec vlasti“; pohřben v katedrále sv. Víta." },
    ],
  },
  { slug: "vaclav-iv", name: "Václav IV.", countryCode: "CZE", reignFrom: 1378, reignTo: 1419, title: "Král", house: "Lucemburkové", bornYear: 1361, diedYear: 1419, character: PH, bio: "Syn Karla IV.; za jeho vlády vystoupil Jan Hus." },
  { slug: "jiri-z-podebrad", name: "Jiří z Poděbrad", countryCode: "CZE", reignFrom: 1458, reignTo: 1471, title: "Král", house: "z Poděbrad", bornYear: 1420, diedYear: 1471, character: PH, bio: "„Husitský král“, jediný panovník bez královského rodového původu." },

  // — Habsburská monarchie (1526–1804) —
  { slug: "ferdinand-i", name: "Ferdinand I.", countryCode: "CZE", reignFrom: 1526, reignTo: 1564, title: "Král", house: "Habsburkové", bornYear: 1503, diedYear: 1564, character: PH, bio: "Počátek habsburské vlády v českých zemích." },
  { slug: "rudolf-ii", name: "Rudolf II.", countryCode: "CZE", reignFrom: 1576, reignTo: 1611, title: "Císař", house: "Habsburkové", bornYear: 1552, diedYear: 1612, character: PH, bio: "Mecenáš umění a vědy; Praha byla sídlem císařského dvora." },
  { slug: "marie-terezie", name: "Marie Terezie", countryCode: "CZE", reignFrom: 1740, reignTo: 1780, title: "Královna", house: "Habsburkové", bornYear: 1717, diedYear: 1780, character: PH, bio: "Reformátorka; zavedla povinnou školní docházku.", quotes: ["Raději prostřední mír než skvělé vítězství.", "Do školy půjdou všechny děti."] },
  { slug: "josef-ii", name: "Josef II.", countryCode: "CZE", reignFrom: 1780, reignTo: 1790, title: "Císař", house: "Habsbursko-lotrinský", bornYear: 1741, diedYear: 1790, character: PH, bio: "Osvícenský reformátor; zrušil nevolnictví a vydal toleranční patent.", quotes: ["Vše pro lid, nic skrze lid.", "Nevolnictví končí — člověk není majetek."] },

  // — Rakouské císařství · obrození (1804–1918) —
  { slug: "frantisek-josef-i", name: "František Josef I.", countryCode: "CZE", reignFrom: 1848, reignTo: 1916, title: "Císař", house: "Habsbursko-lotrinský", bornYear: 1830, diedYear: 1916, character: PH, bio: "Vládl 68 let; symbol soumraku monarchie.", quotes: ["Mně nezůstalo nic ušetřeno.", "Bylo to překrásné, těšilo mě to."] },

  // — Československo (1918–1992) —
  { slug: "tg-masaryk", name: "T. G. Masaryk", countryCode: "CZE", reignFrom: 1918, reignTo: 1935, title: "Prezident", house: "Hrad", bornYear: 1850, diedYear: 1937, character: PH, bio: "Zakladatel a první prezident Československa.", quotes: ["Nebát se a nekrást.", "Demokracie je diskuse.", "Ježíš, ne Caesar."] },
  { slug: "edvard-benes", name: "Edvard Beneš", countryCode: "CZE", reignFrom: 1935, reignTo: 1948, title: "Prezident", house: "Hrad", bornYear: 1884, diedYear: 1948, character: PH, bio: "Prezident Mnichova, exilu i únorového převratu." },
  { slug: "gustav-husak", name: "Gustáv Husák", countryCode: "CZE", reignFrom: 1975, reignTo: 1989, title: "Prezident", house: "KSČ", bornYear: 1913, diedYear: 1991, character: PH, bio: "Prezident normalizace až do sametové revoluce." },

  // — Česká republika (1993–2025) —
  { slug: "vaclav-havel", name: "Václav Havel", countryCode: "CZE", reignFrom: 1993, reignTo: 2003, title: "Prezident", house: "Hrad", bornYear: 1936, diedYear: 2011, character: PH, bio: "Disident, dramatik, první prezident samostatné ČR.", quotes: ["Pravda a láska musí zvítězit nad lží a nenávistí.", "Naděje není přesvědčení, že něco dobře dopadne."] },
  { slug: "vaclav-klaus", name: "Václav Klaus", countryCode: "CZE", reignFrom: 2003, reignTo: 2013, title: "Prezident", house: "ODS", bornYear: 1941, character: PH, bio: "Ekonom transformace a euroskeptik.", quotes: ["Neznám nic takového jako špinavé peníze.", "Trh bez přívlastků."] },
  { slug: "milos-zeman", name: "Miloš Zeman", countryCode: "CZE", reignFrom: 2013, reignTo: 2023, title: "Prezident", house: "SPOZ", bornYear: 1944, character: PH, bio: "První přímo zvolený prezident ČR." },
  { slug: "petr-pavel", name: "Petr Pavel", countryCode: "CZE", reignFrom: 2023, reignTo: 2025, title: "Prezident", house: "nezávislý", bornYear: 1961, character: PH, bio: "Generál a bývalý předseda vojenského výboru NATO." },
];

/** Panovníci jako plné `Character` (doplněná taxonomie a floruit z roků vlády). */
export const CZ_RULERS: Character[] = RULER_SEEDS.map(normalizeRuler);

/** Globální pool postav dané země — panovníci + ostatní osobnosti (vynálezci, umělci…). */
const BY_COUNTRY: Record<string, Character[]> = {
  CZE: [...CZ_RULERS, ...CZ_FIGURES],
};

/** Postavy dané země (všechny kategorie). */
export function charactersForCountry(a3: string | null | undefined): Character[] {
  return a3 ? BY_COUNTRY[a3] ?? [] : [];
}

/** Obraz postavy s fallbackem: reálný cutout → reálná fotka → placeholder cutout. */
export function figureImage(r: Ruler): { src: string; chroma: boolean } {
  if (r.cutoutReady && r.character) return { src: r.character, chroma: true };
  if (r.portrait) return { src: r.portrait, chroma: false };
  return { src: r.character, chroma: true }; // placeholder greenscreen (než dodáme reálný obraz)
}

/** „1316–1378", „* 1941" (žijící), příp. jen floruit. */
export function lifespanLabel(r: Character): string {
  if (r.bornYear && r.diedYear) return `${r.bornYear}–${r.diedYear}`;
  if (r.bornYear) return `* ${r.bornYear}`;
  return `${r.activeFrom}–${r.activeTo === 2025 ? "dnes" : r.activeTo}`;
}

/** Panovníci daného státu (zatím jen Česko). */
export function rulersForCountry(a3: string | null | undefined): Character[] {
  return charactersForCountry(a3).filter((c) => c.category === "ruler");
}

/** Postavy (všech kategorií), jejichž floruit se překrývá s [from, to]. Seřazeno dle nástupu. */
export function charactersForRange(from: number, to: number, a3: string | null | undefined): Character[] {
  return charactersForCountry(a3)
    .filter((c) => c.activeFrom <= to && c.activeTo >= from)
    .sort((a, b) => a.activeFrom - b.activeFrom);
}

/** Postavy spadající do epochy (překryv floruitu s obdobím). */
export function charactersForEra(era: { from: number; to: number }, a3: string | null | undefined): Character[] {
  return charactersForRange(era.from, era.to, a3);
}

/** Panovníci, jejichž vláda se překrývá s rozsahem let [from, to] — „parta té doby" na ose. */
export function rulersForRange(from: number, to: number, a3: string | null | undefined): Character[] {
  return charactersForRange(from, to, a3).filter((c) => c.category === "ruler");
}

/** Panovníci vládnoucí v daném roce. */
export function rulersForYear(year: number, a3: string | null | undefined): Character[] {
  return rulersForRange(year, year, a3);
}

/** Postava podle slugu (napříč zeměmi) — pro profilovou stránku / odkazy. */
export function rulerBySlug(slug: string): Character | undefined {
  for (const list of Object.values(BY_COUNTRY)) {
    const found = list.find((r) => r.slug === slug);
    if (found) return found;
  }
  return undefined;
}

/** Postava podle slugu (alias `rulerBySlug`). */
export const characterBySlug = rulerBySlug;
