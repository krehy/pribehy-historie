import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Compass } from "lucide-react";

interface LoadingScreenProps {
  onDone: () => void;
}

const STEPS = [
  "Rozprostírám pergamen…",
  "Kreslím pobřeží a hranice…",
  "Značím města a cesty…",
  "Otevírám kroniky příběhů…",
];

/**
 * Úvodní načítací obrazovka s progresem. Web je „náročný", proto zde
 * simulujeme postupné načítání s ozdobným ukazatelem.
 */
export function LoadingScreen({ onDone }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 2200;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // Ease-out, ať progres zpomalí ke konci
      const eased = 1 - Math.pow(1 - t, 2);
      setProgress(Math.round(eased * 100));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(onDone, 350);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  const step = STEPS[Math.min(STEPS.length - 1, Math.floor((progress / 100) * STEPS.length))];

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-paper"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex w-full max-w-sm flex-col items-center px-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative mb-8"
        >
          <span className="absolute inset-0 -m-3 rounded-full border border-dashed border-stroke/40 motion-safe:animate-compass-spin" />
          <span className="grid h-20 w-20 place-items-center rounded-full border-4 border-ink/10 bg-sun text-ink shadow-parchment">
            <Compass className="h-9 w-9" />
          </span>
        </motion.div>

        <h1 className="font-display text-2xl font-extrabold text-ink">
          Příběhy historie
        </h1>
        <p className="mt-1 font-serif text-base italic text-ink-soft">
          interaktivní atlas dějin
        </p>

        <div className="mt-8 h-2.5 w-full overflow-hidden rounded-full bg-country/70">
          <motion.div
            className="h-full rounded-full bg-sun"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-3 flex w-full items-center justify-between font-display text-xs tracking-wide text-ink-soft">
          <span>{step}</span>
          <span className="tabular-nums">{progress}%</span>
        </div>
      </div>
    </motion.div>
  );
}
