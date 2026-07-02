/**
 * creator.ts — LOKÁLNÍ mock model autorského creatoru (článek → příběh).
 * ŽÁDNÁ vazba na backend ani na sdílený `Ruler`/`rulers.ts` — prototyp běží čistě
 * na lokálním stavu, aby se neprala s migrací Ruler→Character (viz DESIGN.md).
 * Až se model sjednotí, tyhle typy se nahradí reálným `Character` + `Story`.
 */
import { STORIES, type Story } from "@/data/stories";
import { rulerBySlug, figureImage, CZ_RULERS } from "@/data/rulers";
import { assetUrl } from "@/lib/assetUrl";
import { monogramTile } from "@/lib/placeholder";

// — Osy postavy (viz DESIGN.md) —
/** Co postava JE (globální). */
export type CharKind = "ruler" | "figure" | "fictional";
/** Co postava v TOMHLE příběhu DĚLÁ (dramatická role). */
export type DramaRole = "protagonist" | "narrator" | "antagonist" | "supporting";

/**
 * Životní cyklus karty postavy:
 *  pending  → nastavení editovatelné, vidíš Schválit/Zahodit
 *  accepted → editovatelné, vidíš Vygenerovat tvář / Napárovat; edit identity → zpět na pending
 *  locked   → identita zamčená (tvář/párování hotové); mění se jen role; Odemknout vrací na accepted
 *  dismissed→ zahozeno, lze Vrátit
 */
export type CharStatus = "pending" | "accepted" | "locked" | "dismissed";

export interface DraftChar {
  id: string;
  name: string;
  kind: CharKind;
  role: DramaRole;
  bio: string;
  /** Návrh promptu na vzhled (fáze 1). */
  look: string;
  /** Vygenerovaná podobizna (data URI mock) NEBO médium napárovaného panovníka. */
  faceUrl?: string;
  /** Slug napárovaného panovníka (jen kind === "ruler"). */
  rulerSlug?: string;
  /** ai = návrh z článku · existing = napárováno na globální profil · manual = přidal autor. */
  source: "ai" | "existing" | "manual";
  status: CharStatus;
}

export type Mood = "dawn" | "mystic" | "day" | "night";
export type BeatKind = "scene" | "flip" | "quiz" | "scrub";

export interface DraftBeat {
  id: string;
  kind: BeatKind;
  mood: Mood;
  /** KOSTRA (fáze Beaty): jednovětný účel — co se v beatu stane. */
  outline: string;
  /** PLNÁ PRÓZA (fáze Texty): scene/scrub = text; flip = přední strana; quiz = otázka. */
  text: string;
  /** Zadní strana flipu / vysvětlení kvízu (fáze Texty). */
  extra?: string;
  /** Která postava v beatu vystupuje (id DraftChar). */
  charId?: string;
  /** Vygenerované pozadí scény (data URI mock); jen scene/scrub. */
  bgUrl?: string;
}

export interface AudioState {
  music: boolean;
  voiceover: boolean;
  sfx: boolean;
}

// ————————————————————————————————————————————————————————————————
// Placeholder obrázky (data URI) — žádné externí assety, ať nic nebliká.
// ————————————————————————————————————————————————————————————————

const MOOD_HEX: Record<Mood, [string, string]> = {
  dawn: ["#fce7cf", "#f0a868"],
  mystic: ["#e8dcf7", "#9a78d0"],
  day: ["#e9f2fb", "#8fb8de"],
  night: ["#3a4066", "#12142a"],
};

const KIND_HEX: Record<CharKind, [string, string]> = {
  ruler: ["#f7ecc9", "#c9a23c"],
  figure: ["#e6edf5", "#5a7ea6"],
  fictional: ["#f6e4ea", "#c07a94"],
};

export const MOOD_DOT: Record<Mood, string> = {
  dawn: "#f0a868",
  mystic: "#9a78d0",
  day: "#8fb8de",
  night: "#3a4066",
};

export const MOOD_LABEL: Record<Mood, string> = {
  dawn: "úsvit",
  mystic: "mystično",
  day: "den",
  night: "noc",
};

export const KIND_LABEL: Record<CharKind, string> = {
  ruler: "panovník",
  figure: "historická",
  fictional: "fiktivní",
};

export const ROLE_LABEL: Record<DramaRole, string> = {
  protagonist: "hlavní hrdina",
  narrator: "vypravěč (POV)",
  antagonist: "antagonista",
  supporting: "vedlejší",
};

/** Portrét 3:4 s monogramem — tón podle kind. */
export function facePlaceholder(name: string, kind: CharKind): string {
  const [a, b] = KIND_HEX[kind];
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  return monogramTile({
    w: 300,
    h: 400,
    label: initial,
    from: a,
    to: b,
    highlight: "#ffffff",
    radial: { cy: "38%" },
    fontSize: 72,
    textY: 172,
    overlay:
      `<circle cx='150' cy='150' r='62' fill='#ffffff' opacity='0.35'/>` +
      `<rect x='95' y='250' width='110' height='120' rx='55' fill='#ffffff' opacity='0.3'/>`,
  });
}

