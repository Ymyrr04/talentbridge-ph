import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { dashboardPath, fetchMyRole } from "@/lib/auth";

/**
 * Logo link. When the visitor already has a session, clicking TalentHub goes
 * to their role dashboard instead of the public landing page — the landing
 * page (and its Log in button) would otherwise look like a forced logout.
 */
export function Brand() {
  const navigate = useNavigate();
  return (
    <Link
      to="/"
      className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-foreground"
      onClick={(e) => {
        e.preventDefault();
        void (async () => {
          // Local read only; the target route's own guard validates the session.
          const { data } = await supabase.auth.getSession();
          const user = data.session?.user;
          if (!user) {
            navigate({ to: "/" });
            return;
          }
          const role = await fetchMyRole(user.id);
          navigate({ to: role ? dashboardPath(role) : "/" });
        })();
      }}
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm text-primary-foreground">T</span>
      TalentHub
    </Link>
  );
}
