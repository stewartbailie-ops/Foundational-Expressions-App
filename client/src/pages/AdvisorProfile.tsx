import { useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, AlertCircle, ChevronDown, ChevronUp, Linkedin, Globe, Phone, Users, Calculator } from "lucide-react";
import type { Advisor } from "@shared/schema";
import { BIO_OPTIONS, INDIVIDUAL_SERVICES, CORPORATE_SERVICES } from "@shared/schema";
import { getThemeColors } from "@/lib/themeUtils";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const SA_TAX_BRACKETS_2025 = [
  { min: 0, max: 237100, rate: 18, base: 0 },
  { min: 237101, max: 370500, rate: 26, base: 42678 },
  { min: 370501, max: 512800, rate: 31, base: 77362 },
  { min: 512801, max: 673000, rate: 36, base: 121475 },
  { min: 673001, max: 857900, rate: 39, base: 179147 },
  { min: 857901, max: 1817000, rate: 41, base: 251258 },
  { min: 1817001, max: Infinity, rate: 45, base: 644489 },
];

function calculateSATax(annualIncome: number): { tax: number; effectiveRate: number; monthlyTax: number } {
  if (annualIncome <= 0) return { tax: 0, effectiveRate: 0, monthlyTax: 0 };
  const rebate = 17235;
  let tax = 0;
  for (const bracket of SA_TAX_BRACKETS_2025) {
    if (annualIncome >= bracket.min) {
      if (annualIncome <= bracket.max) {
        tax = bracket.base + ((annualIncome - bracket.min + 1) * bracket.rate) / 100;
        break;
      }
    }
  }
  tax = Math.max(0, tax - rebate);
  const effectiveRate = annualIncome > 0 ? (tax / annualIncome) * 100 : 0;
  return { tax: Math.round(tax), effectiveRate: Math.round(effectiveRate * 10) / 10, monthlyTax: Math.round(tax / 12) };
}

