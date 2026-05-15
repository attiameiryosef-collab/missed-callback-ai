"use client";

import type { Call, Lead } from "@/lib/types";
import { formatDate, formatDuration, formatPhone } from "@/lib/format";
import { AudioPlayer } from "./AudioPlayer";
import { StatusBadge } from "./StatusBadge";
import { Avatar } from "./Avatar";
import { ModalShell, ModalSkeleton } from "./ModalShell";
import { TranscriptView } from "./TranscriptView";

interface LeadDetailsModalProps {
  lead: Lead | null;
  call?: Call | null;
  onClose: () => void;
}

export function LeadDetailsModal({ lead, call, onClose }: LeadDetailsModalProps) {
  return (
    <ModalShell
      open={Boolean(lead)}
      onClose={onClose}
      itemKey={lead?.id}
      skeleton={<ModalSkeleton />}
      header={
        lead ? (
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={lead.name} phone={lead.phone} size="lg" />
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Lead
              </div>
              <div className="text-lg font-semibold text-slate-900 truncate">
                {lead.name || "Unknown caller"}
              </div>
              <div className="mt-0.5 text-xs text-slate-500 truncate">
                {formatPhone(lead.phone)} · {formatDate(lead.created_at)}
              </div>
            </div>
          </div>
        ) : null
      }
    >
      {lead ? <LeadBody lead={lead} call={call ?? null} /> : null}
    </ModalShell>
  );
}

function LeadBody({ lead, call }: { lead: Lead; call: Call | null }) {
  const summary = lead.call_summary || call?.call_summary || null;
  const preferredTime = lead.preferred_time || call?.preferred_time || null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {lead.appointment_requested ? (
          <StatusBadge kind="appointment" />
        ) : (
          <StatusBadge kind="new" label={lead.status} />
        )}
        {lead.missed_call_count > 1 ? (
          <span className="text-xs text-amber-700 bg-amber-50 ring-1 ring-inset ring-amber-200 px-2 py-0.5 rounded-full">
            {lead.missed_call_count} missed attempts
          </span>
        ) : null}
        {call?.ended_reason ? (
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            ended: {call.ended_reason}
          </span>
        ) : null}
      </div>

      <Section label="Summary">
        <p className="text-sm text-slate-700 leading-relaxed">
          {summary || <span className="text-slate-400">Not available yet</span>}
        </p>
      </Section>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Duration"
          value={formatDuration(call?.duration_seconds)}
        />
        <Field label="Preferred time" value={preferredTime || "—"} />
      </div>

      <Section label="Recording">
        <AudioPlayer src={call?.recording_url ?? null} />
      </Section>

      <Section label="Transcript">
        <TranscriptView transcript={call?.transcript ?? null} />
      </Section>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
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
