/** Shared shape and limits for AI profile suggestions (browser + server safe). */
import { SKILL_OPTIONS } from "@/lib/skills";

export type ProfileSuggestion = {
  role_title: string;
  years_experience: number;
  past_titles: string[];
  industries: string[];
  highlights: string[];
  tools: string[];
  education: string[];
  skills: string[];
};

export const SUGGESTION_LIMIT_MESSAGE = "You've reached today's limit. Try again tomorrow.";

const clip = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max).trim() : "");
const clipList = (v: unknown, maxItems: number, maxLen: number) =>
  (Array.isArray(v) ? v : []).map((x) => clip(x, maxLen)).filter(Boolean).slice(0, maxItems);

/** Trims AI output to the app's limits and drops anything malformed. */
export function cleanSuggestions(raw: unknown): ProfileSuggestion[] {
  const list = (raw && typeof raw === "object" && Array.isArray((raw as { suggestions?: unknown }).suggestions)
    ? (raw as { suggestions: unknown[] }).suggestions
    : []) as Partial<Record<keyof ProfileSuggestion, unknown>>[];
  const out: ProfileSuggestion[] = [];
  for (const s of list) {
    if (!s || typeof s !== "object") continue;
    const role = clip(s.role_title, 80);
    if (!role || out.some((o) => o.role_title.toLowerCase() === role.toLowerCase())) continue;
    const yearsNum = Math.round(Number(s.years_experience));
    const skills = (Array.isArray(s.skills) ? s.skills : [])
      .map((k) => SKILL_OPTIONS.find((o) => typeof k === "string" && o.toLowerCase() === k.trim().toLowerCase()))
      .filter((k): k is string => !!k)
      .filter((k, i, a) => a.indexOf(k) === i)
      .slice(0, 15);
    out.push({
      role_title: role,
      years_experience: Number.isFinite(yearsNum) ? Math.min(50, Math.max(0, yearsNum)) : 0,
      past_titles: clipList(s.past_titles, 6, 80),
      industries: clipList(s.industries, 10, 40),
      highlights: clipList(s.highlights, 8, 160),
      tools: clipList(s.tools, 40, 40),
      education: clipList(s.education, 8, 120),
      skills,
    });
    if (out.length === 3) break;
  }
  return out;
}
