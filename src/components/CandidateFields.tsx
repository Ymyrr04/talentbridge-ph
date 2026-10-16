import { useEffect, useState, type KeyboardEvent } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

export { SKILL_OPTIONS } from "@/lib/skills";
import { SKILL_OPTIONS } from "@/lib/skills";
export const MAX_SKILLS = 15;
export const HIGHLIGHT_MAX = 160;
export const HIGHLIGHT_COUNT = 8;
export const MAX_PAST_TITLES = 6;
export const PAST_TITLE_MAX = 80;
export const MAX_INDUSTRIES = 10;
export const INDUSTRY_MAX = 40;
export const MAX_TOOLS = 40;
export const TOOL_MAX = 40;
export const MAX_EDUCATION = 8;
export const EDUCATION_MAX = 120;
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
export const START_OPTIONS = [
  { value: "immediately", label: "Immediately" },
  { value: "1_week", label: "Within 1 week" },
  { value: "2_weeks", label: "Within 2 weeks" },
  { value: "1_month", label: "Within 1 month" },
];

export type CandidateValues = {
  skills: string[];
  years: string;
  pastTitles: string[];
  industries: string[];
  highlights: string[];
  tools: string[];
  education: string[];
  availability: string[];
  hours: string;
  timeZones: string[];
  startAvailability: string;
};

/** Returns a list of missing items required to publish. */
export function publishErrors(v: CandidateValues): string[] {
  const errs: string[] = [];
  if (v.years === "") errs.push("years of experience");
  if (v.pastTitles.length === 0) errs.push("at least 1 past job title");
  if (v.industries.length === 0) errs.push("at least 1 industry");
  if (v.highlights.filter((h) => h.trim()).length < 3) errs.push("at least 3 highlights");
  if (!v.hours) errs.push("hours per week");
  if (!v.startAvailability) errs.push("when you can start");
  return errs;
}

/** Generic chip-style tag input: type and press Enter or comma to add. */
function TagInput({
  id, label, placeholder, value, onChange, max, maxLen, helper, suggestions,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string[];
  onChange: (v: string[]) => void;
  max: number;
  maxLen: number;
  helper?: string;
  suggestions?: string[];
}) {
  const [text, setText] = useState("");
  const full = value.length >= max;

  const add = (raw: string) => {
    const t = raw.trim().replace(/\s+/g, " ");
    if (!t) return;
    if (value.some((x) => x.toLowerCase() === t.toLowerCase())) { setText(""); return; }
    if (t.length > maxLen) { toast.error(`Each item can be up to ${maxLen} characters.`); return; }
    if (value.length >= max) { toast.error(`You can add up to ${max} items.`); return; }
    onChange([...value, t]);
    setText("");
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(text); }
    else if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1));
  };
  const open = (suggestions ?? []).filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-xs text-muted-foreground">{value.length}/{max}</span>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              {t}
              <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((x) => x !== t))} className="rounded-full hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Input
          id={id}
          value={text}
          disabled={full}
          maxLength={maxLen + 5}
          placeholder={full ? "Limit reached" : placeholder}
          onChange={(e) => {
            const v = e.target.value;
            if (v.includes(",")) {
              const parts = v.split(",");
              for (const p of parts.slice(0, -1)) add(p);
              setText(parts[parts.length - 1] ?? "");
            } else setText(v);
          }}
          onKeyDown={onKey}
        />
        {open.length > 0 && text.trim() && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
            {open.map((s) => (
              <button key={s} type="button" onMouseDown={(e) => { e.preventDefault(); add(s); }}
                className="block w-full px-3 py-2 text-left text-sm text-popover-foreground hover:bg-accent">{s}</button>
            ))}
          </div>
        )}
      </div>
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}

