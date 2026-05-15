import { fetchCalls, fetchLeads } from "@/lib/queries";
import { CallsTable } from "@/components/CallsTable";
import { PageHeader } from "@/components/PageHeader";
import { ConfigBanner } from "@/components/ConfigBanner";
import { ErrorBanner } from "@/components/ErrorBanner";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CallsPage() {
  const [callsRes, leadsRes] = await Promise.all([
    fetchCalls(200),
    fetchLeads(500),
  ]);

  // Index lead names by phone so the call avatar can show real initials when
  // the same caller is also a known lead. Leads are ordered desc by created_at,
  // so the first hit per phone is the most recent named lead — keep that.
  const namesByPhone: Record<string, string> = {};
  for (const l of leadsRes.data) {
    if (l.name && !namesByPhone[l.phone]) namesByPhone[l.phone] = l.name;
  }

  const error = callsRes.error ?? leadsRes.error ?? null;

  return (
    <>
      <PageHeader
        title="Calls"
        subtitle="Every callback conversation the AI agent completed. Click a row to see the full transcript and recording."
      />
      <main className="flex-1 px-6 md:px-10 py-6 space-y-4">
        {!callsRes.configured ? <ConfigBanner /> : null}
        {error ? <ErrorBanner message={error} /> : null}
        <CallsTable calls={callsRes.data} namesByPhone={namesByPhone} />
      </main>
    </>
  );
}
