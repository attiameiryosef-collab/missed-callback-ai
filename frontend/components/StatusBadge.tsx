interface StatusBadgeProps {
  kind:
    | "appointment"
    | "lead"
    | "completed"
    | "missed"
    | "new"
    | "contacted"
    | "booked"
    | "neutral";
  label?: string;
}

const styles: Record<StatusBadgeProps["kind"], string> = {
  appointment: "bg-purple-50 text-purple-700 ring-purple-200",
  lead: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  missed: "bg-amber-50 text-amber-700 ring-amber-200",
  new: "bg-sky-50 text-sky-700 ring-sky-200",
  contacted: "bg-slate-100 text-slate-700 ring-slate-200",
  booked: "bg-purple-50 text-purple-700 ring-purple-200",
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
};

const defaultLabels: Record<StatusBadgeProps["kind"], string> = {
  appointment: "Appointment requested",
  lead: "Lead",
  completed: "Completed",
  missed: "Missed",
  new: "New",
  contacted: "Contacted",
  booked: "Booked",
  neutral: "—",
};

export function StatusBadge({ kind, label }: StatusBadgeProps) {
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset " +
        styles[kind]
      }
    >
      <span
        className={
          "h-1.5 w-1.5 rounded-full " +
          (kind === "appointment"
            ? "bg-purple-500"
            : kind === "lead"
            ? "bg-indigo-500"
            : kind === "completed"
            ? "bg-emerald-500"
            : kind === "missed"
            ? "bg-amber-500"
            : kind === "new"
            ? "bg-sky-500"
            : kind === "booked"
            ? "bg-purple-500"
            : "bg-slate-400")
        }
      />
      {label ?? defaultLabels[kind]}
    </span>
  );
}
