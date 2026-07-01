import { Compass } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-stroke/30 bg-paper-light/60">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="rule-ornament mb-8">
          <Compass className="h-4 w-4" />
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h4 className="font-display text-base tracking-wide text-ink">
              Příběhy historie
            </h4>
            <p className="mt-2 max-w-xs text-sm text-ink-soft">
              Interaktivní vzdělávací atlas. Objevujte okamžiky, které utvářely
              svět — kraj po kraji, století po století.
            </p>
          </div>
          <div>
            <h5 className="font-display text-sm tracking-wide text-ink">Objevovat</h5>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              <li><a className="hover:text-accent" href="/">Mapa světa</a></li>
              <li><a className="hover:text-accent" href="/#timeline">Časová osa</a></li>
              <li><a className="hover:text-accent" href="/#pribehy">Všechny příběhy</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-display text-sm tracking-wide text-ink">Projekt</h5>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              <li><a className="hover:text-accent" href="/o-projektu">O projektu</a></li>
              <li><span className="opacity-70">Demo — mock data</span></li>
            </ul>
          </div>
        </div>
        <p className="mt-10 text-center font-script text-sm italic text-ink-soft">
          © {new Date().getFullYear()} Příběhy historie · vytvořeno s úctou k minulosti
        </p>
      </div>
    </footer>
  );
}
