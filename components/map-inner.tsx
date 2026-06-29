"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { RouteResult } from "@/lib/types";

interface MapInnerProps {
  routes: RouteResult;
  center?: { lat: number; lng: number };
}

const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const blueIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function MapInner({ routes, center }: MapInnerProps) {
  const mapCenter = center ||
    (routes.safeZones.length > 0
      ? [routes.safeZones[0].coordinates.lat, routes.safeZones[0].coordinates.lng] as [number, number]
      : [29.76, -95.37] as [number, number]);

  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden border border-zinc-700">
      <MapContainer
        center={mapCenter as [number, number]}
        zoom={13}
        className="w-full h-full"
        style={{ background: "#18181b" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {routes.safeZones.map((zone, i) => (
          <Marker key={`safe-${i}`} position={[zone.coordinates.lat, zone.coordinates.lng]} icon={greenIcon}>
            <Popup>
              <div className="text-sm">
                <strong>🟢 Safe Zone: {zone.name}</strong>
                <br />Capacity: {zone.capacity}
              </div>
            </Popup>
          </Marker>
        ))}

        {routes.stagingAreas.map((area, i) => (
          <Marker key={`stage-${i}`} position={[area.coordinates.lat, area.coordinates.lng]} icon={blueIcon}>
            <Popup>
              <div className="text-sm">
                <strong>🔵 Staging: {area.name}</strong>
                <br />{area.purpose}
              </div>
            </Popup>
          </Marker>
        ))}

        {routes.blockedAreas.length > 0 && routes.safeZones.length > 0 && (
          <Marker
            position={[
              routes.safeZones[0].coordinates.lat + 0.005,
              routes.safeZones[0].coordinates.lng + 0.005,
            ]}
            icon={redIcon}
          >
            <Popup>
              <div className="text-sm">
                <strong>🔴 Blocked Area</strong>
                <br />{routes.blockedAreas[0].name}: {routes.blockedAreas[0].reason}
              </div>
            </Popup>
          </Marker>
        )}

        {routes.routeCoordinates?.map((route, i) => (
          <Polyline
            key={`route-${i}`}
            positions={route.map((c) => [c.lat, c.lng] as [number, number])}
            pathOptions={{ color: i === 0 ? "#22c55e" : "#3b82f6", weight: 4, opacity: 0.8, dashArray: i > 0 ? "10, 10" : undefined }}
          />
        ))}
      </MapContainer>
    </div>
  );
}
