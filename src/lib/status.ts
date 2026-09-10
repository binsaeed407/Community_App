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
 * Tailwind classes per status, built from design tokens.
 *
 * Colour is never the only signal — every badge also carries its label as text
 * and a solid dot — so the system survives greyscale, a screenshot, and a reader
 * who cannot distinguish the hues.
 *
 * Deliberately NOT Tailwind `dark:` utilities. Those compile to a
 * prefers-color-scheme media query, which follows the operating system and would
 * therefore ignore the in-app theme toggle — leaving the six colours that carry
 * meaning stuck in the wrong mode while everything around them changed.
 *
 * SUBMITTED and REJECTED used to be two shades of the same grey, so "nobody has
 * looked at this yet" and "this was considered and closed" were
 * indistinguishable — the two states a reporter most needs told apart. SUBMITTED
 * is now a cool slate (untouched) and REJECTED a warm stone (filed and done).
 */
export const STATUS_CLASS: Record<IssueStatus, string> = {
  SUBMITTED: "border-st-submitted-line bg-st-submitted text-st-submitted-ink",
  ACKNOWLEDGED: "border-st-acknowledged-line bg-st-acknowledged text-st-acknowledged-ink",
  IN_PROGRESS: "border-st-in-progress-line bg-st-in-progress text-st-in-progress-ink",
  RESOLVED: "border-st-resolved-line bg-st-resolved text-st-resolved-ink",
  REJECTED: "border-st-rejected-line bg-st-rejected text-st-rejected-ink",
  REOPENED: "border-st-reopened-line bg-st-reopened text-st-reopened-ink",
};

/** The solid version, as a background — a badge dot, a bar segment, a marker. */
export const STATUS_DOT: Record<IssueStatus, string> = {
  SUBMITTED: "bg-st-submitted-dot",
  ACKNOWLEDGED: "bg-st-acknowledged-dot",
  IN_PROGRESS: "bg-st-in-progress-dot",
  RESOLVED: "bg-st-resolved-dot",
  REJECTED: "bg-st-rejected-dot",
  REOPENED: "bg-st-reopened-dot",
};

/** The solid version, as a border — the accent edge on a card or timeline entry. */
export const STATUS_EDGE: Record<IssueStatus, string> = {
  SUBMITTED: "border-st-submitted-dot",
  ACKNOWLEDGED: "border-st-acknowledged-dot",
  IN_PROGRESS: "border-st-in-progress-dot",
  RESOLVED: "border-st-resolved-dot",
  REJECTED: "border-st-rejected-dot",
  REOPENED: "border-st-reopened-dot",
};

/**
 * The CSS custom property holding the solid colour.
 *
 * Needed by the map, which builds its markers as an HTML string outside React
 * and so cannot use a Tailwind class.
 */
export const STATUS_DOT_VAR: Record<IssueStatus, string> = {
  SUBMITTED: "--color-st-submitted-dot",
  ACKNOWLEDGED: "--color-st-acknowledged-dot",
  IN_PROGRESS: "--color-st-in-progress-dot",
  RESOLVED: "--color-st-resolved-dot",
  REJECTED: "--color-st-rejected-dot",
  REOPENED: "--color-st-reopened-dot",
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
