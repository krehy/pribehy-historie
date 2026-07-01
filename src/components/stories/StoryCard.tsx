import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { Story } from "@/data/stories";
import { formatRange } from "@/lib/history";
import { countryName } from "@/data/countries";
import { Badge } from "@/components/ui/badge";

interface StoryCardProps {
  story: Story;
  index?: number;
}

export const StoryCard = forwardRef<HTMLDivElement, StoryCardProps>(
  ({ story, index = 0 }, ref) => {
  return (
    <motion.article
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
      className="group card-parchment overflow-hidden transition-shadow hover:shadow-parchment-lg"
    >
      <Link to={`/pribeh/${story.slug}`} className="block">
        <div className="relative aspect-[8/5] overflow-hidden border-b border-stroke/30">
          <img
            src={story.coverImage}
            alt={story.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <span className="absolute left-3 top-3">
            <Badge className="bg-paper-light/90 text-ink shadow-sm">
              {countryName(story.countryCode)}
            </Badge>
          </span>
          <span className="absolute right-3 top-3">
            <Badge className="bg-accent/90 text-paper-light shadow-sm">
              {formatRange(story.yearFrom, story.yearTo)}
            </Badge>
          </span>
        </div>

        <div className="p-5">
          <h3 className="font-display text-lg leading-snug tracking-wide text-ink transition-colors group-hover:text-accent">
            {story.title}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm text-ink-soft">{story.excerpt}</p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {story.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>

          <span className="mt-4 inline-flex items-center gap-1 font-display text-sm tracking-wide text-accent">
            Číst příběh
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </motion.article>
  );
  }
);
StoryCard.displayName = "StoryCard";
