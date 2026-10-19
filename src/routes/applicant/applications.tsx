import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { supabase } from "@/integrations/supabase/client";
import { APPLICATION_STATUS_LABEL, ApplicationStatusClass, myApplications } from "@/lib/applications";

export const Route = createFileRoute("/applicant/applications")({
  head: () => ({ meta: [{ title: "My Applications — TalentHub" }, { name: "description", content: "My Applications for your TalentHub remote talent marketplace account." }, { property: "og:title", content: "My Applications — TalentHub" }, { property: "og:description", content: "My Applications for your TalentHub remote talent marketplace account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(myApplications),
  component: MyApplicationsPage,
});

function MyApplicationsPage() {
  const { data } = useSuspenseQuery(myApplications);
  const qc = useQueryClient();

  async function withdraw(id: string) {
    const { error } = await supabase.from("job_applications").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Application withdrawn");
    await qc.invalidateQueries({ queryKey: ["my-applications"] });
  }

  return (
    <>
      <PageHeader title="My Applications" subtitle={`${data.length} sent`} />
      {data.length === 0 ? (
        <EmptyState
          icon={<Send className="h-6 w-6" />}
          title="No applications yet"
          body="Apply to open jobs and track their status here."
          action={<Button asChild><Link to="/applicant/jobs">Browse open jobs</Link></Button>}
        />
      ) : (
        <div className="space-y-3">
          {data.map((a) => (
            <article key={a.id} className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h3 className="font-semibold">{a.job_title}</h3>
                <p className="text-sm text-muted-foreground">
                  As {a.role_title} · Applied {new Date(a.created_at).toLocaleDateString()}
                  {a.job_status !== "open" && " · Job no longer open"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ApplicationStatusClass(a.status)}`}>
                  {APPLICATION_STATUS_LABEL[a.status] ?? a.status}
                </span>
                <ConfirmDelete
                  title="Withdraw this application?"
                  description="The client will no longer see it."
                  onConfirm={() => withdraw(a.id)}
                  confirmLabel="Withdraw"
                  trigger={<Button variant="outline" size="sm">Withdraw</Button>}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
