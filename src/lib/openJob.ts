import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const jobQuery = (id: string) =>
  queryOptions({
    queryKey: ["open-job", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_open_job", { _id: id });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });