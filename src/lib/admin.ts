import { db } from "@/lib/db";
import { OVERDUE_AFTER_DAYS } from "@/lib/constants";

/**
 * The queries behind the admin dashboard.
 *
 * The dashboard sorts issues into four buckets: new, in progress, overdue and
 * recently resolved. "Overdue" deliberately overlaps the first two — an issue
 * can be both new and overdue, and hiding that would defeat the purpose of
 * showing it.
 */

const dashboardSelect = {
  id: true,
  title: true,
  status: true,
  createdAt: true,
  addressLabel: true,
  category: { select: { name: true, icon: true } },
  reporter: { select: { displayName: true } },
} as const;

export async function getDashboard() {
  const overdueBefore = new Date(Date.now() - OVERDUE_AFTER_DAYS * 24 * 60 * 60 * 1000);

  const [needsTriage, inProgress, overdue, recentlyResolved, counts] = await Promise.all([
    db.issue.findMany({
      where: { status: { in: ["SUBMITTED", "REOPENED"] } },
      select: dashboardSelect,
      orderBy: { createdAt: "asc" },
      take: 20,
    }),

    db.issue.findMany({
      where: { status: { in: ["ACKNOWLEDGED", "IN_PROGRESS"] } },
      select: dashboardSelect,
      orderBy: { createdAt: "asc" },
      take: 20,
    }),

    // Filtered in the query, not in the page. The equivalent JavaScript filter
    // would need every open issue loaded first, which stops being viable at
    // exactly the point the dashboard becomes worth having.
    db.issue.findMany({
      where: {
        status: { in: ["SUBMITTED", "ACKNOWLEDGED", "IN_PROGRESS", "REOPENED"] },
        createdAt: { lt: overdueBefore },
      },
      select: dashboardSelect,
      orderBy: { createdAt: "asc" },
      take: 20,
    }),

    db.issue.findMany({
      where: { status: "RESOLVED" },
      select: dashboardSelect,
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),

    db.issue.groupBy({ by: ["status"], _count: true }),
  ]);

  const countByStatus = Object.fromEntries(counts.map((row) => [row.status, row._count]));

  return { needsTriage, inProgress, overdue, recentlyResolved, countByStatus };
}

/** One issue with everything an administrator needs to decide what to do. */
export async function getIssueForAdmin(id: string) {
  return db.issue.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      createdAt: true,
      addressLabel: true,
      latitude: true,
      longitude: true,
      category: { select: { name: true, icon: true } },
      reporter: { select: { displayName: true } },
      attachments: { select: { id: true, url: true, kind: true } },
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
    },
  });
}

/**
 * The audit trail for one issue.
 *
 * Read separately from the issue rather than joined onto it, because this is
 * the internal record and must never end up in a payload rendered on a public
 * page by accident.
 */
export async function getAuditTrail(issueId: string) {
  return db.auditLog.findMany({
    where: { entityType: "Issue", entityId: issueId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      action: true,
      reason: true,
      createdAt: true,
      actor: { select: { displayName: true, role: true } },
    },
  });
}
