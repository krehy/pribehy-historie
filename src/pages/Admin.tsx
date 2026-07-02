/**
 * Admin — globální statistiky celého webu (workspace vrstva). Mock čísla.
 * Scope = všechny příběhy/autoři. Obsahuje moderační frontu (draft → published).
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { BookText, Users, Eye, CheckCircle2, UsersRound, Check } from "lucide-react";
import { STORIES } from "@/data/stories";
import { isPublished } from "@/lib/history";
import { continentOfA3, continentName, type ContinentId } from "@/data/continents";
import {
  globalSummary,
  authorsLeaderboard,
  factualityBreakdown,
  series,
} from "@/lib/mockStats";
import { LineChart, BarRow } from "@/components/ui/charts";

const MONTHS = ["led", "úno", "bře", "dub", "kvě", "čvn", "čvc", "srp", "zář", "říj", "lis", "pro"];

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-zinc-400">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-2 font-display text-3xl font-extrabold text-zinc-900">{value}</div>
    </div>
  );
}

export default function Admin() {
  const g = globalSummary();
  const authors = authorsLeaderboard();
  const fact = factualityBreakdown();
  const views = series("g-views", 12, 30000, 120000);
  const regs = series("g-regs", 12, 40, 320);

  // Rozložení obsahu podle kontinentu.
  const byContinent = (() => {
    const m = new Map<ContinentId, number>();
    STORIES.filter(isPublished).forEach((s) => {
      const c = continentOfA3(s.countryCode);
      if (c) m.set(c, (m.get(c) ?? 0) + 1);
    });
    return Array.from(m.entries())
      .map(([id, n]) => ({ label: continentName(id), value: n }))
      .sort((a, b) => b.value - a.value);
  })();

  // Moderační fronta (drafty napříč autory) + lokální „schválení".
  const [approved, setApproved] = useState<Set<string>>(new Set());
  const queue = STORIES.filter((s) => s.status === "draft" && !approved.has(s.id));

  const maxAuthor = Math.max(...authors.map((a) => a.views), 1);
  const maxCont = Math.max(...byContinent.map((c) => c.value), 1);
  const maxFact = Math.max(...fact.map((f) => f.value), 1);

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-zinc-50 font-sans text-zinc-800">
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-zinc-900">Administrace</h1>
          <p className="mt-1 text-sm text-zinc-500">Přehled celého webu · mock data</p>
        </div>

        {/* KPI */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <Kpi icon={<BookText className="h-4 w-4" />} label="Příběhy" value={String(g.stories)} />
          <Kpi icon={<Users className="h-4 w-4" />} label="Autoři" value={String(g.authors)} />
          <Kpi icon={<UsersRound className="h-4 w-4" />} label="Čtenáři (MAU)" value={g.readers.toLocaleString("cs")} />
          <Kpi icon={<Eye className="h-4 w-4" />} label="Zobrazení" value={g.views.toLocaleString("cs")} />
          <Kpi icon={<CheckCircle2 className="h-4 w-4" />} label="Dokončenost" value={`${g.avgCompletion} %`} />
        </div>

        {/* Grafy v čase */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-display text-lg font-bold text-zinc-900">Zobrazení v čase</h2>
            <LineChart values={views} labels={MONTHS} />
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-display text-lg font-bold text-zinc-900">Registrace v čase</h2>
            <LineChart values={regs} labels={MONTHS} stroke="#10b981" />
          </div>
        </div>

        {/* Žebříčky */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-display text-lg font-bold text-zinc-900">Žebříček autorů</h2>
            <div className="space-y-2.5">
              {authors.map((a) => (
                <BarRow key={a.name} label={`${a.name} · ${a.stories} př.`} value={a.views} max={maxAuthor} />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-display text-lg font-bold text-zinc-900">Rozložení obsahu</h2>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">Podle typu</div>
            <div className="space-y-2.5">
              {fact.map((f) => (
                <BarRow key={f.label} label={f.label} value={f.value} max={maxFact} suffix=" př." />
              ))}
            </div>
            <div className="mb-2 mt-5 text-xs font-medium uppercase tracking-wide text-zinc-400">Podle kontinentu</div>
            <div className="space-y-2.5">
              {byContinent.map((c) => (
                <BarRow key={c.label} label={c.label} value={c.value} max={maxCont} suffix=" př." />
              ))}
            </div>
          </div>
        </div>

        {/* Moderační fronta */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <h2 className="font-display text-lg font-bold text-zinc-900">Ke schválení</h2>
            <span className="text-xs text-zinc-400">{queue.length} konceptů</span>
          </div>
          {queue.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-zinc-400">Fronta je prázdná 🎉</div>
          ) : (
            <ul className="divide-y divide-zinc-50">
              {queue.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <div className="font-medium text-zinc-900">{s.title}</div>
                    <div className="text-xs text-zinc-500">
                      {s.author?.name ?? "—"} · {s.yearFrom > 0 ? `${s.yearFrom} n. l.` : `${-s.yearFrom} př. n. l.`}
                    </div>
                  </div>
                  <button
                    onClick={() => setApproved((prev) => new Set(prev).add(s.id))}
                    className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
                  >
                    <Check className="h-4 w-4" /> Schválit
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link to="/studio" className="text-sm text-zinc-500 underline-offset-4 hover:underline">
            → Přejít do Studia
          </Link>
        </div>
      </div>
    </div>
  );
}
