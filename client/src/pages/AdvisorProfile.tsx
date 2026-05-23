import { useState, useMemo, useEffect, useRef, Fragment, type ReactNode } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, AlertCircle, AlertTriangle, ChevronDown, ChevronUp, Linkedin, Globe, Phone, Users, Calculator, Clock, Mail, Facebook, Instagram, Youtube, FileText, BookOpen, TrendingUp, Lightbulb, Video, Download, Share2, CreditCard, Smartphone, MapPin, ExternalLink, Rss, Eye, CalendarDays, X, Check, ArrowRight, Building2, FileCheck, Quote, PiggyBank, LineChart } from "lucide-react";
import { getQuoteForToday, shareQuoteAsPng, type QuoteSet } from "@/lib/dailyQuotes";
import { getUpcomingEvents, getCategoryColor, SA_FINANCIAL_EVENTS_2026, TRADINGVIEW_SYMBOLS } from "@/lib/financialCalendar";
import type { Advisor } from "@shared/schema";
import { BIO_OPTIONS, INDIVIDUAL_SERVICES, CORPORATE_SERVICES, DEFAULT_PROFILE_SECTION_ORDER, EMERGENCY_CONTACTS, PLATFORMS_META } from "@shared/schema";
import { BrandFooter } from "@/components/BrandFooter";
import { getThemeColors, getThemeBackground, getInitialsBadgeColors } from "@/lib/themeUtils";
import { shareOrDownloadCard, canShareCardNatively, type CardVariant } from "@/lib/businessCard";
import { NewsHero } from "@/components/NewsHero";
import { RealMoneySqueeze, TaxBite, InflationMillion, CostOfWaiting, RealityCheck, LatteMillionaire } from "@/components/MoneyShowpieces";
import { ForexWidget } from "@/components/ForexWidget";
import { FunFactsCarousel } from "@/components/FunFactsCarousel";
import { ComingSoonCard } from "@/components/tools/ComingSoonCard";
import { FinancialDashboard } from "@/components/tools/FinancialDashboard";

function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const INTERACTIVE_ROTATION_MS = 3 * 60 * 60 * 1000;

function useInteractiveToolRotation(storageKey: string, toolCount: number, enabled: boolean) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!enabled || toolCount <= 1) {
      setIndex(0);
      return;
    }

    const syncRotation = () => {
      const now = Date.now();
      try {
        const stored = JSON.parse(localStorage.getItem(storageKey) || "{}") as { index?: number; changedAt?: number };
        let nextIndex = Number.isFinite(stored.index) ? Math.abs(Math.trunc(stored.index!)) % toolCount : 0;
        let changedAt = Number.isFinite(stored.changedAt) ? stored.changedAt! : now;
        const steps = Math.floor(Math.max(0, now - changedAt) / INTERACTIVE_ROTATION_MS);

        if (steps > 0) {
          nextIndex = (nextIndex + steps) % toolCount;
          changedAt += steps * INTERACTIVE_ROTATION_MS;
        }

        localStorage.setItem(storageKey, JSON.stringify({ index: nextIndex, changedAt }));
        setIndex(nextIndex);
      } catch {
        setIndex(Math.floor(now / INTERACTIVE_ROTATION_MS) % toolCount);
      }
    };

    syncRotation();
    const intervalId = window.setInterval(syncRotation, 60_000);
    return () => window.clearInterval(intervalId);
  }, [enabled, storageKey, toolCount]);

  return index;
}

function ProfileInitialsBadge({ initials, theme, themeColor, size = 288, downloadable = false, name = "" }: {
  initials: string; theme: string; themeColor?: string | null; size?: number; downloadable?: boolean; name?: string;
}) {
  const { from, to, border } = getInitialsBadgeColors(theme, themeColor);
  const svgId = `profile-badge-svg`;
  const tc = getThemeColors(theme, themeColor);
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

type Lang = "en" | "af" | "zu";

type ServiceTrans = { name: string; description: string };

const TRANSLATIONS: Record<Lang, {
  shareProfile: string; linkCopied: string; whatsappMe: string; saveCard: string; saveContact: string;
  iosHint: string; browserHint: string; dismiss: string;
  individualServices: string; corporateServices: string;
  moneyMap: string; moneyMapSub: string;
  claimWill: string; requestCallback: string; bookMeeting: string; referFriends: string; documentsUpload: string;
  comingSoon: string;
  linkedin: string; facebook: string; instagram: string; youtube: string; website: string;
  financialMedia: string; latestNews: string; funfacts: string; tutorials: string;
  poweredBy: string;
  bioOptions: Record<string, string>;
  indServices: Record<string, ServiceTrans>;
  corpServices: Record<string, ServiceTrans>;
}> = {
  en: {
    shareProfile: "Share Profile", linkCopied: "Link Copied!", whatsappMe: "WhatsApp Me",
    saveCard: "Save Business Card", saveContact: "Save Contact Details",
    iosHint: `Tap the Share button in Safari, then choose "Add to Home Screen" to save this profile as an app icon.`,
    browserHint: `Open this page in your browser's menu and tap "Add to Home Screen" or "Install app".`,
    dismiss: "Dismiss",
    individualServices: "Individual Services", corporateServices: "Corporate Services",
    moneyMap: "Finance Hub", moneyMapSub: "Request Financial Information",
    claimWill: "Claim Your Free Will", requestCallback: "Request a Call Back", bookMeeting: "Book a Meeting",
    referFriends: "Refer Friends & Family", documentsUpload: "Documents Upload",
    comingSoon: "In development — Coming soon",
    linkedin: "Connect on LinkedIn", facebook: "Follow on Facebook",
    instagram: "Follow on Instagram", youtube: "Subscribe on YouTube", website: "Visit Website",
    financialMedia: "General Financial Media", latestNews: "Latest Financial News",
    funfacts: "Daily Financial Fun-facts", tutorials: "Financial Tutorial Videos",
    poweredBy: "Powered by Advisory Connect",
    bioOptions: {
      a: "Your single point of contact for all your financial needs and wealth planning. Please see the drop-down sections below for a concise overview of services provided.\n\nShould you wish to explore how our advisory services may add value, you are welcome to arrange a consultation at your convenience.",
      b: "Your single point of contact for your financial needs and wealth planning. Please see the drop-down sections below for a concise overview of services and solutions available. Should you, or anyone within your network, wish to discuss your requirements further, you are welcome to request a call-back or consultation at a convenient time.",
      c: "Thank you for the opportunity to share a brief overview of the value I strive to deliver to my clients.\n\nMy objective is to deliver clarity, structure, and sustainable growth through disciplined strategy and professional oversight. A concise outline of my services is available in the sections below.\n\nShould you, or anyone within your network, wish to explore how our services may add value, you are welcome to share this link, request a consultation, or arrange a call at a time that suits you. We look forward to connecting and assisting further.",
    },
    indServices: {
      "tax-efficiency": { name: "Optimise Tax Efficiency", description: "Strategic tax planning to minimise your tax burden while maintaining full compliance. We analyse your financial situation to identify legitimate tax-saving opportunities and implement structures that optimise your after-tax returns." },
      "tax-investment": { name: "Tax-free Savings Accounts", description: "Investment strategies designed to maximise returns while minimising tax impact. We structure portfolios using tax-advantaged vehicles and timing strategies to help grow your wealth more efficiently." },
      "personal-risk": { name: "Personal Protection Plan", description: "Comprehensive risk assessment and insurance solutions to protect you and your family. We evaluate your unique circumstances to recommend appropriate life, disability, and income protection cover." },
      "retirement": { name: "Retirement Planning", description: "End-to-end retirement planning from accumulation through to comfortable retirement. We help you set realistic goals, choose appropriate retirement vehicles, and plan for a sustainable income in retirement." },
      "medical-aid": { name: "Medical Aid", description: "Expert guidance on selecting the right medical aid plan for your needs and budget. We compare options across providers to ensure you get comprehensive healthcare coverage at the best possible value." },
      "short-term": { name: "Short-term Insurance", description: "Protection for your assets including home, vehicle, and personal belongings. We assess your risk profile and recommend tailored short-term insurance solutions that provide adequate cover without overpaying." },
      "wills-estates": { name: "Wills, Estates & Trusts", description: "Professional estate planning and will drafting to ensure your wishes are clearly documented and support effective estate planning and legacy protection. As part of our commitment to supporting your long-term wellbeing, we offer a complimentary Will." },
    },
    corpServices: {
      "corporate-planning": { name: "Corporate Planning", description: "Strategic financial planning for businesses. Our solutions help businesses attract, retain, and protect their most valuable assets: their people." },
      "group-risk": { name: "Group Protection Plan", description: "Comprehensive group life, disability, and income protection solutions to safeguard employees and ensure business continuity in the event of unforeseen circumstances." },
      "pension-provident": { name: "Pension/Provident Funds", description: "End-to-end retirement fund setup plans that allow employees to build their futures with contributions held in an acceptable structure." },
      "group-medical": { name: "Group Medical Aid", description: "Access to a central healthcare solution for employees. The process includes analysis to determine the best group medical aid provider." },
      "corporate-short-term": { name: "Corporate Short-Term Insurance", description: "Tailored coverage for company vehicles, equipment, offices, and facilities, with competitive premiums and comprehensive protection." },
    },
  },
  af: {
    shareProfile: "Deel Profiel", linkCopied: "Skakel Gekopieer!", whatsappMe: "WhatsApp My",
    saveCard: "Stoor Visitekaartjie", saveContact: "Stoor Kontakbesonderhede",
    iosHint: `Tik die Deel-knoppie in Safari, en kies dan "Voeg by Tuisskerm" om hierdie profiel as 'n app-ikoon te stoor.`,
    browserHint: `Maak hierdie bladsy oop in jou blaaier se kieslys en tik "Voeg by Tuisskerm" of "Installeer app".`,
    dismiss: "Toemaak",
    individualServices: "Individuele Dienste", corporateServices: "Korporatiewe Dienste",
    moneyMap: "Finance Hub", moneyMapSub: "Versoek Finansiële Inligting",
    claimWill: "Eis u Gratis Testament", requestCallback: "Versoek 'n Terugbel", bookMeeting: "Bespreek 'n Vergadering",
    referFriends: "Verwys Vriende & Familie", documentsUpload: "Laai Dokumente Op",
    comingSoon: "In ontwikkeling — Binnekort beskikbaar",
    linkedin: "Verbind op LinkedIn", facebook: "Volg op Facebook",
    instagram: "Volg op Instagram", youtube: "Teken In op YouTube", website: "Besoek Webwerf",
    financialMedia: "Finansiële Media", latestNews: "Nuutste Finansiële Nuus",
    funfacts: "Daaglikse Finansiële Feite", tutorials: "Finansiële Tutoriaalvideo's",
    poweredBy: "Aangedryf deur Advisory Connect",
    bioOptions: {
      a: "U enkel kontakpunt vir al u finansiële behoeftes en rykdomsbeplanning. Sien asseblief die afrolafdelings hieronder vir 'n bondige oorsig van dienste wat gelewer word.\n\nSkuld u dit aan uself om te ondersoek hoe ons adviesdienste waarde kan toevoeg, is u welkom om 'n konsultasie na u gerief te reël.",
      b: "U enkel kontakpunt vir u finansiële behoeftes en rykdomsbeplanning. Sien asseblief die afrolafdelings hieronder vir 'n bondige oorsig van beskikbare dienste en oplossings. Indien u, of enigiemand in u netwerk, u vereistes verder wil bespreek, is u welkom om 'n terugbel of konsultasie op 'n geskikte tyd te versoek.",
      c: "Dankie vir die geleentheid om 'n kort oorsig te deel van die waarde wat ek probeer lewer aan my kliënte.\n\nMy doel is om duidelikheid, struktuur en volhoubare groei te lewer deur gedissiplineerde strategie en professionele toesig. 'n Bondige uiteensetting van my dienste is beskikbaar in die afdelings hieronder.\n\nSkuld u, of enigiemand in u netwerk, dit om te ondersoek hoe ons dienste waarde kan toevoeg, is u welkom om hierdie skakel te deel, 'n konsultasie te versoek, of 'n gesprek te reël op 'n tyd wat u pas. Ons sien uit daarna om verder te verbind en te help.",
    },
    indServices: {
      "tax-efficiency": { name: "Optimiseer Belastingdoeltreffendheid", description: "Strategies belastingbeplanning om u belastinglas te minimeer terwyl volle nakoming gehandhaaf word. Ons ontleed u finansiële situasie om wettige belastingbesparingsgeleenthede te identifiseer en strukture te implementeer wat u na-belasting opbrengste optimiseer." },
      "tax-investment": { name: "Belastingvrye Spaarrekeninge", description: "Beleggingstrategieë ontwerp om opbrengste te maksimeer terwyl belastingimpak gemimiseer word. Ons struktureer portefeuljes met belastingbevoordeelde voertuie en tydstrategieë om u rykdom doeltreffender te laat groei." },
      "personal-risk": { name: "Persoonlike Beskermingsplan", description: "Omvattende risikobeoordeling en versekeringsoplossings om u en u gesin te beskerm. Ons evalueer u unieke omstandighede om gepaste lewens-, ongeskiktheids- en inkomstebeskermingsdekking aan te beveel." },
      "retirement": { name: "Aftreebeplanning", description: "Volledige aftreebeplanning van akkumulasie tot gemaklike aftrede. Ons help u om realistiese doelwitte te stel, gepaste aftreevoertuie te kies, en te beplan vir 'n volhoubare inkomste met aftrede." },
      "medical-aid": { name: "Mediese Hulp", description: "Kundige leiding oor die keuse van die regte mediese hulpplan vir u behoeftes en begroting. Ons vergelyk opsies oor verskaffers heen om te verseker dat u omvattende gesondheidsorgdekking teen die beste moontlike waarde kry." },
      "short-term": { name: "Korttermynversekering", description: "Beskerming vir u bates insluitend huis, voertuig en persoonlike besittings. Ons assesseer u risikoprofiel en beveel gepaste korttermynversekeringsoplossings aan wat voldoende dekking bied sonder oorbetaling." },
      "wills-estates": { name: "Testamente, Boedels & Trusts", description: "Professionele boedelbeplanning en opstel van testamente om te verseker dat u wense duidelik gedokumenteer is en effektiewe boedelbeplanning en erfenisbeskerming ondersteun. As deel van ons verbintenis tot u langtermyn welstand, bied ons 'n gratis Testament aan." },
    },
    corpServices: {
      "corporate-planning": { name: "Korporatiewe Beplanning", description: "Strategies finansiële beplanning vir besighede. Ons oplossings help besighede om hul mees waardevolle bates aan te trek, te behou en te beskerm: hul mense." },
      "group-risk": { name: "Groepsbeskermingsplan", description: "Omvattende groepslewe-, ongeskiktheids- en inkomstebeskermingsoplossings om werknemers te beskerm en besigheidskontinuïteit te verseker in die geval van onvoorsiene omstandighede." },
      "pension-provident": { name: "Pensioen/Voorsieningsfondse", description: "Volledige opstel van aftreefondse wat werknemers in staat stel om hul toekoms te bou met bydraes in 'n aanvaarbare struktuur." },
      "group-medical": { name: "Groep Mediese Hulp", description: "Toegang tot 'n sentrale gesondheidsorgoplossing vir werknemers. Die proses sluit ontleding in om die beste groep mediese hulpverskaffer te bepaal." },
      "corporate-short-term": { name: "Korporatiewe Korttermynversekering", description: "Pasgemaakte dekking vir maatskappyvoertuie, toerusting, kantore en fasiliteite, met mededingende premies en omvattende beskerming." },
    },
  },
  zu: {
    shareProfile: "Yabelana Ngeprofile", linkCopied: "Isikhopishiwe!", whatsappMe: "Ngi-WhatsApp",
    saveCard: "Gcina Ikhadi Lebhizinisi", saveContact: "Gcina Imininingwane Yoxhumano",
    iosHint: `Thepha inkinobho yeShayi ku-Safari, bese ukhetha "Engeza Esikrini Sasekhaya" ukuze ugcine le profile njenge-icon ye-app.`,
    browserHint: `Vula leli khasi kumenyu yebrowser yakho bese uthepha "Engeza Esikrini" noma "Faka i-app".`,
    dismiss: "Vala",
    individualServices: "Izinsiza Zabantu Siqu", corporateServices: "Izinsiza Zezinkampani",
    moneyMap: "Finance Hub", moneyMapSub: "Cela Ulwazi Lwezezimali",
    claimWill: "Thatha Ithestamente Lakho Mahhala", requestCallback: "Cela Ukubizwa Futhi", bookMeeting: "Buka Umhlangano",
    referFriends: "Phendukela Izihlobo Nabangane", documentsUpload: "Layisha Amaxwebe",
    comingSoon: "Iyakhiwa — Iyoza Maduze",
    linkedin: "Xhumana ku-LinkedIn", facebook: "Landelela ku-Facebook",
    instagram: "Landelela ku-Instagram", youtube: "Bhalisela ku-YouTube", website: "Vakashela Iwebhusayithi",
    financialMedia: "Imidiya Yezezimali", latestNews: "Izindaba Zakamuva Zezezimali",
    funfacts: "Izinto Ezinomdlandla Zezezimali Nsuku Zonke", tutorials: "Amavidiyo Okufundisa Ngezezimali",
    poweredBy: "Inikwa Amandla ngu-Advisory Connect",
    bioOptions: {
      a: "Uxhumano lwakho olulodwa lwazo zonke izidingo zakho zezimali kanye nohlelo lwengcebo. Sicela ubheke izigaba ezishushumbayo ngezansi ukuze uthole uhlolojikelele olufushane lwezinsiza ezinikezwa.\n\nUma ufisa ukuhlola ukuthi izinsiza zethu zokweluleka zingengeza kanjani inani, wamukelekile ukuhlela ukubonana ngesikhathi esikufanele.",
      b: "Uxhumano lwakho olulodwa lwezidingo zakho zezimali nohlelo lwengcebo. Sicela ubheke izigaba ezishushumbayo ngezansi ukuze uthole uhlolojikelele olufushane lwezinsiza nezixazululo ezikhona. Uma wena, noma noma ubani emphakathini wakho, efisa ukuxoxa izidingo zakho ukwengeziwe, wamukelekile ukucela ukubizwa noma ukubonana ngesikhathi esihambisana nawe.",
      c: "Ngiyabonga ngethuba lokwabelana ngehlolojikelele elifushane lwamanani engizama ukunikezela ngawo kubaxhasi bami.\n\nInhloso yami ukuhlinzeka ngokusobala, uhlaka, nokukhula okuqhubekayo ngokulandela isu eliphucukile kanye nokubhekwa okungokomzila. Uhlolojikelele olufushane lwezinsiza zami luyatholakala ezigabeni ezingezansi.\n\nUma wena, noma noma ubani emphakathini wakho, efisa ukuhlola ukuthi izinsiza zethu zingengeza kanjani inani, wamukelekile ukwabelana nale link, ucele ukubonana, noma uhlele ucingo ngesikhathi esikufanele. Sibheke phambili ukuxhumana nokusize ukwengeziwe.",
    },
    indServices: {
      "tax-efficiency": { name: "Hambisa Ukusebenza Kahle Kwerentisi", description: "Ukuhlelwa ngokuhlakanipha kwerentisi ukunciphisa umthwalo wakho werentisi ngokugcina ukuhlonishwa okugcwele. Siphenywa isimo sakho sezimali ukuze sichane amathuba esemthethweni okonga irentisi bese sisebenzisa izinhlaka eziphumelelisa imiphumela yakho ngemuva kwerentisi." },
      "tax-investment": { name: "Ama-Akhawunti Okonga Makhululi Erentisi", description: "Amasu okutshalwa kwemali aklanywe ukuze aphakamise inzuzo kunciphiswe umthelela werentisi. Sihlelela amafomethi amaportfolio esebenzisa izimali ezinemiphumela yerentisi kanye namasu wesikhathi ukuze inani lakho likhule kahle." },
      "personal-risk": { name: "Uhlelo Lokuvikelwa Komuntu", description: "Ukuhlolwa kwebhizinisi ngokukhulu kanye nezixazululo zomshwalense ukuvikela wena nomndeni wakho. Sihlola izimo zakho ezihlukile ukuze sisikisele amahlelo afanelekile empilo, ukukhulula, kanye nokukhusela inzuzo." },
      "retirement": { name: "Ukuhlelwa Komhlalaphansi", description: "Ukuhlelwa komhlalaphansi okuphelele kusukela ekuqoqeni kuze kube umhlalaphansi ojababulayo. Sikusize ukubeka izinhloso ezifanele, ukukhetha izimali ezifanelekile zomhlalaphansi, nokuhlela izinzuzo ezihlala zikhona ekuphumeni emsebenzini." },
      "medical-aid": { name: "Usizo Lezempilo", description: "Iseluleko esinolwazi ekukhetheni uhlelo lokusiza lwezempilo olufanelekile izidingo zakho nezimali. Siqhathanisa izinketho kubanikeli ukuqinisekisa ukuthi uthole ukuvikelwa kwezempilo okuphelele ngenani eliphaqa." },
      "short-term": { name: "Umshwalense Wesikhathi Esifushane", description: "Ukuvikelwa kwempahla yakho okufaka ikhaya, imoto, nazo zonke izimpahla zakho. Sihlola iprofile yakho yobungozi bese sisikisela izixazululo zomshwalense zesikhathi esifushane ezifanelekile ezinikeza ukuphathwa okufanele ngaphandle kokukhokha ngokweqile." },
      "wills-estates": { name: "Amachwane, Amafa Nezitrust", description: "Ukuhlelwa kwedlela ngokwemfundi kanye nokubhalwa kwamachwane ukuqinisekisa ukuthi izifiso zakho zibhalwe ngokusobala futhi zisekele ukuhlelwa kwedlela okusebenzayo kanye nokunakwa kwamagugu. Njengengxenye yokuzibophezela kwethu ekusekeleni impilo yakho yesikhathi eside, sinikeza iChwane olukhululekile." },
    },
    corpServices: {
      "corporate-planning": { name: "Ukuhlelwa Kwezinkampani", description: "Ukuhlelwa kwezimali ngokuhlakanipha kwamabhizinisi. Izixazululo zethu zisiza amabhizinisi ukuheha, ukugcina, nokuvikela impahla yawo ebalulekile: abantu bawo." },
      "group-risk": { name: "Uhlelo Lokuvikelwa Kweqembu", description: "Izixazululo eziphelelwe zokuphila kweqembu, ukukhulula, kanye nokukhusela inzuzo ukuvikela abasebenzi nokuqinisekisa ukuqhubeka kwebhizinisi uma kukhona izimo ezingalindelekile." },
      "pension-provident": { name: "Izimali Zomhlalaphansi/Izimali Zokunakekela", description: "Ukusetiwa kwezimali zomhlalaphansi ukuvumela abasebenzi ukuthi bakhe ikusasa labo ngeminikelo ephethwe ohlelweni olwamukelekile." },
      "group-medical": { name: "Usizo Lezempilo Leqembu", description: "Ukufinyelela isixazululo esiphakathi sezempilo sabasebenzi. Inqubo ifaka ukuhlaziya ukuze kuqondakale isikhungo esisiza abasebenzi ngezempilo." },
      "corporate-short-term": { name: "Umshwalense Wesikhathi Esifushane Wenkampani", description: "Ukuvikelwa okulungiselwe izimoto zenkampani, izinsizakalo, amahhovisi, nezindawo, ngezilinganiso zokukhokhela ezikhahlamezayo kanye nokunakekelwa okuphelele." },
    },
  },
};

function Step({ num, text, color }: { num: number; text: string; color: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: `${color}22`, color }}>
        {num}
      </div>
      <p className="text-sm leading-snug">{text}</p>
    </div>
  );
}

