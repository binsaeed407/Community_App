import Link from "next/link";
import { listCategories, listIssues } from "@/lib/issues";
import { ISSUE_STATUSES, STATUS_LABEL } from "@/lib/status";
import { IssueCard } from "@/components/issue-card";
import { ButtonLink, Container, EmptyState, PageHeader, cx } from "@/components/ui";
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
  const filtered = Boolean(status || categoryFilter);

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
    cx(
      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
      active
        ? "border-ink bg-ink text-paper"
        : "border-line-strong bg-surface text-ink-soft hover:border-ink-faint hover:text-ink",
    );

  return (
    <Container className="flex-1 py-10">
      <PageHeader
        eyebrow="Public record"
        title="Reported issues"
        description={
          <>
            {total} report{total === 1 ? "" : "s"}
            {status ? ` with the status “${STATUS_LABEL[status]}”` : ""}
            {categoryFilter ? ` in ${categoryFilter.name}` : ""}. Every one of them shows exactly
            what has happened since it was filed.
          </>
        }
        actions={
          <>
            <ButtonLink href="/issues/map" variant="secondary">
              Map view
            </ButtonLink>
            <ButtonLink href="/report">Report a problem</ButtonLink>
          </>
        }
      />

      <div className="mt-6 flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 w-16 shrink-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
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

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 w-16 shrink-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
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
        <div className="mt-8">
          <EmptyState title="Nothing matches those filters">
            {filtered ? (
              <>
                <Link href="/issues" className="text-accent underline underline-offset-4">
                  Clear the filters
                </Link>
                , or{" "}
                <Link href="/report" className="text-accent underline underline-offset-4">
                  report the problem yourself
                </Link>
                .
              </>
            ) : (
              <>
                Nothing has been reported yet.{" "}
                <Link href="/report" className="text-accent underline underline-offset-4">
                  Be the first
                </Link>
                .
              </>
            )}
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
        <nav
          aria-label="Pagination"
          className="mt-8 flex items-center justify-between border-t border-line pt-5 text-sm"
        >
          {page > 1 ? (
            <Link href={linkTo({ page: page - 1 })} className="text-accent hover:underline">
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-ink-faint">
            Page {page} of {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={linkTo({ page: page + 1 })} className="text-accent hover:underline">
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </Container>
  );
}
