"use client";

import { motion } from "framer-motion";
import type { AgentState } from "@/lib/types";

interface AgentGraphProps {
  agents: AgentState[];
  totalElapsed: number | null;
}

const AGENT_META: Record<string, { icon: string; label: string; gradient: string }> = {
  vision: { icon: "👁️", label: "Vision", gradient: "from-blue-500 to-cyan-500" },
  risk: { icon: "⚠️", label: "Risk", gradient: "from-red-500 to-pink-500" },
  resource: { icon: "🚑", label: "Resource", gradient: "from-green-500 to-emerald-500" },
  route: { icon: "🗺️", label: "Route", gradient: "from-yellow-500 to-orange-500" },
  commander: { icon: "🎖️", label: "Commander", gradient: "from-purple-500 to-violet-500" },
};

function AgentNode({ agent }: { agent: AgentState }) {
  const meta = AGENT_META[agent.name] || { icon: "🤖", label: agent.name, gradient: "from-zinc-500 to-zinc-600" };
  const isActive = agent.status === "running";
  const isDone = agent.status === "complete";

  return (
    <motion.div
      initial={{ opacity: 0.3, scale: 0.9 }}
      animate={{
        opacity: isDone || isActive ? 1 : 0.4,
        scale: isActive ? 1.05 : 1,
      }}
      className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all ${
        isDone
          ? "bg-zinc-800 border-zinc-600"
          : isActive
          ? "bg-zinc-800 border-zinc-500 shadow-lg shadow-zinc-800/50"
          : "bg-zinc-900/50 border-zinc-800"
      }`}
    >
      {isActive && (
        <motion.div
          className={`absolute inset-0 rounded-xl bg-gradient-to-r ${meta.gradient} opacity-10`}
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
      <span className="text-lg">{meta.icon}</span>
      <span className="text-[11px] font-medium text-zinc-300">{meta.label}</span>

      {isDone && agent.confidence !== undefined && (
        <span className="text-[10px] font-mono text-green-400">{agent.confidence}%</span>
      )}

      {isDone && (
        <span className="text-[10px] font-mono text-zinc-500">{(agent.elapsed / 1000).toFixed(2)}s</span>
      )}

      {isActive && (
        <div className="flex gap-0.5 mt-0.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={`w-1 h-1 rounded-full bg-gradient-to-r ${meta.gradient}`}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      )}

      {isDone && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
        >
          <span className="text-[8px] text-white font-bold">✓</span>
        </motion.div>
      )}
    </motion.div>
  );
}

function Arrow({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div className="flex items-center justify-center h-6">
      <motion.div
        initial={{ opacity: 0.2 }}
        animate={{ opacity: done ? 0.8 : active ? 0.6 : 0.2 }}
        className="flex flex-col items-center"
      >
        <div className={`w-0.5 h-3 ${done ? "bg-green-500/60" : active ? "bg-zinc-500" : "bg-zinc-800"} transition-colors`} />
        <div className={`w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent ${
          done ? "border-t-green-500/60" : active ? "border-t-zinc-500" : "border-t-zinc-800"
        } transition-colors`} />
      </motion.div>
    </div>
  );
}

export default function AgentGraph({ agents, totalElapsed }: AgentGraphProps) {
  const vision = agents.find((a) => a.name === "vision")!;
  const risk = agents.find((a) => a.name === "risk")!;
  const resource = agents.find((a) => a.name === "resource")!;
  const route = agents.find((a) => a.name === "route")!;
  const commander = agents.find((a) => a.name === "commander")!;

  const phase1Done = vision.status === "complete";
  const phase2Active = ["risk", "resource", "route"].some((n) => agents.find((a) => a.name === n)?.status === "running");
  const phase2Done = [risk, resource, route].every((a) => a.status === "complete");
  const phase3Active = commander.status === "running";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Agent Pipeline</h3>
        {totalElapsed !== null && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-sm font-mono font-bold text-green-400"
          >
            {(totalElapsed / 1000).toFixed(2)}s
          </motion.span>
        )}
      </div>

      <div className="flex flex-col items-center">
        {/* Phase 1: Vision */}
        <AgentNode agent={vision} />

        <Arrow active={phase1Done} done={phase1Done} />

        {/* Phase 2: Parallel agents */}
        <div className="flex items-start gap-3">
          <AgentNode agent={risk} />
          <AgentNode agent={resource} />
          <AgentNode agent={route} />
        </div>

        <Arrow active={phase2Done || phase3Active} done={phase2Done} />

        {/* Phase 3: Commander */}
        <AgentNode agent={commander} />
      </div>
    </div>
  );
}
