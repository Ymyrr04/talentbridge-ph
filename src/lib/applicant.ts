import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const MAX_PROFILES = 3;

export const myApplicantProfiles = (userId: string) =>
  queryOptions({
    queryKey: ["applicant-profiles", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applicant_profiles")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

export const CV_MAX_BYTES = 5 * 1024 * 1024;
export const CV_EXTENSIONS = ["pdf", "docx"];

export function validateCv(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!CV_EXTENSIONS.includes(ext)) return "CV must be a PDF or DOCX file.";
  if (file.size > CV_MAX_BYTES) return "CV must be 5 MB or smaller.";
  return null;
}

export async function uploadCv(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()!.toLowerCase();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("cv-uploads").upload(path, file, {
    contentType:
      ext === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  if (error) throw error;
  return path;
}

export async function removeCv(path: string | null | undefined) {
  if (!path) return;
  const { error } = await supabase.storage.from("cv-uploads").remove([path]);
  if (error) console.error("Failed to remove CV", error);
}

export const myCv = (userId: string) =>
  queryOptions({
    queryKey: ["applicant-cv", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("applicant_cvs").select("*").eq("owner_id", userId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

/** Uploads a new CV, saves it as the applicant's single CV, and removes the old file. */
export async function replaceCv(userId: string, file: File, oldPath: string | null | undefined) {
  const v = validateCv(file);
  if (v) throw new Error(v);
  const path = await uploadCv(userId, file);
  const { error } = await supabase
    .from("applicant_cvs")
    .upsert({ owner_id: userId, cv_path: path, cv_original_filename: file.name }, { onConflict: "owner_id" });
  if (error) {
    await removeCv(path);
    throw error;
  }
  if (oldPath && oldPath !== path) await removeCv(oldPath);
}

export async function openCvFile(path: string) {
  const { data, error } = await supabase.storage.from("cv-uploads").createSignedUrl(path, 60);
  if (error) throw error;
  window.open(data.signedUrl, "_blank", "noopener");
}
