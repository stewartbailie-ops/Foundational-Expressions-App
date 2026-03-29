import { useState, useMemo, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, AlertCircle, ChevronDown, ChevronUp, Linkedin, Globe, Phone, Users, Calculator, Clock, Mail, Facebook, Instagram, Youtube, FileText, BookOpen, TrendingUp, Lightbulb, Video, Download } from "lucide-react";
import type { Advisor } from "@shared/schema";
import { BIO_OPTIONS, INDIVIDUAL_SERVICES, CORPORATE_SERVICES } from "@shared/schema";
import { getThemeColors, getThemeBackground, getInitialsBadgeColors } from "@/lib/themeUtils";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ProfileInitialsBadge({ initials, theme, size = 288, downloadable = false, name = "" }: {
  initials: string; theme: string; size?: number; downloadable?: boolean; name?: string;
}) {
  const { from, to, border } = getInitialsBadgeColors(theme);
  const svgId = `profile-badge-svg`;
  const tc = getThemeColors(theme);
  const l1 = initials[0] || "";
  const l2 = initials[1] || "";

  const handleDownload = () => {
    const svgEl = document.getElementById(svgId);
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>${svgData}`], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 600; canvas.height = 600;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 600, 600);
      URL.revokeObjectURL(url);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${name.replace(/\s+/g, "-").toLowerCase() || "initials"}-badge.png`;
      link.click();
    };
    img.src = url;
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <svg id={svgId} width={size} height={size} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" data-testid="icon-initials">
        <defs>
          <linearGradient id="ibg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
          <linearGradient id="ibshim" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <filter id="ibshadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="rgba(0,0,0,0.35)" />
          </filter>
        </defs>
        <rect width="120" height="120" rx="22" fill="url(#ibg)" filter="url(#ibshadow)" />
        <rect width="120" height="60" rx="22" fill="url(#ibshim)" />
        <rect x="4" y="4" width="112" height="112" rx="19" fill="none" stroke={border} strokeWidth="1.8" />
        <text x="38" y="84" fontFamily="Georgia, 'Times New Roman', serif" fontSize="62" fontWeight="bold" fill="white" textAnchor="middle" opacity="0.92" letterSpacing="-2">{l1}</text>
        <text x="82" y="84" fontFamily="Georgia, 'Times New Roman', serif" fontSize="62" fontWeight="bold" fill="white" textAnchor="middle" opacity="0.78" letterSpacing="-2">{l2}</text>
      </svg>
      {downloadable && (
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-70"
          style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor, border: `1px solid ${tc.borderColor}` }}
          data-testid="button-download-badge"
        >
          <Download className="h-3 w-3" />
          Download Badge
        </button>
      )}
    </div>
  );
}


function calculateAnnualTax(annualIncome: number, age: number): number {
  if (annualIncome <= 0) return 0;
  let tax = 0;
  const brackets = [
    { min: 0, max: 237100, rate: 0.18, base: 0 },
    { min: 237101, max: 370500, rate: 0.26, base: 42678 },
    { min: 370501, max: 512800, rate: 0.31, base: 77362 },
    { min: 512801, max: 673000, rate: 0.36, base: 121475 },
    { min: 673001, max: 857900, rate: 0.39, base: 179147 },
    { min: 857901, max: 1817000, rate: 0.41, base: 251258 },
    { min: 1817001, max: Infinity, rate: 0.45, base: 644489 },
  ];
  for (const b of brackets) {
    if (annualIncome >= b.min && annualIncome <= b.max) {
      tax = b.base + (annualIncome - b.min) * b.rate;
      break;
    }
    if (annualIncome > b.max && b.max === Infinity) {
      tax = b.base + (annualIncome - b.min) * b.rate;
    }
  }
  const rebate = age < 65 ? 17235 : age < 75 ? 26679 : 29824;
  return Math.max(0, Math.round(tax - rebate));
}

