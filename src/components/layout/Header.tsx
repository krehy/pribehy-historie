import { Link, useLocation } from "react-router-dom";
import { Compass } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Mapa" },
  { to: "/#timeline", label: "Časová osa" },
  { to: "/#pribehy", label: "Příběhy" },
  { to: "/o-projektu", label: "O projektu" },
];

export function Header() {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-40 border-b border-stroke/30 bg-paper/85 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link to="/" className="group flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full border border-stroke/50 bg-paper-light text-accent transition-transform group-hover:rotate-45">
            <Compass className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg tracking-wide text-ink">
              Příběhy historie
            </span>
            <span className="block font-script text-xs italic text-ink-soft">
              interaktivní atlas dějin
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <a
              key={item.to}
              href={item.to}
              className={cn(
                "rounded-md px-3 py-2 font-display text-sm tracking-wide text-ink-soft transition-colors hover:bg-country-hover/60 hover:text-ink",
                pathname === item.to && "text-ink"
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
