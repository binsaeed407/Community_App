"use client";

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { MAP_DEFAULT_CENTRE, MAP_DEFAULT_ZOOM } from "@/lib/constants";
import { STATUS_LABEL } from "@/lib/status";
import { createMarkerIcon } from "./map-marker";
import type { IssueStatus } from "@/generated/prisma/enums";

export type MapIssue = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  status: IssueStatus;
  addressLabel: string;
  category: { name: string; icon: string };
};

/**
 * Every reported issue on one map.
 *
 * Not paginated and not clustered. At demo scale — a few dozen pins across
 * London — clustering would hide information to solve a problem the app does
 * not have yet. If it ever held thousands, the answer is to query by the
 * visible bounding box rather than to bolt a clustering library on.
 */
export function IssueMap({ issues }: { issues: MapIssue[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
      <MapContainer
        center={[MAP_DEFAULT_CENTRE.latitude, MAP_DEFAULT_CENTRE.longitude]}
        zoom={MAP_DEFAULT_ZOOM - 2}
        scrollWheelZoom
        style={{ height: "min(70vh, 600px)", width: "100%" }}
        // The list underneath carries the same information in a form a keyboard
        // and a screen reader can actually use, so the map itself is hidden
        // from assistive technology rather than being an obstacle in the tab
        // order that leads nowhere.
        aria-hidden="true"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {issues.map((issue) => (
          <Marker
            key={issue.id}
            position={[issue.latitude, issue.longitude]}
            icon={createMarkerIcon(issue.category.icon)}
          >
            <Popup>
              <span className="block text-sm font-medium">{issue.title}</span>
              <span className="mt-0.5 block text-xs text-neutral-600">
                {STATUS_LABEL[issue.status]} · {issue.addressLabel}
              </span>
              <Link href={`/issues/${issue.id}`} className="mt-1 block text-xs underline">
                Open this report
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
