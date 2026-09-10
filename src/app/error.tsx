"use client";

import { useEffect } from "react";
import { Button, ButtonLink, Container } from "@/components/ui";

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
    <Container size="narrow" className="flex flex-1 flex-col justify-center gap-4 py-24 text-center">
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
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <ButtonLink href="/issues" variant="secondary">
          Back to the issues
        </ButtonLink>
      </div>
    </Container>
  );
}
