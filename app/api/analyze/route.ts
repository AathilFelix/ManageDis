import { NextRequest } from "next/server";
import {
  runVisionAgent,
  runRiskAgent,
  runResourceAgent,
  runRouteAgent,
  runCommanderAgent,
} from "@/lib/agents";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { image, location, situation } = await req.json();

  if (!image || !location) {
    return new Response(JSON.stringify({ error: "Image and location are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ event, ...data as object })}\n\n`)
        );
      }

      const totalStart = Date.now();

      try {
        // Phase 1: Vision Agent
        send("agent-start", { agent: "vision", timestamp: Date.now() });
        const visionStart = Date.now();
        const visionResult = await runVisionAgent(image, location, situation || "");
        send("agent-complete", {
          agent: "vision",
          data: visionResult,
          elapsed: Date.now() - visionStart,
          timestamp: Date.now(),
        });

        // Phase 2: Risk, Resource, Route agents in parallel
        send("agent-start", { agent: "risk", timestamp: Date.now() });
        send("agent-start", { agent: "resource", timestamp: Date.now() });
        send("agent-start", { agent: "route", timestamp: Date.now() });

        const phase2Start = Date.now();
        const [riskResult, resourceResult, routeResult] = await Promise.all([
          runRiskAgent(visionResult, location, situation || ""),
          runResourceAgent(visionResult, location, situation || ""),
          runRouteAgent(visionResult, location, situation || ""),
        ]);

        const phase2Elapsed = Date.now() - phase2Start;
        send("agent-complete", { agent: "risk", data: riskResult, elapsed: phase2Elapsed, timestamp: Date.now() });
        send("agent-complete", { agent: "resource", data: resourceResult, elapsed: phase2Elapsed, timestamp: Date.now() });
        send("agent-complete", { agent: "route", data: routeResult, elapsed: phase2Elapsed, timestamp: Date.now() });

        // Phase 3: Commander Agent synthesizes everything
        send("agent-start", { agent: "commander", timestamp: Date.now() });
        const cmdStart = Date.now();
        const commanderResult = await runCommanderAgent(
          visionResult,
          riskResult,
          resourceResult,
          routeResult,
          location,
          situation || ""
        );
        send("agent-complete", {
          agent: "commander",
          data: commanderResult,
          elapsed: Date.now() - cmdStart,
          timestamp: Date.now(),
        });

        // Final assembled result
        send("analysis-complete", {
          agent: "all",
          data: {
            vision: visionResult,
            risk: riskResult,
            resources: resourceResult,
            routes: routeResult,
            commander: commanderResult,
          },
          elapsed: Date.now() - totalStart,
          timestamp: Date.now(),
        });
      } catch (error) {
        send("agent-error", {
          agent: "system",
          data: { message: error instanceof Error ? error.message : "Unknown error" },
          timestamp: Date.now(),
        });
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
