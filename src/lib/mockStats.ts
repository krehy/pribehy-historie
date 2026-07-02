/**
 * mockStats.ts — DETERMINISTICKÁ mock čísla pro dashboardy (žádná reálná analytika,
 * žádný Math.random). Vše se odvozuje ze `slug`/jména přes hash, takže hodnoty jsou
 * stabilní mezi rendery. Později se vymění za reálnou analytiku.
 */
import { STORIES, type Story } from "@/data/stories";
import { isPublished, storiesByAuthor } from "@/lib/history";

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rand01(seed: string): number {
  return (hash(seed) % 100000) / 100000;
}
function between(seed: string, min: number, max: number): number {
  return Math.round(min + rand01(seed) * (max - min));
}

export interface StoryStat {
  views: number;
  completion: number; // %
  quizAvg: number; // %
  saves: number;
  trend: number[]; // 8 bodů pro sparkline
}

export function storyStat(s: Story): StoryStat {
  const draft = s.status === "draft";
  const views = draft ? 0 : between(s.slug + "v", 280, 14200);
  const completion = draft ? 0 : between(s.slug + "c", 34, 93);
  const quizAvg = between(s.slug + "q", 46, 96);
  const saves = draft ? 0 : between(s.slug + "s", 4, 920);
  const trend = Array.from({ length: 8 }, (_, i) =>
    draft ? 0 : between(s.slug + "t" + i, 20, 100)
  );
  return { views, completion, quizAvg, saves, trend };
}

export interface AuthorSummary {
  total: number;
  published: number;
  drafts: number;
  views: number;
  avgCompletion: number;
  earnings: number; // placeholder (Kč)
}

export function authorSummary(name: string): AuthorSummary {
  const mine = storiesByAuthor(name);
  const pub = mine.filter(isPublished);
  const views = pub.reduce((a, s) => a + storyStat(s).views, 0);
  const avgCompletion = pub.length
    ? Math.round(pub.reduce((a, s) => a + storyStat(s).completion, 0) / pub.length)
    : 0;
  return {
    total: mine.length,
    published: pub.length,
    drafts: mine.length - pub.length,
    views,
    avgCompletion,
    earnings: Math.round(views * 0.12), // placeholder model provize
  };
}

/** 12měsíční řada (deterministická) pro line chart. */
export function series(seed: string, n = 12, min = 20, max = 100): number[] {
  return Array.from({ length: n }, (_, i) => between(seed + i, min, max));
}

export interface GlobalSummary {
  stories: number;
  authors: number;
  readers: number; // MAU
  views: number;
  avgCompletion: number;
}

export function globalSummary(): GlobalSummary {
  const pub = STORIES.filter(isPublished);
  const authors = new Set(STORIES.map((s) => s.author?.name).filter(Boolean));
  const views = pub.reduce((a, s) => a + storyStat(s).views, 0);
  const avgCompletion = pub.length
    ? Math.round(pub.reduce((a, s) => a + storyStat(s).completion, 0) / pub.length)
    : 0;
  return {
    stories: pub.length,
    authors: Math.max(authors.size, 1) + 6, // + fabrikovaní autoři pro demo
    readers: 4200 + between("mau", 800, 3800),
    views,
    avgCompletion,
  };
}

export interface AuthorRow {
  name: string;
  stories: number;
  views: number;
}

/** Žebříček autorů pro admin (reálný Křehy z dat + fabrikovaní pro demo). */
export function authorsLeaderboard(): AuthorRow[] {
  const krehy = authorSummary("Křehy");
  const fabricated = [
    "M. Nováková",
    "Petr Dvořák",
    "A. Svobodová",
    "J. Procházka",
    "L. Černá",
    "T. Horák",
  ].map((name) => ({
    name,
    stories: between(name + "n", 2, 14),
    views: between(name + "v", 1200, 48000),
  }));
  return [{ name: "Křehy", stories: krehy.published, views: krehy.views }, ...fabricated].sort(
    (a, b) => b.views - a.views
  );
}

/** Rozložení obsahu podle faktuality (pro donut/legendu). */
export function factualityBreakdown(): { label: string; value: number }[] {
  const pub = STORIES.filter(isPublished);
  const count = (f: string) => pub.filter((s) => (s.factuality ?? "fact") === f).length;
  return [
    { label: "Doložené", value: count("fact") },
    { label: "Pověsti", value: count("legend") },
    { label: "Fikce", value: count("fiction") },
  ];
}