function TaxCalculator({ borderColor, cardBg, textColor, mutedText, accentColor, buttonBg, buttonText }: {
  borderColor: string; cardBg: string; textColor: string; mutedText: string; accentColor: string; buttonBg: string; buttonText: string;
}) {
  const [income, setIncome] = useState("");
  const annualIncome = Number(income.replace(/[^0-9]/g, "")) || 0;
  const result = useMemo(() => calculateSATax(annualIncome), [annualIncome]);

  const formatCurrency = (n: number) => `R ${n.toLocaleString("en-ZA")}`;

  return (
    <div className="mt-3 rounded-lg p-4 space-y-3" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }} data-testid="tax-calculator">
      <div className="flex items-center gap-2" style={{ color: accentColor }}>
        <Calculator className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wider">Tax Calculator</span>
      </div>
      <p className="text-xs" style={{ color: mutedText }}>Enter your annual income to see an estimate of your tax liability (SA 2024/2025 rates).</p>
      <input
        type="text"
        inputMode="numeric"
        placeholder="e.g. 500000"
        value={income}
        onChange={(e) => setIncome(e.target.value.replace(/[^0-9]/g, ""))}
        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
        style={{ backgroundColor: `${cardBg}`, border: `1px solid ${borderColor}`, color: textColor }}
        data-testid="input-tax-income"
      />
      {annualIncome > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex justify-between text-xs">
            <span style={{ color: mutedText }}>Annual Income</span>
            <span style={{ color: textColor }} data-testid="text-tax-income">{formatCurrency(annualIncome)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: mutedText }}>Estimated Annual Tax</span>
            <span className="font-semibold" style={{ color: accentColor }} data-testid="text-tax-annual">{formatCurrency(result.tax)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: mutedText }}>Estimated Monthly Tax</span>
            <span style={{ color: textColor }} data-testid="text-tax-monthly">{formatCurrency(result.monthlyTax)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: mutedText }}>Effective Tax Rate</span>
            <span style={{ color: textColor }} data-testid="text-tax-rate">{result.effectiveRate}%</span>
          </div>
          <div className="flex justify-between text-xs pt-1" style={{ borderTop: `1px solid ${borderColor}` }}>
            <span style={{ color: mutedText }}>Take-home (After Tax)</span>
            <span className="font-semibold" style={{ color: accentColor }} data-testid="text-tax-takehome">{formatCurrency(annualIncome - result.tax)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ServiceDropdown({
  service,
  borderColor,
  cardBg,
  textColor,
  mutedText,
  accentColor,
  buttonBg,
  buttonText,
}: {
  service: { key: string; name: string; description: string };
  borderColor: string;
  cardBg: string;
  textColor: string;
  mutedText: string;
  accentColor: string;
  buttonBg: string;
  buttonText: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="border rounded-lg overflow-hidden"
      style={{
        borderColor,
        backgroundColor: cardBg,
      }}
      data-testid={`service-${service.key}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        style={{ color: textColor }}
        data-testid={`button-toggle-${service.key}`}
      >
        <span className="font-medium text-sm">{service.name}</span>
        {open ? <ChevronUp className="h-4 w-4 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-3">
          <div
            className="text-sm leading-relaxed"
            style={{ color: mutedText }}
            data-testid={`description-${service.key}`}
          >
            {service.description}
          </div>
          {service.key === "tax-efficiency" && (
            <TaxCalculator borderColor={borderColor} cardBg={cardBg} textColor={textColor} mutedText={mutedText} accentColor={accentColor} buttonBg={buttonBg} buttonText={buttonText} />
          )}
        </div>
      )}
    </div>
  );
}

export default function AdvisorProfile() {
  const [, params] = useRoute("/profile/:slug");
  const [, navigate] = useLocation();
  const slug = params?.slug || "";

  const { data: advisor, isLoading, error } = useQuery<Advisor>({
    queryKey: [`/api/advisors/slug/${slug}`],
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (error || !advisor) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold" data-testid="text-not-found">Advisor Not Found</h2>
          <p className="text-muted-foreground text-sm" data-testid="text-not-found-message">
            The advisor profile you're looking for doesn't exist or is no longer available.
          </p>
        </div>
      </div>
    );
  }

  if (!advisor.active) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold" data-testid="text-unavailable">Advisor Unavailable</h2>
          <p className="text-muted-foreground text-sm" data-testid="text-unavailable-message">
            This advisor's profile is not currently active.
          </p>
        </div>
      </div>
    );
  }

  const tc = getThemeColors(advisor.theme);
  const isDark = tc.isDark;
  const accentColor = tc.accentColor;
  const bgColor = tc.bgColor;
  const cardBg = tc.cardBg;
  const textColor = tc.textColor;
  const mutedText = tc.mutedText;
  const sectionTitle = tc.sectionTitle;

  const bioText =
    advisor.bioOption === "custom"
      ? advisor.customBio
      : BIO_OPTIONS[advisor.bioOption || "a"] || "";

  const individualServices = INDIVIDUAL_SERVICES.filter((s) =>
    advisor.individualServices?.includes(s.key)
  );
  const corporateServices = CORPORATE_SERVICES.filter((s) =>
    advisor.corporateServices?.includes(s.key)
  );

  const profileUrl = `advisoryconnect.pro/${advisor.profileSlug}`;
  const initials = getInitials(advisor.name);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: bgColor, color: textColor }}
      data-testid="profile-container"
    >
      <div className="max-w-md mx-auto px-5 py-8 space-y-6">
        <div className="flex flex-col items-center text-center space-y-4" data-testid="profile-header">
          {advisor.profilePicUrl ? (
            <img
              src={advisor.profilePicUrl}
              alt={advisor.name}
              className="w-44 h-44 rounded-full object-cover border-4"
              style={{ borderColor: tc.initialsCircleBorder }}
              data-testid="img-profile-pic"
            />
          ) : (
            <div
              className="w-44 h-44 rounded-full flex items-center justify-center text-5xl font-bold"
              style={{
                backgroundColor: tc.initialsCircleBg,
                color: accentColor,
                border: `2px solid ${tc.initialsCircleBorder}`,
              }}
              data-testid="icon-initials"
            >
              {initials}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-advisor-name">
              {advisor.name}
            </h1>
            {advisor.title && (
              <p className="text-sm mt-1" style={{ color: mutedText }} data-testid="text-advisor-title">
                {advisor.title}
              </p>
            )}
          </div>
        </div>

        {bioText && (
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: cardBg }}
            data-testid="section-bio"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: sectionTitle }}>
              Introduction
            </h2>
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: mutedText }} data-testid="text-bio">
              {bioText}
            </p>
          </div>
        )}

        {individualServices.length > 0 && (
          <div data-testid="section-individual-services">
            <h2
              className="text-xs font-semibold uppercase tracking-wider mb-3 px-1"
              style={{ color: sectionTitle }}
            >
              Individual Services
            </h2>
            <div className="space-y-2">
              {individualServices.map((s) => (
                <ServiceDropdown key={s.key} service={s} borderColor={tc.borderColor} cardBg={cardBg} textColor={textColor} mutedText={mutedText} accentColor={accentColor} buttonBg={tc.buttonBg} buttonText={tc.buttonText} />
              ))}
            </div>
          </div>
        )}

        {corporateServices.length > 0 && (
          <div data-testid="section-corporate-services">
            <h2
              className="text-xs font-semibold uppercase tracking-wider mb-3 px-1"
              style={{ color: sectionTitle }}
            >
              Corporate Services
            </h2>
            <div className="space-y-2">
              {corporateServices.map((s) => (
                <ServiceDropdown key={s.key} service={s} borderColor={tc.borderColor} cardBg={cardBg} textColor={textColor} mutedText={mutedText} accentColor={accentColor} buttonBg={tc.buttonBg} buttonText={tc.buttonText} />
              ))}
            </div>
          </div>
        )}

        {advisor.linkedinUrl && (
          <div data-testid="section-socials">
            <a
              href={advisor.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-medium text-sm transition-opacity hover:opacity-80"
              style={{
                backgroundColor: tc.buttonSecondaryBg,
                color: accentColor,
                border: `1px solid ${tc.borderColor}`,
              }}
              data-testid="link-linkedin"
            >
              <Linkedin className="h-4 w-4" />
              Connect on LinkedIn
            </a>
          </div>
        )}

        {advisor.websiteUrl && (
          <a
            href={advisor.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-medium text-sm transition-opacity hover:opacity-80"
            style={{
              backgroundColor: tc.buttonSecondaryBg,
              color: accentColor,
              border: `1px solid ${tc.borderColor}`,
            }}
            data-testid="link-website"
          >
            <Globe className="h-4 w-4" />
            Visit Website
          </a>
        )}

        <div className="space-y-3 pt-2">
          <button
            onClick={() => navigate(`/profile/${slug}/request-callback`)}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
            style={{
              backgroundColor: tc.buttonBg,
              color: tc.buttonText,
            }}
            data-testid="button-request-callback"
          >
            <Phone className="h-4 w-4" />
            Request a Call Back
          </button>
          <button
            onClick={() => navigate(`/profile/${slug}/referrals`)}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
            style={{
              backgroundColor: tc.buttonSecondaryBg,
              color: accentColor,
              border: `1px solid ${tc.initialsCircleBorder}`,
            }}
            data-testid="button-refer-friends"
          >
            <Users className="h-4 w-4" />
            Refer Friends & Family
          </button>
        </div>

        <div className="flex flex-col items-center pt-4 space-y-3" data-testid="section-qr">
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: "#ffffff" }}
          >
            <QRCodeSVG
              value={`https://${profileUrl}`}
              size={200}
              level="M"
              data-testid="qr-code"
            />
          </div>
          <p className="text-xs" style={{ color: mutedText }} data-testid="text-profile-url">
            {profileUrl}
          </p>
        </div>

        <p className="text-center text-xs pt-4 pb-2" style={{ color: mutedText }}>
          Powered by Advisory Connect
        </p>
      </div>
    </div>
  );
}