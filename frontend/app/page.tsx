import { fetchCalls, fetchDashboardStats, fetchLeads } from "@/lib/queries";
import { KpiCard } from "@/components/KpiCard";
import { LineChart } from "@/components/LineChart";
import { BarChart } from "@/components/BarChart";
import { DonutChart } from "@/components/DonutChart";
import { SectionCard } from "@/components/SectionCard";
import { RecentCallsList } from "@/components/RecentCallsList";
import { RecentLeadsList } from "@/components/RecentLeadsList";
import { QuickActions } from "@/components/QuickActions";
import { ConfigBanner } from "@/components/ConfigBanner";
import { ErrorBanner } from "@/components/ErrorBanner";
import { formatDuration } from "@/lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const [statsRes, callsRes, leadsRes] = await Promise.all([
    fetchDashboardStats(),
    fetchCalls(5),
    fetchLeads(5),
  ]);

  const configured = statsRes.configured;
  const error = statsRes.error ?? callsRes.error ?? leadsRes.error;
  const s = statsRes.data;

  const apptVsCalls = [
    {
      label: "Appointment requested",
      value: s.appointmentsRequested,
      color: "#a855f7",
    },
    {
      label: "Regular call",
      value: Math.max(0, s.totalCalls - s.appointmentsRequested),
      color: "#cbd5e1",
    },
  ];

  const STATUS_COLORS: Record<string, string> = {
    appointment: "#a855f7",
    completed: "#10b981",
    missed: "#f59e0b",
    new: "#0ea5e9",
    contacted: "#64748b",
    booked: "#6366f1",
  };
  const statusSlices = s.statusDistribution.map((row) => ({
    label: row.label,
    value: row.count,
    color: STATUS_COLORS[row.label] ?? "#94a3b8",
  }));

  return (
    <>
      <header className="px-6 md:px-10 pt-10 pb-8 border-b border-slate-200 bg-gradient-to-b from-white to-slate-50/40">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              AI Call Recovery
            </span>
            <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
              AI Call Recovery Dashboard
            </h1>
            <p className="mt-2 text-base text-slate-600 leading-relaxed">
              Your AI agent recovered missed calls, spoke with customers, and
              saved the results here.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>
      </header>

      <main className="flex-1 px-6 md:px-10 py-6 space-y-6">
        {!configured ? <ConfigBanner /> : null}
        {error ? <ErrorBanner message={error} /> : null}

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Recovered calls"
            value={s.totalCalls}
            hint="Every callback conversation"
            accent="indigo"
            current={s.callsLast7}
            previous={s.callsPrev7}
            series={s.callsDaily.map((p) => p.count)}
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
              </svg>
            }
          />
          <KpiCard
            label="Leads found"
            value={s.totalLeads}
            hint="Named caller or asked to book"
            accent="purple"
            current={s.leadsLast7}
            previous={s.leadsPrev7}
            series={s.leadsDaily.map((p) => p.count)}
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l2.39 4.84L20 8l-4 3.9L17 18l-5-2.6L7 18l1-6.1L4 8l5.61-1.16L12 2z" />
              </svg>
            }
          />
          <KpiCard
            label="Appointments requested"
            value={s.appointmentsRequested}
            hint="Callers who asked to book"
            accent="emerald"
            current={s.apptLast7}
            previous={s.apptPrev7}
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            }
          />
          <KpiCard
            label="Avg. call duration"
            value={formatDuration(s.avgDurationSeconds)}
            hint={`${s.transcriptCount} with transcript · ${s.recordingCount} with recording`}
            accent="amber"
            current={s.avgDurationLast7}
            previous={s.avgDurationPrev7}
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            }
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SectionCard
            title="Recovered calls over time"
            subtitle="Last 14 days"
            className="lg:col-span-2"
          >
            <LineChart data={s.callsDaily} />
          </SectionCard>
          <SectionCard
            title="Appointments vs regular calls"
            subtitle="All time"
          >
            <DonutChart
              slices={apptVsCalls}
              centerValue={`${s.totalCalls > 0 ? Math.round((s.appointmentsRequested / s.totalCalls) * 100) : 0}%`}
              centerLabel="conversion"
            />
          </SectionCard>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SectionCard
            title="Leads over time"
            subtitle="Last 14 days"
            className="lg:col-span-2"
          >
            <BarChart data={s.leadsDaily} />
          </SectionCard>
          <SectionCard title="Call status" subtitle="Distribution across all calls">
            <DonutChart
              slices={statusSlices}
              centerValue={s.totalCalls.toString()}
              centerLabel="total calls"
            />
          </SectionCard>
        </section>

        <section>
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Quick actions</h2>
            <p className="text-xs text-slate-500">
              Jump into the data or trigger a test call.
            </p>
          </div>
          <QuickActions />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard
            title="Recent calls"
            subtitle="Latest 5 recovered conversations"
          >
            <RecentCallsList calls={callsRes.data} />
          </SectionCard>
          <SectionCard
            title="Recent leads"
            subtitle="Latest opportunities to follow up"
          >
            <RecentLeadsList leads={leadsRes.data} />
          </SectionCard>
        </section>
      </main>
    </>
  );
}
