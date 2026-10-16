import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { suggestProfiles } from "@/lib/profileSuggestions.functions";
import { cleanSuggestions, type ProfileSuggestion } from "@/lib/profileSuggestions";
import { StandardProfile } from "@/components/StandardProfile";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ProfileSuggestionsDialog({
  open, onOpenChange, userId, cvPath, accountName, onUse,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  cvPath: string;
  accountName: string | undefined;
  onUse: (s: ProfileSuggestion) => void;
}) {
  const run = useServerFn(suggestProfiles);
  const [items, setItems] = useState<ProfileSuggestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show saved suggestions for the current CV without a new AI call.
  useEffect(() => {
    if (!open || items) { return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("profile_suggestions").select("cv_path, payload").eq("owner_id", userId).maybeSingle();
      if (!cancelled && data && data.cv_path === cvPath) {
        const s = cleanSuggestions(data.payload);
        if (s.length) setItems(s);
      }
    })();
    return () => { cancelled = true; };
  }, [open, items, userId, cvPath]);

  async function suggest() {
    setLoading(true);
    setError(null);
    try {
      const res = await run();
      setItems(res.suggestions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) onOpenChange(v); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Want us to suggest profiles from your CV?</DialogTitle>
          <DialogDescription>Based only on your CV. Check every line before publishing. Your CV is read by AI to make these suggestions.</DialogDescription>
        </DialogHeader>
        {loading ? (
          <p className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Reading your CV… about 20 seconds</p>
        ) : items ? (
          <div className="grid gap-4 md:grid-cols-3">
            {items.map((s, i) => (
              <div key={i} className="flex flex-col rounded-2xl border bg-card p-4">
                <StandardProfile
                  className="flex-1"
                  rateLabel="$__.__/hr"
                  data={{ name: accountName, roleTitle: s.role_title, hourlyRate: null, years: s.years_experience, pastTitles: s.past_titles, industries: s.industries, highlights: s.highlights.slice(0, 4), tools: s.tools, education: s.education, availability: [], hours: null, timeZones: [] }}
                />
                {s.highlights.length > 4 && <p className="mt-1 text-xs text-muted-foreground">…and {s.highlights.length - 4} more</p>}
                {s.skills.length > 0 && <p className="mt-3 text-xs text-muted-foreground">Skills: {s.skills.join(", ")}</p>}
                <Button className="mt-4" onClick={() => { onUse(s); onOpenChange(false); }}>Use this</Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-3 pt-2">
            <Button onClick={suggest}><Sparkles className="h-4 w-4" /> Suggest profiles</Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Skip</Button>
          </div>
        )}
        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}
