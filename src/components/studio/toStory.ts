/**
 * toStory.ts — ADAPTER na seamu creator (autorský draft) → čtenářský model.
 *
 * `DraftBeat` (creator.ts) je PLOCHÁ, ztrátová projekce: jeden tvar pro všechny
 * druhy beatu (kind/mood/outline/text/extra/charId/bgUrl). `StoryBeat` (stories.ts)
 * je naopak DISKRIMINOVANÁ UNIE (scene|flip|quiz|scrub), kde každá varianta nese
 * jiná pole (options/answer, captions[], front/back…).
 *
 * Tenhle adapter je JEDINÉ místo, kde se ten rozdíl překlenuje — mapuje `kind`
 * na správnou variantu unie. Kde draft nemá dost dat (kvíz nemá options/answer,
 * scrub nemá captions), použije se okomentovaný placeholder/derivace: to je přesně
 * ta informace, kterou tenhle seam zviditelňuje a kterou bude muset doplnit buď
 * autorské UI, nebo generátor „AI“ ve fázi Beaty/Texty.
 */
import { bgPlaceholder, type DraftBeat } from "@/components/studio/creator";
import type { StoryBeat } from "@/data/stories";

/**
 * Převede jeden autorský `DraftBeat` na čtenářský `StoryBeat`.
 * Explicitní, typovaný převod na seamu — beze změny draftu i UI.
 */
export function toStoryBeat(draft: DraftBeat): StoryBeat {
  switch (draft.kind) {
    case "scene": {
      // Médium scény = vygenerované pozadí (bgUrl). Když ještě není (fáze Média
      // neproběhla), sáhneme po stejném placeholderu jako creator, ať `media`
      // není prázdné a čtenářský render nespadne.
      return {
        kind: "scene",
        media: draft.bgUrl ?? bgPlaceholder(draft.mood, draft.outline),
        text: draft.text,
        // `outline` nese jednovětný účel beatu — poslouží jako titulek scény.
        title: draft.outline || undefined,
        mood: draft.mood,
      };
    }

    case "flip": {
      // Flip: přední strana = plná próza (`text`), zadní = `extra`. Když autor
      // zadní stranu nevyplnil, dá se čitelný fallback z outline.
      return {
        kind: "flip",
        front: draft.text,
        back: draft.extra ?? draft.outline,
        mood: draft.mood,
      };
    }

    case "quiz": {
      // CHYBĚJÍCÍ INFORMACE, kterou seam zviditelňuje: `DraftBeat` nemá ani
      // možnosti odpovědí, ani index správné. Draftový model kvíz vůbec neumí
      // popsat. Než se creator rozšíří, dáváme placeholder options a answer=0,
      // ať je unie kompletní a typuje. `extra` (vysvětlení) mapujeme na `explain`.
      return {
        kind: "quiz",
        question: draft.text || draft.outline,
        options: ["Ano", "Ne"], // TODO(seam): options patří do DraftBeat (fáze Texty)
        answer: 0, // TODO(seam): správnou odpověď zatím draft nenese
        explain: draft.extra,
      };
    }

    case "scrub": {
      // Scrub potřebuje časované titulky (`captions[]`), které plochý draft nemá.
      // Odvodíme jeden titulek na začátku (at: 0) z dostupné prózy — placeholder,
      // dokud creator neumí titulky editovat.
      return {
        kind: "scrub",
        media: draft.bgUrl ?? bgPlaceholder(draft.mood, draft.outline),
        captions: [{ at: 0, title: draft.outline || undefined, text: draft.text }],
        mood: draft.mood,
      };
    }
  }
}

/** Převede celý draftový storyboard na čtenářskou sekvenci beatů. */
export function toStoryBeats(drafts: DraftBeat[]): StoryBeat[] {
  return drafts.map(toStoryBeat);
}
