import Link from "next/link";

export const metadata = { title: "Not found" };

/**
 * Shown for a missing page and for any issue id that does not exist.
 *
 * It offers the two things someone in this position actually wants — the issue
 * list, or the form to report the thing they were looking for — rather than a
 * bare "404" and a dead end.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-4 px-6 py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-neutral-500">Not found</p>
      <h1 className="text-2xl font-bold tracking-tight">There is nothing here</h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        This report may have been removed, or the address may be wrong.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link
          href="/issues"
          className="rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          Browse all issues
        </Link>
        <Link
          href="/report"
          className="rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          Report a problem
        </Link>
      </div>
    </main>
  );
}
