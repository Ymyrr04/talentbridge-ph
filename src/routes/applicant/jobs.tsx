import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Briefcase, Check } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { myApplications, myPublishedProfiles } from "@/lib/applications";

const jobsQuery = queryOptions({
  queryKey: ["browse-jobs"],
  queryFn: async () => {
    const { data, error } = await supabase.rpc("browse_jobs");
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/applicant/jobs")({
  head: () => ({ meta: [{ title: "Open Jobs — TalentHub" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(jobsQuery),
      context.queryClient.ensureQueryData(myApplications),
      context.queryClient.ensureQueryData(myPublishedProfiles),
    ]),
  component: JobsPage,
});

type Job = { id: string; title: string; description: string; created_at: string };

function JobsPage() {
  const { data } = useSuspenseQuery(jobsQuery);
  const { data: apps } = useSuspenseQuery(myApplications);
  const applied = new Set(apps.map((a) => a.job_id));
  const [applying, setApplying] = useState<Job | null>(null);

  return (
    <>
      <PageHeader title="Open Jobs" subtitle={`${data.length} open role${data.length === 1 ? "" : "s"} from clients`} />
      {data.length === 0 ? (
        <EmptyState icon={<Briefcase className="h-6 w-6" />} title="No open jobs yet" body="Job posts that clients publish will appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((j) => (
            <article key={j.id} className="flex flex-col rounded-xl border bg-card p-5 shadow-sm">
              <h3 className="font-semibold leading-snug">{j.title}</h3>
              <p className="mt-2 line-clamp-4 flex-1 text-sm text-muted-foreground">{j.description}</p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Posted {new Date(j.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </p>
                {applied.has(j.id) ? (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                    <Check className="h-4 w-4" /> Applied
                  </span>
                ) : (
                  <Button size="sm" onClick={() => setApplying(j)}>Apply</Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      <ApplyDialog job={applying} onClose={() => setApplying(null)} />
    </>
  );
}

function ApplyDialog({ job, onClose }: { job: Job | null; onClose: () => void }) {
  const { data: profiles } = useSuspenseQuery(myPublishedProfiles);
  const qc = useQueryClient();
  const [profileId, setProfileId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const selected = profileId || profiles[0]?.id || "";

  async function submit() {
    if (!job || !selected) return;
    setBusy(true);
    const { error } = await supabase.rpc("apply_to_job", { _job_id: job.id, _profile_id: selected, _note: note.trim() });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Application sent");
    setNote("");
    setProfileId("");
    await qc.invalidateQueries({ queryKey: ["my-applications"] });
    onClose();
  }

  return (
    <Dialog open={!!job} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply: {job?.title}</DialogTitle>
          <DialogDescription>The client will see your name, email, chosen profile and note.</DialogDescription>
        </DialogHeader>
        {profiles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You need a published profile to apply.{" "}
            <Link to="/applicant/profiles" className="font-medium text-primary underline">Go to your profiles</Link>
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Profile to send</Label>
              <Select value={selected} onValueChange={setProfileId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.role_title} · ${Number(p.hourly_rate)}/hr</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Short note (optional)</Label>
              <Textarea id="note" rows={5} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why you're a good fit…" />
              <p className="text-right text-xs text-muted-foreground">{note.length}/2000</p>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy || profiles.length === 0}>{busy ? "Sending…" : "Send application"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
