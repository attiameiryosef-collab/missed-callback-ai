import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  accent?: "indigo" | "purple" | "emerald" | "amber";
}

const accentClasses: Record<NonNullable<StatCardProps["accent"]>, string> = {
  indigo: "bg-indigo-50 text-indigo-600",
  purple: "bg-purple-50 text-purple-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = "indigo",
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">
            {value}
          </div>
          {hint ? (
            <div className="mt-1 text-xs text-slate-500">{hint}</div>
          ) : null}
        </div>
        {icon ? (
          <div
            className={
              "h-10 w-10 rounded-lg grid place-items-center " +
              accentClasses[accent]
            }
          >
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}
