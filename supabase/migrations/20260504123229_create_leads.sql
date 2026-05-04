-- One row per recovered (or attempted) call.
-- Single table, no auth, no RLS — demo only.

create extension if not exists "pgcrypto";

create table if not exists leads (
  id                    uuid primary key default gen_random_uuid(),
  phone                 text not null,
  name                  text,
  call_summary          text,
  appointment_requested boolean not null default false,
  preferred_time        text,
  status                text not null default 'new',
  created_at            timestamptz not null default now()
);
