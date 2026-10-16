import { useEffect, useRef, useState } from "react";
import { Camera, Upload, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { readDuration, signedVideoUrl, validateVideoFile, VIDEO_MAX_SECONDS, VIDEO_TYPES } from "@/lib/introVideo";

export type VideoChange =
  | { kind: "keep" }
  | { kind: "remove" }
  | { kind: "new"; blob: Blob; duration: number };

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function IntroVideoField({ existingPath, value, onChange }: {
  existingPath: string | null;
  value: VideoChange;
  onChange: (v: VideoChange) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState<null | { stage: "live" | "review"; blob?: Blob; duration?: number }>(null);

  useEffect(() => {
    if (!existingPath) { setSavedUrl(null); return; }
    let off = false;
    signedVideoUrl(existingPath).then((u) => { if (!off) setSavedUrl(u); }).catch((e) => { console.error(e); });
    return () => { off = true; };
  }, [existingPath]);

  useEffect(() => {
    if (value.kind !== "new") { setNewUrl(null); return; }
    const u = URL.createObjectURL(value.blob);
    setNewUrl(u);
    return () => { URL.revokeObjectURL(u); };
  }, [value]);

  async function onFile(f: File | undefined) {
    if (!f) return;
    const err = validateVideoFile(f);
    if (err) { toast.error(err); return; }
    try {
      const d = await readDuration(f);
      if (d > VIDEO_MAX_SECONDS + 0.5) { toast.error("Video must be 2 minutes or shorter."); return; }
      onChange({ kind: "new", blob: f, duration: Math.round(d) });
    } catch {
      toast.error("Could not read this video.");
    }
  }

  const playerUrl = value.kind === "new" ? newUrl : value.kind === "keep" ? savedUrl : null;
  const hasVideo = value.kind === "new" || (value.kind === "keep" && !!existingPath);

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-6">
      <div className="flex items-center gap-2">
        <Video className="h-5 w-5 text-primary" />
        <p className="font-medium">Intro video (optional)</p>
      </div>

      {recording ? (
        <Recorder
          state={recording}
          setState={setRecording}
          onUse={(blob, duration) => { onChange({ kind: "new", blob, duration }); setRecording(null); }}
        />
      ) : hasVideo ? (
        <div className="space-y-3">
          {playerUrl ? (
            <video src={playerUrl} controls playsInline className="aspect-video w-full rounded-lg bg-muted" />
          ) : (
            <div className="aspect-video w-full animate-pulse rounded-lg bg-muted" />
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Replace</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setRecording({ stage: "live" })}><Camera className="h-4 w-4" /> Record new</Button>
            <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => onChange(existingPath ? { kind: "remove" } : { kind: "keep" })}>Remove</Button>
          </div>
          {value.kind === "new" && <p className="text-xs text-muted-foreground">New video ({fmt(value.duration)}) will be saved with the profile.</p>}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Upload video</Button>
          <Button type="button" variant="outline" onClick={() => setRecording({ stage: "live" })}><Camera className="h-4 w-4" /> Record video</Button>
        </div>
      )}
      {value.kind === "remove" && <p className="text-xs text-muted-foreground">Your video will be removed when you save.</p>}

      <input ref={fileRef} type="file" accept={VIDEO_TYPES.join(",")} className="sr-only"
        onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
      <p className="text-xs text-muted-foreground">MP4, WebM or MOV · up to 2 minutes · max 50 MB.</p>
      <p className="text-sm text-muted-foreground">Your video is only shared with employers you apply to.</p>
    </div>
  );
}

function Recorder({ state, setState, onUse }: {
  state: { stage: "live" | "review"; blob?: Blob; duration?: number };
  setState: (s: null | { stage: "live" | "review"; blob?: Blob; duration?: number }) => void;
  onUse: (blob: Blob, duration: number) => void;
}) {
  const liveRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const [isRec, setIsRec] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [reviewUrl, setReviewUrl] = useState<string | null>(null);

  // Open camera in live stage
  useEffect(() => {
    if (state.stage !== "live") return;
    let cancelled = false;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = s;
        if (liveRef.current) liveRef.current.srcObject = s;
      } catch (e) {
        console.error(e);
        toast.error("Allow camera and microphone access to record.");
        setState(null);
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [state.stage, setState]);

  // Timer + auto-stop
  useEffect(() => {
    if (!isRec) return;
    const start = Date.now();
    const id = setInterval(() => {
      const s = (Date.now() - start) / 1000;
      setElapsed(s);
      if (s >= VIDEO_MAX_SECONDS) stop();
    }, 250);
    return () => { clearInterval(id); };
  }, [isRec]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!state.blob) { setReviewUrl(null); return; }
    const u = URL.createObjectURL(state.blob);
    setReviewUrl(u);
    return () => { URL.revokeObjectURL(u); };
  }, [state.blob]);

  function start() {
    const s = streamRef.current;
    if (!s) return;
    const mime = ["video/webm;codecs=vp9,opus", "video/webm", "video/mp4"].find((m) => MediaRecorder.isTypeSupported(m));
    const rec = new MediaRecorder(s, mime ? { mimeType: mime } : undefined);
    const chunks: Blob[] = [];
    const t0 = Date.now();
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: (rec.mimeType || "video/webm").split(";")[0] });
      const duration = Math.min(VIDEO_MAX_SECONDS, Math.round((Date.now() - t0) / 1000));
      setState({ stage: "review", blob, duration });
    };
    rec.start(1000);
    recRef.current = rec;
    setElapsed(0);
    setIsRec(true);
  }

  function stop() {
    setIsRec(false);
    if (recRef.current?.state === "recording") recRef.current.stop();
  }

  if (state.stage === "review" && state.blob) {
    return (
      <div className="space-y-3">
        {reviewUrl && <video src={reviewUrl} controls playsInline className="aspect-video w-full rounded-lg bg-muted" />}
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => onUse(state.blob!, state.duration ?? 0)}>Use this video</Button>
          <Button type="button" variant="outline" onClick={() => setState({ stage: "live" })}>Retake</Button>
          <Button type="button" variant="ghost" onClick={() => setState(null)}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <video ref={liveRef} autoPlay muted playsInline className="aspect-video w-full -scale-x-100 rounded-lg bg-muted object-cover" />
        <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium tabular-nums">
          {isRec && <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-destructive" />}
          {fmt(elapsed)} / {fmt(VIDEO_MAX_SECONDS)}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {isRec ? (
          <Button type="button" variant="destructive" onClick={stop}>Stop</Button>
        ) : (
          <Button type="button" onClick={start}>Start recording</Button>
        )}
        <Button type="button" variant="ghost" onClick={() => { stop(); setState(null); }}>Cancel</Button>
      </div>
    </div>
  );
}
