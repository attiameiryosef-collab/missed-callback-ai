"use client";

import { useEffect } from "react";
import type { Call } from "@/lib/types";
import { formatDate, formatDuration, formatPhone } from "@/lib/format";
import { AudioPlayer } from "./AudioPlayer";
import { StatusBadge } from "./StatusBadge";

interface CallDetailsModalProps {
  call: Call | null;
  onClose: () => void;
}

export function CallDetailsModal({ call, onClose }: CallDetailsModalProps) {
  useEffect(() => {
    if (!call) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [call, onClose]);

  if (!call) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Call from
            </div>
            <div className="text-lg font-semibold text-slate-900">
              {formatPhone(call.phone)}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {formatDate(call.created_at)}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-5">
          <div className="flex flex-wrap gap-2">
            {call.appointment_requested ? (
              <StatusBadge kind="appointment" />
            ) : (
              <StatusBadge
                kind={call.status === "missed" ? "missed" : "completed"}
                label={call.status}
              />
            )}
            {call.ended_reason ? (
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                ended: {call.ended_reason}
              </span>
            ) : null}
          </div>

          <Section label="Summary">
            <p className="text-sm text-slate-700 leading-relaxed">
              {call.call_summary || (
                <span className="text-slate-400">Not available yet</span>
              )}
            </p>
          </Section>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Duration" value={formatDuration(call.duration_seconds)} />
            <Field label="Preferred time" value={call.preferred_time || "—"} />
          </div>

          <Section label="Recording">
            <AudioPlayer src={call.recording_url} />
          </Section>

          <Section label="Transcript">
            {call.transcript ? (
              <pre className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans bg-slate-50 rounded-lg p-4 border border-slate-200 max-h-72 overflow-y-auto">
                {call.transcript}
              </pre>
            ) : (
              <div className="text-sm text-slate-400 italic">
                Not available yet
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
        {label}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm text-slate-900 font-medium">{value}</div>
    </div>
  );
}