function EmergencyContactsSection({ tc, accentColor, mutedText, t }: {
  tc: ReturnType<typeof getThemeColors>; accentColor: string; mutedText: string; t: any;
}) {
  const [open, setOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const selected = EMERGENCY_CONTACTS.find(c => c.key === selectedKey);

  return (
    <div data-testid="section-emergency-contacts">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#dc2626", color: "#fff" }}
        data-testid="button-emergency-contacts"
      >
        <AlertCircle className="h-4 w-4" /> Emergency Contacts
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div
          className="mt-2 rounded-xl p-2 space-y-1.5"
          style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}
        >
          <p className="text-[11px] px-1 pt-1 pb-0.5" style={{ color: mutedText }}>
            Tap a service to dial directly from your phone.
          </p>
          {EMERGENCY_CONTACTS.map(c => (
            <a
              key={c.key}
              href={`tel:${c.number}`}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-opacity hover:opacity-90 active:opacity-75"
              style={{ backgroundColor: "rgba(220,38,38,0.10)", border: "1px solid rgba(220,38,38,0.35)" }}
              data-testid={`button-call-${c.key}`}
            >
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#dc2626" }}
              >
                <Phone className="h-4 w-4" style={{ color: "#fff" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold leading-tight truncate" style={{ color: tc.textColor }}>{c.label}</div>
                <div className="text-[11px] mt-0.5" style={{ color: mutedText }}>{c.number}</div>
              </div>
              <span className="text-[11px] font-semibold px-2 py-1 rounded-md flex-shrink-0" style={{ backgroundColor: "#dc2626", color: "#fff" }}>Call</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Task #29 — Public Profile Feature Suite ──────────────────────────────
// Five small, self-contained section components. Each takes a `tc` (theme
// colours) + `advisor` and renders a card that matches the rest of the
// public profile's styling. Hooks live inside each component so the parent
// sectionMap stays a pure value map.

export function TradingViewSection({ tc, advisor }: { tc: ReturnType<typeof getThemeColors>; advisor: Advisor }) {
  const symbolsCsv = (advisor as any).tradingViewSymbols as string | null;
  const symbols = (symbolsCsv && symbolsCsv.trim()
    ? symbolsCsv.split(",").map(s => s.trim()).filter(Boolean)
    : ["FX_IDC:USDZAR", "JSE:J203", "TVC:GOLD"]
  ).slice(0, 8);
  const hostRef = useRef<HTMLDivElement>(null);

  // TradingView's loader script walks up from the <script> tag looking for
  // an element with class "tradingview-widget-container" and paints into a
  // child ".tradingview-widget-container__widget". The original mount was a
  // bare <div id> with no wrapper class, so the loader silently no-op'd.
  // Re-mount whenever symbols or theme change. StrictMode-safe because we
  // clear the host element before appending.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.innerHTML = "";
    const container = document.createElement("div");
    container.className = "tradingview-widget-container";
    container.style.width = "100%";
    container.style.height = "400px";
    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    widget.style.width = "100%";
    widget.style.height = "100%";
    container.appendChild(widget);
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      symbols: symbols.map(s => [s.split(":").pop() || s, s + "|1D"]),
      chartOnly: false,
      width: "100%",
      height: "100%",
      locale: "en",
      colorTheme: tc.isDark ? "dark" : "light",
      autosize: true,
      showVolume: false,
      showMA: false,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: false,
      scalePosition: "right",
      scaleMode: "Normal",
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: "10",
      noTimeScale: false,
      valuesTracking: "1",
      changeMode: "price-and-percent",
      lineWidth: 2,
      lineType: 0,
      dateRanges: ["1d|1", "1m|30", "3m|60", "12m|1D", "60m|1W", "all|1M"],
    });
    container.appendChild(script);
    host.appendChild(container);
    return () => { host.innerHTML = ""; };
  }, [symbolsCsv, tc.isDark]);

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }} data-testid="section-tradingview">
      <div className="flex items-center gap-2">
        <LineChart className="h-4 w-4" style={{ color: tc.accentColor }} />
        <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Live Markets</h3>
      </div>
      <p className="text-xs" style={{ color: tc.mutedText }}>
        Live chart data via TradingView. Tracking {symbols.length} instrument{symbols.length === 1 ? "" : "s"}.
      </p>
      <div ref={hostRef} style={{ minHeight: 400, width: "100%" }} />
      <p className="text-[10px] text-center" style={{ color: tc.mutedText }}>
        Powered by TradingView · Prices for illustration only, not investment advice.
      </p>
    </div>
  );
}

export function DailyQuoteSection({ tc, advisor }: { tc: ReturnType<typeof getThemeColors>; advisor: Advisor }) {
  const set = (((advisor as any).dailyQuotesSet as QuoteSet) || "general");
  const q = useMemo(() => getQuoteForToday(set), [set]);
  const [sharing, setSharing] = useState(false);
  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try { await shareQuoteAsPng({ quote: q, set, advisorName: advisor.name }); }
    catch (e) { console.error("[quote-share] failed", e); }
    finally { setSharing(false); }
  };
  return (
    <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }} data-testid="section-dailyquote">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Quote className="h-4 w-4" style={{ color: tc.accentColor }} />
          <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Quote of the Day</h3>
        </div>
        <button
          type="button"
          onClick={handleShare}
          disabled={sharing}
          aria-label="Share quote as image"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium disabled:opacity-50"
          style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor, border: `1px solid ${tc.borderColor}` }}
          data-testid="button-share-quote"
        >
          {sharing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Share2 className="h-3 w-3" />}
          {sharing ? "Sharing…" : "Share"}
        </button>
      </div>
      <blockquote className="text-sm leading-relaxed italic" style={{ color: tc.textColor }} data-testid="text-quote-text">
        "{q.text}"
      </blockquote>
      <p className="text-xs text-right font-medium" style={{ color: tc.accentColor }} data-testid="text-quote-author">— {q.author}</p>
    </div>
  );
}

export function CompoundCalcSection({ tc }: { tc: ReturnType<typeof getThemeColors> }) {
  const [principal, setPrincipal] = useState("10000");
  const [monthly, setMonthly] = useState("1000");
  const [rate, setRate] = useState("9");
  const [years, setYears] = useState("20");

  const result = useMemo(() => {
    const P = parseFloat(principal) || 0;
    const PMT = parseFloat(monthly) || 0;
    const r = (parseFloat(rate) || 0) / 100;
    const t = parseFloat(years) || 0;
    const n = 12;
    let total = P;
    const series: { year: number; value: number; contributions: number }[] = [{ year: 0, value: P, contributions: P }];
    let contributions = P;
    for (let y = 1; y <= t; y++) {
      for (let m = 0; m < n; m++) {
        total = total * (1 + r / n) + PMT;
        contributions += PMT;
      }
      series.push({ year: y, value: total, contributions });
    }
    return { total, contributions, interest: total - contributions, series };
  }, [principal, monthly, rate, years]);

  const fmt = (v: number) => `R ${Math.round(v).toLocaleString("en-ZA")}`;
  const inputStyle = { backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor };
  const maxVal = result.series[result.series.length - 1]?.value || 1;

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }} data-testid="section-compoundcalc">
      <div className="flex items-center gap-2">
        <Calculator className="h-4 w-4" style={{ color: tc.accentColor }} />
        <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Compound Interest Calculator</h3>
      </div>
      <p className="text-xs" style={{ color: tc.mutedText }}>See what consistent saving + compound growth can do over time.</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1"><span className="text-xs" style={{ color: tc.mutedText }}>Starting amount (R)</span>
          <input type="number" value={principal} onChange={e => setPrincipal(e.target.value)} className="w-full px-2 py-1.5 rounded-md text-sm outline-none" style={inputStyle} data-testid="input-ci-principal" />
        </label>
        <label className="space-y-1"><span className="text-xs" style={{ color: tc.mutedText }}>Monthly contribution (R)</span>
          <input type="number" value={monthly} onChange={e => setMonthly(e.target.value)} className="w-full px-2 py-1.5 rounded-md text-sm outline-none" style={inputStyle} data-testid="input-ci-monthly" />
        </label>
        <label className="space-y-1"><span className="text-xs" style={{ color: tc.mutedText }}>Annual return (%)</span>
          <input type="number" step="0.5" value={rate} onChange={e => setRate(e.target.value)} className="w-full px-2 py-1.5 rounded-md text-sm outline-none" style={inputStyle} data-testid="input-ci-rate" />
        </label>
        <label className="space-y-1"><span className="text-xs" style={{ color: tc.mutedText }}>Term (years)</span>
          <input type="number" value={years} onChange={e => setYears(e.target.value)} className="w-full px-2 py-1.5 rounded-md text-sm outline-none" style={inputStyle} data-testid="input-ci-years" />
        </label>
      </div>
      <div className="rounded-lg p-3 space-y-1.5" style={{ backgroundColor: tc.inputBg }}>
        <div className="flex justify-between text-xs"><span style={{ color: tc.mutedText }}>Future value</span><span className="font-bold" style={{ color: tc.accentColor }} data-testid="text-ci-total">{fmt(result.total)}</span></div>
        <div className="flex justify-between text-xs"><span style={{ color: tc.mutedText }}>Total contributions</span><span style={{ color: tc.textColor }}>{fmt(result.contributions)}</span></div>
        <div className="flex justify-between text-xs"><span style={{ color: tc.mutedText }}>Interest earned</span><span style={{ color: tc.textColor }}>{fmt(result.interest)}</span></div>
      </div>
      <div className="space-y-1" style={{ borderTop: `1px solid ${tc.borderColor}`, paddingTop: 8 }}>
        <p className="text-[11px] font-medium" style={{ color: tc.mutedText }}>Growth over time</p>
        <div className="flex items-end gap-0.5 h-20">
          {result.series.map((p, i) => {
            const h = Math.max(2, (p.value / maxVal) * 100);
            return <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, backgroundColor: tc.accentColor, opacity: 0.4 + 0.6 * (i / result.series.length) }} title={`Year ${p.year}: ${fmt(p.value)}`} />;
          })}
        </div>
        <div className="flex justify-between text-[10px]" style={{ color: tc.mutedText }}>
          <span>Year 0</span><span>Year {years}</span>
        </div>
      </div>
      <p className="text-[10px] text-center" style={{ color: tc.mutedText }}>Educational only — fees, tax and inflation are not modelled. Speak to an advisor for personalised advice.</p>
    </div>
  );
}

