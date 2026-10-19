import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Brand } from "./Brand";

export function DashboardLayout({ userId, roleLabel, showAllDashboards = false }: { userId: string; roleLabel: string; showAllDashboards?: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    retryDelay: 500,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("name, email").eq("id", userId).maybeSingle();
      // Right after signup the session can lag a moment; throw so the query retries.
      if (!data) throw new Error("Profile not ready");
      return data;
    },
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  const name = profile?.name || profile?.email || "";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Brand />
            <span className="hidden rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground sm:inline">
              {roleLabel}
            </span>
          </div>
          <div className="flex items-center gap-2">
          {showAllDashboards && (
            <nav className="flex gap-1 text-sm">
              <Link to="/admin/dashboard" className="rounded-md px-2 py-1 text-muted-foreground hover:bg-muted" activeProps={{ className: "bg-muted text-foreground" }}>Admin</Link>
              <Link to="/applicant/dashboard" search={{}} className="rounded-md px-2 py-1 text-muted-foreground hover:bg-muted" activeProps={{ className: "bg-muted text-foreground" }}>Applicant</Link>
              <Link to="/client/dashboard" className="rounded-md px-2 py-1 text-muted-foreground hover:bg-muted" activeProps={{ className: "bg-muted text-foreground" }}>Client</Link>
            </nav>
          )}
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Log out</span>
          </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome{name ? `, ${name}` : ""}.
        </h1>
      </main>
    </div>
  );
}
