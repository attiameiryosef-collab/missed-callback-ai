import Link from "next/link";
import type { Lead } from "@/lib/types";
import { formatPhone, formatRelative } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";
import { EmptyState } from "./EmptyState";

interface RecentLeadsListProps {
  leads: Lead[];
}

export function RecentLeadsList({ leads }: RecentLeadsListProps) {
  if (leads.length === 0) {
    return (
      <EmptyState
        title="No leads yet"
        description="A lead is saved when the caller gave their name or asked for an appointment."
      />
    );
  }
  return (
    <>
      <ul className="divide-y divide-slate-100 -mx-5">
        {leads.map((lead) => (
          <li
            key={lead.id}
            className="px-5 py-3 hover:bg-slate-50/60 transition-colors flex items-center gap-3"
          >
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-xs font-semibold grid place-items-center shrink-0">
              {(lead.name?.slice(0, 2) || "??").toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-slate-900 truncate">
                {lead.name || "Unknown caller"}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {formatPhone(lead.phone)}
                {lead.preferred_time ? ` · prefers ${lead.preferred_time}` : ""}
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-1">
              {lead.appointment_requested ? (
                <StatusBadge kind="appointment" />
              ) : (
                <StatusBadge kind="new" label={lead.status} />
              )}
              <span className="text-xs text-slate-500">
                {formatRelative(lead.created_at)}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 pt-3 border-t border-slate-100 text-right">
        <Link
          href="/leads"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          View all leads →
        </Link>
      </div>
    </>
  );
}
