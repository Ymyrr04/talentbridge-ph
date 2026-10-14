import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { dashboardPath, fetchMyRole } from "@/lib/auth";
import { MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export function SignupForm({ role }: { role: "applicant" | "client" }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (role === "applicant" && !agreed) {
      setError("Please agree to the Privacy Policy to continue.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/login`, data: { name, role } },
    });
    setLoading(false);
    if (error) return setError(error.message);
    // Existing email: Supabase returns a user with no identities
    if (data.user && data.user.identities?.length === 0) {
      return setError("An account with this email already exists. Please log in.");
    }
    if (data.session && data.user) {
      const r = await fetchMyRole(data.user.id);
      if (r) return navigate({ to: dashboardPath(r), replace: true });
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center">
        <MailCheck className="mx-auto h-10 w-10 text-primary" />
        <p className="mt-3 font-medium">Check your email</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We sent a verification link to <span className="font-medium text-foreground">{email}</span>. Confirm it, then log in.
        </p>
        <Button asChild variant="outline" className="mt-6 w-full">
          <Link to="/login">Go to login</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">{role === "client" ? "Full name or company" : "Full name"}</Label>
        <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <p className="text-xs text-muted-foreground">At least 8 characters.</p>
      </div>
      {role === "applicant" && (
        <div className="flex items-start gap-2.5">
          <Checkbox id="agree" checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
          <Label htmlFor="agree" className="text-sm font-normal leading-snug">
            I agree to the{" "}
            <a href="#" className="font-medium text-primary underline-offset-4 hover:underline">
              Privacy Policy
            </a>
          </Label>
        </div>
      )}
      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading || (role === "applicant" && !agreed)}>
        {loading ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link>
      </p>
    </form>
  );
}
