import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const myJobPosts = (userId: string) =>
  queryOptions({
    queryKey: ["job-posts", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_posts")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const JOB_STATUS_LABEL: Record<string, string> = { draft: "Draft", open: "Open", closed: "Closed" };
