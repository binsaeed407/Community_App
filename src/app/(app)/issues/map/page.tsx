import Link from "next/link";
import { listIssuesForMap } from "@/lib/issues";
import { IssueMapLoader } from "@/components/map/issue-map-loader";
import { STATUS_LABEL } from "@/lib/status";
import { ButtonLink, Shell, PageHeader } from "@/components/ui";

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
    <Shell>
      <PageHeader
        eyebrow="Public record"
        title="Issue map"
        description={`${issues.length} report${issues.length === 1 ? "" : "s"} across the area. Everything on the map is listed underneath it.`}
        actions={
          <>
            <ButtonLink href="/issues" variant="secondary">
              List view
            </ButtonLink>
            <ButtonLink href="/report">Report a problem</ButtonLink>
          </>
        }
      />

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
    </Shell>
  );
}
