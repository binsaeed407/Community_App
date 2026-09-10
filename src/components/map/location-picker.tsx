"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useEffect } from "react";
import { MAP_DEFAULT_ZOOM, type Coordinates } from "@/lib/constants";
import { createMarkerIcon } from "./map-marker";

/**
 * A map you drop a pin on.
 *
 * Loaded through next/dynamic with ssr:false by its parent. Leaflet reads
 * `window` at import time, so merely importing this module on the server throws
 * before any component renders.
 */

/** Turns a click anywhere on the map into a new pin position. */
function ClickToPlace({ onPick }: { onPick: (position: Coordinates) => void }) {
  useMapEvents({
    click(event) {
      onPick({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    },
  });
  return null;
}

/**
 * Keeps the viewport following the pin when it moves for a reason other than a
 * click — pressing "use my current location", most obviously. Without this the
 * pin jumps to a location the user cannot see.
 */
function FollowPin({ position }: { position: Coordinates }) {
  const map = useMap();

  useEffect(() => {
    map.setView([position.latitude, position.longitude], map.getZoom());
  }, [map, position.latitude, position.longitude]);

  return null;
}

export function LocationPicker({
  position,
  onPick,
  emoji = "📍",
}: {
  position: Coordinates;
  onPick: (position: Coordinates) => void;
  emoji?: string;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-line">
      <MapContainer
        center={[position.latitude, position.longitude]}
        zoom={MAP_DEFAULT_ZOOM}
        scrollWheelZoom={false}
        style={{ height: "320px", width: "100%" }}
        // The map is decorative here: the authoritative value is the pair of
        // coordinates shown as text next to it, and the address field is what a
        // keyboard user fills in. Marked as such so a screen reader does not
        // announce a large interactive region that it cannot operate.
        aria-hidden="true"
      >
        <TileLayer
          // OpenStreetMap: no account, no API key, no card, no billing risk.
          // Attribution is a licence condition, not decoration — do not remove it.
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <ClickToPlace onPick={onPick} />
        <FollowPin position={position} />
        <Marker
          position={[position.latitude, position.longitude]}
          icon={createMarkerIcon(emoji, true)}
          draggable
          eventHandlers={{
            dragend(event) {
              const { lat, lng } = event.target.getLatLng();
              onPick({ latitude: lat, longitude: lng });
            },
          }}
        />
      </MapContainer>
    </div>
  );
}
