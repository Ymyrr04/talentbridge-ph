import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/applicant")({
  ssr: false,
  beforeLoad: () => requireRole("applicant"),
  component: ApplicantLayout,
});

function ApplicantLayout() {
  return (
    <AppShell
      roleLabel="Applicant"
      nav={[
        { to: "/applicant/dashboard", label: "Dashboard" },
        { to: "/applicant/profiles", label: "Profiles" },
        { to: "/applicant/jobs", label: "Open Jobs" },
        { to: "/applicant/applications", label: "Applications" },
        { to: "/applicant/settings", label: "Settings" },
      ]}
    >
      <Outlet />
    </AppShell>
  );
}
