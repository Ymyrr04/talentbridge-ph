import { describe, expect, it } from "vitest";

import { accountsOf, type AdminUser } from "@/lib/admin";

const user = (id: string, role: AdminUser["role"]): AdminUser =>
  ({
    id,
    name: id,
    email: `${id}@example.test`,
    phone: null,
    role,
    created_at: "2026-10-15T00:00:00+00:00",
  }) as unknown as AdminUser;

describe("accountsOf", () => {
  it("rebuilds the account list and counts when a cached result predates the role fields", () => {
    const r = accountsOf({ applicants: [user("a", "applicant")], clients: [user("c", "client")] });

    expect(r.all.map((u) => u.role)).toEqual(["applicant", "client"]);
    expect(r.counts).toEqual({ applicant: 1, client: 1, admin: 0 });
  });

  it("returns empty lists instead of undefined when a cache entry is unusable", () => {
    const r = accountsOf({});

    expect(r.all).toEqual([]);
    expect(r.counts).toEqual({ applicant: 0, client: 0, admin: 0 });
  });
});
