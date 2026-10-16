import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BriefcaseBusiness, ChevronRight, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { myJobStats } from "@/lib/jobStats";
import { EmptyState, PageHeader } from "@/components/AppShell";
import { JobStatusBadge } from "@/components/JobStatusBadge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/client/dashboard")({
  head: () => ({ meta: [{ title: "Client Dashboard — TalentHub" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => (await supabase.from("profiles").select("name").eq("id", user.id).maybeSingle()).data,
  });
  const { data: jobs = [], isLoading } = useQuery(myJobStats);
  const postBtn = <Button asChild><Link to="/client/jobs/new"><Plus className="h-4 w-4" /> Post a Job</Link></Button>;

  return (
    <>
      <PageHeader title={`Welcome${profile?.name ? `, ${profile.name}` : ""}.`} action={jobs.length > 0 ? postBtn : undefined} />
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Your jobs</h2>
        {jobs.length > 0 && <Link to="/client/jobs" className="text-sm font-medium text-primary hover:underline">View all jobs</Link>}
      </div>
      {isLoading ? null : jobs.length === 0 ? (
        <EmptyState icon={<BriefcaseBusiness className="h-6 w-6" />} title="Post your first job" body="Describe the role you're hiring for to start finding Filipino remote talent." action={postBtn} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Job</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Views</th>
                <th className="px-4 py-3 text-right font-medium">Applicants</th>
                <th className="w-10 px-4 py-3"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {jobs.slice(0, 10).map((j) => {
                const draft = j.status === "draft";
                return (
                  <tr key={j.id} onClick={() => navigate({ to: "/client/jobs/$id", params: { id: j.id } })} className="cursor-pointer border-b last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">
                      <Link to="/client/jobs/$id" params={{ id: j.id }} onClick={(e) => e.stopPropagation()}>{j.title}</Link>
                    </td>
                    <td className="px-4 py-3"><JobStatusBadge status={j.status} /></td>
                    <td className="px-4 py-3 text-right tabular-nums">{draft ? "–" : j.views}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{draft ? "–" : j.applicants}</td>
                    <td className="px-4 py-3 text-muted-foreground"><ChevronRight className="h-4 w-4" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
