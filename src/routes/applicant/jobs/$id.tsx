import { createFileRoute } from "@tanstack/react-router";
import { JobDetail, Unavailable } from "@/components/JobDetail";
import { jobQuery } from "@/lib/openJob";
import { myApplications, myPublishedProfiles } from "@/lib/applications";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/applicant/jobs/$id")({
  head: () => ({ meta: [
    { title: "Job details — TalentHub" },
    { name: "description", content: "Review this remote job’s requirements and apply with your TalentHub profile." },
    { property: "og:title", content: "Job details — TalentHub" },
    { property: "og:description", content: "Review remote job requirements and apply with your profile." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  loader: ({ context, params }) =>
    Promise.all([
      UUID.test(params.id) ? context.queryClient.ensureQueryData(jobQuery(params.id)) : null,
      context.queryClient.ensureQueryData(myApplications),
      context.queryClient.ensureQueryData(myPublishedProfiles),
    ]),
  component: JobDetailPage,
});

function JobDetailPage() {
  const { id } = Route.useParams();
  return UUID.test(id) ? <JobDetail id={id} /> : <Unavailable />;
}
