import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { removeCv, uploadCv, validateCv } from "@/lib/applicant";
import { CandidateFields, publishErrors, SUMMARY_MAX, type CandidateValues } from "@/components/CandidateFields";
import { IntroVideoField, type VideoChange } from "@/components/IntroVideoField";
import { removeVideo, uploadVideo } from "@/lib/introVideo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Profile = Tables<"applicant_profiles">;

export function ApplicantProfileForm({ userId, existing }: { userId: string; existing?: Profile }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [roleTitle, setRoleTitle] = useState(existing?.role_title ?? "");
  const [rate, setRate] = useState(existing ? String(existing.hourly_rate) : "");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"draft" | "published">(existing?.status === "published" ? "published" : "draft");
  const [cand, setCand] = useState<CandidateValues>({
    skills: existing?.skills ?? [],
    experience: existing?.experience_level ?? "",
    summary: existing?.summary ?? "",
    availability: existing?.availability_list ?? (existing?.availability ? [existing.availability] : []),
    hours: existing?.hours_per_week != null ? String(existing.hours_per_week) : "",
    timeZones: existing?.time_zones ?? [],
  });
  const [video, setVideo] = useState<VideoChange>({ kind: "keep" });
  const [profileId] = useState(() => existing?.id ?? crypto.randomUUID());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const title = roleTitle.trim();
    const hourly = Number(rate);
    if (!title || title.length > 80) return setError("Role title is required (max 80 characters).");
    if (!Number.isFinite(hourly) || hourly < 1 || hourly > 500) return setError("Hourly rate must be between 1 and 500 USD.");
    const hours = cand.hours ? Number(cand.hours) : null;
    if (hours !== null && (!Number.isInteger(hours) || hours < 1 || hours > 60)) {
      toast.error("Hours per week must be a whole number between 1 and 60.");
      return;
    }
    if (cand.summary.length > SUMMARY_MAX) {
      toast.error(`Summary must be ${SUMMARY_MAX} characters or fewer.`);
      return;
    }
    if (status === "published") {
      const missing = publishErrors(cand);
      if (missing.length) {
        toast.error("To publish, please add: " + missing.join(", ") + ".");
        return;
      }
    }
    if (file) {
      const v = validateCv(file);
      if (v) return setError(v);
    }
    setSaving(true);
    let newPath: string | null = null;
    let newVideo: string | null = null;
    try {
      if (file) newPath = await uploadCv(userId, file);
      if (video.kind === "new") newVideo = await uploadVideo(userId, profileId, video.blob);
      const values = {
        role_title: title,
        hourly_rate: hourly,
        status,
        skills: cand.skills.length ? cand.skills : null,
        experience_level: cand.experience || null,
        summary: cand.summary.trim() || null,
        availability_list: cand.availability.length ? cand.availability : null,
        hours_per_week: hours,
        time_zones: cand.timeZones.length ? cand.timeZones : null,
        ...(newVideo && video.kind === "new" ? { video_path: newVideo, video_duration_seconds: video.duration } : {}),
        ...(video.kind === "remove" ? { video_path: null, video_duration_seconds: null } : {}),
        ...(newPath && file ? { cv_path: newPath, cv_original_filename: file.name } : {}),
      };
      const { error } = existing
        ? await supabase.from("applicant_profiles").update(values).eq("id", existing.id)
        : await supabase.from("applicant_profiles").insert({ ...values, id: profileId, owner_id: userId });
      if (error) throw error;
      if (newPath && existing?.cv_path) await removeCv(existing.cv_path);
      if (video.kind !== "keep" && existing?.video_path) await removeVideo(existing.video_path);
      await qc.invalidateQueries({ queryKey: ["applicant-profiles", userId] });
      if (existing) await qc.invalidateQueries({ queryKey: ["applicant-profile", existing.id] });
      toast.success(existing ? "Profile updated" : "Profile created");
      navigate({ to: "/applicant/profiles" });
    } catch (err) {
      if (newPath) await removeCv(newPath);
      if (newVideo) await removeVideo(newVideo);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const currentCv = existing?.cv_path ? existing.cv_original_filename?.trim() || "CV uploaded" : null;

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <div className="space-y-5 rounded-2xl border bg-card p-6">
        <div className="space-y-1.5">
          <Label htmlFor="title">Role title</Label>
          <Input id="title" required maxLength={80} placeholder="e.g. Senior Virtual Assistant" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} />
          <p className="text-xs text-muted-foreground">{roleTitle.length}/80</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rate">Expected hourly rate (USD)</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
            <Input id="rate" type="number" required min={1} max={500} step="0.01" className="pl-7" value={rate} onChange={(e) => setRate(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">Between $1 and $500 per hour.</p>
        </div>
        <CandidateFields value={cand} onChange={setCand} />
        <div className="space-y-1.5">
          <Label htmlFor="cv">CV <span className="font-normal text-muted-foreground">(PDF or DOCX, max 5 MB)</span></Label>
          <label htmlFor="cv" className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed px-4 py-4 text-sm transition-colors hover:bg-muted">
            {file ? <FileText className="h-5 w-5 text-primary" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
            <span className="truncate">
              {file ? file.name : currentCv ? `Current file: ${currentCv} — click to replace` : "Click to choose a file"}
            </span>
          </label>
          <input
            id="cv"
            type="file"
            className="sr-only"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (f) {
                const v = validateCv(f);
                if (v) {
                  setError(v);
                  e.target.value = "";
                  return;
                }
              }
              setError(null);
              setFile(f);
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as "draft" | "published")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <p className="text-xs text-muted-foreground">Only published profiles can be seen by employers.</p>
        </div>
      </div>

      <IntroVideoField existingPath={existing?.video_path ?? null} value={video} onChange={setVideo} />

      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : existing ? "Save changes" : "Create profile"}</Button>
        <Button asChild variant="ghost"><Link to="/applicant/profiles">Cancel</Link></Button>
      </div>
    </form>
  );
}
