import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Globe2, MapPin, ScrollText, ChevronRight, Compass } from "lucide-react";
import { LoadingScreen } from "@/components/loading/LoadingScreen";
import { Hero } from "@/components/hero/Hero";
import { WorldMap } from "@/components/map/WorldMap";
import { Timeline } from "@/components/timeline/Timeline";
import { StoryGrid } from "@/components/stories/StoryGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Arcs, Curl, Confetti } from "@/components/ui/Doodles";
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
import { cn } from "@/lib/utils";

type Phase = "loading" | "hero" | "map";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [continent, setContinent] = useState<ContinentId | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const exploreRef = useRef<HTMLDivElement>(null);

  const scrollToExplore = useCallback(() => {
    setTimeout(() => {
      exploreRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 650);
  }, []);

  const handleSelectContinent = useCallback(
    (id: ContinentId | null) => {
      setContinent(id);
      setCountry(null);
      setActiveStory(null);
      if (id) scrollToExplore();
    },
    [scrollToExplore]
  );

  const handleSelectCountry = useCallback(
    (a3: string | null) => {
      setCountry(a3);
      setActiveStory(null);
      if (a3) {
        // Doplníme světadíl, kdyby stát přišel z jiného zdroje než mapy.
        const c = continentOfA3(a3);
        if (c) setContinent(c);
        scrollToExplore();
      }
    },
    [scrollToExplore]
  );

  const visibleStories: Story[] = useMemo(() => {
    if (!country) return [];
    if (activeStory) return [activeStory];
    return storiesForCountry(country);
  }, [country, activeStory]);

  return (
    <>
      <AnimatePresence>
        {phase === "loading" && <LoadingScreen onDone={() => setPhase("hero")} />}
      </AnimatePresence>

      {/* Fullscreen: hero odjede nahoru a odkryje mapu */}
      <section className="relative h-[100svh] w-full overflow-hidden bg-paper">
        {phase !== "loading" && (
          <div className="absolute inset-0">
            <WorldMap
              selectedContinent={continent}
              selectedCountry={country}
              onSelectContinent={handleSelectContinent}
              onSelectCountry={handleSelectCountry}
            />
            <MapOverlay
              continent={continent}
              country={country}
              onWorld={() => handleSelectContinent(null)}
              onBackToContinent={() => setCountry(null)}
              onGoStories={() =>
                exploreRef.current?.scrollIntoView({ behavior: "smooth" })
              }
            />
          </div>
        )}

        <AnimatePresence>
          {phase === "hero" && (
            <motion.div
              key="hero"
              className="absolute inset-0 z-20 bg-paper"
              initial={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
            >
              <Hero onEnter={() => setPhase("map")} />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Sekce průzkumu */}
      <div ref={exploreRef} id="timeline" className="scroll-mt-16">
        <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
          {/* Drobečková navigace */}
          <Breadcrumb
            continent={continent}
            country={country}
            onWorld={() => handleSelectContinent(null)}
            onContinent={() => setCountry(null)}
          />

          {!continent ? (
            <ContinentPicker onPick={handleSelectContinent} />
          ) : !country ? (
            <CountryPicker
              continent={continent}
              onPick={handleSelectCountry}
              onBack={() => handleSelectContinent(null)}
            />
          ) : (
            <CountryDetail
              country={country}
              activeStory={activeStory}
              visibleStories={visibleStories}
              onSelectStory={setActiveStory}
              onBack={() => setCountry(null)}
            />
          )}
        </section>
      </div>
    </>
  );
}

/* ---------------- Overlay nad mapou ---------------- */

function MapOverlay({
  continent,
  country,
  onWorld,
  onBackToContinent,
  onGoStories,
}: {
  continent: ContinentId | null;
  country: string | null;
  onWorld: () => void;
  onBackToContinent: () => void;
  onGoStories: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 md:p-8">
      <div className="mx-auto max-w-6xl">
        <motion.div
          key={`${continent}-${country}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="pointer-events-auto max-w-xs rounded-2xl border-2 border-ink/10 bg-paper-light/90 p-4 shadow-parchment backdrop-blur-sm"
        >
          {country ? (
            <>
              <p className="font-serif text-sm italic text-ink-soft">právě prohlížíte</p>
              <p className="font-display text-xl font-bold text-ink">{countryName(country)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={onGoStories}>Příběhy</Button>
                <Button size="sm" variant="outline" onClick={onBackToContinent}>
                  Zpět na {continent ? continentName(continent) : "světadíl"}
                </Button>
              </div>
            </>
          ) : continent ? (
            <>
              <p className="font-serif text-sm italic text-ink-soft">světadíl</p>
              <p className="font-display text-xl font-bold text-ink">{continentName(continent)}</p>
              <p className="mt-1 text-sm text-ink-soft">
                Vyber zvýrazněný stát a odkryje se jeho časová osa.
              </p>
              <Button size="sm" variant="outline" onClick={onWorld} className="mt-3">
                <Globe2 className="h-4 w-4" /> Celý svět
              </Button>
            </>
          ) : (
            <>
              <p className="font-display text-sm font-bold text-ink">Vyber světadíl 🗺️</p>
              <p className="mt-1 text-sm text-ink-soft">
                Klikni na světadíl — přiblíží se a rozdělí na státy.
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

/* ---------------- Drobečková navigace ---------------- */

function Breadcrumb({
  continent,
  country,
  onWorld,
  onContinent,
}: {
  continent: ContinentId | null;
  country: string | null;
  onWorld: () => void;
  onContinent: () => void;
}) {
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-1.5 font-display text-sm font-semibold text-ink-soft">
      <button onClick={onWorld} className={cn("rounded-full px-2 py-0.5 hover:bg-country-hover/60", !continent && "text-ink")}>
        Svět
      </button>
      {continent && (
        <>
          <ChevronRight className="h-4 w-4 opacity-50" />
          <button onClick={onContinent} className={cn("rounded-full px-2 py-0.5 hover:bg-country-hover/60", !country && "text-ink")}>
            {continentName(continent)}
          </button>
        </>
      )}
      {country && (
        <>
          <ChevronRight className="h-4 w-4 opacity-50" />
          <span className="rounded-full px-2 py-0.5 text-ink">{countryName(country)}</span>
        </>
      )}
    </nav>
  );
}

/* ---------------- Výběr světadílu ---------------- */

const CONTINENT_EMOJI: Record<ContinentId, string> = {
  europe: "🏰",
  asia: "🏯",
  africa: "🐫",
  "north-america": "🦅",
  "south-america": "🗿",
  oceania: "🌊",
};

function ContinentPicker({ onPick }: { onPick: (id: ContinentId) => void }) {
  const withStories = useMemo(() => continentsWithStories(), []);
  const list = CONTINENTS.filter((c) => withStories.has(c.id));

  return (
    <div className="relative text-center">
      <Curl className="absolute -top-2 left-6 hidden h-8 w-12 text-sun-deep/60 md:block" />
      <Arcs className="absolute -top-1 right-8 hidden h-8 w-12 text-teal/50 md:block" />

      <span className="highlight-tag text-sm">ZAČNI OBJEVOVAT</span>
      <h2 className="mt-4 font-display text-4xl font-extrabold text-ink md:text-5xl">
        Vyber si světadíl
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-ink-soft">
        Klikni na světadíl na mapě nahoře, nebo rovnou tady. Přiblíží se a
        rozdělí na jednotlivé státy.
      </p>

      <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-3">
        {list.map((c) => {
          const stats = statsForContinent(c.id);
          return (
            <motion.button
              key={c.id}
              whileHover={{ y: -4 }}
              onClick={() => onPick(c.id)}
              className="group flex flex-col items-center rounded-2xl border-2 border-ink/10 bg-paper-light p-6 text-center shadow-parchment transition-colors hover:border-sun"
            >
              <span className="text-4xl transition-transform group-hover:scale-110">
                {CONTINENT_EMOJI[c.id]}
              </span>
              <span className="mt-3 font-display text-xl font-bold text-ink">{c.name}</span>
              <div className="mt-2 flex gap-1.5">
                <Badge variant="sun">{stats.countryCount} zemí</Badge>
                <Badge>{stats.storyCount} příběhů</Badge>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Výběr státu ve světadílu ---------------- */

function CountryPicker({
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
    <div className="relative text-center">
      <Confetti className="absolute -top-2 right-6 hidden h-8 w-14 md:block" />
      <span className="highlight-tag text-sm">{continentName(continent).toUpperCase()}</span>
      <h2 className="mt-4 font-display text-4xl font-extrabold text-ink md:text-5xl">
        Vyber si stát
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-ink-soft">
        Každý stát otevře svou časovou osu a příběhy. Klikni na zvýrazněný stát
        na mapě, nebo vyber zde.
      </p>

      <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {countries.map((c) => (
          <motion.button
            key={c.a3}
            whileHover={{ y: -4 }}
            onClick={() => onPick(c.a3)}
            className="group flex flex-col items-start rounded-2xl border-2 border-ink/10 bg-paper-light p-4 text-left shadow-parchment transition-colors hover:border-sun"
          >
            <span className="font-display text-lg font-bold text-ink group-hover:text-sun-deep">
              {c.name}
            </span>
            <span className="mt-1 text-xs text-ink-soft">
              {formatRange(c.yearFrom, c.yearTo)}
            </span>
            <Badge variant="sun" className="mt-3">
              {c.count} {c.count === 1 ? "příběh" : "příběhů"}
            </Badge>
          </motion.button>
        ))}
      </div>

      <Button variant="outline" onClick={onBack} className="mt-10">
        <Globe2 className="h-4 w-4" /> Zpět na světadíly
      </Button>
    </div>
  );
}

/* ---------------- Detail státu: timeline + příběhy ---------------- */

function CountryDetail({
  country,
  activeStory,
  visibleStories,
  onSelectStory,
  onBack,
}: {
  country: string;
  activeStory: Story | null;
  visibleStories: Story[];
  onSelectStory: (s: Story | null) => void;
  onBack: () => void;
}) {
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="flex items-center gap-2 font-serif text-base italic text-ink-soft">
            <MapPin className="h-4 w-4" /> vybraný stát
          </span>
          <h2 className="mt-1 font-display text-4xl font-extrabold text-ink">
            {countryName(country)}
          </h2>
        </div>
        <Button variant="outline" onClick={onBack}>
          <Compass className="h-4 w-4" /> Zpět na výběr států
        </Button>
      </div>

      <div className="card-parchment mb-12 px-6 py-10 md:px-12">
        <Timeline
          countryCode={country}
          activeStoryId={activeStory?.id ?? null}
          onSelect={onSelectStory}
        />
      </div>

      <div id="pribehy" className="scroll-mt-16">
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
      </div>
    </div>
  );
}
