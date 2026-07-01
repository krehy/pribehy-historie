import { cn } from "@/lib/utils";

/**
 * Ručně kreslené „doodly" — dekorativní čmáranice ve stylu instagramové
 * grafiky (kudrlinky, smyčky, obloučky). Čistě dekorace, aria-hidden.
 */

type DoodleProps = {
  className?: string;
  stroke?: string;
  strokeWidth?: number;
};

const base = "pointer-events-none select-none";

/** Trojitý obloukový „smích" / vlnky */
export function Arcs({ className, stroke = "currentColor", strokeWidth = 3 }: DoodleProps) {
  return (
    <svg viewBox="0 0 60 40" fill="none" aria-hidden className={cn(base, className)}>
      {[0, 9, 18].map((y) => (
        <path
          key={y}
          d={`M4 ${28 - y} Q30 ${8 - y} 56 ${28 - y}`}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

/** Kudrlinka / spirálka */
export function Curl({ className, stroke = "currentColor", strokeWidth = 3 }: DoodleProps) {
  return (
    <svg viewBox="0 0 60 40" fill="none" aria-hidden className={cn(base, className)}>
      <path
        d="M4 20 C4 8 20 8 20 20 S36 32 36 20 52 8 52 22"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Volná smyčka */
export function Loop({ className, stroke = "currentColor", strokeWidth = 3 }: DoodleProps) {
  return (
    <svg viewBox="0 0 50 50" fill="none" aria-hidden className={cn(base, className)}>
      <path
        d="M10 40 C-2 22 14 6 26 16 C36 24 26 40 16 34 C8 29 16 16 30 18 C40 19 46 30 44 40"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Hvězdička / jiskra */
export function Sparkle({ className, stroke = "currentColor", strokeWidth = 3 }: DoodleProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn(base, className)}>
      <path
        d="M12 2 C12 8 12 8 12 12 C12 8 18 12 22 12 C18 12 12 12 12 12 C12 16 12 16 12 22 C12 16 12 12 12 12 C8 12 2 12 2 12 C8 12 12 12 12 12 Z"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Skupina barevných konfet teček */
export function Confetti({ className }: { className?: string }) {
  const dots = [
    { x: 6, y: 10, c: "#ef7d57" },
    { x: 22, y: 4, c: "#4bae8c" },
    { x: 38, y: 12, c: "#7b6cc4" },
    { x: 52, y: 6, c: "#f4c430" },
    { x: 14, y: 24, c: "#7b6cc4" },
    { x: 44, y: 26, c: "#ef7d57" },
  ];
  return (
    <svg viewBox="0 0 60 34" fill="none" aria-hidden className={cn(base, className)}>
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={2.4} fill={d.c} />
      ))}
    </svg>
  );
}
