import { describe, expect, it } from "vitest";
import { recommendJobs } from "./jobRecommendations";

const job = (id: string, title: string, description = "", created_at = "2026-10-19") => ({ id, title, description, created_at });
const profile = { role_title: "AI Automation", skills: ["Workflow Automation"], tools: ["n8n"] };

describe("profile-based job recommendations", () => {
  it("prioritizes an exact profile title over partial word matches", () => {
    expect(recommendJobs([job("partial", "Automation engineer"), job("exact", "AI Automation specialist")], [profile]).map(({ job }) => job.id)).toEqual(["exact", "partial"]);
  });
  it("matches past titles and named skills or tools", () => {
    expect(recommendJobs([job("past", "Bookkeeper"), job("tool", "Integration developer", "Build workflows using n8n"), job("skill", "Consultant", "Workflow Automation")], [{ ...profile, past_titles: ["Bookkeeper"] }]).map(({ job }) => job.id)).toEqual(["past", "skill", "tool"]);
  });
  it("does not recommend unrelated jobs or substring-only word matches", () => {
    expect(recommendJobs([job("unrelated", "Designer"), job("substring", "Paid ads assistant")], [profile])).toEqual([]);
  });
  it("excludes jobs already applied for", () => {
    expect(recommendJobs([job("applied", "AI Automation")], [profile], new Set(["applied"]))).toEqual([]);
  });
  it("returns no recommendations without profile data", () => {
    expect(recommendJobs([job("one", "AI Automation")], [])).toEqual([]);
  });
  it("uses the best matching profile and newest first for tied scores", () => {
    expect(recommendJobs([job("old", "Designer", "", "2026-10-17"), job("new", "Designer", "", "2026-10-19")], [profile, { role_title: "Designer" }]).map(({ job }) => job.id)).toEqual(["new", "old"]);
  });
});