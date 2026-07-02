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
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import type { Story } from "@/data/stories";
import { formatYear } from "@/lib/history";
import { type Era } from "@/data/eras";

const BASE = import.meta.env.BASE_URL;
const src = (p?: string) => (p ? `${BASE}${p}` : undefined);

/** Reprezentativní rok (střed rozsahu). */
const repYear = (s: Story) => (s.yearFrom + s.yearTo) / 2;

/** „Nejlepší" příběh epochy — preferuj kinematický (beaty/hero/médium). */
const score = (s: Story) => (s.beats ? 3 : 0) + (s.hero ? 2 : 0) + (s.media ? 1 : 0);

// Měřítko osy (proporční podle roku, s omezením prázdných mezer).
const PX_PER_YEAR = 0.5;
const MIN_SEG = 210;
const MAX_SEG = 420;

/** Položka osy — v režimu epoch = epocha (s vlajkovým příběhem), jinak jeden příběh. */
interface TItem {
  id: string;
  title: string;
  slug: string;
  media?: string;
  mediaType?: "image" | "video";
  cover: string;
  /** Rok pro pozici na ose. */
  year: number;
  /** Popisek pod kostkou (rozsah epochy nebo rok). */
  label: string;
  /** Název epochy (jen v režimu epoch). */
  epoch?: string;
  epochRange?: string;
  from?: number;
  to?: number;
  tint?: string;
  /** Příběhy pod kostkou (epocha) nebo jeden příběh. */
  stories: Story[];
}

interface StoryTimelineProps {
  countryName: string;
  stories: Story[];
  onClose: () => void;
  /** Historická období — když jsou, osa běží v režimu epoch. */
  eras?: Era[];
}

/**
 * Kinematická HORIZONTÁLNÍ osa. S `eras` běží v REŽIMU EPOCH: kostka = epocha
 * (médium jejího vlajkového příběhu), vycentrovaná odhalí název + Play. Pod osou
 * grid příběhů dané epochy. Ovládání: swipe se setrvačností, kolečko/šipky/klik.
 */
