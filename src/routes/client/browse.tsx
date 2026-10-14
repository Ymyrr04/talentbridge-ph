import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/client/browse")({
  head: () => ({ meta: [{ title: "Browse Talent Pool — TalentHub" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <>
      <PageHeader title="Browse Talent Pool" />
      <EmptyState icon={<Users className="h-6 w-6" />} title="Talent pool coming soon" body="You'll be able to discover vetted Filipino remote professionals here." />
    </>
  ),
});
