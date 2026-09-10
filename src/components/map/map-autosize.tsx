"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

/**
 * Tells Leaflet to re-measure when its container changes size.
 *
 * Leaflet measures its container once at mount and afterwards only when the
 * *window* resizes. That was fine while the map was the only thing on the page,
 * and stopped being fine the moment a sidebar appeared: crossing the `lg`
 * breakpoint, or opening the mobile drawer, changes the map's width without the
 * window changing at all.
 *
 * The symptoms are specific and easy to misread as a Leaflet bug — a grey band
 * down the exposed side where tiles were never requested, markers drifting away
 * from their real coordinates, and popups anchoring off their pin.
 *
 * A ResizeObserver on the container is the direct fix: about ten lines, no new
 * dependency, and it covers every cause of a size change rather than just the
 * ones we thought of.
 */
export function MapAutoResize() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();

    const observer = new ResizeObserver(() => {
      // `false` = do not animate. The container has already resized; animating
      // the correction just shows the user the wrong size for longer.
      map.invalidateSize(false);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}
