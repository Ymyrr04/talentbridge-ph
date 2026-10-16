import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { myPublishedProfiles } from "@/lib/applications";

export type ApplyJob = { id: string; title: string };

export function ApplyDialog({ job, onClose }: { job: ApplyJob | null; onClose: () => void }) {
  const { data: profiles } = useSuspenseQuery(myPublishedProfiles);
  const qc = useQueryClient();
  const [profileId, setProfileId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const selected = profileId || profiles[0]?.id || "";

  async function submit() {
    if (!job || !selected) return;
    setBusy(true);
    const { error } = await supabase.rpc("apply_to_job", { _job_id: job.id, _profile_id: selected, _note: note.trim() });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Application sent");
    setNote("");
    setProfileId("");
    await qc.invalidateQueries({ queryKey: ["my-applications"] });
    onClose();
  }

  return (
    <Dialog open={!!job} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply: {job?.title}</DialogTitle>
          <DialogDescription>The client will see your name, email, chosen profile and note.</DialogDescription>
        </DialogHeader>
        {profiles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You need a published profile to apply.{" "}
            <Link to="/applicant/profiles" className="font-medium text-primary underline">Go to your profiles</Link>
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Profile to send</Label>
              <Select value={selected} onValueChange={setProfileId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.role_title} · ${Number(p.hourly_rate)}/hr</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Short note (optional)</Label>
              <Textarea id="note" rows={5} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why you're a good fit…" />
              <p className="text-right text-xs text-muted-foreground">{note.length}/2000</p>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy || profiles.length === 0}>{busy ? "Sending…" : "Send application"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
