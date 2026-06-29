export interface RealDisaster {
  id: string;
  title: string;
  type: "earthquake" | "wildfire" | "storm" | "volcano" | "flood" | "iceberg" | "other";
  severity: "low" | "medium" | "high" | "critical";
  coordinates: { lat: number; lng: number };
  timestamp: number;
  source: string;
  details: string;
  magnitude?: number;
  link?: string;
}

export async function fetchUSGSEarthquakes(): Promise<RealDisaster[]> {
  try {
    const res = await fetch(
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson",
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.features.map((f: any) => ({
      id: `usgs-${f.id}`,
      title: `M${f.properties.mag.toFixed(1)} — ${f.properties.place}`,
      type: "earthquake" as const,
      severity: f.properties.mag >= 7 ? "critical" : f.properties.mag >= 6 ? "high" : f.properties.mag >= 5 ? "medium" : "low",
      coordinates: { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] },
      timestamp: f.properties.time,
      source: "USGS",
      details: `Magnitude ${f.properties.mag.toFixed(1)} earthquake at depth ${f.geometry.coordinates[2].toFixed(1)}km. ${f.properties.place}. ${f.properties.tsunami ? "⚠️ Tsunami advisory issued." : ""}`,
      magnitude: f.properties.mag,
      link: f.properties.url,
    }));
  } catch {
    return [];
  }
}

export async function fetchNASAEvents(): Promise<RealDisaster[]> {
  try {
    const res = await fetch(
      "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=25",
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.events
      .filter((e: any) => e.geometry?.length > 0)
      .map((e: any) => {
        const geo = e.geometry[e.geometry.length - 1];
        const coords = geo.coordinates;
        const categoryId = e.categories?.[0]?.id || "";
        let type: RealDisaster["type"] = "other";
        if (categoryId === "wildfires") type = "wildfire";
        else if (categoryId === "severeStorms") type = "storm";
        else if (categoryId === "volcanoes") type = "volcano";
        else if (categoryId === "floods") type = "flood";
        else if (categoryId === "seaLakeIce") type = "iceberg";
        else if (categoryId === "earthquakes") type = "earthquake";

        return {
          id: `nasa-${e.id}`,
          title: e.title,
          type,
          severity: type === "volcano" ? "critical" : type === "wildfire" ? "high" : "medium",
          coordinates: { lat: coords[1], lng: coords[0] },
          timestamp: new Date(geo.date).getTime(),
          source: "NASA EONET",
          details: `${e.title}. Category: ${e.categories?.[0]?.title || "Unknown"}. Source: ${e.sources?.[0]?.id || "NASA"}.`,
          link: e.sources?.[0]?.url,
        };
      });
  } catch {
    return [];
  }
}

export async function fetchGDACSAlerts(): Promise<RealDisaster[]> {
  try {
    const res = await fetch(
      "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ,TC,FL,VO,WF&fromDate=" +
        new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0] +
        "&toDate=" +
        new Date().toISOString().split("T")[0] +
        "&alertlevel=Green,Orange,Red",
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.features) return [];
    return data.features.slice(0, 15).map((f: any) => {
      const p = f.properties || {};
      const typeMap: Record<string, RealDisaster["type"]> = { EQ: "earthquake", TC: "storm", FL: "flood", VO: "volcano", WF: "wildfire" };
      const sevMap: Record<string, RealDisaster["severity"]> = { Red: "critical", Orange: "high", Green: "medium" };
      return {
        id: `gdacs-${p.eventid || Math.random()}`,
        title: p.name || p.htmldescription || "GDACS Event",
        type: typeMap[p.eventtype] || "other",
        severity: sevMap[p.alertlevel] || "medium",
        coordinates: { lat: f.geometry?.coordinates?.[1] || 0, lng: f.geometry?.coordinates?.[0] || 0 },
        timestamp: new Date(p.fromdate || Date.now()).getTime(),
        source: "GDACS",
        details: `${p.name || "Event"} — Alert: ${p.alertlevel || "Unknown"}. ${p.htmldescription || ""}`.slice(0, 300),
        magnitude: p.severitydata?.severity,
        link: p.url,
      };
    });
  } catch {
    return [];
  }
}

export async function fetchAllDisasters(): Promise<RealDisaster[]> {
  const [earthquakes, nasaEvents, gdacs] = await Promise.all([
    fetchUSGSEarthquakes(),
    fetchNASAEvents(),
    fetchGDACSAlerts(),
  ]);

  const all = [...earthquakes, ...nasaEvents, ...gdacs];
  const seen = new Set<string>();
  return all.filter((d) => {
    const key = `${d.coordinates.lat.toFixed(1)}-${d.coordinates.lng.toFixed(1)}-${d.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => b.timestamp - a.timestamp);
}

export const TYPE_CONFIG: Record<RealDisaster["type"], { icon: string; color: string; label: string }> = {
  earthquake: { icon: "🌍", color: "#ef4444", label: "Earthquake" },
  wildfire: { icon: "🔥", color: "#f97316", label: "Wildfire" },
  storm: { icon: "🌀", color: "#8b5cf6", label: "Storm" },
  volcano: { icon: "🌋", color: "#dc2626", label: "Volcano" },
  flood: { icon: "🌊", color: "#3b82f6", label: "Flood" },
  iceberg: { icon: "🧊", color: "#06b6d4", label: "Ice" },
  other: { icon: "⚠️", color: "#eab308", label: "Other" },
};
