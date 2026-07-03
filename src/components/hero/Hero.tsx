import { motion } from "framer-motion";
import { Compass, ChevronDown, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Arcs, Curl, Loop, Confetti, Sparkle } from "@/components/ui/Doodles";

interface HeroProps {
  onEnter: () => void;
  onHistory: () => void;
}

/**
 * Hero „loading" sekce s logem. Po interakci plynule odjede nahoru a odkryje
 * pergamenovou mapu světa. Styl: hravý, ve stylu instagramové grafiky.
 */
export function Hero({ onEnter, onHistory }: HeroProps) {
  return (
    <motion.section
      className="relative flex h-full flex-col items-center justify-center overflow-hidden px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Hravé doodly na pozadí */}
      <Curl className="absolute left-[8%] top-[18%] hidden h-12 w-20 text-sun-deep/50 md:block" />
      <Loop className="absolute right-[10%] top-[22%] hidden h-14 w-14 text-teal/40 md:block" />
      <Arcs className="absolute bottom-[16%] left-[12%] hidden h-12 w-20 text-coral/40 md:block" />
      <Sparkle className="absolute right-[16%] bottom-[26%] hidden h-8 w-8 text-grape/50 md:block" />
      <Confetti className="absolute left-1/2 top-[12%] hidden h-8 w-20 -translate-x-1/2 md:block" />

      <motion.div
        initial={{ scale: 0.85, opacity: 0, rotate: -20 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ delay: 0.2, duration: 0.9, ease: "easeOut" }}
        className="mb-6 grid h-24 w-24 place-items-center rounded-full border-4 border-ink/10 bg-sun text-ink shadow-parchment-lg"
      >
        <Compass className="h-12 w-12" />
      </motion.div>

      <motion.span
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.7 }}
        className="highlight-tag -rotate-1"
      >
        VÍTEJ V ATLASU DĚJIN
      </motion.span>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.7 }}
        className="mt-4 max-w-3xl text-balance font-display text-5xl font-extrabold leading-[1.05] text-ink md:text-7xl"
      >
        Příběhy historie
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.7 }}
        className="mt-5 max-w-xl text-balance text-lg text-ink-soft"
      >
        Rozbal starou mapu světa a dotkni se okamžiků, které utvářely civilizace.
        Vyber světadíl, přibliž se ke státu a čti příběhy dějin.
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.7 }}
        className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
      >
        <Button size="lg" onClick={onEnter} className="group">
          Prozkoumat mapu
          <ChevronDown className="h-5 w-5 transition-transform group-hover:translate-y-0.5" />
        </Button>
        <Button size="lg" variant="outline" onClick={onHistory} className="group">
          <History className="h-5 w-5" />
          Zobrazit historii
        </Button>
      </motion.div>

      <motion.button
        onClick={onEnter}
        aria-label="Vstoupit do mapy"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-ink-soft"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ delay: 1.2, y: { repeat: Infinity, duration: 1.8 } }}
      >
        <ChevronDown className="h-7 w-7" />
      </motion.button>
    </motion.section>
  );
}
