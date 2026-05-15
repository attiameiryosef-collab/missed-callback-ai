import { fetchCalls } from "@/lib/queries";
import { CallsTable } from "@/components/CallsTable";
import { PageHeader } from "@/components/PageHeader";
import { ConfigBanner } from "@/components/ConfigBanner";
import { ErrorBanner } from "@/components/ErrorBanner";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CallsPage() {
  const result = await fetchCalls(200);

  return (
    <>
      <PageHeader
        title="Calls"
        subtitle="Every callback conversation the AI agent completed. Click a row to see the full transcript and recording."
      />
      <main className="flex-1 px-6 md:px-10 py-6 space-y-4">
        {!result.configured ? <ConfigBanner /> : null}
        {result.error ? <ErrorBanner message={result.error} /> : null}
        <CallsTable calls={result.data} />
      </main>
    </>
  );
}
