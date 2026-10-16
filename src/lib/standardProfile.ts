export type StandardProfileData = {
  name: string | null | undefined;
  roleTitle: string;
  hourlyRate: number | string | null | undefined;
  years: number | null | undefined;
  field: string | null | undefined;
  highlights: string[] | null | undefined;
  availability: string[] | null | undefined;
  hours: number | string | null | undefined;
  timeZones: string[] | null | undefined;
};

const AVAIL: Record<string, string> = { full_time: "full-time", part_time: "part-time", project: "project-based" };
const TZ: Record<string, string> = { us: "US", australia: "Australia", uk_eu: "UK/EU" };

/** "a", "a and b", "a, b and c" */
export function joinAnd(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export const firstName = (name: string | null | undefined) => (name ?? "").trim().split(/\s+/)[0] ?? "";

export function availabilityBullet(d: Pick<StandardProfileData, "availability" | "hours" | "timeZones">): string | null {
  const parts: string[] = [];
  const av = (d.availability ?? []).map((v) => AVAIL[v] ?? v);
  if (av.length) parts.push(`Available ${joinAnd(av)}`);
  if (d.hours !== null && d.hours !== undefined && d.hours !== "") parts.push(`${d.hours} hrs/week`);
  const tz = d.timeZones ?? [];
  if (tz.includes("any")) parts.push("any hours");
  else if (tz.length) parts.push(`${joinAnd(tz.map((v) => TZ[v] ?? v))} hours`);
  if (!parts.length) return null;
  const s = parts.join(", ");
  return av.length ? s : s.charAt(0).toUpperCase() + s.slice(1);
}
