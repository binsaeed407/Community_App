import { connection } from "next/server";
import { db } from "@/lib/db";
import { Shell } from "@/components/ui";

export const metadata = {
  title: "Health check",
};

type TableCount = { label: string; count: number };

type Result =
  | { ok: true; tables: TableCount[]; consistent: boolean; checked: number }
  | { ok: false; error: string };

async function checkDatabase(): Promise<Result> {
  if (!process.env.DATABASE_URL) {
    return {
      ok: false,
      error:
        "DATABASE_URL is not set. Locally, copy .env.example to .env. On Vercel, add it under Settings -> Environment Variables and redeploy.",
    };
  }

  try {
    const [users, categories, issues, history, audit, attachments, suggestions] = await Promise.all([
      db.user.count(),
      db.category.count(),
      db.issue.count(),
      db.issueStatusHistory.count(),
      db.auditLog.count(),
      db.attachment.count(),
      db.aIAnalysis.count(),
    ]);

    // The invariant this whole project rests on: Issue.status is a cache of the
    // newest IssueStatusHistory row, and the two must never disagree. Checking
    // it here means a broken deploy says so out loud instead of quietly serving
    // a timeline that contradicts itself.
    const sample = await db.issue.findMany({
      select: {
        status: true,
        history: { orderBy: { sequence: "desc" }, take: 1, select: { status: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    const consistent = sample.every((issue) => issue.history[0]?.status === issue.status);

    return {
      ok: true,
      consistent,
      checked: sample.length,
      tables: [
        { label: "Users", count: users },
        { label: "Categories", count: categories },
        { label: "Issues", count: issues },
        { label: "Status history", count: history },
        { label: "Audit log", count: audit },
        { label: "Attachments", count: attachments },
        { label: "Category suggestions", count: suggestions },
      ],
    };
  } catch (error) {
    // Render the problem instead of crashing the page. A broken database should
    // not take the whole site down, and the message is far more useful than a
    // generic 500 when diagnosing a deploy.
    return { ok: false, error: error instanceof Error ? error.message : "Unknown database error" };
  }
}

export default async function HealthPage() {
  // Stop here during prerendering. Without this, Next.js would try to run the
  // query at build time, when the database may be unreachable.
  await connection();

  const result = await checkDatabase();

  return (
    <Shell size="narrow" className="flex flex-col justify-center gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-widest text-ink-faint">
          Diagnostics
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Database health check
        </h1>
        <p className="mt-2 text-ink-soft">
          Confirms that this app can reach the Postgres database through Prisma, and that the
          status history and the status cache still agree.
        </p>
      </div>

      {result.ok ? (
        <>
          <div className="rounded-lg border border-green-300 bg-green-50 p-5 dark:border-green-900 dark:bg-green-950">
            <p className="font-semibold text-green-900 dark:text-green-100">Connected</p>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-green-900/80 dark:text-green-100/80">
              {result.tables.map((table) => (
                <div key={table.label} className="flex justify-between gap-2">
                  <dt className="font-medium">{table.label}</dt>
                  <dd className="tabular-nums">{table.count}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div
            className={
              result.consistent
                ? "rounded-lg border border-green-300 bg-green-50 p-5 dark:border-green-900 dark:bg-green-950"
                : "rounded-lg border border-red-300 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950"
            }
          >
            <p
              className={
                result.consistent
                  ? "font-semibold text-green-900 dark:text-green-100"
                  : "font-semibold text-red-900 dark:text-red-100"
              }
            >
              {result.consistent ? "Status history consistent" : "Status history INCONSISTENT"}
            </p>
            <p
              className={
                result.consistent
                  ? "mt-2 text-sm text-green-900/80 dark:text-green-100/80"
                  : "mt-2 text-sm text-red-900/80 dark:text-red-100/80"
              }
            >
              {result.consistent
                ? `Checked the ${result.checked} most recently updated issues. Every one has a status matching the newest row in its history.`
                : `Checked the ${result.checked} most recently updated issues and found at least one whose status does not match the newest row in its history. Something wrote the cache without writing the history row.`}
            </p>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-red-300 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950">
          <p className="font-semibold text-red-900 dark:text-red-100">Not connected</p>
          <p className="mt-2 break-words text-sm text-red-900/80 dark:text-red-100/80">
            {result.error}
          </p>
          <p className="mt-3 text-sm text-red-900/70 dark:text-red-100/70">
            Check that <code className="font-mono">DATABASE_URL</code> is set — locally in{" "}
            <code className="font-mono">.env</code>, and in the Vercel project settings for a
            deployed build.
          </p>
        </div>
      )}
    </Shell>
  );
}
