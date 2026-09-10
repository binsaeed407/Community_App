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
      <p className="text-sm font-medium uppercase tracking-widest text-ink-faint">Not found</p>
      <h1 className="text-2xl font-bold tracking-tight">There is nothing here</h1>
      <p className="text-ink-soft">
        This report may have been removed, or the address may be wrong.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link
          href="/issues"
          className="inline-flex h-10 items-center justify-center rounded-control bg-ink px-4 text-sm font-medium text-paper transition-colors hover:bg-ink-soft"
        >
          Browse all issues
        </Link>
        <Link
          href="/report"
          className="inline-flex h-10 items-center justify-center rounded-control border border-line-strong bg-surface px-4 text-sm font-medium transition-colors hover:bg-surface-sunken"
        >
          Report a problem
        </Link>
      </div>
    </main>
  );
}
