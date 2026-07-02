/**
 * AuthorProfile — veřejná „vizitka" autora, vizuálně jako příběh (atmosférická).
 * Kinematické hero s chroma podobiznou + bio + jeho práce. Placeholder charakter.
 */
import { useParams, Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { authorBySlug } from "@/data/authors";
import { storiesByAuthor, isPublished, formatYear } from "@/lib/history";
import { authorSummary } from "@/lib/mockStats";
import { assetUrl } from "@/lib/assetUrl";

export default function AuthorProfile() {
  const { slug = "" } = useParams();
  const author = authorBySlug(slug);

  if (!author) {
    return (
      <div className="grid min-h-[70vh] place-items-center bg-paper px-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Autor nenalezen</h1>
          <Link to="/" className="mt-4 inline-block text-sun-deep underline-offset-4 hover:underline">
            ← Zpět na web
          </Link>
        </div>
      </div>
    );
  }

  const works = storiesByAuthor(author.name).filter(isPublished);
  const sum = authorSummary(author.name);
  const character = assetUrl(author.character);

  return (
    <div className="bg-paper">
      {/* HERO — kinematická vizitka */}
      <section className="relative overflow-hidden bg-[#17140e] text-paper-light">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(60% 60% at 30% 20%, rgba(244,196,48,.18), transparent 70%)",
          }}
        />
        <div className="relative mx-auto grid max-w-5xl gap-6 px-5 py-12 md:grid-cols-[220px,1fr] md:items-center md:px-8 md:py-16">
          <div className="mx-auto h-52 w-40 overflow-hidden rounded-2xl border-2 border-sun/40 bg-black/30 shadow-parchment-lg md:h-64 md:w-48">
            <img src={character} alt={author.name} className="h-full w-full object-cover" />
          </div>
          <div className="text-center md:text-left">
            <div className="font-serif text-sm italic text-sun/80">Autor · Příběhy historie</div>
            <h1 className="mt-1 font-display text-4xl font-extrabold md:text-5xl">{author.name}</h1>
            {author.realName && (
              <div className="mt-1 font-serif italic text-paper-light/60">{author.realName}</div>
            )}
            <p className="mx-auto mt-4 max-w-xl font-sans text-paper-light/85 md:mx-0">{author.bio}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
              {author.specialties.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-paper-light/20 px-3 py-1 font-sans text-xs text-paper-light/70"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-5 flex justify-center gap-6 text-center md:justify-start">
              <div>
                <div className="font-display text-2xl font-extrabold text-sun">{sum.published}</div>
                <div className="text-xs text-paper-light/50">příběhů</div>
              </div>
              <div>
                <div className="font-display text-2xl font-extrabold text-sun">
                  {sum.views.toLocaleString("cs")}
                </div>
                <div className="text-xs text-paper-light/50">zobrazení</div>
              </div>
              <div>
                <div className="font-display text-2xl font-extrabold text-sun">od {author.joined}</div>
                <div className="text-xs text-paper-light/50">tvoří</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRÁCE */}
      <section className="mx-auto max-w-5xl px-5 py-10 md:px-8">
        <h2 className="mb-5 font-display text-2xl font-extrabold text-ink">Příběhy od {author.name}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {works.map((s) => (
            <Link
              key={s.id}
              to={`/pribeh/${s.slug}`}
              className="group overflow-hidden rounded-xl border-2 border-ink/10 bg-paper-light shadow-parchment transition-transform hover:-translate-y-1"
            >
              <div
                className="aspect-[4/3] bg-cover bg-center"
                style={{ backgroundImage: `url("${s.coverImage}")` }}
              />
              <div className="p-3">
                <div className="text-xs text-ink-soft">{formatYear(s.yearFrom)}</div>
                <div className="line-clamp-2 font-display text-sm font-bold text-ink group-hover:text-sun-deep">
                  {s.title}
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-sun px-5 py-2.5 font-display text-sm font-bold text-ink shadow-sticker transition-transform hover:-translate-y-0.5"
          >
            <BookOpen className="h-4 w-4" /> Prozkoumat všechny příběhy
          </Link>
        </div>
      </section>
    </div>
  );
}