/** Pozadí scény 16:9 — gradient + jemné obrysy podle nálady. */
export function bgPlaceholder(mood: Mood, label: string): string {
  const [a, b] = MOOD_HEX[mood];
  const dark = mood === "night";
  const ink = dark ? "#ffffff" : "#3b3b3b";
  return monogramTile({
    w: 640,
    h: 360,
    label,
    from: a,
    to: b,
    gradient: "linear",
    fontSize: 22,
    textFill: ink,
    textOpacity: 0.55,
    textY: 190,
    overlay:
      `<path d='M0 280 L120 220 L240 270 L360 200 L480 250 L640 190 L640 360 L0 360 Z' fill='${ink}' opacity='0.14'/>` +
      `<path d='M0 320 L160 280 L320 315 L480 275 L640 310 L640 360 L0 360 Z' fill='${ink}' opacity='0.2'/>` +
      `<circle cx='520' cy='90' r='34' fill='#ffffff' opacity='${dark ? 0.5 : 0.7}'/>`,
  });
}

// ————————————————————————————————————————————————————————————————
// Mock „AI" — extrakce postav a storyboard z článku.
// ————————————————————————————————————————————————————————————————

export function findStory(id: string | undefined): Story | undefined {
  return STORIES.find((s) => s.id === id);
}

/**
 * MOCK „článek z promptu" — z jedné věty autora vyrobí návrh titulku + HTML těla
 * ve stylu historického vypravěče. V ostrém provozu tohle napíše AI; tady je to
 * šablona, aby šla feature proklikat. Toto je lehčí předstupeň „příběhu z promptu".
 */
export function articleFromPrompt(prompt: string): { title: string; html: string } {
  const topic = prompt.trim().replace(/\s+/g, " ");
  const short = topic.length > 60 ? topic.slice(0, 57).trimEnd() + "…" : topic || "Nový článek";
  const title = short.charAt(0).toUpperCase() + short.slice(1);
  const html =
    `<p>Píše se doba, kdy ${topic || "se odehrává náš příběh"}. Vypravěč nás bere přímo doprostřed dění — mezi lidi, jejichž rozhodnutí toho dne změnila běh věcí.</p>` +
    `<h2>Jak to začalo</h2>` +
    `<p>Události nepřišly znenadání. Napětí narůstalo už delší dobu a stačila jediná jiskra, aby se vše dalo do pohybu. Právě tady začíná náš příběh.</p>` +
    `<p>Co následovalo, poznamenalo aktéry i zemi na dlouhá léta. (Mock článek vygenerovaný z promptu — v ostrém provozu ho napíše AI s doloženým historickým kontextem.)</p>`;
  return { title, html };
}

/** Návrh castu z článku: existující panovníci ze story.characters + vymyšlené postavy. */
export function proposeCast(story: Story | undefined): DraftChar[] {
  const out: DraftChar[] = [];

  (story?.characters ?? []).forEach((slug, i) => {
    const r = rulerBySlug(slug);
    if (!r) return;
    out.push({
      id: slug,
      name: r.name,
      kind: "ruler",
      role: i === 0 ? "protagonist" : "supporting",
      bio: r.bio ?? "Panovník vystupující v příběhu.",
      look: `Dobový oděv, ${(r.title ?? "panovník").toLowerCase()}, výraz odpovídající scéně.`,
      rulerSlug: slug, // existující panovník — profil už známe, stačí napárovat
      source: "existing",
      status: "pending",
    });
  });

  // Vymyšlené postavy — pro Václavův příběh konkrétní, jinak generické.
  const isVaclav = story?.slug?.includes("vaclava");
  out.push({
    id: "d-antagonist",
    name: isVaclav ? "Boleslav I." : "Protivník",
    kind: "figure",
    role: "antagonist",
    bio: isVaclav
      ? "Mladší bratr, který stojí proti hlavnímu hrdinovi — reálná historická postava."
      : "Reálná historická postava stojící proti hrdinovi.",
    look: "Tvrdší rysy, tmavší paleta, panovnický plášť.",
    source: "ai",
    status: "pending",
  });
  out.push({
    id: "d-narrator",
    name: isVaclav ? "Podiven" : "Kronikář",
    kind: "fictional",
    role: "narrator",
    bio: "Vymyšlený vypravěč, jehož očima příběh sledujeme. Drží se doložených faktů, ale sám je fikce.",
    look: "Prostý dobový oděv, obyčejný člověk z pozadí děje.",
    source: "ai",
    status: "pending",
  });

  return out;
}

/**
 * Návrh storyboardu (~7 beatů) z castu — jen KOSTRA: outline (co se stane), typ,
 * nálada, postava. Plná próza (`text`) se generuje až ve fázi Texty (prázdné).
 */
