import { Badge } from "@/components/ui/badge";
import { JOB_STATUS_LABEL } from "@/lib/client";

export function JobStatusBadge({ status }: { status: string }) {
  const variant = status === "open" ? "default" : status === "closed" ? "outline" : "secondary";
  return <Badge variant={variant}>{JOB_STATUS_LABEL[status] ?? status}</Badge>;
}
