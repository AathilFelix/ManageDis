import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface NewsArticle {
  id: string;
  title: string;
  source: string;
  link: string;
  timestamp: number;
  snippet: string;
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "disaster";

  const articles: NewsArticle[] = [];

  // Google News RSS
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en&gl=US&ceid=US:en`;
    const res = await fetch(rssUrl, { cache: "no-store" });
    if (res.ok) {
      const xml = await res.text();
      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
      for (const item of items.slice(0, 10)) {
        const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1") || "";
        const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || item.match(/<link\/>([\s\S]*?)</)?.[1] || "";
        const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";
        const source = item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1") || "News";
        const description = item.match(/<description>([\s\S]*?)<\/description>/)?.[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1")?.replace(/<[^>]+>/g, "") || "";

        if (title) {
          articles.push({
            id: `gn-${articles.length}`,
            title: title.trim(),
            source: source.trim(),
            link: link.trim(),
            timestamp: pubDate ? new Date(pubDate).getTime() : Date.now(),
            snippet: description.trim().slice(0, 200),
          });
        }
      }
    }
  } catch { /* continue */ }

  // ReliefWeb headlines
  try {
    const rwUrl = `https://api.reliefweb.int/v1/reports?appname=managedis&query[value]=${encodeURIComponent(query)}&limit=5&sort[]=date:desc&fields[include][]=title&fields[include][]=source&fields[include][]=date&fields[include][]=url`;
    const res = await fetch(rwUrl, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      for (const item of data.data || []) {
        const f = item.fields || {};
        articles.push({
          id: `rw-${item.id}`,
          title: f.title || "ReliefWeb Report",
          source: f.source?.[0]?.name || "ReliefWeb",
          link: f.url || `https://reliefweb.int/node/${item.id}`,
          timestamp: f.date?.created ? new Date(f.date.created).getTime() : Date.now(),
          snippet: "",
        });
      }
    }
  } catch { /* continue */ }

  articles.sort((a, b) => b.timestamp - a.timestamp);

  return NextResponse.json({ articles, query, timestamp: Date.now() });
}
