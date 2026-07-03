import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Globe, Check } from "lucide-react";
import { countriesWithStories } from "@/lib/history";
import { countryName } from "@/data/countries";
import { CONTINENTS, continentOfA3, type ContinentId } from "@/data/continents";

/**
 * CountryCascadeSelect — custom rozbalovací výběr země pro „Všechny příběhy".
 * Nejdřív se otevře seznam SVĚTADÍLŮ; kliknutím na světadíl se jako kategorie
 * rozbalí jeho STÁTY (jen ty, které mají příběhy). Výběr státu filtruje přehled;
 * „Všechny země" filtr zruší. Nahrazuje mapu tam, kde se do přehledu vchází bez ní.
 */
interface CountryCascadeSelectProps {
  /** Vybraný stát (ISO A3) nebo null = všechny země. */
  value: string | null;
  onChange: (a3: string | null) => void;
}

export function CountryCascadeSelect({ value, onChange }: CountryCascadeSelectProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<ContinentId | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Státy s příběhy seskupené podle světadílu, v pořadí CONTINENTS.
  const groups = useMemo(() => {
    const byCont = new Map<ContinentId, { a3: string; name: string; count: number }[]>();
    for (const c of countriesWithStories()) {
      const cont = continentOfA3(c.a3);
      if (!cont) continue;
      if (!byCont.has(cont)) byCont.set(cont, []);
      byCont.get(cont)!.push({ a3: c.a3, name: c.name, count: c.count });
    }
    return CONTINENTS.filter((ct) => byCont.has(ct.id)).map((ct) => ({
      id: ct.id,
      name: ct.name,
      countries: byCont.get(ct.id)!.sort((a, b) => a.name.localeCompare(b.name, "cs")),
    }));
  }, []);

  // Zavřít při kliknutí mimo + Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Při otevření předrozbal světadíl aktuálně vybraného státu.
  const toggleOpen = () => {
    setOpen((o) => {
      if (!o) setExpanded(value ? continentOfA3(value) ?? null : null);
      return !o;
    });
  };

  const label = value ? countryName(value) : "Všechny země";

  const pickCountry = (a3: string | null) => {
    onChange(a3);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full border border-paper-light/25 bg-black/30 px-4 py-2 font-display text-sm font-bold text-paper-light transition-colors hover:bg-black/55"
      >
        <Globe className="h-4 w-4 text-sun" />
        {label}
        <ChevronDown className={"h-4 w-4 transition-transform " + (open ? "rotate-180" : "")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="absolute left-0 top-full z-50 mt-2 max-h-[70vh] w-72 overflow-y-auto rounded-2xl border border-paper-light/15 bg-[#211b12] p-1.5 shadow-2xl [scrollbar-width:thin]"
          >
            {/* Zrušit filtr */}
            <button
              onClick={() => pickCountry(null)}
              className={
                "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-display text-sm font-bold transition-colors " +
                (value === null ? "bg-sun/15 text-sun" : "text-paper-light hover:bg-paper-light/10")
              }
            >
              Všechny země
              {value === null && <Check className="h-4 w-4" />}
            </button>

            <div className="my-1.5 h-px bg-paper-light/10" />

            {groups.map((g) => {
              const isExpanded = expanded === g.id;
              return (
                <div key={g.id}>
                  {/* Světadíl — rozbalí kategorii států */}
                  <button
                    onClick={() => setExpanded((e) => (e === g.id ? null : g.id))}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-display text-sm font-bold text-paper-light transition-colors hover:bg-paper-light/10"
                  >
                    <span>{g.name}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-serif text-xs font-normal italic text-paper-light/40">
                        {g.countries.length}
                      </span>
                      <ChevronDown
                        className={"h-4 w-4 text-paper-light/50 transition-transform " + (isExpanded ? "rotate-180" : "")}
                      />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="py-0.5 pl-2.5">
                          {g.countries.map((c) => (
                            <button
                              key={c.a3}
                              onClick={() => pickCountry(c.a3)}
                              className={
                                "flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left font-sans text-sm transition-colors " +
                                (value === c.a3
                                  ? "bg-sun/15 font-bold text-sun"
                                  : "text-paper-light/85 hover:bg-paper-light/10")
                              }
                            >
                              <span className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-paper-light/30" />
                                {c.name}
                              </span>
                              <span className="flex items-center gap-2">
                                <span className="font-serif text-xs italic text-paper-light/40">{c.count}</span>
                                {value === c.a3 && <Check className="h-3.5 w-3.5" />}
                              </span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
