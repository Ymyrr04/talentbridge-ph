import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageHeader } from "@/components/AppShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { APPLICATION_STATUS_LABEL, ApplicationStatusClass, incomingApplications } from "@/lib/applications";
import { MessageApplicantButton } from "@/components/MessageApplicantButton";

export const Route = createFileRoute("/client/applications")({
  head: () => ({ meta: [{ title: "Applications — TalentHub" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>): { job?: string } => (typeof s["job"] === "string" ? { job: s["job"] } : {}),
  loader: ({ context }) => context.queryClient.ensureQueryData(incomingApplications),
  component: ClientApplicationsPage,
});

function ClientApplicationsPage() {
  const { data } = useSuspenseQuery(incomingApplications);
  const qc = useQueryClient();
  const [jobFilter, setJobFilter] = useState(Route.useSearch().job ?? "all");
  const jobs = Array.from(new Map(data.map((a) => [a.job_id, a.job_title])).entries());
  const shown = jobFilter === "all" ? data : data.filter((a) => a.job_id === jobFilter);

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.rpc("set_application_status", { _id: id, _status: status });
    if (error) { toast.error(error.message); return; }
    toast.success(`Marked as ${APPLICATION_STATUS_LABEL[status]}`);
    await qc.invalidateQueries({ queryKey: ["incoming-applications"] });
  }

  return (
    <>
      <PageHeader
        title="Applications"
        subtitle={`${data.length} received across your job posts`}
        action={
          jobs.length > 1 ? (
            <Select value={jobFilter} onValueChange={setJobFilter}>
              <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All jobs</SelectItem>
                {jobs.map(([id, title]) => <SelectItem key={id} value={id}>{title}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : undefined
        }
      />
      {data.length === 0 ? (
        <EmptyState icon={<Inbox className="h-6 w-6" />} title="No applications yet" body="When applicants apply to your open job posts, they'll show up here." />
      ) : (
        <div className="space-y-3">
          {shown.map((a) => (
            <article key={a.id} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{a.job_title}</p>
                  <h3 className="mt-1 font-semibold">{a.applicant_name || "Unnamed applicant"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {a.role_title} · ${Number(a.hourly_rate)}/hr
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <MessageApplicantButton applicationId={a.id} applicantName={a.applicant_name} />
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ApplicationStatusClass(a.status)}`}>
                    {APPLICATION_STATUS_LABEL[a.status]}
                  </span>
                  <Select value={a.status} onValueChange={(v) => setStatus(a.id, v)}>
                    <SelectTrigger className="w-36" aria-label="Change status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(APPLICATION_STATUS_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {a.cover_note && <p className="mt-3 whitespace-pre-line rounded-lg bg-muted/50 p-3 text-sm">{a.cover_note}</p>}
              <p className="mt-3 text-xs text-muted-foreground">Applied {new Date(a.created_at).toLocaleDateString()}</p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
