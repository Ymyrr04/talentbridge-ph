/** Shared shape and limits for AI profile suggestions (browser + server safe). */
import { SKILL_OPTIONS } from "@/lib/skills";

export type ProfileSuggestion = {
  role_title: string;
  years_experience: number;
  field: string;
  highlights: string[];
  skills: string[];
};

export const SUGGESTION_LIMIT_MESSAGE = "You've reached today's limit. Try again tomorrow.";

const clip = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max).trim() : "");

/** Trims AI output to the app's limits and drops anything malformed. */
export function cleanSuggestions(raw: unknown): ProfileSuggestion[] {
  const list = (raw && typeof raw === "object" && Array.isArray((raw as { suggestions?: unknown }).suggestions)
    ? (raw as { suggestions: unknown[] }).suggestions
    : []) as Partial<Record<"role_title" | "years_experience" | "field" | "highlights" | "skills", unknown>>[];
  const out: ProfileSuggestion[] = [];
  for (const s of list) {
    if (!s || typeof s !== "object") continue;
    const role = clip(s.role_title, 80);
    if (!role || out.some((o) => o.role_title.toLowerCase() === role.toLowerCase())) continue;
    const yearsNum = Math.round(Number(s.years_experience));
    const highlights = (Array.isArray(s.highlights) ? s.highlights : []).map((h) => clip(h, 160)).filter(Boolean).slice(0, 8);
    const skills = (Array.isArray(s.skills) ? s.skills : [])
      .map((k) => SKILL_OPTIONS.find((o) => typeof k === "string" && o.toLowerCase() === k.trim().toLowerCase()))
      .filter((k): k is string => !!k)
      .filter((k, i, a) => a.indexOf(k) === i)
      .slice(0, 15);
    out.push({
      role_title: role,
      years_experience: Number.isFinite(yearsNum) ? Math.min(50, Math.max(0, yearsNum)) : 0,
      field: clip(s.field, 60),
      highlights,
      skills,
    });
    if (out.length === 3) break;
  }
  return out;
}
