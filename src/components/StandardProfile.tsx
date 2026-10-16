import { availabilityBullet, firstName, type StandardProfileData } from "@/lib/standardProfile";

/** The one shared "standard format" view of an applicant profile. */
export function StandardProfile({ data, className = "" }: { data: StandardProfileData; className?: string }) {
  const name = firstName(data.name);
  const role = data.roleTitle.trim();
  const rate = Number(data.hourlyRate);
  const hasRate = data.hourlyRate !== "" && data.hourlyRate != null && Number.isFinite(rate);
  const field = (data.field ?? "").trim();
  const hasYears = data.years !== null && data.years !== undefined && !Number.isNaN(data.years);
  const bullets = [...(data.highlights ?? []).map((h) => h.trim()).filter(Boolean)];
  const avail = availabilityBullet(data);
  if (avail) bullets.push(avail);
  return (
    <div className={`space-y-1 text-sm ${className}`}>
      <p className="font-semibold">{[name, role].filter(Boolean).join(" – ") || "Your role title"}</p>
      {hasRate && <p>${rate.toFixed(2)}/hour</p>}
      {(hasYears || field) && (
        <p>
          {hasYears ? `${data.years}+ years of experience` : "Experience"}
          {field ? ` in ${field}` : ""}
        </p>
      )}
      {bullets.length > 0 && (
        <ul className="list-disc space-y-0.5 pl-5 pt-1">
          {bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
      )}
    </div>
  );
}
