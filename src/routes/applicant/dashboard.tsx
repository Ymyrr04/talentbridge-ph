import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Briefcase, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { APPLICATION_STATUS_LABEL, ApplicationStatusClass, myApplications } from "@/lib/applications";
import { EmptyState, PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { jobsQuery } from "@/routes/applicant/jobs";
import { EMPLOYMENT_LABEL, formatHours, formatRate, postedAgo } from "@/lib/jobFormat";

type Job = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  employment_type: string | null;
  rate_min: number | null;
  rate_max: number | null;
  hours_min: number | null;
  hours_max: number | null;
  portfolio_required: boolean;
};

export const Route = createFileRoute("/applicant/dashboard")({
  validateSearch: (search) => ({ q: typeof search.q === "string" ? search.q : undefined }),
  head: () => ({ meta: [{ title: "Applicant Dashboard — TalentHub" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

/** Word-match ranking: exact phrase first, then all words, then any word. */
function rankJobs(jobs: Job[], q: string): Job[] {
  const query = q.trim().toLowerCase();
  if (!query) return [];
  const words = query.split(/\s+/).filter(Boolean);
  return jobs
    .map((j) => {
      const title = j.title.toLowerCase();
      const description = (j.description ?? "").toLowerCase();
      const hay = `${title} ${description}`;
      let score = 0;
      if (hay.includes(query)) score += 100;
      if (words.length > 1 && words.every((w) => hay.includes(w))) score += 30;
      if (words.length > 1 && words.every((w) => title.includes(w))) score += 10;
      score += words.filter((w) => hay.includes(w)).length * 10;
      return { j, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || b.j.created_at.localeCompare(a.j.created_at))
    .map((s) => s.j);
}

function Page() {
  const { user } = Route.useRouteContext();
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => (await supabase.from("profiles").select("name").eq("id", user.id).maybeSingle()).data,
  });
  const { data: jobs = [] } = useQuery(jobsQuery);
  const searching = Boolean(q?.trim());
  const results = searching ? rankJobs(jobs, q!) : [];
  const shown = searching
    ? results
    : [...jobs]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 6);
  const { data: apps = [] } = useQuery(myApplications);
  const recentApps = [...apps]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 4);

  return (
    <>
      <PageHeader title={`Welcome${profile?.name ? `, ${profile.name}` : ""}.`} />
      <div className="relative mb-8">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={q ?? ""}
          onChange={(e) => navigate({ search: (prev) => ({ ...prev, q: e.target.value }), replace: true })}
          placeholder="Search jobs, e.g. AI automation"
          className="pl-9"
          aria-label="Search jobs"
        />
      </div>
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">
            {searching ? `Results for “${q?.trim()}” · ${results.length}` : "Recently posted jobs"}
          </h2>
          <Link to="/applicant/jobs" className="text-sm font-medium text-primary hover:underline">View all</Link>
        </div>
        {shown.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="h-6 w-6" />}
            title={searching ? "No jobs match your search" : "No open jobs yet"}
            body={searching ? "Try different words, or browse all open jobs." : "Job posts that clients publish will appear here."}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((j) => (
              <JobCard key={j.id} job={j} />
            ))}
          </div>
        )}
      </section>
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Your applications</h2>
          {apps.length > 0 && (
            <Link to="/applicant/applications" className="text-sm font-medium text-primary hover:underline">View all</Link>
          )}
        </div>
        {recentApps.length === 0 ? (
          <EmptyState icon={<Briefcase className="h-6 w-6" />} title="No applications yet" body="Browse the open jobs and apply with one of your profiles." action={<Button asChild><Link to="/applicant/jobs">Browse jobs</Link></Button>} />
        ) : (
          <div className="divide-y rounded-xl border bg-card">
            {recentApps.map((a) => (
              <Link key={a.id} to="/applicant/jobs/$id" params={{ id: a.job_id }} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted/50">
                <div className="min-w-0">
                  <p className="truncate font-semibold leading-snug">{a.job_title}</p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{a.role_title} · {postedAgo(a.created_at)}</p>
                </div>
                <Badge className={ApplicationStatusClass(a.status)}>{APPLICATION_STATUS_LABEL[a.status] ?? a.status}</Badge>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function JobCard({ job: j }: { job: Job }) {
  const facts = [
    j.employment_type ? EMPLOYMENT_LABEL[j.employment_type] : null,
    formatRate(j.rate_min, j.rate_max),
    formatHours(j.hours_min, j.hours_max),
  ].filter(Boolean);
  return (
    <article className="flex flex-col rounded-xl border bg-card p-5 shadow-sm">
      <h3 className="font-semibold leading-snug">{j.title}</h3>
      {j.portfolio_required && <span className="mt-1.5 w-fit rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">Portfolio required</span>}
      {facts.length > 0 && <p className="mt-1.5 text-sm font-medium text-foreground/80">{facts.join(" · ")}</p>}
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{j.description}</p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <p className="text-xs text-muted-foreground">{postedAgo(j.created_at)}</p>
        <Button size="sm" asChild>
          <Link to="/applicant/jobs/$id" params={{ id: j.id }}>View job</Link>
        </Button>
      </div>
    </article>
  );
}
