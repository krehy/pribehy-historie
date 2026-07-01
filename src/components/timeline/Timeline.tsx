import { motion } from "framer-motion";
import { mapTheme } from "@/config/mapTheme";
import { formatRange, formatYear, timelineForCountry } from "@/lib/history";
import type { Story } from "@/data/stories";
import { cn } from "@/lib/utils";

interface TimelineProps {
  countryCode: string;
  /** Aktivní příběh (vybraný časový bod), pokud nějaký */
  activeStoryId: string | null;
  onSelect: (story: Story | null) => void;
}

/**
 * Časová osa vybraného státu. Body reprezentují příběhy; klik vyfiltruje
 * příběh(y) pro daný bod. Data se odvozují z příběhů.
 */
export function Timeline({ countryCode, activeStoryId, onSelect }: TimelineProps) {
  const { min, max, segments } = timelineForCountry(countryCode);
  if (segments.length === 0) return null;

  const { stroke, ink } = mapTheme.palette;
  // Hořčičková žlutá — hlavní akcent značky (sladěno s IG grafikou)
  const sun = "#f4c430";

  return (
    <div className="w-full">
      <div className="mb-6 flex items-baseline justify-between font-display text-sm tracking-wide text-ink-soft">
        <span>{formatYear(min)}</span>
        <span className="font-serif italic text-base italic">osa dějin</span>
        <span>{formatYear(max)}</span>
      </div>

      <div className="relative h-24 select-none">
        {/* Základní linka */}
        <div
          className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full"
          style={{ background: `linear-gradient(90deg, transparent, ${stroke}, transparent)` }}
        />
        {/* Značky desetiletí/století (jen dekorativní tiky) */}
        {Array.from({ length: 11 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-stroke/40"
            style={{ left: `${i * 10}%` }}
          />
        ))}

        {segments.map(({ story, position }, idx) => {
          const active = story.id === activeStoryId;
          return (
            <motion.button
              key={story.id}
              onClick={() => onSelect(active ? null : story)}
              className="group absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${Math.min(96, Math.max(4, position * 100))}%` }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05 * idx, type: "spring", stiffness: 260, damping: 20 }}
              aria-pressed={active}
              title={`${story.title} — ${formatRange(story.yearFrom, story.yearTo)}`}
            >
              {/* Bod */}
              <span
                className={cn(
                  "block h-4 w-4 rounded-full border-2 transition-all group-hover:scale-125",
                  active ? "shadow-[0_0_0_6px_rgba(244,196,48,0.28)]" : ""
                )}
                style={{
                  background: active ? sun : "#fdfaf0",
                  borderColor: active ? ink : sun,
                }}
              />
              {/* Rok pod bodem */}
              <span
                className={cn(
                  "absolute left-1/2 top-6 -translate-x-1/2 whitespace-nowrap font-display text-[11px] tracking-wide transition-colors",
                  active ? "text-ink" : "text-ink-soft group-hover:text-ink"
                )}
              >
                {formatYear(story.yearFrom)}
              </span>
              {/* Bublina s názvem nad bodem */}
              <span className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-stroke/40 bg-paper-light px-2 py-1 text-[11px] text-ink opacity-0 shadow-parchment transition-opacity group-hover:opacity-100">
                {story.title}
              </span>
            </motion.button>
          );
        })}
      </div>

      {activeStoryId && (
        <div className="mt-4 text-center">
          <button
            onClick={() => onSelect(null)}
            className="font-display text-sm font-semibold text-sun-deep underline-offset-4 hover:underline"
          >
            zrušit filtr období — zobrazit všechny příběhy země
          </button>
        </div>
      )}
    </div>
  );
}
