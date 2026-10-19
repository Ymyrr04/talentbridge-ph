import { createFileRoute } from "@tanstack/react-router";
import { AuthShell } from "@/components/AuthShell";
import { SignupForm } from "@/components/SignupForm";

export const Route = createFileRoute("/signup/client")({
  head: () => ({
    meta: [
      { title: "Sign up as a Client — TalentHub" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
      { name: "description", content: "Create a TalentHub client account to hire skilled Filipino remote professionals." },
      { property: "og:title", content: "Sign up as a Client — TalentHub" },
      { property: "og:description", content: "Create a TalentHub client account." },
    ],
  }),
  component: () => (
    <AuthShell title="Join as a Client" subtitle="Hire skilled Filipino remote professionals.">
      <SignupForm role="client" />
    </AuthShell>
  ),
});