export function RetirementCalcSection({ tc }: { tc: ReturnType<typeof getThemeColors> }) {
  const [currentAge, setCurrentAge] = useState("35");
  const [retireAge, setRetireAge] = useState("65");
  const [savings, setSavings] = useState("250000");
  const [monthly, setMonthly] = useState("3000");
  const [returnPct, setReturnPct] = useState("9");
  const [targetMonthly, setTargetMonthly] = useState("25000");

  const result = useMemo(() => {
    const start = parseFloat(currentAge) || 0;
    const end = parseFloat(retireAge) || 0;
    const t = Math.max(0, end - start);
    const P = parseFloat(savings) || 0;
    const PMT = parseFloat(monthly) || 0;
    const r = (parseFloat(returnPct) || 0) / 100;
    const target = parseFloat(targetMonthly) || 0;
    const n = 12;
    let total = P;
    for (let m = 0; m < t * n; m++) total = total * (1 + r / n) + PMT;
    // Sustainable withdrawal at 4% (Bengen) — conservative.
    const sustainableMonthly = (total * 0.04) / 12;
    const yearsCovered = target > 0 ? total / (target * 12) : Infinity;
    return { total, sustainableMonthly, yearsCovered, t };
  }, [currentAge, retireAge, savings, monthly, returnPct, targetMonthly]);

  const fmt = (v: number) => `R ${Math.round(v).toLocaleString("en-ZA")}`;
  const inputStyle = { backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor };
  const onTrack = result.sustainableMonthly >= (parseFloat(targetMonthly) || 0);

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }} data-testid="section-retirementcalc">
      <div className="flex items-center gap-2">
        <PiggyBank className="h-4 w-4" style={{ color: tc.accentColor }} />
        <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Retirement Savings Calculator</h3>
      </div>
      <p className="text-xs" style={{ color: tc.mutedText }}>Project your retirement pot and see whether it'll cover the lifestyle you want.</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1"><span className="text-xs" style={{ color: tc.mutedText }}>Current age</span>
          <input type="number" value={currentAge} onChange={e => setCurrentAge(e.target.value)} className="w-full px-2 py-1.5 rounded-md text-sm outline-none" style={inputStyle} data-testid="input-ret-age" />
        </label>
        <label className="space-y-1"><span className="text-xs" style={{ color: tc.mutedText }}>Retirement age</span>
          <input type="number" value={retireAge} onChange={e => setRetireAge(e.target.value)} className="w-full px-2 py-1.5 rounded-md text-sm outline-none" style={inputStyle} data-testid="input-ret-retire" />
        </label>
        <label className="space-y-1"><span className="text-xs" style={{ color: tc.mutedText }}>Current savings (R)</span>
          <input type="number" value={savings} onChange={e => setSavings(e.target.value)} className="w-full px-2 py-1.5 rounded-md text-sm outline-none" style={inputStyle} data-testid="input-ret-savings" />
        </label>
        <label className="space-y-1"><span className="text-xs" style={{ color: tc.mutedText }}>Monthly contribution (R)</span>
          <input type="number" value={monthly} onChange={e => setMonthly(e.target.value)} className="w-full px-2 py-1.5 rounded-md text-sm outline-none" style={inputStyle} data-testid="input-ret-monthly" />
        </label>
        <label className="space-y-1"><span className="text-xs" style={{ color: tc.mutedText }}>Expected return (%)</span>
          <input type="number" step="0.5" value={returnPct} onChange={e => setReturnPct(e.target.value)} className="w-full px-2 py-1.5 rounded-md text-sm outline-none" style={inputStyle} data-testid="input-ret-return" />
        </label>
        <label className="space-y-1"><span className="text-xs" style={{ color: tc.mutedText }}>Target monthly income (R)</span>
          <input type="number" value={targetMonthly} onChange={e => setTargetMonthly(e.target.value)} className="w-full px-2 py-1.5 rounded-md text-sm outline-none" style={inputStyle} data-testid="input-ret-target" />
        </label>
      </div>
      <div className="rounded-lg p-3 space-y-1.5" style={{ backgroundColor: tc.inputBg }}>
        <div className="flex justify-between text-xs"><span style={{ color: tc.mutedText }}>Years to retirement</span><span style={{ color: tc.textColor }}>{result.t}</span></div>
        <div className="flex justify-between text-xs"><span style={{ color: tc.mutedText }}>Projected pot at retirement</span><span className="font-bold" style={{ color: tc.accentColor }} data-testid="text-ret-pot">{fmt(result.total)}</span></div>
        <div className="flex justify-between text-xs"><span style={{ color: tc.mutedText }}>Sustainable income (4% rule)</span><span style={{ color: tc.textColor }}>{fmt(result.sustainableMonthly)}/mo</span></div>
        <div className="flex justify-between text-xs">
          <span style={{ color: tc.mutedText }}>vs target</span>
          <span className="font-semibold" style={{ color: onTrack ? "#10B981" : "#F59E0B" }} data-testid="text-ret-status">
            {onTrack ? "On track" : `Shortfall — ${result.yearsCovered === Infinity ? "set a target" : `${result.yearsCovered.toFixed(1)} yrs covered`}`}
          </span>
        </div>
      </div>
      <p className="text-[10px] text-center" style={{ color: tc.mutedText }}>Educational only — does not model inflation, tax, or fees. Speak to an advisor for personalised advice.</p>
    </div>
  );
}

function getEasterPub(year: number) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  return new Date(year, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1);
}
function getSAHolidaysPub(year: number): Record<string, string> {
  const easter = getEasterPub(year);
  const gf = new Date(easter); gf.setDate(easter.getDate() - 2);
  const fd = new Date(easter); fd.setDate(easter.getDate() + 1);
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  return {
    [`${year}-01-01`]: "New Year's Day", [`${year}-03-21`]: "Human Rights Day",
    [fmt(gf)]: "Good Friday", [fmt(fd)]: "Family Day", [`${year}-04-27`]: "Freedom Day",
    [`${year}-05-01`]: "Workers' Day", [`${year}-06-16`]: "Youth Day",
    [`${year}-08-09`]: "National Women's Day", [`${year}-09-24`]: "Heritage Day",
    [`${year}-12-16`]: "Day of Reconciliation", [`${year}-12-25`]: "Christmas Day", [`${year}-12-26`]: "Day of Goodwill",
  };
}
const PUB_MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const PUB_DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];

