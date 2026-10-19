import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { Messenger } from "@/components/Messenger";

export const Route = createFileRoute("/client/messages")({
  head: () => ({ meta: [{ title: "Client Messages — TalentHub" }, { name: "description", content: "Client Messages for your TalentHub remote talent marketplace account." }, { property: "og:title", content: "Client Messages — TalentHub" }, { property: "og:description", content: "Client Messages for your TalentHub remote talent marketplace account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>): { c?: string } => (typeof s["c"] === "string" ? { c: s["c"] } : {}),
  component: Page,
});

function Page() {
  const { user } = Route.useRouteContext();
  const { c } = Route.useSearch();
  return (
    <>
      <PageHeader title="Messages" />
      <Messenger userId={user.id} side="client" initial={c} />
    </>
  );
}
