import type React from "react";

export const THEME_OPTIONS = [
  { value: "dark",             label: "Black" },
  { value: "silver",           label: "Silver" },
  { value: "pink",             label: "Pink" },
  { value: "dark-royal-purple",label: "Purple" },
  { value: "dark-green",       label: "Green" },
  { value: "teal",             label: "Teal" },
  { value: "light-blue",       label: "Light Blue" },
  { value: "navy",             label: "Dark Blue" },
] as const;

export const BACKGROUND_STYLE_OPTIONS = [
  { value: 1, label: "Radial Glow" },
  { value: 2, label: "Diagonal Lines" },
  { value: 3, label: "Dot Grid" },
  { value: 4, label: "Diamond Grid" },
  { value: 5, label: "Crosshatch" },
  { value: 6, label: "Concentric Rings" },
  { value: 7, label: "Tiled Name" },
] as const;

// Premium image-pattern presets. Files live under `client/public/patterns/`
// and are served at `/patterns/<file>`. Mirrors registry.json (kept in lock-
// step with that file; the JSON is documentation, not fetched at runtime).
// Gated behind `image_pattern_presets` Premium feature flag at the UI layer.
export const IMAGE_PATTERN_OPTIONS = [
  { key: "lattice",     label: "Lattice",     file: "dark_3d_lattice_scaffolding.jpg" },
  { key: "stone",       label: "Stone",       file: "textured_grey_stone_cubes.jpg" },
  { key: "carbon-gold", label: "Carbon Gold", file: "maroon_carbon_fiber_gold_trim.jpg" },
  { key: "smoke",       label: "Smoke",       file: "teal_smoky_translucent_circles.jpg" },
  { key: "hextech",     label: "Hextech",     file: "hexagons_orange_white_black.jpg" },
  { key: "topographic", label: "Topographic", file: "topographic_lines_red_on_black.jpg" },
  { key: "pentagons",   label: "Pentagons",   file: "neon_outlined_pentagons_black.jpg" },
  { key: "neon-wave",   label: "Neon Wave",   file: "red_neon_wave_purple_ridges.jpg" },
] as const;

export function getImagePatternUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  const preset = IMAGE_PATTERN_OPTIONS.find(p => p.key === key);
  return preset ? `/patterns/${preset.file}` : null;
}

// ─── Hex / colour helpers (used by the custom-colour theme path) ────────────
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = (hex || "").replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const n = parseInt(full || "4a8db5", 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}
function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
function mixWithWhite(hex: string, t: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t);
}
function mixWithBlack(hex: string, t: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * (1 - t), g * (1 - t), b * (1 - t));
}

function scaleRgbaOpacity(rgba: string, multiplier: number): string {
  const m = rgba.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  if (!m) return rgba;
  const newOp = Math.min(1, parseFloat(m[4]) * multiplier);
  return `rgba(${m[1]},${m[2]},${m[3]},${newOp.toFixed(3)})`;
}

