/**
 * phaseGates.ts — čistý (React-free) gating creatoru „článek → příběh".
 * Jedno místo, kde žije pravda o fázích: pro každou fázi `done` (splněná?),
 * `unlocked` (odemčená?) a `hint` (co chybí). `unlocked` se NEODVOZUJE ručně —
 * počítá se z pořadí fází (PHASE_ORDER) a `done` předchozí fáze.
 *
 * Interface = test surface: přidání/změna fáze se dotkne jen tohoto modulu.
 * StudioEditor pak jen zavolá phaseGates(draft) a konzumuje výsledek.
 */
import type { DraftChar, DraftBeat, AudioState } from "./creator";

export type PhaseId = "article" | "characters" | "beats" | "texts" | "media" | "audio" | "publish";

/** Pořadí fází — zdroj pravdy pro řetězení odemykání (každá se odemkne po `done` předchozí). */
export const PHASE_ORDER: PhaseId[] = [
  "article", "characters", "beats", "texts", "media", "audio", "publish",
];

/** Prostý snapshot stavu, který predikáty potřebují — bez Reactu, bez derivací navíc. */
export interface GateDraft {
  body: string;
  proposals: DraftChar[];
  beats: DraftBeat[];
  sceneBeats: DraftBeat[];
  audio: AudioState;
  published: boolean;
}

export interface PhaseGate {
  done: boolean;
  unlocked: boolean;
  hint: string;
}

const plainLen = (html: string) => html.replace(/<[^>]+>/g, " ").trim().length;

export function phaseGates(draft: GateDraft): Record<PhaseId, PhaseGate> {
  const { body, proposals, beats, sceneBeats, audio, published } = draft;
  const cast = proposals.filter((p) => p.status === "accepted" || p.status === "locked");

  const done: Record<PhaseId, boolean> = {
    article: plainLen(body) > 20,
    characters:
      proposals.length > 0 &&
      proposals.every((p) => p.status !== "pending") &&
      cast.some((c) => c.role === "protagonist" || c.role === "narrator"),
    beats: beats.length > 0 && beats.every((b) => b.outline.trim().length > 0),
    texts: beats.length > 0 && beats.every((b) => b.text.trim().length > 0),
    media: sceneBeats.length > 0 && sceneBeats.every((b) => !!b.bgUrl),
    audio: audio.music && audio.voiceover && audio.sfx,
    publish: published,
  };

  const hint: Record<PhaseId, string> = {
    article: done.article ? "" : "Napiš aspoň pár vět, ať má AI z čeho číst.",
    characters: done.characters
      ? ""
      : proposals.some((p) => p.status === "pending")
        ? "Vyřeš všechny návrhy (schválit / zahodit)."
        : !cast.some((c) => c.role === "protagonist" || c.role === "narrator")
          ? "Aspoň jedna postava musí být hlavní hrdina nebo vypravěč."
          : "",
    beats: done.beats ? "" : "Každý beat potřebuje účel (jednu větu).",
    texts: done.texts ? "" : "Každý beat musí mít text.",
    media: done.media ? "" : "Každá scéna potřebuje pozadí.",
    audio: done.audio ? "" : "Vygeneruj všechny tři vrstvy.",
    publish: "",
  };

  const gates = {} as Record<PhaseId, PhaseGate>;
  PHASE_ORDER.forEach((id, i) => {
    const unlocked = i === 0 ? true : done[PHASE_ORDER[i - 1]];
    gates[id] = { done: done[id], unlocked, hint: hint[id] };
  });
  return gates;
}
