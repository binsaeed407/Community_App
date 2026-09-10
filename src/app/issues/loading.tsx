/**
 * Shown while the issue list is being fetched.
 *
 * Skeleton rows rather than a spinner: they reserve the space the real content
 * will take, so the page does not jump when it arrives. The whole block is
 * hidden from assistive technology — a screen reader announcing twelve empty
 * placeholders is noise, and the page it is waiting for will announce itself.
 */
import { Container } from "@/components/ui";

export default function Loading() {
  return (
    <Container className="flex-1 py-10" >
      <div className="h-9 w-64 animate-pulse rounded bg-surface-sunken" />
      <div className="mt-3 h-4 w-40 animate-pulse rounded bg-surface-sunken" />
      <ul className="mt-10 flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <li
            key={index}
            className="h-28 animate-pulse rounded-lg bg-surface-sunken"
          />
        ))}
      </ul>
    </Container>
  );
}
