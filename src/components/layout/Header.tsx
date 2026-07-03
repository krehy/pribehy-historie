import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession, type Role } from "@/context/session";
import { enterMap } from "@/pages/Home";

/** Přepnout Home rovnou na mapu světa (i když už na „/" jsme). */
function goToMap() {
  enterMap(); // pro čerstvý mount z jiné stránky
  window.dispatchEvent(new Event("ph:enter-map")); // pro už běžící Home na „/"
}
/** Přepnout Home na hero (úvod) — přes logo. */
function goToHero() {
  window.dispatchEvent(new Event("ph:enter-hero"));
}

const ROLE_LABEL: Record<Role, string> = { reader: "čtenář", author: "autor", admin: "admin" };

/** Položky navigace — stejná slovní zásoba jako patička. */
const NAV = [
  { to: "/", label: "Mapa" },
  { to: "/historie", label: "Historie světa" },
  { to: "/pribehy", label: "Všechny příběhy" },
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
  const { user } = useSession();
  const [open, setOpen] = useState(false);

  // Domovská základna přihlášeného uživatele podle role.
  const homeBase =
    user?.role === "admin" ? "/admin" : user?.role === "author" ? "/studio" : "/";

  // Odkazy autorské zóny (dole v navmenu), gated podle role.
  const zoneLinks: { to: string; label: string }[] = [];
  if (user?.role === "author" || user?.role === "admin") zoneLinks.push({ to: "/studio", label: "Studio" });
  if (user?.role === "admin") zoneLinks.push({ to: "/admin", label: "Administrace" });
  if (user?.slug) zoneLinks.push({ to: `/author/${user.slug}`, label: "Můj profil" });
  if (!user || user.role === "reader") zoneLinks.push({ to: "/become-author", label: "Stát se autorem" });

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
          <Link
            to="/"
            onClick={goToHero}
            className="group flex flex-none items-center"
            aria-label="Příběhy historie — domů"
          >
            <BrandMark />
          </Link>

          <div className="ml-auto flex items-center gap-3 md:gap-4">
            {user ? (
              <Link
                to={homeBase}
                className={cn(
                  "hidden items-center gap-2 rounded-full border-2 border-ink/10 bg-paper-light py-1.5 pl-1.5 pr-4 transition-transform hover:-translate-y-0.5 sm:flex",
                  open && "pointer-events-none opacity-0"
                )}
                aria-label={`${user.name} — ${ROLE_LABEL[user.role]}`}
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-sun font-display text-sm font-bold text-ink">
                  {user.name[0]}
                </span>
                <span className="leading-tight">
                  <span className="block font-display text-sm font-bold text-ink">{user.name}</span>
                  <span className="block font-serif text-[11px] italic text-ink-soft">
                    {ROLE_LABEL[user.role]}
                  </span>
                </span>
              </Link>
            ) : (
              <Link
                to="/become-author"
                className={cn(
                  "hidden rounded-full bg-sun px-6 py-2.5 font-display text-sm font-bold text-ink shadow-sticker transition-transform hover:-translate-y-0.5 sm:inline-block",
                  open && "pointer-events-none opacity-0"
                )}
              >
                Přihlásit se
              </Link>
            )}
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
                (n.to === "/historie" && pathname === "/historie") ||
                (n.to === "/pribehy" && pathname === "/pribehy") ||
                (n.label === "Mapa" && pathname === "/");
              return (
                <Link
                  key={`${n.label}-${i}`}
                  to={n.to}
                  className={cn(active && "active")}
                  onClick={() => {
                    if (n.label === "Mapa") goToMap(); // → rovnou mapa (ne hero)
                    setOpen(false);
                  }}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          {zoneLinks.length > 0 && (
            <div className="mt-7 flex flex-col items-start gap-2 border-t border-ink/10 pt-5">
              <span className="mb-1 font-serif text-sm italic text-ink-soft/70">
                {user ? `Přihlášen jako ${user.name} · ${ROLE_LABEL[user.role]}` : "Autorská zóna"}
              </span>
              {zoneLinks.map((z) => (
                <Link
                  key={z.to}
                  to={z.to}
                  onClick={() => setOpen(false)}
                  className="font-display text-xl font-extrabold uppercase tracking-tight text-ink transition-colors hover:text-sun-deep"
                >
                  {z.label}
                </Link>
              ))}
            </div>
          )}

          <div className="ph-nav-foot">
            <Link
              to="/"
              onClick={() => {
                goToMap();
                setOpen(false);
              }}
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
