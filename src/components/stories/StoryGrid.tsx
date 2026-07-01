import { AnimatePresence, motion } from "framer-motion";
import type { Story } from "@/data/stories";
import { StoryCard } from "./StoryCard";

export function StoryGrid({ stories }: { stories: Story[] }) {
  if (stories.length === 0) {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="py-16 text-center font-script text-lg italic text-ink-soft"
      >
        Pro zvolené období zde zatím žádné příběhy nejsou.
      </motion.p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence mode="popLayout">
        {stories.map((story, i) => (
          <StoryCard key={story.id} story={story} index={i} />
        ))}
      </AnimatePresence>
    </div>
  );
}
