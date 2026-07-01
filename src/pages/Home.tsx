import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Globe2, MapPin, ScrollText, ChevronRight, ChevronLeft, ArrowLeft } from "lucide-react";
import { LoadingScreen } from "@/components/loading/LoadingScreen";
import { Hero } from "@/components/hero/Hero";
import { WorldMap } from "@/components/map/WorldMap";
import { Timeline } from "@/components/timeline/Timeline";
import { StoryGrid } from "@/components/stories/StoryGrid";
import { Button } from "@/components/ui/button";
import { formatRange, storiesForCountry } from "@/lib/history";
import { countryName } from "@/data/countries";
import { continentName, continentOfA3, type ContinentId } from "@/data/continents";
import type { Story } from "@/data/stories";

type Phase = "loading" | "hero" | "map";

const EASE = [0.76, 0, 0.24, 1] as const;

export default function Home() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [continent, setContinent] = useState<ContinentId | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [showStories, setShowStories] = useState(false);
  const revealTimer = useRef<number>(0);

  useEffect(() => () => clearTimeout(revealTimer.current), []);

  const handleSelectContinent = useCallback((id: ContinentId | null) => {
    clearTimeout(revealTimer.current);
    setContinent(id);
    setCountry(null);
    setActiveStory(null);
    setShowStories(false);
  }, []);

  const handleSelectCountry = useCallback((a3: string | null) => {
    clearTimeout(revealTimer.current);
    setCountry(a3);
    setActiveStory(null);
    if (a3) {
      const c = continentOfA3(a3);
      if (c) setContinent(c);
      // Nejdřív se mapa přiblíží na stát, teprve pak odjede a odkryje příběhy.
      revealTimer.current = window.setTimeout(() => setShowStories(true), 1250);
    } else {
      setShowStories(false);
    }
  }, []);

  const closeStories = useCallback(() => {
    clearTimeout(revealTimer.current);
    setShowStories(false);
    setActiveStory(null);
    setCountry(null);
  }, []);

  const visibleStories: Story[] = useMemo(() => {
    if (!country) return [];
    if (activeStory) return [activeStory];
    return storiesForCountry(country);
  }, [country, activeStory]);

  return (
    <section className="relative h-[calc(100dvh-4rem)] w-full overflow-hidden bg-paper">
      <AnimatePresence>
        {phase === "loading" && <LoadingScreen onDone={() => setPhase("hero")} />}
      </AnimatePresence>

      {/* ---------- VRSTVA MAPY ---------- */}
      {phase !== "loading" && (
        <motion.div
          className="absolute inset-0"
          animate={{
            y: showStories ? "-14%" : "0%",
            scale: showStories ? 0.96 : 1,
            opacity: showStories ? 0 : 1,
          }}
          transition={{ duration: 0.7, ease: EASE }}
          style={{ pointerEvents: showStories ? "none" : "auto" }}
        >
          <WorldMap
            selectedContinent={continent}
            selectedCountry={country}
            onSelectContinent={handleSelectContinent}
            onSelectCountry={handleSelectCountry}
          />

          {/* Minimální ovládání — výběr probíhá klikáním do mapy */}
          <AnimatePresence mode="wait">
            {!continent ? (
              <motion.div
                key="hint-world"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.35 }}
                className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4"
              >
                <span className="highlight-tag -rotate-1 text-sm">
                  Klikni na světadíl 🗺️
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="ctrl-continent"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className="absolute left-4 top-4 flex items-center gap-2"
              >
                <button
                  onClick={() => handleSelectContinent(null)}
                  className="pointer-events-auto inline-flex items-center gap-1 rounded-full border-2 border-ink/10 bg-paper-light/90 px-4 py-2 font-display text-sm font-bold text-ink shadow-parchment backdrop-blur-sm transition-colors hover:bg-country-hover"
                >
                  <ChevronLeft className="h-4 w-4" /> Světadíly
                </button>
                <span className="hidden rounded-full bg-sun/90 px-3 py-1.5 font-display text-sm font-bold text-ink shadow-sticker sm:inline">
                  Klikni na stát v {continentName(continent)}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ---------- VRSTVA PŘÍBĚHŮ (fullscreen, vyjede zdola) ---------- */}
      <AnimatePresence>
        {showStories && country && (
          <motion.div
            key="stories"
            className="fixed inset-0 z-50 overflow-y-auto bg-paper"
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <StoriesView
              continent={continent}
              country={country}
              activeStory={activeStory}
              visibleStories={visibleStories}
              onSelectStory={setActiveStory}
              onBack={closeStories}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- HERO (odjede nahoru) ---------- */}
      <AnimatePresence>
        {phase === "hero" && (
          <motion.div
            key="hero"
            className="absolute inset-0 z-20 bg-paper"
            initial={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 1, ease: EASE }}
          >
            <Hero onEnter={() => setPhase("map")} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ---------------- Vrstva příběhů ---------------- */

function StoriesView({
  continent,
  country,
  activeStory,
  visibleStories,
  onSelectStory,
  onBack,
}: {
  continent: ContinentId | null;
  country: string;
  activeStory: Story | null;
  visibleStories: Story[];
  onSelectStory: (s: Story | null) => void;
  onBack: () => void;
}) {
  return (
    <div className="min-h-full">
      {/* Lepivá lišta: zpět na mapu + drobečková navigace */}
      <div className="sticky top-0 z-10 border-b-2 border-ink/5 bg-paper/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" /> Zpět na mapu
          </Button>
          <nav className="flex items-center gap-1.5 font-display text-sm font-semibold text-ink-soft">
            <span>Svět</span>
            {continent && (
              <>
                <ChevronRight className="h-4 w-4 opacity-50" />
                <span>{continentName(continent)}</span>
              </>
            )}
            <ChevronRight className="h-4 w-4 opacity-50" />
            <span className="text-ink">{countryName(country)}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-14 pt-8 md:px-6">
        <div className="mb-8">
          <span className="flex items-center gap-2 font-serif text-base italic text-ink-soft">
            <MapPin className="h-4 w-4" /> vybraný stát
          </span>
          <h2 className="mt-1 font-display text-4xl font-extrabold text-ink md:text-5xl">
            {countryName(country)}
          </h2>
        </div>

        <div className="card-parchment mb-12 px-6 py-10 md:px-12">
          <Timeline
            countryCode={country}
            activeStoryId={activeStory?.id ?? null}
            onSelect={onSelectStory}
          />
        </div>

        <div className="scroll-mt-16">
          <div className="rule-ornament mb-8">
            <ScrollText className="h-5 w-5" />
          </div>
          <div className="mb-6 flex items-baseline justify-between">
            <h3 className="font-display text-2xl font-bold text-ink">
              {activeStory
                ? `Příběh · ${formatRange(activeStory.yearFrom, activeStory.yearTo)}`
                : "Příběhy tohoto státu"}
            </h3>
            <span className="font-serif text-base italic text-ink-soft">
              {visibleStories.length}{" "}
              {visibleStories.length === 1 ? "příběh" : "příběhů"}
            </span>
          </div>
          <StoryGrid stories={visibleStories} />

          <div className="mt-12 flex justify-center">
            <Button onClick={onBack}>
              <Globe2 className="h-4 w-4" /> Zpět na mapu
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
