"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) => {
    if (suffix === "s") return v.toFixed(2) + "s";
    return Math.round(v).toLocaleString();
  });

  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.2, ease: "easeOut" });
    return () => controls.stop();
  }, [mv, value]);

  return <motion.span>{display}</motion.span>;
}

interface StatsBarProps {
  peopleAtRisk: number;
  resourcesDeployed: number;
  agentsComplete: number;
  totalAgents: number;
  responseTime: number | null;
  activeIncidents: number;
}

export default function StatsBar({
  peopleAtRisk,
  resourcesDeployed,
  agentsComplete,
  totalAgents,
  responseTime,
  activeIncidents,
}: StatsBarProps) {
  const stats = [
    { label: "Active Incidents", value: activeIncidents, icon: "🔴", color: "text-red-400" },
    { label: "People at Risk", value: peopleAtRisk, icon: "👥", color: "text-amber-400" },
    { label: "Resources Deployed", value: resourcesDeployed, icon: "🚑", color: "text-blue-400" },
    { label: "Agents", value: agentsComplete, icon: "🤖", color: "text-purple-400", suffix: `/${totalAgents}` },
    { label: "Response Time", value: responseTime ?? 0, icon: "⚡", color: "text-green-400", isTime: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 rounded-2xl px-4 py-3 print:hidden"
    >
      <div className="flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 mr-3 flex-shrink-0">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">LIVE OPS</span>
        </div>
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-2 px-3 border-l border-zinc-800 first:border-0 flex-shrink-0">
            <span className="text-sm">{stat.icon}</span>
            <div className="text-right">
              <p className={`text-sm font-bold font-mono ${stat.color}`}>
                {stat.isTime ? (
                  responseTime ? (
                    <AnimatedCounter value={responseTime / 1000} suffix="s" />
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )
                ) : (
                  <>
                    <AnimatedCounter value={stat.value} />
                    {stat.suffix && <span className="text-zinc-500 text-xs">{stat.suffix}</span>}
                  </>
                )}
              </p>
              <p className="text-[10px] text-zinc-500 whitespace-nowrap">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
