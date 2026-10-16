import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { FileText, Sparkles } from "lucide-react";
import { ProfileSuggestionsDialog } from "@/components/ProfileSuggestionsDialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { myAccountName, myCv } from "@/lib/applicant";
import { StandardProfile } from "@/components/StandardProfile";
import { CandidateFields, publishErrors, type CandidateValues } from "@/components/CandidateFields";
import { IntroVideoField, type VideoChange } from "@/components/IntroVideoField";
import { removeVideo, uploadVideo } from "@/lib/introVideo";
import { VoiceIntroField, type VoiceChange } from "@/components/VoiceIntroField";
import { removeVoice, uploadVoice } from "@/lib/voiceIntro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Profile = Tables<"applicant_profiles">;

export function ApplicantProfileForm({ userId, existing }: { userId: string; existing?: Profile }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [roleTitle, setRoleTitle] = useState(existing?.role_title ?? "");
  const [rate, setRate] = useState(existing ? String(existing.hourly_rate) : "");
  const { data: cv, isLoading: cvLoading } = useQuery(myCv(userId));
  const { data: accountName } = useQuery(myAccountName(userId));
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [autoAsked, setAutoAsked] = useState(false);
  useEffect(() => {
    if (!existing && !autoAsked && !cvLoading && cv) {
      setAutoAsked(true);
      setSuggestOpen(true);
    }
  }, [existing, autoAsked, cvLoading, cv]);
  const [status, setStatus] = useState<"draft" | "published">(existing?.status === "published" ? "published" : "draft");
  const [cand, setCand] = useState<CandidateValues>({
    skills: existing?.skills ?? [],
    years: existing?.years_experience != null ? String(existing.years_experience) : "",
    field: existing?.field ?? "",
    highlights: existing?.highlights ?? [],
    availability: existing?.availability_list ?? (existing?.availability ? [existing.availability] : []),
    hours: existing?.hours_per_week != null ? String(existing.hours_per_week) : "",
    timeZones: existing?.time_zones ?? [],
  });
  const [video, setVideo] = useState<VideoChange>({ kind: "keep" });
  const [voice, setVoice] = useState<VoiceChange>({ kind: "keep" });
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
    const years = cand.years === "" ? null : Number(cand.years);
    if (years !== null && (!Number.isInteger(years) || years < 0 || years > 50)) {
      toast.error("Years of experience must be a whole number between 0 and 50.");
      return;
    }
    const highlights = cand.highlights.map((h) => h.trim()).filter(Boolean);
    if (status === "published") {
      if (!cv) {
        toast.error("Upload your CV in Settings before publishing.");
        return;
      }
      const missing = publishErrors(cand);
      if (missing.length) {
        toast.error("To publish, please add: " + missing.join(", ") + ".");
        return;
      }
    }
    setSaving(true);
    let newVideo: string | null = null;
    let newVoice: string | null = null;
    try {
      if (voice.kind === "file") newVoice = await uploadVoice(userId, profileId, voice.blob);
      if (video.kind === "new") newVideo = await uploadVideo(userId, profileId, video.blob);
      const values = {
        role_title: title,
        hourly_rate: hourly,
        status,
        skills: cand.skills.length ? cand.skills : null,
        years_experience: years,
        field: cand.field.trim() || null,
        highlights: highlights.length ? highlights : null,
        availability_list: cand.availability.length ? cand.availability : null,
        hours_per_week: hours,
        time_zones: cand.timeZones.length ? cand.timeZones : null,
        ...(newVideo && video.kind === "new" ? { video_path: newVideo, video_duration_seconds: video.duration } : {}),
        ...(voice.kind === "file" && newVoice ? { voice_path: newVoice, voice_link: null } : {}),
        ...(voice.kind === "link" ? { voice_path: null, voice_link: voice.url } : {}),
        ...(voice.kind === "remove" ? { voice_path: null, voice_link: null } : {}),
        ...(video.kind === "remove" ? { video_path: null, video_duration_seconds: null } : {}),
      };
      const { error } = existing
        ? await supabase.from("applicant_profiles").update(values).eq("id", existing.id)
        : await supabase.from("applicant_profiles").insert({ ...values, id: profileId, owner_id: userId });
      if (error) throw error;
      if (voice.kind !== "keep" && existing?.voice_path) await removeVoice(existing.voice_path);
      if (video.kind !== "keep" && existing?.video_path) await removeVideo(existing.video_path);
      await qc.invalidateQueries({ queryKey: ["applicant-profiles", userId] });
      if (existing) await qc.invalidateQueries({ queryKey: ["applicant-profile", existing.id] });
      toast.success(existing ? "Profile updated" : "Profile created");
      navigate({ to: "/applicant/profiles" });
    } catch (err) {
      if (newVideo) await removeVideo(newVideo);
      if (newVoice) await removeVoice(newVoice);
      // Supabase returns a plain object here, not an Error, so read its fields directly.
      const e = (err ?? {}) as { message?: unknown; code?: unknown };
      const msg = typeof e.message === "string" ? e.message : "";
      const code = typeof e.code === "string" ? e.code : "";
      // A profile can only be created by an applicant account; admins may open the page but not save.
      setError(
        code === "42501" || /row-level security/i.test(msg)
          ? "This account can’t save applicant profiles — it isn’t an applicant account. Sign in as an applicant."
          : msg || "Something went wrong.",
      );
    } finally {


      setSaving(false);
    }
  }

  return (
    <>
    {!existing && !cvLoading && (
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" disabled={!cv} onClick={() => setSuggestOpen(true)}>
          <Sparkles className="h-4 w-4" /> Suggest from my CV
        </Button>
        {!cv && (
          <p className="text-sm text-muted-foreground">
            <Link to="/applicant/settings" className="text-primary hover:underline">Upload your CV in Settings</Link> to get profile suggestions.
          </p>
        )}
      </div>
    )}
    {!existing && cv && (
      <ProfileSuggestionsDialog
        open={suggestOpen}
        onOpenChange={setSuggestOpen}
        userId={userId}
        cvPath={cv.cv_path}
        accountName={accountName}
        onUse={(sg) => {
          setRoleTitle(sg.role_title);
          setCand((c) => ({
            ...c,
            years: String(sg.years_experience),
            field: sg.field,
            highlights: sg.highlights,
            skills: sg.skills,
          }));
          toast.success("Suggestion filled in. Check every line, then save.");
        }}
      />
    )}
    <div className="grid gap-6 lg:grid-cols-[minmax(0,42rem)_minmax(0,22rem)] lg:items-start">
    <form onSubmit={onSubmit} className="space-y-6">
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
          <Label>CV</Label>
          {cvLoading ? null : cv ? (
            <p className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm">
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0 truncate">Uses your CV: {cv.cv_original_filename || "CV uploaded"}</span>
              <span className="text-muted-foreground">·</span>
              <Link to="/applicant/settings" className="shrink-0 text-primary hover:underline">Manage in Settings</Link>
            </p>
          ) : (
            <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
              <Link to="/applicant/settings" className="text-primary hover:underline">Upload your CV in Settings</Link> before publishing.
            </p>
          )}
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
      <VoiceIntroField existingPath={existing?.voice_path ?? null} existingLink={existing?.voice_link ?? null} value={voice} onChange={setVoice} />

      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : existing ? "Save changes" : "Create profile"}</Button>
        <Button asChild variant="ghost"><Link to="/applicant/profiles">Cancel</Link></Button>
      </div>
    </form>
      <aside className="rounded-2xl border bg-card p-6 lg:sticky lg:top-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Preview</p>
        <StandardProfile
          data={{
            name: accountName,
            roleTitle,
            hourlyRate: rate,
            years: cand.years === "" ? null : Number(cand.years),
            field: cand.field,
            highlights: cand.highlights,
            availability: cand.availability,
            hours: cand.hours,
            timeZones: cand.timeZones,
          }}
        />
      </aside>
    </div>
    </>
  );
}
