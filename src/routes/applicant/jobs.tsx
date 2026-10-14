import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Briefcase } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

const jobsQuery = queryOptions({
  queryKey: ["browse-jobs"],
  queryFn: async () => {
    const { data, error } = await supabase.rpc("browse_jobs");
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/applicant/jobs")({
  head: () => ({ meta: [{ title: "Open Jobs — TalentHub" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(jobsQuery),
  component: JobsPage,
});

function JobsPage() {
  const { data } = useSuspenseQuery(jobsQuery);

  return (
    <>
      <PageHeader title="Open Jobs" subtitle={`${data.length} open role${data.length === 1 ? "" : "s"} from clients`} />
      {data.length === 0 ? (
        <EmptyState icon={<Briefcase className="h-6 w-6" />} title="No open jobs yet" body="Job posts that clients publish will appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((j) => (
            <article key={j.id} className="flex flex-col rounded-xl border bg-card p-5 shadow-sm">
              <h3 className="font-semibold leading-snug">{j.title}</h3>
              <p className="mt-2 line-clamp-4 flex-1 text-sm text-muted-foreground">{j.description}</p>
              <p className="mt-4 text-xs text-muted-foreground">
                Posted {new Date(j.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
