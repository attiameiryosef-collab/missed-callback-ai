import type { ReactNode } from "react";
import { Sparkline } from "./Sparkline";

type Accent = "indigo" | "purple" | "emerald" | "amber";

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  accent?: Accent;
  current?: number;
  previous?: number;
  trendUnit?: string;
  series?: number[];
}

const ACCENTS: Record<Accent, { tile: string; stroke: string; fill: string }> = {
  indigo: {
    tile: "bg-indigo-50 text-indigo-600",
    stroke: "#6366f1",
    fill: "rgba(99, 102, 241, 0.14)",
  },
  purple: {
    tile: "bg-purple-50 text-purple-600",
    stroke: "#a855f7",
    fill: "rgba(168, 85, 247, 0.14)",
  },
  emerald: {
    tile: "bg-emerald-50 text-emerald-600",
    stroke: "#10b981",
    fill: "rgba(16, 185, 129, 0.14)",
  },
  amber: {
    tile: "bg-amber-50 text-amber-600",
    stroke: "#f59e0b",
    fill: "rgba(245, 158, 11, 0.14)",
  },
};

export function KpiCard({
  label,
  value,
  hint,
  icon,
  accent = "indigo",
  current,
  previous,
  trendUnit,
  series,
}: KpiCardProps) {
  const a = ACCENTS[accent];
  const trend = computeTrend(current, previous);

  return (
    <div className="relative bg-white rounded-xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-shadow duration-200 ease-out p-5 overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-[13px] font-medium text-slate-500 tracking-tight">
            {label}
          </div>
          <div className="mt-2 text-3xl font-semibold text-slate-900 tracking-tight tabular-nums">
            {value}
          </div>
          {hint ? (
            <div className="mt-1 text-xs text-slate-500 leading-relaxed">
              {hint}
            </div>
          ) : null}
        </div>
        {icon ? (
          <div className={"h-10 w-10 rounded-lg grid place-items-center " + a.tile}>
            {icon}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        {trend ? (
          <div
            className={
              "inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-md " +
              (trend.dir === "up"
                ? "text-emerald-700 bg-emerald-50"
                : trend.dir === "down"
                ? "text-rose-700 bg-rose-50"
                : "text-slate-600 bg-slate-100")
            }
          >
            <TrendArrow dir={trend.dir} />
            {trend.label}
            {trendUnit ? <span className="text-slate-400 font-normal ml-1">{trendUnit}</span> : null}
          </div>
        ) : (
          <span className="text-xs text-slate-400">vs previous week</span>
        )}
        {series && series.length > 0 ? (
          <Sparkline values={series} stroke={a.stroke} fill={a.fill} />
        ) : null}
      </div>
    </div>
  );
}

function computeTrend(current?: number, previous?: number) {
  if (current === undefined || previous === undefined) return null;
  if (previous === 0 && current === 0) {
    return { dir: "flat" as const, label: "no change" };
  }
  if (previous === 0) {
    return { dir: "up" as const, label: "new" };
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { dir: "flat" as const, label: "0%" };
  return {
    dir: pct > 0 ? ("up" as const) : ("down" as const),
    label: `${pct > 0 ? "+" : ""}${pct}%`,
  };
}

function TrendArrow({ dir }: { dir: "up" | "down" | "flat" }) {
  if (dir === "up") {
    return (
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 17L17 7M9 7h8v8" />
      </svg>
    );
  }
  if (dir === "down") {
    return (
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 7L7 17M7 9v8h8" />
      </svg>
    );
  }
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
    </svg>
  );
}
