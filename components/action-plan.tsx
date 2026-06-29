"use client";

import { motion } from "framer-motion";
import type { CommanderResult, ResourceResult, RiskResult } from "@/lib/types";

interface ActionPlanProps {
  commander: CommanderResult;
  resources: ResourceResult;
  risk: RiskResult;
}

export default function ActionPlan({ commander, resources, risk }: ActionPlanProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Mission Header */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
        <h2 className="text-xl font-black text-white mb-2">{commander.missionName}</h2>
        <p className="text-zinc-300 leading-relaxed">{commander.summary}</p>
      </div>

      {/* Commander Reasoning */}
      {commander.reasoning && commander.reasoning.length > 0 && (
        <div className="bg-purple-950/20 border border-purple-900/40 rounded-2xl p-6 space-y-3">
          <h3 className="text-sm font-medium text-purple-400 uppercase tracking-wider flex items-center gap-2">
            <span>🧠</span> Commander Reasoning
          </h3>
          <ul className="space-y-2">
            {commander.reasoning.map((reason, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-2 text-sm text-zinc-300"
              >
                <span className="text-purple-500 mt-0.5 flex-shrink-0">→</span>
                {reason}
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk Alerts */}
      <div className="bg-red-950/30 border border-red-900/50 rounded-2xl p-6 space-y-3">
        <h3 className="text-sm font-medium text-red-400 uppercase tracking-wider flex items-center gap-2">
          <span>⚠️</span> Immediate Threats
        </h3>
        <ul className="space-y-2">
          {risk.immediateThreats.map((threat, i) => (
            <li key={i} className="flex items-start gap-2 text-zinc-300">
              <span className="text-red-500 mt-0.5">●</span>
              {threat}
            </li>
          ))}
        </ul>
        <p className="text-sm text-zinc-500 pt-2 border-t border-red-900/30">
          Critical window: {risk.timeframe}
        </p>
      </div>

      {/* Priority Actions */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Priority Actions</h3>
        <div className="space-y-3">
          {commander.priorityActions.map((action, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-4 p-3 bg-zinc-800/50 rounded-xl"
            >
              <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                action.priority === 1 ? "bg-red-600 text-white" :
                action.priority === 2 ? "bg-orange-600 text-white" :
                action.priority === 3 ? "bg-yellow-600 text-black" :
                "bg-zinc-600 text-white"
              }`}>
                P{action.priority}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-zinc-200 font-medium">{action.action}</p>
                <div className="flex gap-4 mt-1">
                  <span className="text-xs text-zinc-500">👤 {action.assignee}</span>
                  <span className="text-xs text-zinc-500">⏰ {action.deadline}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Resource Optimization */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Resource Allocation</h3>

        {/* Personnel Table */}
        <div>
          <p className="text-xs text-zinc-500 uppercase mb-2">Personnel</p>
          <div className="space-y-2">
            {resources.personnel.map((p, i) => {
              const gap = (p.gap ?? 0) || ((p.needed ?? 0) - (p.available ?? 0));
              const hasGap = gap > 0;
              return (
                <div key={i} className="grid grid-cols-4 gap-2 text-sm items-center">
                  <span className="text-zinc-300">{p.type}</span>
                  <div className="text-center">
                    <span className="text-xs text-zinc-500 block">Available</span>
                    <span className="text-white font-mono">{p.available ?? "—"}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-zinc-500 block">Needed</span>
                    <span className="text-white font-mono">{p.needed ?? (p as unknown as { count: number }).count ?? "—"}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-zinc-500 block">Gap</span>
                    <span className={`font-mono font-bold ${hasGap ? "text-red-400" : "text-green-400"}`}>
                      {hasGap ? gap : "✓"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vehicles Table */}
        <div className="pt-3 border-t border-zinc-800">
          <p className="text-xs text-zinc-500 uppercase mb-2">Vehicles</p>
          <div className="space-y-2">
            {resources.vehicles.map((v, i) => {
              const gap = (v.gap ?? 0) || ((v.needed ?? 0) - (v.available ?? 0));
              const hasGap = gap > 0;
              return (
                <div key={i} className="grid grid-cols-4 gap-2 text-sm items-center">
                  <span className="text-zinc-300">{v.type}</span>
                  <div className="text-center">
                    <span className="text-xs text-zinc-500 block">Available</span>
                    <span className="text-white font-mono">{v.available ?? "—"}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-zinc-500 block">Needed</span>
                    <span className="text-white font-mono">{v.needed ?? (v as unknown as { count: number }).count ?? "—"}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-zinc-500 block">Gap</span>
                    <span className={`font-mono font-bold ${hasGap ? "text-red-400" : "text-green-400"}`}>
                      {hasGap ? gap : "✓"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gap Recommendations */}
        {resources.gapRecommendations && resources.gapRecommendations.length > 0 && (
          <div className="pt-3 border-t border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase mb-2">Gap Recommendations</p>
            <div className="space-y-1.5">
              {resources.gapRecommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-yellow-300/80 bg-yellow-950/20 rounded-lg px-3 py-2">
                  <span className="text-yellow-500 flex-shrink-0">💡</span>
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}

        {resources.equipment.length > 0 && (
          <div className="pt-3 border-t border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase mb-2">Equipment</p>
            <div className="flex flex-wrap gap-2">
              {resources.equipment.map((eq, i) => (
                <span key={i} className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300">{eq}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Operation Timeline</h3>
        <div className="space-y-0">
          {commander.timeline.map((item, i) => (
            <div key={i} className="flex items-start gap-4 relative">
              {i < commander.timeline.length - 1 && (
                <div className="absolute left-[15px] top-8 w-0.5 h-full bg-zinc-800" />
              )}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center z-10">
                <div className="w-2 h-2 rounded-full bg-zinc-400" />
              </div>
              <div className="pb-6">
                <p className="text-xs font-mono text-zinc-500">{item.time}</p>
                <p className="text-sm text-zinc-300">{item.action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comms */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Communication Plan</h3>
        <p className="text-zinc-300 text-sm leading-relaxed">{commander.communicationPlan}</p>
      </div>
    </motion.div>
  );
}
