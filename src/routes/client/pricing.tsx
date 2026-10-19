import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

const tiers = [
  { name: "Free", price: "$0" },
  { name: "Tier 1", price: "$—" },
  { name: "Tier 2", price: "$—" },
  { name: "Tier 3", price: "$—" },
];

export const Route = createFileRoute("/client/pricing")({
  head: () => ({ meta: [{ title: "Pricing — TalentHub" }, { name: "description", content: "Pricing for your TalentHub remote talent marketplace account." }, { property: "og:title", content: "Pricing — TalentHub" }, { property: "og:description", content: "Pricing for your TalentHub remote talent marketplace account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <>
      <PageHeader title="Pricing" subtitle="Plans are coming soon." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((t, i) => (
          <div key={t.name} className={`flex flex-col rounded-2xl border bg-card p-6 ${i === 2 ? "border-primary shadow-elevated" : ""}`}>
            <p className="font-display text-lg font-semibold">{t.name}</p>
            <p className="mt-4 font-display text-3xl font-bold">{t.price}<span className="text-sm font-medium text-muted-foreground"> /month</span></p>
            <p className="mt-2 text-sm text-muted-foreground">Details to be announced.</p>
            <Button className="mt-8" variant={i === 2 ? "default" : "outline"} disabled>Coming Soon</Button>
          </div>
        ))}
      </div>
    </>
  ),
});
