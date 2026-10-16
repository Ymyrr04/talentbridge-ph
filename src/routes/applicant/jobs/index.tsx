import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Briefcase, Check } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { myApplications } from "@/lib/applications";
import { EMPLOYMENT_LABEL, formatHours, formatRate, postedAgo } from "@/lib/jobFormat";

export const jobsQuery = queryOptions({
  queryKey: ["browse-jobs"],
  queryFn: async () => {
    const { data, error } = await supabase.rpc("browse_jobs");
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/applicant/jobs/")({
  head: () => ({ meta: [{ title: "Open Jobs — TalentHub" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(jobsQuery), context.queryClient.ensureQueryData(myApplications)]),
  component: JobsPage,
});

function JobsPage() {
  const { data } = useSuspenseQuery(jobsQuery);
  const { data: apps } = useSuspenseQuery(myApplications);
  const applied = new Set(apps.map((a) => a.job_id));

  return (
    <>
      <PageHeader title="Open Jobs" subtitle={`${data.length} open role${data.length === 1 ? "" : "s"} from clients`} />
      {data.length === 0 ? (
        <EmptyState icon={<Briefcase className="h-6 w-6" />} title="No open jobs yet" body="Job posts that clients publish will appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((j) => {
            const facts = [
              j.employment_type ? EMPLOYMENT_LABEL[j.employment_type] : null,
              formatRate(j.rate_min, j.rate_max),
              formatHours(j.hours_min, j.hours_max),
            ].filter(Boolean);
            return (
              <article key={j.id} className="flex flex-col rounded-xl border bg-card p-5 shadow-sm">
                <h3 className="font-semibold leading-snug">{j.title}</h3>
                {facts.length > 0 && <p className="mt-1.5 text-sm font-medium text-foreground/80">{facts.join(" · ")}</p>}
                <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">{j.description}</p>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {postedAgo(j.created_at)}
                    {applied.has(j.id) && (
                      <span className="ml-2 inline-flex items-center gap-1 font-medium text-primary"><Check className="h-3.5 w-3.5" /> Applied</span>
                    )}
                  </p>
                  <Button size="sm" asChild>
                    <Link to="/applicant/jobs/$id" params={{ id: j.id }}>View job</Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
