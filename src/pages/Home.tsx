import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { LoadingScreen } from "@/components/loading/LoadingScreen";
import { Hero } from "@/components/hero/Hero";
import { WorldMap } from "@/components/map/WorldMap";
import { StoryTimeline } from "@/components/timeline/StoryTimeline";
import { HistoryScroll } from "@/components/history/HistoryScroll";
import { storiesForCountry, storiesForRegion, PUBLISHED_STORIES } from "@/lib/history";
import { CountryCascadeSelect } from "@/components/stories/CountryCascadeSelect";
import { countryName } from "@/data/countries";
import { continentName, continentOfA3, type ContinentId } from "@/data/continents";
import { hasRegions, regionName } from "@/data/regions";
import { erasForCountry, WORLD_ERAS } from "@/data/eras";
import type { Story } from "@/data/stories";

type Phase = "loading" | "hero" | "map" | "history";
type Focus = "map" | "timeline";

const EASE = [0.76, 0, 0.24, 1] as const;

const canHover =
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// Uložení/obnova navigace mapy (světadíl → stát → kraj → osa), aby návrat z článku
// vrátil uživatele tam, kde byl, místo znovu-proklikávání celé mapy.
const NAV_KEY = "ph:map-nav";
// Jednorázový příznak „vracím se zpět" — nastaví ho tlačítko Zpět v článku/profilu.
// Bez něj Home pozici NEobnovuje (čerstvá návštěva „/" → hero, ne rovnou mapa/osa).
const RESTORE_KEY = "ph:nav-restore";
// Jednorázový příznak „Všechny příběhy" — Home naskočí do mapy s osou/přehledem přes
// všechny země (nad mapou) + výběrem země. Nastaví ho odkaz „Všechny příběhy".
const ALL_KEY = "ph:all-stories";
interface SavedNav {
  continent: ContinentId | null;
  country: string | null;
  region: string | null;
  timelineOpen: boolean;
  /** Osa/přehled přes celý svět (žádný stát vybraný) — aby ho návrat z článku obnovil. */
  world?: boolean;
}
function readSavedNav(): SavedNav | null {
  try {
    return JSON.parse(sessionStorage.getItem(NAV_KEY) || "null");
  } catch {
    return null;
  }
}

/** Zavolej těsně před návratem na „/", ať Home obnoví pozici mapy místo hera. */
export function markNavRestore() {
  try {
    sessionStorage.setItem(RESTORE_KEY, "1");
  } catch {
    /* sessionStorage nedostupný — ignoruj */
  }
}

/**
 * Zavolej před navigací na „/", ať Home rovnou naskočí do MAPY (přeskočí hero) —
 * volitelně zaostřené na světadíl/stát. Používá „Všechny příběhy" pro „Zpět na mapu".
 */
export function enterMap(nav?: Partial<SavedNav>) {
  try {
    sessionStorage.setItem(
      NAV_KEY,
      JSON.stringify({
        continent: nav?.continent ?? null,
        country: nav?.country ?? null,
        region: nav?.region ?? null,
        timelineOpen: nav?.timelineOpen ?? false,
      })
    );
    sessionStorage.setItem(RESTORE_KEY, "1");
  } catch {
    /* sessionStorage nedostupný — ignoruj */
  }
}

/** Zavolej před navigací na „/", ať Home otevře přehled/osu přes všechny země (nad mapou). */
export function markAllStories() {
  try {
    sessionStorage.setItem(ALL_KEY, "1");
  } catch {
    /* sessionStorage nedostupný — ignoruj */
  }
}

