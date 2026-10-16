import { describe, it, expect } from "vitest";
import { formatHours, formatMonthly, formatRate, postedAgo } from "@/lib/jobFormat";

describe("job details formatting", () => {
  it("fixed rate", () => expect(formatRate(8, 8)).toBe("$8/hr"));
  it("rate range", () => expect(formatRate(6, 10)).toBe("$6–$10/hr"));
  it("fixed hours", () => expect(formatHours(40, 40)).toBe("40 hrs/week"));
  it("hours range", () => expect(formatHours(20, 30)).toBe("20–30 hrs/week"));
  it("monthly uses 4.33 weeks", () => expect(formatMonthly(7, 8, 40, 40)).toBe("$1,212 – $1,386"));
  it("posted 3 days ago", () =>
    expect(postedAgo("2026-10-13T12:00:00Z", new Date("2026-10-16T13:00:00Z"))).toBe("Posted 3 days ago"));
});