export function CandidateFields({ value, onChange }: { value: CandidateValues; onChange: (v: CandidateValues) => void }) {
  const [query, setQuery] = useState("");
  const set = <K extends keyof CandidateValues>(k: K, v: CandidateValues[K]) => onChange({ ...value, [k]: v });
  const [visible, setVisible] = useState(() => Math.max(1, (value.highlights ?? []).filter((h) => h.trim()).length));
  const filled = (value.highlights ?? []).filter((h) => h.trim()).length;
  const boxes = () => Array.from({ length: visible }, (_, j) => value.highlights[j] ?? "");
  // Suggestions and saved profiles can arrive with more highlights than are shown.
  useEffect(() => {
    setVisible((v) => Math.max(v, filled || 1));
  }, [filled]);
  const addHighlight = () => {
    if (visible >= HIGHLIGHT_COUNT) return;
    set("highlights", [...boxes(), ""]);
    setVisible((v) => Math.min(HIGHLIGHT_COUNT, v + 1));
  };
  const removeHighlight = (i: number) => {
    set("highlights", boxes().filter((_, j) => j !== i));
    setVisible((v) => Math.max(1, v - 1));
  };
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

  const [toolQuery, setToolQuery] = useState("");
  const { data: toolMatches = [] } = useQuery({
    queryKey: ["suggest-tools", toolQuery.trim().toLowerCase()],
    enabled: toolQuery.trim().length > 0,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("suggest_tools", { _q: toolQuery.trim() });
      if (error) throw error;
      return (data ?? []).map((r) => r.name);
    },
  });

  return (
    <>
      <div className="max-w-40 space-y-1.5">
        <Label htmlFor="years">Years of experience</Label>
        <Input id="years" type="number" min={0} max={50} step={1} value={value.years} onChange={(e) => set("years", e.target.value)} />
      </div>

      <TagInput
        id="past-titles"
        label="Past job titles"
        placeholder="e.g. Virtual Assistant — press Enter to add"
        value={value.pastTitles}
        onChange={(v) => set("pastTitles", v)}
        max={MAX_PAST_TITLES}
        maxLen={PAST_TITLE_MAX}
        helper="Roles you've held before, most recent first."
      />

      <TagInput
        id="industries"
        label="Industry expertise"
        placeholder="Healthcare"
        value={value.industries}
        onChange={(v) => set("industries", v)}
        max={MAX_INDUSTRIES}
        maxLen={INDUSTRY_MAX}
      />

      <div className="space-y-2">
        <Label>Highlights <span className="font-normal text-muted-foreground">({filled}/{HIGHLIGHT_COUNT})</span></Label>
        {Array.from({ length: visible }, (_, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-2">
              <Input
                aria-label={`Highlight ${i + 1}`}
                maxLength={HIGHLIGHT_MAX}
                value={value.highlights[i] ?? ""}
                onChange={(e) => {
                  const next = Array.from({ length: visible }, (_, j) => value.highlights[j] ?? "");
                  next[i] = e.target.value;
                  set("highlights", next);
                }}
              />
              {visible > 1 && (
                <button
                  type="button"
                  aria-label={`Remove highlight ${i + 1}`}
                  onClick={() => removeHighlight(i)}
                  className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-right text-xs text-muted-foreground">{(value.highlights[i] ?? "").length}/{HIGHLIGHT_MAX}</p>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addHighlight} disabled={visible >= HIGHLIGHT_COUNT}>
          <Plus className="mr-1 h-4 w-4" /> Add highlight
        </Button>
        <p className="text-xs text-muted-foreground">One achievement or core skill each. Use real numbers from your CV where you have them.</p>
      </div>

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
        {!full && query.trim() && (
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

      <TagInput
        id="tools"
        label="Software & tools"
        placeholder="Type a tool and press Enter"
        value={value.tools}
        onChange={(v) => set("tools", v)}
        max={MAX_TOOLS}
        maxLen={TOOL_MAX}
        suggestions={toolMatches}
      />
      {/* keep toolQuery in sync via a hidden input pattern: reuse TagInput text by lifting state */}
      <input type="hidden" value={toolQuery} onChange={() => setToolQuery(toolQuery)} />

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="education">Education & certifications</Label>
          <span className="text-xs text-muted-foreground">{value.education.length}/{MAX_EDUCATION}</span>
        </div>
        <Textarea
          id="education"
          rows={3}
          placeholder={"One per line, e.g.\nBS Nursing, University of the Philippines\nGoogle Data Analytics Certificate"}
          value={value.education.join("\n")}
          onChange={(e) => {
            const lines = e.target.value.split("\n").slice(0, MAX_EDUCATION).map((l) => l.slice(0, EDUCATION_MAX));
            set("education", lines);
          }}
        />
        <p className="text-xs text-muted-foreground">One line per item, up to {MAX_EDUCATION}.</p>
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
        <div className="grid gap-4 pt-1 sm:grid-cols-2">
          <div className="max-w-40 space-y-1.5">
            <Label htmlFor="hours">Hours per week</Label>
            <Input id="hours" type="number" min={1} max={60} step={1} value={value.hours} onChange={(e) => set("hours", e.target.value)} />
          </div>
          <div className="max-w-56 space-y-1.5">
            <Label htmlFor="start">Can start</Label>
            <select
              id="start"
              value={value.startAvailability}
              onChange={(e) => set("startAvailability", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select…</option>
              {START_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
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
