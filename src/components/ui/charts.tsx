/** Lehká inline-SVG grafová primitiva (bez knihovny) pro dashboardy. */

/** Mini sparkline do tabulky. */
export function Sparkline({
  values,
  className = "",
  stroke = "#f4c430",
}: {
  values: number[];
  className?: string;
  stroke?: string;
}) {
  const w = 80;
  const h = 22;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const d = values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${(i * step).toFixed(1)} ${(h - (v / max) * h).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={w} height={h} className={className} aria-hidden>
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

/** Vyplněný spojnicový graf s osou X (popisky). */
export function LineChart({
  values,
  labels,
  height = 160,
  stroke = "#e0a91e",
}: {
  values: number[];
  labels?: string[];
  height?: number;
  stroke?: string;
}) {
  const w = 640;
  const pad = 8;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? (w - pad * 2) / (values.length - 1) : w;
  const pts = values.map((v, i) => [pad + i * step, height - 24 - (v / max) * (height - 40)]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L ${pts[pts.length - 1][0].toFixed(1)} ${height - 24} L ${pad} ${height - 24} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" role="img">
      <defs>
        <linearGradient id="lc-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lc-fill)" />
      <path d={line} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" />
      {labels &&
        labels.map((l, i) => (
          <text
            key={i}
            x={pad + i * step}
            y={height - 6}
            textAnchor="middle"
            className="fill-zinc-400"
            style={{ fontSize: 10 }}
          >
            {l}
          </text>
        ))}
    </svg>
  );
}

/** Vodorovný bar (žebříček). */
export function BarRow({
  label,
  value,
  max,
  suffix = "",
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
}) {
  const pct = Math.round((value / Math.max(1, max)) * 100);
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-32 shrink-0 truncate text-zinc-600">{label}</span>
      <span className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
        <span className="absolute inset-y-0 left-0 rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
      </span>
      <span className="w-20 shrink-0 text-right font-medium tabular-nums text-zinc-800">
        {value.toLocaleString("cs")}
        {suffix}
      </span>
    </div>
  );
}
