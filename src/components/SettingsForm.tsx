import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsForm({ userId, showPhone = false }: { userId: string; showPhone?: boolean }) {
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile-full", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("name, email, phone").eq("id", userId).single();
      if (error) throw error;
      return data;
    },
  });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const update: { name: string; phone?: string | null } = { name: name.trim() };
      if (showPhone) update.phone = phone.trim() || null;
      const { error } = await supabase.from("profiles").update(update).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["profile-full", userId] });
      qc.invalidateQueries({ queryKey: ["profile", userId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        className="space-y-4 rounded-2xl border bg-card p-6"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <h2 className="font-display text-lg font-semibold">Account</h2>
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={profile?.email ?? ""} readOnly disabled />
        </div>
        {showPhone && (
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Input id="phone" type="tel" maxLength={30} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        )}
        <Button type="submit" disabled={save.isPending || !profile}>{save.isPending ? "Saving…" : "Save changes"}</Button>
      </form>
      <PasswordForm />
    </div>
  );
}

function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (next !== confirm) return setError("New passwords don't match.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: next, current_password: current } as never);
    setLoading(false);
    if (error) return setError(error.message);
    setCurrent("");
    setNext("");
    setConfirm("");
    toast.success("Password updated");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border bg-card p-6">
      <h2 className="font-display text-lg font-semibold">Change password</h2>
      <div className="space-y-1.5">
        <Label htmlFor="cur">Current password</Label>
        <Input id="cur" type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new">New password</Label>
        <Input id="new" type="password" required minLength={8} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="conf">Confirm new password</Label>
        <Input id="conf" type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>{loading ? "Updating…" : "Update password"}</Button>
    </form>
  );
}
