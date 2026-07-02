/**
 * workspace.ts — MOCK pracovní seznam autora pro Studio. Overlay produkční fáze
 * (`Stage`) nad existující Story, aby šlo v designu ukázat článek → příběh → hotovo.
 * Deterministické (hash ze slugu), žádný backend. Až `Story` dostane reálné pole
 * `production` (viz DESIGN.md), tenhle overlay se zahodí.
 */
import { storiesByAuthor } from "@/lib/history";
import { storyStat, type StoryStat } from "@/lib/mockStats";
import type { Story } from "@/data/stories";
import { PHASES, type PhaseId } from "./phases";

/**
 * Produkční fáze položky = `PhaseId` z jedné tabulky (phases.ts).
 * Poslední fáze `publish` znamená v dashboardu „hotovo / publikováno".
 */
export type Stage = PhaseId;

/**
 * Popisky fází pro dashboard = tabulka PHASES; jen `publish` se v progresu
 * kreslí jako stav „Hotovo" (na rozdíl od editorské akce „Publikace").
 */
export const STAGE_LABEL: Record<PhaseId, string> = Object.fromEntries(
  PHASES.map((p) => [p.id, p.id === "publish" ? "Hotovo" : p.label]),
) as Record<PhaseId, string>;

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
  if (s.beats?.length) return "publish";
  const pool: Stage[] = ["article", "article", "article", "characters", "beats", "texts", "media", "audio", "publish", "publish"];
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
      isPublished: stage === "publish",
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
