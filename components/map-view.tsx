"use client";

import { useEffect, useState } from "react";
import type { RouteResult } from "@/lib/types";

interface MapViewProps {
  routes: RouteResult;
  center?: { lat: number; lng: number };
}

export default function MapView({ routes, center }: MapViewProps) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<MapViewProps> | null>(null);

  useEffect(() => {
    import("./map-inner").then((mod) => setMapComponent(() => mod.default));
  }, []);

  if (!MapComponent) {
    return (
      <div className="w-full h-[400px] rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center">
        <p className="text-zinc-500">Loading map...</p>
      </div>
    );
  }

  return <MapComponent routes={routes} center={center} />;
}
