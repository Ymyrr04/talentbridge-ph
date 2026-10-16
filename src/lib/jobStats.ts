import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const myJobStats = queryOptions({
  queryKey: ["my-job-stats"],
  queryFn: async () => {
    const { data, error } = await supabase.rpc("my_job_stats");
    if (error) throw error;
    return (data ?? []).map((r) => ({
      ...r,
      views: Number(r.views), applicants: Number(r.applicants),
      pending: Number(r.pending), shortlisted: Number(r.shortlisted), rejected: Number(r.rejected),
      contacted: Number(r.contacted),
    }));
  },
});

/** Applicants ÷ views as a whole percent; "–" when there are no views. */
export function applyRate(applicants: number, views: number): string {
  if (!views) return "–";
  return `${Math.round((applicants / views) * 100)}%`;
}
