-- Dashboard reads calls + leads from the browser with the anon key.
-- RLS stays ON so writes are still locked to service_role (backend only).
-- Demo only: no auth; any visitor can read every row.

alter table public.calls enable row level security;
alter table public.leads enable row level security;

drop policy if exists "anon read calls" on public.calls;
drop policy if exists "anon read leads" on public.leads;

create policy "anon read calls" on public.calls
  for select to anon using (true);

create policy "anon read leads" on public.leads
  for select to anon using (true);
