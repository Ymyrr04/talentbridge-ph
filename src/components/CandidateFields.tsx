import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export const SKILL_OPTIONS = [
  "Virtual Assistance", "Customer Support", "Data Entry", "Bookkeeping", "QuickBooks", "Xero", "Excel",
  "Google Workspace", "Social Media Management", "Canva", "Graphic Design", "Video Editing", "Copywriting",
  "SEO", "Email Marketing", "HubSpot", "Shopify", "WordPress", "Web Development", "Python", "JavaScript",
  "AI Tools", "Project Management", "Lead Generation", "Cold Calling", "Recruitment",
];
export const MAX_SKILLS = 15;
export const SUMMARY_MAX = 500;
export const EXPERIENCE = [
  { value: "under_1", label: "Under 1 year" },
  { value: "1_3", label: "1–3 years" },
  { value: "3_5", label: "3–5 years" },
  { value: "5_plus", label: "5+ years" },
];
export const AVAILABILITY = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "project", label: "Project-based" },
];
export const ANY_HOURS = { value: "any", label: "Any hours (flexible)" };
export const TIME_ZONES = [
  { value: "us", label: "US hours" },
  { value: "australia", label: "Australia hours" },
  { value: "uk_eu", label: "UK/EU hours" },
];
export const ENGLISH = [
  { value: "conversational", label: "Conversational" },
  { value: "fluent", label: "Fluent" },
  { value: "near_native", label: "Near-native" },
];

export type CandidateValues = {
  skills: string[];
  experience: string;
  summary: string;
  availability: string[];
  hours: string;
  timeZones: string[];
};

/** Returns a list of missing items required to publish. */
export function publishErrors(v: CandidateValues): string[] {
  const errs: string[] = [];
  if (v.skills.length === 0) errs.push("at least 1 skill");
  if (!v.experience) errs.push("experience");
  if (!v.summary.trim()) errs.push("summary");
  if (v.availability.length === 0) errs.push("at least 1 availability");
  if (!v.hours) errs.push("hours per week");
  if (v.timeZones.length === 0) errs.push("at least 1 working-hours option");
  return errs;
}

const selectCls =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function CandidateFields({ value, onChange }: { value: CandidateValues; onChange: (v: CandidateValues) => void }) {
  const [query, setQuery] = useState("");
  const set = <K extends keyof CandidateValues>(k: K, v: CandidateValues[K]) => onChange({ ...value, [k]: v });
  const [catalog, setCatalog] = useState<string[]>([]);
  useEffect(() => {
    const q = query.trim();
    if (!q) { setCatalog([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const { data } = await supabase.rpc("suggest_tools", { _q: q });
        if (!cancelled) setCatalog(((data ?? []) as { name: string }[]).map((r) => r.name));
      } catch { /* suggestions are optional */ }
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query]);
  const has = (s: string) => value.skills.some((x) => x.toLowerCase() === s.toLowerCase());
  const local = SKILL_OPTIONS.filter((s) => s.toLowerCase().includes(query.trim().toLowerCase()));
  const matches = [...local, ...catalog.filter((c) => !local.some((l) => l.toLowerCase() === c.toLowerCase()))]
    .filter((s) => !has(s));
  const full = value.skills.length >= MAX_SKILLS;

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="skill-search">Skills <span className="font-normal text-muted-foreground">(up to {MAX_SKILLS})</span></Label>
        {value.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.skills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {s}
                <button type="button" aria-label={`Remove ${s}`} onClick={() => set("skills", value.skills.filter((x) => x !== s))}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <Input id="skill-search" placeholder={full ? "Skill limit reached" : "Search skills…"} disabled={full} value={query} onChange={(e) => setQuery(e.target.value)} />
        {!full && (
          <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto rounded-md border p-2">
            {matches.length === 0 ? (
              <p className="text-xs text-muted-foreground">No matching skills.</p>
            ) : (
              matches.map((s) => (
                <button key={s} type="button" onClick={() => { set("skills", [...value.skills, s]); setQuery(""); }}
                  className="rounded-full border px-3 py-1 text-xs transition-colors hover:bg-muted">
                  + {s}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="experience">Experience</Label>
        <select id="experience" className={selectCls} value={value.experience} onChange={(e) => set("experience", e.target.value)}>
          <option value="">Select…</option>
          {EXPERIENCE.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="summary">Summary</Label>
        <Textarea id="summary" rows={5} maxLength={SUMMARY_MAX} value={value.summary} onChange={(e) => set("summary", e.target.value)} placeholder="A short overview of your experience and strengths." />
        <p className="text-xs text-muted-foreground">{value.summary.length}/{SUMMARY_MAX}</p>
      </div>

      <div className="space-y-2">
        <Label>Availability</Label>
        <div className="flex flex-wrap gap-4">
          {AVAILABILITY.map((o) => (
            <label key={o.value} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={value.availability.includes(o.value)}
                onCheckedChange={(c) =>
                  set("availability", c ? [...value.availability, o.value] : value.availability.filter((x) => x !== o.value))
                }
              />
              {o.label}
            </label>
          ))}
        </div>
        <div className="max-w-40 space-y-1.5 pt-1">
          <Label htmlFor="hours">Hours per week</Label>
          <Input id="hours" type="number" min={1} max={60} step={1} value={value.hours} onChange={(e) => set("hours", e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Can work for clients in</Label>
        <div className="flex flex-wrap gap-4">
          {[ANY_HOURS, ...TIME_ZONES].map((o) => (
            <label key={o.value} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={value.timeZones.includes(o.value)}
                onCheckedChange={(c) =>
                  set(
                    "timeZones",
                    !c
                      ? value.timeZones.filter((x) => x !== o.value)
                      : o.value === "any"
                        ? ["any"]
                        : [...value.timeZones.filter((x) => x !== "any"), o.value],
                  )
                }
              />
              {o.label}
            </label>
          ))}
        </div>
      </div>

    </>
  );
}

/** Labels for a saved availability list, joined with ", ". */
export function availabilityLabel(list: string[] | null | undefined): string {
  return (list ?? []).map((v) => AVAILABILITY.find((o) => o.value === v)?.label ?? v).join(", ");
}
