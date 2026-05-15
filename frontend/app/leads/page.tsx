import { fetchLeads } from "@/lib/queries";
import { LeadsTable } from "@/components/LeadsTable";
import { PageHeader } from "@/components/PageHeader";
import { ConfigBanner } from "@/components/ConfigBanner";
import { ErrorBanner } from "@/components/ErrorBanner";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LeadsPage() {
  const result = await fetchLeads(200);

  return (
    <>
      <PageHeader
        title="Leads"
        subtitle="Calls that turned into an opportunity — the caller asked for an appointment or gave their name."
      />
      <main className="flex-1 px-6 md:px-10 py-6 space-y-4">
        {!result.configured ? <ConfigBanner /> : null}
        {result.error ? <ErrorBanner message={result.error} /> : null}
        <LeadsTable leads={result.data} />
      </main>
    </>
  );
}
