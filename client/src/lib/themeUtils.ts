import type React from "react";

export const THEME_OPTIONS = [
  { value: "blue",             label: "Abyss" },
  { value: "dark",             label: "Obsidian" },
  { value: "pink",             label: "Fuchsia" },
  { value: "light-blue",       label: "Nimbus" },
  { value: "dark-royal-purple",label: "Velour" },
  { value: "dark-green",       label: "Verdant" },
  { value: "gold",             label: "Aurum" },
  { value: "teal",             label: "Lagoon" },
  { value: "red",              label: "Inferno" },
  { value: "navy",             label: "Admiral" },
  { value: "coral",            label: "Ember" },
  { value: "silver",           label: "Mercury" },
] as const;

export const BACKGROUND_STYLE_OPTIONS = [
  { value: 1, label: "Radial Glow" },
  { value: 2, label: "Diagonal Lines" },
  { value: 3, label: "Dot Grid" },
  { value: 4, label: "Diamond Grid" },
  { value: 5, label: "Crosshatch" },
  { value: 6, label: "Concentric Rings" },
] as const;

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
  }

  return {
    ...base,
    backgroundImage: overlay ? `${overlay}, ${baseImg}` : baseImg,
    backgroundSize: overlaySize ? `${overlaySize}, ${baseSize}` : baseSize,
  };
}

export function getThemeBackground(
  theme: string | null | undefined,
  backgroundStyle?: number | null,
  patternOpacity?: number | null,
): React.CSSProperties {
  const t = theme || "blue";
  const s = Number(backgroundStyle) || 1;
  const opacityMult = patternOpacity != null ? Math.max(0.05, patternOpacity / 100) : 1;

  let base: React.CSSProperties;
  let accentRgba: string;

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

  return applyPatternOverlay(base, accentRgba, s, opacityMult);
}

