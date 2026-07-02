/**
 * phases.ts — JEDNA tabulka produkčních fází „článek → příběh" jako zdroj pravdy.
 * Interface = seznam `PHASES` (id, label, icon, order). Editor (StudioEditor) i
 * dashboard (Studio/workspace) tuhle tabulku jen renderují jinak — nesmí si držet
 * vlastní paralelní seznam fází, pořadí ani offset.
 *
 * Gating (splněná / odemčená / hint) žije v `phaseGates.ts` a čerpá pořadí odsud
 * (PHASE_IDS), takže „gate" navazuje na tuhle tabulku, ne na duplicitní konstantu.
 */
import {
  FileText, Users, Film, PenLine, Image as ImageIcon, Music, Rocket,
  type LucideIcon,
} from "lucide-react";

/** Identita fáze. Poslední fáze `publish` = v dashboardu „hotovo / publikováno". */
export type PhaseId = "article" | "characters" | "beats" | "texts" | "media" | "audio" | "publish";

export interface Phase {
  id: PhaseId;
  /** Kanonický (editorský) název. Dashboard si pro `publish` mapuje na „Hotovo". */
  label: string;
  icon: LucideIcon;
  /** Pořadí v produkci (0 = Článek). Odvozuje řetězení odemykání i progres-bar. */
  order: number;
}

export const PHASES: Phase[] = [
  { id: "article", label: "Článek", icon: FileText, order: 0 },
  { id: "characters", label: "Postavy", icon: Users, order: 1 },
  { id: "beats", label: "Beaty", icon: Film, order: 2 },
  { id: "texts", label: "Texty", icon: PenLine, order: 3 },
  { id: "media", label: "Média", icon: ImageIcon, order: 4 },
  { id: "audio", label: "Zvuk", icon: Music, order: 5 },
  { id: "publish", label: "Publikace", icon: Rocket, order: 6 },
];

/** Pořadí fází podle tabulky — zdroj pravdy pro řetězení a indexaci. */
export const PHASE_IDS: PhaseId[] = PHASES.map((p) => p.id);

/** Index (== order) fáze v tabulce. */
export function phaseIndex(id: PhaseId): number {
  return PHASES.findIndex((p) => p.id === id);
}
