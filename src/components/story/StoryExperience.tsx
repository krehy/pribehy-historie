import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "framer-motion";
import {
  ArrowLeft,
  Check,
  X,
  RotateCw,
  Sparkles,
  Trophy,
  RefreshCw,
  Play,
} from "lucide-react";
import type { Story, StoryBeat } from "@/data/stories";
import { countryName } from "@/data/countries";
import { formatRange } from "@/lib/history";
import { rulerBySlug, reignLabel, type Ruler } from "@/data/rulers";
import { ChromaImage } from "./ChromaImage";

const BASE = import.meta.env.BASE_URL;
const url = (p: string) => `${BASE}${p}`;

type QuizBeat = Extract<StoryBeat, { kind: "quiz" }>;

/**
 * Kinematický zážitek příběhu: scény (video / vyklíčovaná postava),
 * flip kartičky „věděli jste?" a na konci dobrovolný interaktivní kvíz.
 */
export function StoryExperience({ story }: { story: Story }) {
  const beats = story.beats ?? [];
  const narrative = beats.filter((b) => b.kind !== "quiz");
  const quiz = beats.filter((b): b is QuizBeat => b.kind === "quiz");
  const characters = (story.characters ?? [])
    .map(rulerBySlug)
    .filter((r): r is Ruler => !!r);
  // Video, které úvodní komponenta „přiveze" jako scroll-scrubované pozadí.
  const introVideoBeat = narrative.find(
    (b): b is Extract<StoryBeat, { kind: "scene" }> => b.kind === "scene" && b.mediaType === "video"
  );
  const introVideo = introVideoBeat ? url(introVideoBeat.media) : undefined;

  const scrollRef = useRef<HTMLDivElement>(null);
  const hero = story.hero;
  // Bez hero → rovnou spuštěno. S hero → čeká na Play.
  const [started, setStarted] = useState(!hero);
  const titleMs = story.title.length * 55;

  // gtw-styl „▶ přehraj si mě" — eased rAF autoscroll příběhem (jako story-runtime.js).
  const auto = useRef<{
    running: boolean;
    raf: number;
    vel: number;
    last: number;
    elapsed: number;
    cleanup?: () => void;
  }>({ running: false, raf: 0, vel: 0, last: 0, elapsed: 0 });
  const [autoPlaying, setAutoPlaying] = useState(false);

  const stopAuto = () => {
    const a = auto.current;
    if (!a.running) return;
    a.running = false;
    if (a.raf) cancelAnimationFrame(a.raf);
    a.cleanup?.();
    a.cleanup = undefined;
    const el = scrollRef.current;
    if (el) el.style.scrollSnapType = "";
    setAutoPlaying(false);
  };

  const startAuto = () => {
    const el = scrollRef.current;
    const a = auto.current;
    if (!el || a.running) return;
    a.running = true;
    a.vel = 0;
    a.last = 0;
    a.elapsed = 0;
    el.style.scrollSnapType = "none"; // ať autoscroll neškube o snap
    setAutoPlaying(true);
    const cancel = () => stopAuto();
    el.addEventListener("wheel", cancel, { passive: true });
    el.addEventListener("touchstart", cancel, { passive: true });
    window.addEventListener("keydown", cancel);
    a.cleanup = () => {
      el.removeEventListener("wheel", cancel);
      el.removeEventListener("touchstart", cancel);
      window.removeEventListener("keydown", cancel);
    };
    const sm = (t: number) => {
      t = Math.max(0, Math.min(1, t));
      return t * t * (3 - 2 * t);
    };
    const step = (ts: number) => {
      if (!a.running) return;
      const dt = a.last ? Math.min(0.05, (ts - a.last) / 1000) : 0.016;
      a.last = ts;
      a.elapsed += dt;
      const max = el.scrollHeight - el.clientHeight;
      const y = el.scrollTop;
      const dEnd = max - y;
      let target = 360 * sm(a.elapsed / 0.9); // jemný rozjezd
      if (dEnd < el.clientHeight * 0.7) target *= Math.max(0, dEnd / (el.clientHeight * 0.7)); // dojezd
      a.vel += (target - a.vel) * Math.min(1, dt * 5);
      if (y >= max - 1 || (dEnd < el.clientHeight * 0.9 && a.vel < 5)) {
        stopAuto();
        return;
      }
      el.scrollTop = Math.min(y + a.vel * dt, max);
      a.raf = requestAnimationFrame(step);
    };
    a.raf = requestAnimationFrame(step);
  };

  useEffect(() => () => stopAuto(), []);

  // Po dohrání hero videa plynule „přejmi" na první sekci (úvod postav, jinak 1. beat).
  const heroDone = useRef(false);
  const scrollToFirstBeat = () => {
    if (heroDone.current) return;
    heroDone.current = true;
    const root = scrollRef.current;
    const el = (root?.querySelector("[data-intro]") ??
      root?.querySelector('[data-beat="0"]')) as HTMLElement | null;
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      ref={scrollRef}
      className="fixed inset-0 z-[60] snap-y snap-proximity scroll-smooth overflow-y-auto overflow-x-hidden bg-[#17140e] text-paper-light"
    >
      {/* Zpět */}
      <div className="fixed left-4 top-4 z-50">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-paper-light/25 bg-black/30 px-4 py-2 font-display text-sm font-bold text-paper-light backdrop-blur-sm transition-colors hover:bg-black/50"
        >
          <ArrowLeft className="h-4 w-4" /> Zpět na mapu
        </Link>
      </div>

      {/* gtw-styl „přehraj si mě" — sám plynule proscrolluje příběhem */}
      {started && (
        <button
          type="button"
          onClick={autoPlaying ? stopAuto : startAuto}
          className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-sun/90 px-5 py-2.5 font-display text-sm font-bold text-ink shadow-sticker backdrop-blur-sm transition-transform hover:-translate-y-0.5"
        >
          {autoPlaying ? (
            <>
              <span className="text-base leading-none">⏸</span> Pauza
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-ink" /> Přehraj si příběh
            </>
          )}
        </button>
      )}

      {/* Hero — tajemný poster + Play → vypsání nadpisu → text → video */}
      <header className="relative flex min-h-screen snap-start flex-col items-center justify-center overflow-hidden px-6 text-center">
        {hero ? (
          <div className="absolute inset-0">
            {hero.mediaType === "video" ? (
              <HeroVideo
                src={url(hero.media)}
                play={started}
                poster={hero.poster ? url(hero.poster) : undefined}
                onEnded={scrollToFirstBeat}
              />
            ) : (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url("${url(hero.media)}")` }}
              />
            )}
            <div
              className={`absolute inset-0 transition-colors duration-[1200ms] ${
                started ? "bg-black/45" : "bg-black/75"
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#17140e] via-transparent to-[#17140e]/50" />
            <Sparks />
            {started && <SmokeOverlay />}
          </div>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,#3a3220,#17140e)]" />
        )}

        <div className="relative z-10 max-w-3xl">
          {!started ? (
            <motion.button
              type="button"
              onClick={() => setStarted(true)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="group flex flex-col items-center gap-5"
            >
              <span className="grid h-20 w-20 place-items-center rounded-full bg-sun text-ink shadow-[0_0_60px_rgba(244,196,48,.5)] transition-transform group-hover:scale-110">
                <Play className="h-8 w-8 translate-x-0.5 fill-ink" />
              </span>
              <span className="font-serif text-lg italic text-paper-light/80">
                {hero?.eyebrow ?? "Spustit příběh"}
              </span>
            </motion.button>
          ) : (
            <>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="font-serif text-lg italic text-sun/80"
              >
                {formatRange(story.yearFrom, story.yearTo)} · {countryName(story.countryCode)}
              </motion.span>
              <TypeTitle
                text={story.title}
                className="mt-3 font-display text-4xl font-black leading-tight md:text-6xl"
              />
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: titleMs / 1000 + 0.2, duration: 0.8 }}
                className="mx-auto mt-5 max-w-2xl font-sans text-lg text-paper-light/85"
              >
                {story.excerpt}
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: titleMs / 1000 + 1, duration: 0.8 }}
                className="mt-8 animate-bounce text-paper-light/50"
              >
                ↓ scrolluj
              </motion.div>
            </>
          )}
        </div>
      </header>

      {/* Představení postav příběhu (napojeno na Ruler entitu) */}
      {characters.map((c, i) =>
        i === 0 && introVideo ? (
          <CharacterIntroCinematic key={c.slug} ruler={c} scrollRef={scrollRef} videoSrc={introVideo} />
        ) : (
          <CharacterCard key={c.slug} ruler={c} index={i} first={i === 0} />
        )
      )}

      {/* Narativní beaty */}
      {narrative.map((beat, i) =>
        beat.kind === "scene" ? (
          <SceneBeat key={i} beat={beat} index={i} />
        ) : beat.kind === "scrub" ? (
          <ScrubVideoBeat key={i} beat={beat} scrollRef={scrollRef} />
        ) : (
          <FlipBeat key={i} beat={beat} />
        )
      )}

      {/* Dobrovolný kvíz */}
      {quiz.length > 0 && (
        <QuizSection questions={quiz} storyTitle={story.title} scrollRef={scrollRef} />
      )}

      {/* Uzávěr */}
      <footer className="flex min-h-[60vh] snap-start flex-col items-center justify-center px-6 py-20 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-sun px-7 py-3 font-display text-base font-bold text-ink shadow-sticker transition-transform hover:-translate-y-0.5"
        >
          <ArrowLeft className="h-4 w-4" /> Zpět na mapu
        </Link>
      </footer>
    </div>
  );
}

