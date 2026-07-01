import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarRange, MapPin } from "lucide-react";
import { STORIES } from "@/data/stories";
import { countryName } from "@/data/countries";
import { formatRange } from "@/lib/history";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompassRose } from "@/components/map/CompassRose";

export default function StoryDetail() {
  const { slug } = useParams();
  const story = STORIES.find((s) => s.slug === slug);

  if (!story) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl tracking-wide text-ink">
          Příběh nenalezen
        </h1>
        <p className="mt-3 text-ink-soft">
          Tento útržek kroniky se nám nepodařilo najít.
        </p>
        <Link to="/" className="mt-6 inline-block">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" /> Zpět na mapu
          </Button>
        </Link>
      </div>
    );
  }

  const related = STORIES.filter(
    (s) => s.countryCode === story.countryCode && s.id !== story.id
  );

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 font-display text-sm tracking-wide text-ink-soft transition-colors hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" /> Zpět na mapu
      </Link>

      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-6"
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge className="gap-1">
            <MapPin className="h-3 w-3" /> {countryName(story.countryCode)}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <CalendarRange className="h-3 w-3" />
            {formatRange(story.yearFrom, story.yearTo)}
          </Badge>
        </div>
        <h1 className="text-balance font-display text-4xl leading-tight tracking-wide text-ink md:text-5xl">
          {story.title}
        </h1>
        <p className="mt-4 font-script text-xl italic text-ink-soft">
          {story.excerpt}
        </p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="mt-8 overflow-hidden rounded-lg border border-stroke/40 shadow-parchment"
      >
        <img src={story.coverImage} alt={story.title} className="w-full" />
      </motion.div>

      <div className="prose-parchment mt-10 space-y-5 text-lg leading-relaxed text-ink">
        {story.body.split("\n").map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {story.tags.map((tag) => (
          <Badge key={tag} variant="outline">
            #{tag}
          </Badge>
        ))}
      </div>

      <div className="rule-ornament my-12">
        <CompassRose className="h-8 w-8" />
      </div>

      {related.length > 0 && (
        <section>
          <h2 className="mb-5 font-display text-2xl tracking-wide text-ink">
            Další příběhy — {countryName(story.countryCode)}
          </h2>
          <ul className="space-y-3">
            {related.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/pribeh/${s.slug}`}
                  className="group flex items-center justify-between rounded-lg border border-stroke/40 bg-paper-light px-4 py-3 transition-colors hover:border-accent"
                >
                  <span className="font-display tracking-wide text-ink group-hover:text-accent">
                    {s.title}
                  </span>
                  <span className="text-sm text-ink-soft">
                    {formatRange(s.yearFrom, s.yearTo)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
