import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

export type NewsItem = { title: string; link: string; pubDate: string; image: string | null; source: string };

export function NewsHero({ accentColor, borderColor, cardBg, height = 200, category = "all", labelOverride, testIdSuffix }: {
  accentColor: string;
  borderColor: string;
  cardBg: string;
  height?: number;
  category?: "all" | "news" | "markets" | "investing" | "personal-finance";
  labelOverride?: string;
  testIdSuffix?: string;
}) {
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    fetch(`/api/news/feed?category=${encodeURIComponent(category)}`)
      .then(r => r.json())
      .then(d => setArticles(d.items || []))
      .catch(() => {});
  }, [category]);

  useEffect(() => {
    if (articles.length < 2) return;
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % articles.length);
        setVisible(true);
      }, 500);
    }, 6000);
    return () => clearInterval(timer);
  }, [articles.length]);

  if (articles.length === 0) return null;
  const art = articles[idx];
  const hasImage = !!art.image;

  return (
    <a
      href={art.link} target="_blank" rel="noopener noreferrer"
      className="block relative w-full overflow-hidden rounded-2xl"
      style={{
        height,
        border: `1px solid ${borderColor}`,
        backgroundColor: cardBg,
        boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
      }}
      data-testid={testIdSuffix ? `section-news-hero-${testIdSuffix}` : "section-news-hero"}
    >
      <div
        className="absolute inset-0 transition-opacity duration-500 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          backgroundImage: hasImage ? `url(${art.image})` : `linear-gradient(135deg, ${accentColor}, ${accentColor}aa)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.85) 100%)",
        }}
      />
      <div className="relative z-10 h-full flex flex-col justify-between p-4 transition-opacity duration-500 ease-out" style={{ opacity: visible ? 1 : 0 }}>
        <div className="flex items-center justify-between">
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
            data-testid="badge-news-source"
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white">{labelOverride ? labelOverride : `${art.source} · Live`}</span>
          </div>
          <div className="flex gap-1">
            {articles.slice(0, Math.min(articles.length, 5)).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full transition-all"
                style={{ backgroundColor: i === idx ? "#fff" : "rgba(255,255,255,0.4)" }} />
            ))}
          </div>
        </div>
        <div>
          <p
            className="text-base font-bold leading-snug text-white line-clamp-3"
            style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}
            data-testid="text-news-headline"
          >
            {art.title}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <ExternalLink className="h-3 w-3 flex-shrink-0 text-white/85" />
            <span className="text-xs font-medium text-white/85">Read full article</span>
          </div>
        </div>
      </div>
    </a>
  );
}
