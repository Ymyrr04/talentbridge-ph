import { supabase } from "@/integrations/supabase/client";

export const VOICE_BUCKET = "voice-intros";
export const VOICE_MAX_BYTES = 10 * 1024 * 1024;
export const VOICE_MAX_SECONDS = 120;
export const VOICE_TYPES = ["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/wav", "audio/webm", "audio/ogg"];
export const VOCAROO_RE = /^https:\/\/(www\.)?(vocaroo\.com|voca\.ro)\/[A-Za-z0-9]+\/?$/;

export function isVocarooLink(s: string) {
  return VOCAROO_RE.test(s.trim());
}

export function validateAudioFile(f: File): string | null {
  if (!VOICE_TYPES.includes(f.type)) return "Please choose an MP3, M4A, WAV, WebM or OGG audio file.";
  if (f.size > VOICE_MAX_BYTES) return "Audio must be 10 MB or smaller.";
  return null;
}

export function readAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("audio");
    a.preload = "metadata";
    const done = (d: number) => { URL.revokeObjectURL(url); resolve(d); };
    a.onloadedmetadata = () => {
      if (a.duration === Infinity) {
        a.currentTime = 1e7;
        a.ontimeupdate = () => { a.ontimeupdate = null; done(a.duration); };
      } else done(a.duration);
    };
    a.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read this audio.")); };
    a.src = url;
  });
}

const EXT: Record<string, string> = {
  "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/wav": "wav", "audio/webm": "webm", "audio/ogg": "ogg",
};

export async function uploadVoice(ownerId: string, profileId: string, blob: Blob): Promise<string> {
  const type = blob.type.split(";")[0] || "audio/webm";
  const path = `${ownerId}/${profileId}/${crypto.randomUUID()}.${EXT[type] ?? "webm"}`;
  const { error } = await supabase.storage.from(VOICE_BUCKET).upload(path, blob, { contentType: type });
  if (error) throw error;
  return path;
}

export async function removeVoice(path: string | null | undefined) {
  if (!path) return;
  try {
    await supabase.storage.from(VOICE_BUCKET).remove([path]);
  } catch (e) {
    console.error("Failed to remove voice intro", e);
  }
}

export async function signedVoiceUrl(path: string, seconds = 3600): Promise<string> {
  const { data, error } = await supabase.storage.from(VOICE_BUCKET).createSignedUrl(path, seconds);
  if (error) throw error;
  return data.signedUrl;
}
