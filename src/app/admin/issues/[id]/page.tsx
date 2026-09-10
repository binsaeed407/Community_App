import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/guards";
import { getAuditTrail, getIssueForAdmin } from "@/lib/admin";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { allowedTransitions } from "@/lib/transitions";
import { formatDateTime, daysSince } from "@/lib/format";
import { isOverdue } from "@/lib/status";
import { OverdueBadge, StatusBadge } from "@/components/status-badge";
import { IssueTimeline } from "@/components/issue-timeline";
import { StatusForm } from "./status-form";

export const metadata = {
  title: "Manage issue",
};

/**
 * The administrator's view of one issue.
 *
 * Shows the same public timeline a citizen sees, plus the internal audit trail,
 * plus the controls to change the status. Putting the public timeline in front
 * of the administrator on the same screen is deliberate: whatever they type is
 * going straight onto it.
 */
export default async function AdminIssuePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;
  const [issue, audit] = await Promise.all([getIssueForAdmin(id), getAuditTrail(id)]);

  if (!issue) notFound();

  const options = allowedTransitions(issue.status, "ADMIN");
  const overdue = isOverdue(issue);
  const evidence = issue.attachments.filter((a) => a.kind === "EVIDENCE");
  const reported = issue.attachments.filter((a) => a.kind === "REPORT");

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <Link href="/admin" className="text-sm underline">
          ← Dashboard
        </Link>
        <Link href={`/issues/${issue.id}`} className="text-sm underline">
          View as the public sees it →
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <StatusBadge status={issue.status} />
        {overdue ? <OverdueBadge /> : null}
        <span className="text-sm text-neutral-500">
          <span aria-hidden="true">{issue.category.icon}</span> {issue.category.name}
        </span>
      </div>

      <h1 className="mt-3 text-2xl font-bold tracking-tight">{issue.title}</h1>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        {issue.addressLabel} · reported by {issue.reporter.displayName} ·{" "}
        {daysSince(issue.createdAt)} days old
      </p>

      <p className="mt-4 whitespace-pre-line text-sm leading-relaxed">{issue.description}</p>

      {reported.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {reported.map((photo) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={photo.id}
              src={photo.url}
              alt="Photo submitted with the report"
              className="h-24 w-24 rounded-md object-cover"
            />
          ))}
        </div>
      ) : null}

      <section className="mt-10 rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
        <h2 className="text-lg font-semibold tracking-tight">Update this issue</h2>
        <p className="mb-4 mt-1 text-xs text-neutral-500">
          Every change appends to the public timeline and writes an audit entry. Nothing here can
          be edited or removed later.
        </p>
        <StatusForm
          issueId={issue.id}
          currentStatus={issue.status}
          options={options}
          uploadsEnabled={isCloudinaryConfigured()}
        />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight">Public timeline</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Exactly what the reporter and anyone else can read.
        </p>
        <IssueTimeline history={issue.history} />
      </section>

      {evidence.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-500">
            Evidence on file
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {evidence.map((photo) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={photo.id}
                src={photo.url}
                alt="Evidence that the work was completed"
                className="h-24 w-24 rounded-md object-cover"
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight">Audit trail</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Internal record. Never shown on a public page.
        </p>

        {audit.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">No administrative actions recorded yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
            {audit.map((entry) => (
              <li key={entry.id} className="py-3">
                <p className="font-mono text-xs text-neutral-500">{entry.action}</p>
                <p className="mt-1">
                  <span className="font-medium">{entry.actor.displayName}</span>{" "}
                  <span className="text-neutral-500">
                    · {entry.actor.role.toLowerCase()} · {formatDateTime(entry.createdAt)}
                  </span>
                </p>
                <p className="mt-1 text-neutral-700 dark:text-neutral-300">{entry.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
