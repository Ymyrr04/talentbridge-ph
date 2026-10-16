import { describe, it, expect } from "vitest";
import { addTool } from "@/components/ToolsInput";

describe("must-have tools", () => {
  it("trims spaces", () => expect(addTool([], "  Canva  ")).toEqual(["Canva"]));
  it("ignores case-insensitive duplicates", () => expect(addTool(["Excel"], "excel")).toEqual(["Excel"]));
  it("blocks an 11th tool", () => expect(typeof addTool(Array.from({ length: 10 }, (_, i) => `T${i}`), "New")).toBe("string"));
  it("blocks names over 40 characters", () => expect(typeof addTool([], "x".repeat(41))).toBe("string"));
});
