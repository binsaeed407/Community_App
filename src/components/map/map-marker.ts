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
export function createMarkerIcon(
  emoji: string,
  options: { highlighted?: boolean; colourVar?: string } = {},
): DivIcon {
  const { highlighted = false, colourVar } = options;

  // Every marker used to be white with the same near-black ring, so a map of
  // forty reports was forty identical dots and told you nothing until you
  // clicked one. The ring now carries the issue’s status, which turns the map
  // into a status view at a glance while the emoji still says the category.
  //
  // The colour arrives as a CSS custom property name rather than a hex value,
  // because this builds a raw HTML string outside React and so cannot use a
  // Tailwind class — but a var() still resolves against the live theme, so the
  // markers follow light and dark like everything else.
  const ring = colourVar ? `var(${colourVar}, #171717)` : "#171717";
  const halo = highlighted ? "box-shadow:0 0 0 4px color-mix(in srgb, var(--color-brand) 35%, transparent);" : "";

  return new DivIcon({
    className: "", // Leaflet adds its own class otherwise, which brings a border.
    html: `<span style="
      display:flex;align-items:center;justify-content:center;
      width:32px;height:32px;border-radius:9999px;
      background:var(--color-surface,#fff);border:2.5px solid ${ring};font-size:16px;
      ${halo}
    ">${emoji}</span>`,
    iconSize: [32, 32],
    // Anchor at the bottom centre so the circle sits above the point it marks,
    // rather than being centred on it.
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}
