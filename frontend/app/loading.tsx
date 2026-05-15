export default function Loading() {
  return (
    <>
      <header className="px-6 md:px-10 pt-8 pb-6 border-b border-slate-200 bg-white">
        <div className="h-7 w-40 rounded bg-slate-200 animate-pulse" />
        <div className="mt-2 h-4 w-80 rounded bg-slate-100 animate-pulse" />
      </header>
      <main className="flex-1 px-6 md:px-10 py-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="h-3 w-24 rounded bg-slate-200 animate-pulse" />
              <div className="mt-3 h-8 w-16 rounded bg-slate-200 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="px-5 py-4 border-b border-slate-100 last:border-b-0 flex items-center gap-4"
            >
              <div className="h-9 w-9 rounded-full bg-slate-200 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded bg-slate-200 animate-pulse" />
                <div className="h-3 w-3/4 rounded bg-slate-100 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
