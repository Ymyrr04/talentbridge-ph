import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { JobPostForm } from "@/components/JobPostForm";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/client/jobs/$id/edit")({
  head: () => ({ meta: [{ title: "Edit Job Post — TalentHub" }, { name: "description", content: "Edit Job Post for your TalentHub remote talent marketplace account." }, { property: "og:title", content: "Edit Job Post — TalentHub" }, { property: "og:description", content: "Edit Job Post for your TalentHub remote talent marketplace account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { user } = Route.useRouteContext();
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["job-post", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("job_posts").select("*").eq("id", id).eq("owner_id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  if (isLoading) return null;
  if (!data) {
    return (
      <>
        <PageHeader title="Job post not found" />
        <Button asChild variant="outline"><Link to="/client/jobs">Back to job posts</Link></Button>
      </>
    );
  }
  return (
    <>
      <PageHeader title="Edit Job Post" />
      <JobPostForm key={data.id} userId={user.id} existing={data} />
    </>
  );
}
