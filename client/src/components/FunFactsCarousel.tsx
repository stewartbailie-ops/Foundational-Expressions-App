import { useState, useEffect, useRef } from "react";
import { Images, X, ChevronLeft, ChevronRight, Share2, Check } from "lucide-react";
import { FACT_IMAGES } from "@/data/factImages";

function pickRandomImages(count: number): string[] {
  const pool = [...FACT_IMAGES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

async function shareImage(src: string, advisorName: string) {
  const title = "Financial Fact";
  const text = `Check out this financial fact — shared by ${advisorName}`;

  // Try sharing the actual image file (works for WhatsApp, Instagram, etc.)
  if (typeof navigator !== "undefined" && (navigator as any).canShare) {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const filename = src.split("/").pop() ?? "fact.png";
      const file = new File([blob], filename, { type: blob.type });
      if ((navigator as any).canShare({ files: [file] })) {
        await (navigator as any).share({ files: [file], title, text });
        return "shared";
      }
    } catch {
      // fall through
    }
  }

  // Fallback: share the URL
  if (typeof navigator !== "undefined" && (navigator as any).share) {
    try {
      await (navigator as any).share({ title, text, url: window.location.href });
      return "shared";
    } catch {
      // user cancelled or not supported
    }
  }

  // Last resort: copy URL to clipboard
  try {
    await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
    return "copied";
  } catch {
    return "failed";
  }
}

export function FunFactsCarousel({
  accentColor,
  borderColor,
  cardBg,
  textColor,
  mutedText,
  advisorName,
}: {
  accentColor: string;
  borderColor: string;
  cardBg: string;
  textColor: string;
  mutedText: string;
  advisorName?: string;
}) {
  const [hourKey, setHourKey] = useState(() => Math.floor(Date.now() / 3_600_000));
  const [images, setImages] = useState<string[]>(() => pickRandomImages(10));
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [shareState, setShareState] = useState<"idle" | "shared" | "copied">("idle");
  const touchStartX = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const next = Math.floor(Date.now() / 3_600_000);
      setHourKey((k) => (k !== next ? next : k));
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setImages(pickRandomImages(10));
    setIndex(0);
  }, [hourKey]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
    };
  }, []);

  const goTo = (next: number) => setIndex(next);
  const prev = () => setIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  const next = () => setIndex((i) => (i < images.length - 1 ? i + 1 : 0));

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    touchStartX.current = null;
  };

  const handleShare = async () => {
    const result = await shareImage(images[index], advisorName || "your advisor");
    if (result === "shared" || result === "copied") {
      setShareState(result);
      // Track this timeout in timersRef so unmount cleanup cancels it and we never
      // call setShareState on an unmounted component.
      const t = window.setTimeout(() => setShareState("idle"), 2000);
      timersRef.current.push(t);
    }
  };

  const shareLabel =
    shareState === "shared" ? "Shared!" :
    shareState === "copied" ? "Link copied!" :
    "Share";

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
          <span className="text-[10px] uppercase tracking-wider" style={{ color: mutedText }}>
            {index + 1} / {images.length}
          </span>
        </div>

        <div className="relative select-none">
          <button
            onClick={() => setLightbox(images[index])}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="w-full rounded-xl overflow-hidden block focus:outline-none active:scale-[0.99] transition-transform"
            style={{ boxShadow: "0 6px 24px rgba(0,0,0,0.22)" }}
            aria-label="Tap to enlarge"
            data-testid={`funfact-card-${index}`}
          >
            <img
              src={images[index]}
              alt={`Financial fact ${index + 1}`}
              className="w-full h-auto block"
              draggable={false}
            />
          </button>

          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60 transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60 transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Share button */}
        <button
          onClick={handleShare}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98]"
          style={{
            backgroundColor: shareState !== "idle" ? accentColor + "22" : "rgba(255,255,255,0.08)",
            color: shareState !== "idle" ? accentColor : textColor,
            border: `1px solid ${shareState !== "idle" ? accentColor + "55" : borderColor}`,
          }}
          data-testid="button-funfact-share"
        >
          {shareState !== "idle" ? (
            <Check className="h-4 w-4" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
          {shareLabel}
        </button>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="rounded-full transition-all duration-200"
              style={{
                width: i === index ? 16 : 6,
                height: 6,
                backgroundColor: i === index ? accentColor : mutedText + "60",
              }}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>

        <p className="text-[10px] text-center" style={{ color: mutedText }}>
          Tap image to enlarge · New picks every hour
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
