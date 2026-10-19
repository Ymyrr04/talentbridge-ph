import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MAX_PROFILES, myApplicantProfiles } from "@/lib/applicant";
import { PageHeader } from "@/components/AppShell";
import { ApplicantProfileForm } from "@/components/ApplicantProfileForm";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/applicant/profiles/new")({
  head: () => ({ meta: [{ title: "Create a Profile — TalentHub" }, { name: "description", content: "Create a Profile for your TalentHub remote talent marketplace account." }, { property: "og:title", content: "Create a Profile — TalentHub" }, { property: "og:description", content: "Create a Profile for your TalentHub remote talent marketplace account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { user } = Route.useRouteContext();
  const { data: profiles, isLoading } = useQuery(myApplicantProfiles(user.id));
  if (isLoading) return null;
  if ((profiles?.length ?? 0) >= MAX_PROFILES) {
    return (
      <>
        <PageHeader title="Create a Profile" subtitle="You’ve reached the 3 profile limit." />
        <Button asChild variant="outline"><Link to="/applicant/profiles">Back to profiles</Link></Button>
      </>
    );
  }
  return (
    <>
      <PageHeader title="Create a Profile" subtitle="Profiles start as drafts. Publish when you're ready." />
      <ApplicantProfileForm userId={user.id} />
    </>
  );
}
