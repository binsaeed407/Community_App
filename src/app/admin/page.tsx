import Link from "next/link";
import { requireAdmin } from "@/lib/guards";
import { getDashboard } from "@/lib/admin";
import { formatRelative, daysSince } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/status";
import { OVERDUE_AFTER_DAYS } from "@/lib/constants";
import type { IssueStatus } from "@/generated/prisma/enums";

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
  emphasise,
}: {
  title: string;
  description: string;
  issues: Row[];
  emphasise?: boolean;
}) {
  return (
    <section
      className={`rounded-lg border p-5 ${
        emphasise
          ? "border-red-300 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30"
          : "border-neutral-200 dark:border-neutral-800"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold tracking-tight">{title}</h2>
        <span className="text-sm tabular-nums text-neutral-500">{issues.length}</span>
      </div>
      <p className="mt-0.5 text-xs text-neutral-500">{description}</p>

      {issues.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">Nothing here.</p>
      ) : (
        <ul className="mt-4 flex flex-col divide-y divide-neutral-200 dark:divide-neutral-800">
          {issues.map((issue) => (
            <li key={issue.id} className="py-2.5 first:pt-0 last:pb-0">
              <Link
                href={`/admin/issues/${issue.id}`}
                className="block hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
              >
                <span className="text-sm font-medium">
                  <span aria-hidden="true">{issue.category.icon}</span> {issue.title}
                </span>
                <span className="mt-0.5 block text-xs text-neutral-500">
                  {STATUS_LABEL[issue.status]} · {issue.addressLabel} ·{" "}
                  {formatRelative(issue.createdAt)} · {daysSince(issue.createdAt)} days old
                </span>
              </Link>
            </li>
          ))}
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
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        {total} report{total === 1 ? "" : "s"} in total. Overdue means open for more than{" "}
        {OVERDUE_AFTER_DAYS} days.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <Bucket
          title="Overdue"
          description={`Open for more than ${OVERDUE_AFTER_DAYS} days. These are the ones a resident is already unhappy about.`}
          issues={overdue}
          emphasise
        />
        <Bucket
          title="Needs a decision"
          description="Newly submitted, or reopened because the fix did not hold. Oldest first."
          issues={needsTriage}
        />
        <Bucket
          title="Being worked on"
          description="Acknowledged or in progress. Oldest first."
          issues={inProgress}
        />
        <Bucket
          title="Recently resolved"
          description="Closed with evidence attached."
          issues={recentlyResolved}
        />
      </div>
    </main>
  );
}
