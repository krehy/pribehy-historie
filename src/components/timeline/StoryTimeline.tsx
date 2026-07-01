import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import type { Story } from "@/data/stories";
import { formatRange, formatYear } from "@/lib/history";

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
}

/**
 * Kinematická HORIZONTÁLNÍ osa. Aktivní příběh je vždy uprostřed; přepíná se
 * najetím myší (hover) nebo kliknutím na čtverec — a zůstane vycentrovaný,
 * dokud nenajedeš na jiný. Kolečko / šipky posouvají o krok. Pod osou se
 * fade in/out ukazuje aktivní příspěvek.
 */
export function StoryTimeline({ countryName, stories, onClose }: StoryTimelineProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [vw, setVw] = useState(0);
  const [active, setActive] = useState(0);
  const wheelLock = useRef(false);

  useLayoutEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const measure = () => setVw(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Rozložení osy: střed každé události v px (od 0) + značky zkrácených mezer.
  const layout = useMemo(() => {
    const centers: number[] = [];
    const gaps: { x: number; years: number }[] = [];
    stories.forEach((s, i) => {
      if (i === 0) {
        centers.push(0);
        return;
      }
      const years = repYear(s) - repYear(stories[i - 1]);
      const raw = years * PX_PER_YEAR;
      const seg = Math.max(MIN_SEG, Math.min(MAX_SEG, raw));
      const x = centers[i - 1] + seg;
      centers.push(x);
      if (raw > MAX_SEG) gaps.push({ x: (centers[i - 1] + x) / 2, years: Math.round(years) });
    });
    return { centers, gaps, width: centers[centers.length - 1] ?? 0 };
  }, [stories]);

  const setActiveClamped = useCallback(
    (i: number) => setActive(Math.max(0, Math.min(stories.length - 1, i))),
    [stories.length]
  );

  // Kolečko / šipky / Esc
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      if (wheelLock.current) return;
      wheelLock.current = true;
      setActiveClamped(active + (e.deltaY > 0 ? 1 : -1));
      window.setTimeout(() => (wheelLock.current = false), 260);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [active, setActiveClamped]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setActiveClamped(active + 1);
      if (e.key === "ArrowLeft") setActiveClamped(active - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, setActiveClamped, onClose]);

  // Posun pásu tak, aby aktivní čtverec seděl uprostřed.
  const trackX = vw / 2 - (layout.centers[active] ?? 0);
  const activeStory = stories[active];

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

        {/* posuvný pás (centruje aktivní čtverec) */}
        <motion.div
          className="absolute top-0 h-full"
          style={{ width: layout.width || "100%" }}
          animate={{ x: trackX }}
          transition={{ type: "spring", stiffness: 260, damping: 32 }}
        >
          {/* linka osy */}
          <div className="absolute left-0 right-0 top-[68%] h-[2px] -translate-y-1/2 bg-paper-light/15" />

          {/* značky zkrácených mezer */}
          {layout.gaps.map((g, i) => (
            <div
              key={`gap-${i}`}
              className="absolute top-[68%] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-black/30 px-2 py-0.5 font-sans text-[10px] text-paper-light/40"
              style={{ left: g.x }}
            >
              … {g.years} let
            </div>
          ))}

          {/* čtverce událostí */}
          {stories.map((s, i) => {
            const cx = layout.centers[i] ?? 0;
            const isActive = i === active;
            const mediaSrc = src(s.media);
            return (
              <button
                key={s.id}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                className="absolute top-[68%] z-10 -translate-x-1/2 -translate-y-full pb-3 transition-opacity duration-200"
                style={{ left: cx, opacity: isActive ? 1 : 0.55 }}
              >
                <div
                  className="relative overflow-hidden rounded-2xl border-2 shadow-parchment-lg transition-[transform,border-color] duration-300"
                  style={{
                    width: "clamp(84px,13vh,150px)",
                    height: "clamp(84px,13vh,150px)",
                    transform: `scale(${isActive ? 1.55 : 1})`,
                    borderColor: isActive ? "#f4c430" : "rgba(253,250,240,.25)",
                    transformOrigin: "bottom center",
                  }}
                >
                  {mediaSrc ? (
                    s.mediaType === "video" ? (
                      <SlowVideo src={mediaSrc} active={isActive} />
                    ) : (
                      <div
                        className={`absolute inset-0 bg-cover bg-center ${isActive ? "kenburns" : ""}`}
                        style={{ backgroundImage: `url("${mediaSrc}")` }}
                      />
                    )
                  ) : (
                    <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#3a3220] to-[#17140e] font-display text-sm text-sun/70">
                      {formatYear(s.yearFrom)}
                    </div>
                  )}
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/20" />
                </div>
                <div
                  className={`mt-2 text-center font-display text-xs font-bold transition-colors ${
                    isActive ? "text-sun" : "text-paper-light/50"
                  }`}
                >
                  {formatYear(s.yearFrom)}
                </div>
              </button>
            );
          })}
        </motion.div>

        {/* šipky */}
        {active > 0 && (
          <button
            onClick={() => setActiveClamped(active - 1)}
            aria-label="Předchozí"
            className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 place-items-center rounded-full border border-paper-light/25 bg-black/30 p-2.5 text-paper-light backdrop-blur-sm transition-colors hover:bg-black/50 md:grid"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {active < stories.length - 1 && (
          <button
            onClick={() => setActiveClamped(active + 1)}
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
