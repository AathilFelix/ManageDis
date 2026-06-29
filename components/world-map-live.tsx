"use client";

import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { RealDisaster } from "@/lib/real-data";
import { TYPE_CONFIG } from "@/lib/real-data";
import { useEffect } from "react";

function FlyToSelected({ selected }: { selected: RealDisaster | null }) {
  const map = useMap();
  useEffect(() => {
    if (selected) {
      map.flyTo([selected.coordinates.lat, selected.coordinates.lng], 6, { duration: 1.5 });
    }
  }, [selected, map]);
  return null;
}

interface WorldMapLiveProps {
  disasters: RealDisaster[];
  selected: RealDisaster | null;
  onSelect: (d: RealDisaster) => void;
}

export default function WorldMapLive({ disasters, selected, onSelect }: WorldMapLiveProps) {
  const severityRadius: Record<string, number> = { critical: 12, high: 9, medium: 7, low: 5 };
  const severityOpacity: Record<string, number> = { critical: 0.9, high: 0.7, medium: 0.5, low: 0.4 };

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{ height: "100%", width: "100%" }}
      attributionControl={false}
      minZoom={2}
      maxBounds={[[-90, -200], [90, 200]]}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      <FlyToSelected selected={selected} />
      {disasters.map((d) => {
        const config = TYPE_CONFIG[d.type];
        const isSelected = selected?.id === d.id;
        return (
          <CircleMarker
            key={d.id}
            center={[d.coordinates.lat, d.coordinates.lng]}
            radius={isSelected ? 16 : severityRadius[d.severity] || 7}
            pathOptions={{
              color: isSelected ? "#ffffff" : config.color,
              fillColor: config.color,
              fillOpacity: isSelected ? 1 : severityOpacity[d.severity] || 0.5,
              weight: isSelected ? 3 : 1,
            }}
            eventHandlers={{ click: () => onSelect(d) }}
          >
            <Popup>
              <div style={{ color: "#000", maxWidth: 220 }}>
                <strong>{config.icon} {d.title}</strong>
                <br />
                <span style={{ fontSize: 11, color: "#666" }}>{d.source} · {new Date(d.timestamp).toLocaleString()}</span>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
