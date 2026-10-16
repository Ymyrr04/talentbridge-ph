import { describe, expect, it } from "vitest";
import { availabilityBullet, firstName } from "./standardProfile";

describe("standard profile", () => {
  it("builds the availability bullet", () => {
    expect(availabilityBullet({ availability: ["full_time", "part_time"], hours: 40, timeZones: ["us", "australia"] }))
      .toBe("Available full-time and part-time, 40 hrs/week, US and Australia hours");
  });
  it("uses 'any hours' when flexible", () => {
    expect(availabilityBullet({ availability: ["project"], hours: 20, timeZones: ["any"] }))
      .toBe("Available project-based, 20 hrs/week, any hours");
  });
  it("takes the first word of the name", () => {
    expect(firstName("  Maria Clara Santos")).toBe("Maria");
  });
});
