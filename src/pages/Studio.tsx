/**
 * Studio — dashboard autora (workspace vrstva hybrid designu). Scope = příběhy
 * přihlášeného autora. Mock statistiky. „+ Nový příběh" vede na setup wizard.
 */
import { Link } from "react-router-dom";
import { Plus, Eye, CheckCircle2, Coins, BookText } from "lucide-react";
import { useSession } from "@/context/session";
import { storiesByAuthor, formatYear } from "@/lib/history";
import { authorSummary, storyStat, series } from "@/lib/mockStats";
import { LineChart, Sparkline } from "@/components/ui/charts";
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

function StatusBadge({ s }: { s: Story }) {
  const draft = s.status === "draft";
  return (
    <span
      className={
        "rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 " +
        (draft ? "bg-zinc-100 text-zinc-500 ring-zinc-200" : "bg-green-50 text-green-700 ring-green-200")
      }
    >
      {draft ? "Koncept" : "Publikováno"}
    </span>
  );
}

function Kpi({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-zinc-400">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-2 font-display text-3xl font-extrabold text-zinc-900">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-zinc-500">{sub}</div>}
    </div>
  );
}

export default function Studio() {
  const { user } = useSession();
  const name = user?.name ?? "Křehy";
  const mine = storiesByAuthor(name).slice().sort((a, b) => storyStat(b).views - storyStat(a).views);
  const sum = authorSummary(name);
  const viewsSeries = series("views-" + name, 12, 1200, 9000);

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-zinc-50 font-sans text-zinc-800">
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
        {/* Hlavička */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-zinc-900">Studio</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Vítej zpět, <span className="font-medium text-zinc-700">{name}</span> — přehled tvých příběhů.
            </p>
          </div>
          <Link
            to="/studio/new"
            className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 font-display text-sm font-bold text-zinc-900 shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" /> Nový příběh
          </Link>
        </div>

        {/* KPI */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi icon={<BookText className="h-4 w-4" />} label="Příběhy" value={String(sum.total)} sub={`${sum.published} publ. · ${sum.drafts} konceptů`} />
          <Kpi icon={<Eye className="h-4 w-4" />} label="Zobrazení" value={sum.views.toLocaleString("cs")} sub="za celou dobu" />
          <Kpi icon={<CheckCircle2 className="h-4 w-4" />} label="Dokončenost" value={`${sum.avgCompletion} %`} sub="průměr publikovaných" />
          <Kpi icon={<Coins className="h-4 w-4" />} label="Výdělek" value={`${sum.earnings.toLocaleString("cs")} Kč`} sub="placeholder (provize)" />
        </div>

        {/* Graf */}
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-zinc-900">Zobrazení v čase</h2>
            <span className="text-xs text-zinc-400">posledních 12 měsíců · mock</span>
          </div>
          <LineChart values={viewsSeries} labels={MONTHS} />
        </div>

        {/* Tabulka příběhů */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <h2 className="font-display text-lg font-bold text-zinc-900">Moje příběhy</h2>
            <span className="text-xs text-zinc-400">{mine.length} položek</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-400">
                  <th className="px-5 py-3 font-medium">Příběh</th>
                  <th className="px-3 py-3 font-medium">Stav</th>
                  <th className="px-3 py-3 text-right font-medium">Zobrazení</th>
                  <th className="px-3 py-3 text-right font-medium">Dokonč.</th>
                  <th className="px-3 py-3 text-right font-medium">Kvíz</th>
                  <th className="px-3 py-3 text-right font-medium">Uložení</th>
                  <th className="px-5 py-3 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((s) => {
                  const st = storyStat(s);
                  return (
                    <tr key={s.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60">
                      <td className="px-5 py-3">
                        <Link to={`/studio/editor/${s.id}`} className="font-medium text-zinc-900 hover:text-amber-600">
                          {s.title}
                        </Link>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="text-xs text-zinc-400">{formatYear(s.yearFrom)}</span>
                          <FactualityBadge s={s} />
                          {s.beats && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500">kinematický</span>}
                        </div>
                      </td>
                      <td className="px-3 py-3"><StatusBadge s={s} /></td>
                      <td className="px-3 py-3 text-right tabular-nums text-zinc-700">{st.views.toLocaleString("cs")}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-zinc-700">{st.completion ? `${st.completion} %` : "—"}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-zinc-700">{st.quizAvg} %</td>
                      <td className="px-3 py-3 text-right tabular-nums text-zinc-700">{st.saves.toLocaleString("cs")}</td>
                      <td className="px-5 py-3"><Sparkline values={st.trend} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
