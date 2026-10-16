import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Calculator, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

type Job = Tables<"job_posts">;

const EMPLOYMENT = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "project", label: "Project-based" },
];
const DURATION = [
  { value: "under_1", label: "Under 1 month" },
  { value: "1_3", label: "1–3 months" },
  { value: "3_6", label: "3–6 months" },
  { value: "6_plus", label: "6+ months" },
];
const ZONES = [
  { value: "us", label: "US hours" },
  { value: "australia", label: "Australia hours" },
  { value: "uk_eu", label: "UK/EU hours" },
];
const EXPERIENCE = [
  { value: "any", label: "Any level" },
  { value: "under_1", label: "Under 1 year" },
  { value: "1_3", label: "1–3 years" },
  { value: "3_5", label: "3–5 years" },
  { value: "5_plus", label: "5+ years" },
];
const WEEKS = 4.33;
const usd = (n: number) => `$${n.toLocaleString("en-US")}`;
/** null = empty, undefined = invalid */
function parseRate(v: string): number | null | undefined {
  if (!v.trim()) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1 || n > 500 || Math.abs(Math.round(n * 100) - n * 100) > 1e-6) return undefined;
  return n;
}
function parseHours(v: string): number | null | undefined {
  if (!v.trim()) return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 60 ? n : undefined;
}
/** [min, max] strings; on edit a one-sided saved value mirrors to both. */
function initPair(min: number | null | undefined, max: number | null | undefined, fmt?: (n: number) => string): [string, string] {
  const a = min != null ? (fmt ? fmt(min) : String(min)) : "";
  const b = max != null ? (fmt ? fmt(max) : String(max)) : "";
  if (a && !b) return [a, a];
  if (!a && b) return [b, b];
  return [a, b];
}

