import { Link } from "react-router-dom";
import { Compass, Map, Clock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STORIES } from "@/data/stories";
import { countriesWithStories } from "@/lib/history";

const FEATURES = [
  { icon: Map, title: "Pergamenová mapa", text: "Ručně stylizovaná mapa světa s roztřepenými hranicemi a papírovou texturou." },
  { icon: Clock, title: "Časová osa", text: "Každá země má vlastní osu dějin — od starověku po moderní éru." },
  { icon: BookOpen, title: "Příběhy dějin", text: "Krátké, čtivé útržky událostí, které utvářely civilizace." },
];

export default function About() {
  const countries = countriesWithStories();
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-stroke/50 bg-paper-light text-accent shadow-parchment">
          <Compass className="h-8 w-8" />
        </span>
        <h1 className="mt-6 font-display text-4xl tracking-wide text-ink">
          O projektu
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink-soft">
          <strong className="text-ink">Příběhy historie</strong> je interaktivní
          vzdělávací atlas. Cílem je udělat dějiny hmatatelné — procházíte mapu
          světa jako starou kartografickou památku a objevujete okamžiky, které
          změnily svět.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card-parchment p-5 text-center">
            <f.icon className="mx-auto h-7 w-7 text-accent" />
            <h3 className="mt-3 font-display text-lg tracking-wide text-ink">
              {f.title}
            </h3>
            <p className="mt-2 text-sm text-ink-soft">{f.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 flex items-center justify-center gap-8 text-center">
        <div>
          <div className="font-display text-4xl text-accent">{STORIES.length}</div>
          <div className="font-script text-sm italic text-ink-soft">příběhů</div>
        </div>
        <div className="h-10 w-px bg-stroke/40" />
        <div>
          <div className="font-display text-4xl text-accent">{countries.length}</div>
          <div className="font-script text-sm italic text-ink-soft">zemí</div>
        </div>
      </div>

      <p className="mt-10 text-center text-sm text-ink-soft">
        Tato verze je frontendový skeleton — data jsou ukázková (mock), bez
        backendu.
      </p>

      <div className="mt-8 text-center">
        <Link to="/">
          <Button size="lg">
            <Compass className="h-5 w-5" /> Otevřít mapu světa
          </Button>
        </Link>
      </div>
    </div>
  );
}
