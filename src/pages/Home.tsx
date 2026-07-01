import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Globe2, MapPin, ScrollText } from "lucide-react";
import { LoadingScreen } from "@/components/loading/LoadingScreen";
import { Hero } from "@/components/hero/Hero";
import { WorldMap } from "@/components/map/WorldMap";
import { Timeline } from "@/components/timeline/Timeline";
import { StoryGrid } from "@/components/stories/StoryGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  countriesWithStories,
  formatRange,
  storiesForCountry,
} from "@/lib/history";
import { countryName } from "@/data/countries";
import type { Story } from "@/data/stories";
import { cn } from "@/lib/utils";

type Phase = "loading" | "hero" | "map";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [selected, setSelected] = useState<string | null>(null);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const exploreRef = useRef<HTMLDivElement>(null);

  const countries = useMemo(() => countriesWithStories(), []);

  const handleSelectCountry = useCallback((a3: string | null) => {
    setSelected(a3);
    setActiveStory(null);
    if (a3) {
      // Necháme mapu přiblížit a plynule sjedeme k časové ose.
      setTimeout(() => {
        exploreRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 700);
    }
  }, []);

  // Filtrované příběhy: buď dle vybraného časového bodu, nebo celá země.
  const visibleStories: Story[] = useMemo(() => {
    if (!selected) return [];
    if (activeStory) return [activeStory];
    return storiesForCountry(selected);
  }, [selected, activeStory]);

  return (
    <>
      <AnimatePresence>
        {phase === "loading" && (
          <LoadingScreen onDone={() => setPhase("hero")} />
        )}
      </AnimatePresence>

      {/* Fullscreen sekce: hero odjede nahoru a odkryje mapu */}
      <section className="relative h-[100svh] w-full overflow-hidden bg-paper">
        {phase !== "loading" && (
          <div className="absolute inset-0">
            <WorldMap selectedCountry={selected} onSelectCountry={handleSelectCountry} />
            <MapOverlay
              selected={selected}
              onReset={() => handleSelectCountry(null)}
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

      {/* Sekce průzkumu: výběr země, časová osa, příběhy */}
      <div ref={exploreRef} id="timeline" className="scroll-mt-16">
        <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
          {!selected ? (
            <CountryPicker
              countries={countries}
              onPick={(a3) => handleSelectCountry(a3)}
            />
          ) : (
            <div>
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="flex items-center gap-2 font-script text-base italic text-ink-soft">
                    <MapPin className="h-4 w-4" /> vybraná země
                  </span>
                  <h2 className="mt-1 font-display text-4xl tracking-wide text-ink">
                    {countryName(selected)}
                  </h2>
                </div>
                <Button variant="outline" onClick={() => handleSelectCountry(null)}>
                  <Globe2 className="h-4 w-4" /> Zpět na celý svět
                </Button>
              </div>

              <div className="card-parchment mb-12 px-6 py-10 md:px-12">
                <Timeline
                  countryCode={selected}
                  activeStoryId={activeStory?.id ?? null}
                  onSelect={setActiveStory}
                />
              </div>

              <div id="pribehy" className="scroll-mt-16">
                <div className="rule-ornament mb-8">
                  <ScrollText className="h-5 w-5" />
                </div>
                <div className="mb-6 flex items-baseline justify-between">
                  <h3 className="font-display text-2xl tracking-wide text-ink">
                    {activeStory
                      ? `Příběh · ${formatRange(activeStory.yearFrom, activeStory.yearTo)}`
                      : "Příběhy této země"}
                  </h3>
                  <span className="font-script text-base italic text-ink-soft">
                    {visibleStories.length}{" "}
                    {visibleStories.length === 1 ? "příběh" : "příběhů"}
                  </span>
                </div>
                <StoryGrid stories={visibleStories} />
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

/** Overlay ovládání nad mapou (dole vlevo). */
function MapOverlay({
  selected,
  onReset,
  onGoStories,
}: {
  selected: string | null;
  onReset: () => void;
  onGoStories: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 md:p-8">
      <div className="mx-auto flex max-w-6xl items-end justify-between">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pointer-events-auto max-w-xs rounded-lg border border-stroke/40 bg-paper-light/85 p-4 shadow-parchment backdrop-blur-sm"
        >
          {selected ? (
            <>
              <p className="font-script text-sm italic text-ink-soft">právě prohlížíte</p>
              <p className="font-display text-xl tracking-wide text-ink">
                {countryName(selected)}
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={onGoStories}>
                  Příběhy
                </Button>
                <Button size="sm" variant="outline" onClick={onReset}>
                  Celý svět
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="font-display text-sm tracking-wide text-ink">
                Vyberte zemi na mapě
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                Zvýrazněné země skrývají příběhy. Klikněte a mapa se přiblíží.
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

/** Mřížka zemí s příběhy pro rychlý výběr (když není nic vybráno). */
function CountryPicker({
  countries,
  onPick,
}: {
  countries: ReturnType<typeof countriesWithStories>;
  onPick: (a3: string) => void;
}) {
  return (
    <div className="text-center">
      <span className="font-script text-lg italic text-ink-soft">začněte objevovat</span>
      <h2 className="mt-1 font-display text-4xl tracking-wide text-ink">
        Vyberte zemi
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-ink-soft">
        Klikněte na zvýrazněnou zemi na mapě výše, nebo vyberte přímo zde. Každá
        země otevře svou časovou osu a příběhy.
      </p>

      <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {countries.map((c) => (
          <button
            key={c.a3}
            onClick={() => onPick(c.a3)}
            className={cn(
              "group flex flex-col items-start rounded-lg border border-stroke/40 bg-paper-light p-4 text-left transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-parchment"
            )}
          >
            <span className="font-display text-lg tracking-wide text-ink group-hover:text-accent">
              {c.name}
            </span>
            <span className="mt-1 text-xs text-ink-soft">
              {formatRange(c.yearFrom, c.yearTo)}
            </span>
            <Badge className="mt-3">
              {c.count} {c.count === 1 ? "příběh" : "příběhů"}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}
