import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Pencil, Plus, Trash2, UserRoundPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { removeVideo } from "@/lib/introVideo";
import { MAX_PROFILES, myApplicantProfiles, removeCv } from "@/lib/applicant";
import { EmptyState, PageHeader } from "@/components/AppShell";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/applicant/profiles/")({
  head: () => ({ meta: [{ title: "Your Profiles — TalentHub" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const key = myApplicantProfiles(user.id).queryKey;
  const { data: profiles = [], isLoading } = useQuery(myApplicantProfiles(user.id));
  const full = profiles.length >= MAX_PROFILES;

  const toggle = useMutation({
    mutationFn: async ({ id, publish }: { id: string; publish: boolean }) => {
      const { error } = await supabase.from("applicant_profiles").update({ status: publish ? "published" : "draft" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async ({ id, cv }: { id: string; cv: string | null }) => {
      const { data: row } = await supabase.from("applicant_profiles").select("video_path").eq("id", id).maybeSingle();
      const { error } = await supabase.from("applicant_profiles").delete().eq("id", id);
      if (error) throw error;
      await removeCv(cv);
      await removeVideo(row?.video_path);
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
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display font-semibold leading-snug">{p.role_title}</p>
                  <Badge variant={published ? "default" : "secondary"}>{published ? "Published" : "Draft"}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">${Number(p.hourly_rate).toFixed(2)}/hr</p>
                {p.cv_path ? (
                  <button onClick={() => openCv(p.cv_path!)} className="mt-3 inline-flex items-center gap-1.5 self-start text-sm text-primary hover:underline">
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
                      description={`“${p.role_title}” and its CV will be permanently removed.`}
                      onConfirm={() => del.mutate({ id: p.id, cv: p.cv_path })}
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
