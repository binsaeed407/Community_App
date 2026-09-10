import Link from "next/link";
import { requireUser } from "@/lib/guards";
import { listIssues } from "@/lib/issues";
import { isOpen } from "@/lib/status";
import { IssueCard } from "@/components/issue-card";
import { ButtonLink, Shell, EmptyState, PageHeader } from "@/components/ui";

export const metadata = {
  title: "My reports",
};

/**
 * Everything this person has reported.
 *
 * Filtered by reporterId in the query rather than by fetching everything and
 * filtering in the page — the difference matters the moment there is more than
 * one page of issues, and it means another user's rows are never loaded into
 * memory in the first place.
 */
export default async function MyReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const { issues, total, page, pageCount } = await listIssues({
    reporterId: user.id,
    page: Number(params.page) || 1,
  });

  const stillOpen = issues.filter((issue) => isOpen(issue.status)).length;

  return (
    <Shell>
      <PageHeader
        eyebrow="Your account"
        title="My reports"
        description={
          total === 0
            ? "You have not reported anything yet."
            : `${total} report${total === 1 ? "" : "s"}, ${stillOpen} still open on this page.`
        }
        actions={<ButtonLink href="/report">Report a problem</ButtonLink>}
      />

      {issues.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="Nothing here yet">
            When you report a problem it will appear here, along with everything that happens to it
            afterwards.{" "}
            <Link href="/report" className="text-accent underline underline-offset-4">
              Report your first problem
            </Link>
            .
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {issues.map((issue) => (
            <li key={issue.id}>
              <IssueCard issue={issue} />
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 ? (
        <nav aria-label="Pagination" className="mt-8 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={`/my-reports?page=${page - 1}`} className="underline">
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-ink-faint">
            Page {page} of {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={`/my-reports?page=${page + 1}`} className="underline">
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </Shell>
  );
}
