import { supabase } from "@/integrations/supabase/client";

export const VIDEO_BUCKET = "intro-videos";
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024;
export const VIDEO_MAX_SECONDS = 120;
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export function validateVideoFile(f: File): string | null {
  if (!VIDEO_TYPES.includes(f.type)) return "Please choose an MP4, WebM or MOV video.";
  if (f.size > VIDEO_MAX_BYTES) return "Video must be 50 MB or smaller.";
  return null;
}

/** Reads a video's duration in seconds from its metadata. */
export function readDuration(blob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      // Recorded WebM often reports Infinity until seeked.
      if (v.duration === Infinity) {
        v.currentTime = 1e7;
        v.ontimeupdate = () => {
          v.ontimeupdate = null;
          URL.revokeObjectURL(url);
          resolve(v.duration);
        };
      } else {
        URL.revokeObjectURL(url);
        resolve(v.duration);
      }
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this video."));
    };
    v.src = url;
  });
}

const extFor = (type: string) => (type.includes("mp4") ? "mp4" : type.includes("quicktime") ? "mov" : "webm");

export async function uploadVideo(ownerId: string, profileId: string, blob: Blob): Promise<string> {
  const type = blob.type.split(";")[0] || "video/webm";
  const path = `${ownerId}/${profileId}/${crypto.randomUUID()}.${extFor(type)}`;
  const { error } = await supabase.storage.from(VIDEO_BUCKET).upload(path, blob, { contentType: type });
  if (error) throw error;
  return path;
}

export async function removeVideo(path: string | null | undefined) {
  if (!path) return;
  try {
    await supabase.storage.from(VIDEO_BUCKET).remove([path]);
  } catch (e) {
    console.error("Failed to remove video", e);
  }
}

export async function signedVideoUrl(path: string, seconds = 3600): Promise<string> {
  const { data, error } = await supabase.storage.from(VIDEO_BUCKET).createSignedUrl(path, seconds);
  if (error) throw error;
  return data.signedUrl;
}
