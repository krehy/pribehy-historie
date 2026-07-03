import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useTransform, type MotionValue } from "framer-motion";
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Play } from "lucide-react";
import type { Story } from "@/data/stories";
import { formatYear } from "@/lib/history";
import { eraForYear, type Era } from "@/data/eras";
import {
  rulerBySlug, charactersForRange, figureImage, reignLabel, lifespanLabel,
  CATEGORY_LABEL, type Ruler, type Character,
} from "@/data/rulers";
import { ChromaImage } from "@/components/story/ChromaImage";
import { CharacterProfileView } from "@/components/character/CharacterProfileView";
import { assetUrl } from "@/lib/assetUrl";
import { useSnapFilmstrip } from "@/components/timeline/useSnapFilmstrip";

const src = assetUrl;
const repYear = (s: Story) => (s.yearFrom + s.yearTo) / 2;

// Měřítko osy (proporční podle roku, s omezením prázdných mezer).
const PX_PER_YEAR = 0.5;
const MIN_SEG = 190;
const MAX_SEG = 380;

// EraSlider: konstantní šířka slotu zóny (→ nulové překrývání) a čára přítomnosti zleva.
const ERA_W = 184;
const ERA_P = 72;

/** Médium karty (náhled) — jiné než pozadí u vlajkových příběhů. */
function cardMedia(s: Story): { src?: string; video: boolean } {
  const m = src(s.media);
  return { src: m ?? s.coverImage, video: !!m && s.mediaType === "video" };
}
/** Médium pozadí — preferuje hero (jiné než karta), pak media, pak cover. */
function bgMedia(s: Story): { src?: string; video: boolean } {
  if (s.hero?.media) return { src: src(s.hero.media), video: s.hero.mediaType === "video" };
  const m = src(s.media);
  return { src: m ?? s.coverImage, video: !!m && s.mediaType === "video" };
}

interface StoryTimelineProps {
  countryName: string;
  stories: Story[];
  onClose: () => void;
  eras?: Era[];
  /** Oznámí rodiči, že se má panel roztáhnout na fullscreen (grid fold). */
  onExpandedChange?: (expanded: boolean) => void;
}

/**
 * Kinematická osa — FILMSTRIP jednotlivých příběhů. Vycentrovaný příběh = vybraný;
 * plynule se přelíná do pozadí (Big Picture / TV feel). Pod osou pás epoch (grouping).
 * Ovládání: swipe se setrvačností, kolečko/šipky (rychlost dle scrollu), hover, klik = spustit.
 */
