import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { dashboardPath, fetchMyRole } from "@/lib/auth";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — TalentHub" },
      { name: "description", content: "Log in to your TalentHub account." },
      { property: "og:title", content: "Log in — TalentHub" },
      { property: "og:description", content: "Log in to your TalentHub account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return setError(
        error.message.toLowerCase().includes("not confirmed")
          ? "Please verify your email first — check your inbox for the link."
          : error.message,
      );
    }
    const role = await fetchMyRole(data.user.id);
    setLoading(false);
    if (!role) {
      await supabase.auth.signOut();
      return setError("Your account has no role assigned. Please contact support.");
    }
    navigate({ to: dashboardPath(role), replace: true });
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue to TalentHub.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot password?</Link>
          </div>
          <Input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Logging in…" : "Log in"}</Button>
        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/signup/applicant" className="font-medium text-primary hover:underline">Applicant</Link>
          {" · "}
          <Link to="/signup/client" className="font-medium text-primary hover:underline">Client</Link>
        </p>
      </form>
    </AuthShell>
  );
}
