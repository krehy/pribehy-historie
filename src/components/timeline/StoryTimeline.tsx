import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import type { Story } from "@/data/stories";
import { formatRange, formatYear } from "@/lib/history";
import { eraNameForYear, type Era } from "@/data/eras";

const BASE = import.meta.env.BASE_URL;
const src = (p?: string) => (p ? `${BASE}${p}` : undefined);

/** Reprezentativní rok (střed rozsahu) — poloha na časové ose. */
const repYear = (s: Story) => (s.yearFrom + s.yearTo) / 2;

// Měřítko osy (proporční podle roku, s omezením prázdných mezer).
const PX_PER_YEAR = 0.5;
const MIN_SEG = 210;
const MAX_SEG = 420;

interface StoryTimelineProps {
  countryName: string;
  stories: Story[];
  onClose: () => void;
  /** Historická období (pás pod osou); volitelné (jen státy s periodizací). */
  eras?: Era[];
}

/**
 * Kinematická HORIZONTÁLNÍ osa. Střed osy = „lupa": kostka uprostřed se PLYNULE
 * zvětšuje podle vzdálenosti od středu. Ovládání: swipe se setrvačností (flick
 * ladně dojíždí a snapne na nejbližší kostku), kolečko/šipky = krok, klik/hover
 * = přejezd na kostku. Pod osou fade-in aktivní příspěvek.
 */
