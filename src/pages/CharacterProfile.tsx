import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { rulerBySlug } from "@/data/rulers";
import { STORIES } from "@/data/stories";
import { CharacterProfileView } from "@/components/character/CharacterProfileView";
import { markNavRestore } from "@/pages/Home";

/**
 * Samostatná profilová stránka postavy — /postava/:slug.
 * Obsah renderuje sdílená CharacterProfileView (stejná jako ve foldu časové osy).
 */
export default function CharacterProfile() {
  const { slug } = useParams();
  const ruler = slug ? rulerBySlug(slug) : undefined;

  if (!ruler) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl tracking-wide text-ink">Postava nenalezena</h1>
        <p className="mt-3 text-ink-soft">Tuto postavu se nám nepodařilo najít.</p>
        <Link to="/" className="mt-6 inline-flex items-center gap-2 font-display text-sm font-bold text-sun-deep">
          <ArrowLeft className="h-4 w-4" /> Zpět na mapu
        </Link>
      </div>
    );
  }

  const stories = STORIES.filter((s) => s.characters?.includes(ruler.slug));

  return (
    <div className="min-h-screen bg-[#17140e] text-paper-light">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,#2a2416,#17140e_70%)]" />

      <div className="relative mx-auto max-w-3xl px-5 py-6 md:px-8">
        <Link
          to="/"
          onClick={markNavRestore}
          className="inline-flex items-center gap-2 rounded-full border border-paper-light/20 bg-black/30 px-4 py-2 font-display text-sm font-bold text-paper-light backdrop-blur-sm transition-colors hover:bg-black/55"
        >
          <ArrowLeft className="h-4 w-4" /> Zpět na mapu
        </Link>
      </div>

      <div className="relative pb-16">
        <CharacterProfileView ruler={ruler} stories={stories} />
      </div>
    </div>
  );
}
