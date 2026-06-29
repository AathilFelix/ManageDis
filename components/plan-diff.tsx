"use client";

import { motion } from "framer-motion";
import type { CommanderResult } from "@/lib/types";

interface PlanDiffProps {
  oldPlan: CommanderResult;
  newPlan: CommanderResult;
  version: number;
}

export default function PlanDiff({ oldPlan, newPlan, version }: PlanDiffProps) {
  const changes: { type: "added" | "changed" | "removed"; text: string }[] = [];

  if (oldPlan.missionName !== newPlan.missionName) {
    changes.push({ type: "changed", text: `Mission renamed: ${newPlan.missionName}` });
  }

  const oldActions = new Set(oldPlan.priorityActions.map((a) => a.action));
  const newActions = new Set(newPlan.priorityActions.map((a) => a.action));

  for (const action of newPlan.priorityActions) {
    if (!oldActions.has(action.action)) {
      changes.push({ type: "added", text: action.action });
    }
  }

  for (const action of oldPlan.priorityActions) {
    if (!newActions.has(action.action)) {
      changes.push({ type: "removed", text: action.action });
    }
  }

  const oldTimelineActions = new Set(oldPlan.timeline.map((t) => t.action));
  for (const item of newPlan.timeline) {
    if (!oldTimelineActions.has(item.action)) {
      changes.push({ type: "added", text: `Timeline: ${item.time} — ${item.action}` });
    }
  }

  if (changes.length === 0) {
    changes.push({ type: "changed", text: "Plan priorities and resource allocations updated" });
  }

  const typeStyles = {
    added: { bg: "bg-green-950/50", border: "border-green-800/50", icon: "+", color: "text-green-400" },
    changed: { bg: "bg-yellow-950/50", border: "border-yellow-800/50", icon: "~", color: "text-yellow-400" },
    removed: { bg: "bg-red-950/50", border: "border-red-800/50", icon: "-", color: "text-red-400" },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 border border-orange-800/50 rounded-2xl p-5 space-y-3"
    >
      <div className="flex items-center gap-2">
        <span className="text-green-400 text-sm font-bold">UPDATED</span>
        <span className="text-xs text-zinc-500">Plan v{version} — {changes.length} changes detected</span>
      </div>

      <div className="space-y-1.5 font-mono text-sm">
        {changes.slice(0, 8).map((change, i) => {
          const style = typeStyles[change.type];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`${style.bg} ${style.border} border rounded-lg px-3 py-2 flex items-start gap-2`}
            >
              <span className={`${style.color} font-bold flex-shrink-0`}>{style.icon}</span>
              <span className="text-zinc-300 text-xs">{change.text}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
