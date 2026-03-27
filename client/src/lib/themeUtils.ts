import type React from "react";

export function getThemeBackground(theme: string | null | undefined): React.CSSProperties {
  const t = theme || "blue";
  if (t === "dark") {
    return {
      backgroundColor: "#0a0a0a",
      backgroundImage: [
        "radial-gradient(ellipse 90% 50% at 50% -5%, rgba(55,55,55,0.6), transparent)",
        "radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)",
      ].join(", "),
      backgroundSize: "100% 100%, 24px 24px",
    };
  }
  if (t === "pink") {
    return {
      backgroundColor: "#fff0f5",
      backgroundImage: [
        "radial-gradient(ellipse at 80% -10%, rgba(244,114,182,0.35), transparent 55%)",
        "radial-gradient(ellipse at 10% 100%, rgba(244,114,182,0.2), transparent 50%)",
        "repeating-linear-gradient(45deg, rgba(190,24,93,0.025) 0px, rgba(190,24,93,0.025) 1px, transparent 1px, transparent 22px)",
        "repeating-linear-gradient(-45deg, rgba(190,24,93,0.025) 0px, rgba(190,24,93,0.025) 1px, transparent 1px, transparent 22px)",
      ].join(", "),
      backgroundSize: "100% 100%, 100% 100%, 44px 44px, 44px 44px",
    };
  }
  if (t === "light-blue") {
    return {
      backgroundColor: "#e0f2fe",
      backgroundImage: [
        "radial-gradient(ellipse at 60% -15%, rgba(14,165,233,0.35), transparent 55%)",
        "radial-gradient(circle, rgba(14,165,233,0.08) 1px, transparent 1px)",
      ].join(", "),
      backgroundSize: "100% 100%, 20px 20px",
    };
  }
  if (t === "dark-royal-purple") {
    return {
      backgroundColor: "#0d0a1a",
      backgroundImage: [
        "radial-gradient(ellipse at 25% 15%, rgba(109,40,217,0.45), transparent 55%)",
        "radial-gradient(ellipse at 80% 80%, rgba(168,85,247,0.2), transparent 50%)",
        "radial-gradient(circle, rgba(168,85,247,0.055) 1px, transparent 1px)",
      ].join(", "),
      backgroundSize: "100% 100%, 100% 100%, 22px 22px",
    };
  }
  if (t === "dark-green") {
    return {
      backgroundColor: "#061a0e",
      backgroundImage: [
        "radial-gradient(ellipse at 70% 10%, rgba(22,101,52,0.55), transparent 55%)",
        "radial-gradient(ellipse at 10% 90%, rgba(34,197,94,0.15), transparent 50%)",
        "radial-gradient(circle, rgba(34,197,94,0.06) 1px, transparent 1px)",
      ].join(", "),
      backgroundSize: "100% 100%, 100% 100%, 22px 22px",
    };
  }
  return {
    backgroundColor: "#f0f7fc",
    backgroundImage: [
      "radial-gradient(ellipse at 25% -10%, rgba(147,197,253,0.55), transparent 55%)",
      "radial-gradient(ellipse at 85% 90%, rgba(74,141,181,0.18), transparent 50%)",
      "repeating-linear-gradient(0deg, rgba(74,141,181,0.04) 0px, rgba(74,141,181,0.04) 1px, transparent 1px, transparent 30px)",
      "repeating-linear-gradient(90deg, rgba(74,141,181,0.04) 0px, rgba(74,141,181,0.04) 1px, transparent 1px, transparent 30px)",
    ].join(", "),
    backgroundSize: "100% 100%, 100% 100%, 30px 30px, 30px 30px",
  };
}

export function getInitialsBadgeColors(theme: string | null | undefined): { from: string; to: string; border: string } {
  const t = theme || "blue";
  if (t === "dark") return { from: "#303030", to: "#111111", border: "rgba(255,255,255,0.2)" };
  if (t === "pink") return { from: "#f472b6", to: "#9d174d", border: "rgba(255,255,255,0.3)" };
  if (t === "light-blue") return { from: "#38bdf8", to: "#0369a1", border: "rgba(255,255,255,0.3)" };
  if (t === "dark-royal-purple") return { from: "#9333ea", to: "#3b0764", border: "rgba(255,255,255,0.25)" };
  if (t === "dark-green") return { from: "#22c55e", to: "#14532d", border: "rgba(255,255,255,0.25)" };
  return { from: "#4a8db5", to: "#1e3a5f", border: "rgba(255,255,255,0.25)" };
}

