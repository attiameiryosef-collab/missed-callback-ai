-- Track how many times the same phone has been a missed call recently.
-- Used to give the Vapi assistant context like "we saw you tried a few times".

alter table leads
  add column if not exists missed_call_count integer not null default 0;

create index if not exists leads_phone_created_at_idx
  on leads (phone, created_at desc);
