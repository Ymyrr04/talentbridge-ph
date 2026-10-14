import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { FlaskConical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { devSignIn } from "./devAccounts";

export default function DevRoleSwitcher() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function switchTo(role: "applicant" | "client" | "admin") {
    setBusy(true);
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    if (role === "admin") {
      setBusy(false);
      setOpen(false);
      navigate({ to: "/login", replace: true });
      return;
    }
    await devSignIn(role);
    setBusy(false);
    setOpen(false);
    navigate({ to: role === "client" ? "/client/dashboard" : "/applicant/dashboard", replace: true });
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {open && (
        <div className="mb-2 w-56 rounded-xl border bg-card p-3 text-sm shadow-lg">
          <p className="mb-2 font-semibold">Test as… <span className="font-normal text-muted-foreground">(preview only)</span></p>
          {(["applicant", "client", "admin"] as const).map((r) => (
            <button
              key={r}
              disabled={busy}
              onClick={() => switchTo(r)}
              className="mb-1 block w-full rounded-md px-2 py-1.5 text-left capitalize hover:bg-muted disabled:opacity-50"
            >
              {r}
              {r === "admin" && <span className="block text-xs normal-case text-muted-foreground">Log in with your own account</span>}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Test role switcher"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
      >
        <FlaskConical className="h-5 w-5" />
      </button>
    </div>
  );
}
