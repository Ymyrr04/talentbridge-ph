import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const APPLICATION_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  shortlisted: "Shortlisted",
  rejected: "Not selected",
};

export const myApplications = queryOptions({
  queryKey: ["my-applications"],
  queryFn: async () => {
    const { data, error } = await supabase.rpc("my_applications");
    if (error) throw error;
    return data ?? [];
  },
});

export const incomingApplications = queryOptions({
  queryKey: ["incoming-applications"],
  queryFn: async () => {
    const { data, error } = await supabase.rpc("incoming_applications");
    if (error) throw error;
    return data ?? [];
  },
});

export const myPublishedProfiles = queryOptions({
  queryKey: ["my-published-profiles"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return [];
    const { data, error } = await supabase
      .from("applicant_profiles")
      .select("id, role_title, hourly_rate")
      .eq("owner_id", u.user.id)
      .eq("status", "published")
      .order("created_at");
    if (error) throw error;
    return data;
  },
});

export function ApplicationStatusClass(status: string) {
  if (status === "shortlisted") return "bg-primary/10 text-primary";
  if (status === "rejected") return "bg-muted text-muted-foreground";
  return "bg-accent/20 text-accent-foreground";
}
