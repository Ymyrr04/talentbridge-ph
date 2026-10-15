import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: () => requireRole("admin"),
  component: () => (
    <AppShell
      roleLabel="Admin"
      nav={[
        { to: "/admin/dashboard", label: "Dashboard" },
        { to: "/applicant/dashboard", label: "Applicant area" },
        { to: "/client/dashboard", label: "Client area" },
      ]}
    >
      <Outlet />
    </AppShell>
  ),
});
