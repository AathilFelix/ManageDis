import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface IntelReport {
  id: string;
  source: string;
  title: string;
  text: string;
  timestamp: number;
  type: "situation" | "response" | "alert" | "media";
  url?: string;
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "disaster";
  const lat = req.nextUrl.searchParams.get("lat");
  const lng = req.nextUrl.searchParams.get("lng");

  const reports: IntelReport[] = [];

  // ReliefWeb situational reports
  try {
    const rwUrl = `https://api.reliefweb.int/v1/reports?appname=managedis&query[value]=${encodeURIComponent(query)}&limit=8&sort[]=date:desc&fields[include][]=title&fields[include][]=body&fields[include][]=source&fields[include][]=date&fields[include][]=url&fields[include][]=format`;
    const res = await fetch(rwUrl, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      for (const item of data.data || []) {
        const f = item.fields || {};
        const body = (f.body || "").replace(/<[^>]+>/g, "").trim();
        const formatName = f.format?.[0]?.name?.toLowerCase() || "";
        let type: IntelReport["type"] = "situation";
        if (formatName.includes("flash") || formatName.includes("alert")) type = "alert";
        else if (formatName.includes("response") || formatName.includes("update")) type = "response";
        else if (formatName.includes("media") || formatName.includes("press")) type = "media";

        reports.push({
          id: `rw-${item.id}`,
          source: f.source?.[0]?.name || "ReliefWeb",
          title: f.title || "",
          text: body.slice(0, 500),
          timestamp: f.date?.created ? new Date(f.date.created).getTime() : Date.now(),
          type,
          url: f.url || `https://reliefweb.int/node/${item.id}`,
        });
      }
    }
  } catch { /* continue */ }

  // GDACS event details if coordinates available
  if (lat && lng) {
    try {
      const gdacsUrl = `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ,TC,FL,VO,WF&fromDate=${
        new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0]
      }&toDate=${new Date().toISOString().split("T")[0]}&alertlevel=Green,Orange,Red`;
      const res = await fetch(gdacsUrl, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const nearby = (data.features || []).filter((f: any) => {
          const coords = f.geometry?.coordinates;
          if (!coords) return false;
          const dist = Math.abs(coords[1] - parseFloat(lat)) + Math.abs(coords[0] - parseFloat(lng));
          return dist < 5;
        });
        for (const f of nearby.slice(0, 3)) {
          const p = f.properties || {};
          reports.push({
            id: `gdacs-intel-${p.eventid || Math.random()}`,
            source: "GDACS",
            title: p.name || "GDACS Alert",
            text: `Alert Level: ${p.alertlevel || "Unknown"}. ${p.htmldescription || ""}`.replace(/<[^>]+>/g, "").slice(0, 500),
            timestamp: new Date(p.fromdate || Date.now()).getTime(),
            type: "alert",
            url: p.url,
          });
        }
      }
    } catch { /* continue */ }
  }

  // USGS nearby earthquakes
  if (lat && lng) {
    try {
      const usgsUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${lat}&longitude=${lng}&maxradiuskm=500&limit=5&orderby=time&minmagnitude=3`;
      const res = await fetch(usgsUrl, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        for (const f of data.features || []) {
          reports.push({
            id: `usgs-intel-${f.id}`,
            source: "USGS",
            title: `M${f.properties.mag.toFixed(1)} — ${f.properties.place}`,
            text: `Magnitude ${f.properties.mag.toFixed(1)} at depth ${f.geometry.coordinates[2].toFixed(1)}km. ${f.properties.tsunami ? "Tsunami advisory issued." : ""} Felt by ${f.properties.felt || 0} people.`,
            timestamp: f.properties.time,
            type: "alert",
            url: f.properties.url,
          });
        }
      }
    } catch { /* continue */ }
  }

  reports.sort((a, b) => b.timestamp - a.timestamp);

  return NextResponse.json({ reports, timestamp: Date.now() });
}
