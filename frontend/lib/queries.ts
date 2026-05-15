import { getSupabase, supabaseConfigured } from "./supabase";
import type { Call, DailyPoint, DashboardStats, Lead } from "./types";

export interface QueryResult<T> {
  data: T;
  error: string | null;
  configured: boolean;
}

const EMPTY_STATS: DashboardStats = {
  totalCalls: 0,
  totalLeads: 0,
  appointmentsRequested: 0,
  avgDurationSeconds: 0,
  transcriptCount: 0,
  recordingCount: 0,
  callsLast7: 0,
  callsPrev7: 0,
  leadsLast7: 0,
  leadsPrev7: 0,
  apptLast7: 0,
  apptPrev7: 0,
  avgDurationLast7: 0,
  avgDurationPrev7: 0,
  callsDaily: [],
  leadsDaily: [],
  statusDistribution: [],
};

export async function fetchCalls(limit = 100): Promise<QueryResult<Call[]>> {
  if (!supabaseConfigured) {
    return { data: [], error: null, configured: false };
  }
  const supabase = getSupabase();
  if (!supabase) return { data: [], error: null, configured: false };

  const { data, error } = await supabase
    .from("calls")
    .select(
      "id, phone, call_summary, transcript, recording_url, duration_seconds, ended_reason, appointment_requested, preferred_time, status, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { data: [], error: error.message, configured: true };
  }
  return { data: (data ?? []) as Call[], error: null, configured: true };
}

export async function fetchLeads(limit = 100): Promise<QueryResult<Lead[]>> {
  if (!supabaseConfigured) {
    return { data: [], error: null, configured: false };
  }
  const supabase = getSupabase();
  if (!supabase) return { data: [], error: null, configured: false };

  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, phone, name, call_summary, appointment_requested, preferred_time, status, missed_call_count, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { data: [], error: error.message, configured: true };
  }
  return { data: (data ?? []) as Lead[], error: null, configured: true };
}

type CallsSlice = Pick<
  Call,
  | "appointment_requested"
  | "status"
  | "duration_seconds"
  | "transcript"
  | "recording_url"
  | "created_at"
>;

type LeadsSlice = Pick<Lead, "created_at">;

export async function fetchDashboardStats(): Promise<
  QueryResult<DashboardStats>
> {
  if (!supabaseConfigured) {
    return { data: EMPTY_STATS, error: null, configured: false };
  }
  const supabase = getSupabase();
  if (!supabase) return { data: EMPTY_STATS, error: null, configured: false };

  const [callsRes, leadsRes] = await Promise.all([
    supabase
      .from("calls")
      .select(
        "appointment_requested, status, duration_seconds, transcript, recording_url, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase
      .from("leads")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);

  const firstError = callsRes.error?.message ?? leadsRes.error?.message ?? null;
  if (firstError) {
    return { data: EMPTY_STATS, error: firstError, configured: true };
  }

  const calls = (callsRes.data ?? []) as CallsSlice[];
  const leads = (leadsRes.data ?? []) as LeadsSlice[];

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const last7Start = now - 7 * day;
  const prev7Start = now - 14 * day;

  const inRange = (iso: string, from: number, to: number) => {
    const t = new Date(iso).getTime();
    return !Number.isNaN(t) && t >= from && t < to;
  };

  const callsLast7 = calls.filter((c) => inRange(c.created_at, last7Start, now)).length;
  const callsPrev7 = calls.filter((c) => inRange(c.created_at, prev7Start, last7Start)).length;
  const leadsLast7 = leads.filter((l) => inRange(l.created_at, last7Start, now)).length;
  const leadsPrev7 = leads.filter((l) => inRange(l.created_at, prev7Start, last7Start)).length;

  const appts = calls.filter((c) => c.appointment_requested);
  const apptLast7 = appts.filter((c) => inRange(c.created_at, last7Start, now)).length;
  const apptPrev7 = appts.filter((c) => inRange(c.created_at, prev7Start, last7Start)).length;

  const avgDurationOf = (rows: CallsSlice[]) => {
    const ds = rows
      .map((r) => r.duration_seconds)
      .filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
    if (ds.length === 0) return 0;
    return Math.round(ds.reduce((a, b) => a + b, 0) / ds.length);
  };

  const avgDuration = avgDurationOf(calls);
  const avgDurationLast7 = avgDurationOf(
    calls.filter((c) => inRange(c.created_at, last7Start, now)),
  );
  const avgDurationPrev7 = avgDurationOf(
    calls.filter((c) => inRange(c.created_at, prev7Start, last7Start)),
  );

  const callsDaily = bucketDaily(calls.map((c) => c.created_at), 14);
  const leadsDaily = bucketDaily(leads.map((l) => l.created_at), 14);

  const statusCounts = new Map<string, number>();
  for (const c of calls) {
    const key = c.appointment_requested
      ? "appointment"
      : (c.status || "completed").toLowerCase();
    statusCounts.set(key, (statusCounts.get(key) ?? 0) + 1);
  }
  const statusDistribution = Array.from(statusCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const stats: DashboardStats = {
    totalCalls: calls.length,
    totalLeads: leads.length,
    appointmentsRequested: appts.length,
    avgDurationSeconds: avgDuration,
    transcriptCount: calls.filter((c) => Boolean(c.transcript)).length,
    recordingCount: calls.filter((c) => Boolean(c.recording_url)).length,
    callsLast7,
    callsPrev7,
    leadsLast7,
    leadsPrev7,
    apptLast7,
    apptPrev7,
    avgDurationLast7,
    avgDurationPrev7,
    callsDaily,
    leadsDaily,
    statusDistribution,
  };

  return { data: stats, error: null, configured: true };
}

function bucketDaily(isoDates: string[], days: number): DailyPoint[] {
  const now = new Date();
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    buckets.set(dayKey(d), 0);
  }
  for (const iso of isoDates) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) continue;
    d.setHours(0, 0, 0, 0);
    const k = dayKey(d);
    if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}
