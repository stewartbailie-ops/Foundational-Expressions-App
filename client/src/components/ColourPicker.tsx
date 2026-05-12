import { useEffect, useRef, useState } from "react";
import { Check, Pipette } from "lucide-react";
import { THEME_OPTIONS, type getThemeColors } from "@/lib/themeUtils";

type Tc = ReturnType<typeof getThemeColors>;

const THEME_SWATCH: Record<string, string> = {
  dark:                "#1a1a1a",
  silver:              "#6b7280",
  pink:                "#be185d",
  "dark-royal-purple": "#a855f7",
  "dark-green":        "#22c55e",
  teal:                "#0d9488",
  "light-blue":        "#0ea5e9",
  navy:                "#1d4ed8",
};

interface Props {
  value: string;
  themeColor?: string | null;
  // Both args sent together so the parent saves them in lockstep — picking a
  // tile clears themeColor, picking the wheel sets theme="custom" + hex.
  onChange: (themeName: string, themeColor: string) => void;
  tc: Tc;
  testIdPrefix?: string;
}

const HEX_RE = /^#?([0-9a-f]{6})$/i;
const normalizeHex = (s: string) => {
  const m = s.trim().match(HEX_RE);
  return m ? `#${m[1].toLowerCase()}` : null;
};

export default function ColourPicker({ value, themeColor, onChange, tc, testIdPrefix = "colour" }: Props) {
  const isCustom = value === "custom";
  const currentHex = isCustom && themeColor ? themeColor : "#4a8db5";
  // Pick icon foreground based on the chosen hex's luminance so the pipette
  // stays legible on both very light and very dark custom picks.
  const pickedIconColor = (() => {
    const m = currentHex.match(/^#([0-9a-f]{6})$/i);
    if (!m) return "#ffffff";
    const n = parseInt(m[1], 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#000000" : "#ffffff";
  })();
  const [hexInput, setHexInput] = useState(currentHex);
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setHexInput(currentHex); }, [currentHex]);

  const commitHex = (raw: string) => {
    const normalized = normalizeHex(raw);
    if (normalized) {
      setHexInput(normalized);
      onChange("custom", normalized);
    } else {
      setHexInput(currentHex);
    }
  };

  return (
    <div className="space-y-3" data-testid={`${testIdPrefix}-grid`}>
      <div className="grid grid-cols-4 gap-2">
        {THEME_OPTIONS.map(opt => {
          const selected = !isCustom && value === opt.value;
          const swatch = THEME_SWATCH[opt.value] || tc.accentColor;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value, "")}
              className="rounded-lg border-2 p-2 text-center transition-all relative"
              style={{ borderColor: selected ? tc.accentColor : tc.borderColor, backgroundColor: tc.inputBg }}
              data-testid={`${testIdPrefix}-tile-${opt.value}`}
              aria-pressed={selected}
              aria-label={`Select ${opt.label} theme`}
            >
              <div className="w-full h-7 rounded mb-1" style={{ backgroundColor: swatch }} />
              <span className="text-[10px] font-medium" style={{ color: tc.textColor }}>{opt.label}</span>
              {selected && (
                <div className="absolute top-1 right-1 rounded-full p-0.5" style={{ backgroundColor: tc.accentColor }}>
                  <Check className="h-2.5 w-2.5" style={{ color: tc.buttonText }} strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}

        {/* Custom-hex tile — opens the native colour wheel. Selected state
            reflects whether the saved theme is "custom". */}
        <button
          type="button"
          onClick={() => colorInputRef.current?.click()}
          className="rounded-lg border-2 p-2 text-center transition-all relative"
          style={{ borderColor: isCustom ? tc.accentColor : tc.borderColor, backgroundColor: tc.inputBg }}
          data-testid={`${testIdPrefix}-tile-custom`}
          aria-pressed={isCustom}
          aria-label="Pick a custom colour"
        >
          <div
            className="w-full h-7 rounded mb-1 flex items-center justify-center"
            style={{
              background: isCustom
                ? currentHex
                : "conic-gradient(from 0deg, #ef4444, #f59e0b, #eab308, #22c55e, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #ef4444)",
            }}
          >
            <Pipette className="h-3.5 w-3.5" style={{ color: isCustom ? (pickedIconColor) : "#ffffff", filter: "drop-shadow(0 0 2px rgba(0,0,0,0.5))" }} />
          </div>
          <span className="text-[10px] font-medium" style={{ color: tc.textColor }}>Custom</span>
          {isCustom && (
            <div className="absolute top-1 right-1 rounded-full p-0.5" style={{ backgroundColor: tc.accentColor }}>
              <Check className="h-2.5 w-2.5" style={{ color: tc.buttonText }} strokeWidth={3} />
            </div>
          )}
        </button>
      </div>

      {/* Hex input + native colour input — only meaningful when "custom" is the
          active theme. Stays visible so the wheel button has a target sibling. */}
      <div className="flex items-center gap-2">
        <input
          ref={colorInputRef}
          type="color"
          value={currentHex}
          onChange={(e) => onChange("custom", e.target.value.toLowerCase())}
          className="h-8 w-10 rounded cursor-pointer border-0 p-0 bg-transparent"
          style={{ borderColor: tc.borderColor }}
          data-testid={`${testIdPrefix}-wheel`}
          aria-label="Open colour wheel"
        />
        <input
          type="text"
          value={hexInput}
          onChange={(e) => setHexInput(e.target.value)}
          onBlur={(e) => commitHex(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commitHex((e.target as HTMLInputElement).value); } }}
          placeholder="#4a8db5"
          className="flex-1 px-2 py-1.5 rounded text-xs font-mono outline-none"
          style={{ backgroundColor: tc.inputBg, color: tc.textColor, border: `1px solid ${tc.borderColor}` }}
          data-testid={`${testIdPrefix}-hex-input`}
          aria-label="Hex colour code"
          maxLength={7}
        />
      </div>
    </div>
  );
}
