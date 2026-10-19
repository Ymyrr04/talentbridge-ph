import { Suspense, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Briefcase, Check } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/AppShell";
import { JobDetail } from "@/components/JobDetail";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { myApplications, myPublishedProfiles } from "@/lib/applications";
import { jobQuery } from "@/lib/openJob";
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
  head: () => ({ meta: [
    { title: "Open Jobs — TalentHub" },
    { name: "description", content: "Browse recently posted remote jobs, review requirements, and apply with your TalentHub profile." },
    { property: "og:title", content: "Open Jobs — TalentHub" },
    { property: "og:description", content: "Find remote opportunities and review each job’s requirements on TalentHub." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  loader: async ({ context }) => {
    const [jobs] = await Promise.all([
      context.queryClient.ensureQueryData(jobsQuery),
      context.queryClient.ensureQueryData(myApplications),
      context.queryClient.ensureQueryData(myPublishedProfiles),
    ]);
    if (jobs[0]) await context.queryClient.ensureQueryData(jobQuery(jobs[0].id));
  },
  component: JobsPage,
});

function JobsPage() {
  const { data } = useSuspenseQuery(jobsQuery);
  const { data: apps } = useSuspenseQuery(myApplications);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobilePreview, setMobilePreview] = useState(false);
  const selected = data.find((job) => job.id === selectedId) ?? data[0];
  const applied = new Set(apps.map((a) => a.job_id));

  return (
    <>
      <PageHeader title="Open Jobs" subtitle={`${data.length} open role${data.length === 1 ? "" : "s"} from clients`} />
      {data.length === 0 ? (
        <EmptyState icon={<Briefcase className="h-6 w-6" />} title="No open jobs yet" body="Job posts that clients publish will appear here." />
      ) : (
        <div className="grid min-w-0 border-y md:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]">
          <div aria-label="Open jobs" className={`${mobilePreview ? "hidden md:block" : "block"} md:max-h-[calc(100dvh-240px)] md:overflow-y-auto md:border-r`}>
            {data.map((j) => {
              const facts = [
                j.employment_type ? EMPLOYMENT_LABEL[j.employment_type] : null,
                formatRate(j.rate_min, j.rate_max),
                formatHours(j.hours_min, j.hours_max),
              ].filter(Boolean);
              return (
                <Button
                  key={j.id}
                  variant="ghost"
                  aria-label={`View job: ${j.title}`}
                  aria-pressed={selected?.id === j.id}
                  onClick={() => { setSelectedId(j.id); setMobilePreview(true); }}
                  className={`h-auto w-full flex-col items-start gap-2 whitespace-normal rounded-none border-b px-5 py-5 text-left last:border-b-0 ${selected?.id === j.id ? "bg-accent text-accent-foreground shadow-[inset_3px_0_0_var(--primary)]" : ""}`}
                >
                  <span className="w-full break-words font-semibold leading-snug">{j.title}</span>
                  {facts.length > 0 && <span className="text-xs font-medium text-foreground/80">{facts.join(" · ")}</span>}
                  <span className="line-clamp-2 text-sm font-normal text-muted-foreground">{j.description}</span>
                  {j.portfolio_required && <span className="text-xs font-medium text-primary">Portfolio required</span>}
                  <span className="flex w-full flex-wrap items-center justify-between gap-2 text-xs font-normal text-muted-foreground">
                    <span>{postedAgo(j.created_at)}</span>
                    {applied.has(j.id) && <span className="inline-flex items-center gap-1 font-medium text-primary"><Check className="h-3.5 w-3.5" />Applied</span>}
                  </span>
                </Button>
              );
            })}
          </div>
          <section aria-label="Job preview" className={`${mobilePreview ? "block" : "hidden md:block"} min-w-0 px-1 py-6 md:max-h-[calc(100dvh-240px)] md:overflow-y-auto md:px-8`}>
            <Button variant="ghost" size="sm" onClick={() => setMobilePreview(false)} className="mb-5 md:hidden"><ArrowLeft className="h-4 w-4" />Open Jobs</Button>
            <Suspense fallback={<p role="status" className="py-8 text-sm text-muted-foreground">Loading job details…</p>}>
              {selected && <JobDetail key={selected.id} id={selected.id} embedded />}
            </Suspense>
          </section>
        </div>
      )}
    </>
  );
}
