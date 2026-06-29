"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface AlertChannel {
  icon: string;
  channel: string;
  target: string;
  count: number;
  status: "queued" | "sending" | "sent";
  color: string;
}

const CHANNELS: Omit<AlertChannel, "status">[] = [
  { icon: "📱", channel: "SMS Alert", target: "Residents in affected zones", count: 2500, color: "text-blue-400" },
  { icon: "💬", channel: "WhatsApp Broadcast", target: "Community groups & volunteers", count: 48, color: "text-green-400" },
  { icon: "📻", channel: "Emergency Radio", target: "Local FM stations", count: 3, color: "text-amber-400" },
  { icon: "📧", channel: "Email Alert", target: "Government officials & NGOs", count: 120, color: "text-purple-400" },
  { icon: "🔊", channel: "Public PA System", target: "Sirens in affected area", count: 12, color: "text-red-400" },
];

export default function AlertBroadcast({ severity }: { severity: string }) {
  const [channels, setChannels] = useState<AlertChannel[]>(
    CHANNELS.map((c) => ({ ...c, status: "queued" as const }))
  );

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    channels.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setChannels((prev) =>
            prev.map((c, j) => (j === i ? { ...c, status: "sending" } : c))
          );
        }, i * 800 + 500)
      );
      timers.push(
        setTimeout(() => {
          setChannels((prev) =>
            prev.map((c, j) => (j === i ? { ...c, status: "sent" } : c))
          );
        }, i * 800 + 1500)
      );
    });
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sentCount = channels.filter((c) => c.status === "sent").length;
  const totalReached = channels
    .filter((c) => c.status === "sent")
    .reduce((sum, c) => sum + c.count, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Alert Broadcasting</p>
          <p className="text-lg font-bold text-white mt-1">Outgoing Emergency Alerts</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-amber-400 font-mono">{sentCount}/{channels.length}</p>
          <p className="text-[10px] text-zinc-500 uppercase">Channels Active</p>
        </div>
      </div>

      <div className="space-y-2">
        {channels.map((ch, i) => (
          <motion.div
            key={ch.channel}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 bg-zinc-800/50 rounded-xl px-4 py-3"
          >
            <span className="text-lg">{ch.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${ch.color}`}>{ch.channel}</p>
              <p className="text-xs text-zinc-500 truncate">{ch.target}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-xs text-zinc-400 font-mono">{ch.count.toLocaleString()}</span>
              {ch.status === "queued" && (
                <span className="text-xs text-zinc-600 w-16 text-center">Queued</span>
              )}
              {ch.status === "sending" && (
                <span className="flex items-center gap-1 w-16 justify-center">
                  <span className="w-3 h-3 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                  <span className="text-xs text-amber-400">Sending</span>
                </span>
              )}
              {ch.status === "sent" && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1 w-16 justify-center"
                >
                  <span className="text-green-400 text-sm">✓</span>
                  <span className="text-xs text-green-400">Sent</span>
                </motion.span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {sentCount === channels.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between bg-green-950/30 border border-green-800/30 rounded-xl px-4 py-3"
        >
          <p className="text-sm text-green-400">
            All channels broadcast complete
          </p>
          <p className="text-sm font-bold text-green-300 font-mono">
            {totalReached.toLocaleString()} reached
          </p>
        </motion.div>
      )}

      <p className="text-[10px] text-zinc-600 text-center">
        Severity: {severity.toUpperCase()} — Alerts auto-dispatched by Commander Agent
      </p>
    </motion.div>
  );
}
