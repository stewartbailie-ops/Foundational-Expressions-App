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
}

export function BrandFooter({ theme = MASTER_FOOTER_THEME, compact = false, poweredByLabel }: BrandFooterProps) {
  const t = theme;
  return (
    <div
      className={`rounded-xl ${compact ? "p-3" : "p-4"} space-y-2`}
      style={{ backgroundColor: t.cardBg, border: `1px solid ${t.borderColor}` }}
      data-testid="footer-brand"
    >
      {/* Top row — centered tagline + legal links */}
      <div className="text-center space-y-0.5">
        <div className="text-[11px] font-medium leading-tight" style={{ color: t.textColor }}>
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

      {/* Bottom row — logo left, action pills right */}
      <div className="flex items-center gap-3">
        <img
          src="/logo/icon-64.png"
          alt="Advisory Connect"
          className={compact ? "h-9 w-9 shrink-0" : "h-11 w-11 shrink-0"}
          data-testid="img-footer-logo"
        />
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
