import { Globe, LifeBuoy } from "lucide-react";

/**
 * BrandFooter — F4. Single balanced row used in three places:
 *  1) Public advisor profile (AdvisorProfile)
 *  2) Master Control Panel (AppLayout)
 *  3) Sub-Control Panel home (AdvisorPanel HomeTab)
 *
 * Layout, left -> right: CA neon icon · Registered Company badge · wordmark ·
 * tagline + Privacy/Terms + advisoryconnect.pro · Contact Support pill.
 *
 * Variants: theme-coloured ('panel' — uses caller-provided colours) or a
 * neutral dark variant ('master') for the master Control Panel where there's
 * no per-advisor theme.
 */
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
  /** Dense version with smaller padding/icons — used inside the public profile column. */
  compact?: boolean;
  /** Optional override for translatable "Powered by" line on multi-language pages. */
  poweredByLabel?: string;
}

export function BrandFooter({ theme = MASTER_FOOTER_THEME, compact = false, poweredByLabel }: BrandFooterProps) {
  const t = theme;
  const verifiedBadgeSrc = "/verification-badge.png"; // existing public asset
  return (
    <div
      className={`rounded-xl ${compact ? "p-3" : "p-4"}`}
      style={{ backgroundColor: t.cardBg, border: `1px solid ${t.borderColor}` }}
      data-testid="footer-brand"
    >
      <div className="flex flex-wrap items-center gap-3 md:gap-4">
        {/* Left cluster — neon icon, verified badge, wordmark stacked together so
            they read as one brand block on every breakpoint. */}
        <img
          src="/logo/icon-64.png"
          alt="Advisory Connect"
          className={compact ? "h-9 w-9 shrink-0" : "h-11 w-11 shrink-0"}
          data-testid="img-footer-logo"
        />
        <img
          src={verifiedBadgeSrc}
          alt="Registered Company"
          className={compact ? "h-8 w-auto shrink-0" : "h-10 w-auto shrink-0"}
          data-testid="img-footer-badge"
        />
        <img
          src="/logo/wordmark-160.png"
          alt="advisory connect"
          className={compact ? "h-6 w-auto shrink-0" : "h-7 w-auto shrink-0"}
          data-testid="img-footer-wordmark"
        />

        {/* Middle — tagline plus inline legal links. min-w-0 so flex-wrap can
            break neatly on narrow widths instead of pushing pills off-screen. */}
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-medium leading-tight" style={{ color: t.textColor }}>
            {poweredByLabel || "Powered by Advisory Connect"}
          </div>
          <div className="text-[10px] mt-0.5 flex flex-wrap items-center gap-x-1.5" style={{ color: t.mutedText }}>
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

        {/* Right pills — website + support. Stay together on the right edge. */}
        <div className="flex items-center gap-2 ml-auto">
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
      </div>
    </div>
  );
}
