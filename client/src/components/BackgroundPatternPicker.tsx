import { Lock } from "lucide-react";
import { BACKGROUND_STYLE_OPTIONS, IMAGE_PATTERN_OPTIONS } from "@/lib/themeUtils";

export interface BackgroundPatternPickerProps {
  value: number;
  opacity: number;
  onChange: (value: number) => void;
  onOpacityChange: (opacity: number) => void;
  /** Image-pattern key (Premium). When set, takes precedence over CSS `value`. */
  imagePatternKey?: string | null;
  onImagePatternKeyChange?: (key: string | null) => void;
  /** When false, image swatches render with a Lock overlay and are non-interactive. */
  premium?: boolean;
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
  const {
    value, opacity, onChange, onOpacityChange,
    imagePatternKey = null,
    onImagePatternKeyChange,
    premium = true,
    label = "Background Pattern",
    className,
  } = props;
  const c = props.colors ?? ADMIN_COLORS;
  const imagesSupported = typeof onImagePatternKeyChange === "function";
  const hasImage = imagesSupported && !!imagePatternKey;

  // Selecting a CSS pattern clears the image. Selecting an image leaves the
  // numeric `value` in place so toggling image off restores the prior CSS pick.
  const pickCss = (v: number) => {
    if (imagesSupported && imagePatternKey) onImagePatternKeyChange?.(null);
    onChange(v);
  };
  const pickImage = (key: string) => {
    if (!imagesSupported || !premium) return;
    onImagePatternKeyChange?.(key);
  };

  return (
    <div className={`space-y-2 ${className ?? ""}`} data-testid="picker-background-pattern">
      {label && <label className="text-xs font-medium" style={{ color: c.muted }}>{label}</label>}
      <div className="grid grid-cols-3 gap-2">
        {BACKGROUND_STYLE_OPTIONS.map(opt => {
          const selected = !hasImage && value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => pickCss(opt.value)}
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

      {imagesSupported && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: c.muted }}>
              Image Patterns {!premium && "(Premium)"}
            </span>
            {!premium && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ color: c.accent, border: `1px solid ${c.accent}` }}>
                Upgrade
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {IMAGE_PATTERN_OPTIONS.map(opt => {
              const selected = hasImage && imagePatternKey === opt.key;
              const url = `/patterns/${opt.file}`;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => pickImage(opt.key)}
                  disabled={!premium}
                  title={opt.label}
                  aria-label={opt.label}
                  className="relative aspect-square rounded-lg border-2 overflow-hidden transition-all"
                  style={{
                    borderColor: selected ? c.accent : c.border,
                    cursor: premium ? "pointer" : "not-allowed",
                    opacity: premium ? 1 : 0.55,
                  }}
                  data-testid={`button-image-pattern-${opt.key}`}
                >
                  <img
                    src={url}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {!premium && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
                      <Lock className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  {selected && (
                    <div
                      className="absolute inset-0 ring-2 ring-inset pointer-events-none"
                      style={{ boxShadow: `inset 0 0 0 2px ${c.accent}` }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          {hasImage && (
            <p className="text-[10px] pt-0.5" style={{ color: c.muted }}>
              Pick a CSS pattern above to switch back.
            </p>
          )}
        </div>
      )}

      {(value > 1 || hasImage) && (
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: c.muted }}>
              {hasImage ? "Image Intensity" : "Pattern Intensity"}
            </span>
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
