import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { SettingsForm } from "@/components/SettingsForm";

export const Route = createFileRoute("/client/settings")({
  head: () => ({ meta: [{ title: "Settings — TalentHub" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { user } = Route.useRouteContext();
  return (
    <>
      <PageHeader title="Settings" />
      <SettingsForm userId={user.id} showPhone />
    </>
  );
}
