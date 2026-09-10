import Link from "next/link";
import { requireAdmin } from "@/lib/guards";
import { getDashboard } from "@/lib/admin";
import { daysSince } from "@/lib/format";
import { STATUS_CLASS, STATUS_DOT, STATUS_LABEL } from "@/lib/status";
import type { IssueStatus } from "@/generated/prisma/enums";
import { OVERDUE_AFTER_DAYS } from "@/lib/constants";
import { Shell, PageHeader, Stat, cx } from "@/components/ui";

export const metadata = {
  title: "Dashboard",
};

type Row = {
  id: string;
  title: string;
  status: IssueStatus;
  createdAt: Date;
  addressLabel: string;
  category: { name: string; icon: string };
  reporter: { displayName: string };
};

function Bucket({
  title,
  description,
  issues,
  urgent,
  tone,
}: {
  title: string;
  description: string;
  issues: Row[];
  urgent?: boolean;
  /**
   * The status this bucket is about. Its header takes that status’s own tint,
   * so the dashboard teaches the same six colours the badges use rather than
   * being four identical grey panels with one red one.
   */
  tone?: IssueStatus;
}) {
  return (
    <section
      className={cx(
        "flex flex-col rounded-card border bg-surface shadow-card",
        urgent ? "border-red-300 dark:border-red-900/70" : "border-line",
      )}
    >
      <div
        className={cx(
          "flex items-baseline justify-between gap-3 rounded-t-card border-b px-5 py-3.5",
          urgent
            ? "border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40"
            : tone
              ? STATUS_CLASS[tone]
              : "border-line bg-surface-sunken",
        )}
      >
        <div>
          <h2 className="font-semibold tracking-tight">{title}</h2>
          <p className="mt-0.5 text-xs text-ink-faint">{description}</p>
        </div>
        <span
          className={cx(
            "shrink-0 rounded-full px-2.5 py-0.5 text-sm font-semibold tabular-nums text-white",
            urgent ? "bg-red-600" : tone ? STATUS_DOT[tone] : "bg-ink-faint",
          )}
        >
          {issues.length}
        </span>
      </div>

      {issues.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-ink-faint">Nothing here.</p>
      ) : (
        <ul className="divide-y divide-line">
          {issues.map((issue) => {
            const age = daysSince(issue.createdAt);
            return (
              <li key={issue.id}>
                <Link
                  href={`/admin/issues/${issue.id}`}
                  className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-surface-sunken"
                >
                  <span aria-hidden="true" className="mt-0.5 text-base">
                    {issue.category.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{issue.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-ink-faint">
                      {STATUS_LABEL[issue.status]} · {issue.addressLabel}
                    </span>
                  </span>
                  {/* Age is the number that matters on a triage screen, so it is
                      right-aligned and tabular — the column scans vertically. */}
                  <span
                    className={cx(
                      "shrink-0 text-xs font-medium tabular-nums",
                      age > OVERDUE_AFTER_DAYS ? "text-red-600 dark:text-red-400" : "text-ink-faint",
                    )}
                  >
                    {age}d
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/**
 * The administrator's dashboard.
 *
 * Sorted into what needs a decision, what is being worked on, what has been
 * waiting too long, and what was recently finished. The overdue list overlaps
 * the first two on purpose — an issue can be both new and overdue, and the
 * whole reason for showing it is that it should not have stayed new.
 */
export default async function AdminDashboard() {
  await requireAdmin();

  const { needsTriage, inProgress, overdue, recentlyResolved, countByStatus } =
    await getDashboard();

  const total = Object.values(countByStatus).reduce((sum, n) => sum + n, 0);

  return (
    <Shell>
      <PageHeader
        eyebrow="Administrator"
        title="Triage"
        description={`Everything reported to this service. Overdue means open for more than ${OVERDUE_AFTER_DAYS} days.`}
      />

      <div className="mt-6 flex flex-wrap gap-x-10 gap-y-5">
        <Stat label="Total reports" value={total} />
        <Stat label="Needs a decision" value={needsTriage.length} />
        <Stat label="In progress" value={inProgress.length} />
        <Stat
          label="Overdue"
          value={
            <span className={overdue.length > 0 ? "text-red-600 dark:text-red-400" : undefined}>
              {overdue.length}
            </span>
          }
        />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Bucket
          title="Overdue"
          description="Someone is already unhappy about these."
          issues={overdue}
          urgent
        />
        <Bucket
          title="Needs a decision"
          description="New, or reopened because the fix did not hold."
          issues={needsTriage}
          tone="SUBMITTED"
        />
        <Bucket
          title="Being worked on"
          description="Acknowledged or in progress. Oldest first."
          issues={inProgress}
          tone="IN_PROGRESS"
        />
        <Bucket
          title="Recently resolved"
          description="Closed with evidence attached."
          issues={recentlyResolved}
          tone="RESOLVED"
        />
      </div>
    </Shell>
  );
}
