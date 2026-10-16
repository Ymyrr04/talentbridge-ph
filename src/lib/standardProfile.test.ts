import { describe, expect, it } from "vitest";
import { annualSalary, availabilityLine, firstName } from "./standardProfile";

describe("standard profile", () => {
  it("builds the availability line", () => {
    expect(availabilityLine({ availability: ["full_time", "part_time"], hours: 40, timeZones: ["us", "australia"], startAvailability: "2_weeks" }))
      .toBe("Available to start within 2 weeks. Full-time and Part-time, 40 hrs/week, US and Australia hours.");
  });
  it("uses 'any hours' when flexible", () => {
    expect(availabilityLine({ availability: ["project"], hours: 20, timeZones: ["any"], startAvailability: "immediately" }))
      .toBe("Available to start immediately. Project-based, 20 hrs/week, any hours.");
  });
  it("omits the start sentence when not set", () => {
    expect(availabilityLine({ availability: ["full_time"], hours: 40, timeZones: [], startAvailability: null }))
      .toBe("Full-time, 40 hrs/week.");
  });
  it("formats the annual salary in $k with one decimal only when needed", () => {
    expect(annualSalary(10, 50)).toBe("$26k");
    expect(annualSalary(7, 40)).toBe("$14.6k");
  });
  it("takes the first word of the name", () => {
    expect(firstName("  Maria Clara Santos")).toBe("Maria");
  });
});