export function StoryTimeline({ countryName, stories, onClose, eras }: StoryTimelineProps) {
  const navigate = useNavigate();
  const stripRef = useRef<HTMLDivElement>(null);
  const [vw, setVw] = useState(0);
  const vwRef = useRef(0);
  const [active, setActive] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [moving, setMoving] = useState(false); // true během pohybu osy (tažení/scroll/anim)
  const movingRef = useRef(false);
  const settleTimer = useRef(0);
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

  // Položky osy — epochy (když eras) nebo jednotlivé příběhy.
  const items: TItem[] = useMemo(() => {
    if (eras) {
      const out: TItem[] = [];
      for (const era of eras) {
        const inEra = stories.filter((s) => {
          const y = repYear(s);
          return y >= era.from && y <= era.to;
        });
        if (!inEra.length) continue;
        const flag = [...inEra].sort((a, b) => score(b) - score(a))[0];
        const range = `${era.from}–${era.to === 2025 ? "dnes" : era.to}`;
        out.push({
          id: `epoch-${era.name}`,
          title: flag.title,
          slug: flag.slug,
          media: flag.media,
          mediaType: flag.mediaType,
          cover: flag.coverImage,
          year: (era.from + era.to) / 2,
          label: "",
          epoch: era.name,
          epochRange: range,
          from: era.from,
          to: era.to,
          tint: era.tint,
          stories: inEra,
        });
      }
      return out.sort((a, b) => a.year - b.year);
    }
    return stories.map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      media: s.media,
      mediaType: s.mediaType,
      cover: s.coverImage,
      year: repYear(s),
      label: formatYear(s.yearFrom),
      stories: [s],
    }));
  }, [eras, stories]);

  // Rozbalená epocha (jen desktop, po usazení) → její zóna se rozšíří na plné karty.
  const CARD_STRIDE = 116;
  const expanded = !moving && items[active]?.epoch ? active : -1;

  // ZÁKLADNÍ rozložení (fyzika osy — scroll/snap/drag). Nezávisí na rozbalení!
  const layout = useMemo(() => {
    const minSeg = isMobile ? 150 : MIN_SEG;
    const maxSeg = isMobile ? 280 : MAX_SEG;
    const centers: number[] = [];
    const gaps: { x: number; years: number }[] = [];
    items.forEach((it, i) => {
      if (i === 0) {
        centers.push(0);
        return;
      }
      const years = it.year - items[i - 1].year;
      const raw = years * PX_PER_YEAR;
      const seg = Math.max(minSeg, Math.min(maxSeg, raw));
      const cx = centers[i - 1] + seg;
      centers.push(cx);
      if (raw > maxSeg) gaps.push({ x: (centers[i - 1] + cx) / 2, years: Math.round(years) });
    });
    return { centers, gaps, width: centers[centers.length - 1] ?? 0 };
  }, [items, isMobile]);

  // VYKRESLOVACÍ centers — základní + vizuální rozšíření rozbalené epochy (nemá vliv na fyziku).
  const renderCenters = useMemo(() => {
    const cs = layout.centers.slice();
    if (expanded >= 0 && items[expanded]?.epoch) {
      const rowW = Math.max(CARD_STRIDE, items[expanded].stories.length * CARD_STRIDE);
      const half = rowW / 2;
      for (let j = 0; j < cs.length; j++) {
        if (j < expanded) cs[j] -= half;
        else if (j > expanded) cs[j] += half;
      }
    }
    return cs;
  }, [layout, expanded, items]);
  const renderWidth = (renderCenters[renderCenters.length - 1] ?? 0) + 500;

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
      const idx = Math.max(0, Math.min(items.length - 1, i));
      animate(x, centerX(idx), { type: "spring", stiffness: 260, damping: 32 });
    },
    [x, centerX, items.length]
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
    x.set(vwRef.current / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stories]);

  useMotionValueEvent(x, "change", (v) => {
    if (!vwRef.current) return;
    const n = nearestTo(v);
    setActive((prev) => (prev === n ? prev : n));
    // Pohyb → sbalit; po ~170 ms klidu → usazeno (rozevře se).
    if (!movingRef.current) {
      movingRef.current = true;
      setMoving(true);
    }
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      movingRef.current = false;
      setMoving(false);
    }, 170);
  });

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      if (wheelLock.current) return;
      wheelLock.current = true;
      // Krok podle rychlosti scrollu: pomalu = po jedné, rychle = víc naráz.
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

  // Pás epoch (jen v režimu epoch) — segment pod každou kostkou, aktivní zvýrazněn.
  const bandSegs = useMemo(() => {
    if (!eras || !items.length || !items[0].epoch)
      return [] as {
        i: number;
        left: number;
        width: number;
        name: string;
        from: number;
        to: number;
        tint: string;
        stories: Story[];
      }[];
    const seg = isMobile ? 150 : MIN_SEG;
    return items.map((it, i) => {
      const c = renderCenters[i] ?? 0;
      const prev = i > 0 ? renderCenters[i - 1] : c - seg;
      const next = i < items.length - 1 ? renderCenters[i + 1] : c + seg;
      const left = (prev + c) / 2;
      const right = (c + next) / 2;
      return {
        i,
        left,
        width: Math.max(0, right - left),
        name: it.epoch!,
        from: it.from!,
        to: it.to!,
        tint: it.tint!,
        stories: it.stories,
      };
    });
  }, [eras, items, renderCenters, isMobile]);

  const launch = (slug: string) => navigate(`/pribeh/${slug}`);
  const dragMin = vw / 2 - (layout.centers[items.length - 1] ?? 0);
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
      <div ref={stripRef} className="relative h-full overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-0 z-20 h-full w-px -translate-x-1/2 bg-sun/25" />
        <div className="pointer-events-none absolute left-1/2 top-2 z-20 -translate-x-1/2">
          <div className="h-0 w-0 border-x-[7px] border-t-[9px] border-x-transparent border-t-sun" />
        </div>

        <motion.div
          className="absolute top-0 h-full cursor-grab active:cursor-grabbing"
          style={{ width: renderWidth || "100%", x }}
          drag="x"
          dragConstraints={{ left: dragMin, right: dragMax }}
          dragElastic={0.06}
          dragTransition={{ power: 0.3, timeConstant: 340, modifyTarget: (t) => centerX(nearestTo(t)) }}
          onPointerDownCapture={() => (movedRef.current = false)}
          onDragStart={() => (movedRef.current = true)}
        >
          {/* linka osy */}
          <div className="absolute left-0 right-0 top-[55%] h-[2px] -translate-y-1/2 bg-paper-light/15" />

          {/* pás epoch — mobil-aktivní = malé kartičky; jinak název/roky (aktivní zvýrazněn) */}
          {bandSegs.map((b) => {
            const on = b.i === active;
            return (
              <div
                key={`band-${b.i}`}
                className={
                  "absolute top-[60%] flex h-[14%] items-center justify-between gap-1 overflow-hidden rounded-md border px-1.5 transition-all duration-300 " +
                  (on ? "border-sun/70 opacity-100 shadow-[0_0_14px_rgba(244,196,48,.35)]" : "border-white/5 opacity-55")
                }
                style={{ left: b.left, width: b.width, background: b.tint }}
                title={`${b.name} (${b.from}–${b.to === 2025 ? "dnes" : b.to})`}
              >
                <span className="shrink-0 font-sans text-[9px] tabular-nums text-paper-light/55">{b.from}</span>
                <span
                  className={
                    "truncate text-center font-display text-[10px] font-bold uppercase tracking-wide md:text-xs " +
                    (on ? "text-sun" : "text-paper-light/70")
                  }
                >
                  {b.name}
                </span>
                <span className="shrink-0 font-sans text-[9px] tabular-nums text-paper-light/55">
                  {b.to === 2025 ? "dnes" : b.to}
                </span>
              </div>
            );
          })}

          {/* značky zkrácených mezer */}
          {layout.gaps.map((g, i) => (
            <div
              key={`gap-${i}`}
              className="absolute top-[55%] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-black/30 px-2 py-0.5 font-sans text-[10px] text-paper-light/40"
              style={{ left: g.x }}
            >
              … {g.years} let
            </div>
          ))}

          {/* kostky (epochy) — rozbalená epocha na desktopu = řada plných karet */}
          {items.map((it, i) =>
            i === expanded ? (
              <EpochRow key={it.id} item={it} cx={renderCenters[i] ?? 0} onLaunch={launch} />
            ) : (
              <LensCard
                key={it.id}
                item={it}
                cx={renderCenters[i] ?? 0}
                x={x}
                vw={vw}
                isMobile={isMobile}
                isActive={i === active}
                onSelect={() => {
                  if (movedRef.current) return;
                  goTo(i);
                }}
                onLaunch={launch}
              />
            )
          )}
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
        {active < items.length - 1 && (
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

/** Rozbalená epocha (desktop) — řada plných karet příběhů, vycentrovaná na `cx`. */
function EpochRow({ item, cx, onLaunch }: { item: TItem; cx: number; onLaunch: (slug: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.82 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="absolute z-20 transition-[left] duration-300"
      style={{ left: cx, bottom: "45%", transformOrigin: "center bottom" }}
    >
      <div className="flex -translate-x-1/2 items-end gap-2">
        {item.stories.map((s) => (
          <button
            key={s.id}
            onClick={(e) => {
              e.stopPropagation();
              onLaunch(s.slug);
            }}
            title={s.title}
            style={{ height: "clamp(96px,22vh,150px)" }}
            className={
              "group relative flex w-[100px] shrink-0 flex-col overflow-hidden rounded-xl border-2 bg-paper-light/5 shadow-parchment-lg transition-transform hover:-translate-y-1 " +
              (s.slug === item.slug ? "border-sun" : "border-paper-light/20")
            }
          >
            <div className="relative flex-1 bg-cover bg-center" style={{ backgroundImage: `url("${s.coverImage}")` }}>
              <span className="absolute left-1 top-1 rounded bg-black/50 px-1 py-0.5 text-[8px] font-bold text-paper-light/85 backdrop-blur-sm">
                {formatYear(s.yearFrom)}
              </span>
              <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-sun/95 text-ink shadow">
                  <Play className="ml-0.5 h-4 w-4 fill-current" />
                </span>
              </span>
            </div>
            <div className="shrink-0 p-1.5">
              <div className="line-clamp-2 text-left font-display text-[10px] font-bold leading-tight text-paper-light group-hover:text-sun">
                {s.title}
              </div>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

/** Náhled jednoho příběhu (video nebo obrázek) — do rotace v kostce. */
function Preview({ story }: { story: Story }) {
  const m = src(story.media);
  if (m && story.mediaType === "video") return <SlowVideo src={m} active />;
  return (
    <div
      className="absolute inset-0 bg-cover bg-center kenburns"
      style={{ backgroundImage: `url("${m ?? story.coverImage}")` }}
    />
  );
}

/** Kostka epochy — lupa dle vzdálenosti od středu; aktivní rotuje náhledy + Play. */
function LensCard({
  item,
  cx,
  x,
  vw,
  isMobile,
  isActive,
  onSelect,
  onLaunch,
}: {
  item: TItem;
  cx: number;
  x: MotionValue<number>;
  vw: number;
  isMobile: boolean;
  isActive: boolean;
  onSelect: () => void;
  onLaunch: (slug: string) => void;
}) {
  const dim = isMobile ? "clamp(56px,16vw,88px)" : "clamp(72px,10.5vh,130px)";
  const maxScale = 1.3;
  const thresh = (isMobile ? 150 : 210) * 1.35;

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
    return 0.4 + 0.6 * t;
  });

  // Rotace náhledů příběhů epochy na aktivní kostce.
  const [pIdx, setPIdx] = useState(0);
  useEffect(() => {
    if (!isActive || item.stories.length <= 1) {
      setPIdx(0);
      return;
    }
    const id = window.setInterval(() => setPIdx((i) => (i + 1) % item.stories.length), 2600);
    return () => window.clearInterval(id);
  }, [isActive, item.stories.length]);

  const current = (isActive ? item.stories[pIdx] : undefined) ?? item.stories[0];
  const staticBg = item.media && item.mediaType !== "video" ? src(item.media) : item.cover;

  return (
    <motion.div
      onClick={() => (isActive ? onLaunch(current.slug) : onSelect())}
      className="absolute top-[55%] z-10 -translate-x-1/2 -translate-y-full cursor-pointer pb-3 transition-[transform,left] duration-300 hover:scale-[1.04]"
      style={{ left: cx, opacity }}
    >
      <motion.div
        className="group relative overflow-hidden rounded-2xl border-2 shadow-parchment-lg transition-colors duration-300"
        style={{
          width: dim,
          height: dim,
          scale,
          borderColor: isActive ? "#f4c430" : "rgba(253,250,240,.25)",
          transformOrigin: "bottom center",
        }}
      >
        {isActive ? (
          <AnimatePresence>
            <motion.div
              key={current.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <Preview story={current} />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${staticBg}")` }} />
        )}

        {/* Overlay na vycentrované kostce: název (vlevo dole) + malý Play (vpravo dole) */}
        {isActive && (
          <>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1.5 p-2">
              <motion.span
                key={current.id + "-t"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="min-w-0 flex-1 text-left font-display text-[11px] font-bold leading-tight text-paper-light drop-shadow line-clamp-2 group-hover:line-clamp-none md:text-sm"
              >
                {current.title}
              </motion.span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLaunch(current.slug);
                }}
                aria-label={`Spustit: ${current.title}`}
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sun/95 text-ink shadow-md transition-transform duration-200 hover:scale-[1.55]"
              >
                <Play className="ml-0.5 h-3 w-3 fill-current" />
              </button>
            </div>
          </>
        )}

        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/20" />
      </motion.div>
      {item.label && (
        <div
          className={`mt-2 text-center font-display text-[11px] font-bold transition-colors ${
            isActive ? "text-sun" : "text-paper-light/50"
          }`}
        >
          {item.label}
        </div>
      )}
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
