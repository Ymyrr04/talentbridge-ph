import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Pencil, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JOB_STATUS_LABEL } from "@/lib/client";
import { formatRate, postedAgo } from "@/lib/jobFormat";
import { applyRate, myJobStats } from "@/lib/jobStats";

export const Route = createFileRoute("/client/jobs/$id/")({
  head: () => ({ meta: [{ title: "Job Analytics — TalentHub" }, { property: "og:title", content: "Job Analytics — TalentHub" }, { property: "og:description", content: "Views and applicants for your job post." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "description", content: "Views and applicants for your job post." }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery(myJobStats);
  const job = data?.find((j) => j.id === id);

  useEffect(() => {
    if (!isLoading && data && !job) navigate({ to: "/client/jobs", replace: true });
  }, [isLoading, data, job, navigate]);

  if (!job) return null;
  const rate = formatRate(job.rate_min, job.rate_max);
  const line = [JOB_STATUS_LABEL[job.status] ?? job.status, postedAgo(job.created_at).replace(/^Posted/, "posted"), rate].filter(Boolean).join(" · ");
  const tiles = [
    { label: "Views", value: String(job.views) },
    { label: "Applicants", value: String(job.applicants) },
    { label: "Apply rate", value: applyRate(job.applicants, job.views) },
    { label: "Shortlisted", value: String(job.shortlisted) },
  ];
  const bars = [
    { label: "Pending", n: job.pending, cls: "bg-primary/40" },
    { label: "Contacted", n: job.contacted, cls: "bg-primary/70" },
    { label: "Shortlisted", n: job.shortlisted, cls: "bg-primary" },
    { label: "Not selected", n: job.rejected, cls: "bg-muted-foreground/40" },
  ];
  const total = job.applicants;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">{job.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{line}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{t.label}</p>
            <p className="mt-1 font-display text-3xl font-semibold">{t.value}</p>
          </div>
        ))}
      </div>
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="font-display font-semibold">Applicants by status</h2>
        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-muted">
          {total > 0 && bars.map((b) => b.n > 0 && <div key={b.label} className={b.cls} style={{ width: `${(b.n / total) * 100}%` }} />)}
        </div>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {bars.map((b) => (
            <li key={b.label} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${b.cls}`} />
              {b.label} <span className="font-semibold">{b.n}</span>
            </li>
          ))}
        </ul>
      </section>
      <div className="flex flex-wrap gap-2">
        <Button asChild><Link to="/client/applications" search={{ job: job.id }}><Users className="h-4 w-4" /> View applicants</Link></Button>
        <Button asChild variant="outline"><Link to="/client/jobs/$id/edit" params={{ id: job.id }}><Pencil className="h-4 w-4" /> Edit job</Link></Button>
      </div>
    </div>
  );
}
