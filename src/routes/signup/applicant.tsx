import { createFileRoute } from "@tanstack/react-router";
import { AuthShell } from "@/components/AuthShell";
import { SignupForm } from "@/components/SignupForm";

export const Route = createFileRoute("/signup/applicant")({
  head: () => ({
    meta: [
      { title: "Sign up as an Applicant — TalentHub" },
      { name: "description", content: "Create your TalentHub applicant account and get discovered by employers worldwide." },
      { property: "og:title", content: "Sign up as an Applicant — TalentHub" },
      { property: "og:description", content: "Create your TalentHub applicant account." },
    ],
  }),
  component: () => (
    <AuthShell title="Join as an Applicant" subtitle="Get discovered by employers hiring remote Filipino talent.">
      <SignupForm role="applicant" />
    </AuthShell>
  ),
});
