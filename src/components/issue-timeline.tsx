import type { IssueWithHistory } from "@/lib/issues";
import { formatDateTime, formatRelative } from "@/lib/format";
import { STATUS_DOT, STATUS_LABEL } from "@/lib/status";
import { cx } from "@/components/ui";

/**
 * The public timeline of an issue.
 *
 * Rendered straight from `IssueStatusHistory`, oldest first, with no filtering
 * and no "latest only" collapse. Every row the table holds appears here — a
 * timeline that hides some of its rows is not a record, it is a summary, and a
 * summary can be shaped.
 *
 * Rows arrive already ordered by `sequence` from `getIssue`. They are never
 * re-sorted by date here: two changes can share a timestamp, and sorting by one
 * is what produced a timeline that disagreed with itself during seeding.
 *
 * Visually it is a document rather than a feed. The rail runs continuously so
 * the eye can see there are no gaps, and each entry is the reason in full — the
 * reason is the content here, not metadata attached to a status change.
 */
export function IssueTimeline({ history }: { history: IssueWithHistory["history"] }) {
  return (
    <ol className="mt-5">
      {history.map((entry, index) => {
        const isLast = index === history.length - 1;
        const isAdmin = entry.actor.role === "ADMIN";

        return (
          <li key={entry.id} className="relative flex gap-4">
            {/* The rail. Drawn as a continuous line behind the dots rather than
                as separate segments, so there is visibly nothing between one
                entry and the next. */}
            <div className="flex flex-col items-center" aria-hidden="true">
              <span
                className={cx(
                  "mt-1 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full ring-4 ring-paper",
                  STATUS_DOT[entry.status],
                )}
              />
              {!isLast ? <span className="w-px flex-1 bg-line" /> : null}
            </div>

            <div className={cx("min-w-0 flex-1", isLast ? "pb-0" : "pb-7")}>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-medium tracking-tight">{STATUS_LABEL[entry.status]}</span>
                <span className="text-ink-faint" aria-hidden="true">
                  ·
                </span>
                <span className="text-sm text-ink-soft">{entry.actor.displayName}</span>
                <span
                  className={cx(
                    "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
                    isAdmin
                      ? "bg-accent-soft text-accent-strong"
                      : "bg-surface-sunken text-ink-faint",
                  )}
                >
                  {isAdmin ? "Council" : "Resident"}
                </span>
              </div>

              {/* The exact timestamp is in the title attribute; the relative one
                  is what anybody actually wants to read. */}
              <time
                dateTime={entry.createdAt.toISOString()}
                title={formatDateTime(entry.createdAt)}
                className="mt-0.5 block text-xs text-ink-faint"
              >
                {formatRelative(entry.createdAt)}
              </time>

              {/*
                The reason is required by the schema, so there is no "no reason
                given" branch to write. That is the point: an unexplained status
                change cannot be recorded in the first place.
              */}
              <p className="mt-2.5 rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-ink">
                {entry.reason}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
