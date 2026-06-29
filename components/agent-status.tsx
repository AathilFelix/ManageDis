"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { AgentState } from "@/lib/types";

const AGENT_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  vision: { icon: "👁️", label: "Vision Agent", color: "from-blue-500 to-cyan-500" },
  risk: { icon: "⚠️", label: "Risk Agent", color: "from-red-500 to-pink-500" },
  resource: { icon: "🚑", label: "Resource Agent", color: "from-green-500 to-emerald-500" },
  route: { icon: "🗺️", label: "Route Agent", color: "from-yellow-500 to-orange-500" },
  commander: { icon: "🎖️", label: "Commander Agent", color: "from-purple-500 to-violet-500" },
};

interface AgentStatusProps {
  agents: AgentState[];
  totalElapsed: number | null;
}

export default function AgentStatus({ agents, totalElapsed }: AgentStatusProps) {
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
            Total: {(totalElapsed / 1000).toFixed(2)}s
          </motion.span>
        )}
      </div>

      <div className="grid gap-2">
        <AnimatePresence mode="popLayout">
          {agents.map((agent) => {
            const config = AGENT_CONFIG[agent.name] || { icon: "🤖", label: agent.name, color: "from-zinc-500 to-zinc-600" };
            return (
              <motion.div
                key={agent.name}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  agent.status === "complete"
                    ? "bg-zinc-800/80 border-zinc-700"
                    : agent.status === "running"
                    ? "bg-zinc-800 border-zinc-600 shadow-lg"
                    : agent.status === "error"
                    ? "bg-red-950/30 border-red-800"
                    : "bg-zinc-900/50 border-zinc-800"
                }`}
              >
                <span className="text-xl">{config.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200">{config.label}</p>
                </div>

                {agent.status === "running" && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${config.color}`}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {agent.status === "complete" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-zinc-500">
                      {(agent.elapsed / 1000).toFixed(2)}s
                    </span>
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-green-400 text-sm"
                    >
                      ✓
                    </motion.span>
                  </div>
                )}

                {agent.status === "error" && (
                  <span className="text-red-400 text-sm">✗</span>
                )}

                {agent.status === "waiting" && (
                  <span className="text-xs text-zinc-600">Waiting</span>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