export function getThemeColors(theme: string | null | undefined) {
  const t = theme || "blue";
  if (t === "pink") {
    return {
      isDark: false,
      isBlue: false,
      accentColor: "#be185d",
      bgColor: "#fff0f5",
      cardBg: "rgba(255,255,255,0.8)",
      textColor: "#1a1a1a",
      mutedText: "rgba(0,0,0,0.55)",
      sectionTitle: "#be185d",
      inputBg: "rgba(255,255,255,0.9)",
      inputBorder: "rgba(190,24,93,0.25)",
      borderColor: "rgba(190,24,93,0.2)",
      buttonBg: "#be185d",
      buttonText: "#ffffff",
      buttonSecondaryBg: "rgba(190,24,93,0.12)",
      initialsCircleBg: "rgba(190,24,93,0.15)",
      initialsCircleBorder: "rgba(190,24,93,0.3)",
      successColor: "#be185d",
      checkActive: "#be185d",
      checkInactive: "rgba(0,0,0,0.15)",
      checkDotActive: "#ffffff",
      checkDotInactive: "rgba(0,0,0,0.3)",
    };
  }
  if (t === "dark") {
    return {
      isDark: true,
      isBlue: false,
      accentColor: "#ffffff",
      bgColor: "#0a0a0a",
      cardBg: "rgba(255,255,255,0.06)",
      textColor: "#ffffff",
      mutedText: "rgba(255,255,255,0.6)",
      sectionTitle: "rgba(255,255,255,0.85)",
      inputBg: "rgba(255,255,255,0.08)",
      inputBorder: "rgba(255,255,255,0.2)",
      borderColor: "rgba(255,255,255,0.15)",
      buttonBg: "#ffffff",
      buttonText: "#000000",
      buttonSecondaryBg: "rgba(255,255,255,0.12)",
      initialsCircleBg: "rgba(255,255,255,0.1)",
      initialsCircleBorder: "rgba(255,255,255,0.2)",
      successColor: "#22c55e",
      checkActive: "#ffffff",
      checkInactive: "rgba(255,255,255,0.15)",
      checkDotActive: "#000000",
      checkDotInactive: "rgba(255,255,255,0.5)",
    };
  }
  if (t === "light-blue") {
    return {
      isDark: false,
      isBlue: false,
      accentColor: "#0ea5e9",
      bgColor: "#e0f2fe",
      cardBg: "rgba(255,255,255,0.85)",
      textColor: "#0c2d48",
      mutedText: "rgba(12,45,72,0.6)",
      sectionTitle: "#0ea5e9",
      inputBg: "rgba(255,255,255,0.95)",
      inputBorder: "rgba(14,165,233,0.3)",
      borderColor: "rgba(14,165,233,0.22)",
      buttonBg: "#0ea5e9",
      buttonText: "#ffffff",
      buttonSecondaryBg: "rgba(14,165,233,0.12)",
      initialsCircleBg: "rgba(14,165,233,0.15)",
      initialsCircleBorder: "rgba(14,165,233,0.35)",
      successColor: "#22c55e",
      checkActive: "#0ea5e9",
      checkInactive: "rgba(0,0,0,0.15)",
      checkDotActive: "#ffffff",
      checkDotInactive: "rgba(0,0,0,0.3)",
    };
  }
  if (t === "dark-royal-purple") {
    return {
      isDark: true,
      isBlue: false,
      accentColor: "#a855f7",
      bgColor: "#0d0a1a",
      cardBg: "rgba(168,85,247,0.08)",
      textColor: "#f3e8ff",
      mutedText: "rgba(243,232,255,0.6)",
      sectionTitle: "#c084fc",
      inputBg: "rgba(168,85,247,0.1)",
      inputBorder: "rgba(168,85,247,0.3)",
      borderColor: "rgba(168,85,247,0.2)",
      buttonBg: "#a855f7",
      buttonText: "#ffffff",
      buttonSecondaryBg: "rgba(168,85,247,0.15)",
      initialsCircleBg: "rgba(168,85,247,0.2)",
      initialsCircleBorder: "rgba(168,85,247,0.4)",
      successColor: "#22c55e",
      checkActive: "#a855f7",
      checkInactive: "rgba(255,255,255,0.15)",
      checkDotActive: "#ffffff",
      checkDotInactive: "rgba(255,255,255,0.5)",
    };
  }
  if (t === "dark-green") {
    return {
      isDark: true,
      isBlue: false,
      accentColor: "#22c55e",
      bgColor: "#061a0e",
      cardBg: "rgba(34,197,94,0.08)",
      textColor: "#dcfce7",
      mutedText: "rgba(220,252,231,0.6)",
      sectionTitle: "#4ade80",
      inputBg: "rgba(34,197,94,0.1)",
      inputBorder: "rgba(34,197,94,0.3)",
      borderColor: "rgba(34,197,94,0.2)",
      buttonBg: "#22c55e",
      buttonText: "#ffffff",
      buttonSecondaryBg: "rgba(34,197,94,0.15)",
      initialsCircleBg: "rgba(34,197,94,0.2)",
      initialsCircleBorder: "rgba(34,197,94,0.4)",
      successColor: "#22c55e",
      checkActive: "#22c55e",
      checkInactive: "rgba(255,255,255,0.15)",
      checkDotActive: "#ffffff",
      checkDotInactive: "rgba(255,255,255,0.5)",
    };
  }
  return {
    isDark: false,
    isBlue: true,
    accentColor: "#4a8db5",
    bgColor: "#f0f7fc",
    cardBg: "#ffffff",
    textColor: "#1a2942",
    mutedText: "rgba(26,41,66,0.6)",
    sectionTitle: "#4a8db5",
    inputBg: "#ffffff",
    inputBorder: "rgba(74,141,181,0.3)",
    borderColor: "rgba(74,141,181,0.2)",
    buttonBg: "#4a8db5",
    buttonText: "#ffffff",
    buttonSecondaryBg: "rgba(74,141,181,0.1)",
    initialsCircleBg: "rgba(74,141,181,0.15)",
    initialsCircleBorder: "rgba(74,141,181,0.35)",
    successColor: "#22c55e",
    checkActive: "#4a8db5",
    checkInactive: "rgba(0,0,0,0.15)",
    checkDotActive: "#ffffff",
    checkDotInactive: "rgba(0,0,0,0.3)",
  };
}
