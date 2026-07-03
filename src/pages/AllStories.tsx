import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TimelineGrid } from "@/components/timeline/StoryTimeline";
import { CountryCascadeSelect } from "@/components/stories/CountryCascadeSelect";
import { PUBLISHED_STORIES, storiesForCountry } from "@/lib/history";
import { erasForCountry, WORLD_ERAS } from "@/data/eras";
import { markNavRestore } from "@/pages/Home";
import type { Ruler } from "@/data/rulers";

/**
 * AllStories — samostatný „přehled příspěvků" pro VŠECHNY příběhy (bez mapy).
 * Filtr země řeší custom kaskádový select (světadíl → stát); bez výběru se ukážou
 * příspěvky ze všech zemí. Přes mapu se sem nechodí — tam je země už daná osou.
 */
export default function AllStories() {
  const navigate = useNavigate();
  const [country, setCountry] = useState<string | null>(null);
  const [filterRuler, setFilterRuler] = useState<Ruler | null>(null);

  const stories = useMemo(
    () => (country ? storiesForCountry(country) : [...PUBLISHED_STORIES].sort((a, b) => a.yearFrom - b.yearFrom)),
    [country]
  );

  // Posouvač času je vždy přítomný (1:1 jako na mapě): vlastní periodizace státu,
  // jinak (všechny země / stát bez období) široká světová periodizace.
  const eras = (country && erasForCountry(country)) || WORLD_ERAS;

  const openStory = (slug: string) => {
    markNavRestore(); // ať se „Zpět" z článku chová konzistentně
    navigate(`/pribeh/${slug}`);
  };

  return (
    <div className="h-[calc(100dvh-4rem)] overflow-y-auto bg-[#17140e] text-paper-light">
      <TimelineGrid
        key={country ?? "all"}
        stories={stories}
        eras={eras}
        countryCode={country ?? ""}
        open
        persistReturn={false}
        filterRuler={filterRuler}
        onSelectRuler={setFilterRuler}
        onClearFilter={() => setFilterRuler(null)}
        onLaunch={openStory}
        countrySelect={<CountryCascadeSelect value={country} onChange={setCountry} />}
      />
    </div>
  );
}
