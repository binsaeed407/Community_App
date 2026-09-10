import Link from "next/link";
import type { PublicIssue } from "@/lib/issues";
import { formatRelative, daysSince } from "@/lib/format";
import { isOverdue, STATUS_EDGE } from "@/lib/status";
import { categoryTint } from "@/lib/categories";
import { OVERDUE_AFTER_DAYS } from "@/lib/constants";
import { OverdueBadge, StatusBadge } from "@/components/status-badge";
import { cx } from "@/components/ui";

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
  const updates = issue._count.history;

  return (
    <Link
      href={`/issues/${issue.id}`}
      className={cx(
        "group flex gap-4 rounded-card border border-l-4 border-line bg-surface p-4 shadow-card transition-all hover:-translate-y-px hover:border-line-strong hover:shadow-raised sm:gap-5 sm:p-5",
        // The left edge carries the status colour, so a list of twelve cards
        // shows its status distribution as a column before a single badge is
        // read. hover:border-line-strong only affects the other three sides
        // because this rule comes after it.
        STATUS_EDGE[issue.status],
      )}
    >
      {photo ? (
        /* Cloudinary already serves a resized, optimised image, so next/image
           would add a second optimisation pass and consume a Vercel image
           transformation quota for no benefit. */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.url}
          alt=""
          className="h-[72px] w-[72px] shrink-0 rounded-lg object-cover sm:h-20 sm:w-20"
          loading="lazy"
        />
      ) : (
        <div
          aria-hidden="true"
          className={cx(
            "grid h-[72px] w-[72px] shrink-0 place-items-center rounded-lg text-2xl sm:h-20 sm:w-20",
            categoryTint(issue.category.slug),
          )}
        >
          {issue.category.icon}
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={issue.status} size="sm" />
          {overdue ? <OverdueBadge days={daysSince(issue.createdAt) - OVERDUE_AFTER_DAYS} /> : null}
        </div>

        <h3 className="mt-2 text-balance font-medium leading-snug tracking-tight decoration-1 underline-offset-2 group-hover:underline">
          {issue.title}
        </h3>

        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-soft">
          {issue.description}
        </p>

        <p className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-ink-faint">
          <span aria-hidden="true">{issue.category.icon}</span>
          <span>{issue.category.name}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{issue.addressLabel}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={issue.createdAt.toISOString()}>{formatRelative(issue.createdAt)}</time>
          <span aria-hidden="true">·</span>
          {/* How much has actually happened is the interesting number on a list
              about accountability, so it is the one coloured thing on the card. */}
          <span className="font-semibold text-brand">
            {updates} update{updates === 1 ? "" : "s"}
          </span>
        </p>
      </div>
    </Link>
  );
}
