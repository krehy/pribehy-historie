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
import { mapTheme } from "@/config/mapTheme";
import { countryByNumeric } from "@/data/countries";
import { countryCodesWithStories } from "@/lib/history";
import { CompassRose } from "./CompassRose";
import { MapFrame } from "./MapFrame";
import { ParchmentDefs } from "./ParchmentDefs";

// Respektuje base (na GitHub Pages je to /pribehy-historie/).
const GEO_URL = `${import.meta.env.BASE_URL}world-110m.json`;

interface View {
  coordinates: [number, number];
  zoom: number;
}

interface WorldMapProps {
  selectedCountry: string | null;
  onSelectCountry: (a3: string | null) => void;
}

const DEFAULT_VIEW: View = {
  coordinates: mapTheme.projection.center,
  zoom: mapTheme.zoom.defaultZoom,
};

export function WorldMap({ selectedCountry, onSelectCountry }: WorldMapProps) {
  const storyCodes = useMemo(() => countryCodesWithStories(), []);
  const centroids = useRef<Record<string, [number, number]>>({});
  const [hovered, setHovered] = useState<{ name: string; hasStories: boolean } | null>(null);
  const [view, setView] = useState<View>(DEFAULT_VIEW);
  const viewRef = useRef<View>(DEFAULT_VIEW);
  const rafRef = useRef<number>(0);

  // Zrcadlo aktuálního pohledu, ať z něj animace umí vyjít.
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  /** Plynulá animace pohledu (zoom + pan) pomocí RAF a easingu. */
  const animateTo = useCallback((target: View) => {
    cancelAnimationFrame(rafRef.current);
    const startTime = performance.now();
    const duration = mapTheme.zoom.transition * 1000;
    const from = viewRef.current;

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
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

  // Reakce na změnu vybraného státu → přiblížení nebo návrat na celý svět.
  useEffect(() => {
    if (selectedCountry && centroids.current[selectedCountry]) {
      animateTo({
        coordinates: centroids.current[selectedCountry],
        zoom: mapTheme.zoom.selectedZoom,
      });
    } else if (!selectedCountry) {
      animateTo(DEFAULT_VIEW);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const { palette, country: cs } = mapTheme;

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
                  const opacity = hasStories ? 1 : cs.muted.opacity ?? 1;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => hasStories && a3 && onSelectCountry(a3)}
                      onMouseEnter={() =>
                        meta && setHovered({ name: meta.name, hasStories })
                      }
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        default: {
                          fill,
                          stroke,
                          strokeWidth,
                          opacity,
                          outline: "none",
                          transition: "fill 0.25s ease, opacity 0.25s ease",
                          cursor: hasStories ? "pointer" : "default",
                        },
                        hover: {
                          fill: hasStories ? cs.hover.fill : fill,
                          stroke: cs.hover.stroke,
                          strokeWidth: cs.hover.strokeWidth,
                          opacity: 1,
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

      {/* Papírová textura — overlay vrstva (nízká opacita, ať zůstane světlá) */}
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

      {/* Vinětace — jemné ztmavení okrajů */}
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

      {/* Kompasová růžice */}
      <CompassRose className="absolute bottom-6 right-6 opacity-90" />

      {/* Popisek státu při hoveru */}
      {hovered && (
        <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2">
          <div className="rounded-full border border-stroke/50 bg-paper-light/90 px-4 py-1.5 shadow-parchment backdrop-blur-sm">
            <span className="font-display text-sm tracking-wide text-ink">
              {hovered.name}
            </span>
            {!hovered.hasStories && (
              <span className="ml-2 font-script text-xs italic text-ink-soft">
                zatím bez příběhů
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
