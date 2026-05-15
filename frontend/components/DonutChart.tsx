interface Slice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  slices: Slice[];
  centerLabel?: string;
  centerValue?: string;
  size?: number;
}

export function DonutChart({
  slices,
  centerLabel,
  centerValue,
  size = 180,
}: DonutChartProps) {
  const total = slices.reduce((a, s) => a + s.value, 0);
  const radius = size / 2;
  const thickness = 22;
  const inner = radius - thickness;

  if (total === 0) {
    return (
      <div className="flex items-center gap-6">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={radius} cy={radius} r={radius - thickness / 2} fill="none" stroke="#e2e8f0" strokeWidth={thickness} />
        </svg>
        <div className="text-sm text-slate-400">No data yet</div>
      </div>
    );
  }

  let acc = 0;
  const paths = slices.map((s) => {
    const start = acc / total;
    acc += s.value;
    const end = acc / total;
    return { ...s, d: arcPath(radius, radius - thickness / 2, start, end) };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={radius}
            cy={radius}
            r={radius - thickness / 2}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={thickness}
          />
          {paths.map((p, i) => (
            <path
              key={i}
              d={p.d}
              fill="none"
              stroke={p.color}
              strokeWidth={thickness}
              strokeLinecap="butt"
            />
          ))}
          <circle cx={radius} cy={radius} r={inner} fill="white" />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            {centerValue ? (
              <div className="text-2xl font-semibold text-slate-900">
                {centerValue}
              </div>
            ) : null}
            {centerLabel ? (
              <div className="text-xs text-slate-500">{centerLabel}</div>
            ) : null}
          </div>
        </div>
      </div>
      <ul className="space-y-2 min-w-0 flex-1">
        {slices.map((s) => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
          return (
            <li key={s.label} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ background: s.color }}
                />
                <span className="text-sm text-slate-700 capitalize truncate">
                  {s.label}
                </span>
              </div>
              <div className="text-sm text-slate-500 tabular-nums">
                <span className="font-medium text-slate-900">{s.value}</span>{" "}
                <span className="text-xs">({pct}%)</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function arcPath(cx: number, r: number, startFrac: number, endFrac: number): string {
  if (endFrac - startFrac >= 0.9999) {
    return [
      `M ${cx + r} ${cx}`,
      `A ${r} ${r} 0 1 1 ${cx - r} ${cx}`,
      `A ${r} ${r} 0 1 1 ${cx + r} ${cx}`,
    ].join(" ");
  }
  const startAngle = startFrac * Math.PI * 2 - Math.PI / 2;
  const endAngle = endFrac * Math.PI * 2 - Math.PI / 2;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cx + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cx + r * Math.sin(endAngle);
  const largeArc = endFrac - startFrac > 0.5 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}
