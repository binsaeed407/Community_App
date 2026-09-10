import type { IssueStatus } from "@/generated/prisma/enums";

/**
 * Which status changes are allowed, and who may make them.
 *
 * A pure lookup table with no database and no session, so it can be unit
 * tested exhaustively and read in one sitting. The rules are policy, and policy
 * belongs somewhere a person can check it — not spread across the branches of
 * a server action.
 */

export type Actor = "CITIZEN" | "ADMIN";

/** What an administrator may move an issue to, from each status. */
const ADMIN_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  SUBMITTED: ["ACKNOWLEDGED", "IN_PROGRESS", "REJECTED"],
  ACKNOWLEDGED: ["IN_PROGRESS", "RESOLVED", "REJECTED"],
  IN_PROGRESS: ["RESOLVED", "REJECTED"],
  REOPENED: ["ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "REJECTED"],

  // Terminal for an administrator. Getting a resolved issue moving again is the
  // reporter's call, not the council's — otherwise "resolved" could be applied,
  // withdrawn and reapplied at will, and the word would stop meaning anything.
  RESOLVED: [],
  REJECTED: [],
};

/**
 * What a citizen may do to their own report.
 *
 * Exactly one thing: say it is not actually fixed. That is deliberately the
 * only power a reporter has over status — enough to contest an outcome,
 * not enough to drive the workflow.
 */
const CITIZEN_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  RESOLVED: ["REOPENED"],
  REJECTED: ["REOPENED"],

  SUBMITTED: [],
  ACKNOWLEDGED: [],
  IN_PROGRESS: [],
  REOPENED: [],
};

export function allowedTransitions(from: IssueStatus, actor: Actor): IssueStatus[] {
  return actor === "ADMIN" ? ADMIN_TRANSITIONS[from] : CITIZEN_TRANSITIONS[from];
}

export function canTransition(from: IssueStatus, to: IssueStatus, actor: Actor): boolean {
  return allowedTransitions(from, actor).includes(to);
}

/**
 * Statuses that cannot be claimed without a photo.
 *
 * Only RESOLVED. "We fixed it" is the one claim in this system that a citizen
 * has no way of checking from their sofa, and it is the claim the whole app
 * exists to hold someone to. Requiring evidence turns it from an assertion into
 * something a resident can look at and disagree with.
 */
export function requiresEvidence(to: IssueStatus): boolean {
  return to === "RESOLVED";
}
