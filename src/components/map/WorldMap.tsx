import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Sphere,
  Graticule,
} from "react-simple-maps";
import { geoCentroid } from "d3-geo";
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

export function WorldMap({
  selectedContinent,
  selectedCountry,
  onSelectContinent,
  onSelectCountry,
}: WorldMapProps) {
  const storyCodes = useMemo(() => countryCodesWithStories(), []);
  const storyContinents = useMemo(() => continentsWithStories(), []);
  const centroids = useRef<Record<string, [number, number]>>({});

  const [hoveredContinent, setHoveredContinent] = useState<ContinentId | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<{ name: string; hasStories: boolean } | null>(null);

  const [view, setView] = useState<View>(DEFAULT_VIEW);
  const viewRef = useRef<View>(DEFAULT_VIEW);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  /** Plynulá animace pohledu (zoom + pan). */
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

  // Reakce na výběr: stát → přiblížení na stát; jinak světadíl; jinak celý svět.
  useEffect(() => {
    if (selectedCountry && centroids.current[selectedCountry]) {
      animateTo({
        coordinates: centroids.current[selectedCountry],
        zoom: mapTheme.zoom.selectedZoom,
      });
    } else if (selectedContinent) {
      const m = continentMeta(selectedContinent);
      if (m) animateTo({ coordinates: m.center, zoom: m.zoom });
    } else {
      animateTo(DEFAULT_VIEW);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry, selectedContinent]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // Reset hoveru při změně úrovně
  useEffect(() => {
    setHoveredContinent(null);
    setHoveredCountry(null);
  }, [selectedContinent]);

  const { palette, country: cs } = mapTheme;
  const level: "world" | "continent" = selectedContinent ? "continent" : "world";

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
            {({ geographies }) => (
              <g filter={mapTheme.roughEdges.enabled ? "url(#rough-edges)" : undefined}>
                {geographies.map((geo) => {
                  const meta = countryByNumeric(geo.id);
                  const a3 = meta?.a3;
                  if (a3) centroids.current[a3] = geoCentroid(geo);
                  const cont = continentOfNumeric(String(geo.id));
                  const hasStories = a3 ? storyCodes.has(a3) : false;

                  // ----- ÚROVEŇ SVĚT: kontinenty jako celky -----
                  if (level === "world") {
                    const continentHasStories = cont ? storyContinents.has(cont) : false;
                    const isHovered = cont != null && cont === hoveredContinent;
                    const fill = !cont
                      ? cs.default.fill
                      : isHovered
                      ? continentTheme.hoverFill
                      : continentTheme.tints[cont];

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onClick={() => cont && onSelectContinent(cont)}
                        onMouseEnter={() => cont && setHoveredContinent(cont)}
                        onMouseLeave={() => setHoveredContinent(null)}
                        style={{
                          default: {
                            fill,
                            stroke: `rgba(47,42,36,${continentTheme.worldStrokeOpacity})`,
                            strokeWidth: 0.4,
                            outline: "none",
                            transition: "fill 0.2s ease",
                            cursor: cont ? "pointer" : "default",
                            opacity: cont ? 1 : continentTheme.mutedOpacity,
                          },
                          hover: {
                            fill: isHovered || continentHasStories || cont ? continentTheme.hoverFill : fill,
                            stroke: continentTheme.hoverStroke,
                            strokeWidth: 0.5,
                            outline: "none",
                            cursor: cont ? "pointer" : "default",
                          },
                          pressed: { fill: continentTheme.hoverFill, outline: "none" },
                        }}
                      />
                    );
                  }

                  // ----- ÚROVEŇ SVĚTADÍL: státy se „rozdělí" -----
                  const isMember = cont === selectedContinent;
                  const isSelected = a3 != null && a3 === selectedCountry;

                  if (!isMember) {
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        style={{
                          default: {
                            fill: continentTheme.mutedFill,
                            stroke: `rgba(47,42,36,0.08)`,
                            strokeWidth: 0.3,
                            outline: "none",
                            opacity: continentTheme.mutedOpacity,
                            pointerEvents: "none",
                          },
                          hover: { fill: continentTheme.mutedFill, outline: "none" },
                          pressed: { outline: "none" },
                        }}
                      />
                    );
                  }

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
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => hasStories && a3 && onSelectCountry(a3)}
                      onMouseEnter={() =>
                        meta && setHoveredCountry({ name: meta.name, hasStories })
                      }
                      onMouseLeave={() => setHoveredCountry(null)}
                      style={{
                        default: {
                          fill,
                          stroke,
                          strokeWidth,
                          outline: "none",
                          transition: "fill 0.2s ease",
                          cursor: hasStories ? "pointer" : "default",
                        },
                        hover: {
                          fill: hasStories ? cs.hover.fill : fill,
                          stroke: cs.hover.stroke,
                          strokeWidth: cs.hover.strokeWidth,
                          outline: "none",
                          cursor: hasStories ? "pointer" : "default",
                        },
                        pressed: {
                          fill: cs.selected.fill,
                          stroke: cs.selected.stroke,
                          strokeWidth: cs.selected.strokeWidth,
                          outline: "none",
                        },
                      }}
                    />
                  );
                })}
              </g>
            )}
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

      {/* Popisek — světadíl (svět) nebo stát (světadíl) */}
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
