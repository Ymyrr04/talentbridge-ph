import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { SettingsForm } from "@/components/SettingsForm";

export const Route = createFileRoute("/client/settings")({
  head: () => ({ meta: [{ title: "Client Settings — TalentHub" }, { name: "description", content: "Client Settings for your TalentHub remote talent marketplace account." }, { property: "og:title", content: "Client Settings — TalentHub" }, { property: "og:description", content: "Client Settings for your TalentHub remote talent marketplace account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
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
