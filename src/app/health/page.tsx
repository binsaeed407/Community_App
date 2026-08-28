import { connection } from "next/server";
import { db } from "@/lib/db";

export const metadata = {
  title: "Health check — Community App",
};

type Result =
  | { ok: true; message: string; createdAt: Date; count: number }
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
    const [latest, count] = await Promise.all([
      db.healthCheck.findFirst({ orderBy: { createdAt: "desc" } }),
      db.healthCheck.count(),
    ]);

    if (!latest) {
      return { ok: false, error: "Connected, but the HealthCheck table is empty. Run `npm run db:seed`." };
    }

    return { ok: true, message: latest.message, createdAt: latest.createdAt, count };
  } catch (error) {
    // Render the problem instead of crashing the page. A broken database
    // should not take the whole site down, and the message is far more
    // useful than a generic 500 when diagnosing a deploy.
    return { ok: false, error: error instanceof Error ? error.message : "Unknown database error" };
  }
}

export default async function HealthPage() {
  // Stop here during prerendering. Without this, Next.js would try to run the
  // query at build time, when the database may be unreachable.
  await connection();

  const result = await checkDatabase();

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-medium uppercase tracking-widest text-neutral-500">
          Diagnostics
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Database health check
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Confirms that this app can reach the Postgres database through Prisma.
        </p>
      </div>

      {result.ok ? (
        <div className="rounded-lg border border-green-300 bg-green-50 p-5 dark:border-green-900 dark:bg-green-950">
          <p className="font-semibold text-green-900 dark:text-green-100">
            Connected
          </p>
          <dl className="mt-3 space-y-1 text-sm text-green-900/80 dark:text-green-100/80">
            <div className="flex gap-2">
              <dt className="font-medium">Latest row:</dt>
              <dd>{result.message}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium">Written at:</dt>
              <dd>{result.createdAt.toISOString()}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium">Rows in table:</dt>
              <dd>{result.count}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="rounded-lg border border-red-300 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950">
          <p className="font-semibold text-red-900 dark:text-red-100">
            Not connected
          </p>
          <p className="mt-2 break-words text-sm text-red-900/80 dark:text-red-100/80">
            {result.error}
          </p>
          <p className="mt-3 text-sm text-red-900/70 dark:text-red-100/70">
            Check that <code className="font-mono">DATABASE_URL</code> is set —
            locally in <code className="font-mono">.env</code>, and in the Vercel
            project settings for a deployed build.
          </p>
        </div>
      )}
    </main>
  );
}
