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
  if (path) await supabase.storage.from("cv-uploads").remove([path]);
}
