export type FeedSource = "twitter" | "news" | "whatsapp" | "ndma" | "usgs" | "reliefweb";

export interface FeedItem {
  id: string;
  source: FeedSource;
  text: string;
  timestamp: number;
  severity: "info" | "warning" | "critical";
  author?: string;
  coordinates?: { lat: number; lng: number };
  language?: string;
  originalText?: string;
}

export const SOURCE_CONFIG: Record<FeedSource, { icon: string; label: string; color: string }> = {
  twitter: { icon: "🐦", label: "X/Twitter", color: "text-blue-400" },
  news: { icon: "📰", label: "News", color: "text-amber-400" },
  whatsapp: { icon: "📱", label: "WhatsApp", color: "text-green-400" },
  ndma: { icon: "🏛️", label: "NDMA", color: "text-purple-400" },
  usgs: { icon: "🌍", label: "USGS", color: "text-cyan-400" },
  reliefweb: { icon: "🔴", label: "ReliefWeb", color: "text-red-400" },
};
