import { cn } from "@/lib/utils";
import { mapTheme } from "@/config/mapTheme";

/**
 * Ozdobná kompasová růžice — čistě dekorativní overlay. Barvy a velikost
 * z mapTheme.compass. Rotace volitelná (pomalá).
 */
export function CompassRose({ className }: { className?: string }) {
  const { compass } = mapTheme;
  if (!compass.enabled) return null;

  const s = compass.size;
  const c = s / 2;
  const r = c - compass.strokeWidth * 2;
  // Hlavní paprsky (S, V, J, Z) a vedlejší (SV, JV, JZ, SZ)
  const major = r;
  const minor = r * 0.55;

  const point = (angleDeg: number, len: number) => {
    const a = (angleDeg - 90) * (Math.PI / 180);
    return [c + Math.cos(a) * len, c + Math.sin(a) * len];
  };

  const star = (len: number, offset = 0) =>
    [0, 90, 180, 270]
      .map((deg) => {
        const [tx, ty] = point(deg + offset, len);
        const [lx, ly] = point(deg + offset - 12, len * 0.28);
        const [rx, ry] = point(deg + offset + 12, len * 0.28);
        return `M ${c} ${c} L ${lx} ${ly} L ${tx} ${ty} L ${rx} ${ry} Z`;
      })
      .join(" ");

  return (
    <div className={cn("pointer-events-none select-none", className)}>
      <svg
        width={s}
        height={s}
        viewBox={`0 0 ${s} ${s}`}
        className={cn(compass.rotate && "motion-safe:animate-compass-spin")}
        style={{ opacity: 0.9 }}
      >
        <circle cx={c} cy={c} r={r} fill="none" stroke={compass.color} strokeWidth={compass.strokeWidth} />
        <circle cx={c} cy={c} r={r * 0.78} fill="none" stroke={compass.color} strokeWidth={compass.strokeWidth * 0.6} opacity={0.6} />

        {/* Vedlejší paprsky */}
        <path d={star(minor, 45)} fill={compass.color} opacity={0.35} />
        {/* Hlavní paprsky */}
        <path d={star(major)} fill={compass.accent} opacity={0.85} stroke={compass.color} strokeWidth={0.5} />

        <circle cx={c} cy={c} r={r * 0.08} fill={compass.color} />

        {/* Světové strany */}
        {[
          { deg: 0, label: "S" },
          { deg: 90, label: "V" },
          { deg: 180, label: "J" },
          { deg: 270, label: "Z" },
        ].map(({ deg, label }) => {
          const [x, y] = point(deg, r * 0.9);
          return (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="Cinzel, serif"
              fontSize={s * 0.1}
              fill={compass.color}
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
