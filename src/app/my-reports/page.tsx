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
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {total === 0
              ? "You have not reported anything yet."
              : `${total} report${total === 1 ? "" : "s"}, ${stillOpen} still open on this page.`}
          </p>
        </div>
        <Link
          href="/report"
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          Report a problem
        </Link>
      </div>

      {issues.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-neutral-300 p-10 text-center dark:border-neutral-700">
          <p className="font-medium">Nothing here yet</p>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
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
          <span className="text-neutral-500">
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
