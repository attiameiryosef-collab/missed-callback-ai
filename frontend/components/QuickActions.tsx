import Link from "next/link";

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <ActionLink
        href="/calls"
        title="View all calls"
        subtitle="Every recovered conversation"
        accent="indigo"
        icon={
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
          </svg>
        }
      />
      <ActionLink
        href="/leads"
        title="View all leads"
        subtitle="Opportunities worth a follow-up"
        accent="purple"
        icon={
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l2.39 4.84L20 8l-4 3.9L17 18l-5-2.6L7 18l1-6.1L4 8l5.61-1.16L12 2z" />
          </svg>
        }
      />
      <ActionButton
        title="Run live demo"
        subtitle="Simulate a missed call"
        accent="emerald"
        icon={
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        }
      />
    </div>
  );
}

type Accent = "indigo" | "purple" | "emerald";

const ACCENTS: Record<Accent, string> = {
  indigo: "bg-indigo-50 text-indigo-600",
  purple: "bg-purple-50 text-purple-600",
  emerald: "bg-emerald-50 text-emerald-600",
};

function ActionLink({
  href,
  title,
  subtitle,
  icon,
  accent,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: Accent;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl border border-slate-200 shadow-card p-4 flex items-center gap-3 hover:border-indigo-300 hover:shadow-md transition-all group"
    >
      <div className={"h-9 w-9 rounded-lg grid place-items-center " + ACCENTS[accent]}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <div className="text-xs text-slate-500 truncate">{subtitle}</div>
      </div>
      <svg className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  );
}

function ActionButton({
  title,
  subtitle,
  icon,
  accent,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: Accent;
}) {
  return (
    <button
      type="button"
      disabled
      title="Coming soon — uses the backend /twilio/simulate-missed-call endpoint"
      className="bg-white rounded-xl border border-slate-200 shadow-card p-4 flex items-center gap-3 text-left opacity-80 cursor-not-allowed"
    >
      <div className={"h-9 w-9 rounded-lg grid place-items-center " + ACCENTS[accent]}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <div className="text-xs text-slate-500 truncate">{subtitle}</div>
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
        Soon
      </span>
    </button>
  );
}
