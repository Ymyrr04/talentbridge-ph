import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { JobPostForm } from "@/components/JobPostForm";

export const Route = createFileRoute("/client/jobs/new")({
  head: () => ({ meta: [{ title: "Post a Job — TalentHub" }, { name: "description", content: "Post a Job for your TalentHub remote talent marketplace account." }, { property: "og:title", content: "Post a Job — TalentHub" }, { property: "og:description", content: "Post a Job for your TalentHub remote talent marketplace account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
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
