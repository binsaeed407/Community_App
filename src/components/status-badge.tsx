import type { IssueStatus } from "@/generated/prisma/enums";
import { STATUS_CLASS, STATUS_DESCRIPTION, STATUS_LABEL, STATUS_DOT } from "@/lib/status";
import { cx } from "@/components/ui";

/**
 * The status of an issue, as a label.
 *
 * The label is always text and the dot is always paired with it. Colour
 * reinforces the meaning and never carries it alone, so the badge still works
 * in greyscale, in a screenshot, and for a reader who cannot tell the hues
 * apart — which matters more here than usual, because these six colours are the
 * difference between "we are working on it" and "we closed it".
 */
export function StatusBadge({
  status,
  size = "md",
}: {
  status: IssueStatus;
  size?: "sm" | "md";
}) {
  return (
    <span
      title={STATUS_DESCRIPTION[status]}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        STATUS_CLASS[status],
      )}
    >
      <span aria-hidden="true" className={cx("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Shown alongside the status when an issue has been open too long. */
export function OverdueBadge({ days }: { days?: number }) {
  return (
    <span
      title="Open for longer than the service target"
      className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-900 dark:border-red-900/70 dark:bg-red-950/60 dark:text-red-200"
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-red-500" />
      {days ? `Overdue by ${days}d` : "Overdue"}
    </span>
  );
}
