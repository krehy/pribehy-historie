import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StoryTimeline } from "@/components/timeline/StoryTimeline";
import { CountryCascadeSelect } from "@/components/stories/CountryCascadeSelect";
import { PUBLISHED_STORIES, storiesForCountry } from "@/lib/history";
import { erasForCountry, WORLD_ERAS } from "@/data/eras";
import { countryName } from "@/data/countries";
import { continentOfA3 } from "@/data/continents";
import { enterMap } from "@/pages/Home";

/**
 * AllStories — „Všechny příběhy": TEN SAMÝ zážitek časové osy jako z mapy (osa +
 * přehled), akorát otevřený rovnou v přehledu a s výběrem země v hlavičce místo mapy.
 * Řetěz „Zpět": přehled → (Zpět na osu) osa → (Zpět) mapa. Přes mapu se sem nechodí —
 * tam je země daná osou, takže se select nezobrazuje.
 */
export default function AllStories() {
  const navigate = useNavigate();
  const [country, setCountry] = useState<string | null>(null);

  const stories = useMemo(
    () => (country ? storiesForCountry(country) : [...PUBLISHED_STORIES].sort((a, b) => a.yearFrom - b.yearFrom)),
    [country]
  );

  // Posouvač času vždy přítomný (1:1 jako na mapě): periodizace státu, jinak světová.
  const eras = (country && erasForCountry(country)) || WORLD_ERAS;

  // „Zpět" z osy → rovnou na mapu (přeskočí hero). Když je vybraná země, zaostři na její světadíl.
  const toMap = () => {
    enterMap({ continent: country ? continentOfA3(country) ?? null : null });
    navigate("/");
  };

  return (
    <div className="h-[calc(100dvh-4rem)]">
      <StoryTimeline
        key={country ?? "all"}
        countryName={country ? countryName(country) : "Svět"}
        stories={stories}
        eras={eras}
        onClose={toMap}
        initialMode="grid"
        countryCode={country ?? ""}
        persistReturn={false}
        countrySelect={<CountryCascadeSelect value={country} onChange={setCountry} />}
      />
    </div>
  );
}
