import { useMemo, useRef, useState, type RefObject } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useSpring } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { PUBLISHED_STORIES, formatRange } from "@/lib/history";
import { countryName } from "@/data/countries";
import { assetUrl } from "@/lib/assetUrl";
import type { Story } from "@/data/stories";

/**
 * HistoryScroll — dlouhá vertikální časová osa SVĚTA. Uživatel skroluje shora dolů
 * celými dějinami; jak sjíždí, události (příběhy) naskakují po stranách páteře osy.
 * Toto je první nástřel: data se berou z publikovaných příběhů seřazených podle roku,
 * epochy dělí osu na velké kapitoly a plovoucí HUD ukazuje, kde v čase právě jsme.
 */

/** Široká světová periodizace — dělí nekonečný scroll na uchopitelné kapitoly. */
interface WorldEpoch {
  name: string;
  /** Krátký popis do záhlaví kapitoly. */
  blurb: string;
  from: number;
  to: number;
  tint: string;
}

const WORLD_EPOCHS: WorldEpoch[] = [
  { name: "Pravěk", blurb: "Než začaly kroniky", from: -100000, to: -3001, tint: "#6b5636" },
  { name: "Starověk", blurb: "První říše a písmo", from: -3000, to: 499, tint: "#9e7432" },
  { name: "Středověk", blurb: "Katedrály, králové a víra", from: 500, to: 1499, tint: "#7a5c3a" },
  { name: "Novověk", blurb: "Objevy, věda a revoluce", from: 1500, to: 1799, tint: "#5c745c" },
  { name: "Dlouhé 19. století", blurb: "Národy, stroje a impéria", from: 1800, to: 1913, tint: "#586880" },
  { name: "Moderní dějiny", blurb: "Války, ideje a dnešek", from: 1914, to: 3000, tint: "#80525e" },
];

function epochOfYear(year: number): WorldEpoch {
  return WORLD_EPOCHS.find((e) => year >= e.from && year <= e.to) ?? WORLD_EPOCHS[WORLD_EPOCHS.length - 1];
}

function storyImage(s: Story): string {
  return s.media && s.mediaType !== "video" ? assetUrl(s.media)! : s.coverImage;
}

/** Položka osy: buď záhlaví nové epochy, nebo konkrétní událost. */
type Row =
  | { kind: "epoch"; epoch: WorldEpoch; key: string }
  | { kind: "event"; story: Story; side: "left" | "right"; key: string };

interface HistoryScrollProps {
  /**
   * Scrollovací kontejner, když osa nežije přímo v okně (např. overlay v Home).
   * Bez něj se sleduje scroll okna (samostatná stránka /historie).
   */
  containerRef?: RefObject<HTMLElement>;
}

export function HistoryScroll({ containerRef }: HistoryScrollProps = {}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [hud, setHud] = useState<{ epoch: string; year: string }>({
    epoch: WORLD_EPOCHS[0].name,
    year: "",
  });

  // Postup vertikální osy (páteře) podle scrollu — okno, nebo zadaný kontejner.
  const { scrollYProgress } = useScroll({
    container: containerRef,
    target: rootRef,
    offset: ["start start", "end end"],
  });
  const spine = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  // Seřadit všechny publikované příběhy podle počátečního roku a proložit záhlavími epoch.
  const rows: Row[] = useMemo(() => {
    const sorted = [...PUBLISHED_STORIES].sort((a, b) => a.yearFrom - b.yearFrom);
    const out: Row[] = [];
    let currentEpoch = "";
    let eventIdx = 0;
    for (const story of sorted) {
      const ep = epochOfYear(story.yearFrom);
      if (ep.name !== currentEpoch) {
        currentEpoch = ep.name;
        out.push({ kind: "epoch", epoch: ep, key: `epoch-${ep.name}` });
      }
      out.push({
        kind: "event",
        story,
        side: eventIdx % 2 === 0 ? "left" : "right",
        key: `event-${story.id}`,
      });
      eventIdx++;
    }
    return out;
  }, []);

  return (
    <div ref={rootRef} className="relative min-h-full bg-paper pb-40">
      {/* ── Plovoucí HUD: kde v čase právě jsme ── */}
      <div className="pointer-events-none sticky top-20 z-30 flex justify-center px-4">
        <motion.div
          layout
          className="pointer-events-auto flex items-center gap-2 rounded-full border-2 border-ink/10 bg-paper-light/90 px-4 py-1.5 shadow-parchment backdrop-blur-sm"
        >
          <span className="font-display text-sm font-bold text-ink">{hud.epoch}</span>
          {hud.year && (
            <>
              <span className="text-ink/25">·</span>
              <span className="font-serif text-sm italic text-ink-soft">{hud.year}</span>
            </>
          )}
        </motion.div>
      </div>

      {/* ── Úvodní hero kapitola ── */}
      <header className="relative mx-auto flex max-w-3xl flex-col items-center px-6 pt-16 pb-24 text-center md:pt-24">
        <span className="highlight-tag -rotate-1">SKROLUJ DĚJINAMI</span>
        <h1 className="mt-5 text-balance font-display text-5xl font-extrabold leading-[1.05] text-ink md:text-6xl">
          Historie světa
        </h1>
        <p className="mt-5 max-w-xl text-balance text-lg text-ink-soft">
          Jedna dlouhá osa času. Skroluj shora dolů a projdi celé dějiny —
          události naskakují tak, jak se staly, od pravěku až po dnešek.
        </p>
        <motion.div
          className="mt-10 text-ink-soft"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
        >
          <ChevronDown className="h-7 w-7" />
        </motion.div>
      </header>

      {/* ── Osa: páteř + události ── */}
      <div className="relative mx-auto max-w-5xl px-4 pb-24">
        {/* Statická linka páteře (kolej) */}
        <div className="absolute inset-y-0 left-6 w-[3px] -translate-x-1/2 rounded-full bg-ink/10 md:left-1/2" />
        {/* Naplněná páteř podle scrollu */}
        <motion.div
          className="absolute inset-y-0 left-6 w-[3px] -translate-x-1/2 origin-top rounded-full bg-sun md:left-1/2"
          style={{ scaleY: spine }}
        />

        <div className="relative space-y-10 md:space-y-16">
          {rows.map((row) =>
            row.kind === "epoch" ? (
              <EpochHeader key={row.key} epoch={row.epoch} />
            ) : (
              <EventNode
                key={row.key}
                story={row.story}
                side={row.side}
                onEnter={() =>
                  setHud({
                    epoch: epochOfYear(row.story.yearFrom).name,
                    year: formatRange(row.story.yearFrom, row.story.yearTo),
                  })
                }
              />
            )
          )}
        </div>
      </div>

      <footer className="mx-auto max-w-2xl px-6 pb-24 text-center">
        <p className="font-serif text-lg italic text-ink-soft">
          Konec osy — zatím. Další kapitoly dějin přibývají.
        </p>
      </footer>
    </div>
  );
}

