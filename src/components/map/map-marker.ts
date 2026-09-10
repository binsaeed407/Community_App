import { DivIcon } from "leaflet";

/**
 * Markers are built from HTML, not from Leaflet's default icon.
 *
 * Leaflet's default marker loads three PNGs by relative path. Under a bundler
 * those paths do not survive, and the well-known symptom is a map with
 * invisible markers — the elements are there with a broken image behind them.
 * Every fix involves either rewriting the icon URLs to a CDN, which adds an
 * external dependency the app does not otherwise need, or copying the images
 * into /public and pointing at them.
 *
 * A DivIcon avoids the problem rather than working around it: the marker is a
 * styled div, so there is nothing to load, nothing to 404, and the category
 * emoji can sit inside it for free.
 */
export function createMarkerIcon(emoji: string, highlighted = false): DivIcon {
  const ring = highlighted ? "box-shadow:0 0 0 4px rgba(0,0,0,0.15);" : "";

  return new DivIcon({
    className: "", // Leaflet adds its own class otherwise, which brings a border.
    html: `<span style="
      display:flex;align-items:center;justify-content:center;
      width:32px;height:32px;border-radius:9999px;
      background:#fff;border:2px solid #171717;font-size:16px;
      ${ring}
    ">${emoji}</span>`,
    iconSize: [32, 32],
    // Anchor at the bottom centre so the circle sits above the point it marks,
    // rather than being centred on it.
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}
