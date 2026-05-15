export function ConfigBanner() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <div className="font-medium">Supabase is not configured for this environment.</div>
      <div className="mt-1 text-amber-800">
        Set <code className="px-1 py-0.5 rounded bg-amber-100">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="px-1 py-0.5 rounded bg-amber-100">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
        to read the <code>calls</code> and <code>leads</code> tables.
      </div>
    </div>
  );
}
