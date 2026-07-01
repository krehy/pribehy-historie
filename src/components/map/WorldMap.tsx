import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ComposableMap,
  Geographies,
  ZoomableGroup,
  Sphere,
  Graticule,
  Marker,
} from "react-simple-maps";
import { geoCentroid, geoPath, geoDistance } from "d3-geo";
import { feature, merge } from "topojson-client";
import { mapTheme, continentTheme } from "@/config/mapTheme";
import { countryByNumeric } from "@/data/countries";
import {
  CONTINENTS,
  continentOfNumeric,
  continentMeta,
  continentName,
  type ContinentId,
} from "@/data/continents";
import { countryCodesWithStories, continentsWithStories } from "@/lib/history";
import { CompassRose } from "./CompassRose";
import { MapFrame } from "./MapFrame";
import { ParchmentDefs } from "./ParchmentDefs";

const GEO_URL = `${import.meta.env.BASE_URL}world-110m.json`;
const SUN = "#f4c430";

/**
 * Interní souřadnicový systém <ComposableMap> (výchozí width×height).
 * translateExtent na tento obdélník drží mapu v zorném poli — při zoomu 1
 * nejde posouvat vůbec, při větším zoomu okraje mapy nepřejedou přes rám.
 */
const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;
const TRANSLATE_EXTENT: [[number, number], [number, number]] = [
  [0, 0],
  [MAP_WIDTH, MAP_HEIGHT],
];

/** Kolik navíc jde přiblížit vybraný světadíl kolečkem (pro husté oblasti s malými státy). */
const CONTINENT_EXTRA_ZOOM = 1.6;

/** Světadíl, jehož střed je nejblíž danému středu pohledu (great-circle). */
function nearestContinent(coords: [number, number]): ContinentId | null {
  let best: ContinentId | null = null;
  let bestDist = Infinity;
  for (const c of CONTINENTS) {
    const d = geoDistance(coords, c.center);
    if (d < bestDist) {
      bestDist = d;
      best = c.id;
    }
  }
  return best;
}

interface View {
  coordinates: [number, number];
  zoom: number;
}

interface WorldMapProps {
  selectedContinent: ContinentId | null;
  selectedCountry: string | null;
  onSelectContinent: (id: ContinentId | null) => void;
  onSelectCountry: (a3: string | null) => void;
}

const DEFAULT_VIEW: View = {
  coordinates: mapTheme.projection.center,
  zoom: mapTheme.zoom.defaultZoom,
};

/* eslint-disable @typescript-eslint/no-explicit-any */

