import { Globe, LifeBuoy } from "lucide-react";

export type BrandFooterTheme = {
  cardBg: string;
  borderColor: string;
  textColor: string;
  mutedText: string;
  accentColor: string;
  buttonSecondaryBg: string;
};

export const MASTER_FOOTER_THEME: BrandFooterTheme = {
  cardBg: "rgba(255,255,255,0.04)",
  borderColor: "rgba(255,255,255,0.10)",
  textColor: "#ffffff",
  mutedText: "rgba(255,255,255,0.55)",
  accentColor: "#3b82f6",
  buttonSecondaryBg: "rgba(255,255,255,0.06)",
};

interface BrandFooterProps {
  theme?: BrandFooterTheme;
  compact?: boolean;
  poweredByLabel?: string;
  // May 2026: when true, always render the stacked layout (logo+pills row,
  // centered text below) regardless of viewport width. Needed for the advisor
  // sub-control panel where the footer sits inside a narrow inner container
  // — viewport-width breakpoints can't see the container so the absolute
  // layout would still overlap. Set this true for any in-panel use.
  forceStack?: boolean;
}

export function BrandFooter({ theme = MASTER_FOOTER_THEME, compact = false, poweredByLabel, forceStack = false }: BrandFooterProps) {
  const t = theme;
  // F5 (May 2026) — flattened from a two-row card (centered text on top, logo+pills below)
  // into a single balanced horizontal row per partner sample. Layout uses absolute centering
  // so the middle text block is mathematically centred across the full footer width regardless
  // of the logo / pill widths on either side. On narrow viewports we fall back to a stacked
  // two-row layout (logo + pills together on top, text below) so nothing collides on mobile.
  const logo = (
    <img
      src="/logo/icon-64.png"
      alt="Advisory Connect"
      className={compact ? "h-8 w-8 shrink-0" : "h-9 w-9 shrink-0"}
      data-testid="img-footer-logo"
    />
  );
  const center = (
    <div className="text-center leading-tight">
      <div className="text-[11px] font-medium" style={{ color: t.textColor }}>
        {poweredByLabel || "Powered by Advisory Connect"}
      </div>
      <div className="text-[10px] flex flex-wrap items-center justify-center gap-x-1.5" style={{ color: t.mutedText }}>
        <span>Elevate your professional presence</span>
        <span aria-hidden>·</span>
        <a
          href="/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
          style={{ color: t.mutedText }}
          data-testid="link-footer-privacy"
        >
          Privacy
        </a>
        <span aria-hidden>·</span>
        <a
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
          style={{ color: t.mutedText }}
          data-testid="link-footer-terms"
        >
          Terms
        </a>
      </div>
    </div>
  );
  const pills = (
    <div className="flex items-center gap-2 shrink-0">
      <a
        href="https://www.advisoryconnect.pro"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
        style={{ backgroundColor: `${t.accentColor}18`, color: t.accentColor, border: `1px solid ${t.accentColor}40` }}
        data-testid="link-footer-website"
      >
        <Globe className="h-3 w-3" />
        advisoryconnect.pro
      </a>
      <a
        href="mailto:support@advisoryconnect.pro"
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
        style={{ backgroundColor: t.buttonSecondaryBg, color: t.textColor, border: `1px solid ${t.borderColor}` }}
        data-testid="link-footer-support"
      >
        <LifeBuoy className="h-3 w-3" />
        Contact Support
      </a>
    </div>
  );
  return (
    <div
      className={`rounded-xl ${compact ? "px-3 py-2.5" : "px-4 py-3"}`}
      style={{ backgroundColor: t.cardBg, border: `1px solid ${t.borderColor}` }}
      data-testid="footer-brand"
    >
      {/* Wide screens: single row with absolute-centered text block. Hidden
          entirely when forceStack is true — used by the advisor sub-control
          panel where viewport-based breakpoints can't see the narrow inner
          container width. */}
      {!forceStack && (
        <div className="hidden lg:block relative">
          <div className="flex items-center justify-between gap-3">
            {logo}
            {pills}
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto">{center}</div>
          </div>
        </div>
      )}
      {/* Stacked fallback: logo + pills on top, centered text below. Always
          shown when forceStack is true. */}
      <div className={forceStack ? "space-y-2" : "lg:hidden space-y-2"}>
        <div className="flex items-center justify-between gap-3">
          {logo}
          {pills}
        </div>
        {center}
      </div>
    </div>
  );
}
