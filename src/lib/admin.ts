import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const adminData = queryOptions({
  queryKey: ["admin-data"],
  queryFn: async () => {
    const [users, profiles, jobs] = await Promise.all([
      supabase.rpc("admin_list_users"),
      supabase.from("applicant_profiles").select("*").order("created_at"),
      supabase.from("job_posts").select("*").order("created_at"),
    ]);
    if (users.error) throw users.error;
    if (profiles.error) throw profiles.error;
    if (jobs.error) throw jobs.error;
    const all = users.data ?? [];
    return {
      applicants: all.filter((u) => u.role === "applicant"),
      clients: all.filter((u) => u.role === "client"),
      profiles: profiles.data,
      jobs: jobs.data,
    };
  },
});

export type AdminData = Awaited<ReturnType<NonNullable<typeof adminData.queryFn>>>;

function cell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = Array.isArray(v) ? v.join("; ") : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  return [headers.join(","), ...rows.map((r) => headers.map((h) => cell(r[h])).join(","))].join("\r\n");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const stamp = () => new Date().toISOString().slice(0, 10);
const safe = (s: string) => s.replace(/[^\w.-]+/g, "_").slice(0, 60) || "file";

export async function openCv(path: string) {
  const { data, error } = await supabase.storage.from("cv-uploads").createSignedUrl(path, 60);
  if (error) throw error;
  window.open(data.signedUrl, "_blank", "noopener");
}

export async function exportApplicants(d: AdminData) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const cvs = zip.folder("cvs")!;
  const rows: Record<string, unknown>[] = [];
  for (const u of d.applicants) {
    const ps = d.profiles.filter((p) => p.owner_id === u.id);
    const base = { full_name: u.name, email: u.email, phone: u.phone, joined: u.created_at };
    if (ps.length === 0) {
      rows.push({ ...base, profile_role: "", status: "", hourly_rate_usd: "", experience: "", skills: "", summary: "", availability: "", hours_per_week: "", time_zones: "", english_level: "", cv_file: "" });
      continue;
    }
    for (const p of ps) {
      let cvFile = "";
      if (p.cv_path) {
        const { data } = await supabase.storage.from("cv-uploads").download(p.cv_path);
        if (data) {
          const ext = p.cv_path.split(".").pop();
          cvFile = `cvs/${safe(u.name || u.email)}_${p.id.slice(0, 8)}.${ext}`;
          cvs.file(cvFile.slice(4), data);
        } else cvFile = "(missing)";
      }
      rows.push({
        ...base,
        profile_role: p.role_title,
        status: p.status,
        hourly_rate_usd: p.hourly_rate,
        experience: p.experience_level,
        skills: p.skills,
        summary: p.summary,
        availability: p.availability,
        hours_per_week: p.hours_per_week,
        time_zones: p.time_zones,
        english_level: p.english_level,
        cv_file: cvFile,
      });
    }
  }
  zip.file("applicants.csv", "\uFEFF" + toCsv(rows));
  downloadBlob(await zip.generateAsync({ type: "blob" }), `talenthub-applicants-${stamp()}.zip`);
}

export function exportClients(d: AdminData) {
  const rows: Record<string, unknown>[] = [];
  for (const u of d.clients) {
    const js = d.jobs.filter((j) => j.owner_id === u.id);
    const base = { full_name: u.name, email: u.email, phone: u.phone, joined: u.created_at };
    if (js.length === 0) rows.push({ ...base, job_title: "", job_status: "", job_description: "", job_posted: "" });
    for (const j of js)
      rows.push({ ...base, job_title: j.title, job_status: j.status, job_description: j.description, job_posted: j.created_at });
  }
  downloadBlob(new Blob(["\uFEFF" + toCsv(rows)], { type: "text/csv" }), `talenthub-clients-${stamp()}.csv`);
}
