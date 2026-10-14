import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BriefcaseBusiness, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { myJobPosts } from "@/lib/client";
import { EmptyState, PageHeader } from "@/components/AppShell";
import { JobStatusBadge } from "@/components/JobStatusBadge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/client/dashboard")({
  head: () => ({ meta: [{ title: "Client Dashboard — TalentHub" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { user } = Route.useRouteContext();
  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => (await supabase.from("profiles").select("name").eq("id", user.id).maybeSingle()).data,
  });
  const { data: jobs = [], isLoading } = useQuery(myJobPosts(user.id));
  const postBtn = <Button asChild><Link to="/client/jobs/new"><Plus className="h-4 w-4" /> Post a Job</Link></Button>;

  return (
    <>
      <PageHeader title={`Welcome${profile?.name ? `, ${profile.name}` : ""}.`} action={jobs.length > 0 ? postBtn : undefined} />
      <h2 className="mb-4 font-display text-lg font-semibold">Your Job Posts</h2>
      {isLoading ? null : jobs.length === 0 ? (
        <EmptyState icon={<BriefcaseBusiness className="h-6 w-6" />} title="No job posts yet" body="Post your first job to start finding Filipino remote talent." action={postBtn} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.slice(0, 6).map((j) => (
            <Link key={j.id} to="/client/jobs/$id/edit" params={{ id: j.id }} className="rounded-2xl border bg-card p-5 transition-shadow hover:shadow-elevated">
              <JobStatusBadge status={j.status} />
              <p className="mt-3 font-display font-semibold">{j.title}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">Edit <ArrowRight className="h-3.5 w-3.5" /></span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
