"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * The last line of defence for an unhandled error.
 *
 * It says what happened without pretending to know why, and it does not print
 * the error message to the visitor — that text can contain a query, a column
 * name, or part of a connection string. The digest is shown instead, because it
 * is the one thing that lets a specific failure be found in the server logs
 * without leaking anything.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-4 px-6 py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-ink-faint">Error</p>
      <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
      <p className="text-ink-soft">
        This is a problem at our end, not something you did. Nothing you were working on has been
        lost.
      </p>
      {error.digest ? (
        <p className="font-mono text-xs text-ink-faint">Reference: {error.digest}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-10 items-center justify-center rounded-control bg-ink px-4 text-sm font-medium text-paper transition-colors hover:bg-ink-soft"
        >
          Try again
        </button>
        <Link
          href="/issues"
          className="inline-flex h-10 items-center justify-center rounded-control border border-line-strong bg-surface px-4 text-sm font-medium transition-colors hover:bg-surface-sunken"
        >
          Back to the issues
        </Link>
      </div>
    </main>
  );
}
