import { db } from "@/lib/db";
import { isOpen } from "@/lib/status";

/**
 * The numbers behind the profile page.
 *
 * Every one of these is derived from tables that already exist — there is no
 * `reportCount` column being kept in sync anywhere, because a denormalised
 * counter is one more thing that can silently disagree with reality, and this
 * app has already been bitten once by a cached value drifting from its source.
 */
export async function getProfileStats(userId: string) {
  const [issues, statusChanges, auditEntries, uploads] = await Promise.all([
    db.issue.findMany({
      where: { reporterId: userId },
      select: { status: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    // Reopens are the interesting number for a resident: it is how often they
    // had to push back on an outcome.
    db.issueStatusHistory.count({ where: { actorId: userId, status: "REOPENED" } }),
    db.auditLog.count({ where: { actorId: userId } }),
    db.attachment.count({ where: { uploadedById: userId } }),
  ]);

  const byStatus: Record<string, number> = {};
  for (const issue of issues) {
    byStatus[issue.status] = (byStatus[issue.status] ?? 0) + 1;
  }

  return {
    total: issues.length,
    open: issues.filter((i) => isOpen(i.status)).length,
    resolved: issues.filter((i) => i.status === "RESOLVED").length,
    byStatus,
    reopened: statusChanges,
    auditEntries,
    uploads,
    firstReportAt: issues[0]?.createdAt ?? null,
    latestReportAt: issues[issues.length - 1]?.createdAt ?? null,
  };
}

/** The few most recent reports, for the profile page's activity list. */
export async function getRecentReports(userId: string, take = 5) {
  return db.issue.findMany({
    where: { reporterId: userId },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      addressLabel: true,
      category: { select: { name: true, icon: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}
