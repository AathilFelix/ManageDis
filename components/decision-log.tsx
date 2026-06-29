"use client";

import { motion } from "framer-motion";
import type { DecisionLogEntry } from "@/lib/types";

interface DecisionLogProps {
  entries: DecisionLogEntry[];
}

const AGENT_COLORS: Record<string, string> = {
  vision: "bg-blue-500",
  risk: "bg-red-500",
  resource: "bg-green-500",
  route: "bg-yellow-500",
  commander: "bg-purple-500",
  feed: "bg-orange-500",
  system: "bg-zinc-500",
};

export default function DecisionLog({ entries }: DecisionLogProps) {
  if (entries.length === 0) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
      <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Decision Log</h3>
      <div className="space-y-0 max-h-64 overflow-y-auto">
        {entries.map((entry, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 relative"
          >
            {i < entries.length - 1 && (
              <div className="absolute left-[7px] top-5 w-0.5 h-full bg-zinc-800" />
            )}
            <div className={`flex-shrink-0 w-4 h-4 rounded-full ${AGENT_COLORS[entry.agent || "system"]} mt-0.5 z-10 ring-2 ring-zinc-900`} />
            <div className="pb-4 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-zinc-600">{entry.time}</span>
              </div>
              <p className="text-sm text-zinc-300">{entry.event}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