export function proposeStoryboard(cast: DraftChar[]): DraftBeat[] {
  const hero = cast.find((c) => c.role === "protagonist") ?? cast[0];
  const anta = cast.find((c) => c.role === "antagonist");
  const narr = cast.find((c) => c.role === "narrator");
  const heroName = hero?.name ?? "Hrdina";
  const antaName = anta?.name ?? "protivník";
  const b = (n: number, kind: BeatKind, mood: Mood, outline: string, charId?: string): DraftBeat =>
    ({ id: `b${n}`, kind, mood, outline, text: "", charId });

  return [
    b(1, "scene", "dawn", `${narr?.name ?? "Vypravěč"} uvádí, kde a kdy se příběh odehrává.`, narr?.id),
    b(2, "scene", "day", `${heroName} vstupuje do děje — co chce a co je v sázce.`, hero?.id),
    b(3, "flip", "day", "Věděli jste? Zajímavost dokreslující dobu."),
    b(4, "scene", "mystic", `Napětí roste — ${antaName} sleduje vlastní cíl.`, anta?.id),
    b(5, "scene", "night", "Vrchol příběhu za noci — okamžik zlomu.", hero?.id),
    b(6, "quiz", "night", "Kontrolní otázka z odvyprávěné scény."),
    b(7, "scene", "dawn", "Dozvuk — co událost znamenala a jak ji dějiny zapamatovaly.", narr?.id),
  ];
}

// ————————————————————————————————————————————————————————————————
// Panovníci — párování karty postavy na profil (rulers.ts).
// ————————————————————————————————————————————————————————————————

export interface RulerOption {
  slug: string;
  name: string;
  title: string;
  reign: string;
}

/** Seznam panovníků do pickeru „Napárovat na panovníka". */
export function rulerOptions(): RulerOption[] {
  return CZ_RULERS.map((r) => ({
    slug: r.slug,
    name: r.name,
    title: r.title ?? "",
    reign: `${r.activeFrom}–${r.activeTo}`,
  }));
}

/** Médium napárovaného panovníka (cutout→foto→placeholder) s BASE prefixem. */
export function rulerMedia(slug: string): string {
  const r = rulerBySlug(slug);
  if (!r) return facePlaceholder("?", "ruler");
  return assetUrl(figureImage(r).src)!;
}

/** Kanonická identita panovníka (jméno + bio) pro převzetí do karty. */
export function rulerInfo(slug: string): { name: string; bio: string } | null {
  const r = rulerBySlug(slug);
  return r ? { name: r.name, bio: r.bio ?? "" } : null;
}

/** Vygenerovaná próza beatu — `text` (čte čtenář) + `extra` (zadní strana / odpověď). */
export interface BeatProse {
  text: string;
  extra?: string;
}

/**
 * DEMO próza pro storyboard příběhu „Zavraždění svatého Václava" (beaty b1–b7).
 * V ostrém provozu tohle napíše AI z outline + článku + hlasů postav; tady je to
 * ručně, aby fáze Texty ukazovala reálný čtenářský text, ne placeholder.
 */
const DEMO_PROSE: Record<string, BeatProse> = {
  b1: { text: "Bylo časné ráno, když jsem přišel do Staré Boleslavi. Psal se rok 935 a nad poli u kostela ještě ležela mlha. Málokdo tehdy tušil, že se tenhle den zapíše do dějin celé země." },
  b2: { text: "Kníže Václav přijel na bratrovo pozvání oslavit posvěcení kostela. Byl to muž zbožný a mírný, který raději jednal, než válčil — a věřil, že mezi bratry nemůže být zrady. V tom se měl osudově zmýlit." },
  b3: {
    text: "Věděli jste, že Václav byl krátce po smrti prohlášen za svatého a stal se věčným patronem české země?",
    extra: "Jeho ostatky byly přeneseny do rotundy svatého Víta na Pražském hradě, kde se z knížete stal symbol státnosti.",
  },
  b4: { text: "Boleslav měl ale jiné plány. V noci se sešel se svými muži a domluvili se. Toužil po moci a bratr mu stál v cestě. Když se ráno Václav vydal na mši, čekali už na něj u dveří chrámu." },
  b5: { text: "„Bratře, proč mě chceš zabít?“ zvolal Václav, když se na něj Boleslav vrhl s mečem. Strhla se rvačka; kníže byl silnější a bratra srazil k zemi — ale nedokázal ho zabít. A to ho stálo život. Boleslavovi druhové přiběhli a probodli Václava přímo na prahu kostela." },
  b6: {
    text: "Kdo zabil knížete Václava?",
    extra: "Jeho vlastní bratr Boleslav se svými družiníky, u dveří kostela ve Staré Boleslavi roku 935.",
  },
  b7: { text: "Z mrtvého knížete se stal světec. Sám Boleslav prý svého činu později litoval a nechal bratrovy ostatky přenést do Prahy. A tak se z bratrovraždy zrodil věčný patron země — svatý Václav, kníže, který nechtěl prolévat krev." },
};

/** Vygenerovat prózu beatu. Demo příběh má ruční text; jinak čitelný fallback z outline. */
export function generateBeatText(beat: DraftBeat): BeatProse {
  const demo = DEMO_PROSE[beat.id];
  if (demo) return demo;
  if (beat.kind === "quiz") return { text: beat.outline, extra: "Správná odpověď a krátké vysvětlení." };
  if (beat.kind === "flip") return { text: beat.outline, extra: "Doplňující doložený fakt k tématu." };
  return { text: beat.outline };
}
