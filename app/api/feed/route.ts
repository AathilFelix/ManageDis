import { NextRequest } from "next/server";
import { getSimulatedFeed, fetchUSGSEarthquakes } from "@/lib/live-feed";

export async function GET(req: NextRequest) {
  const disasterType = req.nextUrl.searchParams.get("type") || "flood";

  const encoder = new TextEncoder();
  const feed = getSimulatedFeed(disasterType);

  let usgsItems: Awaited<ReturnType<typeof fetchUSGSEarthquakes>> = [];
  if (disasterType === "earthquake") {
    usgsItems = await fetchUSGSEarthquakes();
  }

  const stream = new ReadableStream({
    async start(controller) {
      // Send real USGS data first if available
      for (const item of usgsItems) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(item)}\n\n`));
      }

      // Then stream simulated items with delays
      for (let i = 0; i < feed.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 3500 + Math.random() * 1500));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(feed[i])}\n\n`));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
