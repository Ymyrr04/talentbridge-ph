import { useState } from "react";
import { ExternalLink, Mic } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { signedVoiceUrl } from "@/lib/voiceIntro";

export function VoiceIntroButton({ path, link, applicantName }: { path: string | null; link: string | null; applicantName: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  if (!path && link) {
    return (
      <Button asChild variant="outline" size="sm">
        <a href={link} target="_blank" rel="noopener noreferrer"><Mic className="h-4 w-4" /> Voice intro <ExternalLink className="h-3 w-3" /></a>
      </Button>
    );
  }
  if (!path) return null;

  async function openPlayer() {
    try {
      setUrl(await signedVoiceUrl(path!, 3600));
      setOpen(true);
    } catch (e) {
      console.error(e);
      toast.error("Could not load this voice intro.");
    }
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={openPlayer}><Mic className="h-4 w-4" /> Voice intro</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{applicantName || "Applicant"} — voice intro</DialogTitle></DialogHeader>
          {url && <audio src={url} controls autoPlay className="w-full" />}
        </DialogContent>
      </Dialog>
    </>
  );
}
