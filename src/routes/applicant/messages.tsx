import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { Messenger } from "@/components/Messenger";

export const Route = createFileRoute("/applicant/messages")({
  head: () => ({ meta: [{ title: "Messages — TalentHub" }, { name: "robots", content: "noindex" }] }),
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
