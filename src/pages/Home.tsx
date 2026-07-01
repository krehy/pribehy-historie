import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Globe2, MapPin, ScrollText, ChevronRight, ChevronLeft, ArrowLeft } from "lucide-react";
import { LoadingScreen } from "@/components/loading/LoadingScreen";
import { Hero } from "@/components/hero/Hero";
import { WorldMap } from "@/components/map/WorldMap";
import { Timeline } from "@/components/timeline/Timeline";
import { StoryGrid } from "@/components/stories/StoryGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  countriesInContinent,
  continentsWithStories,
  formatRange,
  statsForContinent,
  storiesForCountry,
} from "@/lib/history";
import { countryName } from "@/data/countries";
import {
  CONTINENTS,
  continentName,
  continentOfA3,
  type ContinentId,
} from "@/data/continents";
import type { Story } from "@/data/stories";

type Phase = "loading" | "hero" | "map";

const EASE = [0.76, 0, 0.24, 1] as const;

const CONTINENT_EMOJI: Record<ContinentId, string> = {
  europe: "🏰",
  asia: "🏯",
  africa: "🐫",
  "north-america": "🦅",
  "south-america": "🗿",
  oceania: "🌊",
};

export default function Home() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [continent, setContinent] = useState<ContinentId | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  // Zda mapa „odjela" a zobrazily se příběhy (spustí se až po zoomu na stát)
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
    setCountry(null); // zpět na výběr států (mapa se vrátí, přiblížená na světadíl)
  }, []);

  const visibleStories: Story[] = useMemo(() => {
    if (!country) return [];
    if (activeStory) return [activeStory];
    return storiesForCountry(country);
  }, [country, activeStory]);

  const step: "continents" | "countries" = continent ? "countries" : "continents";

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

          {/* Spodní panel výběru (na mapě) */}
          <AnimatePresence mode="wait">
            {step === "continents" ? (
              <ContinentPanel key="cont" onPick={handleSelectContinent} />
            ) : (
              <CountryPanel
                key="ctry"
                continent={continent!}
                onPick={handleSelectCountry}
                onBack={() => handleSelectContinent(null)}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ---------- VRSTVA PŘÍBĚHŮ (vyjede zdola přes celou obrazovku) ---------- */}
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

/* ---------------- Spodní panel: výběr světadílu ---------------- */

function ContinentPanel({ onPick }: { onPick: (id: ContinentId) => void }) {
  const withStories = useMemo(() => continentsWithStories(), []);
  const list = CONTINENTS.filter((c) => withStories.has(c.id));

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="pointer-events-none absolute inset-x-0 bottom-0 p-4 md:p-6"
    >
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-3xl border-2 border-ink/10 bg-paper-light/92 p-5 shadow-parchment-lg backdrop-blur-sm">
        <p className="text-center">
          <span className="highlight-tag text-sm">VYBER SI SVĚTADÍL</span>
        </p>
        <p className="mt-3 text-center text-sm text-ink-soft">
          Klikni na světadíl — mapa se přiblíží a ostatní zmizí.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2.5">
          {list.map((c) => {
            const stats = statsForContinent(c.id);
            return (
              <button
                key={c.id}
                onClick={() => onPick(c.id)}
                className="group flex items-center gap-2 rounded-full border-2 border-ink/10 bg-paper px-4 py-2 font-display font-bold text-ink shadow-sticker transition-all hover:-translate-y-0.5 hover:border-sun hover:bg-sun-light"
              >
                <span className="text-xl transition-transform group-hover:scale-110">
                  {CONTINENT_EMOJI[c.id]}
                </span>
                {c.name}
                <Badge variant="sun" className="ml-0.5">{stats.storyCount}</Badge>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------- Spodní panel: výběr státu ---------------- */

function CountryPanel({
  continent,
  onPick,
  onBack,
}: {
  continent: ContinentId;
  onPick: (a3: string) => void;
  onBack: () => void;
}) {
  const countries = useMemo(() => countriesInContinent(continent), [continent]);

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="pointer-events-none absolute inset-x-0 bottom-0 p-4 md:p-6"
    >
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-3xl border-2 border-ink/10 bg-paper-light/92 p-5 shadow-parchment-lg backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-display text-sm font-semibold text-ink-soft transition-colors hover:bg-country-hover/60 hover:text-ink"
          >
            <ChevronLeft className="h-4 w-4" /> Světadíly
          </button>
          <span className="highlight-tag text-sm">{continentName(continent).toUpperCase()}</span>
          <span className="w-20" />
        </div>
        <p className="mt-3 text-center text-sm text-ink-soft">
          Vyber stát — přiblíží se a odkryjí se jeho příběhy.
        </p>
        <div className="mt-4 flex max-h-40 flex-wrap justify-center gap-2.5 overflow-y-auto no-scrollbar">
          {countries.map((c) => (
            <button
              key={c.a3}
              onClick={() => onPick(c.a3)}
              className="group flex items-center gap-2 rounded-full border-2 border-ink/10 bg-paper px-4 py-2 font-display font-bold text-ink shadow-sticker transition-all hover:-translate-y-0.5 hover:border-sun hover:bg-sun-light"
            >
              {c.name}
              <Badge variant="sun" className="ml-0.5">{c.count}</Badge>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
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
