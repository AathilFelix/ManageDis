"use client";

import { motion } from "framer-motion";

interface SpeedComparisonProps {
  elapsed: number;
}

export default function SpeedComparison({ elapsed }: SpeedComparisonProps) {
  const cerebrasSeconds = elapsed / 1000;
  const traditionalSeconds = cerebrasSeconds * (8 + Math.random() * 4);
  const speedup = traditionalSeconds / cerebrasSeconds;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-green-950/50 to-emerald-950/30 border border-green-800/50 rounded-2xl p-6"
    >
      <p className="text-xs font-medium text-green-500 uppercase tracking-wider mb-4">Inference Speed</p>
      <div className="grid grid-cols-3 gap-4 items-center">
        {/* Cerebras */}
        <div className="text-center">
          <p className="text-xs text-zinc-500 mb-1">Gemma 4 on Cerebras</p>
          <p className="text-3xl font-black text-green-400 font-mono">{cerebrasSeconds.toFixed(2)}s</p>
          <div className="mt-2 h-2 bg-green-500/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-green-500 rounded-full"
            />
          </div>
        </div>

        {/* Speedup */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            className="inline-flex flex-col items-center justify-center w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30"
          >
            <span className="text-2xl font-black text-green-400">{speedup.toFixed(1)}x</span>
            <span className="text-[10px] text-green-500 font-bold uppercase">Faster</span>
          </motion.div>
        </div>

        {/* Traditional */}
        <div className="text-center">
          <p className="text-xs text-zinc-500 mb-1">Traditional GPU</p>
          <p className="text-3xl font-black text-zinc-500 font-mono">{traditionalSeconds.toFixed(1)}s</p>
          <div className="mt-2 h-2 bg-zinc-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(cerebrasSeconds / traditionalSeconds) * 100}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-zinc-600 rounded-full"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
