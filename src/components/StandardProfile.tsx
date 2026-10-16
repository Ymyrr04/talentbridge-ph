import { availabilityLine, joinAnd, type StandardProfileData } from "@/lib/standardProfile";

/** The one shared "standard format" view of an applicant profile. */
export function StandardProfile({ data, className = "", rateLabel }: { data: StandardProfileData; className?: string; rateLabel?: string }) {
  const name = (data.name ?? "").trim();
  const role = data.roleTitle.trim();
  const rate = Number(data.hourlyRate);
  const hasRate = data.hourlyRate !== "" && data.hourlyRate != null && Number.isFinite(rate);
  const hasYears = data.years !== null && data.years !== undefined && !Number.isNaN(data.years);
  const pastTitles = (data.pastTitles ?? []).map((t) => t.trim()).filter(Boolean);
  const industries = (data.industries ?? []).map((t) => t.trim()).filter(Boolean);
  const tools = (data.tools ?? []).map((t) => t.trim()).filter(Boolean);
  const education = (data.education ?? []).map((t) => t.trim()).filter(Boolean);
  const highlights = (data.highlights ?? []).map((h) => h.trim()).filter(Boolean);
  const avail = availabilityLine(data);

  const Label = ({ children }: { children: string }) => <span className="font-semibold">{children}</span>;

  return (
    <div className={`space-y-1.5 text-sm ${className}`}>
      <p className="text-base font-semibold">{name || "Your name"}</p>
      {role && <p><Label>Role:</Label> {role}</p>}
      {hasRate ? (
        <p><Label>Hourly rate:</Label> ${rate.toFixed(2)}/hr</p>
      ) : rateLabel ? (
        <p>{rateLabel}</p>
      ) : null}
      {hasYears && (
        <p>
          <Label>Years of experience:</Label> {data.years} years of experience
          {pastTitles.length > 0 ? ` as ${joinAnd(pastTitles)}` : ""}.
        </p>
      )}
      {industries.length > 0 && <p><Label>Industry expertise:</Label> {industries.join(", ")}.</p>}
      {highlights.length > 0 && (
        <div>
          <p><Label>Key responsibilities & accomplishments:</Label></p>
          <ul className="list-disc space-y-0.5 pl-5 pt-0.5">
            {highlights.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        </div>
      )}
      {tools.length > 0 && <p><Label>Relevant software & tools:</Label> {tools.join(", ")}.</p>}
      {education.length > 0 && <p><Label>Education & certifications:</Label> {education.join(" | ")}</p>}
      {avail && <p><Label>Availability:</Label> {avail}</p>}
    </div>
  );
}
