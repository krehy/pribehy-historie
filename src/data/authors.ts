/**
 * authors.ts — MOCK autorské profily. Později se stane entitou `Author` s reálnými
 * daty (viz PLAN 9e). `character` = chroma podobizna (zatím placeholder médium).
 */
export interface AuthorProfileData {
  slug: string;
  name: string;
  realName?: string;
  bio: string;
  /** Chroma podobizna (greenscreen postava) — placeholder. */
  character: string;
  joined: string;
  specialties: string[];
}

export const AUTHORS: AuthorProfileData[] = [
  {
    slug: "krehy",
    name: "Křehy",
    realName: "Samuel Křehy",
    bio: "Vypravěč, kterého baví oživovat dějiny — od velkomoravských knížat po sametovou revoluci. Věří, že i doložená historie se dá vyprávět tak, aby brala dech, a že za každým datem je lidský příběh.",
    character: "stories/cze-charles-iv-green.jpg", // PLACEHOLDER → chroma podobizna autora
    joined: "2026",
    specialties: ["České dějiny", "Pověsti", "Kinematické příběhy"],
  },
];

export function authorBySlug(slug: string): AuthorProfileData | undefined {
  return AUTHORS.find((a) => a.slug === slug);
}
