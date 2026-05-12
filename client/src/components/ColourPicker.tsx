import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import type { getThemeColors } from "@/lib/themeUtils";

type Tc = ReturnType<typeof getThemeColors>;

const QUICK_PICKS: { hex: string; label: string }[] = [
  { hex: "#1a1a1a", label: "Black" },
  { hex: "#6b7280", label: "Silver" },
  { hex: "#be185d", label: "Pink" },
  { hex: "#a855f7", label: "Purple" },
  { hex: "#22c55e", label: "Green" },
  { hex: "#0d9488", label: "Teal" },
  { hex: "#0ea5e9", label: "Light Blue" },
  { hex: "#1d4ed8", label: "Dark Blue" },
];

interface Props {
  value: string;
  onChange: (hex: string) => void;
  tc: Tc;
  testIdPrefix?: string;
}

export default function ColourPicker({ value, onChange, tc, testIdPrefix = "colour" }: Props) {
  const safe = value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#4a8db5";
  const [hex, setHex] = useState(safe);

  useEffect(() => {
    if (value && /^#[0-9a-fA-F]{6}$/.test(value)) setHex(value);
  }, [value]);

  const commit = (h: string) => {
    setHex(h);
    onChange(h);
  };

  const isQuickPick = QUICK_PICKS.some(p => p.hex.toLowerCase() === hex.toLowerCase());

  return (
    <div className="space-y-3">
      {/* Quick Picks — the original 8 starter themes as one-tap presets */}
      <div className="grid grid-cols-4 gap-2">
        {QUICK_PICKS.map(p => {
          const selected = hex.toLowerCase() === p.hex.toLowerCase();
          return (
            <button
              key={p.hex}
              type="button"
              onClick={() => commit(p.hex)}
              className="rounded-lg border-2 p-2 text-center transition-all relative"
              style={{ borderColor: selected ? tc.accentColor : tc.borderColor }}
              data-testid={`${testIdPrefix}-quickpick-${p.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="w-full h-7 rounded mb-1" style={{ backgroundColor: p.hex }} />
              <span className="text-[10px] font-medium" style={{ color: tc.textColor }}>{p.label}</span>
              {selected && (
                <div className="absolute top-1 right-1 rounded-full p-0.5" style={{ backgroundColor: tc.accentColor }}>
                  <Check className="h-2.5 w-2.5" style={{ color: tc.buttonText }} strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom hex picker */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: tc.mutedText }}>Or pick any colour</span>
          {!isQuickPick && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor }}>
              Custom
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={hex}
            onChange={e => commit(e.target.value)}
            className="h-10 w-14 rounded-lg cursor-pointer p-0.5"
            style={{ border: `1px solid ${tc.inputBorder}`, backgroundColor: tc.inputBg }}
            data-testid={`${testIdPrefix}-wheel`}
            aria-label="Open colour wheel"
          />
          <input
            type="text"
            value={hex}
            onChange={e => {
              const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
              setHex(v);
              if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v);
            }}
            placeholder="#4a8db5"
            maxLength={7}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-mono outline-none uppercase"
            style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }}
            data-testid={`${testIdPrefix}-hex`}
          />
          <div
            className="h-10 w-10 rounded-lg flex-shrink-0"
            style={{ backgroundColor: hex, border: `1px solid ${tc.borderColor}` }}
            aria-label="Selected colour preview"
          />
        </div>
      </div>
    </div>
  );
}
