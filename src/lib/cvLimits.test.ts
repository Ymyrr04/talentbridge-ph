import { describe, expect, it } from "vitest";
import { assertCvSize } from "./cvLimits";

describe("CV parsing limit", () => {
  it("accepts 5 MB", () => expect(() => assertCvSize(5 * 1024 * 1024)).not.toThrow());
  it("rejects more than 5 MB before parsing", () => expect(() => assertCvSize(5 * 1024 * 1024 + 1)).toThrow("CV must be 5 MB or smaller."));
});