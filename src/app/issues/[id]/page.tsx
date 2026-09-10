import Link from "next/link";
import { notFound } from "next/navigation";
import { getIssue } from "@/lib/issues";
import { formatDate, daysSince } from "@/lib/format";
import { isOpen, isOverdue, STATUS_DESCRIPTION, STATUS_LABEL } from "@/lib/status";
import { OverdueBadge, StatusBadge } from "@/components/status-badge";
import { IssueTimeline } from "@/components/issue-timeline";
import { ReopenForm } from "@/components/reopen-form";
import { getSessionUser } from "@/lib/guards";
import { canTransition } from "@/lib/transitions";
import { OVERDUE_AFTER_DAYS } from "@/lib/constants";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const issue = await getIssue((await params).id);
  if (!issue) return { title: "Issue not found" };

  return {
    title: issue.title,
    description: issue.description.slice(0, 160),
  };
}

/**
 * A single issue, readable by anyone.
 *
 * This page is the product. Everything else exists so that this page can be
 * trusted: what was reported, who has touched it since, what they said, and
 * whether anything actually happened.
 */
export default async function IssuePage({ params }: { params: Promise<{ id: string }> }) {
  const [issue, viewer] = await Promise.all([getIssue((await params).id), getSessionUser()]);

  if (!issue) notFound();

  // Only the reporter can reopen, and only from a status the rules allow it
  // from. The server action checks both again; this just decides whether to
  // show the form at all.
  const canReopen =
    viewer?.id === issue.reporter.id && canTransition(issue.status, "REOPENED", "CITIZEN");

  const overdue = isOverdue(issue);
  const age = daysSince(issue.createdAt);
  const reportPhotos = issue.attachments.filter((a) => a.kind === "REPORT");
  const evidencePhotos = issue.attachments.filter((a) => a.kind === "EVIDENCE");

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Link
        href="/issues"
        className="text-sm text-neutral-600 underline transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
      >
        ← All issues
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <StatusBadge status={issue.status} />
        {overdue ? <OverdueBadge /> : null}
        <span className="text-sm text-neutral-500">
          <span aria-hidden="true">{issue.category.icon}</span> {issue.category.name}
        </span>
      </div>

      <h1 className="mt-3 text-3xl font-bold tracking-tight">{issue.title}</h1>

      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        Reported by <span className="font-medium">{issue.reporter.displayName}</span> on{" "}
        <time dateTime={issue.createdAt.toISOString()}>{formatDate(issue.createdAt)}</time>
        {" · "}
        {issue.addressLabel}
      </p>

      {/*
        Says what the current status means in a sentence. "Acknowledged" is
        jargon to somebody who just wants to know whether their pothole is
        getting fixed.
      */}
      <p className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
        <span className="font-medium">{STATUS_LABEL[issue.status]}.</span>{" "}
        {STATUS_DESCRIPTION[issue.status]}
        {overdue ? (
          <>
            {" "}
            This has been open for {age} days, which is past the {OVERDUE_AFTER_DAYS}-day target.
          </>
        ) : isOpen(issue.status) ? (
          <> Open for {age} day{age === 1 ? "" : "s"}.</>
        ) : null}
      </p>

      <section className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-500">
          What was reported
        </h2>
        <p className="mt-2 whitespace-pre-line leading-relaxed">{issue.description}</p>
      </section>

      {reportPhotos.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-500">
            Photos from the report
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {reportPhotos.map((photo) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={photo.id}
                src={photo.url}
                alt="Photo submitted with this report"
                className="aspect-square w-full rounded-md object-cover"
                loading="lazy"
              />
            ))}
          </div>
        </section>
      ) : null}

      {evidencePhotos.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-500">
            Evidence the work was done
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {evidencePhotos.map((photo) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={photo.id}
                src={photo.url}
                alt="Photo submitted as evidence that this issue was resolved"
                className="aspect-square w-full rounded-md object-cover"
                loading="lazy"
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight">What has happened since</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Every change to this report, in order, with the reason given at the time. Entries are
          added, never edited or removed.
        </p>
        <IssueTimeline history={issue.history} />

        {canReopen ? (
          <div className="mt-6">
            <ReopenForm issueId={issue.id} />
          </div>
        ) : null}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-500">Location</h2>
        <p className="mt-2 text-sm">{issue.addressLabel}</p>
        <p className="mt-1 font-mono text-xs text-neutral-500">
          {issue.latitude.toFixed(5)}, {issue.longitude.toFixed(5)}
        </p>
      </section>
    </main>
  );
}