interface TaxResult {
  totalTaxPaid: number;
  yearsToRetirement: number;
  totalEarned: number;
  totalTakeHome: number;
  yearlyBreakdown: { year: number; age: number; income: number; tax: number; takeHome: number }[];
}

function calculateLifetimeTax(currentAge: number, retirementAge: number, annualIncome: number, growthRate: number, inflationRate: number): TaxResult {
  const years = retirementAge - currentAge;
  if (years <= 0 || annualIncome <= 0) return { totalTaxPaid: 0, yearsToRetirement: 0, totalEarned: 0, totalTakeHome: 0, yearlyBreakdown: [] };
  let totalTax = 0;
  let totalEarned = 0;
  let income = annualIncome;
  const breakdown: TaxResult["yearlyBreakdown"] = [];
  for (let i = 0; i < years; i++) {
    const age = currentAge + i;
    const tax = calculateAnnualTax(income, age);
    totalTax += tax;
    totalEarned += income;
    breakdown.push({ year: i + 1, age, income: Math.round(income), tax, takeHome: Math.round(income - tax) });
    income = income * (1 + (growthRate - inflationRate) / 100);
  }
  return { totalTaxPaid: Math.round(totalTax), yearsToRetirement: years, totalEarned: Math.round(totalEarned), totalTakeHome: Math.round(totalEarned - totalTax), yearlyBreakdown: breakdown };
}

