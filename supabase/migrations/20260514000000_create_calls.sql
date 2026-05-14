-- One row per recovered callback conversation (every Vapi end-of-call-report).
-- `calls` is the source of truth for the dashboard; `leads` is reserved for
-- conversations that produced an actual opportunity (appointment or named caller).
-- Single table, no auth, no RLS — demo only.

create extension if not exists "pgcrypto";

create table if not exists calls (
  id                    uuid primary key default gen_random_uuid(),
  phone                 text not null,
  call_summary          text,
  transcript            text,
  recording_url         text,
  duration_seconds      int,
  ended_reason          text,
  appointment_requested boolean not null default false,
  preferred_time        text,
  status                text not null default 'completed',
  created_at            timestamptz not null default now()
);

create index if not exists calls_phone_created_at_idx
  on calls (phone, created_at desc);
