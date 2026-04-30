import { useState, useMemo, useEffect } from "react";
import { Images, X } from "lucide-react";
import { FACT_IMAGES } from "@/data/factImages";

function getHourlyImages(hourKey: number): string[] {
  const shuffled = [...FACT_IMAGES];
  let seed = hourKey;
  for (let i = shuffled.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 10);
}

export function FunFactsCarousel({
  accentColor,
  borderColor,
  cardBg,
  textColor,
  mutedText,
  advisorName: _advisorName,
}: {
  accentColor: string;
  borderColor: string;
  cardBg: string;
  textColor: string;
  mutedText: string;
  advisorName?: string;
}) {
  const [hourKey, setHourKey] = useState(() => Math.floor(Date.now() / 3_600_000));
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const next = Math.floor(Date.now() / 3_600_000);
      setHourKey((k) => (k !== next ? next : k));
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const images = useMemo(() => getHourlyImages(hourKey), [hourKey]);

  return (
    <>
      <div
        className="rounded-2xl p-4 space-y-3"
        style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
        data-testid="section-funfacts"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Images className="h-4 w-4" style={{ color: accentColor }} />
            <h3 className="text-sm font-semibold" style={{ color: textColor }}>
              Financial Facts of the Day
            </h3>
          </div>
          <span
            className="text-[10px] uppercase tracking-wider"
            style={{ color: mutedText }}
          >
            10 hourly picks
          </span>
        </div>

        <div
          className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory"
          data-testid="scroll-funfacts"
        >
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setLightbox(src)}
              className="flex-shrink-0 w-[72%] sm:w-[230px] rounded-2xl overflow-hidden snap-start focus:outline-none active:scale-[0.98] transition-transform"
              style={{ boxShadow: "0 6px 20px rgba(0,0,0,0.20)" }}
              data-testid={`funfact-card-${i}`}
              aria-label="Tap to enlarge"
            >
              <img
                src={src}
                alt={`Financial fact ${i + 1}`}
                className="w-full h-auto block"
                loading="lazy"
                draggable={false}
              />
            </button>
          ))}
        </div>

        <p className="text-[10px] text-center" style={{ color: mutedText }}>
          Tap any card to enlarge &middot; New picks every hour
        </p>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightbox}
            alt="Financial fact"
            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </div>
      )}
    </>
  );
}
