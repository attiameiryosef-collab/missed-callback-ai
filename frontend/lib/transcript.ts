export type Speaker = "ai" | "user" | "unknown";

export interface Turn {
  speaker: Speaker;
  text: string;
}

const SPEAKER_RE = /(AI|Agent|Assistant|Bot|User|Customer|Caller|Human)\s*:\s*/gi;

const AI_ROLES = new Set(["ai", "agent", "assistant", "bot"]);

export function parseTranscript(raw: string | null | undefined): Turn[] {
  const text = (raw ?? "").trim();
  if (!text) return [];

  const matches = [...text.matchAll(SPEAKER_RE)];
  if (matches.length === 0) {
    return [{ speaker: "unknown", text }];
  }

  const turns: Turn[] = [];
  // If there's a preamble before the first speaker tag, keep it as an unknown intro turn.
  const firstIdx = matches[0].index ?? 0;
  const preamble = text.slice(0, firstIdx).trim();
  if (preamble) turns.push({ speaker: "unknown", text: preamble });

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const role = (m[1] || "").toLowerCase();
    const speaker: Speaker = AI_ROLES.has(role) ? "ai" : "user";
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index ?? text.length : text.length;
    const content = text.slice(start, end).trim();
    if (content) turns.push({ speaker, text: content });
  }
  return turns;
}
