import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { JobPostForm } from "@/components/JobPostForm";

export const Route = createFileRoute("/client/jobs/new")({
  head: () => ({ meta: [{ title: "Post a Job — TalentHub" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { user } = Route.useRouteContext();
  return (
    <>
      <PageHeader title="Post a Job" />
      <JobPostForm userId={user.id} />
    </>
  );
}