export function StoryTimeline({ countryName, stories, onClose, eras, onExpandedChange }: StoryTimelineProps) {
  const navigate = useNavigate();
  const stripRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const modeLock = useRef(false);
  const [mode, setMode] = useState<"osa" | "grid">("osa");
  const [filterRuler, setFilterRuler] = useState<Ruler | null>(null);
  const [vw, setVw] = useState(0);
  const vwRef = useRef(0);
  const [isMobile, setIsMobile] = useState(false);
  const [hovered, setHovered] = useState<Story | null>(null);
  const movedRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setIsMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // Rozložení: střed každého příběhu v px (proporčně dle roku, se zkrácením mezer).
  const layout = useMemo(() => {
    const minSeg = isMobile ? 190 : MIN_SEG;
    const maxSeg = isMobile ? 300 : MAX_SEG;
    const centers: number[] = [];
    const gaps: { x: number; years: number }[] = [];
    stories.forEach((s, i) => {
      if (i === 0) {
        centers.push(0);
        return;
      }
      const years = repYear(s) - repYear(stories[i - 1]);
      const raw = years * PX_PER_YEAR;
      const seg = Math.max(minSeg, Math.min(maxSeg, raw));
      const cx = centers[i - 1] + seg;
      centers.push(cx);
      if (raw > maxSeg) gaps.push({ x: (centers[i - 1] + cx) / 2, years: Math.round(years) });
    });
    return { centers, gaps, width: (centers[centers.length - 1] ?? 0) + 400 };
  }, [stories, isMobile]);

  const centerX = useCallback((i: number) => vwRef.current / 2 - (layout.centers[i] ?? 0), [layout]);

  // Snap-filmstrip jádro (viz useSnapFilmstrip) — sdílené s EraSliderem. wheelLock 90 ms.
  const { x, activeIndex: active, nearest, goTo, stepBy, dragTransition } = useSnapFilmstrip({
    count: stories.length,
    centerFor: centerX,
    wheelLockMs: 90,
  });

  useLayoutEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      vwRef.current = w;
      setVw(w);
      x.set(w / 2 - (layout.centers[active] ?? 0));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setHovered(null);
    setMode("osa");
    setFilterRuler(null);
    x.set(vwRef.current / 2); // → change event → active = 0 (centers[0] = 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stories]);

  // Oznámení rodiči (panel se roztáhne na fullscreen v grid módu).
  useEffect(() => onExpandedChange?.(mode === "grid"), [mode, onExpandedChange]);

  const toGrid = useCallback(() => {
    if (mode === "grid") return;
    modeLock.current = true;
    setMode("grid");
    window.setTimeout(() => (modeLock.current = false), 600);
  }, [mode]);

  const toOsa = useCallback(() => {
    if (mode === "osa") return;
    modeLock.current = true;
    setMode("osa");
    setFilterRuler(null); // zpět na osu → zrušit filtr panovníka
    window.setTimeout(() => (modeLock.current = false), 600);
  }, [mode]);

  // Klik na panovníka v partě → roztáhnout na grid a filtrovat na jeho charakter.
  const selectRuler = useCallback((r: Ruler) => {
    modeLock.current = true;
    setFilterRuler(r);
    setMode("grid");
    window.setTimeout(() => (modeLock.current = false), 600);
  }, []);

  // Kolečko: nad pásem krokuje filmstrip (řeší strip); jinde dolů → grid, nahoře v gridu → zpět na osu.
  const onRootWheel = useCallback(
    (e: React.WheelEvent) => {
      if (modeLock.current || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      if (mode === "osa") {
        if (stripRef.current?.contains(e.target as Node)) return; // pás si scroll řeší sám
        if (e.deltaY > 12) toGrid();
      } else if (e.deltaY < -12 && (gridRef.current?.scrollTop ?? 0) <= 0) {
        toOsa();
      }
    },
    [mode, toGrid, toOsa]
  );

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      setHovered(null);
      const dir = e.deltaY > 0 ? 1 : -1;
      const step = Math.min(4, Math.max(1, Math.round(Math.abs(e.deltaY) / 80)));
      stepBy(dir * step);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [stepBy]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goTo(nearest(x.get()) + 1);
      if (e.key === "ArrowLeft") goTo(nearest(x.get()) - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, nearest, x, onClose]);

  // Pás epoch (grouping pod osou) — segment přes příběhy dané epochy.
  const eraSegs = useMemo(() => {
    if (!eras || stories.length === 0) return [];
    const half = (isMobile ? 190 : MIN_SEG) / 2;
    const out: { name: string; from: number; to: number; tint: string; left: number; width: number }[] = [];
    for (const era of eras) {
      const idxs = stories
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => {
          const y = repYear(s);
          return y >= era.from && y <= era.to;
        })
        .map(({ i }) => i);
      if (!idxs.length) continue;
      const left = (layout.centers[idxs[0]] ?? 0) - half;
      const right = (layout.centers[idxs[idxs.length - 1]] ?? 0) + half;
      out.push({ name: era.name, from: era.from, to: era.to, tint: era.tint, left, width: Math.max(0, right - left) });
    }
    return out;
  }, [eras, stories, layout, isMobile]);

  const launch = (slug: string) => navigate(`/pribeh/${slug}`);

  const centeredStory = stories[active] ?? null;
  const focusStory = hovered ?? centeredStory;
  const focusEraObj = eras && focusStory ? eraForYear(repYear(focusStory), eras) : undefined;
  const focusEra = focusEraObj?.name;
  const activeEra = eras && centeredStory ? eraForYear(repYear(centeredStory), eras)?.name : undefined;

  // Parta = postavy vystupující v konkrétním příběhu (Story.characters), ne celá epocha.
  const rulers = useMemo(
    () => (focusStory?.characters ?? []).map(rulerBySlug).filter((r): r is Ruler => !!r),
    [focusStory]
  );
  // Lídr hloučku = panovník nejblíž roku na playheadu (stojí vepředu, ostatní za ním).
  const focusYear = focusStory ? repYear(focusStory) : 0;
  const leadIndex = useMemo(() => {
    let idx = 0;
    let best = Infinity;
    rulers.forEach((r, i) => {
      const d = focusYear >= r.activeFrom && focusYear <= r.activeTo
        ? -1
        : Math.min(Math.abs(focusYear - r.activeFrom), Math.abs(focusYear - r.activeTo));
      if (d < best) {
        best = d;
        idx = i;
      }
    });
    return idx;
  }, [rulers, focusYear]);

  const dragMin = vw / 2 - (layout.centers[stories.length - 1] ?? 0);
  const dragMax = vw / 2;
  const bg = focusStory ? bgMedia(focusStory) : null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#17140e]" onWheel={onRootWheel}>
      {/* ═══════════ 1. FOLD — kinematická osa (jen osa mód) ═══════════
          V grid módu odfadne celý — přehled má vlastní epoch filmstrip + header. */}
      <motion.div
        className="absolute inset-0 flex flex-col text-paper-light"
        animate={{ y: mode === "grid" ? "-6%" : "0%", opacity: mode === "grid" ? 0 : 1 }}
        transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
        style={{ pointerEvents: mode === "grid" ? "none" : "auto" }}
      >
      {/* Pozadí — příběh (crossfade); v grid módu odfadne (osa zůstává) */}
      <div className={"transition-opacity duration-500 " + (mode === "grid" ? "opacity-0" : "opacity-100")}>
      <AnimatePresence>
        {focusStory && (
          <motion.div
            key={focusStory.id}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute inset-0 z-0"
          >
            {bg?.video ? (
              <video className="h-full w-full object-cover" src={bg.src} autoPlay muted loop playsInline />
            ) : (
              <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url("${bg?.src}")` }} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-[#17140e] via-[#17140e]/55 to-[#17140e]/15" />
      {/* Levý scrim — tmavší strana s textem (titulek/perex) kvůli čitelnosti na světlém pozadí. */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-[#17140e]/85 via-[#17140e]/40 to-transparent md:via-[#17140e]/30" />
      </div>

      {/* Parta = postavy z tohoto příběhu, vyklíčované, vpravo nad osou. Ukotvená
          k pravému okraji; bez overflow, aby se neořezávalo zvednutí a bublina na hover.
          V grid módu odfadne (osa zůstává). */}
      <div
        className={
          "absolute inset-x-0 bottom-[46%] z-10 hidden transition-opacity duration-500 md:block " +
          (mode === "grid" ? "pointer-events-none opacity-0" : "opacity-100")
        }
      >
        <AnimatePresence mode="wait">
          {rulers.length > 0 && (
            <motion.div
              key={focusStory?.id}
              initial={{ opacity: 0, x: 26 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute bottom-0 right-[clamp(1.5rem,7vw,11rem)] flex items-end justify-end"
            >
              {rulers.map((r, i) => (
                <RulerFigure
                  key={r.slug}
                  ruler={r}
                  offset={i - leadIndex}
                  hidden={filterRuler?.slug === r.slug}
                  onSelect={() => selectRuler(r)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Zpět (levý roh) + štítek (pravý roh); v grid módu odfadne */}
      <div
        className={
          "pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between p-3 transition-opacity duration-500 md:p-4 " +
          (mode === "grid" ? "opacity-0" : "opacity-100")
        }
      >
        <button
          onClick={onClose}
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border-2 border-paper-light/25 bg-black/30 px-4 py-2 font-display text-sm font-bold text-paper-light backdrop-blur-sm transition-colors hover:bg-black/55"
        >
          <ChevronLeft className="h-4 w-4" /> Zpět
        </button>
        <span className="rounded-full bg-black/30 px-4 py-2 font-display text-sm font-bold text-paper-light/90 backdrop-blur-sm">
          {countryName} · časová osa
        </span>
      </div>

      {/* Info + Play (nad osou; mění se s pozadím); v grid módu odfadne */}
      {focusStory && (
        <div
          className={
            "pointer-events-none absolute inset-x-0 bottom-[50%] z-20 px-6 transition-opacity duration-500 " +
            (mode === "grid" ? "opacity-0" : "opacity-100")
          }
        >
          <motion.div
            key={focusStory.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="pointer-events-none mx-auto max-w-7xl [&>*]:max-w-2xl"
          >
            <div className="font-serif text-sm italic text-sun [text-shadow:_0_1px_8px_rgba(0,0,0,.8)]">
              {formatYear(focusStory.yearFrom)} · {countryName}
              {focusEra ? ` · ${focusEra}` : ""}
              {!focusStory.beats && <span className="text-paper-light/50"> · článek</span>}
            </div>
            <h2 className="mt-1 font-display text-2xl font-extrabold leading-tight [text-shadow:_0_1px_2px_rgba(0,0,0,.95),_0_3px_20px_rgba(0,0,0,.7)] md:text-4xl">
              {focusStory.title}
            </h2>
            <p className="mt-1 line-clamp-2 max-w-xl font-sans text-sm text-paper-light [text-shadow:_0_1px_2px_rgba(0,0,0,.95),_0_2px_12px_rgba(0,0,0,.65)]">
              {focusStory.excerpt}
            </p>
            {focusStory.beats ? (
              <button
                onClick={() => launch(focusStory.slug)}
                className="pointer-events-auto mt-3 inline-flex items-center gap-2 rounded-full bg-sun px-5 py-2.5 font-display text-sm font-bold text-ink shadow-sticker transition-transform hover:-translate-y-0.5"
              >
                <Play className="h-5 w-5 fill-current" /> Spustit příběh
              </button>
            ) : (
              <div className="mt-3">
                <div className="mb-2 font-serif text-xs italic text-paper-light/55">
                  Pro tuto událost zatím neexistují žádné příběhy.
                </div>
                <button
                  onClick={() => launch(focusStory.slug)}
                  className="pointer-events-auto inline-flex items-center gap-2 rounded-full border-2 border-paper-light/25 bg-black/20 px-5 py-2.5 font-display text-sm font-bold text-paper-light backdrop-blur-sm transition-transform hover:-translate-y-0.5"
                >
                  <BookOpen className="h-5 w-5" /> Přečíst článek
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* ---------- OSA (spodní pruh) ---------- */}
      {/* overflow-x ořezává boční karty, overflow-y je visible — aktivní (zvětšená)
          karta se tak neusekne shora na nižších monitorech. */}
      <div ref={stripRef} className="relative z-10 mt-auto h-[46%] overflow-x-clip overflow-y-visible">
        {/* playhead */}
        <div className="pointer-events-none absolute left-1/2 top-0 z-20 h-full w-px -translate-x-1/2 bg-sun/25" />
        <div className="pointer-events-none absolute left-1/2 top-1 z-20 -translate-x-1/2">
          <div className="h-0 w-0 border-x-[7px] border-t-[9px] border-x-transparent border-t-sun" />
        </div>

        <motion.div
          className="absolute top-0 h-full cursor-grab active:cursor-grabbing"
          style={{ width: layout.width || "100%", x }}
          drag="x"
          dragConstraints={{ left: dragMin, right: dragMax }}
          dragElastic={0.06}
          dragTransition={dragTransition}
          onPointerDownCapture={() => (movedRef.current = false)}
          onDragStart={() => {
            movedRef.current = true;
            setHovered(null);
          }}
        >
          {/* osa linka */}
          <div className="absolute left-0 right-0 top-[62%] h-[2px] -translate-y-1/2 bg-paper-light/15" />

          {/* pás epoch (grouping) */}
          {eraSegs.map((e, i) => {
            const on = e.name === activeEra;
            return (
              <div
                key={`era-${i}`}
                className={
                  "absolute top-[68%] flex h-[16%] items-center justify-between gap-1 overflow-hidden rounded-md border px-1.5 transition-all duration-300 " +
                  (on ? "border-sun/70 opacity-100 shadow-[0_0_14px_rgba(244,196,48,.3)]" : "border-white/5 opacity-55")
                }
                style={{ left: e.left, width: e.width, background: e.tint }}
                title={`${e.name} (${e.from}–${e.to === 2025 ? "dnes" : e.to})`}
              >
                <span className="shrink-0 font-sans text-[9px] tabular-nums text-paper-light/55">{e.from}</span>
                <span
                  className={
                    "truncate text-center font-display text-[10px] font-bold uppercase tracking-wide md:text-xs " +
                    (on ? "text-sun" : "text-paper-light/70")
                  }
                >
                  {e.name}
                </span>
                <span className="shrink-0 font-sans text-[9px] tabular-nums text-paper-light/55">
                  {e.to === 2025 ? "dnes" : e.to}
                </span>
              </div>
            );
          })}

          {/* značky zkrácených mezer */}
          {layout.gaps.map((g, i) => (
            <div
              key={`gap-${i}`}
              className="absolute top-[62%] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-black/30 px-2 py-0.5 font-sans text-[10px] text-paper-light/40"
              style={{ left: g.x }}
            >
              … {g.years} let
            </div>
          ))}

          {/* karty příběhů */}
          {stories.map((s, i) => (
            <StoryCard
              key={s.id}
              story={s}
              cx={layout.centers[i] ?? 0}
              x={x}
              vw={vw}
              isMobile={isMobile}
              isActive={i === active}
              onHover={setHovered}
              onCenter={() => {
                if (movedRef.current) return;
                goTo(i);
              }}
            />
          ))}
        </motion.div>

        {/* šipky (desktop) */}
        {active > 0 && (
          <button
            onClick={() => goTo(active - 1)}
            aria-label="Předchozí"
            className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 place-items-center rounded-full border border-paper-light/25 bg-black/30 p-2.5 text-paper-light backdrop-blur-sm transition-colors hover:bg-black/50 md:grid"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {active < stories.length - 1 && (
          <button
            onClick={() => goTo(active + 1)}
            aria-label="Další"
            className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 place-items-center rounded-full border border-paper-light/25 bg-black/30 p-2.5 text-paper-light backdrop-blur-sm transition-colors hover:bg-black/50 md:grid"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Handle „scroll dolů" → grid přehled (v grid módu se skryje) */}
      <button
        onClick={toGrid}
        className={
          "absolute bottom-[2.5%] left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-paper-light/20 bg-black/45 px-4 py-1.5 font-display text-xs font-bold text-paper-light/85 backdrop-blur-sm transition-opacity duration-500 hover:bg-black/65 " +
          (mode === "grid" ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100")
        }
      >
        Přehled příspěvků <ChevronDown className="h-4 w-4 animate-bounce" />
      </button>
      </motion.div>

      {/* ═══════════ 2. FOLD — PŘEHLED: epoch filmstrip → scroll-collapse header + obsah ═══════════ */}
      <motion.div
        ref={gridRef}
        className="absolute inset-0 overflow-y-auto bg-[#17140e] text-paper-light"
        animate={{ y: mode === "grid" ? "0%" : "100%" }}
        transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
        style={{ pointerEvents: mode === "grid" ? "auto" : "none" }}
      >
        <TimelineGrid
          stories={stories}
          eras={eras}
          countryCode={stories[0]?.countryCode ?? ""}
          seedEraName={activeEra ?? focusEra}
          open={mode === "grid"}
          filterRuler={filterRuler}
          onSelectRuler={(r) => setFilterRuler(r)}
          onClearFilter={() => setFilterRuler(null)}
          onBackToOsa={toOsa}
          onLaunch={launch}
        />
      </motion.div>
    </div>
  );
}

/** Karta příběhu — lupa dle vzdálenosti od středu; náhled z média (jiné než pozadí). */
function StoryCard({
  story,
  cx,
  x,
  vw,
  isMobile,
  isActive,
  onHover,
  onCenter,
}: {
  story: Story;
  cx: number;
  x: MotionValue<number>;
  vw: number;
  isMobile: boolean;
  isActive: boolean;
  onHover: (s: Story | null) => void;
  onCenter: () => void;
}) {
  // Mobil: větší karta na šířku (landscape) — větší náhled a vejde se název. Desktop: čtverec.
  const cardW = isMobile ? "clamp(118px,36vw,182px)" : "clamp(78px,12vh,132px)";
  const cardH = isMobile ? "clamp(80px,24vw,124px)" : "clamp(78px,12vh,132px)";
  const maxScale = isMobile ? 1.3 : 1.4;
  const thresh = (isMobile ? 150 : 210) * 1.3;

  const scale = useTransform(x, (xv) => {
    if (!vw) return isActive ? maxScale : 1;
    const dist = Math.abs(xv + cx - vw / 2);
    const t = Math.max(0, 1 - dist / thresh);
    const e = t * t * (3 - 2 * t);
    return 1 + (maxScale - 1) * e;
  });
  const opacity = useTransform(x, (xv) => {
    if (!vw) return isActive ? 1 : 0.55;
    const dist = Math.abs(xv + cx - vw / 2);
    const t = Math.max(0, 1 - dist / (thresh * 1.7));
    return 0.42 + 0.58 * t;
  });

  const media = cardMedia(story);

  return (
    <motion.div
      onMouseEnter={() => onHover(story)}
      onMouseLeave={() => onHover(null)}
      onClick={onCenter}
      className="group absolute top-[62%] z-10 -translate-x-1/2 -translate-y-full cursor-pointer pb-3 transition-transform duration-200 hover:scale-[1.04]"
      style={{ left: cx, opacity }}
    >
      <motion.div
        className="relative overflow-hidden rounded-2xl border-2 shadow-parchment-lg transition-colors duration-300"
        style={{
          width: cardW,
          height: cardH,
          scale,
          borderColor: isActive ? "#f4c430" : "rgba(253,250,240,.25)",
          transformOrigin: "bottom center",
          // Fix problikávajících rohů při scale (zaoblený overflow + transform).
          WebkitMaskImage: "-webkit-radial-gradient(white, black)",
          backfaceVisibility: "hidden",
          willChange: "transform",
        }}
      >
        {media.video ? (
          <SlowVideo src={media.src!} active={isActive} />
        ) : (
          <div
            className={`absolute inset-0 bg-cover bg-center ${isActive ? "kenburns" : ""}`}
            style={{ backgroundImage: `url("${media.src}")` }}
          />
        )}
        {!story.beats && (
          <span className="absolute left-1 top-1 rounded bg-black/45 px-1 py-0.5 text-[7px] font-bold uppercase text-paper-light/80 backdrop-blur-sm">
            článek
          </span>
        )}
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/20" />
        {isActive && (
          <>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <motion.span
              key={story.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="absolute inset-x-0 bottom-0 block p-1.5 text-left font-display text-[11px] font-bold leading-tight text-paper-light [text-shadow:_0_1px_3px_rgba(0,0,0,.9)] line-clamp-2 group-hover:line-clamp-none"
            >
              {story.title}
            </motion.span>
          </>
        )}
      </motion.div>
      <div
        className={`mt-2 text-center font-display text-[11px] font-bold transition-colors ${
          isActive ? "text-sun" : "text-paper-light/50"
        }`}
      >
        {formatYear(story.yearFrom)}
      </div>
    </motion.div>
  );
}

/**
 * RulerFigure — jeden vyklíčovaný panovník v partě. Postavy se lehce překrývají
 * (parta stojící v prostoru), na hover se zvednou a ukážou jmenovku. Zatím jen
 * zobrazení — filtrace osy a profil /panovnik/:slug přijdou v dalším kroku.
 */
function RulerFigure({
  ruler,
  offset,
  hidden,
  onSelect,
}: {
  ruler: Ruler;
  /** Vzdálenost od lídra hloučku (0 = vepředu, ±n = za ním). */
  offset: number;
  hidden?: boolean;
  onSelect?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  if (hidden) return null; // aktivní filtr → postava „přeletí" do gridu
  const back = Math.min(Math.abs(offset), 3);
  const scale = 1 - back * 0.1;
  const ty = back * 16; // dozadu = výš (postava stojí za lídrem)
  const rot = Math.max(-12, Math.min(12, offset * 4)); // naklonění — opření o sebe
  const bright = 1 - back * 0.16;
  const quote = ruler.quotes?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: back * 0.05, ease: "easeOut" }}
      // Celý rám je průhledný pro myš — klik/hover řeší jen hit-zóna přes tělo,
      // aby průhledné okraje canvasu nezakrývaly sousední postavy.
      className="pointer-events-none relative -ml-[42px] first:ml-0"
      style={{ zIndex: hovered ? 200 : 100 - back }}
    >
      {/* pozice v hloučku (hloubka + naklonění); na hover se postava zvedne a narovná */}
      <motion.div
        className="origin-bottom"
        animate={{
          y: hovered ? ty - 12 : ty,
          rotate: hovered ? 0 : rot,
          scale: hovered ? scale + 0.06 : scale,
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div style={{ filter: `brightness(${hovered ? 1 : bright})` }}>
          <ChromaImage
            src={src(ruler.character)!}
            alt={ruler.name}
            className="pointer-events-none h-[clamp(120px,30vh,260px)] w-auto object-contain drop-shadow-[0_10px_22px_rgba(0,0,0,.55)]"
          />
        </div>
        {/* HIT-ZÓNA uvnitř pózy → jede s transformem, kryje celý viditelný obrázek.
            Boční odsazení nechává průhledné okraje průchozí, ať se figury neblokují. */}
        <button
          type="button"
          onClick={onSelect}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
          aria-label={`${ruler.name} — otevřít profil`}
          className="pointer-events-auto absolute inset-y-0 left-[10%] right-[10%] z-40 cursor-pointer rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sun/70"
        />
      </motion.div>

      {/* speech bubble s hláškou */}
      {quote && (
        <div
          className={
            "pointer-events-none absolute bottom-[calc(100%-8px)] left-1/2 z-30 w-max max-w-[210px] -translate-x-1/2 transition-all duration-200 " +
            (hovered ? "scale-100 opacity-100" : "scale-90 opacity-0")
          }
        >
          <SpeechBubble text={quote} tail="bottom" />
        </div>
      )}

      {/* jmenovka */}
      <div
        className={
          "pointer-events-none absolute inset-x-0 -bottom-1 z-20 flex justify-center transition-opacity duration-200 " +
          (hovered ? "opacity-100" : "opacity-0")
        }
      >
        <span className="whitespace-nowrap rounded-full bg-black/70 px-2.5 py-1 font-display text-[11px] font-bold text-paper-light backdrop-blur-sm">
          {ruler.name}
        </span>
      </div>
    </motion.div>
  );
}

/** Komiksová bublina s hláškou postavy (ocásek dole nebo vlevo směrem k figuře). */
function SpeechBubble({ text, tail = "bottom" }: { text: string; tail?: "bottom" | "left" }) {
  return (
    <div className="relative rounded-2xl bg-paper-light px-3.5 py-2.5 font-serif text-[13px] italic leading-snug text-ink shadow-parchment-lg">
      „{text}“
      {tail === "bottom" ? (
        <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[6px] border-t-[8px] border-x-transparent border-t-paper-light" />
      ) : (
        <span className="absolute right-full top-7 h-0 w-0 border-y-[6px] border-r-[8px] border-y-transparent border-r-paper-light" />
      )}
    </div>
  );
}

/**
 * Příběhy „s danou postavou": nejdřív ty, které postavu přímo uvádějí
 * (`story.characters`); pokud žádné, spadneme na příběhy překrývající se s obdobím
 * jejího působení (floruit) — aby filtr nebyl prázdný.
 */
function storiesWithChar(stories: Story[], c: Character): Story[] {
  const featured = stories.filter((s) => (s.characters ?? []).includes(c.slug));
  return featured.length ? featured : stories.filter((s) => s.yearFrom <= c.activeTo && s.yearTo >= c.activeFrom);
}

/** Příběhy dané epochy (repYear v rozsahu epochy). */
function storiesForEra(stories: Story[], era: Era): Story[] {
  return stories.filter((s) => {
    const y = repYear(s);
    return y >= era.from && y <= era.to;
  });
}

/** EpochCard — jedna zóna v EraSlideru. Neaktivní = plochý PÁS (název + roky, tint).
 * Aktivní = jediná dekorovaná NÁHLEDOVÁ karta (media + název), vyšší. Konstantní šířka
 * slotu → nulové překrývání; výška se mění (zdola nahoru) plynulým transitionem. */
function EpochCard({
  era,
  stories,
  i,
  w,
  active,
  onSelect,
}: {
  era: Era;
  stories: Story[];
  i: number;
  w: number;
  active: boolean;
  onSelect: () => void;
}) {
  const GAP = 10;
  const s0 = active ? storiesForEra(stories, era)[0] : null;
  const m = s0 ? bgMedia(s0) : null;

  return (
    <div className="absolute bottom-3 cursor-pointer" style={{ left: i * w, width: w - GAP }} onClick={onSelect}>
      <div
        className={
          "relative w-full overflow-hidden rounded-lg border-2 transition-all duration-300 " +
          (active ? "h-24 border-sun shadow-[0_0_18px_rgba(244,196,48,.25)]" : "h-9 border-white/10")
        }
        style={active ? undefined : { background: era.tint }}
      >
        {active && (
          <>
            {m?.video ? (
              <video
                className="absolute inset-0 h-full w-full object-cover"
                src={m.src ?? undefined}
                autoPlay
                muted
                loop
                playsInline
              />
            ) : m ? (
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${m.src}")` }} />
            ) : (
              <div className="absolute inset-0" style={{ background: era.tint }} />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
          </>
        )}

        {active ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2">
            <div className="truncate font-display text-xs font-bold uppercase leading-tight tracking-wide text-sun">
              {era.name}
            </div>
            <div className="font-sans text-[10px] tabular-nums text-paper-light/75">
              {era.from}–{era.to === 2025 ? "dnes" : era.to}
            </div>
          </div>
        ) : (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-between gap-2 px-3">
            <span className="font-sans text-[10px] tabular-nums text-paper-light/55">{era.from}</span>
            <span className="truncate font-display text-[11px] font-bold uppercase tracking-wide text-paper-light/75">
              {era.name}
            </span>
            <span className="font-sans text-[10px] tabular-nums text-paper-light/55">
              {era.to === 2025 ? "dnes" : era.to}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * EraSlider — pás zón v headeru přehledu. Tahový/slide filmstrip jako osa: `x` je jediný
 * zdroj pravdy, aktivní zóna se z něj odvodí (`nearest`) — proto žádná zpětná smyčka.
 * ČÁRA PŘÍTOMNOSTI je VLEVO; aktivní zóna se u ní stane náhledem, ostatní zůstanou pásy.
 */
function EraSlider({
  eras,
  stories,
  activeName,
  onPick,
}: {
  eras: Era[];
  stories: Story[];
  activeName?: string;
  onPick: (e: Era) => void;
}) {
  const moved = useRef(false);
  const startIdx = Math.max(0, eras.findIndex((e) => e.name === activeName));
  const centerFor = useCallback((i: number) => ERA_P - i * ERA_W, []);

  // Stejné snap-filmstrip jádro jako hlavní osa (uniformní rozteč slotů). wheelLock 240 ms.
  // Aktivní index odvozen z x → bez zpětného snapu → žádná smyčka. onActive syncuje rodiče.
  const { x, activeIndex: idx, goTo, stepBy, dragTransition } = useSnapFilmstrip({
    count: eras.length,
    centerFor,
    wheelLockMs: 240,
    initialIndex: startIdx,
    onActive: (i) => {
      const e = eras[i];
      if (e && e.name !== activeName) onPick(e);
    },
  });

  // Výchozí pozice (jednou).
  useLayoutEffect(() => {
    x.set(ERA_P - startIdx * ERA_W);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = (i: number) => {
    if (moved.current) return; // po tažení neaktivuj klik
    goTo(i);
  };

  // Kolečko krokuje zóny (jako filmstrip osy). stopPropagation, ať to root nevezme jako
  // „zpět na osu"; preventDefault, ať se nescrolluje přehled pod tím.
  const onWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(d) < 2) return;
    stepBy(d > 0 ? 1 : -1);
  };

  return (
    <div className="relative h-28 w-full overflow-hidden" onWheel={onWheel}>
      {/* čára přítomnosti — vlevo */}
      <div className="pointer-events-none absolute top-0 z-20 h-full w-px bg-sun/50" style={{ left: ERA_P }} />
      <div className="pointer-events-none absolute top-0 z-20 -translate-x-1/2" style={{ left: ERA_P }}>
        <div className="h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-sun" />
      </div>
      <motion.div
        className="absolute inset-y-0 left-0 cursor-grab active:cursor-grabbing"
        style={{ x, width: eras.length * ERA_W }}
        drag="x"
        dragConstraints={{ left: ERA_P - (eras.length - 1) * ERA_W, right: ERA_P }}
        dragElastic={0.06}
        dragTransition={dragTransition}
        onPointerDownCapture={() => (moved.current = false)}
        onDragStart={() => (moved.current = true)}
      >
        {eras.map((e, i) => (
          <EpochCard key={e.name} era={e} stories={stories} i={i} w={ERA_W} active={i === idx} onSelect={() => pick(i)} />
        ))}
      </motion.div>
    </div>
  );
}

/**
 * TimelineGrid — PŘEHLED (varianta C z prototypu). Kompaktní header: širokoúhlý
 * PREVIEW aktivní epochy (media z příběhů) + EraSlider (tahový pás zón, čára vlevo).
 * Pod headerem postavy epochy (hover = filtr karet, klik = profil) + karty příspěvků.
 * Klik na panovníka → CharacterProfileView.
 */
function TimelineGrid({
  stories,
  eras,
  countryCode,
  seedEraName,
  open,
  filterRuler,
  onSelectRuler,
  onClearFilter,
  onBackToOsa,
  onLaunch,
}: {
  stories: Story[];
  eras?: Era[];
  countryCode: string;
  /** Epocha aktivní na horní ose — předvybere se při otevření přehledu (časový sync). */
  seedEraName?: string;
  /** Přehled je otevřený (mode === "grid"). */
  open: boolean;
  filterRuler: Ruler | null;
  onSelectRuler: (r: Ruler) => void;
  onClearFilter: () => void;
  onBackToOsa: () => void;
  onLaunch: (slug: string) => void;
}) {
  const eraList = useMemo(() => eras ?? [], [eras]);
  const [activeEra, setActiveEra] = useState<Era | null>(null);
  const [hoverChar, setHoverChar] = useState<Character | null>(null);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  // Re-mount klíč EraSlideru — mění se při každém otevření přehledu, aby se pás zón
  // okamžitě přepozicoval na předvybranou epochu (bez animační smyčky přes goTo).
  const [openSeq, setOpenSeq] = useState(0);

  // PŘI KAŽDÉM OTEVŘENÍ přehledu předvyber epochu aktivní na horní ose (seedEraName)
  // → časová synchronizace osa ↔ přehled. Efekt závisí jen na `open`, takže spolehlivě
  // reaguje na false→true přechod; seedEraName/eraList/stories čte aktuální ze závěru.
  useEffect(() => {
    if (!open || eraList.length === 0) return;
    const seed = seedEraName ? eraList.find((e) => e.name === seedEraName) : undefined;
    const target = seed ?? eraList.find((e) => storiesForEra(stories, e).length) ?? eraList[0] ?? null;
    setActiveEra(target);
    setOpenSeq((s) => s + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Úvodní default (dokud se přehled poprvé neotevře), ať obsah není prázdný.
  useEffect(() => {
    if (activeEra || eraList.length === 0) return;
    setActiveEra(eraList.find((e) => storiesForEra(stories, e).length) ?? eraList[0] ?? null);
  }, [eraList, stories, activeEra]);

  // Všechny postavy epochy (panovníci, vědci, umělci, vynálezci…), ne jen panovníci.
  const epochChars = useMemo(
    () => (activeEra ? charactersForRange(activeEra.from, activeEra.to, countryCode) : []),
    [activeEra, countryCode]
  );
  const epochStories = useMemo(
    () => (activeEra ? storiesForEra(stories, activeEra) : stories),
    [activeEra, stories]
  );
  // Klik na postavu = filtr příspěvků; karta se plynule rozšíří (hover i výběr).
  const shown = selectedChar ? storiesWithChar(stories, selectedChar) : epochStories;

  // Přepnutí epochy zruší filtr postavy.
  useEffect(() => {
    setSelectedChar(null);
    setHoverChar(null);
  }, [activeEra]);

  // ── Profil postavy (klik na panovníka) ──
  if (filterRuler) {
    return (
      <div className="relative min-h-full pb-10">
        <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-paper-light/10 bg-[#17140e]/90 px-5 py-3 backdrop-blur md:px-8">
          <button
            onClick={onClearFilter}
            className="inline-flex items-center gap-1.5 rounded-full border border-paper-light/25 bg-black/30 px-4 py-2 font-display text-sm font-bold text-paper-light transition-colors hover:bg-black/55"
          >
            <ChevronLeft className="h-4 w-4" /> Zpět na přehled
          </button>
          <span className="font-display text-sm font-bold text-paper-light/80">{filterRuler.name}</span>
        </div>
        <CharacterProfileView ruler={filterRuler} stories={storiesWithChar(stories, filterRuler)} />
      </div>
    );
  }

  // ── Přehled (varianta C): kompaktní header [preview | PÁS ZÓN] + postavy + karty ──
  return (
    <div className="relative min-h-full pb-16">
      {/* Header — širokoúhlý preview aktivní epochy + PÁS ZÓN (sdílený scrubber/filtr) */}
      <div className="sticky top-0 z-30 border-b border-paper-light/10 bg-[#17140e]/95 px-5 py-4 backdrop-blur md:px-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <button
            onClick={onBackToOsa}
            className="inline-flex items-center gap-1.5 rounded-full border border-paper-light/25 bg-black/30 px-4 py-2 font-display text-sm font-bold text-paper-light transition-colors hover:bg-black/55"
          >
            <ChevronUp className="h-4 w-4" /> Zpět na osu
          </button>
          <span className="font-display text-sm font-bold text-paper-light/80">{activeEra?.name}</span>
        </div>
        {/* PÁS ZÓN — tahový/slide filmstrip; náhled je zabudovaný (aktivní zóna se zvětší vlevo) */}
        <EraSlider key={openSeq} eras={eraList} stories={stories} activeName={activeEra?.name} onPick={setActiveEra} />
      </div>

      {/* Obsah — postavy epochy (navázané) + karty příspěvků */}
      <div className="mx-auto max-w-6xl px-5 py-6 md:px-8">
        {epochChars.length > 0 && (
          <section className="mb-6" onMouseLeave={() => setHoverChar(null)}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h2 className="font-display text-lg font-extrabold">Osobnosti{activeEra ? ` · ${activeEra.name}` : ""}</h2>
              <span className="font-serif text-xs italic text-paper-light/50">
                klikni = filtruj příspěvky · najeď = detail
              </span>
            </div>
            <div className="flex items-start gap-2.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {epochChars.map((c) => (
                <CharChip
                  key={c.slug}
                  c={c}
                  selected={selectedChar?.slug === c.slug}
                  expanded={selectedChar?.slug === c.slug || hoverChar?.slug === c.slug}
                  onHover={() => setHoverChar(c)}
                  onToggle={() => setSelectedChar((prev) => (prev?.slug === c.slug ? null : c))}
                  onDetail={() => onSelectRuler(c)}
                />
              ))}
            </div>
          </section>
        )}

        <h2 className="mb-3 mt-6 flex flex-wrap items-baseline gap-x-2 font-display text-lg font-extrabold">
          {selectedChar ? `Příspěvky · ${selectedChar.name}` : `Příspěvky${activeEra ? ` · ${activeEra.name}` : ""}`}
          <span className="font-serif text-sm font-normal italic text-paper-light/50">· {shown.length}</span>
          {selectedChar && (
            <button
              onClick={() => setSelectedChar(null)}
              className="rounded-full border border-paper-light/25 px-2.5 py-0.5 font-sans text-xs font-medium text-paper-light/70 hover:bg-paper-light/10"
            >
              × zrušit filtr
            </button>
          )}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((s) => (
            <GridCard key={s.id} story={s} onLaunch={onLaunch} />
          ))}
          {shown.length === 0 && (
            <div className="col-span-full py-8 text-center font-serif text-sm italic text-paper-light/50">
              Pro tuto epochu / postavu zatím nemáme příspěvky.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Dlaždice postavy — avatar + jméno + roky. Klik = filtr příspěvků. Při hoveru NEBO
 * výběru se karta plynule rozšíří do šířky a vpravo odhalí detail (kategorie,
 * narození/úmrtí) + tlačítko „Zobrazit detail" → profil.
 */
function CharChip({
  c,
  selected,
  expanded,
  onHover,
  onToggle,
  onDetail,
}: {
  c: Character;
  selected: boolean;
  expanded: boolean;
  onHover: () => void;
  onToggle: () => void;
  onDetail: () => void;
}) {
  const image = figureImage(c);
  const cat = c.category === "ruler" ? c.title ?? "Panovník" : CATEGORY_LABEL[c.category];
  return (
    <div
      role="button"
      tabIndex={0}
      onMouseEnter={onHover}
      onFocus={onHover}
      onClick={onToggle}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onToggle()}
      aria-label={`${c.name} — filtrovat příspěvky`}
      className={
        "flex shrink-0 cursor-pointer items-stretch gap-2 rounded-2xl border-2 p-1.5 transition-colors " +
        (selected
          ? "border-sun bg-sun/15"
          : expanded
          ? "border-sun/60 bg-paper-light/[0.07]"
          : "border-paper-light/15 bg-paper-light/[0.04] hover:border-sun/60")
      }
    >
      {/* Levá část — avatar + jméno + roky (vždy) */}
      <div className="flex w-[72px] shrink-0 flex-col items-center gap-1">
        <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-[radial-gradient(closest-side,#33291a,#17140e)]">
          {image.chroma ? (
            <ChromaImage src={src(image.src)!} alt={c.name} className="absolute left-1/2 top-1 h-[260%] w-auto max-w-none -translate-x-1/2 object-contain" />
          ) : (
            <img src={src(image.src)!} alt={c.name} className="h-full w-full object-cover object-top" />
          )}
        </div>
        <div className="w-full truncate text-center font-display text-[11px] font-bold text-paper-light">{c.name}</div>
        <div className="font-serif text-[10px] italic text-paper-light/50">{lifespanLabel(c)}</div>
      </div>

      {/* Pravá část — rozbalí se plynule při hoveru / výběru */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 184, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="flex h-full w-[176px] flex-col justify-center gap-1 pl-1 pr-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-sun/15 px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wide text-sun">{cat}</span>
                {!c.real && <span className="rounded-full bg-rose-500/15 px-2 py-0.5 font-display text-[10px] font-bold uppercase text-rose-300">fikce</span>}
              </div>
              <div className="font-serif text-[11px] text-paper-light/75">
                {c.bornYear && <span>* {c.bornDate ?? c.bornYear}</span>}
                {c.diedYear && <span>{c.bornYear ? " · " : ""}† {c.diedDate ?? c.diedYear}</span>}
                {!c.bornYear && !c.diedYear && <span>{lifespanLabel(c)}</span>}
                {c.category === "ruler" && <div className="text-paper-light/50">vláda {reignLabel(c)}</div>}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDetail();
                }}
                className="mt-0.5 inline-flex w-max items-center gap-1 rounded-full bg-sun px-2.5 py-1 font-display text-[11px] font-bold text-ink transition-transform hover:-translate-y-0.5"
              >
                <BookOpen className="h-3 w-3" /> Zobrazit detail
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Karta příspěvku v gridu. */
function GridCard({ story, onLaunch }: { story: Story; onLaunch: (slug: string) => void }) {
  const media = cardMedia(story);
  return (
    <button
      onClick={() => onLaunch(story.slug)}
      className="group flex flex-col overflow-hidden rounded-xl border-2 border-paper-light/15 bg-paper-light/5 text-left transition-transform hover:-translate-y-1 hover:border-sun/70"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {media.video ? (
          <video className="h-full w-full object-cover" src={media.src} muted loop playsInline preload="metadata" />
        ) : (
          <div
            className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url("${media.src}")` }}
          />
        )}
        <span className="absolute left-1.5 top-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-bold text-paper-light/85 backdrop-blur-sm">
          {formatYear(story.yearFrom)}
        </span>
        {!story.beats && (
          <span className="absolute right-1.5 top-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[8px] font-bold uppercase text-paper-light/80 backdrop-blur-sm">
            článek
          </span>
        )}
      </div>
      <div className="p-2">
        <div className="line-clamp-2 font-display text-[12px] font-bold leading-tight text-paper-light group-hover:text-sun">
          {story.title}
        </div>
      </div>
    </button>
  );
}

/** Video ve čtverci — přehrává se jen když je aktivní (slow-mo), jinak stojí. */
function SlowVideo({ src, active }: { src: string; active: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.playbackRate = 0.6;
    if (active) v.play().catch(() => {});
    else v.pause();
  }, [active]);
  return (
    <video
      ref={ref}
      className={`absolute inset-0 h-full w-full object-cover ${active ? "kenburns" : ""}`}
      src={src}
      muted
      loop
      playsInline
      preload="metadata"
    />
  );
}
