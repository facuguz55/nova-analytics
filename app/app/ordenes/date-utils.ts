export type Preset = "today" | "yesterday" | "7d" | "15d" | "30d" | "60d" | "90d" | "custom";

function fmt(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function presetToDates(preset: Preset): { since: string; until: string } {
  const now = new Date();
  const today = fmt(now);
  const dayMs = 86400000;
  if (preset === "today")     return { since: today, until: today };
  if (preset === "yesterday") return { since: fmt(new Date(now.getTime() - dayMs)), until: fmt(new Date(now.getTime() - dayMs)) };
  if (preset === "7d")        return { since: fmt(new Date(now.getTime() - 7  * dayMs)), until: today };
  if (preset === "15d")       return { since: fmt(new Date(now.getTime() - 15 * dayMs)), until: today };
  if (preset === "30d")       return { since: fmt(new Date(now.getTime() - 30 * dayMs)), until: today };
  if (preset === "60d")       return { since: fmt(new Date(now.getTime() - 60 * dayMs)), until: today };
  if (preset === "90d")       return { since: fmt(new Date(now.getTime() - 90 * dayMs)), until: today };
  return { since: fmt(new Date(now.getTime() - 30 * dayMs)), until: today };
}
