"use client";

import type { Call } from "@/lib/types";
import { formatDate, formatDuration, formatPhone } from "@/lib/format";
import { AudioPlayer } from "./AudioPlayer";
import { StatusBadge } from "./StatusBadge";
import { Avatar } from "./Avatar";
import { ModalShell, ModalSkeleton } from "./ModalShell";
import { TranscriptView } from "./TranscriptView";

interface CallDetailsModalProps {
  call: Call | null;
  onClose: () => void;
  customerName?: string | null;
}

export function CallDetailsModal({
  call,
  onClose,
  customerName,
}: CallDetailsModalProps) {
  return (
    <ModalShell
      open={Boolean(call)}
      onClose={onClose}
      itemKey={call?.id}
      skeleton={<ModalSkeleton />}
      header={
        call ? (
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={customerName} phone={call.phone} size="lg" />
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Call from
              </div>
              <div className="text-lg font-semibold text-slate-900 truncate">
                {customerName || formatPhone(call.phone)}
              </div>
              <div className="mt-0.5 text-xs text-slate-500 truncate">
                {customerName ? `${formatPhone(call.phone)} · ` : ""}
                {formatDate(call.created_at)}
              </div>
            </div>
          </div>
        ) : null
      }
    >
      {call ? <CallBody call={call} customerName={customerName} /> : null}
    </ModalShell>
  );
}

function CallBody({
  call,
  customerName,
}: {
  call: Call;
  customerName?: string | null;
}) {
  return (
    <div className="space-y-5">
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
        <TranscriptView
          transcript={call.transcript}
          customerName={customerName}
        />
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
