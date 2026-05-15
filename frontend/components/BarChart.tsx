import type { DailyPoint } from "@/lib/types";

interface BarChartProps {
  data: DailyPoint[];
  color?: string;
  height?: number;
}

export function BarChart({
  data,
  color = "#a855f7",
  height = 220,
}: BarChartProps) {
  if (data.length === 0) {
    return (
      <div
        style={{ height }}
        className="w-full grid place-items-center text-sm text-slate-400"
      >
        No data yet
      </div>
    );
  }
  const width = 600;
  const padding = { top: 16, right: 16, bottom: 28, left: 28 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const max = Math.max(...data.map((d) => d.count), 1);
  const barW = innerW / data.length;
  const gridLines = 4;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {Array.from({ length: gridLines + 1 }, (_, t) => {
        const y = padding.top + (innerH * t) / gridLines;
        const value = Math.round(max - (max * t) / gridLines);
        return (
          <g key={t}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={y}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth={1}
              strokeDasharray={t === gridLines ? "0" : "3 3"}
            />
            <text
              x={padding.left - 6}
              y={y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#94a3b8"
            >
              {value}
            </text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const x = padding.left + i * barW + barW * 0.18;
        const w = barW * 0.64;
        const h = (d.count / max) * innerH;
        const y = padding.top + innerH - h;
        const tickEvery = Math.max(1, Math.ceil(data.length / 6));
        const showLabel = i % tickEvery === 0 || i === data.length - 1;
        const parts = d.date.split("-");
        return (
          <g key={d.date}>
            <rect
              x={x}
              y={y}
              width={w}
              height={Math.max(h, d.count > 0 ? 2 : 0)}
              rx={3}
              fill={color}
              fillOpacity={0.85}
            />
            {showLabel ? (
              <text
                x={x + w / 2}
                y={height - 8}
                textAnchor="middle"
                fontSize="10"
                fill="#94a3b8"
              >
                {`${parts[1]}/${parts[2]}`}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
