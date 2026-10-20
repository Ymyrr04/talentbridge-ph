import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Download, FileText, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  accountsOf,
  adminData,
  exportAllUsers,
  exportApplicants,
  exportClients,
  joined,
  nextSort,
  openCv,
  ROLE_LABEL,
  sortUsers,
  type AdminUser,
  type Sort,
  type UserSortKey,
} from "@/lib/admin";
import { JOB_STATUS_LABEL } from "@/lib/client";
import { AdminAnalytics } from "@/components/AdminAnalytics";
import { AdminJobPosts } from "@/components/AdminJobPosts";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — TalentHub" }, { name: "description", content: "Admin Dashboard for your TalentHub remote talent marketplace account." }, { property: "og:title", content: "Admin Dashboard — TalentHub" }, { property: "og:description", content: "Admin Dashboard for your TalentHub remote talent marketplace account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminData),
  component: Page,
});

type RoleFilter = "all" | "applicant" | "client" | "admin";

function SortHeader({
  k,
  label,
  sort,
  onSort,
  className,
}: {
  k: UserSortKey;
  label: string;
  sort: Sort;
  onSort: (k: UserSortKey) => void;
  className?: string;
}) {
  const active = sort.key === k;
  return (
    <TableHead className={className} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => onSort(k)} className="inline-flex items-center gap-1 hover:text-foreground">
        {label}
        {active ? (
          sort.dir === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )
        ) : null}
      </button>
    </TableHead>
  );
}

