"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UploadForm from "@/components/upload-form";
import AgentGraph from "@/components/agent-graph";
import Dashboard from "@/components/dashboard";
import LiveFeed from "@/components/live-feed";
import type { AnalysisResult, AgentState, CommanderResult, DecisionLogEntry } from "@/lib/types";
import type { FeedItem } from "@/lib/feed-types";

const INITIAL_AGENTS: AgentState[] = [
  { name: "vision", icon: "👁️", status: "waiting", elapsed: 0 },
  { name: "risk", icon: "⚠️", status: "waiting", elapsed: 0 },
  { name: "resource", icon: "🚑", status: "waiting", elapsed: 0 },
  { name: "route", icon: "🗺️", status: "waiting", elapsed: 0 },
  { name: "commander", icon: "🎖️", status: "waiting", elapsed: 0 },
];

function timeNow() {
  return new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function Home() {
  const [agents, setAgents] = useState<AgentState[]>(INITIAL_AGENTS);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalElapsed, setTotalElapsed] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [planVersion, setPlanVersion] = useState(1);
  const [previousPlan, setPreviousPlan] = useState<CommanderResult | null>(null);
  const [decisionLog, setDecisionLog] = useState<DecisionLogEntry[]>([]);
  const reportRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((event: string, agent?: string) => {
    setDecisionLog((prev) => [...prev, { time: timeNow(), event, agent }]);
  }, []);

  const handleAnalyze = useCallback(async (data: { image: string; location: string; situation: string }) => {
    setLoading(true);
    setResult(null);
    setError(null);
    setTotalElapsed(null);
    setPlanVersion(1);
    setPreviousPlan(null);
    setDecisionLog([]);
    setAgents(INITIAL_AGENTS.map((a) => ({ ...a })));
    addLog("Analysis initiated", "system");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.event === "agent-start") {
              setAgents((prev) =>
                prev.map((a) =>
                  a.name === event.agent ? { ...a, status: "running" } : a
                )
              );
              addLog(`${event.agent.charAt(0).toUpperCase() + event.agent.slice(1)} agent started`, event.agent);
            }

            if (event.event === "agent-complete") {
              const confidence = event.data?.confidence;
              setAgents((prev) =>
                prev.map((a) =>
                  a.name === event.agent
                    ? { ...a, status: "complete", elapsed: event.elapsed, confidence }
                    : a
                )
              );
              addLog(`${event.agent.charAt(0).toUpperCase() + event.agent.slice(1)} completed (${(event.elapsed / 1000).toFixed(2)}s)`, event.agent);
            }

            if (event.event === "agent-error") {
              setError(event.data?.message || "Agent error");
              setAgents((prev) =>
                prev.map((a) =>
                  a.status === "running" ? { ...a, status: "error" } : a
                )
              );
              addLog(`Error: ${event.data?.message}`, "system");
            }

            if (event.event === "analysis-complete") {
              setResult(event.data as AnalysisResult);
              setTotalElapsed(event.elapsed);
              addLog(`Analysis complete — ${(event.elapsed / 1000).toFixed(2)}s total`, "system");
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [addLog]);

  const handleReanalyze = useCallback(async (reports: FeedItem[]) => {
    if (!result) return;
    setIsReanalyzing(true);
    setPreviousPlan({ ...result.commander });
    addLog(`Re-analysis triggered (${reports.length} new reports)`, "commander");

    try {
      const res = await fetch("/api/reanalyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis: result, newReports: reports }),
      });
      if (!res.ok) throw new Error("Re-analysis failed");
      const data = await res.json();
      setResult((prev) =>
        prev ? { ...prev, commander: data.commander as CommanderResult } : prev
      );
      setPlanVersion((v) => v + 1);
      addLog(`Plan updated to v${planVersion + 1} (${(data.elapsed / 1000).toFixed(2)}s)`, "commander");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Re-analysis failed");
      addLog("Re-analysis failed", "system");
    } finally {
      setIsReanalyzing(false);
    }
  }, [result, addLog, planVersion]);

  const handleReset = () => {
    setResult(null);
    setAgents(INITIAL_AGENTS.map((a) => ({ ...a })));
    setTotalElapsed(null);
    setError(null);
    setPlanVersion(1);
    setPreviousPlan(null);
    setDecisionLog([]);
  };

  const handleExportPDF = () => {
    if (!reportRef.current) return;
    window.print();
  };

  const isAnalyzing = agents.some((a) => a.status === "running" || a.status === "complete");

  return (
    <main className="min-h-screen bg-zinc-950 text-white print:bg-white print:text-black">
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            <span className="text-red-500">AI</span> Emergency Commander
          </h1>
          <p className="text-zinc-400 mt-2 text-lg">
            Multi-agent disaster response powered by Gemma 4 on Cerebras
          </p>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-zinc-600">
            <span>5 AI Agents</span>
            <span>·</span>
            <span>Real-time Analysis</span>
            <span>·</span>
            <span>Live Feed</span>
            <span>·</span>
            <span>Parallel Processing</span>
          </div>
        </motion.header>

        <AnimatePresence mode="wait">
          {!isAnalyzing && !result ? (
            <motion.div key="form" exit={{ opacity: 0, y: -20 }}>
              <UploadForm onSubmit={handleAnalyze} loading={loading} />
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Agent Graph */}
              <div className="max-w-md mx-auto">
                <AgentGraph agents={agents} totalElapsed={totalElapsed} />
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="max-w-2xl mx-auto bg-red-950/50 border border-red-800 rounded-xl p-4 text-red-300"
                >
                  <p className="font-medium">Error: {error}</p>
                  <button
                    onClick={handleReset}
                    className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
                  >
                    Try again
                  </button>
                </motion.div>
              )}

              {/* Dashboard + Live Feed */}
              {result && (
                <div ref={reportRef} className="flex gap-6">
                  <div className="flex-1 min-w-0">
                    <Dashboard
                      result={result}
                      totalElapsed={totalElapsed}
                      decisionLog={decisionLog}
                      planVersion={planVersion}
                      previousPlan={previousPlan}
                    />
                  </div>

                  <div className="w-80 flex-shrink-0 hidden lg:block print:hidden">
                    <div className="sticky top-8 space-y-4">
                      <LiveFeed
                        disasterType={result.vision.disasterType}
                        onReanalyze={handleReanalyze}
                        isReanalyzing={isReanalyzing}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Live Feed */}
              {result && (
                <div className="lg:hidden print:hidden">
                  <LiveFeed
                    disasterType={result.vision.disasterType}
                    onReanalyze={handleReanalyze}
                    isReanalyzing={isReanalyzing}
                  />
                </div>
              )}

              {/* Bottom Actions */}
              {(result || error) && (
                <div className="flex items-center justify-center gap-4 pt-6 print:hidden">
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-300 transition-colors"
                  >
                    Analyze New Disaster
                  </button>
                  {result && (
                    <button
                      onClick={handleExportPDF}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-white font-medium transition-colors flex items-center gap-2"
                    >
                      📄 Generate Incident Report
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