export function getInitialsBadgeColors(theme: string | null | undefined): { from: string; to: string; border: string; accent: string } {
  const t = theme || "blue";
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

export function getThemeColors(theme: string | null | undefined) {
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

  if (t === "pink") return lightBase(
    "#be185d","#fff0f5","rgba(255,255,255,0.8)","#ffffff","#1a1a1a","rgba(0,0,0,0.55)","#be185d",
    "rgba(255,255,255,0.9)","#ffffff","rgba(190,24,93,0.25)","rgba(190,24,93,0.2)","#be185d","#ffffff",
    "rgba(190,24,93,0.12)","rgba(190,24,93,0.15)","rgba(190,24,93,0.3)",
    "#be185d","rgba(0,0,0,0.15)","#ffffff","rgba(0,0,0,0.3)"
  );
  if (t === "dark") return darkBase(
    "#ffffff","#0a0a0a","rgba(255,255,255,0.06)","#1e1e1e","#ffffff","rgba(255,255,255,0.6)","rgba(255,255,255,0.85)",
    "rgba(255,255,255,0.08)","#2a2a2a","rgba(255,255,255,0.2)","rgba(255,255,255,0.15)","#ffffff","#000000",
    "rgba(255,255,255,0.12)","rgba(255,255,255,0.1)","rgba(255,255,255,0.2)",
    "#ffffff","rgba(255,255,255,0.15)","#000000","rgba(255,255,255,0.5)"
  );
  if (t === "light-blue") return lightBase(
    "#0ea5e9","#e0f2fe","rgba(255,255,255,0.85)","#ffffff","#0c2d48","rgba(12,45,72,0.6)","#0ea5e9",
    "rgba(255,255,255,0.95)","#ffffff","rgba(14,165,233,0.3)","rgba(14,165,233,0.22)","#0ea5e9","#ffffff",
    "rgba(14,165,233,0.12)","rgba(14,165,233,0.15)","rgba(14,165,233,0.35)",
    "#0ea5e9","rgba(0,0,0,0.15)","#ffffff","rgba(0,0,0,0.3)"
  );
  if (t === "dark-royal-purple") return darkBase(
    "#a855f7","#0d0a1a","rgba(168,85,247,0.08)","#1e1530","#f3e8ff","rgba(243,232,255,0.6)","#c084fc",
    "rgba(168,85,247,0.1)","#261a3a","rgba(168,85,247,0.3)","rgba(168,85,247,0.2)","#a855f7","#ffffff",
    "rgba(168,85,247,0.15)","rgba(168,85,247,0.2)","rgba(168,85,247,0.4)",
    "#a855f7","rgba(255,255,255,0.15)","#ffffff","rgba(255,255,255,0.5)"
  );
  if (t === "dark-green") return darkBase(
    "#22c55e","#061a0e","rgba(34,197,94,0.08)","#0d2e18","#dcfce7","rgba(220,252,231,0.6)","#4ade80",
    "rgba(34,197,94,0.1)","#112b1c","rgba(34,197,94,0.3)","rgba(34,197,94,0.2)","#22c55e","#ffffff",
    "rgba(34,197,94,0.15)","rgba(34,197,94,0.2)","rgba(34,197,94,0.4)",
    "#22c55e","rgba(255,255,255,0.15)","#ffffff","rgba(255,255,255,0.5)"
  );
  if (t === "gold") return darkBase(
    "#d4a017","#100e00","rgba(212,160,23,0.1)","#242000","#fef9c3","rgba(254,249,195,0.65)","#fbbf24",
    "rgba(212,160,23,0.12)","#2e2800","rgba(212,160,23,0.35)","rgba(212,160,23,0.25)","#d4a017","#000000",
    "rgba(212,160,23,0.18)","rgba(212,160,23,0.2)","rgba(212,160,23,0.4)",
    "#d4a017","rgba(255,255,255,0.15)","#000000","rgba(255,255,255,0.5)"
  );
  if (t === "teal") return darkBase(
    "#0d9488","#040f0e","rgba(13,148,136,0.1)","#0c2220","#ccfbf1","rgba(204,251,241,0.65)","#2dd4bf",
    "rgba(13,148,136,0.12)","#102a28","rgba(13,148,136,0.35)","rgba(13,148,136,0.25)","#0d9488","#ffffff",
    "rgba(13,148,136,0.18)","rgba(13,148,136,0.2)","rgba(13,148,136,0.4)",
    "#0d9488","rgba(255,255,255,0.15)","#ffffff","rgba(255,255,255,0.5)"
  );
  if (t === "red") return darkBase(
    "#dc2626","#0f0303","rgba(220,38,38,0.1)","#1f0808","#fee2e2","rgba(254,226,226,0.65)","#f87171",
    "rgba(220,38,38,0.12)","#2a0d0d","rgba(220,38,38,0.35)","rgba(220,38,38,0.25)","#dc2626","#ffffff",
    "rgba(220,38,38,0.18)","rgba(220,38,38,0.2)","rgba(220,38,38,0.4)",
    "#dc2626","rgba(255,255,255,0.15)","#ffffff","rgba(255,255,255,0.5)"
  );
  if (t === "navy") return darkBase(
    "#1d4ed8","#020814","rgba(29,78,216,0.1)","#071228","#dbeafe","rgba(219,234,254,0.65)","#60a5fa",
    "rgba(29,78,216,0.12)","#0a1a38","rgba(29,78,216,0.35)","rgba(29,78,216,0.25)","#1d4ed8","#ffffff",
    "rgba(29,78,216,0.18)","rgba(29,78,216,0.2)","rgba(29,78,216,0.4)",
    "#1d4ed8","rgba(255,255,255,0.15)","#ffffff","rgba(255,255,255,0.5)"
  );
  if (t === "coral") return lightBase(
    "#f97316","#fff8f5","rgba(255,255,255,0.85)","#ffffff","#1a0d00","rgba(26,13,0,0.6)","#ea580c",
    "rgba(255,255,255,0.95)","#ffffff","rgba(249,115,22,0.3)","rgba(249,115,22,0.22)","#f97316","#ffffff",
    "rgba(249,115,22,0.12)","rgba(249,115,22,0.15)","rgba(249,115,22,0.35)",
    "#f97316","rgba(0,0,0,0.15)","#ffffff","rgba(0,0,0,0.3)"
  );
  if (t === "silver") return lightBase(
    "#6b7280","#f1f2f4","rgba(255,255,255,0.88)","#ffffff","#111827","rgba(17,24,39,0.6)","#374151",
    "rgba(255,255,255,0.95)","#ffffff","rgba(107,114,128,0.3)","rgba(107,114,128,0.2)","#374151","#ffffff",
    "rgba(107,114,128,0.12)","rgba(107,114,128,0.12)","rgba(107,114,128,0.3)",
    "#374151","rgba(0,0,0,0.15)","#ffffff","rgba(0,0,0,0.3)"
  );
  return {
    isDark: false, isBlue: true,
    accentColor: "#4a8db5", bgColor: "#f0f7fc", cardBg: "#ffffff", popupBg: "#ffffff",
    textColor: "#1a2942", mutedText: "rgba(26,41,66,0.6)", sectionTitle: "#4a8db5",
    inputBg: "#ffffff", solidInputBg: "#ffffff", inputBorder: "rgba(74,141,181,0.3)", borderColor: "rgba(74,141,181,0.2)",
    buttonBg: "#4a8db5", buttonText: "#ffffff", buttonSecondaryBg: "rgba(74,141,181,0.1)",
    initialsCircleBg: "rgba(74,141,181,0.15)", initialsCircleBorder: "rgba(74,141,181,0.35)",
    successColor: "#22c55e", checkActive: "#4a8db5", checkInactive: "rgba(0,0,0,0.15)",
    checkDotActive: "#ffffff", checkDotInactive: "rgba(0,0,0,0.3)",
  };
}
