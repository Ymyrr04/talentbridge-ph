import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function changeType(v: string) {
    setEmploymentType(v);
    if (v !== "project") setDuration("");
  }
  function toggleZone(z: string, on: boolean) {
    setZones((cur) => (on ? [...new Set([...cur, z])] : cur.filter((x) => x !== z)));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const t = title.trim();
    const d = description.trim();
    if (!t || t.length > 100) return setError("Title is required (max 100 characters).");
    if (!d || d.length > 5000) return setError("Description is required (max 5,000 characters).");
    if (status === "open") {
      const errs: string[] = [];
      if (!employmentType) errs.push("Choose an employment type.");
      if (employmentType === "project" && !duration) errs.push("Choose a project timeline.");
      if (zones.length === 0) errs.push("Pick at least one working hours option.");
      if (errs.length) {
        errs.forEach((m) => toast.error(m));
        return;
      }
    }
    setSaving(true);
    const values = {
      title: t,
      description: d,
      status,
      employment_type: employmentType || null,
      project_duration: employmentType === "project" && duration ? duration : null,
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
