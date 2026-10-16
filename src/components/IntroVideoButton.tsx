import { useState } from "react";
import { Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { signedVideoUrl } from "@/lib/introVideo";

export function IntroVideoButton({ path, applicantName }: { path: string; applicantName: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function openPlayer() {
    try {
      setUrl(await signedVideoUrl(path, 3600));
      setOpen(true);
    } catch (e) {
      console.error(e);
      toast.error("Could not load this video.");
    }
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={openPlayer}><Video className="h-4 w-4" /> Intro video</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{applicantName || "Applicant"} — intro video</DialogTitle></DialogHeader>
          {url && <video src={url} controls autoPlay playsInline className="aspect-video w-full rounded-lg bg-muted" />}
        </DialogContent>
      </Dialog>
    </>
  );
}
