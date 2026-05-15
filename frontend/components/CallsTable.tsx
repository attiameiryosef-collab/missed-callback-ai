"use client";

import { useState } from "react";
import type { Call } from "@/lib/types";
import {
  formatDate,
  formatDuration,
  formatPhone,
  formatRelative,
} from "@/lib/format";
import { StatusBadge } from "./StatusBadge";
import { EmptyState } from "./EmptyState";
import { CallDetailsModal } from "./CallDetailsModal";
import { Avatar } from "./Avatar";

interface CallsTableProps {
  calls: Call[];
  namesByPhone?: Record<string, string>;
}

export function CallsTable({ calls, namesByPhone = {} }: CallsTableProps) {
  const [selected, setSelected] = useState<Call | null>(null);

  if (calls.length === 0) {
    return (
      <EmptyState
        title="No recovered calls yet"
        description="When the AI agent finishes a callback conversation, it will appear here."
      />
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <div className="hidden md:grid grid-cols-12 px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide border-b border-slate-200 bg-slate-50/80">
          <div className="col-span-3">Caller</div>
          <div className="col-span-4">Summary</div>
          <div className="col-span-1">Duration</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">When</div>
        </div>
        <ul className="divide-y divide-slate-100">
          {calls.map((call) => (
            <li
              key={call.id}
              onClick={() => setSelected(call)}
              className="group grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-4 cursor-pointer hover:bg-indigo-50/30 transition-colors"
            >
              <div className="md:col-span-3 flex items-center gap-3">
                <Avatar name={namesByPhone[call.phone]} phone={call.phone} />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">
                    {namesByPhone[call.phone] || formatPhone(call.phone)}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {namesByPhone[call.phone] ? formatPhone(call.phone) : null}
                    <span className="md:hidden">
                      {namesByPhone[call.phone] ? " · " : ""}
                      {formatRelative(call.created_at)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="md:col-span-4 text-sm text-slate-700 line-clamp-2">
                {call.call_summary || (
                  <span className="text-slate-400 italic">
                    Summary not available yet
                  </span>
                )}
              </div>
              <div className="md:col-span-1 text-sm text-slate-700">
                {formatDuration(call.duration_seconds)}
              </div>
              <div className="md:col-span-2 flex items-center">
                {call.appointment_requested ? (
                  <StatusBadge kind="appointment" />
                ) : (
                  <StatusBadge
                    kind={call.status === "missed" ? "missed" : "completed"}
                    label={call.status}
                  />
                )}
              </div>
              <div className="md:col-span-2 md:text-right flex md:block items-center justify-between">
                <span
                  className="hidden md:block text-xs text-slate-500"
                  title={formatDate(call.created_at)}
                >
                  {formatRelative(call.created_at)}
                </span>
                <span
                  className="md:mt-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 group-hover:text-indigo-700 group-hover:translate-x-0.5 transition-transform"
                >
                  View details
                  <span aria-hidden>→</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <CallDetailsModal call={selected} onClose={() => setSelected(null)} />
    </>
  );
}
