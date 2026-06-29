"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FeedItem } from "@/lib/feed-types";
import { SOURCE_CONFIG } from "@/lib/feed-types";

interface LiveFeedProps {
  disasterType: string;
  onReanalyze: (reports: FeedItem[]) => void;
  isReanalyzing: boolean;
  autoUpdate?: boolean;
}

export default function LiveFeed({ disasterType, onReanalyze, isReanalyzing, autoUpdate = false }: LiveFeedProps) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [unprocessed, setUnprocessed] = useState<FeedItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const autoTriggered = useRef(false);

  useEffect(() => {
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    async function startFeed() {
      try {
        const res = await fetch(`/api/feed?type=${encodeURIComponent(disasterType)}`, { signal });
        if (!res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const item = JSON.parse(line.slice(6)) as FeedItem;
              setItems((prev) => [item, ...prev]);
              setUnprocessed((prev) => [...prev, item]);
            } catch { /* skip */ }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }

    startFeed();
    return () => { abortRef.current?.abort(); };
  }, [disasterType]);

  useEffect(() => {
    if (autoUpdate && unprocessed.length >= 5 && !isReanalyzing && !autoTriggered.current) {
      autoTriggered.current = true;
      onReanalyze([...unprocessed]);
      setUnprocessed([]);
      setTimeout(() => { autoTriggered.current = false; }, 10000);
    }
  }, [autoUpdate, unprocessed, isReanalyzing, onReanalyze]);

  const handleReanalyze = useCallback(() => {
    onReanalyze([...unprocessed]);
    setUnprocessed([]);
  }, [unprocessed, onReanalyze]);

  const severityDot: Record<string, string> = {
    critical: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live Feed</h3>
        </div>
        {items.length > 0 && (
          <span className="text-xs text-zinc-500">{items.length} reports</span>
        )}
      </div>

      {/* Re-analyze button */}
      <AnimatePresence>
        {unprocessed.length >= 3 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-zinc-800 overflow-hidden"
          >
            <button
              onClick={handleReanalyze}
              disabled={isReanalyzing}
              className="w-full px-4 py-3 bg-gradient-to-r from-orange-600/20 to-red-600/20 hover:from-orange-600/30 hover:to-red-600/30 text-orange-400 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isReanalyzing ? (
                <>
                  <span className="w-4 h-4 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin" />
                  Commander Re-analyzing...
                </>
              ) : (
                <>
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    🔄
                  </motion.span>
                  Update Plan ({unprocessed.length} new reports)
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feed items */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[600px]">
        <AnimatePresence initial={false}>
          {items.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-zinc-600"
            >
              <div className="text-3xl mb-2">📡</div>
              <p className="text-sm">Monitoring incoming reports...</p>
            </motion.div>
          )}
          {items.map((item) => {
            const config = SOURCE_CONFIG[item.source];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="bg-zinc-800/70 border border-zinc-700/50 rounded-xl p-3 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{config.icon}</span>
                  <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                  {item.author && (
                    <span className="text-xs text-zinc-500">{item.author}</span>
                  )}
                  <div className="flex-1" />
                  <div className={`w-2 h-2 rounded-full ${severityDot[item.severity] || severityDot.info}`} />
                </div>
                {item.language && item.originalText && (
                  <div className="bg-zinc-900/80 rounded-lg px-2 py-1.5 border border-zinc-700/50">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-medium">
                        {item.language}
                      </span>
                      <span className="text-[10px] text-zinc-600">→ EN (auto-translated)</span>
                    </div>
                    <p className="text-xs text-zinc-500 italic leading-relaxed">{item.originalText}</p>
                  </div>
                )}
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {item.language && <span className="text-indigo-400 text-xs mr-1">[Translated]</span>}
                  {item.text}
                </p>
                <p className="text-[10px] text-zinc-600">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
