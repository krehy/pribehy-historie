import { mapTheme } from "@/config/mapTheme";

/**
 * Ozdobný rám mapy — dvojitá linka s ornamentálními rohy. Overlay přes
 * plátno mapy, čistě dekorativní. Řízeno z mapTheme.frame.
 * Rám je řešen přes CSS/absolute vrstvy (spolehlivější než SVG % transformy).
 */
export function MapFrame() {
  const { frame } = mapTheme;
  if (!frame.enabled) return null;

  const i = frame.inset;
  const cornerSize = 26;

  const corners = [
    { pos: { top: i, left: i }, rot: 0 },
    { pos: { top: i, right: i }, rot: 90 },
    { pos: { bottom: i, right: i }, rot: 180 },
    { pos: { bottom: i, left: i }, rot: 270 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Vnější linka */}
      <div
        className="absolute rounded-sm"
        style={{
          inset: i,
          border: `${frame.strokeWidth}px solid ${frame.color}`,
          opacity: 0.8,
        }}
      />
      {/* Vnitřní linka */}
      <div
        className="absolute rounded-sm"
        style={{
          inset: i + 5,
          border: `${frame.strokeWidth * 0.5}px solid ${frame.color}`,
          opacity: 0.5,
        }}
      />

      {/* Ornamentální rohy */}
      {frame.corners &&
        corners.map((c, idx) => (
          <svg
            key={idx}
            width={cornerSize}
            height={cornerSize}
            className="absolute"
            style={{ ...c.pos, transform: `rotate(${c.rot}deg)` }}
          >
            <path
              d={`M 0 ${cornerSize} Q 0 0 ${cornerSize} 0`}
              fill="none"
              stroke={frame.color}
              strokeWidth={frame.strokeWidth}
            />
            <circle cx={cornerSize * 0.5} cy={cornerSize * 0.5} r={2.2} fill={frame.color} />
          </svg>
        ))}
    </div>
  );
}
