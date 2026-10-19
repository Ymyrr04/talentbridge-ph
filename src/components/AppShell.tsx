import type { ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Settings, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { unreadCount, useMessagesRealtime } from "@/lib/messages";
import { Brand } from "./Brand";

export type NavItem = { to: string; label: string; exact?: boolean; unreadBadge?: boolean };

export function AppShell({ roleLabel, nav, children }: { roleLabel: string; nav: NavItem[]; children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasMessages = nav.some((n) => n.unreadBadge);
  useMessagesRealtime(hasMessages);
  const settingsItem = nav.find((n) => n.to.endsWith("/settings"));
  const mainNav = nav.filter((n) => n !== settingsItem);
  const { data: me } = useQuery({
    queryKey: ["shell-me"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("name, email").eq("id", user.id).maybeSingle();
      return { name: data?.name ?? "", email: data?.email ?? user.email ?? "" };
    },
  });
  const initials = (me?.name || me?.email || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Brand />
            <span className="hidden rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground sm:inline">
              {roleLabel}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Profile menu"
                className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground ring-offset-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {initials || <UserRound className="h-4 w-4" />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="truncate text-sm font-semibold">{me?.name || roleLabel}</p>
                {me?.email && <p className="truncate text-xs text-muted-foreground">{me.email}</p>}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {mainNav.map((n) => (
                <DropdownMenuItem key={n.to} onSelect={() => navigate({ to: n.to })}>
                  {n.label}
                  {n.unreadBadge && <UnreadBadge />}
                </DropdownMenuItem>
              ))}
              {settingsItem && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => navigate({ to: settingsItem.to })}>
                    <Settings className="h-4 w-4" /> Settings
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={signOut}>
                <LogOut className="h-4 w-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}


export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <div className="mt-1.5 text-sm text-muted-foreground">{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-primary">{icon}</div>
      <p className="mt-4 font-display text-lg font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
