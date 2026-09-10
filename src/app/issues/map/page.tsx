import Link from "next/link";
import { listIssuesForMap } from "@/lib/issues";
import { IssueMapLoader } from "@/components/map/issue-map-loader";
import { STATUS_LABEL } from "@/lib/status";

export const metadata = {
  title: "Issue map",
  description: "Every reported problem in the area, on a map.",
};

/**
 * The map view.
 *
 * Everything on the map is also listed underneath. That list is not a fallback
 * bolted on afterwards — it is the version that works without JavaScript,
 * without a mouse, and with a screen reader, and it is what makes hiding the
 * map itself from assistive technology an acceptable choice rather than an
 * excuse.
 */
export default async function IssueMapPage() {
  const issues = await listIssuesForMap();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Issue map</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {issues.length} report{issues.length === 1 ? "" : "s"} across the area.
          </p>
        </div>
        <Link
          href="/issues"
          className="inline-flex h-9 items-center justify-center rounded-control border border-line-strong bg-surface px-3 text-sm font-medium transition-colors hover:bg-surface-sunken"
        >
          List view
        </Link>
      </div>

      <div className="mt-6">
        <IssueMapLoader issues={issues} />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight">Everything on the map</h2>
        <p className="mt-1 text-sm text-ink-soft">
          The same reports as a list, for reading without a mouse.
        </p>

        <ul className="mt-4 divide-y divide-line">
          {issues.map((issue) => (
            <li key={issue.id} className="py-3">
              <Link
                href={`/issues/${issue.id}`}
                className="flex flex-wrap items-baseline gap-x-2 text-sm hover:underline "
              >
                <span aria-hidden="true">{issue.category.icon}</span>
                <span className="font-medium">{issue.title}</span>
                <span className="text-ink-faint">
                  {STATUS_LABEL[issue.status]} · {issue.addressLabel}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
