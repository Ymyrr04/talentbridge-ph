import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { myCv, openCvFile, replaceCv, validateCv } from "@/lib/applicant";
import { Button } from "@/components/ui/button";

export function CvSettings({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data: cv, isLoading } = useQuery(myCv(userId));
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(f: File | undefined) {
    if (!f) return;
    const v = validateCv(f);
    if (v) {
      toast.error(v);
      return;
    }
    setBusy(true);
    try {
      await replaceCv(userId, f, cv?.cv_path);
      await qc.invalidateQueries({ queryKey: ["applicant-cv", userId] });
      toast.success("CV saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <section className="mb-6 max-w-2xl space-y-3 rounded-2xl border bg-card p-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Your CV</h2>
        <p className="text-sm text-muted-foreground">This CV is used on all your profiles. Keep it accurate.</p>
      </div>
      {!isLoading && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 text-sm">
          <FileText className="h-5 w-5 text-primary" />
          <span className="min-w-0 flex-1 truncate">{cv ? cv.cv_original_filename || "CV uploaded" : "No CV uploaded yet"}</span>
          {cv && (
            <Button type="button" variant="outline" size="sm" onClick={() => openCvFile(cv.cv_path).catch((e: Error) => toast.error(e.message))}>
              View
            </Button>
          )}
          <Button type="button" size="sm" disabled={busy} onClick={() => input.current?.click()}>
            <Upload className="h-4 w-4" /> {busy ? "Uploading…" : cv ? "Replace" : "Upload CV"}
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">PDF or DOCX, max 5 MB.</p>
      <input
        ref={input}
        type="file"
        className="sr-only"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
    </section>
  );
}
