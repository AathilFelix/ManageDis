"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { RealDisaster } from "@/lib/real-data";
import { TYPE_CONFIG } from "@/lib/real-data";
import type { AnalysisResult, AgentState, CommanderResult, DecisionLogEntry } from "@/lib/types";
import ActionPlan from "@/components/action-plan";
import SeverityBadge from "@/components/severity-badge";
import SpeedComparison from "@/components/speed-comparison";
import DecisionLog from "@/components/decision-log";
import AlertBroadcast from "@/components/alert-broadcast";

const WorldMapLive = dynamic(() => import("@/components/world-map-live"), { ssr: false });
const MapView = dynamic(() => import("@/components/map-view"), { ssr: false });

const REFRESH_INTERVAL = 30_000;

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function timeNow() {
  return new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const INITIAL_AGENTS: AgentState[] = [
  { name: "vision", icon: "👁️", status: "waiting", elapsed: 0 },
  { name: "risk", icon: "⚠️", status: "waiting", elapsed: 0 },
  { name: "resource", icon: "🚑", status: "waiting", elapsed: 0 },
  { name: "route", icon: "🗺️", status: "waiting", elapsed: 0 },
  { name: "commander", icon: "🎖️", status: "waiting", elapsed: 0 },
];

interface NewsArticle {
  id: string;
  title: string;
  source: string;
  link: string;
  timestamp: number;
  snippet: string;
}

interface IntelReport {
  id: string;
  source: string;
  title: string;
  text: string;
  timestamp: number;
  type: "situation" | "response" | "alert" | "media";
  url?: string;
}

interface SocialPost {
  id: string;
  platform: "mastodon" | "bluesky" | "reddit";
  author: string;
  handle: string;
  text: string;
  timestamp: number;
  url: string;
  hashtags: string[];
  engagement: { likes: number; reposts: number; replies: number };
  sentiment?: "urgent" | "informational" | "plea" | "positive";
  language?: string;
}

export default function Home() {
  const [disasters, setDisasters] = useState<RealDisaster[]>([]);
  const [selected, setSelected] = useState<RealDisaster | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const [filter, setFilter] = useState<string>("all");

  const [analyzing, setAnalyzing] = useState(false);
  const [agents, setAgents] = useState<AgentState[]>(INITIAL_AGENTS);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [totalElapsed, setTotalElapsed] = useState<number | null>(null);
  const [decisionLog, setDecisionLog] = useState<DecisionLogEntry[]>([]);
  const [planVersion, setPlanVersion] = useState(1);
  const [previousPlan, setPreviousPlan] = useState<CommanderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoUpdate, setAutoUpdate] = useState(true);

  const [news, setNews] = useState<NewsArticle[]>([]);
  const [intel, setIntel] = useState<IntelReport[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [socialLoading, setSocialLoading] = useState(false);
  const [sentimentCounts, setSentimentCounts] = useState<Record<string, number>>({ urgent: 0, informational: 0, plea: 0, positive: 0 });
  const [intelTab, setIntelTab] = useState<"intel" | "social" | "news">("intel");

  const [commandCenterOpen, setCommandCenterOpen] = useState(false);

  const autoUpdateRef = useRef(autoUpdate);
  autoUpdateRef.current = autoUpdate;
  const resultRef = useRef(result);
  resultRef.current = result;

  const addLog = useCallback((event: string, agent?: string) => {
    setDecisionLog((prev) => [...prev, { time: timeNow(), event, agent }]);
  }, []);

  const fetchDisasters = useCallback(async () => {
    try {
      const res = await fetch("/api/disasters");
      if (!res.ok) return;
      const data = await res.json();
      setDisasters(data.disasters);
      setLastRefresh(Date.now());

      if (autoUpdateRef.current && resultRef.current) {
        const critical = data.disasters.find(
          (d: RealDisaster) => d.severity === "critical" && Date.now() - d.timestamp < 3_600_000
        );
        if (critical) autoReanalyze(critical);
      }
    } catch { /* retry next cycle */ } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const autoReanalyze = useCallback(async (disaster: RealDisaster) => {
    if (!resultRef.current) return;
    setPreviousPlan({ ...resultRef.current.commander });
    addLog(`Auto-update: new intel — ${disaster.title}`, "commander");
    try {
      const res = await fetch("/api/reanalyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis: resultRef.current,
          newReports: [{ id: disaster.id, source: "usgs" as const, text: disaster.details, timestamp: disaster.timestamp, severity: "critical" as const, author: disaster.source }],
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setResult((prev) => prev ? { ...prev, commander: data.commander } : prev);
      setPlanVersion((v) => { addLog(`Plan auto-updated to v${v + 1}`, "commander"); return v + 1; });
    } catch { addLog("Auto-update failed", "system"); }
  }, [addLog]);

  useEffect(() => {
    fetchDisasters();
    const interval = setInterval(fetchDisasters, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchDisasters]);

  const fetchRealIntel = useCallback(async (disaster: RealDisaster) => {
    setNewsLoading(true);
    setSocialLoading(true);
    const typeKeyword = TYPE_CONFIG[disaster.type]?.label || disaster.type;
    const locationPart = disaster.title.split("—")[1]?.trim() || disaster.title.split("of")[1]?.trim() || "";
    const query = `${typeKeyword} ${locationPart}`.trim();

    const [newsRes, intelRes, socialRes] = await Promise.all([
      fetch(`/api/news?q=${encodeURIComponent(query)}`).then(r => r.ok ? r.json() : { articles: [] }).catch(() => ({ articles: [] })),
      fetch(`/api/intelligence?q=${encodeURIComponent(query)}&lat=${disaster.coordinates.lat}&lng=${disaster.coordinates.lng}`).then(r => r.ok ? r.json() : { reports: [] }).catch(() => ({ reports: [] })),
      fetch(`/api/social?q=${encodeURIComponent(query)}`).then(r => r.ok ? r.json() : { posts: [], sentimentCounts: {} }).catch(() => ({ posts: [], sentimentCounts: {} })),
    ]);

    setNews(newsRes.articles || []);
    setIntel(intelRes.reports || []);
    setSocialPosts(socialRes.posts || []);
    setSentimentCounts(socialRes.sentimentCounts || { urgent: 0, informational: 0, plea: 0, positive: 0 });
    setNewsLoading(false);
    setSocialLoading(false);
  }, []);

  useEffect(() => {
    if (selected) fetchRealIntel(selected);
    else { setNews([]); setIntel([]); setSocialPosts([]); }
  }, [selected, fetchRealIntel]);

  const handleSelect = useCallback((d: RealDisaster) => {
    setSelected(d);
    setResult(null);
    setAgents(INITIAL_AGENTS.map(a => ({ ...a })));
    setError(null);
    setCommandCenterOpen(false);
    setDecisionLog([]);
    setPlanVersion(1);
    setPreviousPlan(null);
    setTotalElapsed(null);
  }, []);

  const handleAnalyze = useCallback(async (disaster: RealDisaster) => {
    setAnalyzing(true);
    setResult(null);
    setError(null);
    setTotalElapsed(null);
    setPlanVersion(1);
    setPreviousPlan(null);
    setDecisionLog([]);
    setAgents(INITIAL_AGENTS.map(a => ({ ...a })));
    addLog(`Deploying agents for: ${disaster.title}`, "system");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: "",
          location: `${disaster.coordinates.lat}, ${disaster.coordinates.lng}`,
          situation: `${disaster.title}. ${disaster.details}. Location context: ${disaster.title.split("—")[1]?.trim() || ""}`,
        }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");
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
            const event = JSON.parse(line.slice(6));
            if (event.event === "agent-start") {
              setAgents((prev) => prev.map(a => a.name === event.agent ? { ...a, status: "running" } : a));
              addLog(`${event.agent} agent started`, event.agent);
            }
            if (event.event === "agent-complete") {
              setAgents((prev) => prev.map(a =>
                a.name === event.agent ? { ...a, status: "complete", elapsed: event.elapsed, confidence: event.data?.confidence } : a
              ));
              addLog(`${event.agent} completed (${(event.elapsed / 1000).toFixed(2)}s)`, event.agent);
            }
            if (event.event === "agent-error") { setError(event.data?.message || "Agent error"); }
            if (event.event === "analysis-complete") {
              setResult(event.data as AnalysisResult);
              setTotalElapsed(event.elapsed);
              setCommandCenterOpen(true);
              addLog(`Analysis complete — ${(event.elapsed / 1000).toFixed(2)}s`, "system");
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Unknown error"); }
    finally { setAnalyzing(false); }
  }, [addLog]);

  const filtered = filter === "all" ? disasters : disasters.filter(d => d.type === filter);
  const typeCounts = disasters.reduce((acc, d) => { acc[d.type] = (acc[d.type] || 0) + 1; return acc; }, {} as Record<string, number>);
  const criticalCount = disasters.filter(d => d.severity === "critical").length;

  const intelTypeConfig: Record<string, { color: string; label: string }> = {
    alert: { color: "bg-red-500/20 text-red-400", label: "ALERT" },
    situation: { color: "bg-blue-500/20 text-blue-400", label: "SITREP" },
    response: { color: "bg-green-500/20 text-green-400", label: "RESPONSE" },
    media: { color: "bg-amber-500/20 text-amber-400", label: "MEDIA" },
  };

  // ── FULL COMMAND CENTER VIEW ──
  if (commandCenterOpen && result && selected) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        {/* Top bar */}
        <div className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setCommandCenterOpen(false)} className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">← Back to Monitor</button>
              <div className="h-4 w-px bg-zinc-700" />
              <h1 className="text-sm font-bold"><span className="text-red-500">COMMAND CENTER</span> — {selected.title}</h1>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative rounded-full h-2 w-2 bg-green-500" /></span>
                <span className="text-[10px] text-green-400">LIVE</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              {planVersion > 1 && <span className="text-amber-400 font-bold">Plan v{planVersion}</span>}
              <button onClick={() => setAutoUpdate(!autoUpdate)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors ${autoUpdate ? "border-green-600/50 bg-green-600/10 text-green-400" : "border-zinc-700 text-zinc-500"}`}>
                {autoUpdate ? "⚡ Auto-Update ON" : "Auto-Update OFF"}
              </button>
              <span>Sources: USGS · NASA · GDACS · ReliefWeb</span>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="border-b border-zinc-800 bg-zinc-900/50">
          <div className="px-4 py-1.5 flex items-center gap-4 overflow-x-auto text-xs">
            <div className="flex items-center gap-1.5"><span className="text-lg font-black text-red-400 font-mono">{TYPE_CONFIG[selected.type].icon}</span><span className="font-bold text-white">{TYPE_CONFIG[selected.type].label}</span></div>
            <div className="w-px h-5 bg-zinc-800" />
            <div><span className="text-zinc-500">Severity:</span> <span className={`font-bold ${selected.severity === "critical" ? "text-red-400" : selected.severity === "high" ? "text-orange-400" : "text-yellow-400"}`}>{selected.severity.toUpperCase()}</span></div>
            <div className="w-px h-5 bg-zinc-800" />
            <div><span className="text-zinc-500">People at Risk:</span> <span className="font-bold text-amber-400 font-mono">{result.vision.estimatedPeopleAtRisk.toLocaleString()}</span></div>
            <div className="w-px h-5 bg-zinc-800" />
            <div><span className="text-zinc-500">Response Time:</span> <span className="font-bold text-green-400 font-mono">{totalElapsed ? (totalElapsed / 1000).toFixed(2) + "s" : "—"}</span></div>
            <div className="w-px h-5 bg-zinc-800" />
            <div><span className="text-zinc-500">Agents:</span> <span className="font-bold text-purple-400">{agents.filter(a => a.status === "complete").length}/5</span></div>
            <div className="w-px h-5 bg-zinc-800" />
            <div><span className="text-zinc-500">Intel Sources:</span> <span className="font-bold text-blue-400">{news.length + intel.length}</span></div>
            <div className="w-px h-5 bg-zinc-800" />
            <div><span className="text-zinc-500">Confidence:</span> <span className="font-bold text-green-400">{result.commander.confidence ?? 85}%</span></div>
          </div>
        </div>

        {/* Main: 2-column */}
        <div className="flex h-[calc(100vh-82px)]">
          {/* LEFT: Dashboard */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {totalElapsed && <SpeedComparison elapsed={totalElapsed} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <SeverityBadge severity={result.vision.severity} disasterType={result.vision.disasterType} peopleAtRisk={result.vision.estimatedPeopleAtRisk} />
              </div>
              <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 space-y-3">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Agent Confidence</p>
                {agents.filter(a => a.status === "complete").map(a => (
                  <div key={a.name} className="flex items-center gap-2">
                    <span className="text-sm">{a.icon}</span>
                    <span className="text-xs text-zinc-400 capitalize flex-1">{a.name}</span>
                    <span className="text-xs font-mono text-zinc-300">{a.confidence ?? 85}%</span>
                    <span className="text-[10px] text-zinc-600 font-mono">{(a.elapsed / 1000).toFixed(2)}s</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Observations */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Key Observations</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {result.vision.keyObservations.slice(0, 6).map((obs, i) => (
                  <li key={i} className="text-sm text-zinc-300 flex items-start gap-2"><span className="text-zinc-600 mt-0.5">•</span>{obs}</li>
                ))}
              </ul>
            </div>

            {/* Operations Map */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                Operations Map
                <span className="ml-2 text-xs text-zinc-600 normal-case">🟢 Safe Zones · 🔵 Staging · 🔴 Blocked · — Routes</span>
              </h3>
              <MapView routes={result.routes} />
            </div>

            <ActionPlan commander={result.commander} resources={result.resources} risk={result.risk} />
            <AlertBroadcast severity={result.vision.severity} />
            <DecisionLog entries={decisionLog} />
          </div>

          {/* RIGHT: Live Intelligence Feed */}
          <div className="w-[380px] border-l border-zinc-800 flex flex-col bg-zinc-900/30 overflow-hidden flex-shrink-0">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-75" /><span className="relative rounded-full h-2 w-2 bg-red-500" /></span>
                <h2 className="text-xs font-bold uppercase tracking-wider">Live Intelligence</h2>
              </div>
              <span className="text-[10px] text-zinc-500">{news.length + intel.length + socialPosts.length} sources</span>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-800 flex-shrink-0">
              {([
                { key: "intel" as const, label: "Reports", count: intel.length },
                { key: "social" as const, label: "Social", count: socialPosts.length },
                { key: "news" as const, label: "News", count: news.length },
              ]).map(tab => (
                <button key={tab.key} onClick={() => setIntelTab(tab.key)}
                  className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-colors relative ${
                    intelTab === tab.key ? "text-white" : "text-zinc-600 hover:text-zinc-400"
                  }`}>
                  {tab.label} {tab.count > 0 && <span className={`ml-0.5 px-1 py-0.5 rounded text-[8px] ${intelTab === tab.key ? "bg-red-500/30 text-red-300" : "bg-zinc-800 text-zinc-500"}`}>{tab.count}</span>}
                  {intelTab === tab.key && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-red-500 rounded-full" />}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {intelTab === "intel" && intel.map(r => (
                <div key={r.id} className="px-4 py-3 border-b border-zinc-800/30 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${intelTypeConfig[r.type]?.color || "bg-zinc-700 text-zinc-400"}`}>{intelTypeConfig[r.type]?.label || "INTEL"}</span>
                    <span className="text-[10px] text-zinc-400">{r.source}</span>
                    <span className="text-[10px] text-zinc-600">{timeAgo(r.timestamp)}</span>
                  </div>
                  <p className="text-xs font-medium text-zinc-200">{r.title}</p>
                  {r.text && <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-3">{r.text}</p>}
                  {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300">Read full report →</a>}
                </div>
              ))}
              {intelTab === "intel" && intel.length === 0 && !newsLoading && (
                <div className="px-4 py-8 text-center text-zinc-600 text-xs">No intelligence reports</div>
              )}

              {intelTab === "social" && (
                <>
                  {socialPosts.length > 0 && (
                    <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
                      <p className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">Sentiment</p>
                      <div className="flex gap-2">
                        {[
                          { key: "urgent", color: "text-red-400", icon: "🔴" },
                          { key: "plea", color: "text-amber-400", icon: "🟡" },
                          { key: "informational", color: "text-blue-400", icon: "🔵" },
                          { key: "positive", color: "text-green-400", icon: "🟢" },
                        ].map(s => (
                          <div key={s.key} className="flex items-center gap-0.5">
                            <span className="text-[9px]">{s.icon}</span>
                            <span className={`text-[9px] font-mono font-bold ${s.color}`}>{sentimentCounts[s.key] || 0}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {socialPosts.map(post => {
                    const pc = { mastodon: { icon: "🐘", color: "text-purple-400" }, bluesky: { icon: "🦋", color: "text-blue-400" }, reddit: { icon: "🔶", color: "text-orange-400" } }[post.platform];
                    const sc = post.sentiment ? { urgent: "bg-red-500/20 text-red-400", plea: "bg-amber-500/20 text-amber-400", informational: "bg-blue-500/20 text-blue-400", positive: "bg-green-500/20 text-green-400" }[post.sentiment] : null;
                    return (
                      <a key={post.id} href={post.url} target="_blank" rel="noopener noreferrer"
                        className="block px-4 py-2.5 border-b border-zinc-800/30 hover:bg-zinc-800/30 transition-colors space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px]">{pc.icon}</span>
                          <span className={`text-[10px] font-medium ${pc.color}`}>{post.author}</span>
                          <span className="text-[9px] text-zinc-600">{post.handle}</span>
                          <span className="flex-1" />
                          {sc && <span className={`text-[7px] font-bold uppercase px-1 py-0.5 rounded ${sc}`}>{post.sentiment}</span>}
                          <span className="text-[9px] text-zinc-600">{timeAgo(post.timestamp)}</span>
                        </div>
                        <p className="text-[11px] text-zinc-200 leading-relaxed line-clamp-3">{post.text}</p>
                        <div className="flex items-center gap-2 text-[9px] text-zinc-600">
                          <span>♥ {post.engagement.likes}</span>
                          <span>⟲ {post.engagement.reposts}</span>
                          <span>💬 {post.engagement.replies}</span>
                        </div>
                      </a>
                    );
                  })}
                  {socialPosts.length === 0 && !socialLoading && (
                    <div className="px-4 py-8 text-center text-zinc-600 text-xs">No social posts found</div>
                  )}
                </>
              )}

              {intelTab === "news" && news.map(a => (
                <a key={a.id} href={a.link} target="_blank" rel="noopener noreferrer" className="block px-4 py-3 border-b border-zinc-800/30 hover:bg-zinc-800/30 transition-colors space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-zinc-400">{a.source}</span>
                    <span className="text-[10px] text-zinc-600">{timeAgo(a.timestamp)}</span>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed">{a.title}</p>
                  {a.snippet && <p className="text-[10px] text-zinc-500 line-clamp-2">{a.snippet}</p>}
                </a>
              ))}
              {intelTab === "news" && news.length === 0 && !newsLoading && (
                <div className="px-4 py-8 text-center text-zinc-600 text-xs">No news articles found</div>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── MONITOR VIEW (HOMEPAGE) ──
  return (
    <main className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm z-50 flex-shrink-0">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-bold"><span className="text-red-500">AI EMERGENCY COMMANDER</span></h1>
            <div className="h-4 w-px bg-zinc-700" />
            <span className="text-xs text-zinc-400">Live Global Disaster Monitor</span>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative rounded-full h-2 w-2 bg-green-500" /></span>
              <span className="text-[10px] text-green-400">LIVE</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <Link href="/report" className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-red-600/30 bg-red-600/10 text-red-400 hover:bg-red-600/20 transition-colors">
              🆘 SOS Report
            </Link>
            <button onClick={() => setAutoUpdate(!autoUpdate)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors ${autoUpdate ? "border-green-600/50 bg-green-600/10 text-green-400" : "border-zinc-700 text-zinc-500"}`}>
              {autoUpdate ? "⚡ Auto-Update ON" : "Auto-Update OFF"}
            </button>
            <span className="hidden md:inline">Every {REFRESH_INTERVAL / 1000}s</span>
            <span className="hidden md:inline text-zinc-600">|</span>
            <span className="hidden md:inline">{timeAgo(lastRefresh)}</span>
            <span className="hidden lg:inline text-zinc-600">|</span>
            <span className="hidden lg:inline">USGS · NASA · GDACS · ReliefWeb · Google News</span>
          </div>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 flex-shrink-0">
        <div className="px-4 py-1.5 flex items-center gap-4 overflow-x-auto">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-lg font-black text-white font-mono">{disasters.length}</span>
            <span className="text-[10px] text-zinc-500 uppercase">Events</span>
          </div>
          <div className="w-px h-5 bg-zinc-800" />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-lg font-black text-red-400 font-mono">{criticalCount}</span>
            <span className="text-[10px] text-zinc-500 uppercase">Critical</span>
          </div>
          <div className="w-px h-5 bg-zinc-800" />
          {Object.entries(typeCounts).map(([type, count]) => {
            const config = TYPE_CONFIG[type as RealDisaster["type"]];
            if (!config) return null;
            return (
              <button key={type} onClick={() => setFilter(filter === type ? "all" : type)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors flex-shrink-0 ${
                  filter === type ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-zinc-200"
                }`}>
                <span>{config.icon}</span><span className="font-mono">{count}</span>
              </button>
            );
          })}
          {filter !== "all" && <button onClick={() => setFilter("all")} className="text-[10px] text-zinc-500 hover:text-zinc-300 underline flex-shrink-0">Clear</button>}
        </div>
      </div>

      {/* 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Event list */}
        <div className="w-72 border-r border-zinc-800 flex flex-col bg-zinc-900/30 overflow-hidden flex-shrink-0">
          <div className="px-3 py-2 border-b border-zinc-800">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Active Events ({filtered.length})</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && <div className="flex items-center justify-center py-12"><div className="w-5 h-5 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" /></div>}
            {filtered.map(d => {
              const config = TYPE_CONFIG[d.type];
              const isActive = selected?.id === d.id;
              return (
                <button key={d.id} onClick={() => handleSelect(d)}
                  className={`w-full text-left px-3 py-2.5 border-b border-zinc-800/30 transition-colors ${isActive ? "bg-zinc-800/80 border-l-2 border-l-red-500" : "hover:bg-zinc-800/30"}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-sm mt-0.5">{config.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-200 truncate">{d.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${d.severity === "critical" ? "bg-red-500" : d.severity === "high" ? "bg-orange-500" : d.severity === "medium" ? "bg-yellow-500" : "bg-green-500"}`} />
                        <span className="text-[9px] text-zinc-600">{d.source} · {timeAgo(d.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CENTER: Map */}
        <div className="flex-1 min-w-0 relative">
          <div className="absolute inset-0">
            {!loading && <WorldMapLive disasters={filtered} selected={selected} onSelect={handleSelect} />}
          </div>
        </div>

        {/* RIGHT: Intel Panel */}
        <div className="w-[400px] border-l border-zinc-800 flex flex-col bg-zinc-900/50 overflow-hidden flex-shrink-0">
          {selected ? (
            <>
              {/* Header */}
              <div className="px-4 py-3 border-b border-zinc-800 flex-shrink-0">
                <div className="flex items-start gap-2.5">
                  <span className="text-2xl">{TYPE_CONFIG[selected.type].icon}</span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-bold leading-tight">{selected.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        selected.severity === "critical" ? "bg-red-500/20 text-red-400" :
                        selected.severity === "high" ? "bg-orange-500/20 text-orange-400" :
                        selected.severity === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-green-500/20 text-green-400"
                      }`}>{selected.severity}</span>
                      <span className="text-[10px] text-zinc-500">{selected.source} · {timeAgo(selected.timestamp)}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{selected.details}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-zinc-600 font-mono">📍 {selected.coordinates.lat.toFixed(4)}, {selected.coordinates.lng.toFixed(4)}</span>
                  {selected.link && <a href={selected.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300">Source →</a>}
                </div>
              </div>

              {/* Deploy Button */}
              <div className="px-4 py-3 border-b border-zinc-800 flex-shrink-0">
                <button onClick={() => handleAnalyze(selected)} disabled={analyzing}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${
                    analyzing ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" : "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white"
                  }`}>
                  {analyzing ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Agents Working...</span> : "🚨 Deploy AI Agents"}
                </button>
                {analyzing && (
                  <div className="mt-3 space-y-1.5">
                    {agents.map(a => (
                      <div key={a.name} className="flex items-center gap-2 py-0.5">
                        <span className="text-sm">{a.icon}</span>
                        <span className="text-[10px] text-zinc-400 capitalize flex-1">{a.name}</span>
                        {a.status === "waiting" && <span className="text-[9px] text-zinc-700">Waiting</span>}
                        {a.status === "running" && <span className="flex items-center gap-1"><span className="w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" /><span className="text-[9px] text-blue-400">Running</span></span>}
                        {a.status === "complete" && <span className="text-[10px] text-green-400">✓ {(a.elapsed / 1000).toFixed(2)}s</span>}
                        {a.status === "error" && <span className="text-[9px] text-red-400">Error</span>}
                      </div>
                    ))}
                  </div>
                )}
                {error && <div className="mt-2 bg-red-950/50 border border-red-800 rounded-lg p-2 text-[10px] text-red-300">{error}</div>}
              </div>

              {/* Tab Bar */}
              <div className="flex border-b border-zinc-800 flex-shrink-0">
                {([
                  { key: "intel" as const, label: "Intelligence", count: intel.length },
                  { key: "social" as const, label: "Social", count: socialPosts.length },
                  { key: "news" as const, label: "News", count: news.length },
                ]).map(tab => (
                  <button key={tab.key} onClick={() => setIntelTab(tab.key)}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors relative ${
                      intelTab === tab.key ? "text-white" : "text-zinc-600 hover:text-zinc-400"
                    }`}>
                    {tab.label} {tab.count > 0 && <span className={`ml-1 px-1 py-0.5 rounded text-[8px] ${intelTab === tab.key ? "bg-red-500/30 text-red-300" : "bg-zinc-800 text-zinc-500"}`}>{tab.count}</span>}
                    {intelTab === tab.key && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-red-500 rounded-full" />}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto">
                {(newsLoading || socialLoading) && <div className="flex items-center justify-center py-8"><span className="w-5 h-5 border-2 border-zinc-700 border-t-blue-400 rounded-full animate-spin" /></div>}

                {intelTab === "intel" && !newsLoading && (
                  <>
                    {intel.map(r => (
                      <div key={r.id} className="px-4 py-2.5 border-b border-zinc-800/30 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${intelTypeConfig[r.type]?.color || "bg-zinc-700 text-zinc-400"}`}>{intelTypeConfig[r.type]?.label || "INTEL"}</span>
                          <span className="text-[10px] text-zinc-400">{r.source}</span>
                          <span className="text-[10px] text-zinc-600">{timeAgo(r.timestamp)}</span>
                        </div>
                        <p className="text-[11px] font-medium text-zinc-200">{r.title}</p>
                        {r.text && <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2">{r.text}</p>}
                        {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-blue-400 hover:text-blue-300">Full report →</a>}
                      </div>
                    ))}
                    {intel.length === 0 && <div className="px-4 py-8 text-center text-zinc-600 text-xs">No intelligence reports found</div>}
                  </>
                )}

                {intelTab === "social" && !socialLoading && (
                  <>
                    {socialPosts.length > 0 && (
                      <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/50">
                        <p className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1.5">Sentiment Analysis</p>
                        <div className="flex gap-3">
                          {[
                            { key: "urgent", color: "text-red-400", icon: "🔴" },
                            { key: "plea", color: "text-amber-400", icon: "🟡" },
                            { key: "informational", color: "text-blue-400", icon: "🔵" },
                            { key: "positive", color: "text-green-400", icon: "🟢" },
                          ].map(s => (
                            <div key={s.key} className="flex items-center gap-1">
                              <span className="text-[10px]">{s.icon}</span>
                              <span className={`text-[10px] font-mono font-bold ${s.color}`}>{sentimentCounts[s.key] || 0}</span>
                              <span className="text-[9px] text-zinc-600 capitalize">{s.key}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {socialPosts.map(post => {
                      const platformConfig = {
                        mastodon: { icon: "🐘", color: "text-purple-400", label: "Mastodon" },
                        bluesky: { icon: "🦋", color: "text-blue-400", label: "Bluesky" },
                        reddit: { icon: "🔶", color: "text-orange-400", label: "Reddit" },
                      };
                      const pc = platformConfig[post.platform];
                      const sentimentConfig = {
                        urgent: { color: "bg-red-500/20 text-red-400", label: "URGENT" },
                        plea: { color: "bg-amber-500/20 text-amber-400", label: "PLEA" },
                        informational: { color: "bg-blue-500/20 text-blue-400", label: "INFO" },
                        positive: { color: "bg-green-500/20 text-green-400", label: "POSITIVE" },
                      };
                      const sc = post.sentiment ? sentimentConfig[post.sentiment] : null;

                      return (
                        <a key={post.id} href={post.url} target="_blank" rel="noopener noreferrer"
                          className="block px-4 py-2.5 border-b border-zinc-800/30 hover:bg-zinc-800/30 transition-colors space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs">{pc.icon}</span>
                            <span className={`text-[10px] font-medium ${pc.color}`}>{post.author}</span>
                            <span className="text-[9px] text-zinc-600">{post.handle}</span>
                            <span className="flex-1" />
                            {sc && <span className={`text-[8px] font-bold uppercase px-1 py-0.5 rounded ${sc.color}`}>{sc.label}</span>}
                            <span className="text-[9px] text-zinc-600">{timeAgo(post.timestamp)}</span>
                          </div>
                          <p className="text-[11px] text-zinc-200 leading-relaxed">{post.text}</p>
                          <div className="flex items-center gap-3 text-[9px] text-zinc-600">
                            <span>♥ {post.engagement.likes}</span>
                            <span>⟲ {post.engagement.reposts}</span>
                            <span>💬 {post.engagement.replies}</span>
                            {post.hashtags.length > 0 && (
                              <span className="text-blue-400/60">{post.hashtags.slice(0, 3).join(" ")}</span>
                            )}
                          </div>
                        </a>
                      );
                    })}
                    {socialPosts.length === 0 && <div className="px-4 py-8 text-center text-zinc-600 text-xs">No social media posts found for this event</div>}
                  </>
                )}

                {intelTab === "news" && !newsLoading && (
                  <>
                    {news.map(a => (
                      <a key={a.id} href={a.link} target="_blank" rel="noopener noreferrer" className="block px-4 py-2.5 border-b border-zinc-800/30 hover:bg-zinc-800/30 transition-colors space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium text-zinc-400">{a.source}</span>
                          <span className="text-[10px] text-zinc-600">{timeAgo(a.timestamp)}</span>
                        </div>
                        <p className="text-[11px] text-zinc-200 leading-relaxed">{a.title}</p>
                        {a.snippet && <p className="text-[10px] text-zinc-500 line-clamp-2">{a.snippet}</p>}
                      </a>
                    ))}
                    {news.length === 0 && <div className="px-4 py-8 text-center text-zinc-600 text-xs">No news articles found</div>}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div className="space-y-3">
                <p className="text-4xl">🌍</p>
                <p className="text-sm font-medium text-zinc-300">Select a disaster event</p>
                <p className="text-[10px] text-zinc-600 max-w-[200px]">Click any event from the list or map to view real intelligence and deploy AI agents</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
