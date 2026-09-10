import { describe, expect, it } from "vitest";
import { allowedTransitions, canTransition, requiresEvidence } from "./transitions";
import { ISSUE_STATUSES, isOpen, isOverdue } from "./status";
import { OVERDUE_AFTER_DAYS } from "./constants";

describe("status transitions", () => {
  it("lets an administrator move a new report forward", () => {
    expect(canTransition("SUBMITTED", "ACKNOWLEDGED", "ADMIN")).toBe(true);
    expect(canTransition("ACKNOWLEDGED", "IN_PROGRESS", "ADMIN")).toBe(true);
    expect(canTransition("IN_PROGRESS", "RESOLVED", "ADMIN")).toBe(true);
  });

  it("does not let an administrator reopen an issue they resolved", () => {
    // Otherwise "resolved" could be applied, withdrawn and reapplied at will,
    // and the word would stop meaning anything.
    expect(canTransition("RESOLVED", "IN_PROGRESS", "ADMIN")).toBe(false);
    expect(canTransition("RESOLVED", "REOPENED", "ADMIN")).toBe(false);
    expect(allowedTransitions("RESOLVED", "ADMIN")).toEqual([]);
  });

  it("lets the reporter reopen a resolved or rejected issue", () => {
    expect(canTransition("RESOLVED", "REOPENED", "CITIZEN")).toBe(true);
    expect(canTransition("REJECTED", "REOPENED", "CITIZEN")).toBe(true);
  });

  it("gives a citizen no other power over status", () => {
    // Enough to contest an outcome, not enough to drive the workflow.
    expect(canTransition("SUBMITTED", "RESOLVED", "CITIZEN")).toBe(false);
    expect(canTransition("SUBMITTED", "ACKNOWLEDGED", "CITIZEN")).toBe(false);
    expect(canTransition("IN_PROGRESS", "RESOLVED", "CITIZEN")).toBe(false);
  });

  it("never allows a transition to the status it is already in", () => {
    // A no-op change would append a history row saying nothing happened, which
    // is noise in the one record that is supposed to be worth reading.
    for (const status of ISSUE_STATUSES) {
      expect(canTransition(status, status, "ADMIN")).toBe(false);
      expect(canTransition(status, status, "CITIZEN")).toBe(false);
    }
  });

  it("only ever offers real statuses", () => {
    for (const status of ISSUE_STATUSES) {
      for (const actor of ["ADMIN", "CITIZEN"] as const) {
        for (const target of allowedTransitions(status, actor)) {
          expect(ISSUE_STATUSES).toContain(target);
        }
      }
    }
  });

  it("requires evidence for resolution and nothing else", () => {
    expect(requiresEvidence("RESOLVED")).toBe(true);
    for (const status of ISSUE_STATUSES.filter((s) => s !== "RESOLVED")) {
      expect(requiresEvidence(status)).toBe(false);
    }
  });
});

describe("open and overdue", () => {
  const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  it("counts a reopened issue as open", () => {
    // The entire point of reopening is that the council owes the reporter
    // something again.
    expect(isOpen("REOPENED")).toBe(true);
  });

  it("counts a rejected issue as closed", () => {
    // Closed with a reason is not the same as ignored, but it is not open.
    expect(isOpen("REJECTED")).toBe(false);
  });

  it("marks an old open issue overdue", () => {
    expect(isOverdue({ status: "SUBMITTED", createdAt: daysAgo(OVERDUE_AFTER_DAYS + 1) })).toBe(
      true,
    );
  });

  it("never marks a resolved issue overdue, however old", () => {
    expect(isOverdue({ status: "RESOLVED", createdAt: daysAgo(365) })).toBe(false);
  });

  it("measures age from the report, not from the last update", () => {
    // Measuring from the last update would let an administrator keep an issue
    // permanently "not overdue" by posting a comment every six days without
    // ever fixing anything.
    const old = { status: "IN_PROGRESS" as const, createdAt: daysAgo(30) };
    expect(isOverdue(old)).toBe(true);
  });

  it("does not mark an issue overdue on the boundary day itself", () => {
    expect(
      isOverdue({ status: "SUBMITTED", createdAt: daysAgo(OVERDUE_AFTER_DAYS - 0.5) }),
    ).toBe(false);
  });
});
