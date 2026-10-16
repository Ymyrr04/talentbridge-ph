import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Lightbulb, Plus, UserRoundPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MAX_PROFILES, myApplicantProfiles } from "@/lib/applicant";
import { EmptyState, PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/applicant/dashboard")({
  head: () => ({ meta: [{ title: "Applicant Dashboard — TalentHub" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { user } = Route.useRouteContext();
  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => (await supabase.from("profiles").select("name").eq("id", user.id).maybeSingle()).data,
  });
  const { data: profiles = [], isLoading } = useQuery(myApplicantProfiles(user.id));
  const full = profiles.length >= MAX_PROFILES;

  return (
    <>
      <PageHeader
        title={`Welcome${profile?.name ? `, ${profile.name}` : ""}.`}
        subtitle={<span>Your Profiles · <span className="font-medium text-foreground">{profiles.length} of {MAX_PROFILES} used</span></span>}
        action={
          !full && profiles.length > 0 ? (
            <Button asChild><Link to="/applicant/profiles/new"><Plus className="h-4 w-4" /> Create a Profile</Link></Button>
          ) : undefined
        }
      />
      {!full && (
        <section className="mb-6 flex gap-4 rounded-2xl border border-primary/15 bg-primary/5 p-5">
          <Lightbulb className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h3 className="font-display font-semibold">Make up to 3 focused profiles</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Each profile can target a different role. Tailor the title, rate, skills and CV to that role so
              employers see right away why you&apos;re a fit. For example: one as a Virtual Assistant, one as a
              Bookkeeper, one as a Social Media Manager. When you apply, pick the profile that best matches the job.
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link to="/applicant/profiles/new"><Plus className="h-4 w-4" /> Create a Profile</Link>
            </Button>
          </div>
        </section>
      )}
      <h2 className="mb-4 font-display text-lg font-semibold">Your Profiles</h2>
      {isLoading ? null : profiles.length === 0 ? (
        <EmptyState
          icon={<UserRoundPlus className="h-6 w-6" />}
          title="No profiles yet"
          body="Create up to three profiles to showcase different roles you can do."
          action={<Button asChild><Link to="/applicant/profiles/new"><Plus className="h-4 w-4" /> Create a Profile</Link></Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => (
            <Link key={p.id} to="/applicant/profiles/$id/edit" params={{ id: p.id }} className="group rounded-2xl border bg-card p-5 transition-shadow hover:shadow-elevated">
              <Badge variant={p.status === "published" ? "default" : "secondary"}>{p.status === "published" ? "Published" : "Draft"}</Badge>
              <p className="mt-3 font-display font-semibold">{p.role_title}</p>
              <p className="mt-1 text-sm text-muted-foreground">${Number(p.hourly_rate).toFixed(2)}/hr</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">Edit <ArrowRight className="h-3.5 w-3.5" /></span>
            </Link>
          ))}
        </div>
      )}
      {full && <p className="mt-4 text-sm text-muted-foreground">You’ve reached the 3 profile limit.</p>}
    </>
  );
}
