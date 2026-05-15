"use client";

import { useState } from "react";
import Link from "next/link";
import type { Call } from "@/lib/types";
import { formatPhone, formatRelative } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";
import { EmptyState } from "./EmptyState";
import { CallDetailsModal } from "./CallDetailsModal";
import { Avatar } from "./Avatar";

interface RecentCallsListProps {
  calls: Call[];
}

export function RecentCallsList({ calls }: RecentCallsListProps) {
  const [selected, setSelected] = useState<Call | null>(null);

  if (calls.length === 0) {
    return (
      <EmptyState
        title="No recovered calls yet"
        description="When the AI agent finishes a callback, it will show up here."
      />
    );
  }

  return (
    <>
      <ul className="divide-y divide-slate-100 -mx-5">
        {calls.map((call) => (
          <li
            key={call.id}
            onClick={() => setSelected(call)}
            className="group px-5 py-3 cursor-pointer hover:bg-indigo-50/30 transition-colors flex items-center gap-3"
          >
            <Avatar phone={call.phone} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-slate-900 truncate">
                  {formatPhone(call.phone)}
                </div>
                {call.appointment_requested ? (
                  <StatusBadge kind="appointment" label="Appointment" />
                ) : null}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {call.call_summary || "Summary not available yet"}
              </div>
            </div>
            <div className="text-xs text-slate-500 whitespace-nowrap hidden sm:block">
              {formatRelative(call.created_at)}
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 group-hover:text-indigo-700 group-hover:translate-x-0.5 transition-transform whitespace-nowrap">
              View
              <span aria-hidden>→</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 pt-3 border-t border-slate-100 text-right">
        <Link
          href="/calls"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          View all calls →
        </Link>
      </div>
      <CallDetailsModal call={selected} onClose={() => setSelected(null)} />
    </>
  );
}
