import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/auth";
import { DashboardLayout } from "@/components/DashboardLayout";

export const Route = createFileRoute("/admin/dashboard")({
  ssr: false,
  beforeLoad: () => requireRole("admin"),
  head: () => ({ meta: [{ title: "Admin Dashboard — TalentHub" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { user } = Route.useRouteContext();
  return <DashboardLayout userId={user.id} roleLabel="Admin" />;
}
