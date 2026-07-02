/**
 * StudioEditor — fázový creator „článek → příběh“ (MOCK, žádný backend).
 * Fáze: 0 Článek · 1 Postavy · 2 Beaty (kostra) · 3 Texty · 4 Média · 5 Zvuk · ★ Publikace.
 * Postava má životní cyklus pending→accepted→locked (viz creator.ts); panovník se
 * páruje na profil z rulers.ts. Viz DESIGN.md → Autorský creator.
 */
import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FileText, Users, Film, PenLine, Image as ImageIcon, Music, Rocket, Check, Lock,
  Sparkles, Plus, Trash2, Wand2, ChevronLeft, ChevronRight, Play, RotateCcw,
  X, ArrowLeft, Loader2, RefreshCw, Eye, Crown, Unlock,
} from "lucide-react";
import {
  findStory, proposeCast, proposeStoryboard, facePlaceholder, bgPlaceholder,
  rulerOptions, rulerMedia, rulerInfo, generateBeatText,
  MOOD_DOT, MOOD_LABEL, KIND_LABEL, ROLE_LABEL,
  type DraftChar, type DraftBeat, type Mood, type BeatKind, type DramaRole,
  type CharKind, type AudioState,
} from "@/components/studio/creator";
import { RichTextEditor } from "@/components/studio/RichTextEditor";
import { assetUrl } from "@/lib/assetUrl";

const plainLen = (html: string) => html.replace(/<[^>]+>/g, " ").trim().length;

type PhaseId = "article" | "characters" | "beats" | "texts" | "media" | "audio" | "publish";

const PHASES: { id: PhaseId; n: string; label: string; icon: typeof FileText; star?: boolean }[] = [
  { id: "article", n: "0", label: "Článek", icon: FileText },
  { id: "characters", n: "1", label: "Postavy", icon: Users },
  { id: "beats", n: "2", label: "Beaty", icon: Film },
  { id: "texts", n: "3", label: "Texty", icon: PenLine },
  { id: "media", n: "4", label: "Média", icon: ImageIcon },
  { id: "audio", n: "5", label: "Zvuk", icon: Music },
  { id: "publish", n: "★", label: "Publikace", icon: Rocket, star: true },
];

const MOODS: Mood[] = ["dawn", "day", "mystic", "night"];
const BEAT_KINDS: BeatKind[] = ["scene", "flip", "quiz", "scrub"];
const ROLES: DramaRole[] = ["protagonist", "narrator", "antagonist", "supporting"];
const KINDS: CharKind[] = ["ruler", "figure", "fictional"];
const BEAT_ICON: Record<BeatKind, string> = { scene: "🎬", flip: "🔖", quiz: "❓", scrub: "🎞️" };
const KIND_ICON: Record<BeatKind, string> = BEAT_ICON;