/* ---------------- Scéna ---------------- */

function SceneBeat({
  beat,
  index,
}: {
  beat: Extract<StoryBeat, { kind: "scene" }>;
  index: number;
}) {
  const flip = index % 2 === 1; // střídání strany textu
  return (
    <section
      data-beat={index}
      className="relative flex min-h-screen snap-start items-stretch overflow-hidden"
    >
      {beat.enter === "stars" && <StarSweep />}
      {beat.chroma ? (
        // Vyklíčovaná postava na pergamenovém pozadí
        <div className="relative flex w-full flex-col items-center gap-6 bg-[radial-gradient(120%_100%_at_50%_30%,#4a3f26,#17140e)] px-6 py-16 md:flex-row md:justify-center md:gap-14 md:px-16">
          <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background:repeating-linear-gradient(90deg,#fff_0,#fff_1px,transparent_1px,transparent_46px)]" />
          <MoodOverlay mood={beat.mood} />
          <ChromaFigure src={url(beat.media)} alt={beat.title} float={beat.float} />
          <BeatText beat={beat} className="relative z-10 max-w-md text-center md:text-left" />
        </div>
      ) : (
        <>
          {/* Médium přes celou plochu */}
          <div className="absolute inset-0">
            {beat.mediaType === "video" ? (
              <SceneVideo src={url(beat.media)} />
            ) : (
              <div
                className="kenburns-loop absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url("${url(beat.media)}")` }}
              />
            )}
            <div
              className={`absolute inset-0 ${
                flip
                  ? "bg-gradient-to-l from-black/85 via-black/40 to-transparent"
                  : "bg-gradient-to-r from-black/85 via-black/40 to-transparent"
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#17140e] via-transparent to-transparent" />
            <MoodOverlay mood={beat.mood} />
          </div>
          <div
            className={`relative z-10 flex w-full items-center px-6 py-16 md:px-16 ${
              flip ? "justify-end" : "justify-start"
            }`}
          >
            <BeatText beat={beat} className="max-w-lg" />
          </div>
        </>
      )}
    </section>
  );
}

function BeatText({
  beat,
  className = "",
}: {
  beat: Extract<StoryBeat, { kind: "scene" }>;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {beat.title && (
        <h2 className="font-display text-3xl font-extrabold leading-tight md:text-5xl">
          {beat.title}
        </h2>
      )}
      {beat.text && (
        <p className="mt-4 font-sans text-lg leading-relaxed text-paper-light/85">
          {beat.text}
        </p>
      )}
      {beat.credit && (
        <p className="mt-4 font-sans text-xs text-paper-light/40">{beat.credit}</p>
      )}
    </motion.div>
  );
}

function SceneVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.playbackRate = 0.7;
  }, []);
  return (
    <video
      ref={ref}
      className="absolute inset-0 h-full w-full object-cover"
      src={src}
      autoPlay
      muted
      loop
      playsInline
    />
  );
}

/** Vyklíčovaná postava — vstup zespoda; s `float` trvale levituje (záře + stín). */
function ChromaFigure({ src, alt, float }: { src: string; alt?: string; float?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 64, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 flex flex-col items-center"
    >
      <motion.div
        className="relative"
        animate={float ? { y: [0, -16, 0] } : undefined}
        transition={float ? { duration: 5.5, repeat: Infinity, ease: "easeInOut" } : undefined}
      >
        {float && (
          <div className="pointer-events-none absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(closest-side,rgba(150,132,235,.4),transparent)] blur-2xl" />
        )}
        <ChromaImage
          src={src}
          alt={alt}
          className="max-h-[62vh] w-auto drop-shadow-[0_20px_50px_rgba(0,0,0,.6)]"
        />
      </motion.div>
      {float && (
        <motion.div
          className="mt-3 h-3 w-2/3 rounded-[100%] bg-black/55 blur-md"
          animate={{ scaleX: [1, 0.8, 1], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
}

/** Hvězdný přelet — při vstupu sekce prolétnou/rozsvítí se hvězdy (efekt „podle hvězd"). */
function StarSweep() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-[3] overflow-hidden"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
    >
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_38%,rgba(123,108,196,.3),transparent_70%)]"
        variants={{ hidden: { opacity: 0 }, show: { opacity: [0, 1, 0.45] } }}
        transition={{ duration: 1.8, ease: "easeOut" }}
      />
      {Array.from({ length: 44 }).map((_, i) => (
        <motion.i
          key={i}
          className="absolute block h-[3px] w-[3px] rounded-full bg-[#e9ddff]"
          style={{
            left: `${(i * 8.7) % 100}%`,
            top: `${(i * 13.3) % 100}%`,
            boxShadow: "0 0 7px #cdbfff",
          }}
          variants={{
            hidden: { opacity: 0, scale: 0 },
            show: { opacity: [0, 1, 0.65], scale: [0, 1.6, 1] },
          }}
          transition={{ duration: 1.1, delay: (i % 12) * 0.07, ease: "easeOut" }}
        />
      ))}
    </motion.div>
  );
}

/* ---------------- Představení postavy ---------------- */

/** Textový blok postavy — eyebrow, jméno, titul·vláda·rod, bio, fakta, hláška. */
function RulerInfo({ ruler }: { ruler: Ruler }) {
  const reign = reignLabel(ruler);
  return (
    <>
      <span className="inline-flex items-center gap-2 rounded-full bg-sun/15 px-3 py-1 font-display text-xs font-bold uppercase tracking-wide text-sun">
        <Sparkles className="h-3.5 w-3.5" /> Postava příběhu
      </span>
      <h2 className="mt-4 font-display text-4xl font-black leading-tight md:text-5xl">{ruler.name}</h2>
      <div className="mt-2 font-serif text-lg italic text-sun/80">
        {ruler.title} · {reign}
        {ruler.house ? ` · ${ruler.house}` : ""}
      </div>
      {ruler.bio && <p className="mt-4 font-sans text-lg leading-relaxed text-paper-light/85">{ruler.bio}</p>}
      {ruler.facts && ruler.facts.length > 0 && (
        <ul className="mt-5 space-y-2.5 text-left">
          {ruler.facts.map((f, fi) => (
            <li key={fi} className="flex items-start gap-2.5 font-sans text-paper-light/80">
              <Sparkles className="mt-1 h-4 w-4 shrink-0 text-sun/70" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
      {ruler.quotes?.[0] && (
        <p className="mt-5 border-l-2 border-sun/40 pl-4 font-serif text-lg italic text-paper-light/70">
          „{ruler.quotes[0]}“
        </p>
      )}
    </>
  );
}

/** Fullscreen představení postavy příběhu (Ruler) — figura + fakta/hlášky (gtw styl). */
function CharacterCard({ ruler, index, first }: { ruler: Ruler; index: number; first?: boolean }) {
  const flip = index % 2 === 1;
  const reign = reignLabel(ruler);
  return (
    <section
      {...(first ? { "data-intro": "" } : {})}
      className="relative flex min-h-screen snap-start items-center overflow-hidden bg-[radial-gradient(120%_100%_at_50%_20%,#2a2416,#17140e)] px-6 py-16 md:px-16"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.10] [background:repeating-linear-gradient(90deg,#fff_0,#fff_1px,transparent_1px,transparent_46px)]" />
      <div
        className={`relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-8 md:gap-14 ${
          flip ? "md:flex-row-reverse" : "md:flex-row"
        }`}
      >
        {/* figura */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative shrink-0"
        >
          <div className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-[radial-gradient(closest-side,rgba(244,196,48,.22),transparent)] blur-2xl" />
          <ChromaImage
            src={url(ruler.character)}
            alt={ruler.name}
            className="max-h-[52vh] w-auto drop-shadow-[0_20px_50px_rgba(0,0,0,.6)]"
          />
        </motion.div>

        {/* karta faktů */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="max-w-md text-center md:text-left"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-sun/15 px-3 py-1 font-display text-xs font-bold uppercase tracking-wide text-sun">
            <Sparkles className="h-3.5 w-3.5" /> Postava příběhu
          </span>
          <h2 className="mt-4 font-display text-4xl font-black leading-tight md:text-5xl">{ruler.name}</h2>
          <div className="mt-2 font-serif text-lg italic text-sun/80">
            {ruler.title} · {reign}
            {ruler.house ? ` · ${ruler.house}` : ""}
          </div>
          {ruler.bio && (
            <p className="mt-4 font-sans text-lg leading-relaxed text-paper-light/85">{ruler.bio}</p>
          )}
          {ruler.facts && ruler.facts.length > 0 && (
            <ul className="mt-5 space-y-2.5 text-left">
              {ruler.facts.map((f, fi) => (
                <motion.li
                  key={fi}
                  initial={{ opacity: 0, x: -14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.4, delay: 0.3 + fi * 0.1 }}
                  className="flex items-start gap-2.5 font-sans text-paper-light/80"
                >
                  <Sparkles className="mt-1 h-4 w-4 shrink-0 text-sun/70" />
                  <span>{f}</span>
                </motion.li>
              ))}
            </ul>
          )}
          {ruler.quotes?.[0] && (
            <p className="mt-5 border-l-2 border-sun/40 pl-4 font-serif text-lg italic text-paper-light/70">
              „{ruler.quotes[0]}“
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Kinematický úvod postavy (gtw styl) — komponenta „projede" scrollem nahoru a
 * s sebou přiveze scroll-scrubované video pozadí, které plynule naváže na příběh.
 * Přišpendlená (sticky) sekce; scroll řídí odchod karty i přehrávání videa.
 */
function CharacterIntroCinematic({
  ruler,
  scrollRef,
  videoSrc,
}: {
  ruler: Ruler;
  scrollRef: React.RefObject<HTMLDivElement>;
  videoSrc: string;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollYProgress } = useScroll({
    container: scrollRef,
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const v = videoRef.current;
    if (v && v.duration && !Number.isNaN(v.duration)) {
      const t = Math.max(0, Math.min(0.999, (p - 0.5) / 0.5)) * v.duration;
      if (Math.abs(v.currentTime - t) > 0.02) {
        try {
          v.currentTime = t;
        } catch {
          /* seek zatím nejde */
        }
      }
    }
  });

  const stripesOpacity = useTransform(scrollYProgress, [0.32, 0.55], [1, 0]);
  const videoOpacity = useTransform(scrollYProgress, [0.4, 0.62], [0, 1]);
  const cardY = useTransform(scrollYProgress, [0, 0.5], [0, -180]);
  const cardOpacity = useTransform(scrollYProgress, [0.3, 0.5], [1, 0]);
  const figureY = useTransform(scrollYProgress, [0, 0.5], [0, -320]);
  const figureScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.72]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  return (
    <section ref={sectionRef} data-intro="" className="relative snap-align-none" style={{ height: "260vh" }}>
      <div className="sticky top-0 h-screen overflow-hidden bg-[#17140e]">
        {/* scroll-video pozadí — „přiveze ho" komponenta, scrubuje se scrollem */}
        <motion.video
          ref={videoRef}
          style={{ opacity: videoOpacity }}
          className="absolute inset-0 h-full w-full object-cover"
          src={videoSrc}
          muted
          playsInline
          preload="auto"
        />
        <motion.div
          style={{ opacity: videoOpacity }}
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#17140e] via-[#17140e]/30 to-[#17140e]/60"
        />

        {/* pergamenové pozadí pod kartou (mizí, jak najíždí video) */}
        <motion.div
          style={{ opacity: stripesOpacity }}
          className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_20%,#2a2416,#17140e)]"
        >
          <div className="pointer-events-none absolute inset-0 opacity-[0.10] [background:repeating-linear-gradient(90deg,#fff_0,#fff_1px,transparent_1px,transparent_46px)]" />
        </motion.div>

        {/* Karel komponenta — „projede" scrollem nahoru a odplyne */}
        <div className="absolute inset-0 flex items-center px-6 md:px-16">
          <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-8 md:flex-row md:gap-14">
            <motion.div style={{ y: figureY, scale: figureScale }} className="relative shrink-0">
              <div className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-[radial-gradient(closest-side,rgba(244,196,48,.22),transparent)] blur-2xl" />
              <ChromaImage
                src={url(ruler.character)}
                alt={ruler.name}
                className="max-h-[52vh] w-auto drop-shadow-[0_20px_50px_rgba(0,0,0,.6)]"
              />
            </motion.div>
            <motion.div style={{ y: cardY, opacity: cardOpacity }} className="max-w-md text-center md:text-left">
              <RulerInfo ruler={ruler} />
            </motion.div>
          </div>
        </div>

        <motion.div
          style={{ opacity: hintOpacity }}
          className="pointer-events-none absolute inset-x-0 bottom-6 z-20 text-center font-sans text-sm text-paper-light/50"
        >
          ↓ scrolluj — Karel tě provede
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- Hero: typewriter, video, nálada ---------------- */

/** Nadpis, který se „vypíše" znak po znaku. */
function TypeTitle({ text, className }: { text: string; className?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const id = window.setInterval(() => {
      setN((v) => {
        if (v >= text.length) {
          window.clearInterval(id);
          return v;
        }
        return v + 1;
      });
    }, 55);
    return () => window.clearInterval(id);
  }, [text]);
  const done = n >= text.length;
  return (
    <h1 className={className}>
      {text.slice(0, n)}
      {!done && <span className="text-sun opacity-80">▍</span>}
    </h1>
  );
}

/** Video na pozadí hero — přehraje se JEDNOU po Play (slow-mo); po dohrání `onEnded`. */
function HeroVideo({
  src,
  play,
  poster,
  onEnded,
}: {
  src: string;
  play: boolean;
  poster?: string;
  onEnded?: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.playbackRate = 0.5;
    if (play) v.play().catch(() => {});
    else v.pause();
  }, [play]);
  return (
    <video
      ref={ref}
      className="absolute inset-0 h-full w-full scale-105 object-cover"
      src={src}
      poster={poster}
      muted
      playsInline
      preload="auto"
      onEnded={onEnded}
    />
  );
}

/** Barevné nálady beatů (nádech + vinětace). */
const MOODS: Record<
  NonNullable<Extract<StoryBeat, { kind: "scene" }>["mood"]>,
  { grad: string; vignette: string; sparks?: string }
> = {
  dawn: {
    grad: "radial-gradient(120% 90% at 50% 12%, rgba(255,196,84,.26), transparent 60%)",
    vignette: "rgba(60,40,10,.5)",
    sparks: "#f4c430",
  },
  mystic: {
    grad: "radial-gradient(120% 100% at 50% 40%, rgba(123,108,196,.28), rgba(20,16,32,.45) 72%)",
    vignette: "rgba(20,14,44,.6)",
    sparks: "#e6c879",
  },
  day: {
    grad: "radial-gradient(120% 90% at 50% 18%, rgba(255,236,182,.14), transparent 62%)",
    vignette: "rgba(40,30,10,.34)",
  },
  night: {
    grad: "radial-gradient(120% 100% at 50% 18%, rgba(46,66,128,.36), rgba(6,8,22,.6) 72%)",
    vignette: "rgba(4,6,22,.7)",
    sparks: "#bcd0ff",
  },
};

function MoodOverlay({ mood }: { mood?: Extract<StoryBeat, { kind: "scene" }>["mood"] }) {
  if (!mood) return null;
  const m = MOODS[mood];
  return (
    <div className="pointer-events-none absolute inset-0 z-[2]">
      <div className="absolute inset-0" style={{ background: m.grad }} />
      <div className="absolute inset-0" style={{ boxShadow: `inset 0 0 220px 70px ${m.vignette}` }} />
      {m.sparks && <Sparks color={m.sparks} />}
    </div>
  );
}

/** Kouřový overlay — po spuštění se přes scénu převalí driftující chuchvalce kouře. */
function SmokeOverlay() {
  const puffs = [
    { size: "70vw", top: "8%", dur: 15, delay: 0, o: 0.5 },
    { size: "55vw", top: "38%", dur: 19, delay: 2, o: 0.42 },
    { size: "80vw", top: "62%", dur: 17, delay: 1, o: 0.55 },
    { size: "45vw", top: "22%", dur: 22, delay: 4, o: 0.35 },
    { size: "60vw", top: "78%", dur: 20, delay: 3, o: 0.48 },
  ];
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-[6] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.4, ease: "easeOut" }}
    >
      {puffs.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-[60px]"
          style={{
            width: p.size,
            height: p.size,
            top: p.top,
            background: `radial-gradient(closest-side, rgba(226,220,210,${p.o}), rgba(226,220,210,0) 70%)`,
          }}
          initial={{ left: "-40%", scale: 0.8, opacity: 0 }}
          animate={{ left: ["-40%", "120%"], scale: [0.8, 1.35, 1.1], opacity: [0, p.o, p.o * 0.6, 0] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </motion.div>
  );
}

/** Vylétající částice (prach / jiskry). */
function Sparks({ color = "#f4c430" }: { color?: string }) {
  return (
    <div className="sparks">
      {Array.from({ length: 14 }).map((_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 7.1) % 100}%`,
            animationDelay: `${(i * 0.6) % 8}s`,
            animationDuration: `${7 + (i % 4)}s`,
            background: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      ))}
    </div>
  );
}

/* ---------------- Scrollem scrubované video (pinned) ---------------- */

function ScrubVideoBeat({
  beat,
  scrollRef,
}: {
  beat: Extract<StoryBeat, { kind: "scrub" }>;
  scrollRef: React.RefObject<HTMLDivElement>;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    container: scrollRef,
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const v = videoRef.current;
    if (v && v.duration && !Number.isNaN(v.duration)) {
      const t = Math.max(0, Math.min(0.999, p)) * v.duration;
      // Seek jen při znatelné změně (scrub) — video se nepřehrává samo.
      if (Math.abs(v.currentTime - t) > 0.02) {
        try {
          v.currentTime = t;
        } catch {
          /* seek ještě není možný */
        }
      }
    }
    let idx = 0;
    beat.captions.forEach((c, i) => {
      if (p >= c.at - 0.0001) idx = i;
    });
    setActive(idx);
  });

  const cap = beat.captions[active];

  return (
    <section
      ref={sectionRef}
      className="relative snap-align-none"
      style={{ height: `${beat.captions.length * 95 + 40}vh` }}
    >
      <div className="sticky top-0 flex h-screen items-end overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={url(beat.media)}
          muted
          playsInline
          preload="auto"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40" />
        <MoodOverlay mood={beat.mood} />

        {/* naskakující titulky „drží na videu" */}
        <div className="relative z-10 w-full px-6 pb-24 md:px-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-xl"
            >
              {cap.title && (
                <h2 className="font-display text-3xl font-extrabold leading-tight md:text-5xl">
                  {cap.title}
                </h2>
              )}
              <p className="mt-3 font-sans text-lg leading-relaxed text-paper-light/85">
                {cap.text}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* postup */}
        <div className="absolute right-5 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2">
          {beat.captions.map((_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === active ? "bg-sun" : "bg-paper-light/30"
              }`}
            />
          ))}
        </div>

        <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-black/30 px-3 py-1 font-sans text-xs text-paper-light/60 backdrop-blur-sm">
          ↓ scrolluj — video jede s tebou
        </div>
        {beat.credit && (
          <span className="absolute bottom-4 right-4 z-10 font-sans text-[11px] text-paper-light/40">
            {beat.credit}
          </span>
        )}
      </div>
    </section>
  );
}

/* ---------------- Flip kartička ---------------- */

function FlipBeat({ beat }: { beat: Extract<StoryBeat, { kind: "flip" }> }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <section className="flex min-h-screen snap-start items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl"
      >
      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        className={`flip-card h-64 w-full text-left ${flipped ? "flipped" : ""}`}
      >
        <div className="flip-inner">
          {/* Přední strana */}
          <div className="flip-face flex flex-col justify-between rounded-3xl border-2 border-sun/40 bg-gradient-to-br from-[#2a2416] to-[#17140e] p-8 shadow-parchment-lg">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-sun/15 px-3 py-1 font-display text-xs font-bold uppercase tracking-wide text-sun">
              <Sparkles className="h-3.5 w-3.5" /> Věděli jste?
            </span>
            <span className="font-display text-2xl font-extrabold leading-snug md:text-3xl">
              {beat.front}
            </span>
            <span className="inline-flex items-center gap-2 font-sans text-sm text-paper-light/55">
              <RotateCw className="h-4 w-4" /> Klikni a otoč kartu
            </span>
          </div>
          {/* Zadní strana */}
          <div className="flip-face flip-back flex flex-col justify-center rounded-3xl border-2 border-sun bg-gradient-to-br from-[#3a3220] to-[#221c10] p-8 shadow-parchment-lg">
            <p className="font-sans text-lg leading-relaxed text-paper-light">
              {beat.back}
            </p>
            <span className="mt-5 inline-flex items-center gap-2 font-sans text-sm text-sun/70">
              <RotateCw className="h-4 w-4" /> Zpět
            </span>
          </div>
        </div>
      </button>
      </motion.div>
    </section>
  );
}

/* ---------------- Kvíz ---------------- */

function QuizSection({
  questions,
  storyTitle,
  scrollRef,
}: {
  questions: QuizBeat[];
  storyTitle: string;
  scrollRef: React.RefObject<HTMLDivElement>;
}) {
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  // Interakce v kvízu jinak resetují scroll přišpendleného overlaye → uložíme
  // pozici před změnou stavu a po překreslení ji obnovíme.
  const savedScroll = useRef<number | null>(null);
  const keepScroll = () => {
    savedScroll.current = scrollRef.current?.scrollTop ?? null;
  };
  useLayoutEffect(() => {
    if (savedScroll.current != null && scrollRef.current) {
      scrollRef.current.scrollTop = savedScroll.current;
      savedScroll.current = null;
    }
  });

  const q = questions[idx];
  const total = questions.length;

  const pick = (i: number) => {
    if (picked !== null) return;
    keepScroll();
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
  };
  const next = () => {
    keepScroll();
    if (idx + 1 >= total) {
      setDone(true);
    } else {
      setIdx((v) => v + 1);
      setPicked(null);
    }
  };
  const restart = () => {
    keepScroll();
    setIdx(0);
    setPicked(null);
    setScore(0);
    setDone(false);
    setStarted(true);
  };

  return (
    <section className="flex min-h-screen snap-start items-center justify-center px-6 py-20">
      <div className="w-full max-w-2xl">
        {/* Opt-in */}
        {!started && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border-2 border-sun/30 bg-gradient-to-br from-[#2a2416] to-[#17140e] p-10 text-center shadow-parchment-lg"
          >
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sun/15 text-sun">
              <Trophy className="h-8 w-8" />
            </div>
            <h2 className="mt-5 font-display text-3xl font-extrabold">
              Vyzkoušej se!
            </h2>
            <p className="mx-auto mt-3 max-w-md font-sans text-paper-light/75">
              Dobrovolný kvíz — {total}{" "}
              {total === 1 ? "otázka" : total < 5 ? "otázky" : "otázek"} z toho, co
              ses právě dozvěděl o příběhu „{storyTitle}".
            </p>
            <button
              type="button"
              onClick={() => {
                keepScroll();
                setStarted(true);
              }}
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-sun px-7 py-3 font-display text-base font-bold text-ink shadow-sticker transition-transform hover:-translate-y-0.5"
            >
              <Sparkles className="h-4 w-4" /> Spustit kvíz
            </button>
          </motion.div>
        )}

        {/* Průběh */}
        {started && !done && (
          <div className="rounded-3xl border-2 border-paper-light/15 bg-gradient-to-br from-[#231d12] to-[#17140e] p-8 shadow-parchment-lg md:p-10">
            <div className="flex items-center justify-between font-display text-sm text-paper-light/50">
              <span>
                Otázka {idx + 1} / {total}
              </span>
              <span>Skóre {score}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-paper-light/10">
              <div
                className="h-full rounded-full bg-sun transition-all"
                style={{ width: `${((idx + (picked !== null ? 1 : 0)) / total) * 100}%` }}
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="mt-6 font-display text-2xl font-extrabold leading-snug md:text-3xl">
                  {q.question}
                </h3>
                <div className="mt-6 space-y-3">
                  {q.options.map((opt, i) => {
                    const isAnswer = i === q.answer;
                    const isPicked = i === picked;
                    const reveal = picked !== null;
                    let cls =
                      "border-paper-light/20 bg-black/20 hover:border-sun/60 hover:bg-black/40";
                    if (reveal && isAnswer)
                      cls = "border-teal bg-teal/20 text-paper-light";
                    else if (reveal && isPicked && !isAnswer)
                      cls = "border-coral bg-coral/20 text-paper-light";
                    else if (reveal) cls = "border-paper-light/10 bg-black/10 opacity-60";
                    return (
                      <button
                        key={i}
                        onClick={() => pick(i)}
                        disabled={reveal}
                        className={`flex w-full items-center justify-between rounded-2xl border-2 px-5 py-4 text-left font-sans text-base transition-colors ${cls}`}
                      >
                        <span>{opt}</span>
                        {reveal && isAnswer && <Check className="h-5 w-5 text-teal" />}
                        {reveal && isPicked && !isAnswer && (
                          <X className="h-5 w-5 text-coral" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {picked !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5"
                  >
                    <div
                      className={`rounded-2xl px-5 py-3 font-sans text-sm ${
                        picked === q.answer
                          ? "bg-teal/15 text-teal"
                          : "bg-coral/15 text-coral"
                      }`}
                    >
                      <b>{picked === q.answer ? "Správně! " : "Vedle. "}</b>
                      {q.explain}
                    </div>
                    <div className="mt-5 flex justify-end">
                      <button
                        onClick={next}
                        className="inline-flex items-center gap-2 rounded-full bg-sun px-6 py-2.5 font-display text-sm font-bold text-ink shadow-sticker transition-transform hover:-translate-y-0.5"
                      >
                        {idx + 1 >= total ? "Výsledek" : "Další otázka"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Výsledek */}
        {done && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl border-2 border-sun/40 bg-gradient-to-br from-[#2a2416] to-[#17140e] p-10 text-center shadow-parchment-lg"
          >
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-sun/15 text-sun">
              <Trophy className="h-10 w-10" />
            </div>
            <h2 className="mt-5 font-display text-4xl font-black text-sun">
              {score} / {total}
            </h2>
            <p className="mt-3 font-sans text-paper-light/80">
              {score === total
                ? "Perfektní! Tenhle příběh ovládáš."
                : score >= total / 2
                ? "Pěkné! Něco už ti utkvělo."
                : "Nevadí — projdi příběh znovu a zkus to zas."}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button
                onClick={restart}
                className="inline-flex items-center gap-2 rounded-full border-2 border-paper-light/25 px-6 py-2.5 font-display text-sm font-bold text-paper-light transition-colors hover:bg-black/40"
              >
                <RefreshCw className="h-4 w-4" /> Zkusit znovu
              </button>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full bg-sun px-6 py-2.5 font-display text-sm font-bold text-ink shadow-sticker transition-transform hover:-translate-y-0.5"
              >
                <ArrowLeft className="h-4 w-4" /> Zpět na mapu
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
