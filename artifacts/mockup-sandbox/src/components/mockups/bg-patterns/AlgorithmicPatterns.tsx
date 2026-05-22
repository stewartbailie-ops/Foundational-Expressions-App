import { useState } from "react";

const PATTERNS = [
  { value: 1, label: "Radial Glow" },
  { value: 2, label: "Diagonal Lines" },
  { value: 3, label: "Dot Grid" },
  { value: 4, label: "Diamond Grid" },
  { value: 5, label: "Crosshatch" },
  { value: 6, label: "Concentric Rings" },
  { value: 7, label: "Tiled Name" },
] as const;

const THEMES: Record<string, { bg: string; accent: string; name: string; baseImg: string }> = {
  dark: {
    name: "Black",
    bg: "#0a0a0a",
    accent: "rgba(255,255,255,0.18)",
    baseImg: "radial-gradient(ellipse 90% 50% at 50% -5%, rgba(55,55,55,0.6), transparent)",
  },
  navy: {
    name: "Dark Blue",
    bg: "#0a1729",
    accent: "rgba(96,165,250,0.20)",
    baseImg: "radial-gradient(ellipse at 30% 10%, rgba(59,130,246,0.45), transparent 55%)",
  },
  gold: {
    name: "Gold",
    bg: "#100e00",
    accent: "rgba(212,160,23,0.20)",
    baseImg: "radial-gradient(ellipse at 30% 10%, rgba(212,160,23,0.5), transparent 55%)",
  },
  pink: {
    name: "Pink",
    bg: "#fff0f5",
    accent: "rgba(190,24,93,0.18)",
    baseImg: "radial-gradient(ellipse at 80% -10%, rgba(244,114,182,0.35), transparent 55%)",
  },
};

function scaleAlpha(rgba: string, mult: number): string {
  const m = rgba.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  if (!m) return rgba;
  const a = Math.min(1, parseFloat(m[4]) * mult);
  return `rgba(${m[1]},${m[2]},${m[3]},${a.toFixed(3)})`;
}

function overlayFor(style: number, accent: string, advisorName: string): { image: string; size: string } | null {
  if (style === 1) return null;
  if (style === 2) return { image: `repeating-linear-gradient(45deg, ${accent} 0px, ${accent} 1px, transparent 1px, transparent 18px)`, size: "26px 26px" };
  if (style === 3) return { image: `radial-gradient(circle, ${accent} 1.5px, transparent 1.5px)`, size: "20px 20px" };
  if (style === 4) return {
    image: [
      `repeating-linear-gradient(45deg, ${accent} 0px, ${accent} 1px, transparent 1px, transparent 14px)`,
      `repeating-linear-gradient(-45deg, ${accent} 0px, ${accent} 1px, transparent 1px, transparent 14px)`,
    ].join(", "),
    size: "20px 20px, 20px 20px",
  };
  if (style === 5) return {
    image: [
      `repeating-linear-gradient(0deg, ${accent} 0px, ${accent} 1px, transparent 1px, transparent 24px)`,
      `repeating-linear-gradient(90deg, ${accent} 0px, ${accent} 1px, transparent 1px, transparent 24px)`,
    ].join(", "),
    size: "24px 24px, 24px 24px",
  };
  if (style === 6) return {
    image: [
      `radial-gradient(circle at 50% 50%, transparent 20px, ${accent} 21px, transparent 22px)`,
      `radial-gradient(circle at 50% 50%, transparent 40px, ${accent} 41px, transparent 42px)`,
    ].join(", "),
    size: "88px 88px, 88px 88px",
  };
  if (style === 7) {
    const safe = advisorName.replace(/[<>&"']/g, "").slice(0, 40);
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='520' height='260' viewBox='0 0 520 260'><text x='260' y='130' font-family='Inter, system-ui, sans-serif' font-size='44' font-weight='900' letter-spacing='1' fill='${accent}' text-anchor='middle' dominant-baseline='middle' transform='rotate(-25 260 130)'>${safe}</text></svg>`;
    return { image: `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`, size: "520px 260px" };
  }
  return null;
}

function PatternSwatch({ themeKey, style, opacity, advisorName }: { themeKey: string; style: number; opacity: number; advisorName: string }) {
  const t = THEMES[themeKey];
  const accent = scaleAlpha(t.accent, opacity / 50);
  const overlay = overlayFor(style, accent, advisorName);
  const bgImage = overlay ? `${overlay.image}, ${t.baseImg}` : t.baseImg;
  const bgSize = overlay ? `${overlay.size}, 100% 100%` : "100% 100%";
  const isDark = ["dark", "navy", "gold"].includes(themeKey);
  return (
    <div
      className="aspect-[3/4] rounded-xl border overflow-hidden relative"
      style={{
        backgroundColor: t.bg,
        backgroundImage: bgImage,
        backgroundSize: bgSize,
        backgroundRepeat: style === 7 ? "repeat, no-repeat" : undefined,
        borderColor: "rgba(0,0,0,0.15)",
      }}
    >
      <div className="absolute bottom-0 left-0 right-0 p-2 text-[10px] font-medium" style={{ color: isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.75)", backgroundColor: isDark ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.55)", backdropFilter: "blur(4px)" }}>
        {t.name}
      </div>
    </div>
  );
}

export function AlgorithmicPatterns() {
  const [opacity, setOpacity] = useState(50);
  const [advisorName, setAdvisorName] = useState("Stewart");
  const themeKeys = Object.keys(THEMES);

  return (
    <div className="min-h-screen w-full bg-neutral-50 text-neutral-900">
      <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 px-6 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold tracking-tight">Algorithmic Background Patterns</div>
            <div className="text-[11px] text-neutral-500">7 patterns × {themeKeys.length} themes. Promote the chosen combo into the live picker once approved.</div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs">
              <span className="text-neutral-500">Name (Tiled pattern)</span>
              <input
                value={advisorName}
                onChange={e => setAdvisorName(e.target.value)}
                className="rounded border border-neutral-300 px-2 py-1 text-xs"
              />
            </label>
            <label className="flex items-center gap-2 text-xs">
              <span className="text-neutral-500">Intensity</span>
              <input type="range" min={5} max={100} step={5} value={opacity} onChange={e => setOpacity(parseInt(e.target.value))} />
              <span className="font-mono tabular-nums w-10 text-right">{opacity}%</span>
            </label>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        {PATTERNS.map(p => (
          <section key={p.value}>
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className="text-sm font-semibold">{p.value}. {p.label}</h3>
              <span className="text-[11px] text-neutral-500">backgroundStyle: {p.value}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {themeKeys.map(k => (
                <PatternSwatch key={k} themeKey={k} style={p.value} opacity={opacity} advisorName={advisorName} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
