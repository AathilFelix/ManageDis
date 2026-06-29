import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface SocialPost {
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

function detectSentiment(text: string): SocialPost["sentiment"] {
  const lower = text.toLowerCase();
  const urgentWords = ["help", "urgent", "emergency", "trapped", "sos", "rescue", "dying", "stranded", "please help", "stuck", "danger", "critical", "mayday"];
  const pleaWords = ["need", "looking for", "missing", "anyone know", "praying", "please", "donation", "supplies", "volunteer", "where can"];
  const positiveWords = ["safe", "rescued", "thank", "grateful", "survived", "relief", "recovery", "rebuilding", "donation", "volunteer"];

  if (urgentWords.some(w => lower.includes(w))) return "urgent";
  if (pleaWords.some(w => lower.includes(w))) return "plea";
  if (positiveWords.some(w => lower.includes(w))) return "positive";
  return "informational";
}

function extractHashtags(text: string): string[] {
  return (text.match(/#[\wÀ-ɏ]+/g) || []).map(t => t.toLowerCase());
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "disaster";
  const posts: SocialPost[] = [];

  const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);
  const hashtags = keywords.slice(0, 2).map(k => k.replace(/[^a-z0-9]/gi, "")).filter(Boolean);

  // ── Mastodon public hashtag search (no auth) ──
  for (const tag of hashtags.slice(0, 2)) {
    try {
      const res = await fetch(`https://mastodon.social/api/v1/timelines/tag/${encodeURIComponent(tag)}?limit=10`, {
        cache: "no-store",
        headers: { "User-Agent": "ManageDis/1.0 (disaster-response-hackathon)" },
      });
      if (res.ok) {
        const items = await res.json();
        for (const item of items) {
          const plainText = (item.content || "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();
          if (!plainText) continue;
          posts.push({
            id: `masto-${item.id}`,
            platform: "mastodon",
            author: item.account?.display_name || item.account?.username || "Unknown",
            handle: `@${item.account?.acct || "unknown"}`,
            text: plainText.slice(0, 500),
            timestamp: new Date(item.created_at).getTime(),
            url: item.url || item.uri || "",
            hashtags: extractHashtags(plainText),
            engagement: {
              likes: item.favourites_count || 0,
              reposts: item.reblogs_count || 0,
              replies: item.replies_count || 0,
            },
            sentiment: detectSentiment(plainText),
            language: item.language || undefined,
          });
        }
      }
    } catch { /* continue */ }
  }

  // ── Bluesky public search (no auth) ──
  try {
    const bskyQuery = keywords.join(" ");
    const res = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(bskyQuery)}&limit=10&sort=latest`, {
      cache: "no-store",
      headers: { "User-Agent": "ManageDis/1.0" },
    });
    if (res.ok) {
      const data = await res.json();
      for (const item of data.posts || []) {
        const record = item.record || {};
        const text = record.text || "";
        if (!text) continue;
        posts.push({
          id: `bsky-${item.uri?.split("/").pop() || Math.random()}`,
          platform: "bluesky",
          author: item.author?.displayName || item.author?.handle || "Unknown",
          handle: `@${item.author?.handle || "unknown"}`,
          text: text.slice(0, 500),
          timestamp: new Date(record.createdAt || item.indexedAt).getTime(),
          url: item.uri ? `https://bsky.app/profile/${item.author?.handle}/post/${item.uri.split("/").pop()}` : "",
          hashtags: extractHashtags(text),
          engagement: {
            likes: item.likeCount || 0,
            reposts: item.repostCount || 0,
            replies: item.replyCount || 0,
          },
          sentiment: detectSentiment(text),
        });
      }
    }
  } catch { /* continue */ }

  // ── Reddit public search (no auth) ──
  try {
    const redditQuery = keywords.join("+");
    const res = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(redditQuery)}&sort=new&limit=10&t=week`, {
      cache: "no-store",
      headers: { "User-Agent": "ManageDis/1.0 (disaster-response-hackathon)" },
    });
    if (res.ok) {
      const data = await res.json();
      for (const child of data.data?.children || []) {
        const d = child.data;
        if (!d) continue;
        const text = d.title + (d.selftext ? ` — ${d.selftext.slice(0, 300)}` : "");
        posts.push({
          id: `reddit-${d.id}`,
          platform: "reddit",
          author: d.author || "Unknown",
          handle: `u/${d.author || "unknown"}`,
          text: text.slice(0, 500),
          timestamp: (d.created_utc || 0) * 1000,
          url: `https://reddit.com${d.permalink || ""}`,
          hashtags: extractHashtags(text),
          engagement: {
            likes: d.ups || 0,
            reposts: 0,
            replies: d.num_comments || 0,
          },
          sentiment: detectSentiment(text),
        });
      }
    }
  } catch { /* continue */ }

  posts.sort((a, b) => b.timestamp - a.timestamp);

  const sentimentCounts = { urgent: 0, informational: 0, plea: 0, positive: 0 };
  posts.forEach(p => { if (p.sentiment) sentimentCounts[p.sentiment]++; });

  return NextResponse.json({
    posts,
    sentimentCounts,
    platforms: { mastodon: posts.filter(p => p.platform === "mastodon").length, bluesky: posts.filter(p => p.platform === "bluesky").length, reddit: posts.filter(p => p.platform === "reddit").length },
    query,
    timestamp: Date.now(),
  });
}
