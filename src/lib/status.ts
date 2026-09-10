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
    "border-line-strong bg-surface-sunken text-ink-soft",
  ACKNOWLEDGED:
    "border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-800/70 dark:bg-sky-950/60 dark:text-sky-200",
  IN_PROGRESS:
    "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800/70 dark:bg-amber-950/60 dark:text-amber-200",
  RESOLVED:
    "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800/70 dark:bg-emerald-950/60 dark:text-emerald-200",
  REJECTED:
    "border-line bg-surface-sunken text-ink-faint",
  REOPENED:
    "border-violet-300 bg-violet-50 text-violet-900 dark:border-violet-800/70 dark:bg-violet-950/60 dark:text-violet-200",
};

/** The dot on the timeline rail. Solid, so it reads at 10px. */
export const STATUS_DOT: Record<IssueStatus, string> = {
  SUBMITTED: "bg-ink-faint",
  ACKNOWLEDGED: "bg-sky-500",
  IN_PROGRESS: "bg-amber-500",
  RESOLVED: "bg-emerald-500",
  REJECTED: "bg-ink-faint/50",
  REOPENED: "bg-violet-500",
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