/** Velké záhlaví epochy — přes celou šířku, zarovnané k páteři. */
function EpochHeader({ epoch }: { epoch: WorldEpoch }) {
  return (
    <motion.div
      className="relative pl-16 md:pl-0 md:text-center"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20% 0px -20% 0px" }}
      transition={{ duration: 0.5 }}
    >
      {/* Uzel na páteři */}
      <span
        className="absolute left-6 top-3 h-5 w-5 -translate-x-1/2 rounded-full border-4 border-paper md:left-1/2"
        style={{ backgroundColor: epoch.tint }}
      />
      <div className="mt-6 inline-block">
        <span
          className="font-display text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: epoch.tint }}
        >
          Kapitola
        </span>
        <h2 className="font-display text-3xl font-extrabold text-ink md:text-4xl">{epoch.name}</h2>
        <p className="mt-1 font-serif italic text-ink-soft">{epoch.blurb}</p>
      </div>
    </motion.div>
  );
}

/** Jedna událost — kartička po straně páteře, naskočí při vjezdu do záběru. */
function EventNode({
  story,
  side,
  onEnter,
}: {
  story: Story;
  side: "left" | "right";
  onEnter: () => void;
}) {
  const isLeft = side === "left";
  return (
    <motion.div
      className={
        "relative pl-16 md:pl-0 " +
        (isLeft ? "md:pr-[calc(50%+2.5rem)]" : "md:pl-[calc(50%+2.5rem)]")
      }
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
      onViewportEnter={onEnter}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Uzel na páteři */}
      <span className="absolute left-6 top-6 z-10 h-4 w-4 -translate-x-1/2 rounded-full border-4 border-paper bg-sun-deep md:left-1/2" />

      <Link
        to={`/pribeh/${story.slug}`}
        className={
          "group block overflow-hidden rounded-2xl border-2 border-ink/10 bg-paper-light shadow-parchment transition-transform hover:-translate-y-1 hover:border-sun " +
          (isLeft ? "md:text-right" : "")
        }
      >
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={storyImage(story)}
            alt={story.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <span className="absolute left-3 top-3 rounded-full bg-sun px-3 py-1 font-display text-xs font-bold text-ink shadow-sticker">
            {formatRange(story.yearFrom, story.yearTo)}
          </span>
        </div>
        <div className="p-5">
          <span className="font-display text-xs font-bold uppercase tracking-wide text-sun-deep">
            {countryName(story.countryCode)}
          </span>
          <h3 className="mt-1 font-display text-xl font-extrabold leading-tight text-ink group-hover:text-sun-deep">
            {story.title}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm text-ink-soft">{story.excerpt}</p>
          <span
            className={
              "mt-3 inline-flex items-center gap-1 font-display text-sm font-bold text-ink " +
              (isLeft ? "md:flex-row-reverse" : "")
            }
          >
            Číst příběh
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
