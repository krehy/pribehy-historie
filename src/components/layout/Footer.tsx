import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Compass, ChevronUp, X } from "lucide-react";

/**
 * Zápatí NENÍ v běžném scroll flow (jinak ho ovládání scrollem pořád vytahovalo).
 * Žije jako vysunovací panel — vyjede jen na klik na úchyt u spodního okraje.
 * Úchyt má nízké z-index, takže ho příběh (z-60) i osa (z-40) překryjí a nedá
 * se vyvolat omylem uprostřed interakce.
 */
export function Footer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      {/* Úchyt — jediný způsob, jak footer vyvolat */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Zobrazit zápatí"
          className="group fixed bottom-0 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-t-xl border border-b-0 border-ink/10 bg-paper-light/95 px-4 py-1.5 text-ink-soft shadow-[0_-4px_16px_rgba(0,0,0,.1)] backdrop-blur-sm transition-colors hover:bg-paper-light"
        >
          <ChevronUp className="h-3.5 w-3.5 text-sun-deep transition-transform group-hover:-translate-y-0.5" />
          <span className="font-display text-[11px] font-bold uppercase tracking-wide">Zápatí</span>
        </button>
      )}

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[54] bg-black/30 backdrop-blur-[1px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />
            <motion.footer
              className="fixed inset-x-0 bottom-0 z-[55] max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-stroke/30 bg-paper-light shadow-parchment-lg"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
            >
              <button
                type="button"
                onClick={close}
                aria-label="Zavřít zápatí"
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-stroke/30 bg-paper text-ink-soft transition-colors hover:bg-country-hover"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
                <div className="rule-ornament mb-8">
                  <Compass className="h-4 w-4" />
                </div>
                <div className="grid gap-8 md:grid-cols-3">
                  <div>
                    <h4 className="font-display text-base tracking-wide text-ink">Příběhy historie</h4>
                    <p className="mt-2 max-w-xs text-sm text-ink-soft">
                      Interaktivní vzdělávací atlas. Objevujte okamžiky, které utvářely svět — kraj po
                      kraji, století po století.
                    </p>
                  </div>
                  <div>
                    <h5 className="font-display text-sm tracking-wide text-ink">Objevovat</h5>
                    <ul className="mt-3 space-y-2 text-sm text-ink-soft">
                      <li><Link className="hover:text-sun-deep" to="/" onClick={close}>Mapa světa</Link></li>
                      <li><Link className="hover:text-sun-deep" to="/" onClick={close}>Časová osa</Link></li>
                      <li><Link className="hover:text-sun-deep" to="/" onClick={close}>Všechny příběhy</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-display text-sm tracking-wide text-ink">Projekt</h5>
                    <ul className="mt-3 space-y-2 text-sm text-ink-soft">
                      <li><Link className="hover:text-sun-deep" to="/o-projektu" onClick={close}>O projektu</Link></li>
                      <li><span className="opacity-70">Demo — mock data</span></li>
                    </ul>
                  </div>
                </div>
                <p className="mt-10 text-center font-serif text-sm italic text-ink-soft">
                  © {new Date().getFullYear()} Příběhy historie · vytvořeno s úctou k minulosti
                </p>
              </div>
            </motion.footer>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
