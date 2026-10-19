import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { SettingsForm } from "@/components/SettingsForm";
import { CvSettings } from "@/components/CvSettings";

export const Route = createFileRoute("/applicant/settings")({
  head: () => ({ meta: [{ title: "Applicant Settings — TalentHub" }, { name: "description", content: "Applicant Settings for your TalentHub remote talent marketplace account." }, { property: "og:title", content: "Applicant Settings — TalentHub" }, { property: "og:description", content: "Applicant Settings for your TalentHub remote talent marketplace account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
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
