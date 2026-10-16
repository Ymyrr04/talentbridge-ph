import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BriefcaseBusiness, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { myJobPosts } from "@/lib/client";
import { myJobStats } from "@/lib/jobStats";
import { EmptyState, PageHeader } from "@/components/AppShell";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { JobStatusBadge } from "@/components/JobStatusBadge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/client/jobs/")({
  head: () => ({ meta: [{ title: "Job Posts — TalentHub" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: jobs = [], isLoading } = useQuery(myJobPosts(user.id));
  const { data: stats = [] } = useQuery(myJobStats);
  const statFor = (id: string) => stats.find((s) => s.id === id);
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("job_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Job post deleted");
      qc.invalidateQueries({ queryKey: ["job-posts", user.id] });
      qc.invalidateQueries({ queryKey: ["my-job-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const postBtn = <Button asChild><Link to="/client/jobs/new"><Plus className="h-4 w-4" /> Post a Job</Link></Button>;

  return (
    <>
      <PageHeader title="Job Posts" subtitle={`${jobs.length} total`} action={jobs.length > 0 ? postBtn : undefined} />
      {isLoading ? null : jobs.length === 0 ? (
        <EmptyState icon={<BriefcaseBusiness className="h-6 w-6" />} title="No job posts yet" body="Create a job post to describe the role you're hiring for." action={postBtn} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((j) => (
            <div key={j.id} className="flex flex-col rounded-2xl border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <Link to="/client/jobs/$id" params={{ id: j.id }} className="font-display font-semibold leading-snug hover:text-primary hover:underline">{j.title}</Link>
                <JobStatusBadge status={j.status} />
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{j.description}</p>
              {(() => { const st = statFor(j.id); return st ? <p className="mt-2 text-xs text-muted-foreground">{st.views} view{st.views === 1 ? "" : "s"} · {st.applicants} applicant{st.applicants === 1 ? "" : "s"}</p> : null; })()}
              <div className="mt-auto flex justify-end gap-1 border-t pt-4">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/client/jobs/$id/edit" params={{ id: j.id }}><Pencil className="h-4 w-4" /> Edit</Link>
                </Button>
                <ConfirmDelete
                  title="Delete this job post?"
                  description={`“${j.title}” will be permanently removed.`}
                  onConfirm={() => del.mutate(j.id)}
                  trigger={<Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /> Delete</Button>}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
