// Preview-only test accounts. Only imported behind `import.meta.env.DEV`, so the
// published site never includes these.
import { supabase } from "@/integrations/supabase/client";

export const DEV_PASSWORD = "TalentHub2026!";
export const DEV_ACCOUNTS = {
  applicant: "maria.santos@sample.talenthub.ph",
  client: "hiring@sample-acme.com",
} as const;

export async function devSignIn(role: keyof typeof DEV_ACCOUNTS) {
  const { error } = await supabase.auth.signInWithPassword({ email: DEV_ACCOUNTS[role], password: DEV_PASSWORD });
  return !error;
}
