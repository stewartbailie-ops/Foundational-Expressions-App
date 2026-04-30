import { useState, useMemo } from "react";
import { Share2, Copy, Check, Lightbulb } from "lucide-react";
import { getDailyFacts, type FunFact } from "@/data/funFacts";
import { FUN_FACT_CATEGORY_COLORS } from "@shared/schema";

export function FunFactsCarousel({ accentColor, borderColor, cardBg, textColor, mutedText, advisorName }: {
  accentColor: string;
  borderColor: string;
  cardBg: string;
  textColor: string;
  mutedText: string;
  advisorName: string;
}) {
  const facts = useMemo<FunFact[]>(() => getDailyFacts(), []);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleShare = async (fact: FunFact) => {
    const text = `Did you know? ${fact.fact}\n\n— shared by ${advisorName}`;
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: `${fact.category} fact`, text });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(fact.id);
      setTimeout(() => setCopiedId(curr => (curr === fact.id ? null : curr)), 1500);
    } catch {}
  };

  const handleCopy = async (fact: FunFact) => {
    const text = `Did you know? ${fact.fact}\n\n— shared by ${advisorName}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(fact.id);
      setTimeout(() => setCopiedId(curr => (curr === fact.id ? null : curr)), 1500);
    } catch {}
  };

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
      data-testid="section-funfacts"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4" style={{ color: accentColor }} />
          <h3 className="text-sm font-semibold" style={{ color: textColor }}>Financial Facts of the Day</h3>
        </div>
        <span className="text-[10px] uppercase tracking-wider" style={{ color: mutedText }}>
          6 daily picks
        </span>
      </div>
      {/* Horizontally scrollable card row, snap behaviour for nice swipe on mobile */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory" data-testid="scroll-funfacts">
        {facts.map(fact => {
          const palette = FUN_FACT_CATEGORY_COLORS[fact.category] ?? { bg: "#1f2937", accent: "#9ca3af" };
          const isCopied = copiedId === fact.id;
          return (
            <article
              key={fact.id}
              className="flex-shrink-0 w-[78%] sm:w-[260px] rounded-2xl p-4 flex flex-col justify-between snap-start"
              style={{
                backgroundColor: palette.bg,
                minHeight: 180,
                border: `1px solid ${palette.accent}33`,
                boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
              }}
              data-testid={`funfact-card-${fact.id}`}
            >
              <div className="space-y-3">
                <div
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                  style={{ backgroundColor: palette.accent + "33", color: palette.accent }}
                  data-testid={`funfact-category-${fact.id}`}
                >
                  {fact.category}
                </div>
                <p className="text-sm font-medium leading-snug text-white" data-testid={`funfact-text-${fact.id}`}>
                  {fact.fact}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => handleShare(fact)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#ffffff", border: `1px solid rgba(255,255,255,0.25)` }}
                  data-testid={`button-funfact-share-${fact.id}`}
                >
                  <Share2 className="h-3 w-3" />
                  Share
                </button>
                <button
                  onClick={() => handleCopy(fact)}
                  className="inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#ffffff", border: `1px solid rgba(255,255,255,0.25)` }}
                  aria-label="Copy fact"
                  data-testid={`button-funfact-copy-${fact.id}`}
                >
                  {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <p className="text-[10px] text-center" style={{ color: mutedText }}>
        New picks rotate daily at midnight.
      </p>
    </div>
  );
}
