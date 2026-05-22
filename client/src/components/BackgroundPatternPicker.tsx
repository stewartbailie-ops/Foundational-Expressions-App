import { BACKGROUND_STYLE_OPTIONS } from "@/lib/themeUtils";

export interface BackgroundPatternPickerProps {
  value: number;
  opacity: number;
  onChange: (value: number) => void;
  onOpacityChange: (opacity: number) => void;
  /** Optional themed colors for AdvisorPanel usage. Falls back to admin neutrals. */
  colors?: {
    border: string;
    accent: string;
    muted: string;
    selectedBg: string;
  };
  label?: string;
  className?: string;
}

const ADMIN_COLORS = {
  border: "hsl(var(--border))",
  accent: "hsl(var(--primary))",
  muted: "hsl(var(--muted-foreground))",
  selectedBg: "hsl(var(--accent))",
};

export function BackgroundPatternPicker(props: BackgroundPatternPickerProps) {
  const { value, opacity, onChange, onOpacityChange, label = "Background Pattern", className } = props;
  const c = props.colors ?? ADMIN_COLORS;

  return (
    <div className={`space-y-2 ${className ?? ""}`} data-testid="picker-background-pattern">
      {label && <label className="text-xs font-medium" style={{ color: c.muted }}>{label}</label>}
      <div className="grid grid-cols-3 gap-2">
        {BACKGROUND_STYLE_OPTIONS.map(opt => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className="rounded-lg border-2 py-2 px-1 text-center transition-all text-xs font-medium"
              style={{
                borderColor: selected ? c.accent : c.border,
                color: selected ? c.accent : c.muted,
                backgroundColor: selected ? c.selectedBg : "transparent",
              }}
              data-testid={`button-pattern-${opt.value}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {value > 1 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: c.muted }}>Pattern Intensity</span>
            <span className="text-xs font-medium" style={{ color: c.accent }}>{opacity}%</span>
          </div>
          <input
            type="range"
            min={5}
            max={100}
            step={5}
            value={opacity}
            onChange={e => onOpacityChange(parseInt(e.target.value))}
            className="w-full"
            style={{ accentColor: c.accent }}
            data-testid="input-pattern-opacity"
          />
          <div className="flex justify-between text-xs" style={{ color: c.muted }}>
            <span>Barely visible</span><span>Solid</span>
          </div>
        </div>
      )}
    </div>
  );
}
