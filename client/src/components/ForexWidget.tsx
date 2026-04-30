import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type ForexResponse = {
  date: string | null;
  previousDate?: string | null;
  base: string;
  rates: { USD: number | null; EUR: number | null; GBP: number | null };
  change?: { USD: number | null; EUR: number | null; GBP: number | null };
  stale?: boolean;
};

const REFRESH_MS = 60_000;

// Stable Rand-move palette — independent of advisor theme so the meaning is
// always unambiguous. Green = Rand strengthened (good news for SA clients
// holding Rand), Red = Rand weakened, Grey = unchanged or no comparison data.
const COLOR_STRONGER = "#22c55e";
const COLOR_WEAKER = "#ef4444";

export function ForexWidget({ accentColor, borderColor, cardBg, textColor, mutedText }: {
  accentColor: string;
  borderColor: string;
  cardBg: string;
  textColor: string;
  mutedText: string;
}) {
  const [data, setData] = useState<ForexResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const r = await fetch("/api/forex/rates");
        const d = await r.json() as ForexResponse;
        if (!mounted) return;
        setData(d);
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
          const change = data.change?.[p.code] ?? null;
          // Rate UP (more ZAR needed) = Rand weakened = RED + up arrow on the rate.
          // Rate DOWN (fewer ZAR needed) = Rand strengthened = GREEN + down arrow.
          // No comparison data (Frankfurter unreachable, fresh deploy etc.) = grey flat.
          let trend: "up" | "down" | "flat" = "flat";
          if (change != null && change !== 0) trend = change > 0 ? "up" : "down";
          const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
          const moveColor = trend === "up" ? COLOR_WEAKER : trend === "down" ? COLOR_STRONGER : mutedText;
          const changeLabel = change != null
            ? `${change > 0 ? "+" : ""}${change.toFixed(2)}%`
            : "—";
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
              <div
                className="text-lg font-bold leading-tight"
                style={{ color: trend === "flat" ? textColor : moveColor }}
                data-testid={`forex-${p.code.toLowerCase()}-rate`}
              >
                {value != null ? `R${value.toFixed(2)}` : "—"}
              </div>
              <div
                className="flex items-center justify-center gap-0.5 mt-0.5 text-[10px] font-semibold"
                style={{ color: moveColor }}
                data-testid={`forex-${p.code.toLowerCase()}-change`}
                title={trend === "up"
                  ? "Rand weakened over the past 24 hours"
                  : trend === "down"
                  ? "Rand strengthened over the past 24 hours"
                  : "No 24-hour change data"}
              >
                <TrendIcon className="h-2.5 w-2.5" />
                <span>{changeLabel}</span>
              </div>
            </div>
          );
        })}
      </div>
      {data.date && (
        <div className="text-[10px] text-center" style={{ color: mutedText }}>
          Source: frankfurter.app · {data.date}
          {data.previousDate && data.previousDate !== data.date ? ` vs ${data.previousDate}` : ""}
        </div>
      )}
    </div>
  );
}