export function FinancialCalendarSection({ tc }: { tc: ReturnType<typeof getThemeColors> }) {
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const saHolidays = getSAHolidaysPub(calYear);
  const calFirstDay = new Date(calYear, calMonth, 1).getDay();
  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const calPrevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); };
  const calNextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); };
  const holidaysThisMonth = Object.entries(saHolidays).filter(([k]) => k.startsWith(`${calYear}-${String(calMonth+1).padStart(2,'0')}`));

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }} data-testid="section-financialcalendar">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4" style={{ color: tc.accentColor }} />
        <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Financial Calendar</h3>
      </div>
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={calPrevMonth} className="p-1.5 rounded-lg hover:opacity-70" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor }}>
          <ChevronDown className="h-4 w-4 rotate-90" />
        </button>
        <p className="text-sm font-semibold" style={{ color: tc.textColor }}>{PUB_MONTH_NAMES[calMonth]} {calYear}</p>
        <button type="button" onClick={calNextMonth} className="p-1.5 rounded-lg hover:opacity-70" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor }}>
          <ChevronDown className="h-4 w-4 -rotate-90" />
        </button>
      </div>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5">
        {PUB_DAY_NAMES.map(d => (
          <div key={d} className="text-center text-xs font-medium py-1" style={{ color: d === "Su" || d === "Sa" ? tc.accentColor : tc.mutedText }}>{d}</div>
        ))}
      </div>
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: calFirstDay }, (_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: calDaysInMonth }, (_, i) => {
          const day = i + 1;
          const dateKey = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const isToday = dateKey === todayKey;
          const holiday = saHolidays[dateKey];
          const dow = (calFirstDay + i) % 7;
          const isWeekend = dow === 0 || dow === 6;
          return (
            <div key={day} title={holiday || ""} className="relative text-center text-xs py-1.5 rounded-md cursor-default" style={{
              backgroundColor: isToday ? tc.accentColor : holiday ? tc.buttonSecondaryBg : "transparent",
              color: isToday ? tc.buttonText : holiday ? tc.accentColor : isWeekend ? tc.accentColor : tc.textColor,
              fontWeight: isToday || holiday ? 700 : isWeekend ? 500 : 400,
            }}>
              {day}
              {holiday && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ backgroundColor: tc.accentColor }} />}
            </div>
          );
        })}
      </div>
      {/* Holidays this month */}
      {holidaysThisMonth.length > 0 && (
        <div className="rounded-lg p-3 space-y-1.5" style={{ backgroundColor: tc.inputBg }}>
          <p className="text-xs font-semibold mb-1" style={{ color: tc.accentColor }}>Public Holidays This Month</p>
          {holidaysThisMonth.sort(([a],[b]) => a.localeCompare(b)).map(([dateKey, name]) => {
            const day = parseInt(dateKey.split("-")[2]);
            return (
              <div key={dateKey} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: tc.textColor }}>{name}</span>
                <span className="text-xs font-medium" style={{ color: tc.mutedText }}>{day} {PUB_MONTH_NAMES[calMonth].slice(0,3)}</span>
              </div>
            );
          })}
        </div>
      )}
      {/* SA Financial Events */}
      <div className="rounded-lg p-3 space-y-1.5" style={{ backgroundColor: tc.inputBg }}>
        <p className="text-xs font-semibold mb-1" style={{ color: tc.accentColor }}>SA Financial Events 2026</p>
        {SA_FINANCIAL_EVENTS_2026
          .filter(e => new Date(e.date) >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((ev, idx) => {
          const d = new Date(ev.date);
          const colour = getCategoryColor(ev.category);
          return (
            <div key={`${ev.date}-${idx}`} className="flex items-start gap-2 py-1">
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-full mt-0.5" style={{ backgroundColor: `${colour}22`, color: colour, minWidth: 44, textAlign: "center" }}>{ev.category}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ color: tc.textColor }}>{ev.title}</p>
                {ev.detail && <p className="text-[10px]" style={{ color: tc.mutedText }}>{ev.detail}</p>}
              </div>
              <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: tc.mutedText }}>{d.getDate()} {PUB_MONTH_NAMES[d.getMonth()].slice(0,3)}</span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-center" style={{ color: tc.mutedText }}>2026 dates. Always verify against SARB, SARS and JSE official notices.</p>
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

  // S7: profileStats query removed — views counter no longer rendered on the
  // public profile. Stats now live in the advisor's panel (Stats tab + heading).

  const [lang, setLang] = useState<Lang>("en");
  const [profilePicBroken, setProfilePicBroken] = useState(false);
  const [inDevClicked, setInDevClicked] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState<string | null>(null);
  const [financialMediaOpen, setFinancialMediaOpen] = useState(false);
  const [inDevFinancial, setInDevFinancial] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  // Task #28 — business-card share dialog state
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [cardVariant, setCardVariant] = useState<CardVariant>("portrait");
  const [cardBusy, setCardBusy] = useState<"share" | "download" | null>(null);
  const [cardStatus, setCardStatus] = useState<string | null>(null);
  const [showInstallHint, setShowInstallHint] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [openTool, setOpenTool] = useState<string | null>(null);
  const [taxIncome, setTaxIncome] = useState("");
  const [taxAge, setTaxAge] = useState("35");
  const [erAmount, setErAmount] = useState("1000");
  const [erFrom, setErFrom] = useState("ZAR");
  const [erTo, setErTo] = useState("USD");
  const [erRates, setErRates] = useState<Record<string, number> | null>(null);
  const [erLoading, setErLoading] = useState(false);
  const [ciPrincipal, setCiPrincipal] = useState("10000");
  const [ciRate, setCiRate] = useState("8");
  const [ciYears, setCiYears] = useState("10");
  const [ciMonthly, setCiMonthly] = useState("500");
  const [vehPrice, setVehPrice] = useState("350000");
  const [vehDeposit, setVehDeposit] = useState("70000");
  const [vehRate, setVehRate] = useState("11.75");
  const [vehMonths, setVehMonths] = useState("60");
  const [vehBalloon, setVehBalloon] = useState("0");
  // 30-Year Reality Check — fun shock-factor tool
  // Reality Check + Latte Millionaire state moved into the components themselves
  // (client/src/components/MoneyShowpieces.tsx) so the same widgets render
  // identically here and inside the advisor-panel preview drop-downs.
  // Bond / Home Loan Calculator
  const [bondAmount, setBondAmount] = useState("1500000");
  const [bondRate, setBondRate] = useState("11.75");
  const [bondTerm, setBondTerm] = useState("20");
  // Emergency Fund Calculator
  const [efMonthly, setEfMonthly] = useState("25000");
  const [efMonths, setEfMonths] = useState("6");
  // Life Cover Needs Calculator
  const [lcIncome, setLcIncome] = useState("25000");
  const [lcYears, setLcYears] = useState("10");
  const [lcExisting, setLcExisting] = useState("0");
  // Debt Payoff Calculator
  const [dpDebt, setDpDebt] = useState("150000");
  const [dpRate, setDpRate] = useState("20");
  const [dpPayment, setDpPayment] = useState("3000");
  const interactiveToolCount = advisor ? [
    (advisor as any).showShowpieceSqueeze !== false,
    (advisor as any).showShowpieceTaxBite !== false,
    (advisor as any).showShowpieceInflation !== false,
    (advisor as any).showShowpieceWaiting !== false,
    (advisor as any).showToolReality !== false,
    (advisor as any).showToolLatte !== false,
  ].filter(Boolean).length : 0;
  const rotateInteractiveTools = !!(advisor as any)?.rotateInteractiveTools;
  const interactiveRotationIndex = useInteractiveToolRotation(
    `advisory-connect:interactive-tool:${slug}`,
    interactiveToolCount,
    rotateInteractiveTools,
  );
  // Pension + CGT calculators removed pre-presentation (Task #22 W1 T1) —
  // accuracy concerns on edge cases. DB columns show_tool_pension /
  // show_tool_cgt retained per additive-only convention but no longer read.
  // Standard Calculator (T#43 parity)
  const [stdDisplay, setStdDisplay] = useState("0");
  const [stdPrev, setStdPrev] = useState<string | null>(null);
  const [stdOp, setStdOp] = useState<string | null>(null);
  const [stdFresh, setStdFresh] = useState(false);
  const stdPress = (val: string) => {
    if (val === "C") { setStdDisplay("0"); setStdPrev(null); setStdOp(null); setStdFresh(false); return; }
    if (val === "±") { setStdDisplay(d => d.startsWith("-") ? d.slice(1) : d === "0" ? "0" : "-" + d); return; }
    if (val === "%") { setStdDisplay(d => String(parseFloat(d) / 100)); return; }
    if (["+", "−", "×", "÷"].includes(val)) { setStdPrev(stdDisplay); setStdOp(val); setStdFresh(true); return; }
    if (val === "=") {
      if (!stdOp || !stdPrev) return;
      const a = parseFloat(stdPrev), b = parseFloat(stdDisplay);
      let r = a;
      if (stdOp === "+") r = a + b;
      else if (stdOp === "−") r = a - b;
      else if (stdOp === "×") r = a * b;
      else if (stdOp === "÷") r = b !== 0 ? a / b : 0;
      setStdDisplay(String(parseFloat(r.toFixed(10))));
      setStdPrev(null); setStdOp(null); setStdFresh(false); return;
    }
    if (val === ".") { setStdDisplay(d => (stdFresh ? "0." : d.includes(".") ? d : d + ".")); setStdFresh(false); return; }
    setStdDisplay(d => stdFresh || d === "0" ? val : d + val); setStdFresh(false);
  };
  // Forex (pip / lot) Calculator (T#43 parity)
  const [fxPair, setFxPair] = useState("EURUSD");
  const [fxLots, setFxLots] = useState("1");
  const [fxPips, setFxPips] = useState("10");
  const FX_UNITS_PER_LOT = 100000;
  const fxPipSize = fxPair.endsWith("JPY") ? 0.01 : 0.0001;
  const fxValuePerPipUsd = (parseFloat(fxLots) || 0) * FX_UNITS_PER_LOT * fxPipSize;
  const fxPnlUsd = fxValuePerPipUsd * (parseFloat(fxPips) || 0);
  // Scan Documents — Task #44. Public client snaps ID / payslip / proof of
  // address and POSTs to /api/scan-document/:slug; the server encrypts at rest
  // and emails the advisor with attachments. capture="environment" gives the
  // rear camera on mobile Safari + Android Chrome; same input also accepts
  // pre-existing files from the device library and PDFs.
  const scanInputRef = useRef<HTMLInputElement>(null);
  const [scanFiles, setScanFiles] = useState<File[]>([]);
  const [scanSenderName, setScanSenderName] = useState("");
  const [scanSenderEmail, setScanSenderEmail] = useState("");
  const [scanNote, setScanNote] = useState("");
  const [scanSending, setScanSending] = useState(false);
  const [scanSent, setScanSent] = useState<null | { emailDelivered: boolean; storedEncrypted: boolean }>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const sendScanDocuments = async () => {
    if (scanFiles.length === 0 || !slug) return;
    setScanSending(true);
    setScanError(null);
    setScanSent(null);
    try {
      const fd = new FormData();
      for (const f of scanFiles) fd.append("files", f, f.name || "scan");
      if (scanSenderName.trim()) fd.append("senderName", scanSenderName.trim());
      if (scanSenderEmail.trim()) fd.append("senderEmail", scanSenderEmail.trim());
      if (scanNote.trim()) fd.append("note", scanNote.trim());
      const res = await fetch(`/api/scan-document/${encodeURIComponent(slug)}`, { method: "POST", body: fd });
      let body: any = {};
      try { body = await res.json(); } catch {}
      if (!res.ok) {
        throw new Error(body?.message || "Failed to send documents. Please try again.");
      }
      setScanSent({
        emailDelivered: !!body?.emailDelivered,
        storedEncrypted: !!body?.storedEncrypted,
      });
      setScanFiles([]);
      setScanNote("");
    } catch (err: any) {
      setScanError(err?.message || "Failed to send documents. Please try again.");
    } finally {
      setScanSending(false);
    }
  };

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }); }, []);

  useEffect(() => {
    if (advisor) {
      document.title = `${advisor.name}${advisor.title ? " — " + advisor.title : ""} | Advisory Connect`;
    }
    return () => { document.title = "Advisory Connect"; };
  }, [advisor]);

  // Per-advisor PWA manifest (S4). When a client uses Add to Home Screen on a
  // public profile, the saved icon should reopen THIS advisor's card — not the
  // master landing page that the static /manifest.json's start_url="/" points to.
  useEffect(() => {
    if (!advisor?.profileSlug) return;
    const link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    const titleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement | null;
    const origLinkHref = link?.getAttribute("href") ?? null;
    const origTitle = titleMeta?.getAttribute("content") ?? null;
    const displayName = advisor.name || "Advisory Connect";
    if (link) {
      const params = new URLSearchParams({
        start: `/${advisor.profileSlug}`,
        name: displayName,
        short: displayName.split(" ")[0]?.slice(0, 12) || displayName.slice(0, 12),
      });
      link.href = `/api/manifest?${params.toString()}`;
    }
    if (titleMeta) titleMeta.setAttribute("content", displayName);
    return () => {
      if (link && origLinkHref) link.href = origLinkHref;
      if (titleMeta && origTitle) titleMeta.setAttribute("content", origTitle);
    };
  }, [advisor?.profileSlug, advisor?.name]);

  useEffect(() => {
    if (!advisor?.id || !slug) return;
    // S7: send the slug so the server can attribute the view to Primary or
    // Secondary (eventType is encoded as `app_access:<slug>`).
    fetch("/api/stats/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ advisorId: advisor.id, slug }),
    }).catch(() => {});
  }, [advisor?.id, slug]);

  useEffect(() => {
    if (!toolsOpen) return;
    let cancelled = false;
    // W1 T1: shared cache prevents double-fire with ForexWidget (which also
    // hits a forex endpoint on mount) and de-dupes repeat opens within 60s.
    (async () => {
      setErLoading(true);
      const { getForexRates } = await import("@/lib/forexCache");
      const rates = await getForexRates(erFrom);
      if (!cancelled) {
        setErRates(rates);
        setErLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [erFrom, toolsOpen]);

  const profileSectionOrder = useMemo<string[]>(() => {
    const raw = (advisor as any)?.profileSectionOrder as string | null | undefined;
    const allowed = new Set<string>(DEFAULT_PROFILE_SECTION_ORDER as readonly string[]);
    const saved = raw ? raw.split(",").filter(Boolean).filter(k => allowed.has(k)) : [...DEFAULT_PROFILE_SECTION_ORDER];
    // Ensure any default keys missing from the saved order are appended,
    // so newly-added sections still render for advisors whose stored order pre-dates them.
    const missing = DEFAULT_PROFILE_SECTION_ORDER.filter(k => !saved.includes(k));
    return [...saved, ...missing];
  }, [(advisor as any)?.profileSectionOrder]);

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

  const tc = getThemeColors(advisor.theme, advisor.themeColor);
  const isDark = tc.isDark;
  const accentColor = tc.accentColor;
  const bgColor = tc.bgColor;
  const cardBg = tc.cardBg;
  const textColor = tc.textColor;
  const mutedText = tc.mutedText;
  const sectionTitle = tc.sectionTitle;
  const t = TRANSLATIONS[lang];

  const bioText =
    advisor.bioOption === "custom"
      ? advisor.customBio
      : t.bioOptions[advisor.bioOption || "a"] || "";

  const individualServices = INDIVIDUAL_SERVICES.filter((s) =>
    advisor.individualServices?.includes(s.key)
  ).map((s) => ({ ...s, ...(t.indServices[s.key] || {}) }));

  const corporateServices = CORPORATE_SERVICES.filter((s) =>
    advisor.corporateServices?.includes(s.key)
  ).map((s) => ({ ...s, ...(t.corpServices[s.key] || {}) }));

  const profileUrl = `app.advisoryconnect.pro/${advisor.profileSlug}`;
  const initials = getInitials(advisor.name);

  const hasContactDetails = advisor.showContactDetails !== false && (
    (advisor as any).contactNumber || (advisor as any).workingHours || advisor.email
  );

  // M4: tiled-name pattern uses the secondary's own nickname when present so
  // "Corporate Demo" tiles with "Corporate Demo", not the parent advisor's name.
  // Falls back to advisor.name for primary profiles or secondaries without a nickname.
  const themeBg = getThemeBackground(advisor.theme, (advisor as any).backgroundStyle, (advisor as any).patternOpacity, (advisor as any).themeColor, (advisor as any).nickname || advisor.name, (advisor as any).imagePatternKey);

  const profileShareUrl = `https://app.advisoryconnect.pro/${advisor.profileSlug}`;
  const hasWhatsApp = !!(advisor as any).contactNumber;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: advisor.name, text: `View ${advisor.name}'s financial advisory profile`, url: profileShareUrl }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(profileShareUrl); setShareCopied(true); setTimeout(() => setShareCopied(false), 2200); } catch {}
    }
  };

  const handleSaveContact = () => {
    const noteLines = [`View my full advisory profile at ${profileShareUrl}`];
    if ((advisor as any).showAstute && (advisor as any).astuteUrl)
      noteLines.push(`Request Your Financial Information: ${(advisor as any).astuteUrl}`);
    const vcf = [
      "BEGIN:VCARD", "VERSION:3.0",
      `FN:${advisor.name}`,
      advisor.title ? `TITLE:${advisor.title}` : null,
      advisor.email ? `EMAIL:${advisor.email}` : null,
      (advisor as any).contactNumber ? `TEL:${(advisor as any).contactNumber}` : null,
      advisor.websiteUrl ? `URL:${advisor.websiteUrl}` : null,
      advisor.linkedinUrl ? `X-SOCIALPROFILE;TYPE=linkedin:${advisor.linkedinUrl}` : null,
      `NOTE:${noteLines.join("\\n")}`,
      "END:VCARD",
    ].filter(Boolean).join("\r\n");
    const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${advisor.name.replace(/\s+/g, "-")}.vcf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Task #28 — open the share-card dialog (Portrait/Square × Share/Download).
  // The previous direct-download flow is retained below as a fallback but is no
  // longer wired to a button: the dialog calls shareOrDownloadCard() directly.
  const handleOpenShareCard = () => {
    setCardStatus(null);
    setCardBusy(null);
    setCardDialogOpen(true);
  };

  const handleShareCardAction = async (mode: "share" | "download") => {
    if (cardBusy) return;
    setCardBusy(mode);
    setCardStatus(null);
    try {
      const result = await shareOrDownloadCard({ advisor, variant: cardVariant, mode });
      if (result === "shared") setCardStatus("Shared.");
      else if (result === "downloaded") setCardStatus(mode === "share" ? "Sharing unavailable — downloaded instead." : "Downloaded.");
    } catch (e) {
      console.error("[business-card] render failed", e);
      setCardStatus("Couldn't generate the card. Please try again.");
    } finally {
      setCardBusy(null);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleDownloadBusinessCardLegacy = () => {
    const { from, to } = getInitialsBadgeColors(advisor.theme || "blue", advisor.themeColor);
    const W = 400, H = 800, SCALE = 2;
    const PHOTO_H = 440;
    const phone = (advisor as any).contactNumber || "";
    const location = (advisor as any).location || "";
    const workingHours = (advisor as any).workingHours || "";
    const showAstute = !!(advisor as any).showAstute;
    const astuteUrl = (advisor as any).astuteUrl || "";
    const cardInitials = getInitials(advisor.name);

    const canvas = document.createElement("canvas");
    canvas.width = W * SCALE; canvas.height = H * SCALE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(SCALE, SCALE);

    const drawCard = (photoImg?: HTMLImageElement) => {
      // === HEADER: full-bleed photo or gradient ===
      if (photoImg) {
        // Draw photo to fill entire header width, cropped centre
        const aspect = photoImg.naturalWidth / photoImg.naturalHeight;
        let sx = 0, sy = 0, sw = photoImg.naturalWidth, sh = photoImg.naturalHeight;
        const targetAspect = W / PHOTO_H;
        if (aspect > targetAspect) {
          sw = Math.round(sh * targetAspect);
          sx = Math.round((photoImg.naturalWidth - sw) / 2);
        } else {
          sh = Math.round(sw / targetAspect);
          sy = Math.round((photoImg.naturalHeight - sh) / 2);
        }
        ctx.drawImage(photoImg, sx, sy, sw, sh, 0, 0, W, PHOTO_H);
        // Dark gradient overlay at bottom for text legibility
        const textGrad = ctx.createLinearGradient(0, PHOTO_H - 160, 0, PHOTO_H);
        textGrad.addColorStop(0, "rgba(0,0,0,0)");
        textGrad.addColorStop(1, "rgba(0,0,0,0.80)");
        ctx.fillStyle = textGrad;
        ctx.fillRect(0, PHOTO_H - 160, W, 160);
      } else {
        // Gradient header when no photo
        const headerGrad = ctx.createLinearGradient(0, 0, W, PHOTO_H);
        headerGrad.addColorStop(0, from);
        headerGrad.addColorStop(1, to);
        ctx.fillStyle = headerGrad;
        ctx.fillRect(0, 0, W, PHOTO_H);
        // Large initials centred in header
        ctx.textBaseline = "middle"; ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.font = `bold 160px Georgia, serif`;
        ctx.fillText((cardInitials[0] || "") + (cardInitials[1] || ""), W / 2, PHOTO_H / 2);
      }

      // Name + title on photo (bottom)
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold 26px Arial, sans-serif`;
      ctx.fillText(advisor.name, W / 2, PHOTO_H - 44);
      if (advisor.title) {
        ctx.fillStyle = "rgba(255,255,255,0.82)";
        ctx.font = `500 13px Arial, sans-serif`;
        ctx.fillText(advisor.title.toUpperCase(), W / 2, PHOTO_H - 18);
      }

      // White body
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, PHOTO_H, W, H - PHOTO_H);

      // Thin divider
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(24, PHOTO_H + 1, W - 48, 1);

      // Contact details
      const contactItems: [string, string][] = [];
      if (phone) contactItems.push(["Tel", phone]);
      if (advisor.email) contactItems.push(["Email", advisor.email]);
      if (location) contactItems.push(["Office", location]);
      if (workingHours) contactItems.push(["Hours", workingHours]);
      if (showAstute) contactItems.push(["Link", "Request Your Financial Info"]);

      ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillStyle = "#333333";
      ctx.font = `13px Arial, sans-serif`;
      let rowY = PHOTO_H + 22;
      for (const [label, text] of contactItems) {
        ctx.font = `bold 12px Arial, sans-serif`;
        ctx.fillStyle = "#888888";
        ctx.fillText(`${label}`, 24, rowY);
        ctx.font = `13px Arial, sans-serif`;
        ctx.fillStyle = "#333333";
        ctx.fillText(text, 70, rowY);
        rowY += 28;
      }
      if (contactItems.length === 0) {
        ctx.fillStyle = "#bbb"; ctx.font = `italic 13px Arial, sans-serif`;
        ctx.fillText("No contact details added yet", 24, rowY);
        rowY += 28;
      }

      // QR code — position dynamically after contact items
      const QR_SIZE = 110;
      const qrY = Math.max(rowY + 18, PHOTO_H + 20);
      const qrX = (W - QR_SIZE) / 2;

      const qrEl = document.getElementById("hidden-qr-card") as SVGElement | null;

      // F3 — branded footer watermark. Draws the AC icon on the left of the
      // "Powered by Advisory Connect" text. Logo is preloaded first; if it
      // can't load (offline / 404) we just fall through to the text-only
      // footer so the download never breaks.
      const drawFooterWithLogo = (logoImg?: HTMLImageElement) => {
        ctx.fillStyle = "#f7f7f7";
        ctx.fillRect(0, H - 36, W, 36);
        ctx.fillStyle = "#444"; ctx.font = `bold 9px Arial, sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        const label = "Powered by Advisory Connect";
        const labelMetrics = ctx.measureText(label);
        const ICON = 14;
        const GAP = 5;
        const totalW = (logoImg ? ICON + GAP : 0) + labelMetrics.width;
        const startX = (W - totalW) / 2;
        if (logoImg) {
          ctx.drawImage(logoImg, startX, H - 24 - ICON / 2, ICON, ICON);
          ctx.textAlign = "left";
          ctx.fillText(label, startX + ICON + GAP, H - 24);
        } else {
          ctx.fillText(label, W / 2, H - 24);
        }
        ctx.fillStyle = "#555"; ctx.font = `8.5px Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("app.advisoryconnect.pro/privacy-policy", W / 2, H - 11);
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `${advisor.name.replace(/\s+/g, "-").toLowerCase()}-card.png`;
        link.click();
      };

      const afterQr = () => {
        const logoImg = new Image();
        logoImg.onload = () => drawFooterWithLogo(logoImg);
        logoImg.onerror = () => drawFooterWithLogo();
        logoImg.src = "/logo/icon-64.png";
      };

      if (qrEl) {
        const svgStr = new XMLSerializer().serializeToString(qrEl);
        const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const qrImg = new Image();
        qrImg.onload = () => {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(qrX - 8, qrY - 8, QR_SIZE + 16, QR_SIZE + 16);
          ctx.drawImage(qrImg, qrX, qrY, QR_SIZE, QR_SIZE);
          URL.revokeObjectURL(url);
          ctx.fillStyle = "#888"; ctx.font = `10px Arial, sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText("Scan to view full profile", W / 2, qrY + QR_SIZE + 14);
          ctx.fillStyle = "#bbb"; ctx.font = `9px Arial, sans-serif`;
          ctx.fillText(`app.advisoryconnect.pro/${advisor.profileSlug}`, W / 2, qrY + QR_SIZE + 28);
          afterQr();
        };
        qrImg.onerror = () => { URL.revokeObjectURL(url); afterQr(); };
        qrImg.src = url;
      } else {
        afterQr();
      }
    };

    if (advisor.profilePicUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => drawCard(img);
      img.onerror = () => drawCard();
      img.src = advisor.profilePicUrl;
    } else {
      drawCard();
    }
  };

  const handleAddToHomeScreen = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      setDeferredInstallPrompt(null);
    } else {
      setShowInstallHint(true);
    }
  };

  const handleDownloadProfileImage = () => {
    const W = 600;
    const BAR = 140;
    const hasPhoto = !!advisor.profilePicUrl;
    const PHOTO_H = hasPhoto ? W : 320;
    const TOTAL_H = PHOTO_H + BAR;

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = TOTAL_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { from, to } = getInitialsBadgeColors(advisor.theme || "blue", advisor.themeColor);

    const drawBadge = (bx: number, by: number, bs: number) => {
      const r = bs * 0.18;
      const grad = ctx.createLinearGradient(bx, by, bx + bs, by + bs);
      grad.addColorStop(0, from);
      grad.addColorStop(1, to);
      ctx.beginPath();
      ctx.moveTo(bx + r, by);
      ctx.lineTo(bx + bs - r, by);
      ctx.quadraticCurveTo(bx + bs, by, bx + bs, by + r);
      ctx.lineTo(bx + bs, by + bs - r);
      ctx.quadraticCurveTo(bx + bs, by + bs, bx + bs - r, by + bs);
      ctx.lineTo(bx + r, by + bs);
      ctx.quadraticCurveTo(bx, by + bs, bx, by + bs - r);
      ctx.lineTo(bx, by + r);
      ctx.quadraticCurveTo(bx, by, bx + r, by);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      const shimGrad = ctx.createLinearGradient(bx, by, bx, by + bs / 2);
      shimGrad.addColorStop(0, "rgba(255,255,255,0.18)");
      shimGrad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = shimGrad;
      ctx.fill();
      const l1 = initials[0] || "";
      const l2 = initials[1] || "";
      const fontSize = bs * 0.52;
      ctx.font = `bold ${fontSize}px Georgia, serif`;
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.fillText(l1, bx + bs * 0.3, by + bs * 0.54);
      ctx.fillStyle = "rgba(255,255,255,0.78)";
      ctx.fillText(l2, bx + bs * 0.66, by + bs * 0.54);
    };

    const finalize = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, PHOTO_H, W, BAR);
      const BADGE_SIZE = 80;
      const BADGE_X = 24;
      const BADGE_Y = PHOTO_H + (BAR - BADGE_SIZE) / 2;
      drawBadge(BADGE_X, BADGE_Y, BADGE_SIZE);
      const TEXT_X = BADGE_X + BADGE_SIZE + 20;
      const nameSize = Math.min(32, Math.max(20, Math.floor(30 - advisor.name.length * 0.3)));
      ctx.font = `bold ${nameSize}px Arial, sans-serif`;
      ctx.fillStyle = "#111111";
      ctx.textBaseline = "middle";
      ctx.fillText(advisor.name.toUpperCase(), TEXT_X, PHOTO_H + BAR * 0.38);
      if (advisor.title) {
        ctx.font = `500 14px Arial, sans-serif`;
        ctx.fillStyle = "#666666";
        ctx.fillText(advisor.title.toUpperCase(), TEXT_X, PHOTO_H + BAR * 0.68);
      }
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${advisor.name.replace(/\s+/g, "-").toLowerCase()}-profile.png`;
      link.click();
    };

    if (hasPhoto) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const srcAspect = img.naturalWidth / img.naturalHeight;
        let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
        if (srcAspect > 1) { sw = img.naturalHeight; sx = (img.naturalWidth - sw) / 2; }
        else if (srcAspect < 1) { sh = img.naturalWidth; sy = (img.naturalHeight - sh) / 2; }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, PHOTO_H);
        finalize();
      };
      img.onerror = () => {
        const noPhotoGrad = ctx.createLinearGradient(0, 0, W, PHOTO_H);
        noPhotoGrad.addColorStop(0, from);
        noPhotoGrad.addColorStop(1, to);
        ctx.fillStyle = noPhotoGrad;
        ctx.fillRect(0, 0, W, PHOTO_H);
        drawBadge((W - 160) / 2, (PHOTO_H - 160) / 2, 160);
        finalize();
      };
      img.src = advisor.profilePicUrl!;
    } else {
      const noPhotoGrad = ctx.createLinearGradient(0, 0, W, PHOTO_H);
      noPhotoGrad.addColorStop(0, from);
      noPhotoGrad.addColorStop(1, to);
      ctx.fillStyle = noPhotoGrad;
      ctx.fillRect(0, 0, W, PHOTO_H);
      drawBadge((W - 160) / 2, (PHOTO_H - 160) / 2, 160);
      finalize();
    }
  };

  const btnBase = "flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-medium text-xs transition-opacity hover:opacity-80";
  const whatsappSvg = <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 flex-shrink-0" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;

  return (
    <main className="min-h-screen" style={{ ...themeBg, color: textColor }} data-testid="profile-container">
      <div className="max-w-md mx-auto px-4 pt-6 pb-12 space-y-4">

        {/* Language toggle (S7: views counter removed from public profile;
            it now lives in the advisor's panel only) */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-end"
          data-testid="lang-toggle"
        >
          <div className="flex gap-1">
            {(["en", "af", "zu"] as Lang[]).map((l) => (
              <button key={l} onClick={() => setLang(l)}
                className="px-2.5 py-1 rounded-md text-xs font-semibold transition-all"
                style={{ backgroundColor: lang === l ? accentColor : tc.buttonSecondaryBg, color: lang === l ? tc.buttonText : mutedText, border: `1px solid ${lang === l ? accentColor : tc.borderColor}` }}
                data-testid={`button-lang-${l}`}>
                {l === "en" ? "EN" : l === "af" ? "AF" : "ZU"}
              </button>
            ))}
          </div>
        </motion.div>

        {/* 1. Portrait Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="rounded-2xl overflow-hidden"
          style={{ border: `1px solid ${tc.initialsCircleBorder}`, boxShadow: "0 8px 28px rgba(0,0,0,0.2)" }}
          data-testid="profile-header"
        >
          {/* Top area — full-width cover photo or gradient initials */}
          {advisor.profilePicUrl && advisor.showProfilePic !== false && !profilePicBroken ? (
            <div className="relative w-full" style={{ minHeight: 300 }}>
              <img src={advisor.profilePicUrl} alt={advisor.name}
                className="w-full object-cover block"
                style={{ height: 300 }}
                data-testid="img-profile-pic"
                onError={() => setProfilePicBroken(true)}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center pt-10 pb-7 px-5 gap-5" style={{ background: `linear-gradient(160deg, ${getInitialsBadgeColors(advisor.theme || "blue", advisor.themeColor).from} 0%, ${getInitialsBadgeColors(advisor.theme || "blue", advisor.themeColor).to} 100%)` }}>
              <div data-testid="section-initials-fallback">
                <ProfileInitialsBadge initials={initials} theme={advisor.theme || "blue"} themeColor={advisor.themeColor} size={220} downloadable={false} name={advisor.name} />
              </div>
              {/* Name + Title */}
              <div className="text-center">
                <h1 className="text-xl font-bold tracking-wider leading-snug text-white uppercase" data-testid="text-advisor-name">{advisor.name}</h1>
                {advisor.title && <p className="text-sm mt-1 font-medium tracking-wide" style={{ color: "rgba(255,255,255,0.78)" }} data-testid="text-advisor-title">{advisor.title}</p>}
              </div>
            </div>
          )}
          {/* Auto-generated header badge — sits inside the profile card, just
              below the photo. May 2026: bg switched from hardcoded #ffffff to
              tc.cardBg so it inherits the chosen theme tint instead of looking
              like a stark white strip on every coloured/dark theme. Text
              colours follow the theme (sectionTitle for the name, mutedText for
              the title) so they stay readable across all 12 + custom themes. */}
          {(advisor as any).showHeader !== false && (
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ backgroundColor: tc.cardBg, borderTop: `1px solid ${tc.borderColor}` }}
              data-testid="section-header-badge"
            >
              <ProfileInitialsBadge initials={initials} theme={advisor.theme || "blue"} themeColor={advisor.themeColor} size={52} downloadable={false} name={advisor.name} />
              <div className="flex-1 min-w-0">
                <div
                  className="font-bold tracking-widest leading-tight truncate uppercase"
                  style={{
                    color: tc.sectionTitle,
                    fontSize: 17,
                    letterSpacing: 2.5,
                  }}
                  data-testid="text-header-badge-name"
                >
                  {advisor.name}
                </div>
                {advisor.title && (
                  <div
                    className="font-medium leading-tight truncate mt-0.5"
                    style={{ color: tc.mutedText, fontSize: 11, letterSpacing: 0.5 }}
                    data-testid="text-header-badge-title"
                  >
                    {advisor.title}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom utility row — grouped: Get-in-touch / Share-and-save / Install */}
          <div className="p-3 space-y-2.5" style={{ backgroundColor: cardBg }} data-testid="section-utility-buttons">
            {/* Group 1: Get in touch */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleSaveContact} className={btnBase} style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }} data-testid="button-save-contact">
                <Download className="h-3.5 w-3.5 flex-shrink-0" />{t.saveContact}
              </button>
              {hasWhatsApp ? (
                <a href={`https://wa.me/${String((advisor as any).contactNumber).replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className={btnBase} style={{ backgroundColor: "#25D366", color: "#ffffff" }} data-testid="link-whatsapp">
                  {whatsappSvg}{t.whatsappMe}
                </a>
              ) : (
                <button disabled className={btnBase} style={{ backgroundColor: tc.buttonSecondaryBg, color: mutedText, opacity: 0.38, cursor: "default" }}>
                  {whatsappSvg}{t.whatsappMe}
                </button>
              )}
            </div>
            {/* Group 2: Share & save */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleShare}
                className={btnBase}
                style={{
                  backgroundColor: shareCopied ? accentColor : tc.buttonSecondaryBg,
                  color: shareCopied ? tc.buttonText : accentColor,
                  border: `1px solid ${shareCopied ? accentColor : tc.borderColor}`,
                  transition: "all 0.3s ease",
                }}
                data-testid="button-share-profile"
              >
                <Share2 className="h-3.5 w-3.5 flex-shrink-0" />{shareCopied ? t.linkCopied : t.shareProfile}
              </button>
              <button onClick={handleOpenShareCard} className={btnBase} style={{ backgroundColor: tc.buttonSecondaryBg, color: accentColor, border: `1px solid ${tc.borderColor}` }} data-testid="button-save-business-card">
                <CreditCard className="h-3.5 w-3.5 flex-shrink-0" />{t.saveCard}
              </button>
            </div>
            {/* Group 3: Install */}
            <button
              onClick={handleAddToHomeScreen}
              className={`${btnBase} w-full`}
              style={{ backgroundColor: tc.buttonSecondaryBg, color: accentColor, border: `1px solid ${tc.borderColor}` }}
              data-testid="button-add-to-homescreen"
            >
              <Smartphone className="h-3.5 w-3.5 flex-shrink-0" />
              Save to Home Screen
              <svg viewBox="0 0 24 24" className="h-3 w-3 flex-shrink-0 opacity-60" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
            </button>
          </div>

          {/* Task #28 — Share Card dialog: Portrait / Square × Share / Download */}
          {cardDialogOpen && (
            <div
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4"
              style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
              onClick={() => !cardBusy && setCardDialogOpen(false)}
              data-testid="dialog-share-card"
            >
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full max-w-[22rem] sm:max-w-sm rounded-2xl p-4 sm:p-5 space-y-4"
                style={{ backgroundColor: cardBg, border: `1px solid ${tc.borderColor}` }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-sm" style={{ color: tc.textColor }}>Share your business card</div>
                  <button
                    onClick={() => !cardBusy && setCardDialogOpen(false)}
                    style={{ color: mutedText }}
                    className="leading-none shrink-0 disabled:opacity-40"
                    aria-label="Close"
                    disabled={!!cardBusy}
                    data-testid="button-card-close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Variant picker */}
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: mutedText }}>Size</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(["portrait", "square"] as CardVariant[]).map((v) => {
                      const selected = cardVariant === v;
                      return (
                        <button
                          key={v}
                          onClick={() => setCardVariant(v)}
                          disabled={!!cardBusy}
                          className="rounded-lg px-2 py-3 text-left transition-all disabled:opacity-50"
                          style={{
                            backgroundColor: selected ? `${accentColor}1a` : tc.buttonSecondaryBg,
                            border: `1px solid ${selected ? accentColor : tc.borderColor}`,
                            color: tc.textColor,
                          }}
                          data-testid={`button-card-variant-${v}`}
                        >
                          {/* Visual aspect-ratio preview */}
                          <div
                            className="mx-auto mb-2 rounded-md"
                            style={{
                              width: v === "portrait" ? 28 : 40,
                              height: 40,
                              background: `linear-gradient(160deg, ${getInitialsBadgeColors(advisor.theme || "blue", advisor.themeColor).from}, ${getInitialsBadgeColors(advisor.theme || "blue", advisor.themeColor).to})`,
                              border: `1px solid ${tc.borderColor}`,
                            }}
                          />
                          <div className="text-xs font-semibold capitalize">{v}</div>
                          <div className="text-[10px]" style={{ color: mutedText }}>
                            {v === "portrait" ? "1080×1920 · Stories" : "1080×1080 · Feed"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {canShareCardNatively() && (
                    <button
                      onClick={() => handleShareCardAction("share")}
                      disabled={!!cardBusy}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                      style={{ backgroundColor: accentColor, color: tc.buttonText }}
                      data-testid="button-card-share"
                    >
                      {cardBusy === "share"
                        ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Preparing…</>
                        : <><Share2 className="h-3.5 w-3.5" />Share card</>}
                    </button>
                  )}
                  <button
                    onClick={() => handleShareCardAction("download")}
                    disabled={!!cardBusy}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{
                      backgroundColor: canShareCardNatively() ? tc.buttonSecondaryBg : accentColor,
                      color: canShareCardNatively() ? accentColor : tc.buttonText,
                      border: canShareCardNatively() ? `1px solid ${tc.borderColor}` : "none",
                    }}
                    data-testid="button-card-download"
                  >
                    {cardBusy === "download"
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Rendering…</>
                      : <><Download className="h-3.5 w-3.5" />Download PNG</>}
                  </button>
                  {cardStatus && (
                    <div className="text-[11px] text-center" style={{ color: mutedText }} data-testid="text-card-status">{cardStatus}</div>
                  )}
                  {!canShareCardNatively() && (
                    <div className="text-[10px] text-center leading-relaxed" style={{ color: mutedText }}>
                      Tip: open this page on a mobile device for one-tap sharing to WhatsApp, Instagram, or LinkedIn.
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {/* iOS Add to Home Screen modal */}
          {showInstallHint && (
            <div
              className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:p-4"
              style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
              onClick={() => setShowInstallHint(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                /* W1 T2: cap at 22rem so 320px-wide phones (iPhone SE) don't
                   overflow the modal; step text wraps via min-w-0 in row header. */
                className="w-full max-w-[20rem] rounded-2xl p-4 space-y-3"
                style={{ backgroundColor: cardBg, border: `1px solid ${tc.borderColor}` }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-sm min-w-0" style={{ color: tc.textColor }}>Save to Home Screen</div>
                  <button onClick={() => setShowInstallHint(false)} style={{ color: mutedText }} className="leading-none shrink-0" aria-label="Close"><X className="h-4 w-4" /></button>
                </div>
                <div className="text-[11px] uppercase tracking-wider" style={{ color: mutedText }}>
                  {isIOS ? "iPhone · Safari" : "Android · Chrome"}
                </div>
                <div className="space-y-2">
                  {isIOS ? (
                    <>
                      <Step num={1} text="Tap the Share icon" color={accentColor} />
                      <Step num={2} text={`Choose "Add to Home Screen"`} color={accentColor} />
                      <Step num={3} text="Tap Add" color={accentColor} />
                    </>
                  ) : (
                    <>
                      <Step num={1} text="Tap the browser menu" color={accentColor} />
                      <Step num={2} text={`Choose "Add to Home screen"`} color={accentColor} />
                      <Step num={3} text="Tap Add" color={accentColor} />
                    </>
                  )}
                </div>
                <p className="text-[11px] leading-snug" style={{ color: mutedText }}>
                  Opens like an app. No store, no install.
                </p>
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* News Hero — sits prominently right under the profile header */}
        {/* Interactive Financial Tools + News Hero now render via section order — see sectionMap below */}

        {/* Hidden QR for business card PDF generation */}
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px", width: 0, height: 0, overflow: "hidden" }} aria-hidden="true">
          <QRCodeSVG id="hidden-qr-card" value={`https://app.advisoryconnect.pro/${advisor.profileSlug}`} size={120} level="M" />
        </div>

        {/* Ordered Sections */}
        {(() => {
          const sectionMap: Record<string, React.ReactNode> = {
            moneyweb: !!(advisor as any).showMoneywebFeed ? (
              <NewsHero accentColor={accentColor} borderColor={tc.borderColor} cardBg={cardBg} />
            ) : null,

            secondnews: !!(advisor as any).showSecondNews ? (
              <NewsHero
                accentColor={accentColor}
                borderColor={tc.borderColor}
                cardBg={cardBg}
                category={"secondary" as any}
                labelOverride="More Finance News · Live"
                testIdSuffix="secondary"
              />
            ) : null,

            forex: !!(advisor as any).showForex ? (
              <ForexWidget
                accentColor={accentColor}
                borderColor={tc.borderColor}
                cardBg={cardBg}
                textColor={textColor}
                mutedText={mutedText}
              />
            ) : null,

            funfacts: !!(advisor as any).showFunFacts ? (
              <FunFactsCarousel
                accentColor={accentColor}
                borderColor={tc.borderColor}
                cardBg={cardBg}
                textColor={textColor}
                mutedText={mutedText}
                advisorName={(advisor as any).name || ""}
              />
            ) : null,

            platforms: null,

            interactive: ((advisor as any).showInteractive !== false) ? (() => {
              const tools = [
                (advisor as any).showShowpieceSqueeze !== false && { key: "squeeze", node: <RealMoneySqueeze accentColor={accentColor} borderColor={tc.borderColor} cardBg={cardBg} textColor={textColor} mutedText={mutedText} /> },
                (advisor as any).showShowpieceTaxBite !== false && { key: "tax-bite", node: <TaxBite accentColor={accentColor} borderColor={tc.borderColor} cardBg={cardBg} textColor={textColor} mutedText={mutedText} /> },
                (advisor as any).showShowpieceInflation !== false && { key: "inflation", node: <InflationMillion accentColor={accentColor} borderColor={tc.borderColor} cardBg={cardBg} textColor={textColor} mutedText={mutedText} /> },
                (advisor as any).showShowpieceWaiting !== false && { key: "waiting", node: <CostOfWaiting accentColor={accentColor} borderColor={tc.borderColor} cardBg={cardBg} textColor={textColor} mutedText={mutedText} /> },
                (advisor as any).showToolReality !== false && { key: "reality", node: <RealityCheck accentColor={accentColor} borderColor={tc.borderColor} cardBg={cardBg} textColor={textColor} mutedText={mutedText} /> },
                (advisor as any).showToolLatte !== false && { key: "latte", node: <LatteMillionaire accentColor={accentColor} borderColor={tc.borderColor} cardBg={cardBg} textColor={textColor} mutedText={mutedText} inputBg={tc.inputBg} /> },
              ].filter(Boolean) as { key: string; node: ReactNode }[];
              if (tools.length === 0) return null;
              const visibleTools = rotateInteractiveTools ? [tools[interactiveRotationIndex % tools.length]] : tools;
              return (
                <div className="space-y-3" data-testid="section-interactive">
                  {visibleTools.map((tool) => <Fragment key={tool.key}>{tool.node}</Fragment>)}
                </div>
              );
            })() : null,

            bio: bioText ? (
              <div className="rounded-xl p-5" style={{ backgroundColor: cardBg, border: `1px solid ${tc.borderColor}` }} data-testid="section-bio">
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: mutedText }} data-testid="text-bio">{bioText}</p>
              </div>
            ) : null,

            individual: individualServices.length > 0 ? (
              <ServiceGroupDropdown
                title={t.individualServices} services={individualServices}
                borderColor={tc.borderColor} cardBg={cardBg} textColor={textColor}
                mutedText={mutedText} accentColor={accentColor}
                buttonBg={tc.buttonBg} buttonText={tc.buttonText}
                testId="section-individual-services"
              />
            ) : null,

            corporate: corporateServices.length > 0 ? (
              <ServiceGroupDropdown
                title={t.corporateServices} services={corporateServices}
                borderColor={tc.borderColor} cardBg={cardBg} textColor={textColor}
                mutedText={mutedText} accentColor={accentColor}
                buttonBg={tc.buttonBg} buttonText={tc.buttonText}
                testId="section-corporate-services"
              />
            ) : null,

            socials: (advisor.showSocials !== false && (advisor.linkedinUrl || (advisor as any).facebookUrl || (advisor as any).instagramUrl || (advisor as any).youtubeUrl || advisor.websiteUrl)) ? (
              <div className="space-y-2" data-testid="section-socials">
                {[
                  { url: advisor.linkedinUrl, label: t.linkedin, Icon: Linkedin, testId: "link-linkedin" },
                  { url: (advisor as any).facebookUrl, label: t.facebook, Icon: Facebook, testId: "link-facebook" },
                  { url: (advisor as any).instagramUrl, label: t.instagram, Icon: Instagram, testId: "link-instagram" },
                  { url: (advisor as any).youtubeUrl, label: t.youtube, Icon: Youtube, testId: "link-youtube" },
                  { url: advisor.websiteUrl, label: t.website, Icon: Globe, testId: "link-website" },
                ].filter(s => !!sanitizeUrl(s.url)).map(({ url, label, testId }) => (
                  <a key={testId} href={sanitizeUrl(url)!} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center w-full py-3 rounded-xl font-medium text-sm transition-opacity hover:opacity-80"
                    style={{ backgroundColor: tc.buttonSecondaryBg, color: accentColor, border: `1px solid ${tc.borderColor}` }}
                    data-testid={testId}>
                    {label}
                  </a>
                ))}
              </div>
            ) : null,

            callback: advisor.showCallbackLink !== false ? (
              <button
                onClick={() => navigate(`/${slug}/request-callback`)}
                className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}
                data-testid="button-request-callback"
              >
                <Phone className="h-4 w-4 flex-shrink-0" />
                {t.requestCallback}
              </button>
            ) : null,

            referral: advisor.showReferralsLink !== false ? (
              <button
                onClick={() => navigate(`/${slug}/referrals`)}
                className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: tc.buttonSecondaryBg, color: accentColor, border: `1px solid ${tc.borderColor}` }}
                data-testid="button-refer-friends"
              >
                <Users className="h-4 w-4 flex-shrink-0" />
                {t.referFriends}
              </button>
            ) : null,

            will: !!(advisor as any).showComplimentaryWill ? (
              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${tc.borderColor}` }} data-testid="section-claim-will">
                <button
                  onClick={() => setFeedbackOpen(feedbackOpen === "will" ? null : "will")}
                  className="flex items-center justify-center gap-2.5 w-full px-4 py-3.5 font-semibold text-sm"
                  style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}
                  data-testid="button-claim-will"
                >
                  <BookOpen className="h-4 w-4 flex-shrink-0" /><span>{t.claimWill}</span>
                  {feedbackOpen === "will" ? <ChevronUp className="h-4 w-4 flex-shrink-0 opacity-70" /> : <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-70" />}
                </button>
                {feedbackOpen === "will" && (
                  <div className="px-4 py-3.5 space-y-3" style={{ backgroundColor: tc.cardBg, borderTop: `1px solid ${tc.borderColor}` }}>
                    <p className="text-sm leading-relaxed" style={{ color: mutedText }}>Secure your family's future with a professionally drafted will at no cost. Complete a short form and our team will be in touch.</p>
                    <button onClick={() => navigate(`/${advisor.profileSlug}/claim-will`)}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-80"
                      style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}
                      data-testid="button-claim-will-continue">
                      Continue to Form
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : null,

            media: !!(advisor as any).showFinancialMedia ? (
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${tc.borderColor}` }} data-testid="section-financial-media">
            <button
              onClick={() => setFinancialMediaOpen(v => !v)}
              className="flex items-center justify-between w-full px-4 py-3.5 font-semibold text-sm"
              style={{ backgroundColor: tc.buttonSecondaryBg, color: textColor }}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" style={{ color: accentColor }} />
                {t.financialMedia}
              </div>
              {financialMediaOpen ? <ChevronUp className="h-4 w-4" style={{ color: mutedText }} /> : <ChevronDown className="h-4 w-4" style={{ color: mutedText }} />}
            </button>
            {financialMediaOpen && (
              <div className="px-4 pb-4 pt-2 space-y-2" style={{ backgroundColor: cardBg }}>
                {[
                  { key: "news", label: t.latestNews, Icon: TrendingUp },
                  { key: "funfacts", label: t.funfacts, Icon: Lightbulb },
                  { key: "videos", label: t.tutorials, Icon: Video },
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
                      <p className="text-center text-xs mt-1 py-1.5" style={{ color: mutedText }}>{t.comingSoon}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
            ) : null,

            astute: !!(advisor as any).showAstute ? (
              <div data-testid="section-astute">
                {sanitizeUrl((advisor as any).astuteUrl) ? (
                  <a
                    href={sanitizeUrl((advisor as any).astuteUrl)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 no-underline"
                    style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}
                    data-testid="link-astute"
                  >
                    <ExternalLink className="h-4 w-4" />{t.moneyMapSub}
                  </a>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center gap-1 w-full py-3 rounded-xl font-semibold text-sm"
                    style={{ backgroundColor: tc.buttonSecondaryBg, color: accentColor, border: `1px dashed ${tc.borderColor}` }}
                    data-testid="placeholder-astute"
                  >
                    <span className="flex items-center gap-2"><ExternalLink className="h-4 w-4" />{t.moneyMapSub}</span>
                    <span className="text-[11px] font-normal italic" style={{ color: mutedText }}>In development</span>
                  </div>
                )}
              </div>
            ) : null,

            tools: !!(advisor as any).showTools ? (
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${tc.borderColor}` }} data-testid="section-financial-tools">
            <button
              onClick={() => setToolsOpen(v => !v)}
              className="flex items-center justify-between w-full px-4 py-3.5 font-semibold text-sm"
              style={{ backgroundColor: tc.buttonSecondaryBg, color: textColor }}
              data-testid="button-tools-open"
            >
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4" style={{ color: accentColor }} />
                Financial Tools
              </div>
              {toolsOpen ? <ChevronUp className="h-4 w-4" style={{ color: mutedText }} /> : <ChevronDown className="h-4 w-4" style={{ color: mutedText }} />}
            </button>
            {toolsOpen && (() => {
              const TAX_BRACKETS = [
                { min: 0, max: 237100, rate: 0.18, base: 0 },
                { min: 237101, max: 370500, rate: 0.26, base: 42678 },
                { min: 370501, max: 512800, rate: 0.31, base: 77362 },
                { min: 512801, max: 673000, rate: 0.36, base: 121475 },
                { min: 673001, max: 857900, rate: 0.39, base: 179147 },
                { min: 857901, max: 1817000, rate: 0.41, base: 251258 },
                { min: 1817001, max: Infinity, rate: 0.45, base: 644489 },
              ];
              const taxForIncome = (annual: number, age: number) => {
                let grossTax = 0;
                for (const b of TAX_BRACKETS) { if (annual >= b.min) grossTax = b.base + (Math.min(annual, b.max) - b.min) * b.rate; }
                let rebate = 17235;
                if (age >= 65) rebate += 9444;
                if (age >= 75) rebate += 3145;
                const tax = Math.max(0, grossTax - rebate);
                return { tax, net: annual - tax - Math.min(annual * 0.01, 177.12 * 12), effective: annual > 0 ? (tax / annual) * 100 : 0 };
              };
              const monthly = parseFloat(taxIncome) || 0;
              const taxResult = monthly > 0 ? taxForIncome(monthly * 12, parseInt(taxAge) || 35) : null;

              const erConverted = erRates && erRates[erTo] ? parseFloat(erAmount) * erRates[erTo] : null;
              const erRate = erRates && erRates[erTo] ? erRates[erTo] : null;

              const P = parseFloat(ciPrincipal) || 0, r = parseFloat(ciRate) / 100, t = parseFloat(ciYears) || 1;
              const PMT = parseFloat(ciMonthly) || 0, n = 12;
              const Ap = P * Math.pow(1 + r / n, n * t);
              const Apmt = r > 0 ? PMT * ((Math.pow(1 + r / n, n * t) - 1) / (r / n)) : PMT * 12 * t;
              const ciTotal = Ap + Apmt;
              const ciContrib = P + PMT * 12 * t;

              const is = { backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor, borderRadius: "8px", padding: "8px 12px", fontSize: "13px", outline: "none", width: "100%" };
              const toolItems = [
                (advisor as any).showToolTax !== false && "tax",
                (advisor as any).showToolExchange !== false && "exchange",
                (advisor as any).showToolCompound !== false && "compound",
                (advisor as any).showToolVehicle !== false && "vehicle",
                (advisor as any).showToolBond !== false && "bond",
                (advisor as any).showToolEmergency !== false && "emergency",
                (advisor as any).showToolLifeCover !== false && "lifecover",
                (advisor as any).showToolDebt !== false && "debt",
                "standard",
                "forex",
                "scan",
              ].filter(Boolean) as string[];

              // Vehicle finance calc
              const vehP = (parseFloat(vehPrice) || 0) - (parseFloat(vehDeposit) || 0);
              const vehR = parseFloat(vehRate) / 100 / 12;
              const vehN2 = parseInt(vehMonths) || 60;
              const vehBal = parseFloat(vehBalloon) || 0;
              const vehPMT = vehR > 0
                ? (vehP - vehBal * Math.pow(1 + vehR, -vehN2)) * (vehR * Math.pow(1 + vehR, vehN2)) / (Math.pow(1 + vehR, vehN2) - 1)
                : (vehP - vehBal) / vehN2;
              const vehTotal = vehPMT * vehN2 + vehBal;

              // Bond / Home Loan calc
              const bondP = parseFloat(bondAmount) || 0;
              const bondR = parseFloat(bondRate) / 100 / 12;
              const bondN = (parseFloat(bondTerm) || 20) * 12;
              const bondPMT = bondR > 0
                ? bondP * (bondR * Math.pow(1 + bondR, bondN)) / (Math.pow(1 + bondR, bondN) - 1)
                : (bondN > 0 ? bondP / bondN : 0);
              const bondTotal = bondPMT * bondN;
              const bondInterest = bondTotal - bondP;

              // Emergency Fund calc
              const efTarget = (parseFloat(efMonthly) || 0) * (parseFloat(efMonths) || 6);
              const efMonthsNum = parseFloat(efMonths) || 6;

              // Life Cover calc
              const lcMonthly = parseFloat(lcIncome) || 0;
              const lcYearsNum = parseFloat(lcYears) || 10;
              const lcExistingNum = parseFloat(lcExisting) || 0;
              const lcNeeded = lcMonthly * 12 * lcYearsNum;
              const lcShortfall = Math.max(0, lcNeeded - lcExistingNum);
              const lcSurplus = Math.max(0, lcExistingNum - lcNeeded);

              // Debt Payoff calc
              const dpP = parseFloat(dpDebt) || 0;
              const dpR = parseFloat(dpRate) / 100 / 12;
              const dpPMT = parseFloat(dpPayment) || 0;
              const dpMinPayment = dpR > 0 ? dpP * dpR : 0;
              const dpCantPayOff = dpPMT <= dpMinPayment && dpR > 0;
              const dpMonths = dpCantPayOff || dpPMT <= 0 || dpP <= 0 ? 0
                : dpR > 0
                  ? Math.ceil(-Math.log(1 - (dpP * dpR) / dpPMT) / Math.log(1 + dpR))
                  : Math.ceil(dpP / dpPMT);
              const dpTotalPaid = dpMonths > 0 ? dpPMT * dpMonths : 0;
              const dpTotalInterest = dpTotalPaid - dpP;

              return (
                <div className="px-4 pb-4 pt-3 space-y-2" style={{ backgroundColor: cardBg }}>
                  {toolItems.map(toolKey => (
                    <div key={toolKey} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${tc.borderColor}` }}>
                      <button
                        onClick={() => setOpenTool(openTool === toolKey ? null : toolKey)}
                        className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium"
                        style={{ backgroundColor: tc.inputBg, color: textColor }}
                        data-testid={`button-tool-${toolKey}`}
                      >
                        <span className="flex items-center gap-2" style={{ color: accentColor }}>
                          {toolKey === "tax" && <><TrendingUp className="h-3.5 w-3.5" /> SA Tax Calculator</>}
                          {toolKey === "exchange" && <><Calculator className="h-3.5 w-3.5" /> Exchange Rate Converter</>}
                          {toolKey === "compound" && <><TrendingUp className="h-3.5 w-3.5" /> Compound Interest</>}
                          {toolKey === "vehicle" && <><Calculator className="h-3.5 w-3.5" /> Vehicle Finance</>}
                          {toolKey === "bond" && <><Calculator className="h-3.5 w-3.5" /> Bond / Home Loan</>}
                          {toolKey === "emergency" && <><Calculator className="h-3.5 w-3.5" /> Emergency Fund</>}
                          {toolKey === "lifecover" && <><Calculator className="h-3.5 w-3.5" /> Life Cover Needs</>}
                          {toolKey === "debt" && <><Calculator className="h-3.5 w-3.5" /> Debt Payoff</>}
                          {toolKey === "standard" && <><Calculator className="h-3.5 w-3.5" /> Standard Calculator</>}
                          {toolKey === "forex" && <><Calculator className="h-3.5 w-3.5" /> Forex Calculator</>}
                          {toolKey === "scan" && <><FileText className="h-3.5 w-3.5" /> Scan Documents</>}
                        </span>
                        {openTool === toolKey ? <ChevronUp className="h-3.5 w-3.5" style={{ color: mutedText }} /> : <ChevronDown className="h-3.5 w-3.5" style={{ color: mutedText }} />}
                      </button>
                      {openTool === toolKey && (
                        <div className="px-3 py-3 space-y-3" style={{ backgroundColor: cardBg }}>
                          {toolKey === "tax" && (
                            <>
                              <p className="text-xs" style={{ color: mutedText }}>2024/25 tax year estimate based on monthly gross salary.</p>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Monthly Income (R)</label>
                                  <input type="number" value={taxIncome} onChange={e => setTaxIncome(e.target.value)} placeholder="e.g. 25000" style={is} data-testid="input-tool-tax-income" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Age</label>
                                  <input type="number" value={taxAge} onChange={e => setTaxAge(e.target.value)} placeholder="35" style={is} data-testid="input-tool-tax-age" />
                                </div>
                              </div>
                              {taxResult && (
                                <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: tc.inputBg }}>
                                  {[
                                    { label: "Gross Monthly", val: `R ${monthly.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}` },
                                    { label: "Est. Monthly Tax", val: `R ${(taxResult.tax / 12).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`, accent: true },
                                    { label: "Take-home (approx)", val: `R ${(taxResult.net / 12).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}` },
                                    { label: "Effective Rate", val: `${taxResult.effective.toFixed(1)}%` },
                                  ].map(({ label, val, accent }) => (
                                    <div key={label} className="flex justify-between text-xs">
                                      <span style={{ color: mutedText }}>{label}</span>
                                      <span className="font-semibold" style={{ color: accent ? accentColor : textColor }}>{val}</span>
                                    </div>
                                  ))}
                                  <p className="text-xs pt-1" style={{ color: mutedText, borderTop: `1px solid ${tc.borderColor}` }}>Estimate only — excludes medical aid credits, deductions &amp; UIF.</p>
                                </div>
                              )}
                            </>
                          )}
                          {toolKey === "exchange" && (
                            <>
                              <p className="text-xs" style={{ color: mutedText }}>Live exchange rates via ExchangeRate-API.</p>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Amount</label>
                                  <input type="number" value={erAmount} onChange={e => setErAmount(e.target.value)} style={is} data-testid="input-tool-er-amount" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>From</label>
                                  <select value={erFrom} onChange={e => setErFrom(e.target.value)} style={is} data-testid="select-tool-er-from">
                                    {["ZAR","USD","EUR","GBP","AUD","CAD","CHF","JPY","CNY","HKD","NZD","SGD","INR"].map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs" style={{ color: mutedText }}>To</label>
                                <select value={erTo} onChange={e => setErTo(e.target.value)} style={is} data-testid="select-tool-er-to">
                                  {["USD","EUR","GBP","AUD","CAD","CHF","JPY","CNY","HKD","NZD","ZAR","SGD","INR"].filter(c => c !== erFrom).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </div>
                              {erLoading ? (
                                <div className="flex items-center justify-center gap-2 py-2">
                                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: mutedText }} />
                                  <span className="text-xs" style={{ color: mutedText }}>Fetching rates…</span>
                                </div>
                              ) : erConverted !== null ? (
                                <div className="rounded-lg p-3 text-center" style={{ backgroundColor: tc.inputBg }}>
                                  <p className="text-xl font-bold" style={{ color: accentColor }}>
                                    {erConverted.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {erTo}
                                  </p>
                                  <p className="text-xs mt-0.5" style={{ color: mutedText }}>1 {erFrom} = {erRate?.toFixed(4)} {erTo}</p>
                                </div>
                              ) : null}
                            </>
                          )}
                          {toolKey === "compound" && (
                            <>
                              <p className="text-xs" style={{ color: mutedText }}>Future value of an investment with monthly contributions.</p>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Principal (R)</label>
                                  <input type="number" value={ciPrincipal} onChange={e => setCiPrincipal(e.target.value)} style={is} data-testid="input-tool-ci-principal" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Annual Rate (%)</label>
                                  <input type="number" value={ciRate} onChange={e => setCiRate(e.target.value)} style={is} data-testid="input-tool-ci-rate" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Years</label>
                                  <input type="number" value={ciYears} onChange={e => setCiYears(e.target.value)} style={is} data-testid="input-tool-ci-years" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Monthly Top-up (R)</label>
                                  <input type="number" value={ciMonthly} onChange={e => setCiMonthly(e.target.value)} style={is} data-testid="input-tool-ci-monthly" />
                                </div>
                              </div>
                              <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: tc.inputBg }}>
                                {[
                                  { label: "Future Value", val: `R ${ciTotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`, accent: true },
                                  { label: "Total Contributions", val: `R ${ciContrib.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}` },
                                  { label: "Interest Earned", val: `R ${(ciTotal - ciContrib).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}` },
                                ].map(({ label, val, accent }) => (
                                  <div key={label} className="flex justify-between text-xs">
                                    <span style={{ color: mutedText }}>{label}</span>
                                    <span className="font-semibold" style={{ color: accent ? accentColor : textColor }}>{val}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                          {toolKey === "vehicle" && (
                            <>
                              <p className="text-xs" style={{ color: mutedText }}>Calculate monthly vehicle finance instalments.</p>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Vehicle Price (R)</label>
                                  <input type="number" value={vehPrice} onChange={e => setVehPrice(e.target.value)} style={is} data-testid="input-tool-veh-price" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Deposit (R)</label>
                                  <input type="number" value={vehDeposit} onChange={e => setVehDeposit(e.target.value)} style={is} data-testid="input-tool-veh-deposit" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Interest Rate (%)</label>
                                  <input type="number" value={vehRate} onChange={e => setVehRate(e.target.value)} style={is} data-testid="input-tool-veh-rate" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Term (months)</label>
                                  <input type="number" value={vehMonths} onChange={e => setVehMonths(e.target.value)} style={is} data-testid="input-tool-veh-months" />
                                </div>
                                <div className="space-y-1 col-span-2">
                                  <label className="text-xs" style={{ color: mutedText }}>Balloon Payment (R)</label>
                                  <input type="number" value={vehBalloon} onChange={e => setVehBalloon(e.target.value)} placeholder="0" style={is} data-testid="input-tool-veh-balloon" />
                                </div>
                              </div>
                              <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: tc.inputBg }}>
                                {[
                                  { label: "Monthly Instalment", val: `R ${vehPMT.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`, accent: true },
                                  { label: "Total Repayable", val: `R ${vehTotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}` },
                                  { label: "Total Interest", val: `R ${(vehTotal - vehP).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}` },
                                ].map(({ label, val, accent }) => (
                                  <div key={label} className="flex justify-between text-xs">
                                    <span style={{ color: mutedText }}>{label}</span>
                                    <span className="font-semibold" style={{ color: accent ? accentColor : textColor }}>{val}</span>
                                  </div>
                                ))}
                                <p className="text-xs pt-1" style={{ color: mutedText, borderTop: `1px solid ${tc.borderColor}` }}>Estimate only — excludes initiation fees, insurance &amp; service plans.</p>
                              </div>
                            </>
                          )}
                          {toolKey === "bond" && (
                            <>
                              <p className="text-xs" style={{ color: mutedText }}>Calculate your monthly bond repayment and total interest over the loan term.</p>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1 col-span-2">
                                  <label className="text-xs" style={{ color: mutedText }}>Loan Amount (R)</label>
                                  <input type="number" value={bondAmount} onChange={e => setBondAmount(e.target.value)} style={is} data-testid="input-tool-bond-amount" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Interest Rate (%)</label>
                                  <input type="number" value={bondRate} onChange={e => setBondRate(e.target.value)} style={is} data-testid="input-tool-bond-rate" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Term (years)</label>
                                  <input type="number" value={bondTerm} onChange={e => setBondTerm(e.target.value)} style={is} data-testid="input-tool-bond-term" />
                                </div>
                              </div>
                              <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: tc.inputBg }}>
                                {[
                                  { label: "Monthly Repayment", val: `R ${bondPMT.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`, accent: true },
                                  { label: "Total Repayable", val: `R ${bondTotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}` },
                                  { label: "Total Interest Paid", val: `R ${bondInterest.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}` },
                                ].map(({ label, val, accent }) => (
                                  <div key={label} className="flex justify-between text-xs">
                                    <span style={{ color: mutedText }}>{label}</span>
                                    <span className="font-semibold" style={{ color: accent ? accentColor : textColor }}>{val}</span>
                                  </div>
                                ))}
                                <p className="text-xs pt-1" style={{ color: mutedText, borderTop: `1px solid ${tc.borderColor}` }}>Estimate only — excludes bond registration costs, transfer duties &amp; bank fees.</p>
                              </div>
                            </>
                          )}
                          {toolKey === "emergency" && (
                            <>
                              <p className="text-xs" style={{ color: mutedText }}>How much should you have set aside for unexpected events? Financial planners recommend 3–6 months of expenses.</p>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Monthly Expenses (R)</label>
                                  <input type="number" value={efMonthly} onChange={e => setEfMonthly(e.target.value)} style={is} data-testid="input-tool-ef-monthly" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Months of Cover</label>
                                  <input type="number" min="1" max="24" value={efMonths} onChange={e => setEfMonths(e.target.value)} style={is} data-testid="input-tool-ef-months" />
                                </div>
                              </div>
                              <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: tc.inputBg }}>
                                <div className="flex justify-between text-xs">
                                  <span style={{ color: mutedText }}>Emergency Fund Target</span>
                                  <span className="font-semibold" style={{ color: accentColor }}>R {efTarget.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span style={{ color: mutedText }}>Cover level</span>
                                  <span className="font-semibold" style={{ color: efMonthsNum < 3 ? "#ef4444" : efMonthsNum < 6 ? "#F59E0B" : "#10B981" }}>
                                    {efMonthsNum < 3 ? "Below recommended" : efMonthsNum < 6 ? "Minimum range" : "Well covered"}
                                  </span>
                                </div>
                                <p className="text-xs pt-1" style={{ color: mutedText, borderTop: `1px solid ${tc.borderColor}` }}>Keep this in an accessible money market or savings account earning interest.</p>
                              </div>
                            </>
                          )}
                          {toolKey === "lifecover" && (
                            <>
                              <p className="text-xs" style={{ color: mutedText }}>Estimate how much life cover your dependants would need to replace your income.</p>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Monthly Income (R)</label>
                                  <input type="number" value={lcIncome} onChange={e => setLcIncome(e.target.value)} style={is} data-testid="input-tool-lc-income" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Years to Replace</label>
                                  <input type="number" min="1" max="40" value={lcYears} onChange={e => setLcYears(e.target.value)} style={is} data-testid="input-tool-lc-years" />
                                </div>
                                <div className="space-y-1 col-span-2">
                                  <label className="text-xs" style={{ color: mutedText }}>Existing Cover (R)</label>
                                  <input type="number" value={lcExisting} onChange={e => setLcExisting(e.target.value)} placeholder="0" style={is} data-testid="input-tool-lc-existing" />
                                </div>
                              </div>
                              <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: tc.inputBg }}>
                                {[
                                  { label: "Income to Replace", val: `R ${lcNeeded.toLocaleString("en-ZA")}` },
                                  { label: "Existing Cover", val: `R ${lcExistingNum.toLocaleString("en-ZA")}` },
                                  lcShortfall > 0
                                    ? { label: "Cover Shortfall", val: `R ${lcShortfall.toLocaleString("en-ZA")}`, accent: true, red: true }
                                    : { label: "Cover Surplus", val: `R ${lcSurplus.toLocaleString("en-ZA")}`, accent: true, red: false },
                                ].map(({ label, val, accent, red }) => (
                                  <div key={label} className="flex justify-between text-xs">
                                    <span style={{ color: mutedText }}>{label}</span>
                                    <span className="font-semibold" style={{ color: accent ? (red ? "#ef4444" : "#10B981") : textColor }}>{val}</span>
                                  </div>
                                ))}
                                <p className="text-xs pt-1" style={{ color: mutedText, borderTop: `1px solid ${tc.borderColor}` }}>Simple income-replacement estimate — speak to an advisor for a full needs analysis.</p>
                              </div>
                            </>
                          )}
                          {toolKey === "debt" && (
                            <>
                              <p className="text-xs" style={{ color: mutedText }}>See how long it takes to pay off debt and how much interest you'll pay in total.</p>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1 col-span-2">
                                  <label className="text-xs" style={{ color: mutedText }}>Total Debt (R)</label>
                                  <input type="number" value={dpDebt} onChange={e => setDpDebt(e.target.value)} style={is} data-testid="input-tool-dp-debt" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Interest Rate (%)</label>
                                  <input type="number" value={dpRate} onChange={e => setDpRate(e.target.value)} style={is} data-testid="input-tool-dp-rate" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Monthly Payment (R)</label>
                                  <input type="number" value={dpPayment} onChange={e => setDpPayment(e.target.value)} style={is} data-testid="input-tool-dp-payment" />
                                </div>
                              </div>
                              {dpCantPayOff ? (
                                <div className="rounded-lg p-3 text-xs text-center" style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
                                  Your monthly payment doesn't cover the interest. Increase your payment above <strong>R {Math.ceil(dpMinPayment).toLocaleString("en-ZA")}/month</strong> to start reducing this debt.
                                </div>
                              ) : (
                                <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: tc.inputBg }}>
                                  {[
                                    { label: "Months to Pay Off", val: dpMonths > 0 ? `${dpMonths} months (${(dpMonths / 12).toFixed(1)} yrs)` : "—", accent: true },
                                    { label: "Total Paid", val: dpMonths > 0 ? `R ${dpTotalPaid.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}` : "—" },
                                    { label: "Total Interest", val: dpMonths > 0 ? `R ${dpTotalInterest.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}` : "—" },
                                  ].map(({ label, val, accent }) => (
                                    <div key={label} className="flex justify-between text-xs">
                                      <span style={{ color: mutedText }}>{label}</span>
                                      <span className="font-semibold" style={{ color: accent ? accentColor : textColor }}>{val}</span>
                                    </div>
                                  ))}
                                  <p className="text-xs pt-1" style={{ color: mutedText, borderTop: `1px solid ${tc.borderColor}` }}>Assumes fixed rate and consistent monthly payment. Actual results may vary.</p>
                                </div>
                              )}
                            </>
                          )}
                          {toolKey === "standard" && (
                            <>
                              <p className="text-xs" style={{ color: mutedText }}>Quick arithmetic — add, subtract, multiply, divide.</p>
                              <div className="rounded-lg px-3 py-2 text-right" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}` }}>
                                {stdOp && stdPrev && <p className="text-xs mb-0.5" style={{ color: mutedText }}>{stdPrev} {stdOp}</p>}
                                <p className="text-2xl font-bold tracking-tight truncate" style={{ color: textColor }} data-testid="text-tool-std-display">{stdDisplay}</p>
                              </div>
                              {[
                                ["C","±","%","÷"],
                                ["7","8","9","×"],
                                ["4","5","6","−"],
                                ["1","2","3","+"],
                                ["0",".","="],
                              ].map((row, ri) => (
                                <div key={ri} className={`grid gap-1.5 ${row.length === 3 ? "grid-cols-3" : "grid-cols-4"}`}>
                                  {row.map(key => {
                                    const isOp = ["÷","×","−","+","="].includes(key);
                                    const isFn = ["C","±","%"].includes(key);
                                    const isZero = key === "0" && row.length === 3;
                                    return (
                                      <button key={key} type="button" onClick={() => stdPress(key)} className={`py-2.5 rounded-lg text-sm font-semibold active:scale-95 ${isZero ? "col-span-2" : ""}`} style={{ backgroundColor: isOp ? accentColor : isFn ? tc.buttonSecondaryBg : tc.inputBg, color: isOp ? (tc.isDark ? "#000" : "#fff") : isFn ? accentColor : textColor, border: `1px solid ${isOp ? accentColor : tc.borderColor}` }} data-testid={`button-tool-std-${key}`}>{key}</button>
                                    );
                                  })}
                                </div>
                              ))}
                            </>
                          )}
                          {toolKey === "forex" && (
                            <>
                              <p className="text-xs" style={{ color: mutedText }}>Trader position sizing — value per pip and profit / loss for a given pip move (standard lot = 100 000 units).</p>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="col-span-2 space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Currency Pair</label>
                                  <select value={fxPair} onChange={e => setFxPair(e.target.value)} style={is} data-testid="select-tool-fx-pair">
                                    {["EURUSD","GBPUSD","AUDUSD","NZDUSD","USDCHF","USDCAD","USDJPY","USDZAR","EURZAR","GBPZAR","EURJPY","GBPJPY"].map(p => <option key={p} value={p}>{p}</option>)}
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Lot Size</label>
                                  <input type="number" value={fxLots} onChange={e => setFxLots(e.target.value)} step="0.01" style={is} data-testid="input-tool-fx-lots" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Pip Move</label>
                                  <input type="number" value={fxPips} onChange={e => setFxPips(e.target.value)} step="0.1" style={is} data-testid="input-tool-fx-pips" />
                                </div>
                              </div>
                              <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: tc.inputBg }}>
                                {[
                                  { label: "Pip Size", val: fxPipSize === 0.01 ? "0.01 (JPY pair)" : "0.0001" },
                                  { label: "Value per Pip (quote ccy)", val: fxValuePerPipUsd.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), accent: true },
                                  { label: `P&L on ${fxPips || 0} pips (quote ccy)`, val: fxPnlUsd.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), accent: true },
                                ].map(({ label, val, accent }) => (
                                  <div key={label} className="flex justify-between text-xs">
                                    <span style={{ color: mutedText }}>{label}</span>
                                    <span className="font-semibold" style={{ color: accent ? accentColor : textColor }}>{val}</span>
                                  </div>
                                ))}
                                <p className="text-xs pt-1" style={{ color: mutedText, borderTop: `1px solid ${tc.borderColor}` }}>Value is denominated in the second currency of the pair. Convert to ZAR using the Exchange Rate tool.</p>
                              </div>
                            </>
                          )}
                          {toolKey === "scan" && (
                            <>
                              <p className="text-xs" style={{ color: mutedText }}>
                                Snap an ID, payslip or proof of address and send it straight to {advisor.name}. Files are encrypted in transit and at rest.
                              </p>
                              <input
                                ref={scanInputRef}
                                type="file"
                                accept="image/*,application/pdf"
                                capture="environment"
                                multiple
                                className="hidden"
                                onChange={e => {
                                  const picked = e.target.files ? Array.from(e.target.files) : [];
                                  if (picked.length) {
                                    setScanFiles(prev => [...prev, ...picked].slice(0, 6));
                                    setScanSent(null);
                                    setScanError(null);
                                  }
                                  if (scanInputRef.current) scanInputRef.current.value = "";
                                }}
                                data-testid="input-tool-scan-file"
                              />
                              <button
                                type="button"
                                onClick={() => scanInputRef.current?.click()}
                                disabled={scanSending}
                                className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                                style={{ backgroundColor: accentColor, color: tc.isDark ? "#000" : "#fff" }}
                                data-testid="button-tool-scan-open"
                              >
                                <FileText className="h-4 w-4 inline mr-1.5" /> Take Photo / Choose File
                              </button>
                              {scanFiles.length > 0 && (
                                <div className="space-y-2">
                                  <div className="space-y-1.5">
                                    {scanFiles.map((f, i) => (
                                      <div key={i} className="flex items-center justify-between gap-2 text-xs rounded-lg px-2 py-1.5" style={{ backgroundColor: tc.inputBg }}>
                                        <span className="truncate" style={{ color: textColor }}>{f.name || `Scan ${i + 1}`}</span>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <span style={{ color: mutedText }}>{(f.size / 1024).toFixed(0)} KB</span>
                                          <button
                                            type="button"
                                            onClick={() => setScanFiles(prev => prev.filter((_, idx) => idx !== i))}
                                            disabled={scanSending}
                                            aria-label="Remove file"
                                            className="rounded p-1 hover:opacity-80"
                                            style={{ color: mutedText }}
                                            data-testid={`button-tool-scan-remove-${i}`}
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <input
                                    type="text"
                                    value={scanSenderName}
                                    onChange={e => setScanSenderName(e.target.value)}
                                    placeholder="Your name (optional)"
                                    disabled={scanSending}
                                    maxLength={120}
                                    style={is}
                                    data-testid="input-tool-scan-name"
                                  />
                                  <input
                                    type="email"
                                    value={scanSenderEmail}
                                    onChange={e => setScanSenderEmail(e.target.value)}
                                    placeholder="Your email (optional)"
                                    disabled={scanSending}
                                    maxLength={160}
                                    style={is}
                                    data-testid="input-tool-scan-email"
                                  />
                                  <textarea
                                    value={scanNote}
                                    onChange={e => setScanNote(e.target.value)}
                                    placeholder="Add a short note (optional)"
                                    disabled={scanSending}
                                    rows={2}
                                    maxLength={2000}
                                    style={{ ...is, resize: "vertical", minHeight: "60px" }}
                                    data-testid="textarea-tool-scan-note"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={sendScanDocuments}
                                      disabled={scanSending}
                                      className="flex-1 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                                      style={{ backgroundColor: accentColor, color: tc.isDark ? "#000" : "#fff" }}
                                      data-testid="button-tool-scan-send"
                                    >
                                      {scanSending ? (
                                        <><Loader2 className="h-3.5 w-3.5 inline mr-1.5 animate-spin" /> Sending…</>
                                      ) : (
                                        <>Send to Advisor</>
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { setScanFiles([]); setScanError(null); setScanSent(null); }}
                                      disabled={scanSending}
                                      className="px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-60"
                                      style={{ backgroundColor: tc.buttonSecondaryBg, color: textColor, border: `1px solid ${tc.borderColor}` }}
                                      data-testid="button-tool-scan-clear"
                                    >
                                      Clear
                                    </button>
                                  </div>
                                  <p className="text-xs" style={{ color: mutedText }}>
                                    By sending, you agree your documents may be processed by your advisor under POPIA.
                                  </p>
                                </div>
                              )}
                              {scanSent && (
                                <div className="flex items-start gap-2 text-xs rounded-lg px-3 py-2" style={{ backgroundColor: tc.inputBg, color: textColor, border: `1px solid ${tc.borderColor}` }} data-testid="status-tool-scan-sent">
                                  <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: accentColor }} />
                                  <span>Sent. {advisor.name} will receive your documents by email shortly.</span>
                                </div>
                              )}
                              {scanError && (
                                <div className="flex items-start gap-2 text-xs rounded-lg px-3 py-2" style={{ backgroundColor: tc.inputBg, color: textColor, border: `1px solid ${tc.borderColor}` }} data-testid="status-tool-scan-error">
                                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: accentColor }} />
                                  <span>{scanError}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
            ) : null,
          tradingview: (advisor as any).showTradingView ? (
            <TradingViewSection tc={tc} advisor={advisor} />
          ) : null,
          dailyquotes: (advisor as any).showDailyQuotes ? (
            <DailyQuoteSection tc={tc} advisor={advisor} />
          ) : null,
          compoundcalc: (advisor as any).showCompoundCalc ? (
            <CompoundCalcSection tc={tc} />
          ) : null,
          retirementcalc: (advisor as any).showRetirementCalc ? (
            <RetirementCalcSection tc={tc} />
          ) : null,
          calendar: (advisor as any).showFinancialCalendar ? (
            <FinancialCalendarSection tc={tc} />
          ) : null,
          financialdashboard: (advisor as any).showFinancialDashboard ? (
            <FinancialDashboard tc={tc} advisorName={advisor.name} />
          ) : null,
          };
          return profileSectionOrder.map((key, i) =>
            sectionMap[key] ? (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.06, duration: 0.38, ease: "easeOut" }}
              >
                {sectionMap[key]}
              </motion.div>
            ) : null
          );
        })()}

        {/* Emergency Contacts — fixed position, not in section ordering */}
        {!!(advisor as any).showEmergencyContacts && (
          <EmergencyContactsSection tc={tc} accentColor={accentColor} mutedText={mutedText} t={t} />
        )}

        {/* Documents — fixed position, not in section ordering */}
        {(advisor as any).showDocuments && (
          <div data-testid="section-documents">
            <button
              onClick={() => setInDevClicked(inDevClicked === "documents" ? null : "documents")}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}
              data-testid="button-indev-documents"
            >
              <FileText className="h-4 w-4" />{t.documentsUpload}
            </button>
            {inDevClicked === "documents" && (
              <div className="mt-1.5 text-center py-2.5 rounded-lg text-xs font-medium" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}`, color: mutedText }}>
                {t.comingSoon}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-3" data-testid="section-coming-soon">
          <ComingSoonCard
            title="Android Widget"
            description="A home-screen widget for quick profile access and advisor updates is planned for the native-app phase."
            icon={Smartphone}
            tc={tc}
          />
          <ComingSoonCard
            title="FAIS Agreement & eSign"
            description="A guided FAIS agreement and electronic-signature flow is being prepared for advisor-client onboarding."
            icon={FileCheck}
            tc={tc}
          />
        </div>

        {/* o. Contact Details */}
        {(hasContactDetails || (advisor as any).location) && (
          <div className="rounded-xl p-4 space-y-2.5" style={{ backgroundColor: cardBg, border: `1px solid ${tc.borderColor}` }} data-testid="section-contact">
            {advisor.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 flex-shrink-0" style={{ color: tc.accentColor }} />
                <a href={`mailto:${advisor.email}`} className="hover:underline truncate" style={{ color: textColor }} data-testid="text-contact-email">{advisor.email}</a>
              </div>
            )}
            {(advisor as any).contactNumber && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 flex-shrink-0" style={{ color: tc.accentColor }} />
                <a href={`tel:${(advisor as any).contactNumber}`} className="hover:underline" style={{ color: textColor }} data-testid="text-contact-phone">{(advisor as any).contactNumber}</a>
              </div>
            )}
            {(advisor as any).workingHours && (
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 flex-shrink-0" style={{ color: tc.accentColor }} />
                <span style={{ color: textColor }} data-testid="text-contact-hours">{(advisor as any).workingHours}</span>
              </div>
            )}
            {(advisor as any).location && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: tc.accentColor }} />
                <span style={{ color: textColor }} data-testid="text-contact-location">
                  {String((advisor as any).location).trim()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* o. QR Code / barcode (S2 sized to column; F-batch -15% to give the
              card a touch more breathing room without losing scannability). */}
        {advisor.showQrCode !== false && (
          <div className="flex flex-col items-center pt-4 space-y-3" data-testid="section-qr">
            <div className="p-5 rounded-2xl w-[85%] mx-auto" style={{ backgroundColor: "#ffffff" }}>
              <QRCodeSVG
                value={`https://${profileUrl}`}
                size={400}
                level="M"
                data-testid="qr-code"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
            <p className="text-xs text-center" style={{ color: mutedText }} data-testid="text-profile-url">{profileUrl}</p>
          </div>
        )}

        {/* F4 — unified BrandFooter. forceStack=true because the profile card
            is constrained to a narrow column (max ~440px) regardless of
            viewport width; the wide absolute-centered layout would overlap the
            logo and pills exactly like it did inside the advisor sub-panel. */}
        <div className="pt-4 pb-2">
          <BrandFooter
            compact
            forceStack
            poweredByLabel={t.poweredBy}
            theme={{
              cardBg: tc.cardBg,
              borderColor: tc.borderColor,
              textColor,
              mutedText,
              accentColor: tc.accentColor,
              buttonSecondaryBg: tc.buttonSecondaryBg,
            }}
          />
        </div>
      </div>
    </main>
  );
}
