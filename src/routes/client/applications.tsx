import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Inbox } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageHeader } from "@/components/AppShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { APPLICATION_STATUS_LABEL, ApplicationStatusClass, incomingApplications } from "@/lib/applications";
import { firstName } from "@/lib/standardProfile";
import { StandardProfile } from "@/components/StandardProfile";
import { cn } from "@/lib/utils";
import { MessageApplicantButton } from "@/components/MessageApplicantButton";
import { IntroVideoButton } from "@/components/IntroVideoButton";
import { VoiceIntroButton } from "@/components/VoiceIntroButton";

export const Route = createFileRoute("/client/applications")({
  head: () => ({ meta: [{ title: "Applications — TalentHub" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>): { job?: string } => (typeof s["job"] === "string" ? { job: s["job"] } : {}),
  loader: ({ context }) => context.queryClient.ensureQueryData(incomingApplications),
  component: ClientApplicationsPage,
});

const STATUS_ORDER = ["pending", "contacted", "shortlisted", "rejected"] as const;

type Application = {
  id: string;
  job_id: string;
  job_title: string;
  applicant_name: string;
  role_title: string;
  hourly_rate: number | null;
  cover_note: string;
  status: string;
  created_at: string;
  cv_path: string | null;
  cv_original_filename: string | null;
};

type ProfileFormat = {
  years_experience: number | null;
  field: string | null;
  highlights: string[] | null;
  availability_list: string[] | null;
  hours_per_week: number | null;
  time_zones: string[] | null;
  past_titles: string[] | null;
  industries: string[] | null;
  tools: string[] | null;
  education: string[] | null;
  start_availability: string | null;
};

function appliedDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ClientApplicationsPage() {
  const { data } = useSuspenseQuery(incomingApplications);
  const { data: formats } = useQuery({
    queryKey: ["incoming-application-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("incoming_application_profiles");
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((r) => [r.application_id, r])) as Record<string, ProfileFormat>;
    },
  });
  const { data: videos } = useQuery({
    queryKey: ["incoming-application-videos"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("incoming_application_videos");
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((r) => [r.application_id, r.video_path])) as Record<string, string>;
    },
  });
  const { data: voices } = useQuery({
    queryKey: ["incoming-application-voices"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("incoming_application_voices");
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((r) => [r.application_id, r])) as Record<string, { voice_path: string | null; voice_link: string | null }>;
    },
  });
  const qc = useQueryClient();
  const [jobFilter, setJobFilter] = useState(Route.useSearch().job ?? "all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<string | undefined>();

  const jobs = useMemo(() => Array.from(new Map(data.map((a) => [a.job_id, a.job_title])).entries()), [data]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: 0, pending: 0, contacted: 0, shortlisted: 0, rejected: 0 };
    for (const a of jobFilter === "all" ? data : data.filter((x) => x.job_id === jobFilter)) {
      c["all"] = (c["all"] ?? 0) + 1;
      c[a.status] = (c[a.status] ?? 0) + 1;
    }
    return c;
  }, [data, jobFilter]);

  const shown = useMemo(
    () =>
      data.filter(
        (a) => (jobFilter === "all" || a.job_id === jobFilter) && (statusFilter === "all" || a.status === statusFilter),
      ),
    [data, jobFilter, statusFilter],
  );

  useEffect(() => {
    if (shown.length === 0) {
      if (selected !== undefined) setSelected(undefined);
      return;
    }
    if (!selected || !shown.some((a) => a.id === selected)) setSelected(shown[0]!.id);
  }, [shown, selected]);

  const current = shown.find((a) => a.id === selected);

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.rpc("set_application_status", { _id: id, _status: status });
    if (error) { toast.error(error.message); return; }
    toast.success(`Marked as ${APPLICATION_STATUS_LABEL[status]}`);
    await qc.invalidateQueries({ queryKey: ["incoming-applications"] });
  }

  return (
    <>
      <PageHeader title="Applications" subtitle={`${data.length} received across your job posts`} />
      {data.length === 0 ? (
        <EmptyState icon={<Inbox className="h-6 w-6" />} title="No applications yet" body="When applicants apply to your open job posts, they'll show up here." />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Select value={jobFilter} onValueChange={setJobFilter}>
              <SelectTrigger className="w-60" aria-label="Filter by job"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All jobs</SelectItem>
                {jobs.map(([id, title]) => <SelectItem key={id} value={id}>{title}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-1.5">
              {(["all", ...STATUS_ORDER] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    statusFilter === s ? "border-accent bg-accent text-accent-foreground" : "bg-card text-muted-foreground hover:bg-muted",
                  )}
                >
                  {s === "all" ? "All" : APPLICATION_STATUS_LABEL[s]} {counts[s] ?? 0}
                </button>
              ))}
            </div>
          </div>

          <div className="flex min-h-[420px] overflow-hidden rounded-2xl border bg-card">
            <aside className={cn("w-full shrink-0 overflow-y-auto border-r md:block md:w-[260px]", current && "hidden")}>
              {shown.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No applications match these filters.</p>
              ) : (
                shown.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelected(a.id)}
                    className={cn("flex w-full flex-col gap-0.5 border-b px-4 py-3 text-left transition-colors hover:bg-muted", a.id === selected && "bg-secondary")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold">{firstName(a.applicant_name) || "Applicant"}</span>
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", ApplicationStatusClass(a.status))}>
                        {APPLICATION_STATUS_LABEL[a.status]}
                      </span>
                    </div>
                    <span className="truncate text-xs text-muted-foreground">{a.role_title}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {a.hourly_rate != null ? `Bid $${Number(a.hourly_rate).toFixed(2)}/hr · ` : ""}{appliedDate(a.created_at)}
                    </span>
                  </button>
                ))
              )}
            </aside>

            {current ? (
              <Preview
                key={current.id}
                application={current}
                format={formats?.[current.id]}
                videoPath={videos?.[current.id]}
                voice={voices?.[current.id]}
                onBack={() => setSelected(undefined)}
                onSetStatus={setStatus}
              />
            ) : (
              <div className="hidden flex-1 place-items-center p-6 text-sm text-muted-foreground md:grid">
                {shown.length === 0 ? "No applications match these filters." : "Select an application"}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

function Preview({
  application: a,
  format,
  videoPath,
  voice,
  onBack,
  onSetStatus,
}: {
  application: Application;
  format: ProfileFormat | undefined;
  videoPath: string | undefined;
  voice: { voice_path: string | null; voice_link: string | null } | undefined;
  onBack: () => void;
  onSetStatus: (id: string, status: string) => void;
}) {
  return (
    <section className="flex min-w-0 flex-1 flex-col overflow-y-auto p-5">
      <div className="mb-3 flex items-center gap-2">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack} aria-label="Back to applications">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {a.job_title} · applied {appliedDate(a.created_at)}
        </p>
      </div>

      <div className="flex items-start justify-between gap-3">
        <StandardProfile
          className="min-w-0"
          data={{
            name: a.applicant_name || "Applicant",
            roleTitle: a.role_title,
            hourlyRate: a.hourly_rate,
            years: format?.years_experience,
            pastTitles: format?.past_titles,
            industries: format?.industries,
            tools: format?.tools,
            education: format?.education,
            startAvailability: format?.start_availability,
            highlights: format?.highlights,
            availability: format?.availability_list,
            hours: format?.hours_per_week,
            timeZones: format?.time_zones,
          }}
        />
        <Select value={a.status} onValueChange={(v) => onSetStatus(a.id, v)}>
          <SelectTrigger className="w-36 shrink-0" aria-label="Change status"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(APPLICATION_STATUS_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {a.cover_note && (
        <div className="mt-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Cover note</p>
          <p className="whitespace-pre-line rounded-lg bg-muted/50 p-3 text-sm">{a.cover_note}</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {videoPath && <IntroVideoButton path={videoPath} applicantName={a.applicant_name} />}
        {voice && <VoiceIntroButton path={voice.voice_path} link={voice.voice_link} applicantName={a.applicant_name} />}
        {a.cv_path && <ViewCvButton path={a.cv_path} originalFilename={a.cv_original_filename} />}
        <MessageApplicantButton applicationId={a.id} applicantName={a.applicant_name} />
      </div>
    </section>
  );
}

function ViewCvButton({ path, originalFilename }: { path: string; originalFilename: string | null }) {
  const [busy, setBusy] = useState(false);

  async function openCv() {
    setBusy(true);
    try {
      const { data, error } = await supabase.storage.from("cv-uploads").createSignedUrl(path, 600);
      if (error || !data?.signedUrl) { throw error ?? new Error("no url"); }
      if (path.toLowerCase().endsWith(".pdf")) {
        window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      } else {
        const res = await fetch(data.signedUrl);
        if (!res.ok) { throw new Error("download failed"); }
        const url = URL.createObjectURL(await res.blob());
        const link = document.createElement("a");
        link.href = url;
        link.download = originalFilename || "CV.docx";
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      toast.error("Could not open this CV.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={busy} onClick={() => { void openCv(); }}>
      <FileText className="h-4 w-4" /> View CV
    </Button>
  );
}
