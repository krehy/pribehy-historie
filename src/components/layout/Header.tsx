import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Compass } from "lucide-react";
import { cn } from "@/lib/utils";

/** Položky navigace — stejná slovní zásoba jako patička. */
const NAV = [
  { to: "/", label: "Mapa" },
  { to: "/", label: "Časová osa" },
  { to: "/", label: "Všechny příběhy" },
  { to: "/o-projektu", label: "O projektu" },
];

/** Logo (kompas ve žlutém kruhu) + název — sdílené hlavičkou i brandem v menu. */
function BrandMark({ big = false }: { big?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span
        className={cn(
          "grid place-items-center rounded-full border-2 border-ink/10 bg-sun text-ink",
          big ? "h-20 w-20" : "h-10 w-10"
        )}
      >
        <Compass className={big ? "h-10 w-10" : "h-5 w-5"} />
      </span>
      <span className="leading-tight">
        <span
          className={cn(
            "block font-display font-extrabold text-ink",
            big ? "text-3xl md:text-4xl" : "text-lg"
          )}
        >
          Příběhy historie
        </span>
        <span
          className={cn(
            "block font-serif italic text-ink-soft",
            big ? "text-base" : "text-xs"
          )}
        >
          interaktivní atlas dějin
        </span>
      </span>
    </span>
  );
}

export function Header() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  // Zamknout scroll stránky, když je menu otevřené; Escape zavírá.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      {/* ── Header: edge-to-edge, logo úplně vlevo, akce vpravo ── */}
      <header className="sticky top-0 z-50 border-b-2 border-ink/5 bg-paper/85 backdrop-blur-sm">
        <div className="flex h-16 w-full items-center px-5 md:px-[clamp(20px,3vw,52px)]">
          <Link to="/" className="group flex flex-none items-center" aria-label="Příběhy historie — domů">
            <BrandMark />
          </Link>

          <div className="ml-auto flex items-center gap-3 md:gap-4">
            <Link
              to="/"
              className={cn(
                "hidden rounded-full bg-sun px-6 py-2.5 font-display text-sm font-bold text-ink shadow-sticker transition-transform hover:-translate-y-0.5 sm:inline-block",
                open && "pointer-events-none opacity-0"
              )}
            >
              Prozkoumat mapu
            </Link>
            <button
              type="button"
              className="ph-burger"
              aria-label={open ? "Zavřít menu" : "Otevřít menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="bl" />
              <span className="bl" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Dvousloupcové navmenu ── */}
      <div className={cn("ph-drawer", open && "open")} onClick={() => setOpen(false)}>
        <div className="ph-drawer-sheet" />

        {/* Levý sloupec — velký brand */}
        <div className="ph-drawer-brand" aria-hidden="true">
          <BrandMark big />
        </div>

        {/* Pravý sloupec — odkazy + CTA (klik uvnitř nezavírá kvůli pozadí) */}
        <div className="ph-drawer-panel" onClick={(e) => e.stopPropagation()}>
          <nav className="ph-nav">
            {NAV.map((n, i) => {
              const active =
                (n.to === "/o-projektu" && pathname === "/o-projektu") ||
                (n.label === "Mapa" && pathname === "/");
              return (
                <Link
                  key={`${n.label}-${i}`}
                  to={n.to}
                  className={cn(active && "active")}
                  onClick={() => setOpen(false)}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="ph-nav-foot">
            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="rounded-full bg-sun px-7 py-3 font-display text-base font-bold text-ink shadow-sticker transition-transform hover:-translate-y-0.5"
            >
              Prozkoumat mapu →
            </Link>
            <Link
              to="/o-projektu"
              onClick={() => setOpen(false)}
              className="font-serif text-base italic text-ink-soft transition-colors hover:text-ink"
            >
              O projektu →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
