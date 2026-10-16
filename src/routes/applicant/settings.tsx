import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { SettingsForm } from "@/components/SettingsForm";
import { CvSettings } from "@/components/CvSettings";

export const Route = createFileRoute("/applicant/settings")({
  head: () => ({ meta: [{ title: "Settings — TalentHub" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { user } = Route.useRouteContext();
  return (
    <>
      <PageHeader title="Settings" />
      <CvSettings userId={user.id} />
      <SettingsForm userId={user.id} />
    </>
  );
}
