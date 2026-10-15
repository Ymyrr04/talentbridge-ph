import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import type { AdminData } from "@/lib/admin";

const config = {
  applicants: { label: "New applicants", color: "var(--chart-1)" },
  clients: { label: "New clients", color: "var(--chart-2)" },
  jobs: { label: "Job posts", color: "var(--chart-3)" },
} satisfies ChartConfig;

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function AdminAnalytics({ data }: { data: AdminData }) {
  const [range, setRange] = useState(14);

  const { series, today, totals } = useMemo(() => {
    const days: Record<string, { day: string; label: string; applicants: number; clients: number; jobs: number }> = {};
    const now = new Date();
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      days[dayKey(d)] = { day: dayKey(d), label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), applicants: 0, clients: 0, jobs: 0 };
    }
    const bump = (iso: string, k: "applicants" | "clients" | "jobs") => {
      const row = days[dayKey(new Date(iso))];
      if (row) row[k]++;
    };
    data.applicants.forEach((u) => bump(u.created_at, "applicants"));
    data.clients.forEach((u) => bump(u.created_at, "clients"));
    data.jobs.forEach((j) => bump(j.created_at, "jobs"));
    const series = Object.values(days);
    const today = series[series.length - 1]!;
    const totals = series.reduce((a, r) => ({ applicants: a.applicants + r.applicants, clients: a.clients + r.clients, jobs: a.jobs + r.jobs }), { applicants: 0, clients: 0, jobs: 0 });
    return { series, today, totals };
  }, [data, range]);

  const stats = [
    { label: "New applicants today", value: today.applicants },
    { label: "New clients today", value: today.clients },
    { label: "Job posts today", value: today.jobs },
    { label: `Applicants · last ${range} days`, value: totals.applicants },
    { label: `Job posts · last ${range} days`, value: totals.jobs },
    { label: "Open job posts now", value: data.jobs.filter((j) => j.status === "open").length },
  ];

  return (
    <section className="mb-10">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-display text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl border bg-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="font-display font-semibold">Daily activity</p>
          <div className="flex gap-1">
            {[7, 14, 30].map((n) => (
              <Button key={n} size="sm" variant={range === n ? "default" : "outline"} onClick={() => setRange(n)}>
                {n} days
              </Button>
            ))}
          </div>
        </div>
        <ChartContainer config={config} className="h-64 w-full">
          <BarChart data={series}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="applicants" fill="var(--color-applicants)" radius={3} />
            <Bar dataKey="clients" fill="var(--color-clients)" radius={3} />
            <Bar dataKey="jobs" fill="var(--color-jobs)" radius={3} />
          </BarChart>
        </ChartContainer>
      </div>
    </section>
  );
}
