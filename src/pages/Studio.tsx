/**
 * Studio — workspace autora (MOCK). Spravuje CELÝ životní cyklus: článek →
 * příběh (produkční fáze) → publikováno. Filtr podle stavu, u každé položky
 * produkční progres a adaptivní akce (Povýšit / Pokračovat / Upravit).
 * Statistiky jsou deterministický mock (mockStats).
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus, Eye, Coins, BookText, FileText, Film, CheckCircle2, ChevronRight,
  Trash2, Sparkles, MoreHorizontal,
} from "lucide-react";
import { useSession } from "@/context/session";
import { formatYear } from "@/lib/history";
import { LineChart } from "@/components/ui/charts";
import { series } from "@/lib/mockStats";
import {
  myWorkspace, matchesFilter, workSummary, STAGE_LABEL,
  type WorkFilter, type WorkItem,
} from "@/components/studio/workspace";
import { PHASES, phaseIndex } from "@/components/studio/phases";
import type { Story } from "@/data/stories";

const MONTHS = ["led", "úno", "bře", "dub", "kvě", "čvn", "čvc", "srp", "zář", "říj", "lis", "pro"];

function FactualityBadge({ s }: { s: Story }) {
  const map: Record<string, { label: string; cls: string }> = {
    fact: { label: "Doložené", cls: "bg-sky-50 text-sky-700 ring-sky-200" },
    legend: { label: "Pověst", cls: "bg-violet-50 text-violet-700 ring-violet-200" },
    fiction: { label: "Fikce", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
    brand: { label: "Brand", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  };
  const m = map[s.factuality ?? "fact"];
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${m.cls}`}>{m.label}</span>;
}

function Kpi({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={"rounded-2xl border p-5 shadow-sm " + (accent ? "border-amber-200 bg-amber-50" : "border-zinc-200 bg-white")}>
      <div className="flex items-center gap-2 text-zinc-400">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-2 font-display text-3xl font-extrabold text-zinc-900">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-zinc-500">{sub}</div>}
    </div>
  );
}

/** Produkční progres: článek → postavy → beaty → média → zvuk → hotovo. */
function StageBar({ stage }: { stage: WorkItem["stage"] }) {
  const idx = phaseIndex(stage);
  // Kroky = fáze po článku; „reached" se odvodí z `order` v tabulce (žádný ruční +1).
  const steps = PHASES.filter((p) => p.id !== "article");
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {steps.map((p) => {
          const reached = idx >= p.order;
          return (
            <span
              key={p.id}
              title={STAGE_LABEL[p.id]}
              className={"h-1.5 w-6 rounded-full transition-colors " + (reached ? "bg-green-500" : "bg-zinc-200")}
            />
          );
        })}
      </div>
      <span className="text-xs text-zinc-500">
        {stage === "publish" ? "hotovo" : `fáze: ${STAGE_LABEL[stage]}`}
      </span>
    </div>
  );
}

function ActionButton({ w }: { w: WorkItem }) {
  const to = `/studio/editor/${w.story.id}`;
  if (w.isArticle)
    return (
      <Link to={to} className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-2 text-xs font-bold text-zinc-900 shadow-sm transition-transform hover:-translate-y-0.5">
        <Sparkles className="h-3.5 w-3.5" /> Povýšit na příběh
      </Link>
    );
  if (!w.isPublished)
    return (
      <Link to={to} className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-xs font-bold text-white transition-transform hover:-translate-y-0.5">
        Pokračovat <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    );
  return (
    <Link to={to} className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 px-4 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50">
      Upravit
    </Link>
  );
}

