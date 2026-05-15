import type { Lead } from "@/lib/types";
import { formatDate, formatPhone, formatRelative } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";
import { EmptyState } from "./EmptyState";

interface LeadsTableProps {
  leads: Lead[];
}

export function LeadsTable({ leads }: LeadsTableProps) {
  if (leads.length === 0) {
    return (
      <EmptyState
        title="No leads yet"
        description="A lead is recorded when a caller gave their name or asked for an appointment."
      />
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
      <div className="hidden md:grid grid-cols-12 px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide border-b border-slate-200 bg-slate-50">
        <div className="col-span-3">Caller</div>
        <div className="col-span-5">Summary</div>
        <div className="col-span-2">Preferred time</div>
        <div className="col-span-2 text-right">Status</div>
      </div>
      <ul className="divide-y divide-slate-100">
        {leads.map((lead) => (
          <li
            key={lead.id}
            className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors"
          >
            <div className="md:col-span-3 flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-semibold grid place-items-center shrink-0">
                {(lead.name?.slice(0, 2) || "??").toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-900 truncate">
                  {lead.name || "Unknown caller"}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {formatPhone(lead.phone)}
                </div>
              </div>
            </div>
            <div className="md:col-span-5 text-sm text-slate-700 line-clamp-2">
              {lead.call_summary || (
                <span className="text-slate-400 italic">
                  Summary not available yet
                </span>
              )}
            </div>
            <div className="md:col-span-2 text-sm text-slate-700">
              {lead.preferred_time || (
                <span className="text-slate-400">—</span>
              )}
            </div>
            <div className="md:col-span-2 md:text-right flex md:flex-col md:items-end items-center justify-between gap-1">
              {lead.appointment_requested ? (
                <StatusBadge kind="appointment" />
              ) : (
                <StatusBadge
                  kind={leadStatusKind(lead.status)}
                  label={lead.status}
                />
              )}
              <span
                className="text-xs text-slate-500"
                title={formatDate(lead.created_at)}
              >
                {formatRelative(lead.created_at)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function leadStatusKind(
  status: string,
): "new" | "contacted" | "booked" | "missed" | "neutral" {
  switch (status) {
    case "new":
      return "new";
    case "contacted":
      return "contacted";
    case "booked":
      return "booked";
    case "missed":
      return "missed";
    default:
      return "neutral";
  }
}
