import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { Messenger } from "@/components/Messenger";

export const Route = createFileRoute("/applicant/messages")({
  head: () => ({ meta: [{ title: "Applicant Messages — TalentHub" }, { name: "description", content: "Applicant Messages for your TalentHub remote talent marketplace account." }, { property: "og:title", content: "Applicant Messages — TalentHub" }, { property: "og:description", content: "Applicant Messages for your TalentHub remote talent marketplace account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { user } = Route.useRouteContext();
  return (
    <>
      <PageHeader title="Messages" />
      <Messenger userId={user.id} side="applicant" />
    </>
  );
}
