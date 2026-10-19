import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Pencil, Plus, Trash2, UserRoundPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { removeVideo } from "@/lib/introVideo";
import { removeVoice } from "@/lib/voiceIntro";
import { MAX_PROFILES, myAccountName, myApplicantProfiles, myCv } from "@/lib/applicant";
import { StandardProfile } from "@/components/StandardProfile";
import { EmptyState, PageHeader } from "@/components/AppShell";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { publishErrors } from "@/components/CandidateFields";

export const Route = createFileRoute("/applicant/profiles/")({
  head: () => ({ meta: [{ title: "Your Profiles — TalentHub" }, { name: "description", content: "Your Profiles for your TalentHub remote talent marketplace account." }, { property: "og:title", content: "Your Profiles — TalentHub" }, { property: "og:description", content: "Your Profiles for your TalentHub remote talent marketplace account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const key = myApplicantProfiles(user.id).queryKey;
  const { data: profiles = [], isLoading } = useQuery(myApplicantProfiles(user.id));
  const { data: cv } = useQuery(myCv(user.id));
  const { data: accountName } = useQuery(myAccountName(user.id));
  const full = profiles.length >= MAX_PROFILES;

  const toggle = useMutation({
    mutationFn: async ({ id, publish }: { id: string; publish: boolean }) => {
      if (publish) {
        const profile = profiles.find((p) => p.id === id);
        if (!profile) throw new Error("Profile not found.");
        if (!cv) throw new Error("Upload your CV in Settings before publishing.");
        const missing = publishErrors({
          years: profile.years_experience == null ? "" : String(profile.years_experience),
          pastTitles: profile.past_titles ?? [], industries: profile.industries ?? [],
          highlights: profile.highlights ?? [], tools: profile.tools ?? [], education: profile.education ?? [],
          skills: profile.skills ?? [], availability: profile.availability_list ?? [],
          hours: profile.hours_per_week == null ? "" : String(profile.hours_per_week),
          timeZones: profile.time_zones ?? [], startAvailability: profile.start_availability ?? "",
        });
        if (missing.length) throw new Error("To publish, please add: " + missing.join(", ") + ".");
      }
      const { error } = await supabase.from("applicant_profiles").update({ status: publish ? "published" : "draft" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: key });
      await qc.invalidateQueries({ queryKey: ["my-published-profiles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { data: row } = await supabase.from("applicant_profiles").select("video_path, voice_path").eq("id", id).maybeSingle();
      const { error } = await supabase.from("applicant_profiles").delete().eq("id", id);
      if (error) throw error;
      await removeVideo(row?.video_path);
      await removeVoice(row?.voice_path);
    },
    onSuccess: () => {
      toast.success("Profile deleted");
      qc.invalidateQueries({ queryKey: key });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function openCv(path: string) {
    const { data, error } = await supabase.storage.from("cv-uploads").createSignedUrl(path, 60);
    if (error) {
      toast.error(error.message);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  const createBtn = full ? (
    <Button disabled><Plus className="h-4 w-4" /> Create a Profile</Button>
  ) : (
    <Button asChild><Link to="/applicant/profiles/new"><Plus className="h-4 w-4" /> Create a Profile</Link></Button>
  );

  return (
    <>
      <PageHeader
        title="Your Profiles"
        subtitle={
          full ? <span className="font-medium text-accent-foreground">You’ve reached the 3 profile limit.</span> : `${profiles.length} of ${MAX_PROFILES} used`
        }
        action={profiles.length > 0 ? createBtn : undefined}
      />
      {isLoading ? null : profiles.length === 0 ? (
        <EmptyState icon={<UserRoundPlus className="h-6 w-6" />} title="No profiles yet" body="Create your first profile to get started." action={createBtn} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => {
            const published = p.status === "published";
            return (
              <div key={p.id} className="flex flex-col rounded-2xl border bg-card p-5">
                <div className="flex justify-end">
                  <Badge variant={published ? "default" : "secondary"}>{published ? "Published" : "Draft"}</Badge>
                </div>
                <StandardProfile
                  className="mt-2"
                  data={{
                    name: accountName,
                    roleTitle: p.role_title,
                    hourlyRate: p.hourly_rate,
                    years: p.years_experience,
                    pastTitles: p.past_titles,
                    industries: p.industries,
                    tools: p.tools,
                    education: p.education,
                    startAvailability: p.start_availability,
                    highlights: p.highlights,
                    availability: p.availability_list ?? (p.availability ? [p.availability] : []),
                    hours: p.hours_per_week,
                    timeZones: p.time_zones,
                  }}
                />
                {cv ? (
                  <button onClick={() => openCv(cv.cv_path)} className="mt-3 inline-flex items-center gap-1.5 self-start text-sm text-primary hover:underline">
                    <FileText className="h-4 w-4" /> View CV
                  </button>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">No CV uploaded</p>
                )}
                <div className="mt-5 flex items-center justify-between border-t pt-4">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={published}
                      disabled={toggle.isPending}
                      onCheckedChange={(v) => toggle.mutate({ id: p.id, publish: v })}
                      aria-label={published ? "Unpublish" : "Publish"}
                    />
                    {published ? "Unpublish" : "Publish"}
                  </label>
                  <div className="flex gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/applicant/profiles/$id/edit" params={{ id: p.id }}><Pencil className="h-4 w-4" /> Edit</Link>
                    </Button>
                    <ConfirmDelete
                      title="Delete this profile?"
                      description={`“${p.role_title}” will be permanently removed. Your CV stays in Settings.`}
                      onConfirm={() => del.mutate({ id: p.id })}
                      trigger={<Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /> Delete</Button>}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