function applyPatternOverlay(
  base: React.CSSProperties,
  accentRgba: string,
  style: number,
  opacityMultiplier = 1,
  advisorName?: string,
): React.CSSProperties {
  if (style === 1 || !style) return base;
  const accent = opacityMultiplier !== 1 ? scaleRgbaOpacity(accentRgba, opacityMultiplier) : accentRgba;
  const baseImg = typeof base.backgroundImage === "string" ? base.backgroundImage : "";
  const baseSize = typeof base.backgroundSize === "string" ? base.backgroundSize : "100% 100%";

  let overlay = "";
  let overlaySize = "";

  if (style === 2) {
    overlay = `repeating-linear-gradient(45deg, ${accent} 0px, ${accent} 1px, transparent 1px, transparent 18px)`;
    overlaySize = "26px 26px";
  } else if (style === 3) {
    overlay = `radial-gradient(circle, ${accent} 1.5px, transparent 1.5px)`;
    overlaySize = "20px 20px";
  } else if (style === 4) {
    overlay = [
      `repeating-linear-gradient(45deg, ${accent} 0px, ${accent} 1px, transparent 1px, transparent 14px)`,
      `repeating-linear-gradient(-45deg, ${accent} 0px, ${accent} 1px, transparent 1px, transparent 14px)`,
    ].join(", ");
    overlaySize = "20px 20px, 20px 20px";
  } else if (style === 5) {
    overlay = [
      `repeating-linear-gradient(0deg, ${accent} 0px, ${accent} 1px, transparent 1px, transparent 24px)`,
      `repeating-linear-gradient(90deg, ${accent} 0px, ${accent} 1px, transparent 1px, transparent 24px)`,
    ].join(", ");
    overlaySize = "24px 24px, 24px 24px";
  } else if (style === 6) {
    overlay = [
      `radial-gradient(circle at 50% 50%, transparent 20px, ${accent} 21px, transparent 22px)`,
      `radial-gradient(circle at 50% 50%, transparent 40px, ${accent} 41px, transparent 42px)`,
    ].join(", ");
    overlaySize = "88px 88px, 88px 88px";
  } else if (style === 7) {
    // Tiled angled name watermark — advisor's full name repeated at -25°.
    // Falls back to "Advisory Connect" if no name provided. The accent RGBA is
    // already opacity-scaled by the patternOpacity slider above, so the SVG
    // fill inherits that intensity directly.
    const rawName = (advisorName || "Advisory Connect").trim() || "Advisory Connect";
    const safe = rawName.replace(/[<>&"']/g, "").slice(0, 40);
    // Bigger + bolder per partner feedback (May 2026): font-size 22 → 44 (~100%
    // larger) and weight 600 → 900. Tile width/height grow proportionally so
    // the rotated text isn't clipped at the edges.
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='520' height='260' viewBox='0 0 520 260'><text x='260' y='130' font-family='Inter, system-ui, sans-serif' font-size='44' font-weight='900' letter-spacing='1' fill='${accent}' text-anchor='middle' dominant-baseline='middle' transform='rotate(-25 260 130)'>${safe}</text></svg>`;
    overlay = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
    overlaySize = "520px 260px";
  }

  return {
    ...base,
    backgroundImage: overlay ? `${overlay}, ${baseImg}` : baseImg,
    backgroundSize: overlaySize ? `${overlaySize}, ${baseSize}` : baseSize,
    backgroundRepeat: style === 7 ? "repeat, no-repeat" : undefined,
  };
}

// When an image pattern is selected we render the chosen image at `cover`
// and wash the theme background colour over it using `patternOpacity` as the
// reveal slider (100 = image fully visible, 5 = almost solid theme colour).
// Returns null if no preset matches the key — caller falls back to the CSS
// pattern path.
function applyImagePattern(
  base: React.CSSProperties,
  imagePatternKey: string,
  patternOpacity?: number | null,
): React.CSSProperties | null {
  const url = getImagePatternUrl(imagePatternKey);
  if (!url) return null;
  const reveal = Math.max(5, Math.min(100, patternOpacity ?? 50)) / 100;
  const tintAlpha = 1 - reveal;
  const bgColorHex = typeof base.backgroundColor === "string" ? base.backgroundColor : "#0a0a0a";
  // Parse #rrggbb (the named-theme palette is always 6-char hex).
  let r = 10, g = 10, b = 10;
  const m = bgColorHex.match(/^#([0-9a-f]{6})$/i);
  if (m) {
    const n = parseInt(m[1], 16);
    r = (n >> 16) & 255; g = (n >> 8) & 255; b = n & 255;
  }
  const tint = `rgba(${r},${g},${b},${tintAlpha.toFixed(3)})`;
  return {
    backgroundColor: bgColorHex,
    backgroundImage: `linear-gradient(${tint}, ${tint}), url("${url}")`,
    // Size image to viewport dimensions so it renders sharp without
    // background-attachment:fixed (which causes scroll repaints on mobile).
    // 100vw/100vh are relative to viewport, not element height, so the image
    // is never upscaled even on very tall profile pages.
    backgroundSize: "100% 100%, 100vw 100vh",
    backgroundPosition: "0 0, 50% 0",
    backgroundRepeat: "no-repeat, repeat-y",
  };
}

export function getThemeBackground(
  theme: string | null | undefined,
  backgroundStyle?: number | null,
  patternOpacity?: number | null,
  themeColor?: string | null,
  advisorName?: string | null,
  imagePatternKey?: string | null,
): React.CSSProperties {
  const t = theme || "blue";
  const s = Number(backgroundStyle) || 1;
  const opacityMult = patternOpacity != null ? Math.max(0.05, Math.min(3, patternOpacity / 50)) : 1;

  let base: React.CSSProperties;
  let accentRgba: string;

  // Custom-colour path: derive base + accent from the advisor's chosen hex.
  if (t === "custom" && themeColor) {
    const { r, g, b } = hexToRgb(themeColor);
    const lum = getLuminance(themeColor);
    accentRgba = `rgba(${r},${g},${b},0.20)`;
    if (lum < 0.55) {
      // Dark theme around a deep colour
      base = {
        backgroundColor: mixWithBlack(themeColor, 0.92),
        backgroundImage: [
          `radial-gradient(ellipse at 25% 10%, rgba(${r},${g},${b},0.55), transparent 55%)`,
          `radial-gradient(ellipse at 80% 80%, rgba(${r},${g},${b},0.20), transparent 50%)`,
        ].join(", "),
        backgroundSize: "100% 100%, 100% 100%",
      };
    } else {
      // Light theme around a bright colour
      base = {
        backgroundColor: mixWithWhite(themeColor, 0.90),
        backgroundImage: [
          `radial-gradient(ellipse at 30% -10%, rgba(${r},${g},${b},0.45), transparent 55%)`,
          `radial-gradient(ellipse at 85% 90%, rgba(${r},${g},${b},0.18), transparent 50%)`,
        ].join(", "),
        backgroundSize: "100% 100%, 100% 100%",
      };
    }
    if (imagePatternKey) {
      const ip = applyImagePattern(base, imagePatternKey, patternOpacity);
      if (ip) return ip;
    }
    return applyPatternOverlay(base, accentRgba, s, opacityMult, advisorName || undefined);
  }

  if (t === "dark") {
    accentRgba = "rgba(255,255,255,0.18)";
    base = {
      backgroundColor: "#0a0a0a",
      backgroundImage: [
        "radial-gradient(ellipse 90% 50% at 50% -5%, rgba(55,55,55,0.6), transparent)",
        "radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)",
      ].join(", "),
      backgroundSize: "100% 100%, 24px 24px",
    };
  } else if (t === "pink") {
    accentRgba = "rgba(190,24,93,0.18)";
    base = {
      backgroundColor: "#fff0f5",
      backgroundImage: [
        "radial-gradient(ellipse at 80% -10%, rgba(244,114,182,0.35), transparent 55%)",
        "radial-gradient(ellipse at 10% 100%, rgba(244,114,182,0.2), transparent 50%)",
      ].join(", "),
      backgroundSize: "100% 100%, 100% 100%",
    };
  } else if (t === "light-blue") {
    accentRgba = "rgba(14,165,233,0.20)";
    base = {
      backgroundColor: "#e0f2fe",
      backgroundImage: [
        "radial-gradient(ellipse at 60% -15%, rgba(14,165,233,0.35), transparent 55%)",
        "radial-gradient(circle, rgba(14,165,233,0.08) 1px, transparent 1px)",
      ].join(", "),
      backgroundSize: "100% 100%, 20px 20px",
    };
  } else if (t === "dark-royal-purple") {
    accentRgba = "rgba(168,85,247,0.20)";
    base = {
      backgroundColor: "#0d0a1a",
      backgroundImage: [
        "radial-gradient(ellipse at 25% 15%, rgba(109,40,217,0.45), transparent 55%)",
        "radial-gradient(ellipse at 80% 80%, rgba(168,85,247,0.2), transparent 50%)",
      ].join(", "),
      backgroundSize: "100% 100%, 100% 100%",
    };
  } else if (t === "dark-green") {
    accentRgba = "rgba(34,197,94,0.18)";
    base = {
      backgroundColor: "#061a0e",
      backgroundImage: [
        "radial-gradient(ellipse at 70% 10%, rgba(22,101,52,0.55), transparent 55%)",
        "radial-gradient(ellipse at 10% 90%, rgba(34,197,94,0.15), transparent 50%)",
      ].join(", "),
      backgroundSize: "100% 100%, 100% 100%",
    };
  } else if (t === "gold") {
    accentRgba = "rgba(212,160,23,0.20)";
    base = {
      backgroundColor: "#100e00",
      backgroundImage: [
        "radial-gradient(ellipse at 30% 10%, rgba(212,160,23,0.5), transparent 55%)",
        "radial-gradient(ellipse at 80% 85%, rgba(180,120,10,0.2), transparent 50%)",
      ].join(", "),
      backgroundSize: "100% 100%, 100% 100%",
    };
  } else if (t === "teal") {
    accentRgba = "rgba(13,148,136,0.20)";
    base = {
      backgroundColor: "#040f0e",
      backgroundImage: [
        "radial-gradient(ellipse at 20% 15%, rgba(13,148,136,0.55), transparent 55%)",
        "radial-gradient(ellipse at 85% 80%, rgba(20,184,166,0.2), transparent 50%)",
      ].join(", "),
      backgroundSize: "100% 100%, 100% 100%",
    };
  } else if (t === "red") {
    accentRgba = "rgba(220,38,38,0.20)";
    base = {
      backgroundColor: "#0f0303",
      backgroundImage: [
        "radial-gradient(ellipse at 70% 5%, rgba(220,38,38,0.55), transparent 55%)",
        "radial-gradient(ellipse at 10% 90%, rgba(185,28,28,0.2), transparent 50%)",
      ].join(", "),
      backgroundSize: "100% 100%, 100% 100%",
    };
  } else if (t === "navy") {
    accentRgba = "rgba(29,78,216,0.20)";
    base = {
      backgroundColor: "#020814",
      backgroundImage: [
        "radial-gradient(ellipse at 25% 10%, rgba(29,78,216,0.55), transparent 55%)",
        "radial-gradient(ellipse at 80% 80%, rgba(37,99,235,0.2), transparent 50%)",
      ].join(", "),
      backgroundSize: "100% 100%, 100% 100%",
    };
  } else if (t === "coral") {
    accentRgba = "rgba(249,115,22,0.20)";
    base = {
      backgroundColor: "#fff8f5",
      backgroundImage: [
        "radial-gradient(ellipse at 75% -10%, rgba(249,115,22,0.3), transparent 55%)",
        "radial-gradient(ellipse at 10% 100%, rgba(251,146,60,0.15), transparent 50%)",
      ].join(", "),
      backgroundSize: "100% 100%, 100% 100%",
    };
  } else if (t === "silver") {
    accentRgba = "rgba(107,114,128,0.20)";
    base = {
      backgroundColor: "#f1f2f4",
      backgroundImage: [
        "radial-gradient(ellipse at 30% -10%, rgba(156,163,175,0.45), transparent 55%)",
        "radial-gradient(ellipse at 85% 90%, rgba(107,114,128,0.15), transparent 50%)",
      ].join(", "),
      backgroundSize: "100% 100%, 100% 100%",
    };
  } else {
    accentRgba = "rgba(74,141,181,0.20)";
    base = {
      backgroundColor: "#f0f7fc",
      backgroundImage: [
        "radial-gradient(ellipse at 25% -10%, rgba(147,197,253,0.55), transparent 55%)",
        "radial-gradient(ellipse at 85% 90%, rgba(74,141,181,0.18), transparent 50%)",
      ].join(", "),
      backgroundSize: "100% 100%, 100% 100%",
    };
  }

  if (imagePatternKey) {
    const ip = applyImagePattern(base, imagePatternKey, patternOpacity);
    if (ip) return ip;
  }
  return applyPatternOverlay(base, accentRgba, s, opacityMult, advisorName || undefined);
}

export function getInitialsBadgeColors(
  theme: string | null | undefined,
  themeColor?: string | null,
): { from: string; to: string; border: string; accent: string } {
  const t = theme || "blue";
  if (t === "custom" && themeColor) {
    const lum = getLuminance(themeColor);
    return {
      from: mixWithWhite(themeColor, 0.18),
      to: mixWithBlack(themeColor, 0.55),
      border: lum < 0.55 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.45)",
      accent: lum < 0.55 ? mixWithWhite(themeColor, 0.85) : "#ffffff",
    };
  }
  if (t === "dark")             return { from: "#3a3a3a", to: "#111111", border: "rgba(255,255,255,0.22)", accent: "#ffffff" };
  if (t === "pink")             return { from: "#f472b6", to: "#9d174d", border: "rgba(255,255,255,0.3)", accent: "#fce7f3" };
  if (t === "light-blue")       return { from: "#38bdf8", to: "#0369a1", border: "rgba(255,255,255,0.3)", accent: "#e0f2fe" };
  if (t === "dark-royal-purple")return { from: "#9333ea", to: "#3b0764", border: "rgba(255,255,255,0.25)", accent: "#f3e8ff" };
  if (t === "dark-green")       return { from: "#22c55e", to: "#14532d", border: "rgba(255,255,255,0.25)", accent: "#dcfce7" };
  if (t === "gold")             return { from: "#d4a017", to: "#7c5a00", border: "rgba(255,215,0,0.35)", accent: "#fef9c3" };
  if (t === "teal")             return { from: "#0d9488", to: "#134e4a", border: "rgba(20,184,166,0.35)", accent: "#ccfbf1" };
  if (t === "red")              return { from: "#dc2626", to: "#7f1d1d", border: "rgba(252,165,165,0.3)", accent: "#fee2e2" };
  if (t === "navy")             return { from: "#1d4ed8", to: "#1e3a8a", border: "rgba(147,197,253,0.3)", accent: "#dbeafe" };
  if (t === "coral")            return { from: "#f97316", to: "#c2410c", border: "rgba(255,255,255,0.3)", accent: "#fff7ed" };
  if (t === "silver")           return { from: "#9ca3af", to: "#374151", border: "rgba(255,255,255,0.3)", accent: "#f9fafb" };
  return { from: "#4a8db5", to: "#1e3a5f", border: "rgba(255,255,255,0.25)", accent: "#e0f2fe" };
}

export function getThemeColors(theme: string | null | undefined, themeColor?: string | null) {
  const t = theme || "blue";

  const darkBase = (accent: string, bg: string, cardBg: string, popupBg: string, text: string, muted: string, sectionTitle: string, inputBg: string, solidInputBg: string, inputBorder: string, border: string, btnBg: string, btnText: string, btnSecBg: string, circBg: string, circBorder: string, checkActive: string, checkInactive: string, checkDotActive: string, checkDotInactive: string) => ({
    isDark: true, isBlue: false,
    accentColor: accent, bgColor: bg, cardBg, popupBg, textColor: text, mutedText: muted, sectionTitle,
    inputBg, solidInputBg, inputBorder, borderColor: border, buttonBg: btnBg, buttonText: btnText,
    buttonSecondaryBg: btnSecBg, initialsCircleBg: circBg, initialsCircleBorder: circBorder,
    successColor: "#22c55e", checkActive, checkInactive, checkDotActive, checkDotInactive,
  });

  const lightBase = (accent: string, bg: string, cardBg: string, popupBg: string, text: string, muted: string, sectionTitle: string, inputBg: string, solidInputBg: string, inputBorder: string, border: string, btnBg: string, btnText: string, btnSecBg: string, circBg: string, circBorder: string, checkActive: string, checkInactive: string, checkDotActive: string, checkDotInactive: string) => ({
    isDark: false, isBlue: false,
    accentColor: accent, bgColor: bg, cardBg, popupBg, textColor: text, mutedText: muted, sectionTitle,
    inputBg, solidInputBg, inputBorder, borderColor: border, buttonBg: btnBg, buttonText: btnText,
    buttonSecondaryBg: btnSecBg, initialsCircleBg: circBg, initialsCircleBorder: circBorder,
    successColor: "#22c55e", checkActive, checkInactive, checkDotActive, checkDotInactive,
  });

  // Custom-colour path: derive a full palette from a single advisor-chosen hex.
  // Luminance < 0.55 → dark theme variant; else light theme variant.
  if (t === "custom" && themeColor) {
    // Clamp pathological extremes — pure #ffffff or #000000 picks would
    // collapse every derivative to the same colour and erase elevation cues.
    // Substitute a neutral "near-extreme" so the surface palette still has
    // something to mix with.
    const rawLum = getLuminance(themeColor);
    const safeColor = rawLum > 0.96 ? "#e5e7eb" : (rawLum < 0.04 ? "#1a1a1a" : themeColor);
    const { r, g, b } = hexToRgb(safeColor);
    const lum = getLuminance(safeColor);
    const accent = safeColor;
    const buttonText = lum < 0.55 ? "#ffffff" : (lum > 0.85 ? "#000000" : "#ffffff");
    if (lum < 0.55) {
      // Dark-custom — bumped surface alphas to match the May 2026 "full send"
      // pass on named dark themes (cardBg/inputBg ~0.20, not ~0.10).
      // popupBg uses a lower black-mix (0.55) than card's effective tint so
      // modals read clearly elevated above the card surface.
      return darkBase(
        accent,
        mixWithBlack(safeColor, 0.92),                   // bgColor
        `rgba(${r},${g},${b},0.20)`,                     // cardBg (was 0.10)
        mixWithBlack(safeColor, 0.55),                   // popupBg — clearly lighter than card
        mixWithWhite(safeColor, 0.90),                   // textColor
        "rgba(255,255,255,0.65)",                         // mutedText (always readable)
        mixWithWhite(safeColor, 0.55),                   // sectionTitle — brighter mix for legibility on tinted card
        `rgba(${r},${g},${b},0.20)`,                     // inputBg (was 0.12)
        mixWithBlack(safeColor, 0.62),                   // solidInputBg — between card and popup
        `rgba(${r},${g},${b},0.40)`,                     // inputBorder (was 0.35)
        `rgba(${r},${g},${b},0.30)`,                     // borderColor (was 0.25)
        accent, buttonText,                               // buttonBg / buttonText
        `rgba(${r},${g},${b},0.20)`,                     // buttonSecondaryBg
        `rgba(${r},${g},${b},0.22)`,                     // initialsCircleBg
        `rgba(${r},${g},${b},0.42)`,                     // initialsCircleBorder
        accent, "rgba(255,255,255,0.15)", "#ffffff", "rgba(255,255,255,0.5)"
      );
    }
    // Light-custom — bumped surface alphas to match named light themes
    // (pink/light-blue/coral/silver) which use ~12-18% accent in cardBg/inputBg.
    // Popup tinted (was hardcoded #ffffff so modals slammed back to pure white)
    // and uses a lower mix than card so the modal still reads as elevated.
    // Section title falls back to a darker derivative for very pale picks
    // where the raw accent would fail contrast against the tinted card.
    const tintedSectionTitle = lum > 0.7 ? mixWithBlack(safeColor, 0.45) : accent;
    return lightBase(
      accent,
      mixWithWhite(safeColor, 0.92),                     // bgColor
      mixWithWhite(safeColor, 0.82),                     // cardBg — ~18% tint (was 12%)
      mixWithWhite(safeColor, 0.90),                     // popupBg — lighter than card so modal reads elevated
      mixWithBlack(safeColor, 0.80),                     // textColor
      "rgba(0,0,0,0.65)",                                 // mutedText (always readable)
      tintedSectionTitle,                                 // sectionTitle (contrast-safe for pale picks)
      mixWithWhite(safeColor, 0.88), "#ffffff",          // inputBg — ~12% tint (was 6%)
      `rgba(${r},${g},${b},0.32)`,
      `rgba(${r},${g},${b},0.25)`,                       // borderColor (was 0.22)
      accent, buttonText,
      `rgba(${r},${g},${b},0.14)`,
      `rgba(${r},${g},${b},0.18)`,
      `rgba(${r},${g},${b},0.38)`,
      accent, "rgba(0,0,0,0.15)", "#ffffff", "rgba(0,0,0,0.3)"
    );
  }

  // ── Built-in theme palettes (May 2026 "full send" tint pass) ──
  // Stewart's feedback: coloured/dark themes weren't bleeding through to the
  // contact-card surfaces — cards looked white-cream regardless of theme.
  // Bumped cardBg / inputBg alpha on every dark theme from ~0.06-0.10 to
  // ~0.18-0.22 so the theme accent is unmistakably present in the card
  // surface. Light themes (pink, light-blue, coral, silver) now mix the
  // accent into white instead of using flat translucent white, mirroring the
  // custom-light branch.
  if (t === "pink") return lightBase(
    "#be185d","#fff0f5","#fbe2ec","#ffffff","#1a1a1a","rgba(0,0,0,0.55)","#be185d",
    "#fdeef4","#ffffff","rgba(190,24,93,0.25)","rgba(190,24,93,0.2)","#be185d","#ffffff",
    "rgba(190,24,93,0.12)","rgba(190,24,93,0.15)","rgba(190,24,93,0.3)",
    "#be185d","rgba(0,0,0,0.15)","#ffffff","rgba(0,0,0,0.3)"
  );
  if (t === "dark") return darkBase(
    "#ffffff","#0a0a0a","rgba(255,255,255,0.10)","#1e1e1e","#ffffff","rgba(255,255,255,0.6)","rgba(255,255,255,0.85)",
    "rgba(255,255,255,0.12)","#2a2a2a","rgba(255,255,255,0.2)","rgba(255,255,255,0.18)","#ffffff","#000000",
    "rgba(255,255,255,0.12)","rgba(255,255,255,0.1)","rgba(255,255,255,0.2)",
    "#ffffff","rgba(255,255,255,0.15)","#000000","rgba(255,255,255,0.5)"
  );
  if (t === "light-blue") return lightBase(
    "#0ea5e9","#e0f2fe","#d2ebfa","#ffffff","#0c2d48","rgba(12,45,72,0.6)","#0ea5e9",
    "#e6f5fd","#ffffff","rgba(14,165,233,0.3)","rgba(14,165,233,0.25)","#0ea5e9","#ffffff",
    "rgba(14,165,233,0.12)","rgba(14,165,233,0.15)","rgba(14,165,233,0.35)",
    "#0ea5e9","rgba(0,0,0,0.15)","#ffffff","rgba(0,0,0,0.3)"
  );
  if (t === "dark-royal-purple") return darkBase(
    "#a855f7","#0d0a1a","rgba(168,85,247,0.20)","#1e1530","#f3e8ff","rgba(243,232,255,0.7)","#c084fc",
    "rgba(168,85,247,0.18)","#261a3a","rgba(168,85,247,0.35)","rgba(168,85,247,0.30)","#a855f7","#ffffff",
    "rgba(168,85,247,0.15)","rgba(168,85,247,0.2)","rgba(168,85,247,0.4)",
    "#a855f7","rgba(255,255,255,0.15)","#ffffff","rgba(255,255,255,0.5)"
  );
  if (t === "dark-green") return darkBase(
    "#22c55e","#061a0e","rgba(34,197,94,0.20)","#0d2e18","#dcfce7","rgba(220,252,231,0.7)","#4ade80",
    "rgba(34,197,94,0.18)","#112b1c","rgba(34,197,94,0.35)","rgba(34,197,94,0.30)","#22c55e","#ffffff",
    "rgba(34,197,94,0.15)","rgba(34,197,94,0.2)","rgba(34,197,94,0.4)",
    "#22c55e","rgba(255,255,255,0.15)","#ffffff","rgba(255,255,255,0.5)"
  );
  if (t === "gold") return darkBase(
    "#d4a017","#100e00","rgba(212,160,23,0.22)","#242000","#fef9c3","rgba(254,249,195,0.7)","#fbbf24",
    "rgba(212,160,23,0.20)","#2e2800","rgba(212,160,23,0.40)","rgba(212,160,23,0.32)","#d4a017","#000000",
    "rgba(212,160,23,0.18)","rgba(212,160,23,0.2)","rgba(212,160,23,0.4)",
    "#d4a017","rgba(255,255,255,0.15)","#000000","rgba(255,255,255,0.5)"
  );
  if (t === "teal") return darkBase(
    "#0d9488","#040f0e","rgba(13,148,136,0.22)","#0c2220","#ccfbf1","rgba(204,251,241,0.7)","#2dd4bf",
    "rgba(13,148,136,0.20)","#102a28","rgba(13,148,136,0.40)","rgba(13,148,136,0.32)","#0d9488","#ffffff",
    "rgba(13,148,136,0.18)","rgba(13,148,136,0.2)","rgba(13,148,136,0.4)",
    "#0d9488","rgba(255,255,255,0.15)","#ffffff","rgba(255,255,255,0.5)"
  );
  if (t === "red") return darkBase(
    "#dc2626","#0f0303","rgba(220,38,38,0.20)","#1f0808","#fee2e2","rgba(254,226,226,0.7)","#f87171",
    "rgba(220,38,38,0.18)","#2a0d0d","rgba(220,38,38,0.40)","rgba(220,38,38,0.32)","#dc2626","#ffffff",
    "rgba(220,38,38,0.18)","rgba(220,38,38,0.2)","rgba(220,38,38,0.4)",
    "#dc2626","rgba(255,255,255,0.15)","#ffffff","rgba(255,255,255,0.5)"
  );
  if (t === "navy") return darkBase(
    "#1d4ed8","#020814","rgba(29,78,216,0.22)","#071228","#dbeafe","rgba(219,234,254,0.7)","#60a5fa",
    "rgba(29,78,216,0.20)","#0a1a38","rgba(29,78,216,0.40)","rgba(29,78,216,0.32)","#1d4ed8","#ffffff",
    "rgba(29,78,216,0.18)","rgba(29,78,216,0.2)","rgba(29,78,216,0.4)",
    "#1d4ed8","rgba(255,255,255,0.15)","#ffffff","rgba(255,255,255,0.5)"
  );
  if (t === "coral") return lightBase(
    "#f97316","#fff8f5","#fde6d3","#ffffff","#1a0d00","rgba(26,13,0,0.6)","#ea580c",
    "#fef0e3","#ffffff","rgba(249,115,22,0.3)","rgba(249,115,22,0.25)","#f97316","#ffffff",
    "rgba(249,115,22,0.12)","rgba(249,115,22,0.15)","rgba(249,115,22,0.35)",
    "#f97316","rgba(0,0,0,0.15)","#ffffff","rgba(0,0,0,0.3)"
  );
  if (t === "silver") return lightBase(
    "#6b7280","#f1f2f4","#e3e6ea","#ffffff","#111827","rgba(17,24,39,0.6)","#374151",
    "#ecedf0","#ffffff","rgba(107,114,128,0.3)","rgba(107,114,128,0.25)","#374151","#ffffff",
    "rgba(107,114,128,0.12)","rgba(107,114,128,0.12)","rgba(107,114,128,0.3)",
    "#374151","rgba(0,0,0,0.15)","#ffffff","rgba(0,0,0,0.3)"
  );
  return {
    isDark: false, isBlue: true,
    accentColor: "#4a8db5", bgColor: "#f0f7fc", cardBg: "#dfeaf3", popupBg: "#ffffff",
    textColor: "#1a2942", mutedText: "rgba(26,41,66,0.6)", sectionTitle: "#4a8db5",
    inputBg: "#e6eef5", solidInputBg: "#ffffff", inputBorder: "rgba(74,141,181,0.3)", borderColor: "rgba(74,141,181,0.25)",
    buttonBg: "#4a8db5", buttonText: "#ffffff", buttonSecondaryBg: "rgba(74,141,181,0.1)",
    initialsCircleBg: "rgba(74,141,181,0.15)", initialsCircleBorder: "rgba(74,141,181,0.35)",
    successColor: "#22c55e", checkActive: "#4a8db5", checkInactive: "rgba(0,0,0,0.15)",
    checkDotActive: "#ffffff", checkDotInactive: "rgba(0,0,0,0.3)",
  };
}
