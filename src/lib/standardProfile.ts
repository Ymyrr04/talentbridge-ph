export type StandardProfileData = {
  name: string | null | undefined;
  roleTitle: string;
  hourlyRate: number | string | null | undefined;
  years: number | null | undefined;
  pastTitles?: string[] | null | undefined;
  industries?: string[] | null | undefined;
  tools?: string[] | null | undefined;
  education?: string[] | null | undefined;
  startAvailability?: string | null | undefined;
  highlights: string[] | null | undefined;
  availability: string[] | null | undefined;
  hours: number | string | null | undefined;
  timeZones: string[] | null | undefined;
};

const AVAIL: Record<string, string> = { full_time: "Full-time", part_time: "Part-time", project: "Project-based" };
const TZ: Record<string, string> = { us: "US", australia: "Australia", uk_eu: "UK/EU" };
export const START_LABELS: Record<string, string> = {
  immediately: "immediately",
  "1_week": "within 1 week",
  "2_weeks": "within 2 weeks",
  "1_month": "within 1 month",
};

/** "a", "a and b", "a, b and c" */
export function joinAnd(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export const firstName = (name: string | null | undefined) => (name ?? "").trim().split(/\s+/)[0] ?? "";


/** "Available to start within 2 weeks. Full-time, 40 hrs/week, US hours." */
export function availabilityLine(d: Pick<StandardProfileData, "availability" | "hours" | "timeZones" | "startAvailability">): string | null {
  const sentences: string[] = [];
  const start = d.startAvailability ? START_LABELS[d.startAvailability] : undefined;
  if (start) sentences.push(`Available to start ${start}.`);
  const parts: string[] = [];
  const av = (d.availability ?? []).map((v) => AVAIL[v] ?? v);
  if (av.length) parts.push(joinAnd(av));
  if (d.hours !== null && d.hours !== undefined && d.hours !== "") parts.push(`${d.hours} hrs/week`);
  const tz = d.timeZones ?? [];
  if (tz.includes("any")) parts.push("any hours");
  else if (tz.length) parts.push(`${joinAnd(tz.map((v) => TZ[v] ?? v))} hours`);
  if (parts.length) sentences.push(parts.join(", ") + ".");
  return sentences.length ? sentences.join(" ") : null;
}
