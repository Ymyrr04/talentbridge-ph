import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/auth";
import { DashboardLayout } from "@/components/DashboardLayout";

export const Route = createFileRoute("/client/dashboard")({
  ssr: false,
  beforeLoad: () => requireRole("client"),
  head: () => ({ meta: [{ title: "Client Dashboard — TalentHub" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { user } = Route.useRouteContext();
  return <DashboardLayout userId={user.id} roleLabel="Client" />;
}
