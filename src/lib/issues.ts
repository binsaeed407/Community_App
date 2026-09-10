import type { IssueStatus, Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { ISSUES_PER_PAGE } from "@/lib/constants";

/**
 * Every read of the issue table lives here.
 *
 * Two reasons. The obvious one is that the same query is needed by the list,
 * the map and the dashboard. The important one is the `select` below: it is the
 * single place that decides what leaves the database, and it never includes an
 * email address. Scattering these queries through page components is how a
 * reporter's email eventually ends up in a page payload by accident.
 */

/** The public shape of an issue. Note what is absent: reporter.email. */
const publicIssueSelect = {
  id: true,
  title: true,
  description: true,
  latitude: true,
  longitude: true,
  addressLabel: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, slug: true, icon: true } },
  reporter: { select: { id: true, displayName: true } },
  attachments: { select: { id: true, url: true, kind: true } },
  _count: { select: { history: true } },
} satisfies Prisma.IssueSelect;

export type PublicIssue = Prisma.IssueGetPayload<{ select: typeof publicIssueSelect }>;

export type IssueFilters = {
  status?: IssueStatus;
  categorySlug?: string;
  reporterId?: string;
  page?: number;
};

function buildWhere(filters: IssueFilters): Prisma.IssueWhereInput {
  return {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.categorySlug ? { category: { slug: filters.categorySlug } } : {}),
    ...(filters.reporterId ? { reporterId: filters.reporterId } : {}),
  };
}

/** One page of issues, newest first, plus the total so the UI can page. */
export async function listIssues(filters: IssueFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const where = buildWhere(filters);

  // Both queries in one round trip. Counting separately is the usual way a
  // list page ends up making two sequential database calls for no reason.
  const [issues, total] = await Promise.all([
    db.issue.findMany({
      where,
      select: publicIssueSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ISSUES_PER_PAGE,
      take: ISSUES_PER_PAGE,
    }),
    db.issue.count({ where }),
  ]);

  return {
    issues,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / ISSUES_PER_PAGE)),
  };
}

/**
 * Every issue, for the map.
 *
 * Unpaginated on purpose: a map showing "page 1 of the issues near you" would
 * be a lie. At demo scale this is a few dozen rows. If it ever became thousands
 * the fix is to query by the visible bounding box, not to paginate.
 */
export async function listIssuesForMap() {
  return db.issue.findMany({
    select: {
      id: true,
      title: true,
      latitude: true,
      longitude: true,
      status: true,
      createdAt: true,
      addressLabel: true,
      category: { select: { name: true, icon: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * One issue with its whole timeline.
 *
 * The history is ordered by `sequence`, never by `createdAt` — two changes can
 * share a timestamp, and then the timeline renders in an arbitrary order. See
 * the migration that introduced the column.
 */
export async function getIssue(id: string) {
  return db.issue.findUnique({
    where: { id },
    select: {
      ...publicIssueSelect,
      history: {
        orderBy: { sequence: "asc" },
        select: {
          id: true,
          status: true,
          reason: true,
          createdAt: true,
          actor: { select: { id: true, displayName: true, role: true } },
        },
      },
      suggestion: {
        select: {
          confidence: true,
          accepted: true,
          suggestedCategory: { select: { name: true, icon: true } },
        },
      },
    },
  });
}

export type IssueWithHistory = NonNullable<Awaited<ReturnType<typeof getIssue>>>;

/** Categories in display order, for filters and the report form. */
export async function listCategories() {
  return db.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, icon: true },
  });
}
