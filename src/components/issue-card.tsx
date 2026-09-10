import Link from "next/link";
import type { PublicIssue } from "@/lib/issues";
import { formatRelative, daysSince } from "@/lib/format";
import { isOverdue } from "@/lib/status";
import { OVERDUE_AFTER_DAYS } from "@/lib/constants";
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
  const updates = issue._count.history;

  return (
    <Link
      href={`/issues/${issue.id}`}
      className="group flex gap-4 rounded-card border border-line bg-surface p-4 shadow-card transition-all hover:-translate-y-px hover:border-line-strong hover:shadow-raised sm:gap-5 sm:p-5"
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
          className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-lg bg-surface-sunken text-2xl sm:h-20 sm:w-20"
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
          {/* The update count is the interesting number on this card: it is how
              much has actually happened, as opposed to how long ago it was
              filed. */}
          <span aria-hidden="true">·</span>
          <span className="font-medium text-ink-soft">
            {updates} update{updates === 1 ? "" : "s"}
          </span>
        </p>
      </div>
    </Link>
  );
}
