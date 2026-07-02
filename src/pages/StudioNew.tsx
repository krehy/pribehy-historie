/**
 * StudioNew — lehký formulář nového ČLÁNKU (MOCK). Krok před creatorem: název,
 * vazba na událost (rok + země), factuality, text (richtext). Navíc „Článek z
 * promptu" — z jedné věty se vygeneruje návrh článku. Backend se neřeší.
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Sparkles, Save, Wand2, Loader2 } from "lucide-react";
import { RichTextEditor } from "@/components/studio/RichTextEditor";
import { articleFromPrompt } from "@/components/studio/creator";

type Factuality = "fact" | "legend" | "fiction";

const FACT: { id: Factuality; label: string; hint: string }[] = [
  { id: "fact", label: "Doložené", hint: "vyžaduje zdroje" },
  { id: "legend", label: "Pověst", hint: "tradovaný příběh" },
  { id: "fiction", label: "Fikce", hint: "drží se faktu jako kotvy" },
];

export default function StudioNew() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [country, setCountry] = useState("Česko");
  const [fact, setFact] = useState<Factuality>("fact");
  const [html, setHtml] = useState("");
  const [editorKey, setEditorKey] = useState(0);

  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);

  const draftId = "cz3"; // Zavraždění sv. Václava — hezký cast pro demo
  const plain = html.replace(/<[^>]+>/g, " ").trim();
  const canSave = title.trim().length > 2 && plain.length > 20;

  const generate = () => {
    if (!prompt.trim()) return;
    setBusy(true);
    window.setTimeout(() => {
      const art = articleFromPrompt(prompt);
      if (!title.trim()) setTitle(art.title);
      setHtml(art.html);
      setEditorKey((k) => k + 1); // remount editoru s novým obsahem
      setBusy(false);
    }, 1000);
  };

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-zinc-50 font-sans text-zinc-800">
      <div className="mx-auto max-w-2xl px-5 py-8">
        <Link to="/studio" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800">
          <ArrowLeft className="h-4 w-4" /> Studio
        </Link>

        <div className="mt-4 flex items-center gap-2 text-zinc-900">
          <FileText className="h-6 w-6 text-amber-500" />
          <h1 className="font-display text-3xl font-extrabold">Nový článek</h1>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Nejdřív článek vázaný na událost. Z něj pak v creatoru vypěstuješ celý příběh.
        </p>

        {/* Článek z promptu */}
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-amber-800">
            <Wand2 className="h-4 w-4" />
            <h2 className="font-display text-sm font-bold">Článek z promptu</h2>
          </div>
          <p className="mb-2 text-xs text-amber-700/80">
            Napiš, o čem má článek být, jakou má mít zápletku a úhel — AI ho vygeneruje. Text pak upravíš níž.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Např. Únos českého knížete, vyprávěný očima jeho věrného družiníka…"
              className="flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-500"
            />
            <button
              onClick={generate}
              disabled={busy || !prompt.trim()}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {busy ? "Generuji…" : "Vygenerovat"}
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-400">Název</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Např. Zavraždění svatého Václava"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-400">Rok události</label>
              <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="935" inputMode="numeric"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-400">Země</label>
              <input value={country} onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-400">Typ obsahu</label>
            <div className="flex flex-wrap gap-2">
              {FACT.map((f) => (
                <button key={f.id} onClick={() => setFact(f.id)}
                  className={
                    "rounded-full px-3 py-1.5 text-sm ring-1 transition-colors " +
                    (fact === f.id ? "bg-amber-400 text-zinc-900 ring-amber-400" : "bg-white text-zinc-600 ring-zinc-300 hover:bg-zinc-50")
                  }>
                  {f.label} <span className="text-[11px] opacity-60">· {f.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-400">Text článku</label>
            <RichTextEditor key={editorKey} initialHtml={html} onChange={setHtml} placeholder="Napiš článek — nebo použij Článek z promptu výše. Můžeš vkládat obrázky, nadpisy, citace…" />
            <div className="mt-1 text-right text-xs text-zinc-400">{plain.length} znaků</div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
          <button onClick={() => navigate("/studio")} disabled={!canSave}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40">
            <Save className="h-4 w-4" /> Uložit koncept
          </button>
          <button onClick={() => navigate(`/studio/editor/${draftId}`)} disabled={!canSave}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-5 py-2.5 font-display text-sm font-bold text-zinc-900 shadow-sm transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40">
            <Sparkles className="h-4 w-4" /> Uložit a povýšit na příběh
          </button>
        </div>
        <p className="mt-2 text-right text-xs text-zinc-400">Prototyp: „povýšit" otevře editor s demo daty.</p>
      </div>
    </div>
  );
}
