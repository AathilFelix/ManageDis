import { NextRequest } from "next/server";
import { runCommanderAgent } from "@/lib/agents";
import type { AnalysisResult } from "@/lib/types";
import type { FeedItem } from "@/lib/feed-types";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { analysis, newReports } = (await req.json()) as {
    analysis: AnalysisResult;
    newReports: FeedItem[];
  };

  if (!analysis || !newReports?.length) {
    return new Response(JSON.stringify({ error: "Missing analysis or reports" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const reportsContext = newReports
      .map((r) => `[${r.source.toUpperCase()}] ${r.text}`)
      .join("\n");

    const updatedSituation = `
ORIGINAL SITUATION:
${analysis.commander.summary}

NEW INCOMING REPORTS (${newReports.length} updates):
${reportsContext}

Update the action plan based on this new intelligence. Adjust priorities, add new actions, and modify resource allocations as needed.`;

    const start = Date.now();
    const updatedPlan = await runCommanderAgent(
      analysis.vision,
      analysis.risk,
      analysis.resources,
      analysis.routes,
      "Updated based on live intel",
      updatedSituation
    );
    const elapsed = Date.now() - start;

    return new Response(
      JSON.stringify({ commander: updatedPlan, elapsed }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Re-analysis failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
