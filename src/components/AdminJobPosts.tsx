import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Flag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { accountsOf, joined, type AdminData } from "@/lib/admin";
import { JOB_STATUS_LABEL } from "@/lib/client";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Mod = "all" | "pending" | "approved" | "flagged";
const MOD_LABEL: Record<string, string> = { pending: "Needs review", approved: "Approved", flagged: "Flagged" };

export function AdminJobPosts({ data }: { data: AdminData }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Mod>("all");
  const owners = new Map(accountsOf(data).all.map((u) => [u.id, u]));
  const jobs = [...data.jobs].reverse();
  const count = (m: Mod) => (m === "all" ? jobs.length : jobs.filter((j) => j.moderation_status === m).length);
  const shown = filter === "all" ? jobs : jobs.filter((j) => j.moderation_status === filter);
  const refresh = () => qc.invalidateQueries({ queryKey: adminData_key });

  const moderate = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "flagged" }) => {
      const { error } = await supabase.rpc("admin_moderate_job", { _id: id, _status: status });
      if (error) throw error;
      return status;
    },
    onSuccess: (s) => { toast.success(s === "approved" ? "Job post approved." : "Job post flagged and hidden from applicants."); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("admin_delete_job", { _id: id });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Job post deleted."); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="mb-10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">Job posts</h2>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filter job posts">
          {(["all", "pending", "approved", "flagged"] as Mod[]).map((m) => (
            <Button key={m} size="sm" variant={filter === m ? "default" : "outline"} onClick={() => setFilter(m)}>
              {m === "all" ? "All" : MOD_LABEL[m]} ({count(m)})
            </Button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Posted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((j) => {
              const o = owners.get(j.owner_id);
              const m = j.moderation_status;
              const busy = moderate.isPending || del.isPending;
              return (
                <TableRow key={j.id}>
                  <TableCell className="max-w-xs">
                    <div className="font-medium">{j.title}</div>
                    <div className="line-clamp-1 text-xs text-muted-foreground">{j.description}</div>
                  </TableCell>
                  <TableCell className="text-sm">{o?.name || o?.email || "—"}</TableCell>
                  <TableCell><Badge variant="outline">{JOB_STATUS_LABEL[j.status] ?? j.status}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={m === "flagged" ? "destructive" : m === "approved" ? "default" : "secondary"}>{MOD_LABEL[m] ?? m}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{joined(j.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {m !== "approved" && (
                        <Button size="sm" variant="ghost" disabled={busy} onClick={() => moderate.mutate({ id: j.id, status: "approved" })}>
                          <CheckCircle2 className="h-4 w-4" /> Approve
                        </Button>
                      )}
                      {m !== "flagged" && (
                        <Button size="sm" variant="ghost" disabled={busy} onClick={() => moderate.mutate({ id: j.id, status: "flagged" })}>
                          <Flag className="h-4 w-4" /> Flag
                        </Button>
                      )}
                      <ConfirmDelete
                        title="Delete this job post?"
                        description={`“${j.title}” and all its applications and messages will be permanently removed.`}
                        onConfirm={() => del.mutate(j.id)}
                        trigger={<Button size="sm" variant="ghost" disabled={busy} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /> Delete</Button>}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {shown.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No job posts here.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

const adminData_key = ["admin-data"];
