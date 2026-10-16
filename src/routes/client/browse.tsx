import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Users } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const talentQuery = queryOptions({
  queryKey: ["browse-talent"],
  queryFn: async () => {
    const { data, error } = await supabase.rpc("browse_talent");
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/client/browse")({
  head: () => ({ meta: [{ title: "Browse Talent Pool — TalentHub" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(talentQuery),
  component: BrowsePage,
});

function BrowsePage() {
  const { data } = useSuspenseQuery(talentQuery);
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const list = term ? data.filter((t) => t.role_title.toLowerCase().includes(term)) : data;

  return (
    <>
      <PageHeader title="Browse Talent Pool" subtitle={`${data.length} available professional${data.length === 1 ? "" : "s"}`} />
      {data.length === 0 ? (
        <EmptyState icon={<Users className="h-6 w-6" />} title="No talent yet" body="Published applicant profiles will appear here." />
      ) : (
        <>
          <div className="relative mb-6 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by role" className="pl-9" aria-label="Search talent by role" />
          </div>
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matches for “{q}”.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((t) => (
                <div key={t.id} className="rounded-xl border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                      {t.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{t.role_title}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-lg font-semibold">
                    ${Number(t.hourly_rate).toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/hr</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
