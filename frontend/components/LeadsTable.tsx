"use client";

import { useState } from "react";
import type { Call, Lead } from "@/lib/types";
import { formatDate, formatPhone, formatRelative } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";
import { EmptyState } from "./EmptyState";
import { Avatar } from "./Avatar";
import { LeadDetailsModal } from "./LeadDetailsModal";

interface LeadsTableProps {
  leads: Lead[];
  callsByPhone?: Record<string, Call>;
}

export function LeadsTable({ leads, callsByPhone = {} }: LeadsTableProps) {
  const [selected, setSelected] = useState<Lead | null>(null);

  if (leads.length === 0) {
    return (
      <EmptyState
        title="No leads yet"
        description="A lead is recorded when a caller gave their name or asked for an appointment."
      />
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <div className="hidden md:grid grid-cols-12 px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide border-b border-slate-200 bg-slate-50/80">
          <div className="col-span-3">Caller</div>
          <div className="col-span-4">Summary</div>
          <div className="col-span-2">Preferred time</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">When</div>
        </div>
        <ul className="divide-y divide-slate-100">
          {leads.map((lead) => (
            <li
              key={lead.id}
              onClick={() => setSelected(lead)}
              className="group grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-4 cursor-pointer hover:bg-indigo-50/30 transition-colors"
            >
              <div className="md:col-span-3 flex items-center gap-3 min-w-0">
                <Avatar name={lead.name} phone={lead.phone} />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">
                    {lead.name || "Unknown caller"}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {formatPhone(lead.phone)}
                  </div>
                </div>
              </div>
              <div className="md:col-span-4 text-sm text-slate-700 line-clamp-2">
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
              <div className="md:col-span-2 flex items-center">
                {lead.appointment_requested ? (
                  <StatusBadge kind="appointment" />
                ) : (
                  <StatusBadge
                    kind={leadStatusKind(lead.status)}
                    label={lead.status}
                  />
                )}
              </div>
              <div className="md:col-span-1 md:text-right flex md:block items-center justify-between">
                <span
                  className="hidden md:block text-xs text-slate-500"
                  title={formatDate(lead.created_at)}
                >
                  {formatRelative(lead.created_at)}
                </span>
                <span className="md:mt-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 group-hover:text-indigo-700 group-hover:translate-x-0.5 transition-transform">
                  View details
                  <span aria-hidden>→</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <LeadDetailsModal
        lead={selected}
        call={selected ? callsByPhone[selected.phone] ?? null : null}
        onClose={() => setSelected(null)}
      />
    </>
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
