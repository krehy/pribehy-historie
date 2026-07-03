import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { LoadingScreen } from "@/components/loading/LoadingScreen";
import { Hero } from "@/components/hero/Hero";
import { WorldMap } from "@/components/map/WorldMap";
import { StoryTimeline } from "@/components/timeline/StoryTimeline";
import { storiesForCountry, storiesForRegion } from "@/lib/history";
import { countryName } from "@/data/countries";
import { continentName, continentOfA3, type ContinentId } from "@/data/continents";
import { hasRegions, regionName } from "@/data/regions";
import { erasForCountry } from "@/data/eras";
import type { Story } from "@/data/stories";

type Phase = "loading" | "hero" | "map";
type Focus = "map" | "timeline";

const EASE = [0.76, 0, 0.24, 1] as const;

const canHover =
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// Uložení/obnova navigace mapy (světadíl → stát → kraj → osa), aby návrat z článku
// vrátil uživatele tam, kde byl, místo znovu-proklikávání celé mapy.
const NAV_KEY = "ph:map-nav";
interface SavedNav {
  continent: ContinentId | null;
  country: string | null;
  region: string | null;
  timelineOpen: boolean;
}
function readSavedNav(): SavedNav | null {
  try {
    return JSON.parse(sessionStorage.getItem(NAV_KEY) || "null");
  } catch {
    return null;
  }
}

