/**
 * workspace.ts — MOCK pracovní seznam autora pro Studio. Overlay produkční fáze
 * (`Stage`) nad existující Story, aby šlo v designu ukázat článek → příběh → hotovo.
 * Deterministické (hash ze slugu), žádný backend. Až `Story` dostane reálné pole
 * `production` (viz DESIGN.md), tenhle overlay se zahodí.
 */
import { storiesByAuthor } from "@/lib/history";
import { storyStat, type StoryStat } from "@/lib/mockStats";
import type { Story } from "@/data/stories";

/** Produkční fáze položky (0 = jen článek … done = publikovatelný příběh). */
export type Stage = "article" | "characters" | "beats" | "texts" | "media" | "audio" | "done";

export const STAGES: Stage[] = ["article", "characters", "beats", "texts", "media", "audio", "done"];
export const STAGE_LABEL: Record<Stage, string> = {
  article: "Článek",
  characters: "Postavy",
  beats: "Beaty",
  texts: "Texty",
  media: "Média",
  audio: "Zvuk",
  done: "Hotovo",
};
/** Kroky produkce po článku (co ukazuje progres bar). */
export const PROD_STEPS: Stage[] = ["characters", "beats", "texts", "media", "audio", "done"];

export function stageIndex(s: Stage): number {
  return STAGES.indexOf(s);
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministická fáze — příběhy s beaty jsou hotové, zbytek rozprostřen. */
function stageOf(s: Story): Stage {
  if (s.beats?.length) return "done";
  const pool: Stage[] = ["article", "article", "article", "characters", "beats", "texts", "media", "audio", "done", "done"];
  return pool[hash(s.slug) % pool.length];
}

export interface WorkItem {
  story: Story;
  stage: Stage;
  isArticle: boolean;
  isPublished: boolean;
  stat: StoryStat;
}

export type WorkFilter = "all" | "article" | "production" | "published";

export function myWorkspace(name: string): WorkItem[] {
  return storiesByAuthor(name).map((story) => {
    const stage = stageOf(story);
    return {
      story,
      stage,
      isArticle: stage === "article",
      isPublished: stage === "done",
      stat: storyStat(story),
    };
  });
}

export function matchesFilter(w: WorkItem, f: WorkFilter): boolean {
  if (f === "all") return true;
  if (f === "article") return w.isArticle;
  if (f === "published") return w.isPublished;
  return !w.isArticle && !w.isPublished; // production
}

export interface WorkSummary {
  articles: number;
  production: number;
  published: number;
  views: number;
  earnings: number;
}

export function workSummary(items: WorkItem[]): WorkSummary {
  const published = items.filter((w) => w.isPublished);
  const views = published.reduce((a, w) => a + w.stat.views, 0);
  return {
    articles: items.filter((w) => w.isArticle).length,
    production: items.filter((w) => !w.isArticle && !w.isPublished).length,
    published: published.length,
    views,
    earnings: Math.round(views * 0.12),
  };
}
