import { describe, expect, it } from "vitest";
import { applyRate } from "./jobStats";

describe("applyRate", () => {
  it("shows a dash when there are no views", () => expect(applyRate(3, 0)).toBe("–"));
  it("rounds to a whole percent", () => expect(applyRate(12, 148)).toBe("8%"));
});
