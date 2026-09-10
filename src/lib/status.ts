import type { IssueStatus } from "@/generated/prisma/enums";
import { OVERDUE_AFTER_DAYS } from "@/lib/constants";

/**
 * Everything the app knows about what a status means.
 *
 * Kept in one place because the alternative is a switch statement copied into
 * every component, and then one of them quietly disagrees with the others.
 */

export const ISSUE_STATUSES = [
  "SUBMITTED",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
  "REOPENED",
] as const satisfies readonly IssueStatus[];

/** What a citizen sees. Deliberately plain English, not enum names. */
export const STATUS_LABEL: Record<IssueStatus, string> = {
  SUBMITTED: "Submitted",
  ACKNOWLEDGED: "Acknowledged",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  REJECTED: "Closed",
  REOPENED: "Reopened",
};

/** A sentence explaining what the status actually means for the reporter. */
export const STATUS_DESCRIPTION: Record<IssueStatus, string> = {
  SUBMITTED: "Reported, and waiting to be looked at.",
  ACKNOWLEDGED: "Someone has confirmed the problem is real.",
  IN_PROGRESS: "Work has started.",
  RESOLVED: "Reported as fixed, with evidence.",
  REJECTED: "Closed without action, with a reason given.",
  REOPENED: "Reported again because the problem came back or was not fixed.",
};

/**
 * Tailwind classes per status. Colour is never the only signal — every badge
 * also carries its label as text, so this survives being read in greyscale or
 * by someone who cannot distinguish the hues.
 */
export const STATUS_CLASS: Record<IssueStatus, string> = {
  SUBMITTED:
    "border-neutral-300 bg-neutral-100 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
  ACKNOWLEDGED:
    "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100",
  IN_PROGRESS:
    "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
  RESOLVED:
    "border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100",
  REJECTED:
    "border-neutral-300 bg-neutral-50 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400",
  REOPENED:
    "border-purple-300 bg-purple-50 text-purple-900 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-100",
};

/**
 * Statuses where the council still owes the reporter something.
 *
 * REOPENED counts as open — that is the whole point of reopening. REJECTED
 * does not: it is closed, but with a reason, which is different from ignored.
 */
const OPEN_STATUSES = new Set<IssueStatus>([
  "SUBMITTED",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "REOPENED",
]);

export function isOpen(status: IssueStatus): boolean {
  return OPEN_STATUSES.has(status);
}

/**
 * Whether an issue has been open longer than the service promises.
 *
 * Measured from when it was reported, not from the last update — otherwise an
 * administrator could keep an issue permanently "not overdue" by posting a
 * comment every six days without ever fixing anything.
 */
export function isOverdue(
  issue: { status: IssueStatus; createdAt: Date },
  now: Date = new Date(),
): boolean {
  if (!isOpen(issue.status)) return false;

  const ageInDays = (now.getTime() - issue.createdAt.getTime()) / (24 * 60 * 60 * 1000);
  return ageInDays > OVERDUE_AFTER_DAYS;
}
