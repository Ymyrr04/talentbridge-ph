import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/client")({
  ssr: false,
  beforeLoad: () => requireRole("client"),
  component: ClientLayout,
});

function ClientLayout() {
  return (
    <AppShell
      roleLabel="Client"
      nav={[
        { to: "/client/dashboard", label: "Dashboard" },
        { to: "/client/jobs", label: "Job Posts" },
        { to: "/client/applications", label: "Applications" },
        { to: "/client/browse", label: "Browse Talent" },
        { to: "/client/pricing", label: "Pricing" },
        { to: "/client/settings", label: "Settings" },
      ]}
    >
      <Outlet />
    </AppShell>
  );
}
