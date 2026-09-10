import { db } from "@/lib/db";
import { MAX_ISSUES_PER_HOUR } from "@/lib/constants";

/**
 * Rate limiting, as a database count.
 *
 * No Redis, no sliding-window algorithm, no extra service to deploy and
 * explain: "how many issues has this account created in the last hour?" is one
 * indexed query, and the answer is exactly what the rule is about.
 *
 * The honest limitations, since they will be asked about:
 *
 *  - It counts per account, not per IP, so it does not stop someone
 *    registering repeatedly. Registration would need its own limit.
 *  - Two requests arriving at the same instant can both pass the check before
 *    either has inserted. At this scale that means one extra report, which is
 *    not worth a lock.
 *
 * What it does do is stop the published demo credentials being used to insert
 * ten thousand rows by anyone who finds the repository, which is the actual
 * threat here.
 */

const HOUR_MS = 60 * 60 * 1000;

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterMinutes: number };

export async function checkIssueRateLimit(userId: string): Promise<RateLimitResult> {
  const since = new Date(Date.now() - HOUR_MS);

  const recent = await db.issue.findMany({
    where: { reporterId: userId, createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  if (recent.length < MAX_ISSUES_PER_HOUR) {
    return { allowed: true, remaining: MAX_ISSUES_PER_HOUR - recent.length };
  }

  // The window frees up when the oldest report in it falls out of the hour, so
  // the user can be told when to come back rather than just being refused.
  const oldest = recent[0].createdAt.getTime();
  const freeAt = oldest + HOUR_MS;
  const retryAfterMinutes = Math.max(1, Math.ceil((freeAt - Date.now()) / 60_000));

  return { allowed: false, retryAfterMinutes };
}
