import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight, Play } from "lucide-react";
import type { Story } from "@/data/stories";
import { formatYear } from "@/lib/history";
import { eraForYear, type Era } from "@/data/eras";

const BASE = import.meta.env.BASE_URL;
const src = (p?: string) => (p ? `${BASE}${p}` : undefined);
const repYear = (s: Story) => (s.yearFrom + s.yearTo) / 2;

// Měřítko osy (proporční podle roku, s omezením prázdných mezer).
const PX_PER_YEAR = 0.5;
const MIN_SEG = 190;
const MAX_SEG = 380;

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
}

/**
 * Kinematická osa — FILMSTRIP jednotlivých příběhů. Vycentrovaný příběh = vybraný;
 * plynule se přelíná do pozadí (Big Picture / TV feel). Pod osou pás epoch (grouping).
 * Ovládání: swipe se setrvačností, kolečko/šipky (rychlost dle scrollu), hover, klik = spustit.
 */
export function StoryTimeline({ countryName, stories, onClose, eras }: StoryTimelineProps) {
  const navigate = useNavigate();
  const stripRef = useRef<HTMLDivElement>(null);
  const [vw, setVw] = useState(0);
  const vwRef = useRef(0);
  const [active, setActive] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [hovered, setHovered] = useState<Story | null>(null);
  const wheelLock = useRef(false);
  const movedRef = useRef(false);
  const x = useMotionValue(0);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setIsMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // Rozložení: střed každého příběhu v px (proporčně dle roku, se zkrácením mezer).
  const layout = useMemo(() => {
    const minSeg = isMobile ? 130 : MIN_SEG;
    const maxSeg = isMobile ? 240 : MAX_SEG;
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

  const nearestTo = useCallback(
    (xv: number) => {
      const target = vwRef.current / 2 - xv;
      let n = 0;
      let best = Infinity;
      layout.centers.forEach((c, i) => {
        const d = Math.abs(c - target);
        if (d < best) {
          best = d;
          n = i;
        }
      });
      return n;
    },
    [layout]
  );

  const goTo = useCallback(
    (i: number) => {
      const idx = Math.max(0, Math.min(stories.length - 1, i));
      animate(x, centerX(idx), { type: "spring", stiffness: 260, damping: 32 });
    },
    [x, centerX, stories.length]
  );

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
    setActive(0);
    setHovered(null);
    x.set(vwRef.current / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stories]);

  useMotionValueEvent(x, "change", (v) => {
    if (!vwRef.current) return;
    const n = nearestTo(v);
    setActive((prev) => (prev === n ? prev : n));
  });

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      setHovered(null);
      if (wheelLock.current) return;
      wheelLock.current = true;
      const dir = e.deltaY > 0 ? 1 : -1;
      const step = Math.min(4, Math.max(1, Math.round(Math.abs(e.deltaY) / 80)));
      goTo(nearestTo(x.get()) + dir * step);
      window.setTimeout(() => (wheelLock.current = false), 90);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [goTo, nearestTo, x]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goTo(nearestTo(x.get()) + 1);
      if (e.key === "ArrowLeft") goTo(nearestTo(x.get()) - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, nearestTo, x, onClose]);

  // Pás epoch (grouping pod osou) — segment přes příběhy dané epochy.
  const eraSegs = useMemo(() => {
    if (!eras || stories.length === 0) return [];
    const half = (isMobile ? 130 : MIN_SEG) / 2;
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
  const focusEra = eras && focusStory ? eraForYear(repYear(focusStory), eras)?.name : undefined;
  const activeEra = eras && centeredStory ? eraForYear(repYear(centeredStory), eras)?.name : undefined;

  const dragMin = vw / 2 - (layout.centers[stories.length - 1] ?? 0);
  const dragMax = vw / 2;
  const bg = focusStory ? bgMedia(focusStory) : null;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#17140e] text-paper-light">
      {/* Pozadí — příběh (plynulý crossfade dle hoveru/středu) */}
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

      {/* Štítek */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-end p-3 md:p-4">
        <span className="rounded-full bg-black/30 px-4 py-2 font-display text-sm font-bold text-paper-light/90 backdrop-blur-sm">
          {countryName} · časová osa
        </span>
      </div>

      {/* Info + Play (nad osou; mění se s pozadím) */}
      {focusStory && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[50%] z-20 px-6 md:px-10">
          <motion.div
            key={focusStory.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="pointer-events-auto max-w-2xl"
          >
            <div className="font-serif text-sm italic text-sun/85">
              {formatYear(focusStory.yearFrom)} · {countryName}
              {focusEra ? ` · ${focusEra}` : ""}
              {!focusStory.beats && <span className="text-paper-light/50"> · článek</span>}
            </div>
            <h2 className="mt-1 font-display text-2xl font-extrabold leading-tight drop-shadow md:text-4xl">
              {focusStory.title}
            </h2>
            <p className="mt-1 line-clamp-2 max-w-xl font-sans text-sm text-paper-light/85 drop-shadow">
              {focusStory.excerpt}
            </p>
            {focusStory.beats ? (
              <button
                onClick={() => launch(focusStory.slug)}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-sun px-5 py-2.5 font-display text-sm font-bold text-ink shadow-sticker transition-transform hover:-translate-y-0.5"
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
                  className="inline-flex items-center gap-2 rounded-full border-2 border-paper-light/25 bg-black/20 px-5 py-2.5 font-display text-sm font-bold text-paper-light backdrop-blur-sm transition-transform hover:-translate-y-0.5"
                >
                  <BookOpen className="h-5 w-5" /> Přečíst článek
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* ---------- OSA (spodní pruh) ---------- */}
      <div ref={stripRef} className="relative z-10 mt-auto h-[46%] overflow-hidden">
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
          dragTransition={{ power: 0.3, timeConstant: 340, modifyTarget: (t) => centerX(nearestTo(t)) }}
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
  const dim = isMobile ? "clamp(58px,17vw,92px)" : "clamp(78px,12vh,132px)";
  const maxScale = isMobile ? 1.35 : 1.4;
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
          width: dim,
          height: dim,
          scale,
          borderColor: isActive ? "#f4c430" : "rgba(253,250,240,.25)",
          transformOrigin: "bottom center",
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
              className="absolute inset-x-0 bottom-0 block p-1.5 text-left font-display text-[10px] font-bold leading-tight text-paper-light drop-shadow line-clamp-2 group-hover:line-clamp-none"
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
