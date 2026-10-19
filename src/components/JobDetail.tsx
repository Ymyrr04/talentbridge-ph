import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApplyDialog } from "@/components/ApplyDialog";
import { supabase } from "@/integrations/supabase/client";
import { myApplications } from "@/lib/applications";
import {
  DURATION_LABEL, EMPLOYMENT_LABEL, EXPERIENCE_LABEL, ZONE_LABEL,
  formatHours, formatRate, postedAgo,
} from "@/lib/jobFormat";

import { jobQuery } from "@/lib/openJob";

export function Unavailable() {
  return (
    <div className="mx-auto max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
      <h1 className="text-lg font-semibold">This job is no longer available</h1>
      <p className="mt-2 text-sm text-muted-foreground">It may have been closed or removed by the client.</p>
      <Button asChild className="mt-5"><Link to="/applicant/jobs">Back to Open Jobs</Link></Button>
    </div>
  );
}

export function JobDetail({ id, embedded = false }: { id: string; embedded?: boolean }) {
  const { data: job } = useSuspenseQuery(jobQuery(id));
  const { data: apps } = useSuspenseQuery(myApplications);
  const [applying, setApplying] = useState(false);
  const recorded = useRef<string | null>(null);

  useEffect(() => {
    if (!job || recorded.current === id) return;
    recorded.current = id;
    void supabase.rpc("record_job_view", { _job_id: id }).then(({ error }) => { if (error) console.error(error.message); });
  }, [id, job]);

  if (!job) return <Unavailable />;
  const applied = apps.some((a) => a.job_id === id);
  const rate = formatRate(job.rate_min, job.rate_max);
  const hours = formatHours(job.hours_min, job.hours_max);
  const facts: [string, string | null][] = [
    ["Employment type", job.employment_type ? EMPLOYMENT_LABEL[job.employment_type] ?? null : null],
    ["Project timeline", job.employment_type === "project" && job.project_duration ? DURATION_LABEL[job.project_duration] ?? null : null],
    ["Hourly rate", rate],
    ["Hours per week", hours],
    ["Working hours", job.time_zones?.length ? job.time_zones.map((z) => ZONE_LABEL[z] ?? z).join(", ") : null],
    ["Experience level", job.experience_level ? EXPERIENCE_LABEL[job.experience_level] ?? null : null],
  ];

  return (
    <div className={embedded ? "min-w-0 space-y-6" : "mx-auto max-w-3xl space-y-6"}>
      {!embedded && <Link to="/applicant/jobs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Open Jobs
      </Link>}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold leading-tight">{job.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{postedAgo(job.created_at)}</p>
          {job.portfolio_required && <span className="mt-2 inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">Portfolio required</span>}
        </div>
        {applied ? (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary"><Check className="h-4 w-4" /> Applied</span>
        ) : (
          <Button onClick={() => setApplying(true)}>Apply</Button>
        )}
      </header>

      <dl className="grid gap-4 border-y py-5 sm:grid-cols-2">
        {facts.filter(([, v]) => v).map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k}</dt>
            <dd className="mt-0.5 text-sm font-medium">{v}</dd>
          </div>
        ))}
      </dl>

      {job.must_have_tools && job.must_have_tools.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold">Must-have tools</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {job.must_have_tools.map((t) => (
              <span key={t} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">{t}</span>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold">Description</h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/90">{job.description}</p>
      </section>

      <ApplyDialog job={applying ? { id: job.id, title: job.title, portfolioRequired: job.portfolio_required } : null} onClose={() => setApplying(false)} />
    </div>
  );
}
