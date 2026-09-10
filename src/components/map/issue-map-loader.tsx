"use client";

import dynamic from "next/dynamic";
import type { MapIssue } from "./issue-map";

/**
 * A client component whose only job is to lazily load the map.
 *
 * `next/dynamic` with `ssr: false` is rejected inside a Server Component — the
 * build fails with "not allowed with next/dynamic in Server Components". But
 * the map genuinely cannot be server-rendered, because Leaflet reads `window`
 * at import time.
 *
 * So the boundary is made explicit: this tiny client component owns the dynamic
 * import, and the page that renders it stays a Server Component doing its own
 * data fetching.
 */
const IssueMap = dynamic(() => import("./issue-map").then((m) => m.IssueMap), {
  ssr: false,
  loading: () => (
    <div className="h-[min(70vh,600px)] w-full animate-pulse rounded-card border border-line bg-surface-sunken" />
  ),
});

export function IssueMapLoader({ issues }: { issues: MapIssue[] }) {
  return <IssueMap issues={issues} />;
}
