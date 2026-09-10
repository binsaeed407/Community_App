import Link from "next/link";
import { requireUser } from "@/lib/guards";
import { listIssues } from "@/lib/issues";
import { isOpen } from "@/lib/status";
import { IssueCard } from "@/components/issue-card";

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
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My reports</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {total === 0
              ? "You have not reported anything yet."
              : `${total} report${total === 1 ? "" : "s"}, ${stillOpen} still open on this page.`}
          </p>
        </div>
        <Link
          href="/report"
          className="inline-flex h-9 items-center justify-center rounded-control bg-ink px-3 text-sm font-medium text-paper transition-colors hover:bg-ink-soft"
        >
          Report a problem
        </Link>
      </div>

      {issues.length === 0 ? (
        <div className="mt-10 rounded-card border border-dashed border-line-strong p-10 text-center">
          <p className="font-medium">Nothing here yet</p>
          <p className="mt-1 text-sm text-ink-soft">
            When you report a problem it will appear here, along with everything that happens to it
            afterwards.
          </p>
          <Link href="/report" className="mt-4 inline-block text-sm underline">
            Report your first problem
          </Link>
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
    </main>
  );
}