function Segmented<T extends string>({ value, options, labels, onChange, disabled }: {
  value: T; options: T[]; labels: Record<T, string>; onChange: (v: T) => void; disabled?: boolean;
}) {
  return (
    <div className={"inline-flex flex-wrap gap-1 rounded-lg bg-zinc-100 p-1 " + (disabled ? "opacity-50" : "")}>
      {options.map((o) => (
        <button
          key={o}
          disabled={disabled}
          onClick={() => onChange(o)}
          className={
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed " +
            (value === o ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800")
          }
        >
          {labels[o]}
        </button>
      ))}
    </div>
  );
}

function KindBadge({ kind }: { kind: CharKind }) {
  const cls: Record<CharKind, string> = {
    ruler: "bg-amber-50 text-amber-700 ring-amber-200",
    figure: "bg-sky-50 text-sky-700 ring-sky-200",
    fictional: "bg-rose-50 text-rose-700 ring-rose-200",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${cls[kind]}`}>{KIND_LABEL[kind]}</span>;
}

export default function StudioEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const story = findStory(id);

  const [phase, setPhase] = useState<PhaseId>("article");
  const [busy, setBusy] = useState<string | null>(null);
  const uid = useRef(100);
  const nextId = () => `x${uid.current++}`;

  const [title, setTitle] = useState(story?.title ?? "Nový příběh");
  const [body, setBody] = useState(
    story?.body ?? "Text článku zatím není. Napiš ho v kroku Článek — z něj AI vyčte postavy a navrhne beaty."
  );
  const [proposals, setProposals] = useState<DraftChar[]>([]);
  const [beats, setBeats] = useState<DraftBeat[]>([]);
  const [selBeat, setSelBeat] = useState<string | null>(null);
  const [audio, setAudio] = useState<AudioState>({ music: false, voiceover: false, sfx: false });
  const [published, setPublished] = useState(false);

  const cast = useMemo(() => proposals.filter((p) => p.status === "accepted" || p.status === "locked"), [proposals]);
  const sceneBeats = useMemo(() => beats.filter((b) => b.kind === "scene" || b.kind === "scrub"), [beats]);

  // — Gating —
  const doneArticle = plainLen(body) > 20;
  const doneCharacters =
    proposals.length > 0 &&
    proposals.every((p) => p.status !== "pending") &&
    cast.some((c) => c.role === "protagonist" || c.role === "narrator");
  const doneBeats = beats.length > 0 && beats.every((b) => b.outline.trim().length > 0);
  const doneTexts = beats.length > 0 && beats.every((b) => b.text.trim().length > 0);
  const doneMedia = sceneBeats.length > 0 && sceneBeats.every((b) => !!b.bgUrl);
  const doneAudio = audio.music && audio.voiceover && audio.sfx;

  const doneMap: Record<PhaseId, boolean> = {
    article: doneArticle, characters: doneCharacters, beats: doneBeats,
    texts: doneTexts, media: doneMedia, audio: doneAudio, publish: published,
  };
  const unlockedMap: Record<PhaseId, boolean> = {
    article: true, characters: doneArticle, beats: doneCharacters,
    texts: doneBeats, media: doneTexts, audio: doneMedia, publish: doneAudio,
  };

  const runMock = (key: string, fn: () => void, ms = 850) => {
    setBusy(key);
    window.setTimeout(() => { fn(); setBusy(null); }, ms);
  };

  // — Postavy: mutace —
  const patchIdentity = (pid: string, patch: Partial<DraftChar>) =>
    setProposals((ps) => ps.map((p) =>
      p.id === pid ? { ...p, ...patch, status: p.status === "accepted" ? "pending" : p.status } : p));
  const setRole = (pid: string, role: DramaRole) =>
    setProposals((ps) => ps.map((p) => (p.id === pid ? { ...p, role } : p)));
  const setStatus = (pid: string, status: DraftChar["status"]) =>
    setProposals((ps) => ps.map((p) => (p.id === pid ? { ...p, status } : p)));
  const genFace = (pid: string) =>
    runMock(`face-${pid}`, () => setProposals((ps) => ps.map((p) =>
      p.id === pid ? { ...p, faceUrl: facePlaceholder(p.name, p.kind), status: "locked" } : p)));
  const pairRuler = (pid: string, slug: string) =>
    setProposals((ps) => ps.map((p) => {
      if (p.id !== pid) return p;
      const info = rulerInfo(slug);
      return { ...p, kind: "ruler", rulerSlug: slug, name: info?.name ?? p.name, bio: info?.bio ?? p.bio, faceUrl: rulerMedia(slug), status: "locked" };
    }));
  const createRuler = (pid: string, name: string) =>
    setProposals((ps) => ps.map((p) =>
      p.id === pid ? { ...p, kind: "ruler", rulerSlug: `new-${pid}`, name: name || p.name, faceUrl: facePlaceholder(name || p.name, "ruler"), status: "locked" } : p));
  const unlockChar = (pid: string) =>
    setProposals((ps) => ps.map((p) =>
      p.id === pid ? { ...p, status: "accepted", faceUrl: undefined, rulerSlug: p.source === "existing" ? p.rulerSlug : undefined } : p));

  const patchBeat = (bid: string, patch: Partial<DraftBeat>) =>
    setBeats((bs) => bs.map((b) => (b.id === bid ? { ...b, ...patch } : b)));

  const selected = beats.find((b) => b.id === selBeat) ?? null;

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-zinc-50 font-sans text-zinc-800">
      {/* Horní lišta */}
      <div className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/studio" className="text-zinc-400 hover:text-zinc-700"><ArrowLeft className="h-5 w-5" /></Link>
            <div className="min-w-0">
              <div className="truncate font-display text-base font-bold text-zinc-900">{title}</div>
              <div className="text-[11px] text-zinc-400">Koncept · autosave (mock)</div>
            </div>
          </div>
          <Link to={`/pribeh/${story?.slug ?? ""}`} className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50">
            <Eye className="h-3.5 w-3.5" /> Náhled
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl gap-6 px-5 py-6 md:flex md:items-start">
        {/* Fázová lišta */}
        <nav className="mb-5 md:mb-0 md:w-56 md:flex-none">
          <ol className="flex gap-2 overflow-x-auto md:flex-col md:gap-1.5">
            {PHASES.map((p) => {
              const active = phase === p.id;
              const done = doneMap[p.id];
              const unlocked = unlockedMap[p.id];
              const Icon = p.icon;
              return (
                <li key={p.id} className="flex-none md:flex-auto">
                  <button
                    disabled={!unlocked}
                    onClick={() => unlocked && setPhase(p.id)}
                    className={
                      "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors " +
                      (active ? "bg-zinc-900 text-white shadow-sm"
                        : unlocked ? "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
                        : "cursor-not-allowed bg-zinc-100 text-zinc-400")
                    }
                  >
                    <span className={
                      "grid h-6 w-6 flex-none place-items-center rounded-full text-[11px] font-bold " +
                      (done ? "bg-green-500 text-white" : active ? "bg-amber-400 text-zinc-900"
                        : unlocked ? "bg-zinc-200 text-zinc-600" : "bg-zinc-200 text-zinc-400")
                    }>
                      {done ? <Check className="h-3.5 w-3.5" /> : !unlocked ? <Lock className="h-3 w-3" /> : p.n}
                    </span>
                    <Icon className="h-4 w-4 flex-none opacity-70" />
                    <span className="truncate font-medium">{p.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <section className="min-w-0 flex-1">
          {/* 0 — ČLÁNEK */}
          {phase === "article" && (
            <Panel title="Článek" icon={<FileText className="h-5 w-5 text-amber-500" />} desc="Základ příběhu. Z tohohle textu vyjde všechno ostatní.">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="mb-3 w-full rounded-lg border border-zinc-300 px-3 py-2.5 font-display text-lg font-bold outline-none focus:border-amber-400" />
              {story?.media && story.mediaType !== "video" && (
                <figure className="mb-3 overflow-hidden rounded-lg border border-zinc-200">
                  <img src={assetUrl(story.media)} alt="" className="max-h-72 w-full object-cover" />
                  {story.mediaCredit && <figcaption className="bg-zinc-50 px-3 py-1.5 text-[11px] italic text-zinc-400">{story.mediaCredit}</figcaption>}
                </figure>
              )}
              <RichTextEditor initialHtml={body} onChange={setBody} minHeight={280} placeholder="Text článku — můžeš vkládat obrázky, nadpisy, citace…" />
              <NextBar ok={doneArticle} hint={doneArticle ? "" : "Napiš aspoň pár vět, ať má AI z čeho číst."} label="Pokračovat na Postavy" onNext={() => setPhase("characters")} />
            </Panel>
          )}

          {/* 1 — POSTAVY */}
          {phase === "characters" && (
            <Panel title="Postavy" icon={<Users className="h-5 w-5 text-amber-500" />} desc="AI vyčte, kdo v příběhu vystupuje. Ty rozhodneš, kdo se stane postavou.">
              {proposals.length === 0 ? (
                <Empty busy={busy === "cast"} onRun={() => runMock("cast", () => setProposals(proposeCast(story)))} cta="Vyčíst postavy z článku" note="AI navrhne cast s odhadem role i vzhledu — ty přijmeš, upravíš, nebo zahodíš." />
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {proposals.map((p) => (
                      <CharCard
                        key={p.id} p={p} busy={busy === `face-${p.id}`}
                        onIdentity={(patch) => patchIdentity(p.id, patch)}
                        onRole={(r) => setRole(p.id, r)}
                        onApprove={() => setStatus(p.id, "accepted")}
                        onDismiss={() => setStatus(p.id, "dismissed")}
                        onRestore={() => setStatus(p.id, "pending")}
                        onFace={() => genFace(p.id)}
                        onPair={(slug) => pairRuler(p.id, slug)}
                        onCreate={(name) => createRuler(p.id, name)}
                        onUnlock={() => unlockChar(p.id)}
                      />
                    ))}
                  </div>
                  <button onClick={() => setProposals((ps) => [...ps, { id: nextId(), name: "Nová postava", kind: "fictional", role: "supporting", bio: "", look: "", source: "manual", status: "accepted" }])}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-dashed border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50">
                    <Plus className="h-4 w-4" /> Přidat vlastní postavu
                  </button>
                  <NextBar
                    ok={doneCharacters}
                    hint={
                      proposals.some((p) => p.status === "pending") ? "Vyřeš všechny návrhy (schválit / zahodit)."
                        : !cast.some((c) => c.role === "protagonist" || c.role === "narrator") ? "Aspoň jedna postava musí být hlavní hrdina nebo vypravěč." : ""
                    }
                    label="Pokračovat na Beaty" onNext={() => setPhase("beats")}
                  />
                </>
              )}
            </Panel>
          )}

          {/* 2 — BEATY (KOSTRA) */}
          {phase === "beats" && (
            <Panel title="Beaty — kostra" icon={<Film className="h-5 w-5 text-amber-500" />} desc="Jen kostra: pořadí, typ, nálada, postava a jednovětný účel. Plné texty přijdou v další fázi.">
              {beats.length === 0 ? (
                <Empty busy={busy === "board"} onRun={() => runMock("board", () => { const b = proposeStoryboard(cast); setBeats(b); setSelBeat(b[0]?.id ?? null); })} cta="Navrhnout storyboard" note="AI z článku a castu poskládá ~7 beatů — scény, flip kartičku i kvíz." />
              ) : (
                <>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {beats.map((b, i) => (
                      <button key={b.id} onClick={() => setSelBeat(b.id)}
                        className={"relative flex h-24 w-32 flex-none flex-col justify-between rounded-xl border p-2 text-left transition-all " + (selBeat === b.id ? "border-amber-400 ring-2 ring-amber-200" : "border-zinc-200 hover:border-zinc-300")}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-zinc-500">#{i + 1}</span>
                          <span className="text-sm">{KIND_ICON[b.kind]}</span>
                        </div>
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600">
                            <span className="h-2 w-2 rounded-full" style={{ background: MOOD_DOT[b.mood] }} />{MOOD_LABEL[b.mood]}
                          </span>
                          <div className="mt-1 line-clamp-2 text-[11px] leading-tight text-zinc-700">{b.outline || "—"}</div>
                        </div>
                      </button>
                    ))}
                    <button onClick={() => { const nb: DraftBeat = { id: nextId(), kind: "scene", mood: "day", outline: "", text: "" }; setBeats((bs) => [...bs, nb]); setSelBeat(nb.id); }}
                      className="grid h-24 w-14 flex-none place-items-center rounded-xl border border-dashed border-zinc-300 text-zinc-400 hover:bg-zinc-50"><Plus className="h-5 w-5" /></button>
                  </div>

                  {selected && (
                    <BeatOutline
                      key={selected.id} beat={selected} index={beats.findIndex((b) => b.id === selected.id)} count={beats.length} cast={cast}
                      onPatch={(patch) => patchBeat(selected.id, patch)}
                      onMove={(dir) => { const i = beats.findIndex((b) => b.id === selected.id); const j = i + dir; if (j < 0 || j >= beats.length) return; const c = beats.slice(); [c[i], c[j]] = [c[j], c[i]]; setBeats(c); }}
                      onDelete={() => { setBeats((bs) => bs.filter((b) => b.id !== selected.id)); setSelBeat(null); }}
                    />
                  )}
                  <NextBar ok={doneBeats} hint={doneBeats ? "" : "Každý beat potřebuje účel (jednu větu)."} label="Pokračovat na Texty" onNext={() => setPhase("texts")} />
                </>
              )}
            </Panel>
          )}

          {/* 3 — TEXTY */}
          {phase === "texts" && (
            <Panel title="Texty" icon={<PenLine className="h-5 w-5 text-amber-500" />} desc="Plná próza každého beatu. Čti příběh shora dolů, jako by ho četl čtenář.">
              <button disabled={busy === "alltext"} onClick={() => runMock("alltext", () => setBeats((bs) => bs.map((b) => { const g = generateBeatText(b, story); return { ...b, text: g.text, extra: g.extra ?? b.extra }; })), 1100)}
                className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-2 font-display text-sm font-bold text-zinc-900 disabled:opacity-40">
                {busy === "alltext" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Vygenerovat všechny texty
              </button>
              <div className="space-y-4">
                {beats.map((b, i) => {
                  const char = cast.find((c) => c.id === b.charId);
                  return (
                    <div key={b.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600">
                          <span className="h-2 w-2 rounded-full" style={{ background: MOOD_DOT[b.mood] }} />#{i + 1} {KIND_ICON[b.kind]}
                        </span>
                        <span className="min-w-0 truncate font-display text-sm font-bold text-zinc-800">{b.outline || "—"}</span>
                        {char && <span className="ml-auto flex-none text-xs text-zinc-400">{char.name}</span>}
                      </div>
                      <textarea value={b.text} onChange={(e) => patchBeat(b.id, { text: e.target.value })} rows={3}
                        placeholder="Plná próza beatu…" className="w-full resize-y rounded-lg border border-zinc-200 px-3 py-2 text-sm leading-relaxed outline-none focus:border-amber-400" />
                      {(b.kind === "flip" || b.kind === "quiz") && (
                        <input value={b.extra ?? ""} onChange={(e) => patchBeat(b.id, { extra: e.target.value })} placeholder={b.kind === "flip" ? "Zadní strana kartičky" : "Správná odpověď / vysvětlení"} className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-amber-400" />
                      )}
                      <div className="mt-2 flex justify-end">
                        <button disabled={busy === `txt-${b.id}`} onClick={() => runMock(`txt-${b.id}`, () => { const g = generateBeatText(b, story); patchBeat(b.id, { text: g.text, extra: g.extra ?? b.extra }); })}
                          className="inline-flex items-center gap-1 rounded-full border border-zinc-300 px-2.5 py-1 text-[11px] text-zinc-600 hover:bg-zinc-50 disabled:opacity-50">
                          {busy === `txt-${b.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : b.text ? <RefreshCw className="h-3 w-3" /> : <Wand2 className="h-3 w-3" />} {b.text ? "Přegenerovat" : "Vygenerovat"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <NextBar ok={doneTexts} hint={doneTexts ? "" : "Každý beat musí mít text."} label="Pokračovat na Média" onNext={() => setPhase("media")} />
            </Panel>
          )}

          {/* 4 — MÉDIA */}
          {phase === "media" && (
            <Panel title="Média / pozadí" icon={<ImageIcon className="h-5 w-5 text-amber-500" />} desc="AI vygeneruje pozadí scén. Postavy se na ně složí jako cutout — tvář drží napříč beaty.">
              <button disabled={busy === "allbg" || sceneBeats.length === 0} onClick={() => runMock("allbg", () => setBeats((bs) => bs.map((b) => (b.kind === "scene" || b.kind === "scrub") ? { ...b, bgUrl: bgPlaceholder(b.mood, MOOD_LABEL[b.mood]) } : b)), 1100)}
                className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-2 font-display text-sm font-bold text-zinc-900 disabled:opacity-40">
                {busy === "allbg" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Vygenerovat všechna pozadí
              </button>
              <div className="grid gap-4 sm:grid-cols-2">
                {beats.map((b, i) => {
                  const isScene = b.kind === "scene" || b.kind === "scrub";
                  const char = cast.find((c) => c.id === b.charId);
                  return (
                    <div key={b.id} className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                      <div className="relative grid aspect-video place-items-center bg-zinc-50">
                        {isScene && b.bgUrl ? (
                          <>
                            <img src={b.bgUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                            {char?.faceUrl && <img src={char.faceUrl} alt="" className="relative z-10 h-[85%] w-auto object-contain drop-shadow-xl" />}
                          </>
                        ) : isScene ? <span className="text-xs text-zinc-400">bez pozadí</span> : <span className="text-xs text-zinc-400">{KIND_ICON[b.kind]} bez média</span>}
                      </div>
                      <div className="flex items-center justify-between gap-2 px-3 py-2">
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-zinc-400">#{i + 1} · {MOOD_LABEL[b.mood]}</div>
                          <div className="truncate text-xs text-zinc-600">{char ? char.name : b.outline.slice(0, 40)}</div>
                        </div>
                        {isScene && (
                          <button disabled={busy === `bg-${b.id}`} onClick={() => runMock(`bg-${b.id}`, () => patchBeat(b.id, { bgUrl: bgPlaceholder(b.mood, MOOD_LABEL[b.mood]) }))}
                            className="inline-flex flex-none items-center gap-1 rounded-full border border-zinc-300 px-2.5 py-1 text-[11px] text-zinc-600 hover:bg-zinc-50">
                            {busy === `bg-${b.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : b.bgUrl ? <RefreshCw className="h-3 w-3" /> : <Wand2 className="h-3 w-3" />} {b.bgUrl ? "znovu" : "generovat"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <NextBar ok={doneMedia} hint={doneMedia ? "" : "Každá scéna potřebuje pozadí."} label="Pokračovat na Zvuk" onNext={() => setPhase("audio")} />
            </Panel>
          )}

          {/* 5 — ZVUK */}
          {phase === "audio" && (
            <Panel title="Zvuk" icon={<Music className="h-5 w-5 text-amber-500" />} desc="Tři vrstvy: hudba podle nálady, vypravěč (jeden hlas) a zvukové efekty.">
              <button disabled={busy === "allaudio"} onClick={() => runMock("allaudio", () => setAudio({ music: true, voiceover: true, sfx: true }), 1100)}
                className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-2 font-display text-sm font-bold text-zinc-900 disabled:opacity-40">
                {busy === "allaudio" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Vygenerovat všechny vrstvy
              </button>
              <div className="space-y-3">
                <AudioLayer label="Hudba" on={audio.music} detail={`Loop pro každou náladu: ${[...new Set(beats.map((b) => MOOD_LABEL[b.mood]))].join(", ") || "—"}`} busy={busy === "l-music"} onGen={() => runMock("l-music", () => setAudio((a) => ({ ...a, music: true })))} />
                <AudioLayer label="Voiceover (1 vypravěč)" on={audio.voiceover} detail={`TTS pro ${beats.length} beatů`} busy={busy === "l-vo"} onGen={() => runMock("l-vo", () => setAudio((a) => ({ ...a, voiceover: true })))} />
                <AudioLayer label="Zvukové efekty" on={audio.sfx} detail="Podle typu a triggeru beatů (vstup, flip, kvíz)" busy={busy === "l-sfx"} onGen={() => runMock("l-sfx", () => setAudio((a) => ({ ...a, sfx: true })))} />
              </div>
              <NextBar ok={doneAudio} hint={doneAudio ? "" : "Vygeneruj všechny tři vrstvy."} label="Pokračovat na Publikaci" onNext={() => setPhase("publish")} />
            </Panel>
          )}

          {/* ★ — PUBLIKACE */}
          {phase === "publish" && (
            <Panel title="Publikace" icon={<Rocket className="h-5 w-5 text-amber-500" />} desc="Poslední kontrola, než příběh pustíš do světa.">
              {published ? (
                <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-green-500 text-white"><Check className="h-6 w-6" /></div>
                  <h3 className="mt-3 font-display text-lg font-bold text-green-800">Příběh publikován 🎉</h3>
                  <p className="mt-1 text-sm text-green-700">V prototypu nikam neputuje — v reálu by teď byl na webu.</p>
                  <button onClick={() => navigate("/studio")} className="mt-4 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white">Zpět do Studia</button>
                </div>
              ) : (
                <>
                  <ul className="space-y-2">
                    {PHASES.filter((p) => p.id !== "publish").map((p) => (
                      <li key={p.id} className="flex items-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm">
                        <span className={"grid h-5 w-5 place-items-center rounded-full " + (doneMap[p.id] ? "bg-green-500 text-white" : "bg-zinc-200 text-zinc-400")}>
                          {doneMap[p.id] ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        </span>
                        <span className="font-medium text-zinc-700">{p.label}</span>
                        <span className="ml-auto text-xs text-zinc-400">{doneMap[p.id] ? "hotovo" : "chybí"}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-800 ring-1 ring-amber-200">
                    Fikce se vždy vizuálně odliší a drží se zdrojů události; doložené příběhy vyžadují zdroje.
                  </div>
                  <button onClick={() => setPublished(true)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-600 px-6 py-3 font-display text-sm font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5">
                    <Rocket className="h-4 w-4" /> Publikovat příběh
                  </button>
                </>
              )}
            </Panel>
          )}
        </section>
      </div>
    </div>
  );
}

// ————————————————————————————————————————————————————————————————
// Podkomponenty
// ————————————————————————————————————————————————————————————————

function Panel({ title, icon, desc, children }: { title: string; icon: React.ReactNode; desc: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2">{icon}<h1 className="font-display text-2xl font-extrabold text-zinc-900">{title}</h1></div>
      <p className="mb-5 text-sm text-zinc-500">{desc}</p>
      {children}
    </div>
  );
}

function Empty({ busy, onRun, cta, note }: { busy: boolean; onRun: () => void; cta: string; note: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-amber-100 text-amber-600"><Sparkles className="h-6 w-6" /></div>
      <button disabled={busy} onClick={onRun} className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 font-display text-sm font-bold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}{busy ? "AI pracuje…" : cta}
      </button>
      <p className="mt-3 max-w-sm text-xs text-zinc-400">{note}</p>
    </div>
  );
}

function NextBar({ ok, hint, label, onNext }: { ok: boolean; hint: string; label: string; onNext: () => void }) {
  return (
    <div className="mt-6 flex items-center justify-between gap-3 border-t border-zinc-200 pt-4">
      <span className="text-xs text-zinc-400">{ok ? "✓ Fáze splněná — další je odemčená." : hint}</span>
      <button disabled={!ok} onClick={onNext} className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-5 py-2.5 font-display text-sm font-bold text-zinc-900 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40">
        {label} <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function RulerPicker({ presetSlug, onPair, onCreate }: { presetSlug?: string; onPair: (slug: string) => void; onCreate: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const opts = rulerOptions();
  const preset = opts.find((o) => o.slug === presetSlug);

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100">
        <Crown className="h-3.5 w-3.5" /> {preset ? `Napárovat: ${preset.name}` : "Napárovat na panovníka"}
      </button>
      {open && (
        <div className="absolute z-30 mt-1 max-h-72 w-64 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-lg">
          {opts.map((o) => (
            <button key={o.slug} onClick={() => { onPair(o.slug); setOpen(false); }} className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-zinc-50">
              <span className="font-medium text-zinc-800">{o.name}</span>
              <span className="text-[10px] text-zinc-400">{o.title} · {o.reign}</span>
            </button>
          ))}
          <div className="my-1 border-t border-zinc-100" />
          {creating ? (
            <div className="p-1.5">
              <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Jméno panovníka" className="mb-1.5 w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-xs outline-none focus:border-amber-400" />
              <button onClick={() => { if (newName.trim()) { onCreate(newName.trim()); setOpen(false); } }} className="w-full rounded-lg bg-amber-400 px-2 py-1.5 text-xs font-bold text-zinc-900">Vytvořit a napárovat</button>
            </div>
          ) : (
            <button onClick={() => setCreating(true)} className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-xs text-amber-700 hover:bg-amber-50"><Plus className="h-3.5 w-3.5" /> Vytvořit nový profil</button>
          )}
        </div>
      )}
    </div>
  );
}

function CharCard({ p, busy, onIdentity, onRole, onApprove, onDismiss, onRestore, onFace, onPair, onCreate, onUnlock }: {
  p: DraftChar; busy: boolean;
  onIdentity: (patch: Partial<DraftChar>) => void; onRole: (r: DramaRole) => void;
  onApprove: () => void; onDismiss: () => void; onRestore: () => void;
  onFace: () => void; onPair: (slug: string) => void; onCreate: (name: string) => void; onUnlock: () => void;
}) {
  const dismissed = p.status === "dismissed";
  const locked = p.status === "locked";
  const isRuler = p.kind === "ruler";

  return (
    <div className={"rounded-xl border p-3 transition-opacity " + (dismissed ? "border-zinc-200 bg-zinc-50 opacity-60" : locked ? "border-green-200 bg-white" : "border-zinc-200 bg-white")}>
      <div className="flex gap-3">
        <div className="relative h-20 w-16 flex-none overflow-hidden rounded-lg bg-zinc-100">
          {p.faceUrl ? <img src={p.faceUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-zinc-300"><Users className="h-5 w-5" /></div>}
          {locked && <span className="absolute bottom-0.5 right-0.5 grid h-5 w-5 place-items-center rounded-full bg-green-500 text-white"><Lock className="h-3 w-3" /></span>}
        </div>
        <div className="min-w-0 flex-1">
          <input value={p.name} disabled={locked} onChange={(e) => onIdentity({ name: e.target.value })}
            className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 font-display text-sm font-bold text-zinc-900 hover:border-zinc-200 focus:border-amber-400 focus:outline-none disabled:hover:border-transparent" />
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <KindBadge kind={p.kind} />
            {p.rulerSlug && <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700"><Crown className="h-2.5 w-2.5" /> napárováno</span>}
            {!p.rulerSlug && p.source === "ai" && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500">návrh AI</span>}
          </div>
        </div>
      </div>

      {!dismissed && (
        <div className="mt-2.5 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-zinc-400">kind</span>
            <Segmented value={p.kind} options={KINDS} labels={KIND_LABEL} disabled={locked} onChange={(v) => onIdentity({ kind: v })} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-zinc-400">role</span>
            <Segmented value={p.role} options={ROLES} labels={ROLE_LABEL} onChange={onRole} />
          </div>
          <textarea value={p.bio} disabled={locked} onChange={(e) => onIdentity({ bio: e.target.value })} rows={2} placeholder="Krátké bio…"
            className="w-full resize-none rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs outline-none focus:border-amber-400 disabled:bg-zinc-50 disabled:text-zinc-500" />
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {p.status === "pending" ? (
          <>
            <button onClick={onApprove} className="inline-flex items-center gap-1 rounded-full bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700"><Check className="h-3.5 w-3.5" /> Schválit</button>
            <button onClick={onDismiss} className="inline-flex items-center gap-1 rounded-full border border-zinc-300 px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-50"><X className="h-3.5 w-3.5" /> Zahodit</button>
          </>
        ) : dismissed ? (
          <button onClick={onRestore} className="inline-flex items-center gap-1 rounded-full border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50"><RotateCcw className="h-3.5 w-3.5" /> Vrátit</button>
        ) : locked ? (
          <button onClick={() => { if (window.confirm("Odemknout postavu? Zahodí to vygenerovanou tvář / odpojí panovníka.")) onUnlock(); }} className="inline-flex items-center gap-1 rounded-full border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50"><Unlock className="h-3.5 w-3.5" /> Odemknout</button>
        ) : isRuler ? (
          <>
            <RulerPicker presetSlug={p.rulerSlug} onPair={onPair} onCreate={onCreate} />
            <button onClick={onDismiss} className="ml-auto text-zinc-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
          </>
        ) : (
          <>
            <button disabled={busy} onClick={onFace} className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />} Vygenerovat tvář
            </button>
            <button onClick={onDismiss} className="ml-auto text-zinc-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
          </>
        )}
      </div>
    </div>
  );
}

function BeatOutline({ beat, index, count, cast, onPatch, onMove, onDelete }: {
  beat: DraftBeat; index: number; count: number; cast: DraftChar[];
  onPatch: (patch: Partial<DraftBeat>) => void; onMove: (dir: -1 | 1) => void; onDelete: () => void;
}) {
  const showChar = beat.kind === "scene" || beat.kind === "scrub";
  return (
    <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-bold text-zinc-900">Beat #{index + 1}</span>
          <button disabled={index === 0} onClick={() => onMove(-1)} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
          <button disabled={index === count - 1} onClick={() => onMove(1)} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <button onClick={onDelete} className="text-zinc-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1 text-[11px] text-zinc-400">typ</div>
          <Segmented value={beat.kind} options={BEAT_KINDS} labels={{ scene: "scéna", flip: "flip", quiz: "kvíz", scrub: "scrub" }} onChange={(v) => onPatch({ kind: v })} />
        </div>
        <div>
          <div className="mb-1 text-[11px] text-zinc-400">nálada</div>
          <Segmented value={beat.mood} options={MOODS} labels={MOOD_LABEL} onChange={(v) => onPatch({ mood: v })} />
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 text-[11px] text-zinc-400">účel beatu — co se stane (jedna věta)</div>
        <textarea value={beat.outline} onChange={(e) => onPatch({ outline: e.target.value })} rows={2} placeholder="Např. Václav vstupuje do děje…" className="w-full resize-none rounded-lg border border-zinc-200 px-2.5 py-2 text-sm outline-none focus:border-amber-400" />
      </div>

      {showChar && (
        <div className="mt-3">
          <div className="mb-1 text-[11px] text-zinc-400">postava v beatu</div>
          <select value={beat.charId ?? ""} onChange={(e) => onPatch({ charId: e.target.value || undefined })} className="w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-sm outline-none focus:border-amber-400">
            <option value="">— nikdo —</option>
            {cast.map((c) => <option key={c.id} value={c.id}>{c.name} ({ROLE_LABEL[c.role]})</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

function AudioLayer({ label, detail, on, busy, onGen }: { label: string; detail: string; on: boolean; busy: boolean; onGen: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3">
      <span className={"grid h-9 w-9 flex-none place-items-center rounded-full " + (on ? "bg-green-100 text-green-600" : "bg-zinc-100 text-zinc-400")}>
        {on ? <Play className="h-4 w-4" /> : <Music className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-zinc-800">{label}</div>
        <div className="truncate text-xs text-zinc-400">{detail}</div>
      </div>
      <button disabled={busy} onClick={onGen} className={"inline-flex flex-none items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium disabled:opacity-50 " + (on ? "border border-zinc-300 text-zinc-600 hover:bg-zinc-50" : "bg-amber-400 text-zinc-900")}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : on ? <RefreshCw className="h-3.5 w-3.5" /> : <Wand2 className="h-3.5 w-3.5" />} {on ? "znovu" : "generovat"}
      </button>
    </div>
  );
}
