import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ComposableMap,
  Geographies,
  ZoomableGroup,
  Sphere,
  Graticule,
  Marker,
} from "react-simple-maps";
import { geoCentroid, geoPath } from "d3-geo";
import { feature, merge } from "topojson-client";
import { mapTheme, continentTheme } from "@/config/mapTheme";
import { countryByNumeric } from "@/data/countries";
import {
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
  }, [selectedContinent]);

  const { palette, country: cs } = mapTheme;
  const level: "world" | "continent" = selectedContinent ? "continent" : "world";
  const contZoom = selectedContinent ? continentMeta(selectedContinent)?.zoom ?? 2.2 : 1;
  const markR = 3.4 / contZoom; // konstantní velikost markeru bez ohledu na zoom

  return (
    <div className="relative h-full w-full overflow-hidden">
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
          onMoveEnd={(pos) => setView(pos as View)}
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
                    {level === "world"
                      ? // ----- SVĚT: jen obrysy světadílů -----
                        prepared.continentFeatures.map(({ id, feature: cf }) => {
                          const has = storyContinents.has(id);
                          const isHovered = id === hoveredContinent;
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
                        })
                      : // ----- SVĚTADÍL: nakreslí se jednotlivé státy -----
                        prepared.countriesByContinent[selectedContinent!]?.map((f, i) => {
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
                  </g>

                  {/* Popisky / markery mimo zkreslující filtr */}
                  {level === "world"
                    ? // Názvy světadílů (jen ty s příběhy)
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
                        })
                    : // Pulzující „klikni sem" body na státech s příběhy
                      prepared.countriesByContinent[selectedContinent!]
                        ?.map((f) => {
                          const a3 = countryByNumeric(String(f.id))?.a3;
                          if (!a3 || !storyCodes.has(a3) || a3 === selectedCountry) return null;
                          const c = prepared.countryCentroids[a3];
                          if (!c) return null;
                          return (
                            <Marker key={`mk-${a3}`} coordinates={c}>
                              <circle r={markR} fill={SUN} stroke={palette.ink} strokeWidth={markR * 0.25} />
                              <circle r={markR} fill="none" stroke={SUN} strokeWidth={markR * 0.4}>
                                <animate attributeName="r" values={`${markR};${markR * 3};${markR}`} dur="1.8s" repeatCount="indefinite" />
                                <animate attributeName="opacity" values="0.8;0;0.8" dur="1.8s" repeatCount="indefinite" />
                              </circle>
                            </Marker>
                          );
                        })}
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