export function JobPostForm({ userId, existing }: { userId: string; existing?: Job }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [status, setStatus] = useState(existing?.status ?? "draft");
  const [employmentType, setEmploymentType] = useState(existing?.employment_type ?? "");
  const [duration, setDuration] = useState(existing?.project_duration ?? "");
  const [zones, setZones] = useState<string[]>(existing?.time_zones ?? []);
  const [experience, setExperience] = useState(existing?.experience_level ?? "any");
  const [rateMin0, rateMax0] = initPair(existing?.rate_min, existing?.rate_max, (n) => n.toFixed(2));
  const [hoursMin0, hoursMax0] = initPair(existing?.hours_min, existing?.hours_max);
  const [rateMin, setRateMin] = useState(rateMin0);
  const [rateMax, setRateMax] = useState(rateMax0);
  const [hoursMin, setHoursMin] = useState(hoursMin0);
  const [hoursMax, setHoursMax] = useState(hoursMax0);
  const [rateRange, setRateRange] = useState(
    existing?.rate_min != null && existing?.rate_max != null && Number(existing.rate_min) !== Number(existing.rate_max),
  );
  const [hoursRange, setHoursRange] = useState(
    existing?.hours_min != null && existing?.hours_max != null && existing.hours_min !== existing.hours_max,
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const rMin = parseRate(rateMin), rMax = parseRate(rateMax);
  const hMin = parseHours(hoursMin), hMax = parseHours(hoursMax);
  const rateErr = rMin === undefined || rMax === undefined || (rMin != null && rMax != null && rMax < rMin);
  const hoursErr = hMin === undefined || hMax === undefined || (hMin != null && hMax != null && hMax < hMin);
  const estimate =
    rMin != null && rMax != null && hMin != null && hMax != null && !rateErr && !hoursErr
      ? { low: Math.round(rMin * hMin * WEEKS), high: Math.round(rMax * hMax * WEEKS) }
      : null;

  function changeType(v: string) {
    setEmploymentType(v);
    if (v !== "project") setDuration("");
  }
  function toggleRateRange(on: boolean) {
    setRateRange(on);
    setRateMax(rateMin); // keep "From"; "To" matches it in both directions
  }
  function toggleHoursRange(on: boolean) {
    setHoursRange(on);
    setHoursMax(hoursMin);
  }
  function setFixedRate(v: string) {
    setRateMin(v);
    setRateMax(v);
  }
  function setFixedHours(v: string) {
    setHoursMin(v);
    setHoursMax(v);
  }
  function toggleZone(z: string, on: boolean) {
    setZones((cur) => (on ? [...new Set([...cur, z])] : cur.filter((x) => x !== z)));
  }
  function fmt2(v: string, set: (s: string) => void) {
    const n = Number(v);
    if (v.trim() && Number.isFinite(n)) set(n.toFixed(2));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const t = title.trim();
    const d = description.trim();
    if (!t || t.length > 100) return setError("Title is required (max 100 characters).");
    if (!d || d.length > 5000) return setError("Description is required (max 5,000 characters).");
    const errs: string[] = [];
    if (rMin === undefined || rMax === undefined) errs.push("Hourly rate must be between $1 and $500 (up to 2 decimals).");
    else if (rMin != null && rMax != null && rMax < rMin) errs.push("Hourly rate \"To\" must be at least \"From\".");
    if (hMin === undefined || hMax === undefined) errs.push("Hours per week must be whole numbers between 1 and 60.");
    else if (hMin != null && hMax != null && hMax < hMin) errs.push("Hours per week \"To\" must be at least \"From\".");
    if (status === "open") {
      if (!employmentType) errs.push("Choose an employment type.");
      if (employmentType === "project" && !duration) errs.push("Choose a project timeline.");
      if (rMin == null || rMax == null) errs.push("Enter both hourly rate amounts.");
      if (hMin == null || hMax == null) errs.push("Enter both hours per week amounts.");
      if (zones.length === 0) errs.push("Pick at least one working hours option.");
    }
    if (errs.length) {
      errs.forEach((m) => toast.error(m));
      return;
    }
    setSaving(true);
    const values = {
      title: t,
      description: d,
      status,
      employment_type: employmentType || null,
      project_duration: employmentType === "project" && duration ? duration : null,
      rate_min: rMin ?? null,
      rate_max: rMax ?? null,
      hours_min: hMin ?? null,
      hours_max: hMax ?? null,
      time_zones: zones.length ? zones : null,
      experience_level: experience || null,
    };
    const { error } = existing
      ? await supabase.from("job_posts").update(values).eq("id", existing.id)
      : await supabase.from("job_posts").insert({ ...values, owner_id: userId });
    setSaving(false);
    if (error) return setError(error.message);
    await qc.invalidateQueries({ queryKey: ["job-posts", userId] });
    await qc.invalidateQueries({ queryKey: ["job-post", existing?.id] });
    toast.success(existing ? "Job post updated" : "Job post created");
    navigate({ to: "/client/jobs" });
  }

  const submitLabel = status === "draft" ? "Save draft" : status === "open" ? "Post job" : "Save";

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      <div className="space-y-5 rounded-2xl border bg-card p-6">
        <div className="space-y-1.5">
          <Label htmlFor="title">Job title</Label>
          <Input id="title" required maxLength={100} placeholder="e.g. Customer Support Specialist" value={title} onChange={(e) => setTitle(e.target.value)} />
          <p className="text-xs text-muted-foreground">{title.length}/100</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="desc">Description</Label>
          <Textarea id="desc" required maxLength={5000} rows={12} placeholder="Responsibilities, requirements, schedule…" value={description} onChange={(e) => setDescription(e.target.value)} />
          <p className="text-xs text-muted-foreground">{description.length.toLocaleString()}/5,000</p>
        </div>
        <div className="space-y-2">
          <Label>Employment type</Label>
          <RadioGroup value={employmentType} onValueChange={changeType} className="flex flex-wrap gap-4">
            {EMPLOYMENT.map((o) => (
              <label key={o.value} className="flex items-center gap-2 text-sm">
                <RadioGroupItem value={o.value} /> {o.label}
              </label>
            ))}
          </RadioGroup>
        </div>
        {employmentType === "project" && (
          <div className="space-y-1.5">
            <Label>Project timeline</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Select timeline" /></SelectTrigger>
              <SelectContent>
                {DURATION.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Hourly rate (USD)</Label>
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            {([["rate-from", "From", rateMin, setRateMin], ["rate-to", "To", rateMax, setRateMax]] as const).map(([id, lbl, v, set]) => (
              <div key={id} className="space-y-1">
                <Label htmlFor={id} className="text-xs font-normal text-muted-foreground">{lbl}</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input id={id} type="number" inputMode="decimal" min={1} max={500} step="0.01" className="pl-7" placeholder="0.00" aria-invalid={rateErr} value={v} onChange={(e) => set(e.target.value)} onBlur={() => fmt2(v, set)} />
                </div>
              </div>
            ))}
          </div>
          <p className={`text-xs ${rateErr ? "text-destructive" : "text-muted-foreground"}`}>Between $1 and $500. Use the same amount for a fixed rate.</p>
        </div>
        <div className="space-y-1.5">
          <Label>Hours per week</Label>
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            {([["hours-from", "From", hoursMin, setHoursMin], ["hours-to", "To", hoursMax, setHoursMax]] as const).map(([id, lbl, v, set]) => (
              <div key={id} className="space-y-1">
                <Label htmlFor={id} className="text-xs font-normal text-muted-foreground">{lbl}</Label>
                <Input id={id} type="number" inputMode="numeric" min={1} max={60} step={1} aria-invalid={hoursErr} value={v} onChange={(e) => set(e.target.value)} />
              </div>
            ))}
          </div>
          <p className={`text-xs ${hoursErr ? "text-destructive" : "text-muted-foreground"}`}>Between 1 and 60. Use the same number for fixed hours.</p>
        </div>
        {estimate && (
          <div className="flex items-start gap-3 rounded-xl bg-muted p-4" aria-live="polite">
            <Calculator className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm">
                Estimated cost:{" "}
                <span className="font-semibold">
                  {estimate.low === estimate.high ? usd(estimate.low) : `${usd(estimate.low)} – ${usd(estimate.high)}`}
                </span>{" "}
                per month
              </p>
              <p className="text-xs text-muted-foreground">Based on 4.33 weeks per month. Estimate only.</p>
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label>Working hours</Label>
          <div className="flex flex-wrap gap-4">
            {ZONES.map((o) => (
              <label key={o.value} className="flex items-center gap-2 text-sm">
                <Checkbox checked={zones.includes(o.value)} onCheckedChange={(c) => toggleZone(o.value, c === true)} /> {o.label}
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Experience level</Label>
          <Select value={experience} onValueChange={setExperience}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {EXPERIENCE.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : submitLabel}</Button>
        <Button asChild variant="ghost"><Link to="/client/jobs">Cancel</Link></Button>
      </div>
      <p className="flex items-center gap-2 text-sm text-muted-foreground/70">
        <Sparkles className="h-4 w-4" /> AI-assisted job creation available on paid plans.
      </p>
    </form>
  );
}
