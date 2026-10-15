import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download, FileText, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminData, exportApplicants, exportClients, openCv } from "@/lib/admin";
import { JOB_STATUS_LABEL } from "@/lib/client";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — TalentHub" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminData),
  component: Page,
});

const match = (term: string, ...vals: (string | null)[]) => vals.some((v) => v?.toLowerCase().includes(term));

function Page() {
  const { data } = useSuspenseQuery(adminData);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const term = q.trim().toLowerCase();
  const applicants = data.applicants.filter((u) => !term || match(term, u.name, u.email, u.phone));
  const clients = data.clients.filter((u) => !term || match(term, u.name, u.email, u.phone));

  async function runApplicantExport() {
    setBusy(true);
    try {
      await exportApplicants(data);
      toast.success("Applicant export downloaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setBusy(false);
    }
  }

  async function viewCv(path: string) {
    try {
      await openCv(path);
    } catch {
      toast.error("Couldn't open that CV.");
    }
  }

  return (
    <>
      <PageHeader title="Admin Dashboard" subtitle={`${data.applicants.length} applicant${data.applicants.length === 1 ? "" : "s"} · ${data.clients.length} client${data.clients.length === 1 ? "" : "s"} · ${data.jobs.length} job post${data.jobs.length === 1 ? "" : "s"}`} />
      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or phone" className="pl-9" aria-label="Search users" />
      </div>
      <Tabs defaultValue="applicants">
        <TabsList>
          <TabsTrigger value="applicants">Applicants ({data.applicants.length})</TabsTrigger>
          <TabsTrigger value="clients">Clients ({data.clients.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="applicants" className="mt-4">
          <div className="mb-3 flex justify-end">
            <Button size="sm" onClick={runApplicantExport} disabled={busy}>
              <Download className="h-4 w-4" /> {busy ? "Preparing…" : "Export applicants + CVs (.zip)"}
            </Button>
          </div>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Profiles</TableHead><TableHead>CVs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applicants.map((u) => {
                  const ps = data.profiles.filter((p) => p.owner_id === u.id);
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name || "—"}</TableCell>
                      <TableCell><a href={`mailto:${u.email}`} className="text-primary hover:underline">{u.email}</a></TableCell>
                      <TableCell>{u.phone || "—"}</TableCell>
                      <TableCell className="text-sm">
                        {ps.length === 0 ? <span className="text-muted-foreground">None</span> : ps.map((p) => (
                          <div key={p.id}>{p.role_title} <span className="text-muted-foreground">· ${p.hourly_rate}/hr · {p.status}</span></div>
                        ))}
                      </TableCell>
                      <TableCell className="text-sm">
                        {ps.filter((p) => p.cv_path).length === 0 ? <span className="text-muted-foreground">—</span> : ps.filter((p) => p.cv_path).map((p) => (
                          <button key={p.id} onClick={() => viewCv(p.cv_path!)} className="flex items-center gap-1 text-primary hover:underline">
                            <FileText className="h-3.5 w-3.5" /> {p.cv_original_filename || "CV"}
                          </button>
                        ))}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {applicants.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No applicants found.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="mt-4">
          <div className="mb-3 flex justify-end">
            <Button size="sm" onClick={() => { exportClients(data); toast.success("Client export downloaded."); }}>
              <Download className="h-4 w-4" /> Export clients + job posts (.csv)
            </Button>
          </div>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Hiring needs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((u) => {
                  const js = data.jobs.filter((j) => j.owner_id === u.id);
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name || "—"}</TableCell>
                      <TableCell><a href={`mailto:${u.email}`} className="text-primary hover:underline">{u.email}</a></TableCell>
                      <TableCell>{u.phone || "—"}</TableCell>
                      <TableCell className="text-sm">
                        {js.length === 0 ? <span className="text-muted-foreground">No job posts</span> : js.map((j) => (
                          <div key={j.id}>{j.title} <span className="text-muted-foreground">· {JOB_STATUS_LABEL[j.status] ?? j.status}</span></div>
                        ))}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {clients.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No clients found.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
