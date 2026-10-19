import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { ApplicantProfileForm } from "@/components/ApplicantProfileForm";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/applicant/profiles/$id/edit")({
  head: () => ({ meta: [{ title: "Edit Profile — TalentHub" }, { name: "description", content: "Edit Profile for your TalentHub remote talent marketplace account." }, { property: "og:title", content: "Edit Profile — TalentHub" }, { property: "og:description", content: "Edit Profile for your TalentHub remote talent marketplace account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { user } = Route.useRouteContext();
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["applicant-profile", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("applicant_profiles").select("*").eq("id", id).eq("owner_id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  if (isLoading) return null;
  if (!data) {
    return (
      <>
        <PageHeader title="Profile not found" />
        <Button asChild variant="outline"><Link to="/applicant/profiles">Back to profiles</Link></Button>
      </>
    );
  }
  return (
    <>
      <PageHeader title="Edit Profile" />
      <ApplicantProfileForm key={data.id} userId={user.id} existing={data} />
    </>
  );
}
