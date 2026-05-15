import { fetchCalls, fetchLeads } from "@/lib/queries";
import { LeadsTable } from "@/components/LeadsTable";
import { PageHeader } from "@/components/PageHeader";
import { ConfigBanner } from "@/components/ConfigBanner";
import { ErrorBanner } from "@/components/ErrorBanner";
import type { Call } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LeadsPage() {
  const [leadsRes, callsRes] = await Promise.all([
    fetchLeads(200),
    fetchCalls(500),
  ]);

  // Index calls by phone. Calls are already ordered desc by created_at, so the
  // first one we see for a number is the most recent one — keep that.
  const callsByPhone: Record<string, Call> = {};
  for (const c of callsRes.data) {
    if (!callsByPhone[c.phone]) callsByPhone[c.phone] = c;
  }

  const error = leadsRes.error ?? callsRes.error ?? null;

  return (
    <>
      <PageHeader
        title="Leads"
        subtitle="Calls that turned into an opportunity — the caller asked for an appointment or gave their name."
      />
      <main className="flex-1 px-6 md:px-10 py-6 space-y-4">
        {!leadsRes.configured ? <ConfigBanner /> : null}
        {error ? <ErrorBanner message={error} /> : null}
        <LeadsTable leads={leadsRes.data} callsByPhone={callsByPhone} />
      </main>
    </>
  );
}
