export type CallStatus = "completed" | "missed" | string;
export type LeadStatus = "new" | "contacted" | "booked" | "missed" | string;

export interface Call {
  id: string;
  phone: string;
  call_summary: string | null;
  transcript: string | null;
  recording_url: string | null;
  duration_seconds: number | null;
  ended_reason: string | null;
  appointment_requested: boolean;
  preferred_time: string | null;
  status: CallStatus;
  created_at: string;
}

export interface Lead {
  id: string;
  phone: string;
  name: string | null;
  call_summary: string | null;
  appointment_requested: boolean;
  preferred_time: string | null;
  status: LeadStatus;
  missed_call_count: number;
  created_at: string;
}

export interface DailyPoint {
  date: string;
  count: number;
}

export interface DashboardStats {
  totalCalls: number;
  totalLeads: number;
  appointmentsRequested: number;
  avgDurationSeconds: number;
  transcriptCount: number;
  recordingCount: number;
  callsLast7: number;
  callsPrev7: number;
  leadsLast7: number;
  leadsPrev7: number;
  apptLast7: number;
  apptPrev7: number;
  avgDurationLast7: number;
  avgDurationPrev7: number;
  callsDaily: DailyPoint[];
  leadsDaily: DailyPoint[];
  statusDistribution: Array<{ label: string; count: number }>;
}
