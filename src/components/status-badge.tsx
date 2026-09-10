import type { IssueStatus } from "@/generated/prisma/enums";
import { STATUS_CLASS, STATUS_DESCRIPTION, STATUS_LABEL } from "@/lib/status";

/**
 * The status of an issue, as a label.
 *
 * The label is always text. Colour reinforces it and never carries the meaning
 * alone, so the badge still works in greyscale, in a screenshot, and for a
 * reader who cannot tell the hues apart.
 */
export function StatusBadge({ status }: { status: IssueStatus }) {
  return (
    <span
      title={STATUS_DESCRIPTION[status]}
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Shown alongside the status when an issue has been open too long. */
export function OverdueBadge() {
  return (
    <span
      title="Open for longer than the service target"
      className="inline-flex items-center rounded-full border border-red-300 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
    >
      Overdue
    </span>
  );
}
