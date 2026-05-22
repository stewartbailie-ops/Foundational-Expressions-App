import { useState } from "react";

const PATTERNS = [
  { value: 0, label: "None / Solid" },
  { value: 1, label: "Radial Glow" },
  { value: 2, label: "Diagonal Lines" },
  { value: 3, label: "Dot Grid" },
  { value: 4, label: "Diamond Grid" },
  { value: 5, label: "Crosshatch" },
  { value: 6, label: "Concentric Rings" },
  { value: 7, label: "Tiled Name" },
] as const;

type ThemeKey = "dark" | "navy" | "gold" | "pink";

const THEMES: Record<ThemeKey, { bg: string; accent: string; name: string; baseImg: string }> = {
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

function overlayFor(style: number, accent: string, advisorName: string): { image: string; size: string; repeat?: string } | null {
  if (style === 0 || style === 1) return null;
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
    return { image: `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`, size: "520px 260px", repeat: "repeat" };
  }
  return null;
}

function PatternTile({
  themeKey,
  style,
  opacity,
  advisorName,
  selected,
  onSelect,
  onIntensityChange,
}: {
  themeKey: ThemeKey;
  style: number;
  opacity: number;
  advisorName: string;
  selected: boolean;
  onSelect: () => void;
  onIntensityChange: (v: number) => void;
}) {
  const t = THEMES[themeKey];
  const accent = scaleAlpha(t.accent, opacity / 50);
  const overlay = overlayFor(style, accent, advisorName);
  const bgImage = overlay ? `${overlay.image}, ${t.baseImg}` : t.baseImg;
  const bgSize = overlay ? `${overlay.size}, 100% 100%` : "100% 100%";
  const isDark = themeKey !== "pink";
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onSelect}
        className={`aspect-[3/4] rounded-xl overflow-hidden relative text-left transition-all ${selected ? "ring-2 ring-offset-2 ring-blue-500" : "border border-neutral-200 hover:border-neutral-400"}`}
        style={{
          backgroundColor: t.bg,
          backgroundImage: bgImage,
          backgroundSize: bgSize,
          backgroundRepeat: overlay?.repeat ?? "no-repeat",
        }}
      >
        <div className="absolute bottom-0 left-0 right-0 p-2 text-[10px] font-medium" style={{ color: isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.75)", backgroundColor: isDark ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.55)", backdropFilter: "blur(4px)" }}>
          {t.name}
        </div>
      </button>
      <div className="flex items-center gap-2 text-[10px] text-neutral-500">
        <span className="w-12 shrink-0">Intensity</span>
        <input
          type="range"
          min={5}
          max={100}
          step={5}
          value={opacity}
          onChange={e => onIntensityChange(parseInt(e.target.value))}
          className="flex-1 h-1"
        />
        <span className="font-mono tabular-nums w-8 text-right">{opacity}%</span>
      </div>
    </div>
  );
}

type Selection = { themeKey: ThemeKey; style: number; opacity: number } | null;

export function AlgorithmicPatterns() {
  const themeKeys = Object.keys(THEMES) as ThemeKey[];
  const [advisorName, setAdvisorName] = useState("Stewart");
  const [opacities, setOpacities] = useState<Record<string, number>>(() =>
    Object.fromEntries(PATTERNS.flatMap(p => themeKeys.map(k => [`${p.value}-${k}`, 50]))),
  );
  const [selected, setSelected] = useState<Selection>(null);
  const [promoted, setPromoted] = useState<string | null>(null);

  const setOpacityFor = (key: string, v: number) => setOpacities(o => ({ ...o, [key]: v }));

  const promote = () => {
    if (!selected) return;
    // Promote stub — in the live picker (client/src/components/BackgroundPatternPicker.tsx)
    // this would call `onChange(selected.style)` and `onOpacityChange(selected.opacity)`,
    // and the parent form would persist `backgroundStyle` + `patternOpacity` via the
    // PATCH /api/advisors/:id or POST /api/advisors call.
    const payload = {
      backgroundStyle: selected.style,
      patternOpacity: selected.opacity,
      theme: selected.themeKey,
    };
    setPromoted(JSON.stringify(payload, null, 2));
  };

  return (
    <div className="min-h-screen w-full bg-neutral-50 text-neutral-900">
      <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 px-6 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold tracking-tight">Algorithmic Background Patterns</div>
            <div className="text-[11px] text-neutral-500">{PATTERNS.length} patterns × {themeKeys.length} themes. Click a tile to select, adjust its intensity, then promote.</div>
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
            <button
              type="button"
              onClick={promote}
              disabled={!selected}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
            >
              Promote to live picker
            </button>
          </div>
        </div>
        {selected && (
          <div className="mt-2 text-[11px] text-neutral-600">
            Selected: <span className="font-semibold">{PATTERNS.find(p => p.value === selected.style)?.label}</span> on <span className="font-semibold">{THEMES[selected.themeKey].name}</span> at {selected.opacity}%
          </div>
        )}
        {promoted && (
          <pre className="mt-2 max-h-32 overflow-auto rounded bg-neutral-900 p-2 text-[10px] text-emerald-300">{promoted}</pre>
        )}
      </div>

      <div className="px-6 py-6 space-y-8">
        {PATTERNS.map(p => (
          <section key={p.value}>
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className="text-sm font-semibold">{p.value}. {p.label}</h3>
              <span className="text-[11px] text-neutral-500">backgroundStyle: {p.value}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {themeKeys.map(k => {
                const key = `${p.value}-${k}`;
                const opacity = opacities[key] ?? 50;
                const isSelected = selected?.style === p.value && selected.themeKey === k;
                return (
                  <PatternTile
                    key={k}
                    themeKey={k}
                    style={p.value}
                    opacity={opacity}
                    advisorName={advisorName}
                    selected={isSelected}
                    onSelect={() => setSelected({ themeKey: k, style: p.value, opacity })}
                    onIntensityChange={v => {
                      setOpacityFor(key, v);
                      if (isSelected) setSelected({ themeKey: k, style: p.value, opacity: v });
                    }}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