function WorkRow({ w }: { w: WorkItem }) {
  const { story: s } = w;
  return (
    <div className="flex flex-col gap-3 border-b border-zinc-100 px-4 py-4 last:border-0 hover:bg-zinc-50/60 sm:flex-row sm:items-center sm:gap-4">
      {/* Náhled + název */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <img src={s.coverImage} alt="" className="h-12 w-16 flex-none rounded-lg object-cover ring-1 ring-zinc-200" />
        <div className="min-w-0">
          <Link to={`/studio/editor/${s.id}`} className="block truncate font-medium text-zinc-900 hover:text-amber-600">
            {s.title}
          </Link>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-xs text-zinc-400">{formatYear(s.yearFrom)}</span>
            <FactualityBadge s={s} />
          </div>
        </div>
      </div>

      {/* Stav */}
      <div className="sm:w-56 sm:flex-none">
        {w.isArticle ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500">
            <FileText className="h-3.5 w-3.5" /> Článek · čeká na povýšení
          </span>
        ) : w.isPublished ? (
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle2 className="h-3.5 w-3.5" /> Publikováno</span>
            <span className="tabular-nums">{w.stat.views.toLocaleString("cs")} zobr.</span>
          </div>
        ) : (
          <StageBar stage={w.stage} />
        )}
      </div>

      {/* Akce */}
      <div className="flex items-center gap-1.5 sm:flex-none">
        <ActionButton w={w} />
        <button title="Náhled" className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"><Eye className="h-4 w-4" /></button>
        <button title="Smazat" className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
        <button title="Více" className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"><MoreHorizontal className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

const TABS: { id: WorkFilter; label: string }[] = [
  { id: "all", label: "Vše" },
  { id: "article", label: "Články" },
  { id: "production", label: "V přípravě" },
  { id: "published", label: "Publikované" },
];

export default function Studio() {
  const { user } = useSession();
  const name = user?.name ?? "Křehy";
  const [filter, setFilter] = useState<WorkFilter>("all");

  const items = useMemo(() => myWorkspace(name), [name]);
  const sum = useMemo(() => workSummary(items), [items]);
  const counts = useMemo(() => ({
    all: items.length,
    article: items.filter((w) => matchesFilter(w, "article")).length,
    production: items.filter((w) => matchesFilter(w, "production")).length,
    published: items.filter((w) => matchesFilter(w, "published")).length,
  }), [items]);

  const shown = useMemo(() => {
    const list = items.filter((w) => matchesFilter(w, filter));
    // Řazení: rozdělané nahoře → články → publikované; v rámci podle roku.
    const rank = (w: WorkItem) => (w.isArticle ? 1 : w.isPublished ? 2 : 0);
    return list.slice().sort((a, b) => rank(a) - rank(b) || a.story.yearFrom - b.story.yearFrom);
  }, [items, filter]);

  const viewsSeries = series("views-" + name, 12, 1200, 9000);

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-zinc-50 font-sans text-zinc-800">
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
        {/* Hlavička */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-zinc-900">Studio</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Vítej zpět, <span className="font-medium text-zinc-700">{name}</span> — tvůj pracovní stůl od článku k příběhu.
            </p>
          </div>
          <Link
            to="/studio/new"
            className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 font-display text-sm font-bold text-zinc-900 shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" /> Nový článek
          </Link>
        </div>

        {/* KPI */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi icon={<FileText className="h-4 w-4" />} label="Články" value={String(sum.articles)} sub="čekají na povýšení" accent={sum.articles > 0} />
          <Kpi icon={<Film className="h-4 w-4" />} label="V přípravě" value={String(sum.production)} sub="rozpracované příběhy" />
          <Kpi icon={<BookText className="h-4 w-4" />} label="Publikováno" value={String(sum.published)} sub={`${sum.views.toLocaleString("cs")} zobrazení`} />
          <Kpi icon={<Coins className="h-4 w-4" />} label="Výdělek" value={`${sum.earnings.toLocaleString("cs")} Kč`} sub="placeholder (provize)" />
        </div>

        {/* Pracovní seznam */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
            <div className="flex flex-wrap gap-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFilter(t.id)}
                  className={
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors " +
                    (filter === t.id ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100")
                  }
                >
                  {t.label}
                  <span className={"rounded-full px-1.5 text-[11px] " + (filter === t.id ? "bg-white/20" : "bg-zinc-100 text-zinc-400")}>
                    {counts[t.id]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {shown.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-zinc-100 text-zinc-400"><FileText className="h-6 w-6" /></div>
              <p className="text-sm text-zinc-500">Tady zatím nic není.</p>
              <Link to="/studio/new" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-zinc-900">
                <Plus className="h-4 w-4" /> Nový článek
              </Link>
            </div>
          ) : (
            <div>{shown.map((w) => <WorkRow key={w.story.id} w={w} />)}</div>
          )}
        </div>

        {/* Výkon */}
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-zinc-900">Zobrazení v čase</h2>
            <span className="text-xs text-zinc-400">posledních 12 měsíců · mock</span>
          </div>
          <LineChart values={viewsSeries} labels={MONTHS} />
        </div>
      </div>
    </div>
  );
}
