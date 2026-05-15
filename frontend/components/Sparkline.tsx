interface SparklineProps {
  values: number[];
  stroke?: string;
  fill?: string;
  height?: number;
  width?: number;
}

export function Sparkline({
  values,
  stroke = "#6366f1",
  fill = "rgba(99, 102, 241, 0.12)",
  height = 36,
  width = 120,
}: SparklineProps) {
  if (values.length === 0) {
    return <div style={{ height, width }} className="opacity-40" />;
  }
  const max = Math.max(...values, 1);
  const min = 0;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const norm = (v: number) =>
    height - ((v - min) / (max - min || 1)) * (height - 4) - 2;

  const points = values.map((v, i) => [i * step, norm(v)] as const);
  const path = points
    .map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`))
    .join(" ");
  const area = `${path} L${width},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="none"
      className="overflow-visible"
    >
      <path d={area} fill={fill} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
