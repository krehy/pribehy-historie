import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AnimatePresence,
  motion,
  useScroll,
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const hero = story.hero;
  // Bez hero → rovnou spuštěno. S hero → čeká na Play.
  const [started, setStarted] = useState(!hero);
  const titleMs = story.title.length * 55;

  return (
    <div
      ref={scrollRef}
      className="fixed inset-0 z-[60] overflow-y-auto overflow-x-hidden bg-[#17140e] text-paper-light"
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

      {/* Hero — tajemný poster + Play → vypsání nadpisu → text → video */}
      <header className="relative flex min-h-[72vh] flex-col items-center justify-center overflow-hidden px-6 text-center">
        {hero ? (
          <div className="absolute inset-0">
            {hero.mediaType === "video" ? (
              <HeroVideo
                src={url(hero.media)}
                play={started}
                poster={hero.poster ? url(hero.poster) : undefined}
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
      <footer className="px-6 py-20 text-center">
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
    <section className="relative flex min-h-[86vh] items-stretch overflow-hidden">
      {beat.chroma ? (
        // Vyklíčovaná postava na pergamenovém pozadí
        <div className="relative flex w-full flex-col items-center gap-6 bg-[radial-gradient(120%_100%_at_50%_30%,#4a3f26,#17140e)] px-6 py-16 md:flex-row md:justify-center md:gap-14 md:px-16">
          <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background:repeating-linear-gradient(90deg,#fff_0,#fff_1px,transparent_1px,transparent_46px)]" />
          <MoodOverlay mood={beat.mood} />
          <ChromaImage
            src={url(beat.media)}
            alt={beat.title}
            className="relative z-10 max-h-[62vh] w-auto drop-shadow-[0_20px_50px_rgba(0,0,0,.6)]"
          />
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

/** Video na pozadí hero — přehraje se až po Play (slow-mo). */
function HeroVideo({
  src,
  play,
  poster,
}: {
  src: string;
  play: boolean;
  poster?: string;
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
      loop
      playsInline
      preload="auto"
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
      className="relative"
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
    <section className="flex items-center justify-center px-6 py-16">
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
    <section className="flex min-h-[70vh] items-center justify-center px-6 py-20">
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
