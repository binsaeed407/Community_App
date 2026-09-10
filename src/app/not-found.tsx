import { ButtonLink, Container } from "@/components/ui";

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
    <Container size="narrow" className="flex flex-1 flex-col justify-center gap-4 py-24 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-ink-faint">Not found</p>
      <h1 className="text-2xl font-bold tracking-tight">There is nothing here</h1>
      <p className="text-ink-soft">
        This report may have been removed, or the address may be wrong.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/issues">Browse all issues</ButtonLink>
        <ButtonLink href="/report" variant="secondary">
          Report a problem
        </ButtonLink>
      </div>
    </Container>
  );
}
