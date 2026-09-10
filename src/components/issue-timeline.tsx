import type { IssueWithHistory } from "@/lib/issues";
import { formatDateTime, formatRelative } from "@/lib/format";
import { STATUS_CLASS, STATUS_LABEL } from "@/lib/status";

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
 */
export function IssueTimeline({ history }: { history: IssueWithHistory["history"] }) {
  return (
    <ol className="mt-4 flex flex-col">
      {history.map((entry, index) => {
        const isLast = index === history.length - 1;

        return (
          <li key={entry.id} className="flex gap-4">
            {/* The rail: a dot per entry, joined by a line except after the last. */}
            <div className="flex flex-col items-center" aria-hidden="true">
              <span
                className={`mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 ${STATUS_CLASS[entry.status]}`}
              />
              {!isLast ? (
                <span className="w-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
              ) : null}
            </div>

            <div className={isLast ? "pb-1" : "pb-8"}>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-medium">{STATUS_LABEL[entry.status]}</span>
                <time
                  dateTime={entry.createdAt.toISOString()}
                  title={formatDateTime(entry.createdAt)}
                  className="text-xs text-neutral-500"
                >
                  {formatRelative(entry.createdAt)}
                </time>
              </div>

              <p className="mt-0.5 text-xs text-neutral-500">
                {entry.actor.displayName}
                {entry.actor.role === "ADMIN" ? " · administrator" : " · resident"}
              </p>

              {/*
                The reason is required by the schema, so there is no "no reason
                given" branch to write. That is the point: an unexplained status
                change cannot be recorded in the first place.
              */}
              <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                {entry.reason}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