export function WorldMap({
  selectedContinent,
  selectedCountry,
  onSelectContinent,
  onSelectCountry,
}: WorldMapProps) {
  const storyCodes = useMemo(() => countryCodesWithStories(), []);
  const storyContinents = useMemo(() => continentsWithStories(), []);

  const [topo, setTopo] = useState<any>(null);
  const [hoveredContinent, setHoveredContinent] = useState<ContinentId | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<{ name: string; hasStories: boolean } | null>(null);

  const [view, setView] = useState<View>(DEFAULT_VIEW);
  const viewRef = useRef<View>(DEFAULT_VIEW);
  const rafRef = useRef<number>(0);
  /** true = změnu světadílu vyvolalo tažení mapy → nepřecentrovávat. */
  const panSwitchRef = useRef(false);
  /** Wrapper mapy — pro vlastní wheel handler (diskrétní přiblížení světadílu). */
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomedInRef = useRef(false);
  const wheelLockRef = useRef(false);

  useEffect(() => {
    let ok = true;
    fetch(GEO_URL)
      .then((r) => r.json())
      .then((t) => ok && setTopo(t))
      .catch(() => {});
    return () => {
      ok = false;
    };
  }, []);

  const prepared = useMemo(() => {
    if (!topo) return null;
    const geoms = topo.objects.countries.geometries as any[];

    const contGroups: Record<string, any[]> = {};
    for (const g of geoms) {
      const c = continentOfNumeric(String(g.id));
      if (!c) continue;
      (contGroups[c] ||= []).push(g);
    }
    const continentFeatures = Object.entries(contGroups).map(([id, gs]) => ({
      id: id as ContinentId,
      feature: { type: "Feature", properties: {}, geometry: merge(topo, gs) } as any,
    }));

    const allFeatures = (feature(topo, topo.objects.countries) as any).features as any[];
    const countriesByContinent: Record<string, any[]> = {};
    const countryCentroids: Record<string, [number, number]> = {};
    for (const f of allFeatures) {
      const c = continentOfNumeric(String(f.id));
      if (!c) continue;
      (countriesByContinent[c] ||= []).push(f);
      const a3 = countryByNumeric(String(f.id))?.a3;
      if (a3) countryCentroids[a3] = geoCentroid(f);
    }
    return { continentFeatures, countriesByContinent, countryCentroids };
  }, [topo]);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const animateTo = useCallback((target: View) => {
    cancelAnimationFrame(rafRef.current);
    const startTime = performance.now();
    const duration = mapTheme.zoom.transition * 1000;
    const from = viewRef.current;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const [flon, flat] = from.coordinates;
      const [tlon, tlat] = target.coordinates;
      setView({
        coordinates: [flon + (tlon - flon) * eased, flat + (tlat - flat) * eased],
        zoom: from.zoom + (target.zoom - from.zoom) * eased,
      });
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (!prepared) return;
    // Změna světadílu vyvolaná tažením: jen přeznačit, mapu nepřecentrovávat.
    if (panSwitchRef.current) {
      panSwitchRef.current = false;
      return;
    }
    if (selectedCountry && prepared.countryCentroids[selectedCountry]) {
      animateTo({
        coordinates: prepared.countryCentroids[selectedCountry],
        zoom: mapTheme.zoom.selectedZoom,
      });
    } else if (selectedContinent) {
      const m = continentMeta(selectedContinent);
      if (m) animateTo({ coordinates: m.center, zoom: m.zoom });
    } else {
      animateTo(DEFAULT_VIEW);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry, selectedContinent, prepared]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  useEffect(() => {
    setHoveredContinent(null);
    setHoveredCountry(null);
    zoomedInRef.current = false; // nový světadíl → zpět na přehled
  }, [selectedContinent]);

  // Vlastní kolečko: JEDNO kolečko = jeden plynulý krok na předdefinovanou
  // úroveň (přehled světadílu ↔ blíž), ne volné zoomování. Jen na světadílu.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!selectedContinent || selectedCountry) return;
      e.preventDefault();
      if (wheelLockRef.current) return;
      const zoomIn = e.deltaY < 0;
      if (zoomIn === zoomedInRef.current) return; // už v této úrovni
      zoomedInRef.current = zoomIn;
      wheelLockRef.current = true;
      const cz = continentMeta(selectedContinent)?.zoom ?? 2.2;
      animateTo({
        coordinates: viewRef.current.coordinates,
        zoom: zoomIn ? cz * CONTINENT_EXTRA_ZOOM : cz,
      });
      window.setTimeout(() => {
        wheelLockRef.current = false;
      }, 650);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [selectedContinent, selectedCountry, animateTo]);

  const { palette, country: cs } = mapTheme;
  const level: "world" | "continent" = selectedContinent ? "continent" : "world";
  const contZoom = selectedContinent ? continentMeta(selectedContinent)?.zoom ?? 2.2 : 1;
  const markR = 3.4 / contZoom; // konstantní velikost markeru bez ohledu na zoom
  const labelSize = 8 / contZoom; // názvy států — konstantní velikost i po přiblížení

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{
          scale: mapTheme.projection.scale,
          rotate: mapTheme.projection.rotate,
        }}
        className="h-full w-full"
        style={{ background: palette.ocean }}
      >
        <ParchmentDefs />

        <ZoomableGroup
          center={view.coordinates}
          zoom={view.zoom}
          minZoom={mapTheme.zoom.minZoom}
          maxZoom={mapTheme.zoom.maxZoom}
          translateExtent={TRANSLATE_EXTENT}
          filterZoomEvent={(e: any) => {
            const t = e?.type;
            // Kolečko i dvojklik řešíme sami (diskrétní krok) — d3 zoom je nech.
            return t !== "wheel" && t !== "dblclick";
          }}
          onMoveEnd={(pos) => {
            const v = pos as View;
            setView(v);
            // Tažením se výběr přeznačí na světadíl nejvíc ve středu pohledu.
            if (selectedContinent && !selectedCountry) {
              const near = nearestContinent(v.coordinates);
              if (near && near !== selectedContinent) {
                panSwitchRef.current = true;
                onSelectContinent(near);
              }
            }
          }}
        >
          <Sphere id="sphere" stroke={palette.stroke} strokeWidth={0.6} fill="transparent" />
          <Graticule stroke={palette.stroke} strokeWidth={0.25} strokeOpacity={0.35} />

          <Geographies geography={GEO_URL}>
            {({ path, projection }) => {
              const draw = path || geoPath(projection as any);
              if (!prepared) return null;

              return (
                <>
                  <g filter={mapTheme.roughEdges.enabled ? "url(#rough-edges)" : undefined}>
                    {/* ----- OBRYSY SVĚTADÍLŮ ----- */}
                    {prepared.continentFeatures.map(({ id, feature: cf }) => {
                      const isActive = id === selectedContinent;
                      // Vybraný světadíl kreslíme přes jednotlivé státy → blob vynecháme.
                      if (level === "continent" && isActive) return null;

                      const has = storyContinents.has(id);
                      const isHovered = id === hoveredContinent;

                      if (level === "world") {
                        const fill = isHovered
                          ? continentTheme.hoverFill
                          : has
                          ? continentTheme.tints[id] ?? cs.default.fill
                          : "#efe8d3";
                        return (
                          <path
                            key={id}
                            d={draw(cf) || undefined}
                            onClick={() => has && onSelectContinent(id)}
                            onMouseEnter={() => has && setHoveredContinent(id)}
                            onMouseLeave={() => setHoveredContinent(null)}
                            style={{
                              fill,
                              stroke: palette.ink,
                              strokeWidth: isHovered ? 1.1 : has ? 0.8 : 0.4,
                              strokeOpacity: has ? 0.9 : 0.4,
                              opacity: has ? 1 : 0.5,
                              cursor: has ? "pointer" : "default",
                              outline: "none",
                              transition: "fill 0.25s ease, stroke-width 0.2s ease",
                            }}
                          />
                        );
                      }

                      // ----- Stav světadílu: ostatní světadíly ztlumené, ale klikací -----
                      return (
                        <path
                          key={id}
                          d={draw(cf) || undefined}
                          onClick={() => onSelectContinent(id)}
                          onMouseEnter={() => setHoveredContinent(id)}
                          onMouseLeave={() => setHoveredContinent(null)}
                          style={{
                            fill: isHovered ? continentTheme.hoverFill : "#ece2c8",
                            stroke: palette.ink,
                            strokeWidth: 0.4,
                            strokeOpacity: 0.4,
                            opacity: isHovered ? 0.75 : 0.42,
                            cursor: "pointer",
                            outline: "none",
                            transition: "fill 0.25s ease, opacity 0.2s ease",
                          }}
                        />
                      );
                    })}

                    {/* ----- Stav světadílu: státy vybraného světadílu (plynulý fade) ----- */}
                    <AnimatePresence>
                      {level === "continent" && (
                        <motion.g
                          key={selectedContinent}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.45, ease: "easeInOut" }}
                        >
                          {prepared.countriesByContinent[selectedContinent!]?.map((f, i) => {
                          const numeric = String(f.id);
                          const meta = countryByNumeric(numeric);
                          const a3 = meta?.a3;
                          const hasStories = a3 ? storyCodes.has(a3) : false;
                          const isSelected = a3 != null && a3 === selectedCountry;

                          const fill = isSelected
                            ? cs.selected.fill
                            : hasStories
                            ? cs.hasStories.fill ?? cs.default.fill
                            : cs.default.fill;
                          const stroke = isSelected
                            ? cs.selected.stroke
                            : hasStories
                            ? cs.hasStories.stroke ?? cs.default.stroke
                            : cs.default.stroke;
                          const strokeWidth = isSelected
                            ? cs.selected.strokeWidth
                            : hasStories
                            ? cs.hasStories.strokeWidth ?? cs.default.strokeWidth
                            : cs.default.strokeWidth;

                          return (
                            <path
                              key={f.rsmKey || `${numeric}-${i}`}
                              d={draw(f) || undefined}
                              onClick={() => hasStories && a3 && onSelectCountry(a3)}
                              onMouseEnter={() =>
                                meta && setHoveredCountry({ name: meta.name, hasStories })
                              }
                              onMouseLeave={() => setHoveredCountry(null)}
                              style={{
                                fill,
                                stroke,
                                strokeWidth,
                                opacity: hasStories ? 1 : 0.8,
                                cursor: hasStories ? "pointer" : "default",
                                outline: "none",
                                transition: "fill 0.2s ease",
                              }}
                            />
                          );
                          })}
                        </motion.g>
                      )}
                    </AnimatePresence>
                  </g>

                  {/* Popisky / markery mimo zkreslující filtr */}
                  {level === "world" &&
                    prepared.continentFeatures
                        .filter(({ id }) => storyContinents.has(id))
                        .map(({ id }) => {
                          const m = continentMeta(id);
                          if (!m) return null;
                          return (
                            <Marker key={`lbl-${id}`} coordinates={m.center}>
                              <text
                                textAnchor="middle"
                                dy={2}
                                style={{
                                  fontFamily: '"Baloo 2", sans-serif',
                                  fontWeight: 800,
                                  fontSize: 9,
                                  fill: palette.ink,
                                  paintOrder: "stroke",
                                  stroke: palette.paperLight,
                                  strokeWidth: 2.4,
                                  strokeLinejoin: "round",
                                  pointerEvents: "none",
                                }}
                              >
                                {m.name}
                              </text>
                            </Marker>
                          );
                        })}

                  {/* Stav světadílu: ztlumené názvy ostatních světadílů + státy vybraného (plynulý fade) */}
                  <AnimatePresence>
                    {level === "continent" && (
                      <motion.g
                        key={`lbls-${selectedContinent}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.45, ease: "easeInOut" }}
                      >
                          {CONTINENTS.filter((cc) => cc.id !== selectedContinent).map(
                            (cc) => (
                              <Marker key={`clbl-${cc.id}`} coordinates={cc.center}>
                                <text
                                  textAnchor="middle"
                                  dy={2}
                                  onClick={() => onSelectContinent(cc.id)}
                                  style={{
                                    fontFamily: '"Baloo 2", sans-serif',
                                    fontWeight: 800,
                                    fontSize: 8,
                                    fill: palette.ink,
                                    opacity: 0.35,
                                    paintOrder: "stroke",
                                    stroke: palette.paperLight,
                                    strokeWidth: 2,
                                    strokeLinejoin: "round",
                                    cursor: "pointer",
                                  }}
                                >
                                  {cc.name}
                                </text>
                              </Marker>
                            )
                          )}
                          {prepared.countriesByContinent[selectedContinent!]?.map((f) => {
                          const numeric = String(f.id);
                          const meta = countryByNumeric(numeric);
                          const a3 = meta?.a3;
                          const hasStories = a3 ? storyCodes.has(a3) : false;
                          const isSelected = a3 != null && a3 === selectedCountry;
                          const c = geoCentroid(f);
                          if (!c || Number.isNaN(c[0]) || Number.isNaN(c[1])) return null;
                          const label = meta?.name ?? (f.properties?.name as string | undefined);
                          const showPulse = hasStories && !isSelected;
                          return (
                            <Marker key={`mk-${numeric}`} coordinates={c}>
                              {showPulse && (
                                <>
                                  <circle r={markR} fill={SUN} stroke={palette.ink} strokeWidth={markR * 0.25} />
                                  <circle r={markR} fill="none" stroke={SUN} strokeWidth={markR * 0.4}>
                                    <animate attributeName="r" values={`${markR};${markR * 3};${markR}`} dur="1.8s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.8;0;0.8" dur="1.8s" repeatCount="indefinite" />
                                  </circle>
                                </>
                              )}
                              {label && (
                                <text
                                  textAnchor="middle"
                                  dy={showPulse ? markR * 2 + labelSize : labelSize * 0.32}
                                  style={{
                                    fontFamily: '"Baloo 2", sans-serif',
                                    fontWeight: hasStories ? 800 : 600,
                                    fontSize: labelSize,
                                    fill: palette.ink,
                                    opacity: hasStories ? 1 : 0.5,
                                    paintOrder: "stroke",
                                    stroke: palette.paperLight,
                                    strokeWidth: labelSize * 0.3,
                                    strokeLinejoin: "round",
                                    pointerEvents: "none",
                                  }}
                                >
                                  {label}
                                </text>
                              )}
                            </Marker>
                          );
                        })}
                      </motion.g>
                    )}
                  </AnimatePresence>
                </>
              );
            }}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Papírová textura */}
      {mapTheme.paperTexture.enabled && (
        <div
          className="pointer-events-none absolute inset-0 mix-blend-multiply"
          style={{
            opacity: mapTheme.paperTexture.opacity,
            backgroundColor: mapTheme.paperTexture.tint,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23p)'/%3E%3C/svg%3E\")",
          }}
        />
      )}

      {/* Vinětace */}
      {mapTheme.vignette.enabled && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow: `inset 0 0 160px 40px ${mapTheme.vignette.color}`,
            opacity: mapTheme.vignette.opacity,
          }}
        />
      )}

      <MapFrame />
      <CompassRose className="absolute bottom-6 right-6 opacity-90" />

      {/* Popisek při hoveru */}
      {(level === "world" ? hoveredContinent : hoveredCountry) && (
        <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2">
          <div className="rounded-full border-2 border-ink/10 bg-paper-light/90 px-4 py-1.5 shadow-parchment backdrop-blur-sm">
            <span className="font-display font-bold tracking-wide text-ink">
              {level === "world"
                ? continentName(hoveredContinent!)
                : hoveredCountry!.name}
            </span>
            {level === "continent" && hoveredCountry && !hoveredCountry.hasStories && (
              <span className="ml-2 font-serif text-sm italic text-ink-soft">
                zatím bez příběhů
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
