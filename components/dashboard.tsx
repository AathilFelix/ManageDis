"use client";

import { motion } from "framer-motion";
import type { AnalysisResult, DecisionLogEntry } from "@/lib/types";
import type { CommanderResult } from "@/lib/types";
import SeverityBadge from "./severity-badge";
import ActionPlan from "./action-plan";
import MapView from "./map-view";
import SpeedComparison from "./speed-comparison";
import DecisionLog from "./decision-log";
import PlanDiff from "./plan-diff";

interface DashboardProps {
  result: AnalysisResult;
  totalElapsed: number | null;
  decisionLog: DecisionLogEntry[];
  planVersion: number;
  previousPlan: CommanderResult | null;
}

function ConfidenceBar({ label, icon, value }: { label: string; icon: string; value: number }) {
  const color = value >= 90 ? "bg-green-500" : value >= 75 ? "bg-yellow-500" : "bg-orange-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-zinc-400">{label}</span>
          <span className="text-xs font-mono font-bold text-white">{value}%</span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full ${color} rounded-full`}
          />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ result, totalElapsed, decisionLog, planVersion, previousPlan }: DashboardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full space-y-6"
    >
      {/* Plan Diff */}
      {previousPlan && planVersion > 1 && (
        <PlanDiff oldPlan={previousPlan} newPlan={result.commander} version={planVersion} />
      )}

      {/* Speed Comparison */}
      {totalElapsed && <SpeedComparison elapsed={totalElapsed} />}

      {/* Top Stats + Confidence */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <SeverityBadge
            severity={result.vision.severity}
            disasterType={result.vision.disasterType}
            peopleAtRisk={result.vision.estimatedPeopleAtRisk}
          />
        </div>
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 space-y-3">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Agent Confidence</p>
          <div className="space-y-3">
            <ConfidenceBar label="Vision" icon="👁️" value={result.vision.confidence ?? 85} />
            <ConfidenceBar label="Risk" icon="⚠️" value={result.risk.confidence ?? 82} />
            <ConfidenceBar label="Resources" icon="🚑" value={result.resources.confidence ?? 78} />
            <ConfidenceBar label="Routes" icon="🗺️" value={result.routes.confidence ?? 80} />
            <ConfidenceBar label="Commander" icon="🎖️" value={result.commander.confidence ?? 88} />
          </div>
        </div>
      </div>

      {/* Key Observations */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Key Observations</p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {result.vision.keyObservations.slice(0, 6).map((obs, i) => (
            <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
              <span className="text-zinc-600 mt-0.5">•</span>
              {obs}
            </li>
          ))}
        </ul>
      </div>

      {/* Map */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          Operations Map
          <span className="ml-2 text-xs text-zinc-600 normal-case">
            🟢 Safe Zones · 🔵 Staging · 🔴 Blocked · — Evacuation Routes
          </span>
        </h3>
        <MapView routes={result.routes} />
      </div>

      {/* Action Plan */}
      <ActionPlan
        commander={result.commander}
        resources={result.resources}
        risk={result.risk}
      />

      {/* Decision Log */}
      <DecisionLog entries={decisionLog} />
    </motion.div>
  );
}
