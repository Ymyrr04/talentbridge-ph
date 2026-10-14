import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export const dashboardPath = (role: AppRole) =>
  role === "admin"
    ? ("/admin/dashboard" as const)
    : role === "client"
      ? ("/client/dashboard" as const)
      : ("/applicant/dashboard" as const);

export async function fetchMyRole(userId: string): Promise<AppRole | null> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.role ?? null;
}

/** Client-only route guard: logged out -> /login, wrong role -> own dashboard. */
export async function requireRole(required: AppRole) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect({ to: "/login" });
  const role = await fetchMyRole(user.id);
  if (!role) {
    await supabase.auth.signOut();
    throw redirect({ to: "/login" });
  }
  // Admins may open every dashboard; other roles only their own.
  if (role !== required && role !== "admin") throw redirect({ to: dashboardPath(role) });
  return { user, role };
}
