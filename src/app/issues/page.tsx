import Link from "next/link";
import { listCategories, listIssues } from "@/lib/issues";
import { ISSUE_STATUSES, STATUS_LABEL } from "@/lib/status";
import { IssueCard } from "@/components/issue-card";
import type { IssueStatus } from "@/generated/prisma/enums";

export const metadata = {
  title: "All reported issues",
  description: "Every problem reported in the area, and what happened to it.",
};

/**
 * The public issue list.
 *
 * No login required — the entire point of the project is that anyone can see
 * what was reported and what was done about it. Filters live in the URL rather
 * than in component state so a filtered view can be linked to, bookmarked, and
 * loaded on the server without any client JavaScript.
 */
export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; page?: string }>;
}) {
  const params = await searchParams;

  // Anything unrecognised in the URL is ignored rather than erroring. A
  // hand-edited query string should not produce a 500.
  const status = ISSUE_STATUSES.includes(params.status as IssueStatus)
    ? (params.status as IssueStatus)
    : undefined;

  const [categories, { issues, total, page, pageCount }] = await Promise.all([
    listCategories(),
    listIssues({
      status,
      categorySlug: params.category,
      page: Number(params.page) || 1,
    }),
  ]);

  const categoryFilter = categories.find((c) => c.slug === params.category);

  /** Builds a URL that keeps the other filters intact. */
  const linkTo = (next: { status?: string; category?: string; page?: number }) => {
    const query = new URLSearchParams();
    const merged = {
      status: next.status !== undefined ? next.status : status,
      category: next.category !== undefined ? next.category : params.category,
      page: next.page,
    };
    if (merged.status) query.set("status", merged.status);
    if (merged.category) query.set("category", merged.category);
    if (merged.page && merged.page > 1) query.set("page", String(merged.page));
    const qs = query.toString();
    return qs ? `/issues?${qs}` : "/issues";
  };

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-sm transition ${
      active
        ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
        : "border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
    }`;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reported issues</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {total} report{total === 1 ? "" : "s"}
            {status ? ` with status “${STATUS_LABEL[status]}”` : ""}
            {categoryFilter ? ` in ${categoryFilter.name}` : ""}.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/issues/map"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Map view
          </Link>
          <Link
            href="/report"
            className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            Report a problem
          </Link>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Status
          </span>
          <Link href={linkTo({ status: "", page: 1 })} className={chip(!status)}>
            All
          </Link>
          {ISSUE_STATUSES.map((value) => (
            <Link
              key={value}
              href={linkTo({ status: value, page: 1 })}
              className={chip(status === value)}
            >
              {STATUS_LABEL[value]}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Category
          </span>
          <Link href={linkTo({ category: "", page: 1 })} className={chip(!params.category)}>
            All
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={linkTo({ category: category.slug, page: 1 })}
              className={chip(params.category === category.slug)}
            >
              <span aria-hidden="true">{category.icon}</span> {category.name}
            </Link>
          ))}
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-neutral-300 p-10 text-center dark:border-neutral-700">
          <p className="font-medium">Nothing matches those filters</p>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Try clearing them, or{" "}
            <Link href="/report" className="underline">
              report the problem yourself
            </Link>
            .
          </p>
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
            <Link href={linkTo({ page: page - 1 })} className="underline">
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-neutral-500">
            Page {page} of {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={linkTo({ page: page + 1 })} className="underline">
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