function TaxCalculator({ borderColor, cardBg, textColor, mutedText, accentColor, buttonBg, buttonText }: {
  borderColor: string; cardBg: string; textColor: string; mutedText: string; accentColor: string; buttonBg: string; buttonText: string;
}) {
  const [currentAge, setCurrentAge] = useState("");
  const [retirementAge, setRetirementAge] = useState("65");
  const [monthlyGrossIncome, setMonthlyGrossIncome] = useState("");
  const [growthRate, setGrowthRate] = useState("5");
  const [inflationRate, setInflationRate] = useState("5");
  const [showBreakdown, setShowBreakdown] = useState(false);

  const annualIncome = monthlyGrossIncome ? Math.round(parseFloat(monthlyGrossIncome) * 12) : 0;
  const age = Number(currentAge) || 0;
  const retirement = Number(retirementAge) || 65;
  const growth = Number(growthRate) || 0;
  const inflation = Number(inflationRate) || 0;

  const result = useMemo(() => calculateLifetimeTax(age, retirement, annualIncome, growth, inflation), [age, retirement, annualIncome, growth, inflation]);
  const currentYearTax = useMemo(() => age > 0 && annualIncome > 0 ? calculateAnnualTax(annualIncome, age) : 0, [age, annualIncome]);

  const formatCurrency = (n: number) => `R ${n.toLocaleString("en-ZA")}`;

  const inputStyleCalc: React.CSSProperties = {
    backgroundColor: cardBg,
    border: `1px solid ${borderColor}`,
    color: textColor,
    borderRadius: "0.5rem",
    padding: "0.5rem 0.75rem",
    fontSize: "0.8125rem",
    width: "100%",
    outline: "none",
  };

  const selectStyleCalc: React.CSSProperties = {
    ...inputStyleCalc,
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
  };

  const optionStyleCalc: React.CSSProperties = {
    backgroundColor: "#1a1a1a",
    color: "#ffffff",
  };

  return (
    <div className="mt-3 rounded-lg p-4 space-y-3" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }} data-testid="tax-calculator">
      <div className="flex items-center gap-2" style={{ color: accentColor }}>
        <Calculator className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wider">Tax Calculator</span>
      </div>
      <p className="text-xs" style={{ color: mutedText }}>See how much tax you'll pay between now and retirement using SA 2024/2025 SARS brackets.</p>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs mb-1" style={{ color: mutedText }}>Current Age</label>
          <input type="number" min="18" max="80" placeholder="e.g. 30" value={currentAge} onChange={(e) => setCurrentAge(e.target.value)} style={inputStyleCalc} data-testid="input-tax-age" />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: mutedText }}>Retirement Age</label>
          <input type="number" min="50" max="80" value={retirementAge} onChange={(e) => setRetirementAge(e.target.value)} style={inputStyleCalc} data-testid="input-tax-retirement" />
        </div>
      </div>

      <div>
        <label className="block text-xs mb-1" style={{ color: mutedText }}>Gross Monthly Income (R)</label>
        <input type="number" min="0" placeholder="e.g. 35000" value={monthlyGrossIncome} onChange={(e) => setMonthlyGrossIncome(e.target.value)} style={inputStyleCalc} data-testid="input-tax-monthly-income" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs mb-1" style={{ color: mutedText }}>Income Growth % p.a.</label>
          <input type="number" min="0" max="20" step="0.5" value={growthRate} onChange={(e) => setGrowthRate(e.target.value)} style={inputStyleCalc} data-testid="input-tax-growth" />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: mutedText }}>Inflation Rate %</label>
          <input type="number" min="0" max="20" step="0.5" value={inflationRate} onChange={(e) => setInflationRate(e.target.value)} style={inputStyleCalc} data-testid="input-tax-inflation" />
        </div>
      </div>

      {age > 0 && annualIncome > 0 && (
        <div className="space-y-2 pt-2">
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: accentColor }}>Current Year</div>
          <div className="flex justify-between text-xs">
            <span style={{ color: mutedText }}>Annual Income</span>
            <span style={{ color: textColor }} data-testid="text-tax-income">{formatCurrency(annualIncome)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: mutedText }}>Annual Tax</span>
            <span className="font-semibold" style={{ color: accentColor }} data-testid="text-tax-annual">{formatCurrency(currentYearTax)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: mutedText }}>Monthly Tax</span>
            <span style={{ color: textColor }} data-testid="text-tax-monthly">{formatCurrency(Math.round(currentYearTax / 12))}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: mutedText }}>Effective Rate</span>
            <span style={{ color: textColor }} data-testid="text-tax-rate">{annualIncome > 0 ? (currentYearTax / annualIncome * 100).toFixed(1) : 0}%</span>
          </div>

          {result.yearsToRetirement > 0 && (
            <>
              <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${borderColor}` }}>
                <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: accentColor }}>Until Retirement ({result.yearsToRetirement} years)</div>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: mutedText }}>Total Tax Paid</span>
                <span className="font-bold text-sm" style={{ color: accentColor }} data-testid="text-tax-total">{formatCurrency(result.totalTaxPaid)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: mutedText }}>Total Earned</span>
                <span style={{ color: textColor }} data-testid="text-tax-total-earned">{formatCurrency(result.totalEarned)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: mutedText }}>Total Take-home</span>
                <span className="font-semibold" style={{ color: accentColor }} data-testid="text-tax-total-takehome">{formatCurrency(result.totalTakeHome)}</span>
              </div>

              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="w-full text-xs mt-2 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                style={{ backgroundColor: borderColor, color: textColor }}
                data-testid="button-toggle-breakdown"
              >
                {showBreakdown ? "Hide" : "Show"} Year-by-Year Breakdown
              </button>

              {showBreakdown && (
                <div className="mt-2 max-h-48 overflow-y-auto rounded-lg text-xs" style={{ border: `1px solid ${borderColor}` }}>
                  <table className="w-full">
                    <thead>
                      <tr style={{ backgroundColor: borderColor }}>
                        <th className="px-2 py-1.5 text-left" style={{ color: textColor }}>Age</th>
                        <th className="px-2 py-1.5 text-right" style={{ color: textColor }}>Income</th>
                        <th className="px-2 py-1.5 text-right" style={{ color: textColor }}>Tax</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.yearlyBreakdown.map((row) => (
                        <tr key={row.year} style={{ borderTop: `1px solid ${borderColor}` }}>
                          <td className="px-2 py-1" style={{ color: mutedText }}>{row.age}</td>
                          <td className="px-2 py-1 text-right" style={{ color: textColor }}>{formatCurrency(row.income)}</td>
                          <td className="px-2 py-1 text-right font-medium" style={{ color: accentColor }}>{formatCurrency(row.tax)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
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

function ServiceGroupDropdown({
  title,
  services,
  borderColor,
  cardBg,
  textColor,
  mutedText,
  accentColor,
  buttonBg,
  buttonText,
  testId,
}: {
  title: string;
  services: { key: string; name: string; description: string }[];
  borderColor: string;
  cardBg: string;
  textColor: string;
  mutedText: string;
  accentColor: string;
  buttonBg: string;
  buttonText: string;
  testId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="border rounded-lg overflow-hidden"
      style={{ borderColor, backgroundColor: cardBg }}
      data-testid={testId}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
        style={{ color: textColor }}
        data-testid={`button-toggle-${testId}`}
      >
        <span className="font-semibold text-sm">{title}</span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          {services.map((s) => (
            <ServiceDropdown
              key={s.key}
              service={s}
              borderColor={borderColor}
              cardBg={cardBg}
              textColor={textColor}
              mutedText={mutedText}
              accentColor={accentColor}
              buttonBg={buttonBg}
              buttonText={buttonText}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdvisorProfile() {
  const [, profileParams] = useRoute("/profile/:slug");
  const [, directParams] = useRoute("/:slug");
  const [, navigate] = useLocation();
  const slug = profileParams?.slug || directParams?.slug || "";

  const { data: advisor, isLoading, error } = useQuery<Advisor>({
    queryKey: [`/api/advisors/slug/${slug}`],
    enabled: !!slug,
  });

  const [inDevClicked, setInDevClicked] = useState<string | null>(null);
  const [financialMediaOpen, setFinancialMediaOpen] = useState(false);
  const [inDevFinancial, setInDevFinancial] = useState<string | null>(null);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }); }, []);

  useEffect(() => {
    if (advisor) {
      document.title = `${advisor.name}${advisor.title ? " — " + advisor.title : ""} | Advisory Connect`;
    }
    return () => { document.title = "Advisory Connect"; };
  }, [advisor]);

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

  const hasContactDetails = advisor.showContactDetails !== false && (
    (advisor as any).contactNumber || (advisor as any).workingHours || advisor.email
  );

  const themeBg = getThemeBackground(advisor.theme, (advisor as any).backgroundStyle);

  return (
    <div
      className="min-h-screen"
      style={{ ...themeBg, color: textColor }}
      data-testid="profile-container"
    >
      <div className="max-w-md mx-auto px-5 py-8 space-y-6">

        <div className="space-y-5" data-testid="profile-header">
          <div className="flex items-center gap-5 rounded-2xl p-5"
            style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
            <div className="flex-shrink-0">
              <ProfileInitialsBadge
                initials={initials}
                theme={advisor.theme || "blue"}
                size={100}
                downloadable={true}
                name={advisor.name}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold tracking-tight leading-tight" data-testid="text-advisor-name" style={{ color: textColor }}>
                {advisor.name}
              </h1>
              {advisor.title && (
                <p className="text-xs font-semibold mt-1 uppercase tracking-widest" style={{ color: tc.accentColor }} data-testid="text-advisor-title">
                  {advisor.title}
                </p>
              )}
            </div>
          </div>

          {advisor.profilePicUrl && advisor.showProfilePic !== false && (
            <div className="flex justify-center" data-testid="section-profile-pic">
              <img
                src={advisor.profilePicUrl}
                alt={advisor.name}
                className="rounded-full object-cover"
                style={{ width: 220, height: 220, border: `4px solid ${tc.initialsCircleBorder}`, boxShadow: "0 10px 32px rgba(0,0,0,0.22)" }}
                data-testid="img-profile-pic"
              />
            </div>
          )}
        </div>

        {hasContactDetails && (
          <div
            className="rounded-xl p-4 space-y-2.5"
            style={{ backgroundColor: cardBg, border: `1px solid ${tc.borderColor}` }}
            data-testid="section-contact"
          >
            {advisor.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 flex-shrink-0" style={{ color: tc.accentColor }} />
                <a href={`mailto:${advisor.email}`} className="hover:underline truncate" style={{ color: textColor }} data-testid="text-contact-email">
                  {advisor.email}
                </a>
              </div>
            )}
            {(advisor as any).contactNumber && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 flex-shrink-0" style={{ color: tc.accentColor }} />
                <a href={`tel:${(advisor as any).contactNumber}`} className="hover:underline" style={{ color: textColor }} data-testid="text-contact-phone">
                  {(advisor as any).contactNumber}
                </a>
              </div>
            )}
            {(advisor as any).workingHours && (
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 flex-shrink-0" style={{ color: tc.accentColor }} />
                <span style={{ color: textColor }} data-testid="text-contact-hours">{(advisor as any).workingHours}</span>
              </div>
            )}
          </div>
        )}

        {bioText && (
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: cardBg }}
            data-testid="section-bio"
          >
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: mutedText }} data-testid="text-bio">
              {bioText}
            </p>
          </div>
        )}

        {individualServices.length > 0 && (
          <ServiceGroupDropdown
            title="Individual Services"
            services={individualServices}
            borderColor={tc.borderColor}
            cardBg={cardBg}
            textColor={textColor}
            mutedText={mutedText}
            accentColor={accentColor}
            buttonBg={tc.buttonBg}
            buttonText={tc.buttonText}
            testId="section-individual-services"
          />
        )}

        {corporateServices.length > 0 && (
          <ServiceGroupDropdown
            title="Corporate Services"
            services={corporateServices}
            borderColor={tc.borderColor}
            cardBg={cardBg}
            textColor={textColor}
            mutedText={mutedText}
            accentColor={accentColor}
            buttonBg={tc.buttonBg}
            buttonText={tc.buttonText}
            testId="section-corporate-services"
          />
        )}

        {(advisor.showSocials !== false) && (advisor.linkedinUrl || (advisor as any).facebookUrl || (advisor as any).instagramUrl || (advisor as any).youtubeUrl || advisor.websiteUrl || (advisor as any).contactNumber) && (
          <div className="space-y-2.5" data-testid="section-socials">
            {[
              { url: advisor.linkedinUrl, label: "Connect on LinkedIn", Icon: Linkedin, testId: "link-linkedin" },
              { url: (advisor as any).facebookUrl, label: "Follow on Facebook", Icon: Facebook, testId: "link-facebook" },
              { url: (advisor as any).instagramUrl, label: "Follow on Instagram", Icon: Instagram, testId: "link-instagram" },
              { url: (advisor as any).youtubeUrl, label: "Subscribe on YouTube", Icon: Youtube, testId: "link-youtube" },
              { url: advisor.websiteUrl, label: "Visit Website", Icon: Globe, testId: "link-website" },
            ].filter(s => !!s.url).map(({ url, label, Icon, testId }) => (
              <a
                key={testId}
                href={url!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-medium text-sm transition-opacity hover:opacity-80"
                style={{ backgroundColor: tc.buttonSecondaryBg, color: accentColor, border: `1px solid ${tc.borderColor}` }}
                data-testid={testId}
              >
                <Icon className="h-4 w-4" />
                {label}
              </a>
            ))}
            {(advisor as any).contactNumber && (
              <a
                href={`https://wa.me/${String((advisor as any).contactNumber).replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-medium text-sm transition-opacity hover:opacity-80"
                style={{ backgroundColor: "#25D366", color: "#ffffff" }}
                data-testid="link-whatsapp"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp Me
              </a>
            )}
          </div>
        )}

        {((advisor as any).showAstute || (advisor as any).showDocuments || (advisor as any).showComplimentaryWill) && (
          <div className="space-y-2.5" data-testid="section-in-dev-links">
            {(advisor as any).showAstute && (
              <div className="space-y-1.5">
                <button
                  onClick={() => setInDevClicked(inDevClicked === "astute" ? null : "astute")}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
                  style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}
                  data-testid="button-indev-astute"
                >
                  <Calculator className="h-4 w-4" />
                  Money Map
                </button>
                <p className="text-center text-xs px-2" style={{ color: mutedText }}>
                  Get a complete over-view of all your current finances in one place
                </p>
                {inDevClicked === "astute" && (
                  <div className="text-center py-2.5 rounded-lg text-xs font-medium"
                    style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}`, color: mutedText }}>
                    In development — Coming soon
                  </div>
                )}
              </div>
            )}
            {(advisor as any).showDocuments && (
              <div>
                <button
                  onClick={() => setInDevClicked(inDevClicked === "documents" ? null : "documents")}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
                  style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}
                  data-testid="button-indev-documents"
                >
                  <FileText className="h-4 w-4" />
                  Documents Upload
                </button>
                {inDevClicked === "documents" && (
                  <div className="mt-1.5 text-center py-2.5 rounded-lg text-xs font-medium"
                    style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}`, color: mutedText }}>
                    In development — Coming soon
                  </div>
                )}
              </div>
            )}
            {(advisor as any).showComplimentaryWill && (
              <button
                onClick={() => navigate(`/${advisor.profileSlug}/claim-will`)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}
                data-testid="button-claim-will"
              >
                <BookOpen className="h-4 w-4" />
                Claim Your Free Will
              </button>
            )}
          </div>
        )}

        {(advisor as any).showFinancialMedia && (
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${tc.borderColor}` }} data-testid="section-financial-media">
            <button
              onClick={() => setFinancialMediaOpen(v => !v)}
              className="flex items-center justify-between w-full px-4 py-3.5 font-semibold text-sm"
              style={{ backgroundColor: tc.buttonSecondaryBg, color: textColor }}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" style={{ color: accentColor }} />
                General Financial Media
              </div>
              {financialMediaOpen ? <ChevronUp className="h-4 w-4" style={{ color: mutedText }} /> : <ChevronDown className="h-4 w-4" style={{ color: mutedText }} />}
            </button>
            {financialMediaOpen && (
              <div className="px-4 pb-4 pt-2 space-y-2" style={{ backgroundColor: cardBg }}>
                {[
                  { key: "news", label: "Latest Financial News", Icon: TrendingUp },
                  { key: "funfacts", label: "Daily Financial Fun-facts", Icon: Lightbulb },
                  { key: "videos", label: "Financial Tutorial Videos", Icon: Video },
                ].map(({ key, label, Icon }) => (
                  <div key={key}>
                    <button
                      onClick={() => setInDevFinancial(inDevFinancial === key ? null : key)}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-medium text-sm transition-opacity hover:opacity-80"
                      style={{ backgroundColor: tc.buttonSecondaryBg, color: accentColor, border: `1px solid ${tc.borderColor}` }}
                      data-testid={`button-financial-${key}`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                    {inDevFinancial === key && (
                      <p className="text-center text-xs mt-1 py-1.5" style={{ color: mutedText }}>In development — Coming soon</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(advisor.showCallbackLink !== false || advisor.showReferralsLink !== false) && (
          <div className="space-y-3 pt-2">
            {advisor.showCallbackLink !== false && (
              <button
                onClick={() => navigate(`/${slug}/request-callback`)}
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
            )}
            {advisor.showReferralsLink !== false && (
              <button
                onClick={() => navigate(`/${slug}/referrals`)}
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
            )}
          </div>
        )}

        {advisor.showQrCode !== false && (
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
        )}

        <p className="text-center text-xs pt-4 pb-2" style={{ color: mutedText }}>
          Powered by Advisory Connect
        </p>
      </div>
    </div>
  );
}