import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type ForexResponse = {
  date: string | null;
  base: string;
  rates: { USD: number | null; EUR: number | null; GBP: number | null };
  stale?: boolean;
};

const REFRESH_MS = 60_000;

export function ForexWidget({ accentColor, borderColor, cardBg, textColor, mutedText }: {
  accentColor: string;
  borderColor: string;
  cardBg: string;
  textColor: string;
  mutedText: string;
}) {
  const [data, setData] = useState<ForexResponse | null>(null);
  const [prev, setPrev] = useState<ForexResponse["rates"] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const r = await fetch("/api/forex/rates");
        const d = await r.json() as ForexResponse;
        if (!mounted) return;
        setData(curr => {
          if (curr) setPrev(curr.rates);
          return d;
        });
      } catch {
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  if (loading && !data) return null;
  if (!data) return null;

  const pairs: Array<{ code: "USD" | "EUR" | "GBP"; flag: string }> = [
    { code: "USD", flag: "$" },
    { code: "EUR", flag: "€" },
    { code: "GBP", flag: "£" },
  ];

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
      data-testid="section-forex"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
          <h3 className="text-sm font-semibold" style={{ color: textColor }}>Live Exchange Rates</h3>
        </div>
        <span className="text-[10px] uppercase tracking-wider" style={{ color: mutedText }}>
          ZAR per 1 unit{data.stale ? " · cached" : ""}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {pairs.map(p => {
          const value = data.rates[p.code];
          const previous = prev?.[p.code];
          let trend: "up" | "down" | "flat" = "flat";
          if (value != null && previous != null && value !== previous) {
            trend = value > previous ? "up" : "down";
          }
          const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
          const trendColor = trend === "up" ? "#22c55e" : trend === "down" ? "#ef4444" : mutedText;
          return (
            <div
              key={p.code}
              className="rounded-xl p-3 text-center"
              style={{ backgroundColor: accentColor + "11", border: `1px solid ${accentColor}33` }}
              data-testid={`forex-${p.code.toLowerCase()}`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: mutedText }}>
                {p.flag} {p.code}/ZAR
              </div>
              <div className="text-lg font-bold leading-tight" style={{ color: textColor }} data-testid={`forex-${p.code.toLowerCase()}-rate`}>
                {value != null ? `R${value.toFixed(2)}` : "—"}
              </div>
              <div className="flex items-center justify-center gap-0.5 mt-0.5">
                <TrendIcon className="h-2.5 w-2.5" style={{ color: trendColor }} />
              </div>
            </div>
          );
        })}
      </div>
      {data.date && (
        <div className="text-[10px] text-center" style={{ color: mutedText }}>
          Source: frankfurter.app · {data.date}
        </div>
      )}
    </div>
  );
}
