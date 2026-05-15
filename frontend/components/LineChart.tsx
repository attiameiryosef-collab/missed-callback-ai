import type { DailyPoint } from "@/lib/types";

interface LineChartProps {
  data: DailyPoint[];
  stroke?: string;
  fill?: string;
  height?: number;
}

export function LineChart({
  data,
  stroke = "#6366f1",
  fill = "rgba(99, 102, 241, 0.12)",
  height = 220,
}: LineChartProps) {
  if (data.length === 0) {
    return <EmptyChart height={height} />;
  }
  const width = 600;
  const padding = { top: 16, right: 16, bottom: 28, left: 28 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const max = Math.max(...data.map((d) => d.count), 1);
  const step = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const points = data.map((d, i) => [
    padding.left + i * step,
    padding.top + innerH - (d.count / max) * innerH,
  ] as const);
  const line = points
    .map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`))
    .join(" ");
  const area = `${line} L${padding.left + (data.length - 1) * step},${padding.top + innerH} L${padding.left},${padding.top + innerH} Z`;

  const gridLines = 4;
  const ticks = Array.from({ length: gridLines + 1 }, (_, i) => i);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      preserveAspectRatio="none"
    >
      {ticks.map((t) => {
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

      <path d={area} fill={fill} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.5} fill={stroke} />
      ))}

      <XAxisLabels data={data} padding={padding} innerW={innerW} height={height} />
    </svg>
  );
}

function XAxisLabels({
  data,
  padding,
  innerW,
  height,
}: {
  data: DailyPoint[];
  padding: { top: number; right: number; bottom: number; left: number };
  innerW: number;
  height: number;
}) {
  const step = data.length > 1 ? innerW / (data.length - 1) : innerW;
  const tickEvery = Math.max(1, Math.ceil(data.length / 6));
  return (
    <g>
      {data.map((d, i) => {
        if (i % tickEvery !== 0 && i !== data.length - 1) return null;
        const x = padding.left + i * step;
        const parts = d.date.split("-");
        const label = `${parts[1]}/${parts[2]}`;
        return (
          <text
            key={d.date}
            x={x}
            y={height - 8}
            textAnchor="middle"
            fontSize="10"
            fill="#94a3b8"
          >
            {label}
          </text>
        );
      })}
    </g>
  );
}

function EmptyChart({ height }: { height: number }) {
  return (
    <div
      style={{ height }}
      className="w-full grid place-items-center text-sm text-slate-400"
    >
      No data yet
    </div>
  );
}
