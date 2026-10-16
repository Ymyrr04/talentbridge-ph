import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { cleanSuggestions, SUGGESTION_LIMIT_MESSAGE, type ProfileSuggestion } from "@/lib/profileSuggestions";

/** Reads ONLY the caller's own CV server-side and returns 3 AI profile suggestions. */
export const suggestProfiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ suggestions: ProfileSuggestion[]; cached: boolean }> => {
    const { supabase, userId } = context;
    const { data: isApplicant } = await supabase.rpc("has_role", { _user_id: userId, _role: "applicant" });
    if (!isApplicant) throw new Error("Only applicants can use profile suggestions.");

    const { data: cv } = await supabase.from("applicant_cvs").select("cv_path").eq("owner_id", userId).maybeSingle();
    if (!cv) throw new Error("Upload your CV in Settings first.");

    const { data: saved } = await supabase.from("profile_suggestions").select("cv_path, payload").eq("owner_id", userId).maybeSingle();
    if (saved && saved.cv_path === cv.cv_path) {
      const s = cleanSuggestions(saved.payload);
      if (s.length) return { suggestions: s, cached: true };
    }

    const { data: allowed, error: claimErr } = await supabase.rpc("claim_suggestion_run");
    if (claimErr) throw new Error(claimErr.message);
    if (!allowed) throw new Error(SUGGESTION_LIMIT_MESSAGE);

    const { data: file, error: dlErr } = await supabase.storage.from("cv-uploads").download(cv.cv_path);
    if (dlErr || !file) throw new Error("We couldn't open your CV. Try uploading it again in Settings.");

    const { extractCvText, askForSuggestions } = await import("@/lib/profileSuggestions.server");
    const text = await extractCvText(file, cv.cv_path);
    if (text.length < 80) throw new Error("We couldn't read text from your CV. Try uploading a text-based PDF or DOCX.");

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI suggestions aren't set up yet.");
    let raw: unknown;
    try {
      raw = await askForSuggestions(text, apiKey);
    } catch (e) {
      console.error("suggest-profiles AI error", e);
      const status = (e as { statusCode?: number })?.statusCode;
      if (status === 429) throw new Error("Our AI is busy right now. Please try again in a minute.");
      if (status === 402) throw new Error("AI suggestions are temporarily unavailable.");
      throw new Error("We couldn't create suggestions right now. Please try again later.");
    }
    const suggestions = cleanSuggestions(raw);
    if (!suggestions.length) throw new Error("We couldn't create suggestions from this CV.");

    const { error: saveErr } = await supabase.rpc("save_profile_suggestions", { _cv_path: cv.cv_path, _payload: { suggestions } });
    if (saveErr) console.error("save suggestions failed", saveErr);
    return { suggestions, cached: false };
  });
