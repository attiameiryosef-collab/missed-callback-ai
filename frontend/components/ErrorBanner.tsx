interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
      <div className="font-medium">Couldn’t load data from Supabase.</div>
      <div className="mt-1 text-rose-800 font-mono text-xs break-all">{message}</div>
    </div>
  );
}
