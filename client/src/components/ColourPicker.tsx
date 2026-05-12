import { Check } from "lucide-react";
import { THEME_OPTIONS, type getThemeColors } from "@/lib/themeUtils";

type Tc = ReturnType<typeof getThemeColors>;

// Theme key → swatch hex used for the small colour preview tile. Mirrors the
// THEME_HEX_MAP used elsewhere in AdvisorPanel; kept local so this component
// has no external dependency beyond THEME_OPTIONS.
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
  // Stored theme name (e.g. "dark", "light-blue"). The legacy `value` prop
  // accepted a hex; we now accept the theme name directly so the named-theme
  // tints in themeUtils.ts actually take effect (the old "custom" hex path
  // bypassed every named-theme palette).
  value: string;
  onChange: (themeName: string) => void;
  tc: Tc;
  testIdPrefix?: string;
}

// May 2026 — Stewart asked to drop the custom-hex / colour-wheel path for now
// and ship only the original named themes (dark, silver, pink, purple, green,
// teal, light-blue, navy). The hex picker was forcing every selection into
// the `theme="custom"` branch of getThemeColors, which never inherited the
// re-tinted card backgrounds added in the same release. Once the named
// themes are looking the way Stewart wants, we can layer the hex/wheel
// picker back on top — its previous version is in git history.
export default function ColourPicker({ value, onChange, tc, testIdPrefix = "colour" }: Props) {
  const current = THEME_OPTIONS.find(o => o.value === value)?.value;
  return (
    <div className="grid grid-cols-4 gap-2" data-testid={`${testIdPrefix}-grid`}>
      {THEME_OPTIONS.map(opt => {
        const selected = current === opt.value;
        const swatch = THEME_SWATCH[opt.value] || tc.accentColor;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
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
    </div>
  );
}