export default function Home() {
  const saved = useMemo(readSavedNav, []);
  const [phase, setPhase] = useState<Phase>(saved ? "map" : "loading");
  const [continent, setContinent] = useState<ContinentId | null>(saved?.continent ?? null);
  const [country, setCountry] = useState<string | null>(saved?.country ?? null);
  const [region, setRegion] = useState<string | null>(saved?.region ?? null);
  const [timelineOpen, setTimelineOpen] = useState(saved?.timelineOpen ?? false);
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [focus, setFocus] = useState<Focus>("timeline");
  const revealTimer = useRef<number>(0);
  const timelineOpenRef = useRef(false);

  useEffect(() => {
    timelineOpenRef.current = timelineOpen;
    if (timelineOpen) setFocus("timeline");
    else setTimelineExpanded(false); // zavření osy → sbal grid zpět na 1. fold
  }, [timelineOpen]);

  // Změna země/kraje → zpět na osu (ne v rozbaleném gridu předchozí země).
  useEffect(() => setTimelineExpanded(false), [country, region]);

  useEffect(() => () => clearTimeout(revealTimer.current), []);

  // Ulož navigaci mapy, ať návrat z článku (history back / „/") přistane tam, kde jsem byl.
  useEffect(() => {
    if (phase !== "map") return;
    try {
      sessionStorage.setItem(NAV_KEY, JSON.stringify({ continent, country, region, timelineOpen }));
    } catch {
      /* sessionStorage nedostupný — ignoruj */
    }
  }, [phase, continent, country, region, timelineOpen]);

  const handleSelectContinent = useCallback((id: ContinentId | null) => {
    clearTimeout(revealTimer.current);
    setContinent(id);
    setCountry(null);
    setRegion(null);
    setTimelineOpen(false);
  }, []);

  const handleSelectCountry = useCallback((a3: string | null) => {
    clearTimeout(revealTimer.current);
    setCountry(a3);
    setRegion(null);
    if (a3) {
      const c = continentOfA3(a3);
      if (c) setContinent(c);
      // Stát s 3. úrovní (Česko) → přiblížit na kraje; osa až po výběru kraje.
      if (hasRegions(a3)) {
        setTimelineOpen(false);
        return;
      }
      if (timelineOpenRef.current) {
        setFocus("timeline");
        return;
      }
      revealTimer.current = window.setTimeout(() => setTimelineOpen(true), 550);
    } else {
      setTimelineOpen(false);
    }
  }, []);

  const handleSelectRegion = useCallback((code: string | null) => {
    clearTimeout(revealTimer.current);
    setRegion(code);
    if (code) {
      if (timelineOpenRef.current) {
        setFocus("timeline");
        return;
      }
      revealTimer.current = window.setTimeout(() => setTimelineOpen(true), 350);
    } else {
      setTimelineOpen(false);
    }
  }, []);

  const closeTimeline = useCallback(() => {
    clearTimeout(revealTimer.current);
    setTimelineOpen(false);
    setRegion((r) => (r ? null : r)); // v kraji → zpět na kraje
    setCountry((c) => (c && !hasRegions(c) ? null : c)); // ostatní → zpět na státy
  }, []);

  const inRegionMode = hasRegions(country);

  const timelineStories: Story[] = useMemo(() => {
    if (region) return storiesForRegion(region);
    if (country && !hasRegions(country)) return storiesForCountry(country);
    return [];
  }, [country, region]);

  const timelineLabel = region ? regionName(region) : country ? countryName(country) : "";
  const mapFocused = !timelineOpen || focus === "map";

  const chip = inRegionMode
    ? timelineOpen
      ? "Klikni na jiný kraj"
      : "Kraje ČR · klikni na kraj"
    : continent
    ? `${continentName(continent)} · klikni ${timelineOpen ? "na jiný stát" : "na stát"}`
    : "";

  return (
    <section className="relative h-[calc(100dvh-4rem)] w-full overflow-hidden bg-paper">
      <AnimatePresence>
        {phase === "loading" && <LoadingScreen onDone={() => setPhase("hero")} />}
      </AnimatePresence>

      {/* ---------- VRSTVA MAPY ---------- */}
      {phase !== "loading" && (
        <motion.div
          className="absolute inset-0"
          onMouseEnter={() => canHover && timelineOpen && setFocus("map")}
          animate={{
            y: timelineOpen ? "-14%" : "0%",
            scale: timelineOpen ? 0.93 : 1,
            opacity: mapFocused ? 1 : 0.96,
          }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <WorldMap
            selectedContinent={continent}
            selectedCountry={country}
            regionsFor={inRegionMode ? country : null}
            selectedRegion={region}
            onSelectContinent={handleSelectContinent}
            onSelectCountry={handleSelectCountry}
            onSelectRegion={handleSelectRegion}
          />

          <AnimatePresence>
            {!timelineOpen && !continent && (
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
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ---------- OVLÁDÁNÍ (drží nahoře) ---------- */}
      <AnimatePresence>
        {phase === "map" && continent && (
          <motion.div
            key="controls"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-x-0 top-4 z-30 flex justify-center px-4"
          >
            <div className="flex w-full max-w-2xl items-center justify-between gap-2">
              {/* Osa má vlastní „Zpět" v levém rohu → tady ho při otevřené ose skryjeme */}
              {!timelineOpen ? (
                <button
                  onClick={() => {
                    if (inRegionMode) {
                      setRegion(null);
                      setCountry(null);
                    } else handleSelectContinent(null);
                  }}
                  className="inline-flex items-center gap-1 rounded-full border-2 border-ink/10 bg-paper-light/90 px-4 py-2 font-display text-sm font-bold text-ink shadow-parchment backdrop-blur-sm transition-colors hover:bg-country-hover"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {inRegionMode ? "Zpět" : "Světadíly"}
                </button>
              ) : (
                <span />
              )}
              <span className="rounded-full bg-sun px-3 py-1.5 font-display text-sm font-bold text-ink shadow-sticker">
                {chip}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- KINEMATICKÁ ČASOVÁ OSA ---------- */}
      <AnimatePresence>
        {timelineOpen && timelineStories.length > 0 && (
          <motion.div
            key="timeline"
            className="absolute inset-x-0 bottom-0 z-40"
            initial={{ y: "100%", height: "68vh" }}
            animate={{ y: "0%", height: timelineExpanded ? "100%" : "68vh" }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.5, ease: EASE }}
            onMouseEnter={() => canHover && setFocus("timeline")}
          >
            <motion.div
              className={
                "h-full overflow-hidden shadow-parchment-lg transition-[border-radius] duration-500 " +
                (timelineExpanded ? "rounded-none" : "rounded-t-3xl")
              }
              animate={{
                y: !timelineExpanded && focus === "map" ? "6%" : "0%",
                opacity: !timelineExpanded && focus === "map" ? 0.8 : 1,
              }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <StoryTimeline
                countryName={timelineLabel}
                stories={timelineStories}
                onClose={closeTimeline}
                eras={erasForCountry(country)}
                onExpandedChange={setTimelineExpanded}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- HERO ---------- */}
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