export default function Home() {
  // Pozici obnovíme jen když se uživatel vrací zpět (příznak RESTORE_KEY). Čtení
  // přes ref je bezpečné vůči StrictMode (dvojí render), příznak smažeme v efektu.
  const restoreRef = useRef<SavedNav | null | undefined>(undefined);
  if (restoreRef.current === undefined) {
    let flag: string | null = null;
    try {
      flag = sessionStorage.getItem(RESTORE_KEY);
    } catch {
      /* ignoruj */
    }
    restoreRef.current = flag ? readSavedNav() : null;
  }
  const saved = restoreRef.current;

  // „Všechny příběhy" (ALL_KEY) → Home naskočí do mapy s osou/přehledem přes všechny země.
  const allFlagRef = useRef<boolean | undefined>(undefined);
  if (allFlagRef.current === undefined) {
    let f: string | null = null;
    try {
      f = sessionStorage.getItem(ALL_KEY);
    } catch {
      /* ignoruj */
    }
    allFlagRef.current = !!f;
  }
  const startAll = allFlagRef.current;

  useEffect(() => {
    try {
      sessionStorage.removeItem(RESTORE_KEY);
      sessionStorage.removeItem(ALL_KEY);
    } catch {
      /* ignoruj */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [phase, setPhase] = useState<Phase>(saved || startAll ? "map" : "loading");
  const [continent, setContinent] = useState<ContinentId | null>(saved?.continent ?? null);
  const [country, setCountry] = useState<string | null>(saved?.country ?? null);
  const [region, setRegion] = useState<string | null>(saved?.region ?? null);
  const [timelineOpen, setTimelineOpen] = useState((saved?.timelineOpen ?? false) || startAll);
  // V „all" režimu je přehled rozbalený hned (nad mapou); overlay se v tom případě
  // vykreslí rovnou na místě (initial=false), takže neřešíme finicky vstupní animaci.
  const [timelineExpanded, setTimelineExpanded] = useState(startAll);
  // Svět (žádný stát) v ose/přehledu — přes „Všechny příběhy" nebo návrat na svět. Filtr
  // země (select) je vždy; konkrétní stát drží `country`, `allMode` = zobrazit celý svět.
  const [allMode, setAllMode] = useState(startAll || !!saved?.world);
  const allModeRef = useRef(allMode);
  allModeRef.current = allMode;
  const [focus, setFocus] = useState<Focus>("timeline");
  const revealTimer = useRef<number>(0);
  const timelineOpenRef = useRef(false);
  const historyScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    timelineOpenRef.current = timelineOpen;
    if (timelineOpen) setFocus("timeline");
    else setTimelineExpanded(false); // zavření osy → sbal grid zpět na 1. fold
  }, [timelineOpen]);

  // Změna země/kraje → zpět na osu (ne v rozbaleném gridu předchozí země). První běh
  // (mount) přeskočíme, ať se nerozbije obnova přehledu při návratu z článku.
  const firstCountryRef = useRef(true);
  const filterChangeRef = useRef(false);
  useEffect(() => {
    if (firstCountryRef.current) {
      firstCountryRef.current = false;
      return;
    }
    // Změna přes FILTR (select v přehledu) → zůstaň v přehledu (nesbaluj na osu).
    if (filterChangeRef.current) {
      filterChangeRef.current = false;
      return;
    }
    setTimelineExpanded(false);
  }, [country, region]);

  useEffect(() => () => clearTimeout(revealTimer.current), []);

  // Ulož navigaci mapy, ať návrat z článku (history back / „/") přistane tam, kde jsem byl.
  useEffect(() => {
    if (phase !== "map") return;
    try {
      sessionStorage.setItem(
        NAV_KEY,
        JSON.stringify({ continent, country, region, timelineOpen, world: allMode })
      );
    } catch {
      /* sessionStorage nedostupný — ignoruj */
    }
  }, [phase, continent, country, region, timelineOpen, allMode]);

  // Interakce s mapou (výběr světadílu/kraje/„svět") ukončí zobrazení celého světa — od
  // té chvíle řídí obsah vybraná země z mapy. (Výběr země přes filtr řeší filterCountry.)
  const exitAllMode = useCallback(() => {
    if (allModeRef.current) setAllMode(false);
  }, []);

  const handleSelectContinent = useCallback((id: ContinentId | null) => {
    exitAllMode();
    clearTimeout(revealTimer.current);
    setContinent(id);
    setCountry(null);
    setRegion(null);
    setTimelineOpen(false);
  }, []);

  const handleSelectCountry = useCallback((a3: string | null) => {
    exitAllMode();
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
    exitAllMode();
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
    // „Mapa" z osy → jen zavřít osu; mapa DRŽÍ aktuální výběr země (označená, přiblížená),
    // ať navazuje na filtr. Odzoomování řeší vlastní „Světadíly"/„Zpět" na mapě.
    setAllMode(false);
  }, []);

  // Rychlý filtr země ze selectu v přehledu — sync s mapou (výběr + přiblížení).
  // Null = „Všechny země" (celý svět). Osa/přehled zůstávají otevřené.
  const filterCountry = useCallback((a3: string | null) => {
    clearTimeout(revealTimer.current);
    filterChangeRef.current = true; // ať [country,region] efekt nesbalí přehled na osu
    setRegion(null);
    setCountry(a3);
    if (a3) {
      const c = continentOfA3(a3);
      if (c) setContinent(c);
      setAllMode(false);
    } else {
      setContinent(null);
      setAllMode(true);
    }
    setTimelineOpen(true);
  }, []);

  const inRegionMode = hasRegions(country);

  const timelineStories: Story[] = useMemo(() => {
    // Kraj > stát (i s kraji, přes filtr) > celý svět (žádný stát).
    if (region) return storiesForRegion(region);
    if (country) return storiesForCountry(country);
    if (allMode) return [...PUBLISHED_STORIES].sort((a, b) => a.yearFrom - b.yearFrom);
    return [];
  }, [allMode, country, region]);

  const timelineLabel = region
    ? regionName(region)
    : country
    ? countryName(country)
    : allMode
    ? "Svět"
    : "";
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
      {phase !== "loading" && phase !== "history" && (
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
            // „All" režim: overlay je přítomný hned → vykreslit rovnou na místě (bez vstupní
            // animace). Jinak (příchod z mapy) plynulý výjezd zdola. Výška v % (ne vh) — stejná
            // jednotka jako rozbalený stav, aby změna výšky (Zpět na osu) plynule animovala.
            initial={startAll ? false : { y: "100%", height: "72%" }}
            animate={{ y: "0%", height: timelineExpanded ? "100%" : "72%" }}
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
                eras={(country && erasForCountry(country)) || WORLD_ERAS}
                onExpandedChange={setTimelineExpanded}
                initialMode={startAll ? "grid" : undefined}
                countryCode={country ?? ""}
                countrySelect={<CountryCascadeSelect value={country} onChange={filterCountry} />}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- VRSTVA HISTORIE (dlouhý vertikální scroll) ---------- */}
      {phase === "history" && (
        <motion.div
          key="history-layer"
          ref={historyScrollRef}
          className="absolute inset-0 z-30 overflow-y-auto overflow-x-hidden bg-paper"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          {/* Návrat na úvod (hero) */}
          <button
            onClick={() => setPhase("hero")}
            className="fixed left-4 top-20 z-40 inline-flex items-center gap-1 rounded-full border-2 border-ink/10 bg-paper-light/90 px-4 py-2 font-display text-sm font-bold text-ink shadow-parchment backdrop-blur-sm transition-colors hover:bg-country-hover"
          >
            <ChevronLeft className="h-4 w-4" />
            Úvod
          </button>
          <HistoryScroll containerRef={historyScrollRef} />
        </motion.div>
      )}

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
            <Hero onEnter={() => setPhase("map")} onHistory={() => setPhase("history")} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