function Page() {
  const { data } = useSuspenseQuery(adminData);
  const { all: allAccounts, applicants: applicantRows, clients: clientRows, counts: roleCounts } = accountsOf(data);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState<RoleFilter>("all");
  const [sort, setSort] = useState<Sort>({ key: "created_at", dir: "desc" });

  const term = q.trim().toLowerCase();
  const hit = (u: AdminUser) => !term || [u.name, u.email, u.phone].some((v) => v?.toLowerCase().includes(term));

  const onSort = (k: UserSortKey) => setSort((s) => nextSort(s, k));

  const allUsers = useMemo(
    () => sortUsers(allAccounts.filter((u) => (role === "all" || u.role === role) && hit(u)), sort.key, sort.dir),
    [allAccounts, role, term, sort],
  );
  const applicants = useMemo(() => sortUsers(applicantRows.filter(hit), sort.key, sort.dir), [applicantRows, term, sort]);
  const clients = useMemo(() => sortUsers(clientRows.filter(hit), sort.key, sort.dir), [clientRows, term, sort]);

  const chips: { key: RoleFilter; label: string; n: number }[] = [
    { key: "all", label: "All accounts", n: allAccounts.length },
    { key: "applicant", label: "Applicants", n: roleCounts.applicant },
    { key: "client", label: "Clients", n: roleCounts.client },
    { key: "admin", label: "Admins", n: roleCounts.admin },
  ];

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
      <PageHeader
        title="Admin Dashboard"
        subtitle={`${roleCounts.applicant} applicant${roleCounts.applicant === 1 ? "" : "s"} · ${roleCounts.client} client${roleCounts.client === 1 ? "" : "s"} · ${data.jobs.length} job post${data.jobs.length === 1 ? "" : "s"}`}
      />
      <AdminAnalytics data={data} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email or phone"
            className="pl-9"
            aria-label="Search users"
          />
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by role">
          {chips.map((c) => (
            <Button key={c.key} size="sm" variant={role === c.key ? "default" : "outline"} onClick={() => setRole(c.key)}>
              {c.label} ({c.n})
            </Button>
          ))}
        </div>
      </div>

      <section className="mb-10">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">
            All accounts
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {allUsers.length} shown
            </span>
          </h2>
          <Button size="sm" onClick={() => { exportAllUsers(data); toast.success("All accounts exported."); }}>
            <Download className="h-4 w-4" /> Export all accounts (.csv)
          </Button>
        </div>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader k="name" label="Full name" sort={sort} onSort={onSort} />
                <SortHeader k="email" label="Email" sort={sort} onSort={onSort} />
                <SortHeader k="phone" label="Phone" sort={sort} onSort={onSort} />
                <SortHeader k="role" label="Role" sort={sort} onSort={onSort} />
                <SortHeader k="created_at" label="Joined" sort={sort} onSort={onSort} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {allUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name || "—"}</TableCell>
                  <TableCell>
                    <a href={`mailto:${u.email}`} className="text-primary hover:underline">{u.email}</a>
                  </TableCell>
                  <TableCell>{u.phone || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ROLE_LABEL[u.role] ?? u.role}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{joined(u.created_at)}</TableCell>
                </TableRow>
              ))}
              {allUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">No accounts found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <AdminJobPosts data={data} />

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold">Applicants and clients in detail</h2>
        <Tabs defaultValue="applicants">
          <TabsList>
            <TabsTrigger value="applicants">Applicants ({applicantRows.length})</TabsTrigger>
            <TabsTrigger value="clients">Clients ({clientRows.length})</TabsTrigger>
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
                    <SortHeader k="name" label="Full name" sort={sort} onSort={onSort} />
                    <SortHeader k="email" label="Email" sort={sort} onSort={onSort} />
                    <SortHeader k="phone" label="Phone" sort={sort} onSort={onSort} />
                    <SortHeader k="created_at" label="Joined" sort={sort} onSort={onSort} />
                    <TableHead>Profiles</TableHead>
                    <TableHead>CVs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applicants.map((u) => {
                    const ps = data.profiles.filter((p) => p.owner_id === u.id);
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name || "—"}</TableCell>
                        <TableCell>
                          <a href={`mailto:${u.email}`} className="text-primary hover:underline">{u.email}</a>
                        </TableCell>
                        <TableCell>{u.phone || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{joined(u.created_at)}</TableCell>
                        <TableCell className="text-sm">
                          {ps.length === 0 ? (
                            <span className="text-muted-foreground">None</span>
                          ) : (
                            ps.map((p) => (
                              <div key={p.id}>
                                {p.role_title}{" "}
                                <span className="text-muted-foreground">
                                  · ${p.hourly_rate}/hr · {p.status}
                                </span>
                              </div>
                            ))
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {(() => {
                            const cv = (data.cvs ?? []).find((c) => c.owner_id === u.id);
                            return cv ? (
                              <button onClick={() => viewCv(cv.cv_path)} className="flex items-center gap-1 text-primary hover:underline">
                                <FileText className="h-3.5 w-3.5" /> {cv.cv_original_filename || "CV"}
                              </button>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            );
                          })()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {applicants.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">No applicants found.</TableCell>
                    </TableRow>
                  )}
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
                    <SortHeader k="name" label="Full name" sort={sort} onSort={onSort} />
                    <SortHeader k="email" label="Email" sort={sort} onSort={onSort} />
                    <SortHeader k="phone" label="Phone" sort={sort} onSort={onSort} />
                    <SortHeader k="created_at" label="Joined" sort={sort} onSort={onSort} />
                    <TableHead>Hiring needs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((u) => {
                    const js = data.jobs.filter((j) => j.owner_id === u.id);
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name || "—"}</TableCell>
                        <TableCell>
                          <a href={`mailto:${u.email}`} className="text-primary hover:underline">{u.email}</a>
                        </TableCell>
                        <TableCell>{u.phone || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{joined(u.created_at)}</TableCell>
                        <TableCell className="text-sm">
                          {js.length === 0 ? (
                            <span className="text-muted-foreground">No job posts</span>
                          ) : (
                            js.map((j) => (
                              <div key={j.id}>
                                {j.title}{" "}
                                <span className="text-muted-foreground">· {JOB_STATUS_LABEL[j.status] ?? j.status}</span>
                              </div>
                            ))
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {clients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">No clients found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </>
  );
}
