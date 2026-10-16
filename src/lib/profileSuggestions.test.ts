import { describe, expect, it } from "vitest";
import { cleanSuggestions } from "./profileSuggestions";

describe("cleanSuggestions", () => {
  const long = "x".repeat(200);
  const raw = { suggestions: [1, 2, 3, 4].map((i) => ({
    role_title: `Role ${i} ${long}`, years_experience: 3.6, field: long,
    highlights: [long, "a", "b", "c", "d", "e"], skills: ["excel", "Made Up Tool", "Excel"],
  })) };
  const out = cleanSuggestions(raw);
  it("keeps at most 3 suggestions", () => expect(out).toHaveLength(3));
  it("caps role title at 80, field at 60", () => {
    expect(out[0]!.role_title.length).toBe(80);
    expect(out[0]!.field.length).toBe(60);
  });
  it("keeps 5 highlights of max 160", () => {
    expect(out[0]!.highlights).toHaveLength(5);
    expect(out[0]!.highlights[0]!.length).toBe(160);
  });
  it("keeps only skills from the fixed list", () => expect(out[0]!.skills).toEqual(["Excel"]));
  it("rounds years to an integer", () => expect(out[0]!.years_experience).toBe(4));
});
