"use client";

import { useState } from "react";
import Link from "next/link";
import type { Call } from "@/lib/types";
import { formatPhone, formatRelative } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";
import { EmptyState } from "./EmptyState";
import { CallDetailsModal } from "./CallDetailsModal";

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
            className="px-5 py-3 hover:bg-slate-50/60 transition-colors flex items-center gap-3"
          >
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-semibold grid place-items-center shrink-0">
              {phoneInitials(call.phone)}
            </div>
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
            <button
              onClick={() => setSelected(call)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
            >
              View →
            </button>
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

function phoneInitials(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length >= 2) return digits.slice(-2);
  return phone.slice(0, 2).toUpperCase();
}
