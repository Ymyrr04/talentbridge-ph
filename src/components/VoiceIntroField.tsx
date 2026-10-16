import { useEffect, useRef, useState } from "react";
import { ExternalLink, Link2, Mic, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isVocarooLink, readAudioDuration, signedVoiceUrl, validateAudioFile, VOICE_MAX_SECONDS, VOICE_TYPES } from "@/lib/voiceIntro";

export type VoiceChange =
  | { kind: "keep" }
  | { kind: "remove" }
  | { kind: "file"; blob: Blob }
  | { kind: "link"; url: string };

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function VoiceIntroField({ existingPath, existingLink, value, onChange }: {
  existingPath: string | null;
  existingLink: string | null;
  value: VoiceChange;
  onChange: (v: VoiceChange) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<null | "record" | "link">(null);
  const [linkText, setLinkText] = useState("");

  useEffect(() => {
    if (!existingPath) { setSavedUrl(null); return; }
    let off = false;
    signedVoiceUrl(existingPath).then((u) => { if (!off) setSavedUrl(u); }).catch((e) => { console.error(e); });
    return () => { off = true; };
  }, [existingPath]);

  useEffect(() => {
    if (value.kind !== "file") { setNewUrl(null); return; }
    const u = URL.createObjectURL(value.blob);
    setNewUrl(u);
    return () => { URL.revokeObjectURL(u); };
  }, [value]);

  async function onFile(f: File | undefined) {
    if (!f) return;
    const err = validateAudioFile(f);
    if (err) { toast.error(err); return; }
    try {
      const d = await readAudioDuration(f);
      if (d > VOICE_MAX_SECONDS + 0.5) { toast.error("Audio must be 2 minutes or shorter."); return; }
      onChange({ kind: "file", blob: f });
      setMode(null);
    } catch {
      toast.error("Could not read this audio.");
    }
  }

  function saveLink() {
    const v = linkText.trim();
    if (!isVocarooLink(v)) { toast.error("Paste a vocaroo.com or voca.ro link."); return; }
    onChange({ kind: "link", url: v });
    setMode(null);
    setLinkText("");
  }

  const current =
    value.kind === "file" ? { type: "audio" as const, src: newUrl }
    : value.kind === "link" ? { type: "link" as const, src: value.url }
    : value.kind === "keep" && existingPath ? { type: "audio" as const, src: savedUrl }
    : value.kind === "keep" && existingLink ? { type: "link" as const, src: existingLink }
    : null;
  const hadSaved = !!(existingPath || existingLink);

  const options = (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Upload audio</Button>
      <Button type="button" variant="outline" size="sm" onClick={() => setMode("record")}><Mic className="h-4 w-4" /> Record audio</Button>
      <Button type="button" variant="outline" size="sm" onClick={() => setMode("link")}><Link2 className="h-4 w-4" /> Vocaroo link</Button>
    </div>
  );

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-6">
      <div className="flex items-center gap-2">
        <Mic className="h-5 w-5 text-primary" />
        <p className="font-medium">Voice intro (optional)</p>
      </div>

      {mode === "record" ? (
        <AudioRecorder onCancel={() => setMode(null)} onUse={(blob) => { onChange({ kind: "file", blob }); setMode(null); }} />
      ) : mode === "link" ? (
        <div className="space-y-2">
          <Input placeholder="https://voca.ro/…" value={linkText} onChange={(e) => setLinkText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveLink(); } }} />
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={saveLink}>Use link</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setMode(null)}>Cancel</Button>
          </div>
        </div>
      ) : current ? (
        <div className="space-y-3">
          {current.type === "audio" ? (
            current.src ? <audio src={current.src} controls className="w-full" /> : <div className="h-10 animate-pulse rounded-md bg-muted" />
          ) : (
            <a href={current.src} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline">
              {current.src} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <div className="flex flex-wrap gap-2">
            <ReplaceMenu onUpload={() => fileRef.current?.click()} onRecord={() => setMode("record")} onLink={() => setMode("link")} />
            <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => onChange(hadSaved ? { kind: "remove" } : { kind: "keep" })}>Remove</Button>
          </div>
        </div>
      ) : (
        options
      )}
      {value.kind === "remove" && <p className="text-xs text-muted-foreground">Your voice intro will be removed when you save.</p>}

      <input ref={fileRef} type="file" accept={VOICE_TYPES.join(",")} className="sr-only"
        onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
      <p className="text-xs text-muted-foreground">MP3, M4A, WAV, WebM or OGG · up to 2 minutes · max 10 MB.</p>
      <p className="text-sm text-muted-foreground">Your voice intro is only shared with employers you apply to.</p>
    </div>
  );
}

function ReplaceMenu({ onUpload, onRecord, onLink }: { onUpload: () => void; onRecord: () => void; onLink: () => void }) {
  const [open, setOpen] = useState(false);
  if (!open) return <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>Replace</Button>;
  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={onUpload}><Upload className="h-4 w-4" /> Upload</Button>
      <Button type="button" variant="outline" size="sm" onClick={onRecord}><Mic className="h-4 w-4" /> Record</Button>
      <Button type="button" variant="outline" size="sm" onClick={onLink}><Link2 className="h-4 w-4" /> Vocaroo link</Button>
    </>
  );
}

function AudioRecorder({ onUse, onCancel }: { onUse: (b: Blob) => void; onCancel: () => void }) {
  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const [ready, setReady] = useState(false);
  const [isRec, setIsRec] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = s;
        setReady(true);
      } catch (e) {
        console.error(e);
        toast.error("Allow microphone access to record.");
        onCancel();
      }
    })();
    return () => {
      cancelled = true;
      if (recRef.current?.state === "recording") recRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isRec) return;
    const t0 = Date.now();
    const id = setInterval(() => {
      const s = (Date.now() - t0) / 1000;
      setElapsed(s);
      if (s >= VOICE_MAX_SECONDS) stop();
    }, 250);
    return () => { clearInterval(id); };
  }, [isRec]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!blob) { setUrl(null); return; }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => { URL.revokeObjectURL(u); };
  }, [blob]);

  function start() {
    const s = streamRef.current;
    if (!s) return;
    const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find((m) => MediaRecorder.isTypeSupported(m));
    const rec = new MediaRecorder(s, mime ? { mimeType: mime } : undefined);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = () => { setBlob(new Blob(chunks, { type: (rec.mimeType || "audio/webm").split(";")[0] ?? "audio/webm" })); };
    rec.start(1000);
    recRef.current = rec;
    setBlob(null);
    setElapsed(0);
    setIsRec(true);
  }

  function stop() {
    setIsRec(false);
    if (recRef.current?.state === "recording") recRef.current.stop();
  }

  if (blob) {
    return (
      <div className="space-y-3">
        {url && <audio src={url} controls className="w-full" />}
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => onUse(blob)}>Use this recording</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setBlob(null)}>Retake</Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium tabular-nums">
        {isRec && <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-destructive" />}
        {fmt(elapsed)} / {fmt(VOICE_MAX_SECONDS)}
      </span>
      {isRec ? (
        <Button type="button" variant="destructive" size="sm" onClick={stop}>Stop</Button>
      ) : (
        <Button type="button" size="sm" disabled={!ready} onClick={start}>Start recording</Button>
      )}
      <Button type="button" variant="ghost" size="sm" onClick={() => { stop(); onCancel(); }}>Cancel</Button>
    </div>
  );
}
