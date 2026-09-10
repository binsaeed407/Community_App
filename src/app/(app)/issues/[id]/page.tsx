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
import { Card, Shell, cx } from "@/components/ui";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const issue = await getIssue((await params).id);
  if (!issue) return { title: "Issue not found" };

  return {
    title: issue.title,
    description: issue.description.slice(0, 160),
  };
}

function Photos({
  photos,
  label,
  alt,
}: {
  photos: { id: string; url: string }[];
  label: string;
  alt: string;
}) {
  if (photos.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">{label}</h2>
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {photos.map((photo) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={photo.id}
            src={photo.url}
            alt={alt}
            className="aspect-[4/3] w-full rounded-lg border border-line object-cover"
            loading="lazy"
          />
        ))}
      </div>
    </section>
  );
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
    <Shell size="prose">
      <Link href="/issues" className="text-sm text-ink-soft transition-colors hover:text-ink">
        ← All issues
      </Link>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <StatusBadge status={issue.status} />
        {overdue ? <OverdueBadge days={age - OVERDUE_AFTER_DAYS} /> : null}
        <span className="text-sm text-ink-faint">
          <span aria-hidden="true">{issue.category.icon}</span> {issue.category.name}
        </span>
      </div>

      <h1 className="mt-3 text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
        {issue.title}
      </h1>

      <p className="mt-2.5 text-sm text-ink-soft">
        Reported by <span className="font-medium text-ink">{issue.reporter.displayName}</span> on{" "}
        <time dateTime={issue.createdAt.toISOString()}>{formatDate(issue.createdAt)}</time> ·{" "}
        {issue.addressLabel}
      </p>

      {/*
        Says what the current status means in a sentence. "Acknowledged" is
        jargon to somebody who just wants to know whether their pothole is
        getting fixed, and an app about accountability should not need decoding.
      */}
      <Card
        tone={overdue ? "alert" : "sunken"}
        className={cx("mt-6 border-l-4 p-4", !overdue && "border-l-accent")}
      >
        <p className="text-sm leading-relaxed">
          <span className="font-semibold">{STATUS_LABEL[issue.status]}.</span>{" "}
          <span className="text-ink-soft">{STATUS_DESCRIPTION[issue.status]}</span>
          {overdue ? (
            <span className="text-ink-soft">
              {" "}
              Open for {age} days, which is {age - OVERDUE_AFTER_DAYS} past the{" "}
              {OVERDUE_AFTER_DAYS}-day target.
            </span>
          ) : isOpen(issue.status) ? (
            <span className="text-ink-soft">
              {" "}
              Open for {age} day{age === 1 ? "" : "s"}.
            </span>
          ) : null}
        </p>
      </Card>

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">
          What was reported
        </h2>
        <p className="prose-body mt-2.5 whitespace-pre-line text-[15px]">{issue.description}</p>
      </section>

      <Photos
        photos={reportPhotos}
        label="Photos from the report"
        alt="Submitted with this report"
      />
      <Photos
        photos={evidencePhotos}
        label="Evidence the work was done"
        alt="Submitted as evidence that this issue was resolved"
      />

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="text-xl font-semibold tracking-tight">What has happened since</h2>
        <p className="mt-1.5 text-sm text-ink-soft">
          Every change to this report, in order, with the reason given at the time. Entries are
          added — never edited, never removed.
        </p>

        <IssueTimeline history={issue.history} />

        {canReopen ? (
          <div className="mt-8">
            <ReopenForm issueId={issue.id} />
          </div>
        ) : null}
      </section>

      <section className="mt-10 border-t border-line pt-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">
          Location
        </h2>
        <p className="mt-2 text-sm">{issue.addressLabel}</p>
        <p className="mt-1 font-mono text-xs text-ink-faint">
          {issue.latitude.toFixed(5)}, {issue.longitude.toFixed(5)}
          {" · "}
          <Link href="/issues/map" className="text-accent hover:underline">
            see it on the map
          </Link>
        </p>
      </section>
    </Shell>
  );
}
