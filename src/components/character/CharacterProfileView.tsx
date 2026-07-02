import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown, Quote, Sparkles } from "lucide-react";
import { figureImage, lifespanLabel, type Ruler } from "@/data/rulers";
import { formatYear } from "@/lib/history";
import type { Story } from "@/data/stories";
import { ChromaImage } from "@/components/story/ChromaImage";

const BASE = import.meta.env.BASE_URL;
const img = (p: string) => (/^https?:\/\//.test(p) ? p : `${BASE}${p}`);

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-paper-light/10 bg-paper-light/[0.03] px-4 py-3 text-left">
      <div className="font-display text-[11px] font-bold uppercase tracking-wide text-paper-light/45">{label}</div>
      <div className="mt-0.5 text-paper-light/90">{children}</div>
    </div>
  );
}

/**
 * Sdílený „character profile" — figura NAHOŘE blíž ke středu, pod ní strukturované
 * staty + krátké shrnutí (= profile header), a teprve pod ním obsah spojený s postavou
 * (životní osa, zajímavosti, výroky, příběhy). Používá se na /postava/:slug i ve foldu osy.
 */
export function CharacterProfileView({ ruler, stories = [] }: { ruler: Ruler; stories?: Story[] }) {
  const image = figureImage(ruler);
  const bornLine = ruler.bornDate ?? (ruler.bornYear != null ? formatYear(ruler.bornYear) : undefined);
  const diedLine = ruler.diedDate ?? (ruler.diedYear != null ? formatYear(ruler.diedYear) : undefined);

  return (
    <div className="text-paper-light">
      {/* ═══════════ PROFILE HEADER — figura nahoře, centrovaná ═══════════ */}
      <header className="mx-auto max-w-3xl px-5 pt-4 text-center md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-[260px]"
        >
          <div className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-[radial-gradient(closest-side,rgba(244,196,48,.22),transparent)] blur-2xl" />
          {image.chroma ? (
            <ChromaImage
              src={img(image.src)}
              alt={ruler.name}
              className="mx-auto block h-auto w-full max-w-[260px] drop-shadow-[0_18px_44px_rgba(0,0,0,.6)]"
            />
          ) : (
            <img
              src={img(image.src)}
              alt={ruler.name}
              className="mx-auto block max-h-[42vh] w-full rounded-2xl object-cover shadow-parchment-lg"
            />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
        >
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-sun/15 px-3 py-1 font-display text-xs font-bold uppercase tracking-wide text-sun">
            <Crown className="h-3.5 w-3.5" /> {ruler.title}
            {ruler.house ? ` · ${ruler.house}` : ""}
          </div>
          <h1 className="mt-3 font-display text-4xl font-black leading-none md:text-5xl">{ruler.name}</h1>
          <div className="mt-2 font-serif text-lg italic text-sun/80">{lifespanLabel(ruler)}</div>

          {/* strukturované staty */}
          <div className="mx-auto mt-5 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label="Narození">
              {bornLine ?? "—"}
              {ruler.birthPlace && <span className="text-paper-light/55"> · {ruler.birthPlace}</span>}
            </Stat>
            <Stat label="Úmrtí">
              {diedLine ? (
                <>
                  {diedLine}
                  {ruler.deathPlace && <span className="text-paper-light/55"> · {ruler.deathPlace}</span>}
                </>
              ) : (
                <span className="text-teal">žije</span>
              )}
            </Stat>
            <Stat label={ruler.title === "Prezident" ? "V úřadu" : "Vláda"}>
              {formatYear(ruler.reignFrom ?? ruler.activeFrom)} – {(ruler.reignTo ?? ruler.activeTo) === 2025 ? "nyní" : formatYear(ruler.reignTo ?? ruler.activeTo)}
            </Stat>
          </div>

          {/* krátké shrnutí / popis */}
          {ruler.bio && (
            <p className="mx-auto mt-5 max-w-2xl font-sans text-lg leading-relaxed text-paper-light/85">{ruler.bio}</p>
          )}
        </motion.div>
      </header>

      {/* ═══════════ OBSAH SPOJENÝ S POSTAVOU ═══════════ */}
      <div className="mx-auto max-w-3xl space-y-10 px-5 py-10 md:px-8">
        {/* Životní osa */}
        {ruler.timeline && ruler.timeline.length > 0 && (
          <section>
            <h2 className="mb-6 font-display text-2xl font-extrabold">Život v datech</h2>
            <ol className="relative border-l-2 border-paper-light/15 pl-6">
              {ruler.timeline.map((e, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="relative mb-7 last:mb-0"
                >
                  <span className="absolute -left-[31px] top-1 grid h-4 w-4 place-items-center rounded-full border-2 border-sun bg-[#17140e]">
                    <span className="h-1.5 w-1.5 rounded-full bg-sun" />
                  </span>
                  <div className="font-serif text-sm italic text-sun/85">{formatYear(e.year)}</div>
                  <h3 className="mt-0.5 font-display text-lg font-bold">{e.title}</h3>
                  {e.text && <p className="mt-1 font-sans text-paper-light/75">{e.text}</p>}
                </motion.li>
              ))}
            </ol>
          </section>
        )}

        {/* Zajímavosti */}
        {ruler.facts && ruler.facts.length > 0 && (
          <section>
            <h2 className="mb-4 font-display text-2xl font-extrabold">Zajímavosti</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {ruler.facts.map((f, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 rounded-xl border border-paper-light/10 bg-paper-light/[0.03] px-3 py-2 font-sans text-sm text-paper-light/80"
                >
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sun/70" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Výroky */}
        {ruler.quotes && ruler.quotes.length > 0 && (
          <section>
            <h2 className="mb-4 font-display text-2xl font-extrabold">Výroky</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {ruler.quotes.map((q, i) => (
                <blockquote
                  key={i}
                  className="rounded-2xl border border-sun/25 bg-gradient-to-br from-[#2a2416] to-[#17140e] p-5 font-serif text-lg italic text-paper-light/90"
                >
                  <Quote className="mb-2 h-5 w-5 text-sun/60" />„{q}“
                </blockquote>
              ))}
            </div>
          </section>
        )}

        {/* Příběhy, kde postava vystupuje / z její doby */}
        {stories.length > 0 && (
          <section>
            <h2 className="mb-4 font-display text-2xl font-extrabold">Příběhy postavy</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stories.map((s) => (
                <Link
                  key={s.id}
                  to={`/pribeh/${s.slug}`}
                  className="group overflow-hidden rounded-2xl border-2 border-paper-light/15 bg-paper-light/5 transition-transform hover:-translate-y-1 hover:border-sun/70"
                >
                  <div
                    className="aspect-[16/9] bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url("${s.coverImage}")` }}
                  />
                  <div className="p-3">
                    <div className="font-serif text-xs italic text-sun/80">{formatYear(s.yearFrom)}</div>
                    <div className="mt-0.5 font-display text-sm font-bold leading-tight group-hover:text-sun">
                      {s.title}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
