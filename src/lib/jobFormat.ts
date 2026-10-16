export const EMPLOYMENT_LABEL: Record<string, string> = { full_time: "Full-time", part_time: "Part-time", project: "Project-based" };
export const DURATION_LABEL: Record<string, string> = { under_1: "Under 1 month", "1_3": "1–3 months", "3_6": "3–6 months", "6_plus": "6+ months" };
export const ZONE_LABEL: Record<string, string> = { us: "US hours", australia: "Australia hours", uk_eu: "UK/EU hours" };
export const EXPERIENCE_LABEL: Record<string, string> = { any: "Any level", under_1: "Under 1 year", "1_3": "1–3 years", "3_5": "3–5 years", "5_plus": "5+ years" };

const WEEKS = 4.33;
const money = (n: number) => Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });
type N = number | string | null | undefined;
const num = (v: N) => (v == null || v === "" ? null : Number(v));

/** "$8/hr" or "$6–$10/hr"; null if no rate. */
export function formatRate(min: N, max: N): string | null {
  const a = num(min) ?? num(max), b = num(max) ?? num(min);
  if (a == null || b == null) return null;
  return a === b ? `$${money(a)}/hr` : `$${money(a)}–$${money(b)}/hr`;
}

/** "40 hrs/week" or "20–30 hrs/week"; null if no hours. */
export function formatHours(min: N, max: N): string | null {
  const a = num(min) ?? num(max), b = num(max) ?? num(min);
  if (a == null || b == null) return null;
  return a === b ? `${a} hrs/week` : `${a}–${b} hrs/week`;
}

/** Monthly estimate text, same formula as the client job form. */
export function formatMonthly(rMin: N, rMax: N, hMin: N, hMax: N): string | null {
  const v = [num(rMin), num(rMax), num(hMin), num(hMax)];
  if (v.some((x) => x == null)) return null;
  const [a, b, c, d] = v as [number, number, number, number];
  const low = Math.round(a * c * WEEKS), high = Math.round(b * d * WEEKS);
  const usd = (n: number) => `$${n.toLocaleString("en-US")}`;
  return low === high ? usd(low) : `${usd(low)} – ${usd(high)}`;
}

/** "Posted today", "Posted 1 day ago", "Posted 3 days ago". */
export function postedAgo(iso: string, now = new Date()): string {
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Posted today";
  return `Posted ${days} day${days === 1 ? "" : "s"} ago`;
}
