import { Link, useLocation } from "react-router-dom";
import { Compass } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const { pathname } = useLocation();

  const linkCls =
    "rounded-full px-3 py-1.5 font-display text-sm font-semibold text-ink-soft transition-colors hover:bg-country-hover/60 hover:text-ink";

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink/5 bg-paper/85 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link to="/" className="group flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-ink/10 bg-sun text-ink transition-transform group-hover:rotate-45">
            <Compass className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-extrabold text-ink">
              Příběhy historie
            </span>
            <span className="block font-serif text-xs italic text-ink-soft">
              interaktivní atlas dějin
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/" className={cn(linkCls, pathname === "/" && "text-ink")}>
            Mapa
          </Link>
          <Link
            to="/o-projektu"
            className={cn(linkCls, pathname === "/o-projektu" && "text-ink")}
          >
            O projektu
          </Link>
        </nav>
      </div>
    </header>
  );
}