export function StoryTimeline({ countryName, stories, onClose, eras }: StoryTimelineProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [vw, setVw] = useState(0);
  const vwRef = useRef(0);
  const [active, setActive] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const wheelLock = useRef(false);
  const movedRef = useRef(false);

  /** Posun pásu (translateX). Střed obrazovky = vw/2 − x v obsahových souřadnicích. */
  const x = useMotionValue(0);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setIsMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // Rozložení osy: střed každé události v px (od 0) + značky zkrácených mezer.
  const layout = useMemo(() => {
    const minSeg = isMobile ? 150 : MIN_SEG;
    const maxSeg = isMobile ? 280 : MAX_SEG;
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
    return { centers, gaps, width: centers[centers.length - 1] ?? 0 };
  }, [stories, isMobile]);

  // Pás období: rok → x podle stejného (nelineárního) rozložení jako kostky.
  const eraSegs = useMemo(() => {
    if (!eras || stories.length === 0)
      return [] as { name: string; tint: string; left: number; width: number; from: number; to: number }[];
    const ys = stories.map(repYear);
    const xs = layout.centers;
    const last = xs.length - 1;
    const yearToX = (y: number) => {
      if (last === 0) return xs[0];
      if (y <= ys[0]) return xs[0] + (y - ys[0]) * ((xs[1] - xs[0]) / ((ys[1] - ys[0]) || 1));
      if (y >= ys[last])
        return xs[last] + (y - ys[last]) * ((xs[last] - xs[last - 1]) / ((ys[last] - ys[last - 1]) || 1));
      for (let i = 0; i < last; i++) {
        if (y >= ys[i] && y <= ys[i + 1]) {
          const t = (y - ys[i]) / ((ys[i + 1] - ys[i]) || 1);
          return xs[i] + t * (xs[i + 1] - xs[i]);
        }
      }
      return xs[last];
    };
    const pad = (isMobile ? 150 : 210) / 2;
    const lo = xs[0] - pad;
    const hi = xs[last] + pad;
    const clamp = (v: number) => Math.max(lo, Math.min(hi, v));
    return eras
      .map((e) => {
        const l = clamp(yearToX(e.from));
        const r = clamp(yearToX(e.to));
        return { name: e.name, tint: e.tint, left: l, width: Math.max(0, r - l), from: e.from, to: e.to };
      })
      .filter((s) => s.width > 2);
  }, [eras, stories, layout, isMobile]);

  const centerX = useCallback(
    (i: number) => vwRef.current / 2 - (layout.centers[i] ?? 0),
    [layout]
  );

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

  // Měření šířky pásu + prvotní vycentrování.
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

  // Změna země/kraje → reset na první příběh.
  useEffect(() => {
    setActive(0);
    x.set(vwRef.current / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stories]);

  // Aktivní příběh (pro spodní příspěvek) sleduje průběžně střed osy.
  useMotionValueEvent(x, "change", (v) => {
    if (!vwRef.current) return;
    const n = nearestTo(v);
    setActive((prev) => (prev === n ? prev : n));
  });

  // Kolečko = krok
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      if (wheelLock.current) return;
      wheelLock.current = true;
      goTo(nearestTo(x.get()) + (e.deltaY > 0 ? 1 : -1));
      window.setTimeout(() => (wheelLock.current = false), 240);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [goTo, nearestTo, x]);

  // Šipky / Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goTo(nearestTo(x.get()) + 1);
      if (e.key === "ArrowLeft") goTo(nearestTo(x.get()) - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, nearestTo, x, onClose]);

  const activeStory = stories[active];
  const activeEra = eras && activeStory ? eraNameForYear(repYear(activeStory), eras) : undefined;
  const dragMin = vw / 2 - (layout.centers[stories.length - 1] ?? 0);
  const dragMax = vw / 2;

  return (
    <div className="relative flex h-full w-full flex-col bg-[#17140e] text-paper-light">
      {/* Štítek */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-end p-3 md:p-4">
        <span className="rounded-full bg-black/30 px-4 py-2 font-display text-sm font-bold text-paper-light/90 backdrop-blur-sm">
          {countryName} · časová osa
        </span>
      </div>

      {/* ---------- PÁS ---------- */}
      <div ref={stripRef} className="relative h-[58%] shrink-0 overflow-hidden">
        {/* fokus (playhead) uprostřed */}
        <div className="pointer-events-none absolute left-1/2 top-0 z-20 h-full w-px -translate-x-1/2 bg-sun/25" />
        <div className="pointer-events-none absolute left-1/2 top-2 z-20 -translate-x-1/2">
          <div className="h-0 w-0 border-x-[7px] border-t-[9px] border-x-transparent border-t-sun" />
        </div>

        {/* posuvný pás — drag se setrvačností + snap na nejbližší kostku */}
        <motion.div
          className="absolute top-0 h-full cursor-grab active:cursor-grabbing"
          style={{ width: layout.width || "100%", x }}
          drag="x"
          dragConstraints={{ left: dragMin, right: dragMax }}
          dragElastic={0.06}
          dragTransition={{
            power: 0.3,
            timeConstant: 340,
            modifyTarget: (t) => centerX(nearestTo(t)),
          }}
          onPointerDownCapture={() => (movedRef.current = false)}
          onDragStart={() => (movedRef.current = true)}
        >
          {/* linka osy */}
          <div className="absolute left-0 right-0 top-[74%] h-[2px] -translate-y-1/2 bg-paper-light/15" />

          {/* pás historických období (pod osou, scrolluje s pásem) */}
          {eraSegs.map((e, i) => (
            <div
              key={`era-${i}`}
              className="absolute top-[80%] flex h-[15%] items-center justify-between gap-1 overflow-hidden rounded-md border border-white/5 px-1.5"
              style={{ left: e.left, width: e.width, background: e.tint }}
              title={`${e.name} (${e.from}–${e.to === 2025 ? "dnes" : e.to})`}
            >
              <span className="shrink-0 font-sans text-[9px] tabular-nums text-paper-light/55">{e.from}</span>
              <span className="truncate text-center font-display text-[10px] font-bold uppercase tracking-wide text-paper-light/75 md:text-xs">
                {e.name}
              </span>
              <span className="shrink-0 font-sans text-[9px] tabular-nums text-paper-light/55">
                {e.to === 2025 ? "dnes" : e.to}
              </span>
            </div>
          ))}

          {/* značky zkrácených mezer */}
          {layout.gaps.map((g, i) => (
            <div
              key={`gap-${i}`}
              className="absolute top-[74%] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-black/30 px-2 py-0.5 font-sans text-[10px] text-paper-light/40"
              style={{ left: g.x }}
            >
              … {g.years} let
            </div>
          ))}

          {/* kostky událostí (lupa dle vzdálenosti od středu) */}
          {stories.map((s, i) => (
            <LensCard
              key={s.id}
              story={s}
              cx={layout.centers[i] ?? 0}
              x={x}
              vw={vw}
              isMobile={isMobile}
              isActive={i === active}
              onSelect={() => {
                if (movedRef.current) return;
                goTo(i);
              }}
              onHover={() => {
                if (!isMobile) goTo(i);
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

      {/* ---------- AKTIVNÍ PŘÍSPĚVEK (fade in/out) ---------- */}
      <div className="relative flex-1 overflow-hidden border-t border-paper-light/10 bg-black/25">
        <AnimatePresence mode="wait">
          {activeStory && (
            <motion.div
              key={activeStory.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="mx-auto flex h-full max-w-4xl flex-col justify-center px-[clamp(24px,6vw,80px)] py-4"
            >
              <div className="font-serif text-sm italic text-paper-light/60">
                {formatRange(activeStory.yearFrom, activeStory.yearTo)} · {countryName}
                {activeEra && <span className="text-sun/70"> · {activeEra}</span>}
              </div>
              <h2 className="mt-1 font-display text-2xl font-extrabold leading-tight md:text-3xl">
                {activeStory.title}
              </h2>
              <p className="mt-2 line-clamp-2 max-w-2xl font-sans text-sm text-paper-light/80 md:text-base">
                {activeStory.excerpt}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                  to={`/pribeh/${activeStory.slug}`}
                  className="inline-flex items-center gap-2 rounded-full bg-sun px-5 py-2.5 font-display text-sm font-bold text-ink shadow-sticker transition-transform hover:-translate-y-0.5"
                >
                  <BookOpen className="h-4 w-4" /> Číst celý příběh
                </Link>
                <span className="flex flex-wrap gap-1.5">
                  {activeStory.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-paper-light/20 px-2.5 py-0.5 font-sans text-xs text-paper-light/60"
                    >
                      {t}
                    </span>
                  ))}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Jedna kostka — scale/opacity se plynule odvíjí od vzdálenosti jejího středu od středu osy. */
function LensCard({
  story,
  cx,
  x,
  vw,
  isMobile,
  isActive,
  onSelect,
  onHover,
}: {
  story: Story;
  cx: number;
  x: MotionValue<number>;
  vw: number;
  isMobile: boolean;
  isActive: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  const dim = isMobile ? "clamp(60px,19vw,96px)" : "clamp(84px,13vh,150px)";
  const maxScale = isMobile ? 1.5 : 1.55;
  const thresh = (isMobile ? 150 : 210) * 1.35;

  const scale = useTransform(x, (xv) => {
    if (!vw) return isActive ? maxScale : 1;
    const dist = Math.abs(xv + cx - vw / 2);
    const t = Math.max(0, 1 - dist / thresh);
    const e = t * t * (3 - 2 * t); // smoothstep
    return 1 + (maxScale - 1) * e;
  });
  const opacity = useTransform(x, (xv) => {
    if (!vw) return isActive ? 1 : 0.55;
    const dist = Math.abs(xv + cx - vw / 2);
    const t = Math.max(0, 1 - dist / (thresh * 1.7));
    return 0.4 + 0.6 * t;
  });

  const mediaSrc = src(story.media);

  return (
    <motion.button
      onMouseEnter={onHover}
      onFocus={onHover}
      onClick={onSelect}
      className="absolute top-[74%] z-10 -translate-x-1/2 -translate-y-full pb-3"
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
        {mediaSrc ? (
          story.mediaType === "video" ? (
            <SlowVideo src={mediaSrc} active={isActive} />
          ) : (
            <div
              className={`absolute inset-0 bg-cover bg-center ${isActive ? "kenburns" : ""}`}
              style={{ backgroundImage: `url("${mediaSrc}")` }}
            />
          )
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#3a3220] to-[#17140e] font-display text-sm text-sun/70">
            {formatYear(story.yearFrom)}
          </div>
        )}
        <div className="absolute inset-0 ring-1 ring-inset ring-black/20" />
      </motion.div>
      <div
        className={`mt-2 text-center font-display text-xs font-bold transition-colors ${
          isActive ? "text-sun" : "text-paper-light/50"
        }`}
      >
        {formatYear(story.yearFrom)}
      </div>
    </motion.button>
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
