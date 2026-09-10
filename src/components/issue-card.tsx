import Link from "next/link";
import type { PublicIssue } from "@/lib/issues";
import { formatRelative } from "@/lib/format";
import { isOverdue } from "@/lib/status";
import { OverdueBadge, StatusBadge } from "@/components/status-badge";

/**
 * One issue in a list.
 *
 * The whole card is a link. The alternative — a "View" button in the corner —
 * gives a much smaller target on a phone, which is where most of these reports
 * would be filed and read.
 */
export function IssueCard({ issue }: { issue: PublicIssue }) {
  const overdue = isOverdue(issue);
  const photo = issue.attachments.find((a) => a.kind === "REPORT");

  return (
    <Link
      href={`/issues/${issue.id}`}
      className="group flex gap-4 rounded-lg border border-neutral-200 bg-white p-4 transition hover:border-neutral-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-600"
    >
      {photo ? (
        /* Cloudinary already serves a resized, optimised image, so next/image
           would add a second optimisation pass and consume a Vercel image
           transformation quota for no benefit. */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.url}
          alt=""
          className="h-20 w-20 shrink-0 rounded-md object-cover"
          loading="lazy"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-2xl dark:bg-neutral-900"
        >
          {issue.category.icon}
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={issue.status} />
          {overdue ? <OverdueBadge /> : null}
          <span className="text-xs text-neutral-500">{issue.category.name}</span>
        </div>

        <h3 className="font-medium leading-snug group-hover:underline">{issue.title}</h3>

        <p className="line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
          {issue.description}
        </p>

        <p className="text-xs text-neutral-500">
          {issue.addressLabel} ·{" "}
          <time dateTime={issue.createdAt.toISOString()}>{formatRelative(issue.createdAt)}</time> ·{" "}
          {issue._count.history} update{issue._count.history === 1 ? "" : "s"}
        </p>
      </div>
    </Link>
  );
}
