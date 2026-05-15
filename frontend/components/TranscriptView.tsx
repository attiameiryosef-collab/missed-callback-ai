import { parseTranscript } from "@/lib/transcript";

interface TranscriptViewProps {
  transcript: string | null | undefined;
  customerName?: string | null;
}

export function TranscriptView({ transcript, customerName }: TranscriptViewProps) {
  const turns = parseTranscript(transcript);
  const customerLabel = chipLabelFor(customerName);

  if (turns.length === 0) {
    return (
      <div className="text-sm text-slate-400 italic">Not available yet</div>
    );
  }

  // If we couldn't parse speakers, fall back to the plain text block we used before.
  if (turns.length === 1 && turns[0].speaker === "unknown") {
    return (
      <pre className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans bg-slate-50 rounded-lg p-4 border border-slate-200 max-h-72 overflow-y-auto">
        {turns[0].text}
      </pre>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 max-h-72 overflow-y-auto">
      <ul className="space-y-3">
        {turns.map((t, i) => (
          <li
            key={i}
            className={
              "flex items-start gap-2.5 " +
              (t.speaker === "user" ? "flex-row-reverse" : "")
            }
          >
            <RoleChip speaker={t.speaker} customerLabel={customerLabel} />
            <div
              className={
                "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed " +
                bubbleClass(t.speaker)
              }
            >
              {t.text}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoleChip({
  speaker,
  customerLabel,
}: {
  speaker: "ai" | "user" | "unknown";
  customerLabel: string;
}) {
  const label =
    speaker === "ai" ? "AI" : speaker === "user" ? customerLabel : "··";
  const cls =
    speaker === "ai"
      ? "bg-indigo-100 text-indigo-700"
      : speaker === "user"
      ? "bg-purple-100 text-purple-700"
      : "bg-slate-200 text-slate-600";
  return (
    <span
      className={
        "shrink-0 h-7 px-2 rounded-full grid place-items-center text-[10px] font-semibold whitespace-nowrap " +
        cls
      }
    >
      {label}
    </span>
  );
}

function chipLabelFor(name: string | null | undefined): string {
  const clean = (name ?? "").trim();
  if (!clean) return "Customer";
  const first = clean.split(/\s+/)[0];
  return first.length > 14 ? "Customer" : first;
}

function bubbleClass(speaker: "ai" | "user" | "unknown") {
  if (speaker === "ai") {
    return "bg-white text-slate-700 border border-slate-200 rounded-tl-sm";
  }
  if (speaker === "user") {
    return "bg-indigo-600 text-white border border-indigo-600 rounded-tr-sm";
  }
  return "bg-white text-slate-600 border border-slate-200";
}
