"use client";

import { motion } from "framer-motion";

interface SeverityBadgeProps {
  severity: string;
  disasterType: string;
  peopleAtRisk: number;
}

const SEVERITY_STYLES: Record<string, { bg: string; ring: string; text: string; emoji: string }> = {
  critical: { bg: "bg-red-950", ring: "ring-red-500", text: "text-red-400", emoji: "🔴" },
  high: { bg: "bg-orange-950", ring: "ring-orange-500", text: "text-orange-400", emoji: "🟠" },
  medium: { bg: "bg-yellow-950", ring: "ring-yellow-500", text: "text-yellow-400", emoji: "🟡" },
  low: { bg: "bg-green-950", ring: "ring-green-500", text: "text-green-400", emoji: "🟢" },
};

export default function SeverityBadge({ severity, disasterType, peopleAtRisk }: SeverityBadgeProps) {
  const style = SEVERITY_STYLES[severity] || SEVERITY_STYLES.medium;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`${style.bg} ${style.ring} ring-1 rounded-2xl p-6 space-y-4`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Severity</p>
          <p className={`text-3xl font-black uppercase ${style.text}`}>
            {style.emoji} {severity}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Disaster Type</p>
          <p className="text-xl font-bold text-white capitalize">{disasterType}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
        <span className="text-2xl">👥</span>
        <div>
          <p className="text-xs text-zinc-500">Estimated People at Risk</p>
          <p className="text-2xl font-bold text-white">~{peopleAtRisk.toLocaleString()}</p>
        </div>
      </div>
    </motion.div>
  );
}
