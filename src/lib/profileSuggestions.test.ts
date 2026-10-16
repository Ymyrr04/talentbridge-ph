import { describe, expect, it } from "vitest";
import { cleanSuggestions } from "./profileSuggestions";

describe("cleanSuggestions", () => {
  const long = "x".repeat(200);
  const raw = { suggestions: [1, 2, 3, 4].map((i) => ({
    role_title: `Role ${i} ${long}`, years_experience: 3.6,
    past_titles: Array.from({ length: 8 }, () => long),
    industries: Array.from({ length: 12 }, () => long),
    highlights: [long, "a", "b", "c", "d", "e", "f", "g", "h"],
    tools: Array.from({ length: 45 }, () => long),
    education: Array.from({ length: 10 }, () => long),
    skills: ["excel", "Made Up Tool", "Excel"],
  })) };
  const out = cleanSuggestions(raw);
  it("keeps at most 3 suggestions", () => expect(out).toHaveLength(3));
  it("caps role title at 80", () => expect(out[0]!.role_title.length).toBe(80));
  it("caps past titles at 6 x 80", () => {
    expect(out[0]!.past_titles).toHaveLength(6);
    expect(out[0]!.past_titles[0]!.length).toBe(80);
  });
  it("caps industries at 10 x 40", () => {
    expect(out[0]!.industries).toHaveLength(10);
    expect(out[0]!.industries[0]!.length).toBe(40);
  });
  it("keeps 8 highlights of max 160", () => {
    expect(out[0]!.highlights).toHaveLength(8);
    expect(out[0]!.highlights[0]!.length).toBe(160);
  });
  it("caps tools at 40 x 40", () => {
    expect(out[0]!.tools).toHaveLength(40);
    expect(out[0]!.tools[0]!.length).toBe(40);
  });
  it("caps education at 8 x 120", () => {
    expect(out[0]!.education).toHaveLength(8);
    expect(out[0]!.education[0]!.length).toBe(120);
  });
  it("keeps only skills from the fixed list", () => expect(out[0]!.skills).toEqual(["Excel"]));
  it("rounds years to an integer", () => expect(out[0]!.years_experience).toBe(4));
});
