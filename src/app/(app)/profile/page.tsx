import Link from "next/link";
import { requireUser } from "@/lib/guards";
import { getProfileStats, getRecentReports } from "@/lib/profile";
import { formatDate, formatRelative } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/status";
import { StatusBadge } from "@/components/status-badge";
import { ButtonLink, Card, EmptyState, PageHeader, Shell, Stat, cx } from "@/components/ui";

export const metadata = {
  title: "Your profile",
};

/**
 * Your own account.
 *
 * Everything here is derived from tables that already exist — there is no
 * profile table and no denormalised counters. It is also the only screen in the
 * app that renders an email address, and it renders only your own.
 */
export default async function ProfilePage() {
  const user = await requireUser();
  const [stats, recent] = await Promise.all([
    getProfileStats(user.id),
    getRecentReports(user.id),
  ]);

  const isAdmin = user.role === "ADMIN";

  const initials = user.displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <Shell>
      <PageHeader
        eyebrow="Account"
        title="Your profile"
        description="What this service knows about you, and what you have reported."
        actions={
          <>
            <ButtonLink href="/my-reports" variant="secondary">
              All my reports
            </ButtonLink>
            <ButtonLink href="/report">Report a problem</ButtonLink>
          </>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ------------------------------------------------------ activity */}
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-ink-faint">
              Your reporting
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-4">
              <Stat label="Reported" value={stats.total} />
              <Stat label="Still open" value={stats.open} />
              <Stat label="Resolved" value={stats.resolved} />
              <Stat
                label="Reopened"
                value={
                  <span className={stats.reopened > 0 ? "text-accent" : undefined}>
                    {stats.reopened}
                  </span>
                }
              />
            </div>

            {stats.total > 0 ? (
              <>
                {/*
                  A proportional bar rather than a chart library. It is one div
                  per status, width set from a percentage — and it says the same
                  thing a bar chart would while being twenty lines of readable
                  markup instead of a dependency.
                */}
                <div className="mt-6 flex h-2 overflow-hidden rounded-full bg-surface-sunken">
                  {Object.entries(stats.byStatus).map(([status, count]) => (
                    <div
                      key={status}
                      title={`${STATUS_LABEL[status as keyof typeof STATUS_LABEL]}: ${count}`}
                      style={{ width: `${(count / stats.total) * 100}%` }}
                      className={cx(
                        status === "RESOLVED" && "bg-emerald-500",
                        status === "IN_PROGRESS" && "bg-amber-500",
                        status === "ACKNOWLEDGED" && "bg-sky-500",
                        status === "REOPENED" && "bg-violet-500",
                        status === "SUBMITTED" && "bg-ink-faint",
                        status === "REJECTED" && "bg-ink-faint/40",
                      )}
                    />
                  ))}
                </div>
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
                  {Object.entries(stats.byStatus).map(([status, count]) => (
                    <li key={status}>
                      {STATUS_LABEL[status as keyof typeof STATUS_LABEL]} · {count}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </Card>

          <Card className="p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-ink-faint">
                Recent reports
              </h2>
              {stats.total > recent.length ? (
                <Link href="/my-reports" className="text-xs text-brand hover:underline">
                  See all {stats.total}
                </Link>
              ) : null}
            </div>

            {recent.length === 0 ? (
              <div className="mt-4">
                <EmptyState title="You have not reported anything yet">
                  When you report a problem it appears here, along with everything that happens to
                  it.{" "}
                  <Link href="/report" className="text-brand underline underline-offset-4">
                    Report your first problem
                  </Link>
                  .
                </EmptyState>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {recent.map((issue) => (
                  <li key={issue.id} className="py-3 first:pt-0 last:pb-0">
                    <Link
                      href={`/issues/${issue.id}`}
                      className="group flex items-start gap-3"
                    >
                      <span aria-hidden="true" className="mt-0.5 text-base">
                        {issue.category.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium group-hover:underline">
                          {issue.title}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-2">
                          <StatusBadge status={issue.status} size="sm" />
                          <span className="truncate text-xs text-ink-faint">
                            {issue.addressLabel} · {formatRelative(issue.createdAt)}
                          </span>
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* ------------------------------------------------------- account */}
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className={cx(
                  "grid h-14 w-14 shrink-0 place-items-center rounded-full text-lg font-semibold",
                  isAdmin ? "bg-brand text-on-brand" : "bg-brand-soft text-brand",
                )}
              >
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold tracking-tight">{user.displayName}</p>
                <span
                  className={cx(
                    "mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
                    isAdmin ? "bg-brand-soft text-brand" : "bg-surface-sunken text-ink-soft",
                  )}
                >
                  {isAdmin ? "Administrator" : "Resident"}
                </span>
              </div>
            </div>

            <dl className="mt-6 flex flex-col gap-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-[0.08em] text-ink-faint">
                  Display name
                </dt>
                <dd className="mt-0.5">{user.displayName}</dd>
                <p className="mt-1 text-xs text-ink-faint">
                  This is the only part of your account shown publicly, on the reports you file.
                </p>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.08em] text-ink-faint">Email</dt>
                <dd className="mt-0.5 break-all font-mono text-xs">{user.email}</dd>
                <p className="mt-1 text-xs text-ink-faint">
                  Used only to sign in. It is never rendered on a public page.
                </p>
              </div>
              {stats.firstReportAt ? (
                <div>
                  <dt className="text-xs uppercase tracking-[0.08em] text-ink-faint">
                    First report
                  </dt>
                  <dd className="mt-0.5">{formatDate(stats.firstReportAt)}</dd>
                </div>
              ) : null}
            </dl>
          </Card>

          {isAdmin ? (
            <Card className="p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-ink-faint">
                Your record as an administrator
              </h2>
              <p className="mt-3 text-sm text-ink-soft">
                You have taken{" "}
                <span className="font-semibold text-ink">{stats.auditEntries}</span> recorded
                actions. Each one is permanent, carries the reason you gave, and is attributed to
                you by name on the public timeline.
              </p>
              <ButtonLink href="/admin" variant="secondary" size="sm" className="mt-4">
                Go to triage
              </ButtonLink>
            </Card>
          ) : null}

          <Card tone="sunken" className="p-6">
            <h2 className="text-sm font-semibold">Changing your details</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Editing your display name and password is not built yet, and this page says so
              rather than showing a button that does nothing. Your display name already appears on
              reports you have filed, so changing it would rewrite how you are named on a record
              that is supposed to be permanent — which is a decision worth making deliberately
              rather than shipping by default.
            </p>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
