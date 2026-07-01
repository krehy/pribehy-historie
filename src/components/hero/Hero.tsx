import { motion } from "framer-motion";
import { Compass, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  onEnter: () => void;
}

/**
 * Hero „loading" sekce s logem. Po interakci (nebo automaticky) plynule
 * odjede nahoru a odkryje pergamenovou mapu světa.
 */
export function Hero({ onEnter }: HeroProps) {
  return (
    <motion.section
      className="relative flex h-[100svh] flex-col items-center justify-center overflow-hidden px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Jemné dekorativní kruhy na pozadí */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[120vmin] w-[120vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-stroke/15" />
        <div className="absolute left-1/2 top-1/2 h-[85vmin] w-[85vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-stroke/20" />
        <div className="absolute left-1/2 top-1/2 h-[55vmin] w-[55vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-stroke/15" />
      </div>

      <motion.div
        initial={{ scale: 0.85, opacity: 0, rotate: -20 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ delay: 0.2, duration: 0.9, ease: "easeOut" }}
        className="mb-6 grid h-24 w-24 place-items-center rounded-full border-2 border-stroke/50 bg-paper-light text-accent shadow-parchment-lg"
      >
        <Compass className="h-12 w-12" />
      </motion.div>

      <motion.p
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.7 }}
        className="font-script text-lg italic text-ink-soft"
      >
        vítejte v interaktivním atlasu
      </motion.p>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.7 }}
        className="mt-2 max-w-3xl text-balance font-display text-5xl leading-tight tracking-wide text-ink md:text-7xl"
      >
        Příběhy historie
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.7 }}
        className="mt-5 max-w-xl text-balance text-lg text-ink-soft"
      >
        Rozbalte starou mapu světa a dotkněte se okamžiků, které utvářely
        civilizace. Vyberte zemi, projděte její časovou osu a čtěte příběhy dějin.
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.7 }}
        className="mt-9"
      >
        <Button size="lg" onClick={onEnter} className="group">
          Prozkoumat mapu
          <ChevronDown className="h-5 w-5 transition-transform group-hover:translate-y-0.5" />
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
