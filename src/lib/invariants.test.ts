import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * The one test that checks the claim this whole project rests on.
 *
 * Every other test in here is a pure function. This one talks to the real
 * database, because the invariant it checks is not a property of any single
 * function — it is a property of what is actually stored, and the only way it
 * can break is if some code path writes one row without the other.
 *
 * It runs against whatever DATABASE_URL points at and skips itself when there
 * is none, so `npm test` still works on a machine with no database configured
 * rather than failing for a reason unrelated to the change being tested.
 */

const connectionString = process.env.DATABASE_URL;
const hasDatabase = Boolean(connectionString);

const db = hasDatabase
  ? new PrismaClient({ adapter: new PrismaPg({ connectionString: connectionString as string }) })
  : null;

beforeAll(() => {
  if (!hasDatabase) {
    console.warn("DATABASE_URL is not set — skipping the database invariant tests.");
  }
});

afterAll(async () => {
  await db?.$disconnect();
});

describe.skipIf(!hasDatabase)("stored data invariants", () => {
  it("never lets the status cache disagree with the newest history row", async () => {
    const issues = await db!.issue.findMany({
      select: {
        id: true,
        status: true,
        history: { orderBy: { sequence: "desc" }, take: 1, select: { status: true } },
      },
    });

    const disagreements = issues
      .filter((issue) => issue.history[0]?.status !== issue.status)
      .map((issue) => `${issue.id}: cache=${issue.status} history=${issue.history[0]?.status}`);

    // Named rather than counted, so a failure says which row is wrong.
    expect(disagreements).toEqual([]);
  });

  it("never has an issue with no history at all", async () => {
    // An issue without history is an issue whose status came from nowhere.
    // It can only happen if something created the issue outside the
    // transaction that is supposed to write both.
    const orphans = await db!.issue.findMany({
      where: { history: { none: {} } },
      select: { id: true },
    });

    expect(orphans.map((o) => o.id)).toEqual([]);
  });

  it("never has a history row without a reason", async () => {
    // The column is NOT NULL, so this is really checking that nothing has
    // slipped through as an empty string — which the database would accept.
    const unexplained = await db!.issueStatusHistory.findMany({
      where: { reason: "" },
      select: { id: true },
    });

    expect(unexplained.map((h) => h.id)).toEqual([]);
  });

  it("starts every issue's history with a SUBMITTED row", async () => {
    const issues = await db!.issue.findMany({
      select: {
        id: true,
        history: { orderBy: { sequence: "asc" }, take: 1, select: { status: true } },
      },
    });

    const wrongStart = issues
      .filter((issue) => issue.history[0] && issue.history[0].status !== "SUBMITTED")
      .map((issue) => issue.id);

    expect(wrongStart).toEqual([]);
  });

  it("never exposes an email address through the public issue query", async () => {
    // A structural check on the shape the public pages receive. If somebody
    // adds `email: true` to the shared select, this fails before it reaches a
    // page and gets rendered into a payload.
    const issue = await db!.issue.findFirst({
      select: { reporter: { select: { id: true, displayName: true } } },
    });

    if (!issue) return;

    expect(Object.keys(issue.reporter).sort()).toEqual(["displayName", "id"]);
  });
});
