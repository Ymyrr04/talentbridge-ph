import { useEffect, useRef, useState } from "react";

export function useRecordingMedia(video: boolean, active = true) {
  const [deviceId, setDeviceId] = useState("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [muted, setMuted] = useState(false);
  const generation = useRef(0);

  useEffect(() => {
    if (!active) { setStream(null); return; }
    const current = ++generation.current;
    let cancelled = false;
    let media: MediaStream | undefined;
    let context: AudioContext | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;
    setStream(null);
    setError(null);
    setLevel(0);
    setMuted(false);
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
          throw new Error("Recording isn't supported in this browser. Try a current version of Chrome or Safari.");
        }
        media = await navigator.mediaDevices.getUserMedia({
          video,
          audio: { ...(deviceId ? { deviceId: { exact: deviceId } } : {}), echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        if (cancelled || generation.current !== current) { media.getTracks().forEach((t) => t.stop()); return; }
        const track = media.getAudioTracks()[0];
        if (!track || track.readyState !== "live") throw new Error("No microphone is available. Connect a microphone and try again.");
        track.enabled = true;
        setMuted(track.muted);
        track.onmute = () => { if (!cancelled) setMuted(true); };
        track.onunmute = () => { if (!cancelled) setMuted(false); };
        track.onended = () => { if (!cancelled) { setStream(null); setError("Microphone disconnected. Choose a microphone and try again."); } };
        setStream(media);
        const available = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) setDevices(available.filter((d) => d.kind === "audioinput"));
        // Analyze only: never connect the live microphone to speakers (feedback).
        try {
          context = new AudioContext();
          await context.resume();
          if (cancelled) { await context.close(); return; }
          const source = context.createMediaStreamSource(media);
          const analyser = context.createAnalyser();
          analyser.fftSize = 512;
          source.connect(analyser);
          const samples = new Uint8Array(analyser.fftSize);
          timer = setInterval(() => {
            analyser.getByteTimeDomainData(samples);
            const rms = Math.sqrt(samples.reduce((sum, n) => sum + ((n - 128) / 128) ** 2, 0) / samples.length);
            setLevel(Math.min(8, Math.ceil(rms * 80)));
          }, 150);
        } catch { /* Recording remains available if metering is unsupported. */ }
      } catch (err) {
        media?.getTracks().forEach((t) => t.stop());
        if (!cancelled) setError(err instanceof Error && err.name === "Error" ? err.message : video
          ? "Allow camera and microphone access to record."
          : "Allow microphone access to record.");
      }
    })();
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      media?.getTracks().forEach((t) => t.stop());
      if (context && context.state !== "closed") void context.close().catch(() => {});
    };
  }, [video, active, deviceId]);

  return { stream, devices, deviceId, setDeviceId, error, level, muted };
}