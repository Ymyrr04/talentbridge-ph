import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MESSAGE_MAX, conversationsByApplication } from "@/lib/messages";

export function MessageApplicantButton({ applicationId, applicantName }: { applicationId: string; applicantName: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: map = {} } = useQuery(conversationsByApplication);
  const existing = map[applicationId];
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function start() {
    const text = body.trim();
    if (!text) { toast.error("Write a message first."); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc("start_conversation", { _application_id: applicationId, _body: text });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["conversations"] }),
      qc.invalidateQueries({ queryKey: ["incoming-applications"] }),
    ]);
    setOpen(false);
    navigate({ to: "/client/messages", search: { c: data as string } });
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => (existing ? navigate({ to: "/client/messages", search: { c: existing } }) : setOpen(true))}
      >
        <MessageSquare className="h-4 w-4" /> Message
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message {applicantName || "applicant"}</DialogTitle>
            <DialogDescription>Start a conversation about this application.</DialogDescription>
          </DialogHeader>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a message" maxLength={MESSAGE_MAX} rows={5} />
          <p className="text-right text-xs text-muted-foreground">{body.length}/{MESSAGE_MAX}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={start} disabled={busy || !body.trim()}>Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
