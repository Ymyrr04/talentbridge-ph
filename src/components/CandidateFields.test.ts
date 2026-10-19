import { describe, expect, it } from "vitest";
import { publishErrors, type CandidateValues } from "./CandidateFields";

const valid: CandidateValues = { skills: [], years: "0", pastTitles: ["Assistant"], industries: ["Healthcare"], highlights: ["One", "Two", "Three"], tools: [], education: [], availability: ["part_time"], hours: "20", timeZones: ["any"], startAvailability: "immediately" };

describe("profile publishing requirements", () => {
  it("accepts a complete profile including zero years", () => expect(publishErrors(valid)).toEqual([]));
  it("requires at least one availability option", () => expect(publishErrors({ ...valid, availability: [] })).toContain("at least 1 availability option"));
  it("requires at least one working-hours option", () => expect(publishErrors({ ...valid, timeZones: [] })).toContain("at least 1 working-hours option"));
  it("requires three highlights", () => expect(publishErrors({ ...valid, highlights: ["One", "Two"] })).toContain("at least 3 highlights"));
});