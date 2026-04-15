import { useState, useMemo, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, AlertCircle, ChevronDown, ChevronUp, Linkedin, Globe, Phone, Users, Calculator, Clock, Mail, Facebook, Instagram, Youtube, FileText, BookOpen, TrendingUp, Lightbulb, Video, Download, Share2, CreditCard, Smartphone, MapPin } from "lucide-react";
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
  claimWill: string; requestCallback: string; referFriends: string; documentsUpload: string;
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
    claimWill: "Claim Your Free Will", requestCallback: "Request a Call Back",
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
      "tax-efficiency": { name: "Optimize Tax Efficiency", description: "Strategic tax planning to minimize your tax burden while maintaining full compliance. We analyze your financial situation to identify legitimate tax-saving opportunities and implement structures that optimize your after-tax returns." },
      "tax-investment": { name: "Tax-free Savings Accounts", description: "Investment strategies designed to maximize returns while minimizing tax impact. We structure portfolios using tax-advantaged vehicles and timing strategies to help grow your wealth more efficiently." },
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
    claimWill: "Eis u Gratis Testament", requestCallback: "Versoek 'n Terugbel",
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
    claimWill: "Thatha Ithestamente Lakho Mahhala", requestCallback: "Cela Ukubizwa Futhi",
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

export default function AdvisorProfile() {
  const [, profileParams] = useRoute("/profile/:slug");
  const [, directParams] = useRoute("/:slug");
  const [, navigate] = useLocation();
  const slug = profileParams?.slug || directParams?.slug || "";

  const { data: advisor, isLoading, error } = useQuery<Advisor>({
    queryKey: [`/api/advisors/slug/${slug}`],
    enabled: !!slug,
  });

  const [lang, setLang] = useState<Lang>("en");
  const [inDevClicked, setInDevClicked] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState<string | null>(null);
  const [financialMediaOpen, setFinancialMediaOpen] = useState(false);
  const [inDevFinancial, setInDevFinancial] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
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
  const [penBalance, setPenBalance] = useState("50000");
  const [penMonthly, setPenMonthly] = useState("2000");
  const [penRate, setPenRate] = useState("9");
  const [penYears, setPenYears] = useState("20");
  const [cgtSalePrice, setCgtSalePrice] = useState("500000");
  const [cgtCostBase, setCgtCostBase] = useState("300000");
  const [cgtIncome, setCgtIncome] = useState("25000");
  const [vehPrice, setVehPrice] = useState("350000");
  const [vehDeposit, setVehDeposit] = useState("70000");
  const [vehRate, setVehRate] = useState("11.75");
  const [vehMonths, setVehMonths] = useState("60");
  const [vehBalloon, setVehBalloon] = useState("0");

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

  useEffect(() => {
    if (!toolsOpen) return;
    const fetchRates = async () => {
      setErLoading(true);
      try {
        const res = await fetch(`https://open.er-api.com/v6/latest/${erFrom}`);
        const data = await res.json();
        if (data.result === "success") setErRates(data.rates);
      } catch { /* silent */ }
      setErLoading(false);
    };
    fetchRates();
  }, [erFrom, toolsOpen]);

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

  const profileUrl = `advisoryconnect.pro/${advisor.profileSlug}`;
  const initials = getInitials(advisor.name);

  const hasContactDetails = advisor.showContactDetails !== false && (
    (advisor as any).contactNumber || (advisor as any).workingHours || advisor.email
  );

  const themeBg = getThemeBackground(advisor.theme, (advisor as any).backgroundStyle);

  const profileShareUrl = `https://advisoryconnect.pro/${advisor.profileSlug}`;
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
    const vcf = [
      "BEGIN:VCARD", "VERSION:3.0",
      `FN:${advisor.name}`,
      advisor.title ? `TITLE:${advisor.title}` : null,
      advisor.email ? `EMAIL:${advisor.email}` : null,
      (advisor as any).contactNumber ? `TEL:${(advisor as any).contactNumber}` : null,
      advisor.websiteUrl ? `URL:${advisor.websiteUrl}` : null,
      advisor.linkedinUrl ? `X-SOCIALPROFILE;TYPE=linkedin:${advisor.linkedinUrl}` : null,
      `NOTE:View my full advisory profile at ${profileShareUrl}`,
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

  const handleDownloadBusinessCard = () => {
    const { from, to } = getInitialsBadgeColors(advisor.theme || "blue");
    const W = 400, H = 680, SCALE = 2;
    const HEADER_H = 300, BADGE_SIZE = 170, BADGE_X = (W - BADGE_SIZE) / 2, BADGE_Y = 30;
    const phone = (advisor as any).contactNumber || "";
    const location = (advisor as any).location || "";
    const workingHours = (advisor as any).workingHours || "";
    const cardInitials = getInitials(advisor.name);

    const canvas = document.createElement("canvas");
    canvas.width = W * SCALE; canvas.height = H * SCALE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(SCALE, SCALE);

    const drawCard = (photoImg?: HTMLImageElement) => {
      // Header gradient
      const headerGrad = ctx.createLinearGradient(0, 0, W, HEADER_H);
      headerGrad.addColorStop(0, from);
      headerGrad.addColorStop(1, to);
      ctx.fillStyle = headerGrad;
      ctx.fillRect(0, 0, W, HEADER_H);

      // White body
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, HEADER_H, W, H - HEADER_H);

      // Profile photo or initials badge
      if (photoImg) {
        ctx.save();
        ctx.beginPath();
        const cx = BADGE_X + BADGE_SIZE / 2, cy = BADGE_Y + BADGE_SIZE / 2, r = BADGE_SIZE / 2;
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        const src = photoImg;
        const aspect = src.naturalWidth / src.naturalHeight;
        let sx = 0, sy = 0, sw = src.naturalWidth, sh = src.naturalHeight;
        if (aspect > 1) { sw = sh; sx = (src.naturalWidth - sw) / 2; }
        else if (aspect < 1) { sh = sw; sy = (src.naturalHeight - sh) / 2; }
        ctx.drawImage(src, sx, sy, sw, sh, BADGE_X, BADGE_Y, BADGE_SIZE, BADGE_SIZE);
        ctx.restore();
        // White ring
        ctx.beginPath();
        ctx.arc(BADGE_X + BADGE_SIZE / 2, BADGE_Y + BADGE_SIZE / 2, BADGE_SIZE / 2, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.lineWidth = 4;
        ctx.stroke();
      } else {
        // Initials badge (rounded rect)
        const r = BADGE_SIZE * 0.17;
        const bx = BADGE_X, by = BADGE_Y, bs = BADGE_SIZE;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(bx + r, by); ctx.lineTo(bx + bs - r, by);
        ctx.quadraticCurveTo(bx + bs, by, bx + bs, by + r);
        ctx.lineTo(bx + bs, by + bs - r);
        ctx.quadraticCurveTo(bx + bs, by + bs, bx + bs - r, by + bs);
        ctx.lineTo(bx + r, by + bs);
        ctx.quadraticCurveTo(bx, by + bs, bx, by + bs - r);
        ctx.lineTo(bx, by + r);
        ctx.quadraticCurveTo(bx, by, bx + r, by);
        ctx.closePath();
        const badgeGrad = ctx.createLinearGradient(bx, by, bx + bs, by + bs);
        badgeGrad.addColorStop(0, "rgba(255,255,255,0.22)");
        badgeGrad.addColorStop(1, "rgba(255,255,255,0.07)");
        ctx.fillStyle = badgeGrad; ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.38)"; ctx.lineWidth = 2; ctx.stroke();
        const fontSize = bs * 0.42;
        ctx.font = `bold ${fontSize}px Georgia, serif`;
        ctx.textBaseline = "middle"; ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.fillText(cardInitials[0] || "", bx + bs * 0.3, by + bs * 0.55);
        ctx.fillStyle = "rgba(255,255,255,0.72)";
        ctx.fillText(cardInitials[1] || "", bx + bs * 0.7, by + bs * 0.55);
        ctx.restore();
      }

      // Name
      const nameY = BADGE_Y + BADGE_SIZE + 24;
      ctx.textAlign = "center"; ctx.fillStyle = "#ffffff";
      ctx.font = `bold 22px Arial, sans-serif`; ctx.textBaseline = "middle";
      ctx.fillText(advisor.name, W / 2, nameY);
      // Title
      if (advisor.title) {
        ctx.fillStyle = "rgba(255,255,255,0.72)";
        ctx.font = `500 11px Arial, sans-serif`;
        ctx.fillText(advisor.title.toUpperCase(), W / 2, nameY + 28);
      }

      // Thin divider line in white section
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(24, HEADER_H + 1, W - 48, 1);

      // Contact details
      const contactItems: [string, string][] = [];
      if (phone) contactItems.push(["📞", phone]);
      if (advisor.email) contactItems.push(["✉", advisor.email]);
      if (location) contactItems.push(["📍", location]);
      if (workingHours) contactItems.push(["🕐", workingHours]);

      ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillStyle = "#333333";
      ctx.font = `14px Arial, sans-serif`;
      let rowY = HEADER_H + 26;
      for (const [icon, text] of contactItems) {
        ctx.fillText(`${icon}  ${text}`, 28, rowY);
        rowY += 32;
      }
      if (contactItems.length === 0) {
        ctx.fillStyle = "#bbb"; ctx.font = `italic 13px Arial, sans-serif`;
        ctx.fillText("No contact details added yet", 28, rowY);
        rowY += 32;
      }

      // QR code — load from hidden SVG
      const qrEl = document.getElementById("hidden-qr-card") as SVGElement | null;
      const afterQr = () => {
        // "Powered by Advisory Connect" footer bar
        ctx.fillStyle = "#f7f7f7";
        ctx.fillRect(0, H - 30, W, 30);
        ctx.fillStyle = "#aaa"; ctx.font = `9px Arial, sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("Powered by Advisory Connect", W / 2, H - 15);
        // Download
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `${advisor.name.replace(/\s+/g, "-").toLowerCase()}-card.png`;
        link.click();
      };

      if (qrEl) {
        const QR_SIZE = 110;
        const qrX = (W - QR_SIZE) / 2;
        const qrY = H - 185;
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
          ctx.fillText("Scan to view full profile", W / 2, qrY + QR_SIZE + 16);
          ctx.fillStyle = "#bbb"; ctx.font = `9px Arial, sans-serif`;
          ctx.fillText(`advisoryconnect.pro/${advisor.profileSlug}`, W / 2, qrY + QR_SIZE + 30);
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

    const { from, to } = getInitialsBadgeColors(advisor.theme || "blue");

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
    <div className="min-h-screen" style={{ ...themeBg, color: textColor }} data-testid="profile-container">
      <div className="max-w-md mx-auto px-4 pt-6 pb-12 space-y-4">

        {/* Language toggle */}
        <div className="flex justify-end gap-1" data-testid="lang-toggle">
          {(["en", "af", "zu"] as Lang[]).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              className="px-2.5 py-1 rounded-md text-xs font-semibold transition-all"
              style={{ backgroundColor: lang === l ? accentColor : tc.buttonSecondaryBg, color: lang === l ? tc.buttonText : mutedText, border: `1px solid ${lang === l ? accentColor : tc.borderColor}` }}
              data-testid={`button-lang-${l}`}>
              {l === "en" ? "EN" : l === "af" ? "AF" : "ZU"}
            </button>
          ))}
        </div>

        {/* 1. Portrait Profile Header */}
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${tc.initialsCircleBorder}`, boxShadow: "0 8px 28px rgba(0,0,0,0.2)" }} data-testid="profile-header">
          {/* Top gradient bar */}
          <div className="flex flex-col items-center pt-8 pb-6 px-5 gap-4" style={{ background: `linear-gradient(160deg, ${getInitialsBadgeColors(advisor.theme || "blue").from} 0%, ${getInitialsBadgeColors(advisor.theme || "blue").to} 100%)` }}>
            {/* Circular photo or initials badge */}
            {advisor.profilePicUrl && advisor.showProfilePic !== false ? (
              <img src={advisor.profilePicUrl} alt={advisor.name}
                className="w-32 h-32 rounded-full object-cover"
                style={{ border: `4px solid rgba(255,255,255,0.55)`, boxShadow: "0 4px 20px rgba(0,0,0,0.35)" }}
                data-testid="img-profile-pic"
              />
            ) : (
              <div data-testid="section-initials-fallback">
                <ProfileInitialsBadge initials={initials} theme={advisor.theme || "blue"} size={128} downloadable={false} name={advisor.name} />
              </div>
            )}
            {/* Name + Title */}
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-wider leading-snug text-white uppercase" data-testid="text-advisor-name">{advisor.name}</h1>
              {advisor.title && <p className="text-sm mt-1 font-medium tracking-wide" style={{ color: "rgba(255,255,255,0.78)" }} data-testid="text-advisor-title">{advisor.title}</p>}
            </div>
          </div>
          {/* Bottom utility row */}
          <div className="grid grid-cols-2 gap-2 p-3" style={{ backgroundColor: cardBg }} data-testid="section-utility-buttons">
            <button onClick={handleDownloadBusinessCard} className={btnBase} style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }} data-testid="button-save-business-card">
              <CreditCard className="h-3.5 w-3.5 flex-shrink-0" />{t.saveCard}
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
            <button onClick={handleSaveContact} className={btnBase} style={{ backgroundColor: tc.buttonSecondaryBg, color: accentColor, border: `1px solid ${tc.borderColor}` }} data-testid="button-save-contact">
              <Download className="h-3.5 w-3.5 flex-shrink-0" />{t.saveContact}
            </button>
            <button onClick={handleShare} className={btnBase} style={{ backgroundColor: tc.buttonSecondaryBg, color: accentColor, border: `1px solid ${tc.borderColor}` }} data-testid="button-share-profile">
              <Share2 className="h-3.5 w-3.5 flex-shrink-0" />{shareCopied ? t.linkCopied : t.shareProfile}
            </button>
          </div>
        </div>

        {/* Hidden QR for business card PDF generation */}
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px", width: 0, height: 0, overflow: "hidden" }} aria-hidden="true">
          <QRCodeSVG id="hidden-qr-card" value={`https://advisoryconnect.pro/${advisor.profileSlug}`} size={120} level="M" />
        </div>

        {/* 2. Introduction & Bio */}
        {bioText && (
          <div className="rounded-xl p-5" style={{ backgroundColor: cardBg, border: `1px solid ${tc.borderColor}` }} data-testid="section-bio">
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: mutedText }} data-testid="text-bio">{bioText}</p>
          </div>
        )}

        {/* 3. Individual Services */}
        {individualServices.length > 0 && (
          <ServiceGroupDropdown
            title={t.individualServices} services={individualServices}
            borderColor={tc.borderColor} cardBg={cardBg} textColor={textColor}
            mutedText={mutedText} accentColor={accentColor}
            buttonBg={tc.buttonBg} buttonText={tc.buttonText}
            testId="section-individual-services"
          />
        )}

        {/* 4. Corporate Services */}
        {corporateServices.length > 0 && (
          <ServiceGroupDropdown
            title={t.corporateServices} services={corporateServices}
            borderColor={tc.borderColor} cardBg={cardBg} textColor={textColor}
            mutedText={mutedText} accentColor={accentColor}
            buttonBg={tc.buttonBg} buttonText={tc.buttonText}
            testId="section-corporate-services"
          />
        )}

        {/* 5. Social Links */}
        {advisor.showSocials !== false && (advisor.linkedinUrl || (advisor as any).facebookUrl || (advisor as any).instagramUrl || (advisor as any).youtubeUrl || advisor.websiteUrl) && (
          <div className="space-y-2" data-testid="section-socials">
            {[
              { url: advisor.linkedinUrl, label: t.linkedin, Icon: Linkedin, testId: "link-linkedin" },
              { url: (advisor as any).facebookUrl, label: t.facebook, Icon: Facebook, testId: "link-facebook" },
              { url: (advisor as any).instagramUrl, label: t.instagram, Icon: Instagram, testId: "link-instagram" },
              { url: (advisor as any).youtubeUrl, label: t.youtube, Icon: Youtube, testId: "link-youtube" },
              { url: advisor.websiteUrl, label: t.website, Icon: Globe, testId: "link-website" },
            ].filter(s => !!s.url).map(({ url, label, Icon, testId }) => (
              <a key={testId} href={url!} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl font-medium text-sm transition-opacity hover:opacity-80"
                style={{ backgroundColor: tc.buttonSecondaryBg, color: accentColor, border: `1px solid ${tc.borderColor}` }}
                data-testid={testId}>
                <Icon className="h-4 w-4" />{label}
              </a>
            ))}
          </div>
        )}

        {/* 6a. Request a Call Back — direct navigation button */}
        {advisor.showCallbackLink !== false && (
          <button
            onClick={() => navigate(`/${slug}/request-callback`)}
            className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}
            data-testid="button-request-callback"
          >
            <Phone className="h-4 w-4 flex-shrink-0" />
            {t.requestCallback}
          </button>
        )}

        {/* 6b. Refer Friends & Family — direct navigation button */}
        {advisor.showReferralsLink !== false && (
          <button
            onClick={() => navigate(`/${slug}/referrals`)}
            className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: tc.buttonSecondaryBg, color: accentColor, border: `1px solid ${tc.borderColor}` }}
            data-testid="button-refer-friends"
          >
            <Users className="h-4 w-4 flex-shrink-0" />
            {t.referFriends}
          </button>
        )}

        {/* Claim Your Free Will */}
        {(advisor as any).showComplimentaryWill && (
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${tc.borderColor}` }} data-testid="section-claim-will">
            <button
              onClick={() => setFeedbackOpen(feedbackOpen === "will" ? null : "will")}
              className="flex items-center justify-between w-full px-4 py-3.5 font-semibold text-sm"
              style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}
              data-testid="button-claim-will"
            >
              <div className="flex items-center gap-2.5"><BookOpen className="h-4 w-4 flex-shrink-0" /><span>{t.claimWill}</span></div>
              {feedbackOpen === "will" ? <ChevronUp className="h-4 w-4 flex-shrink-0 opacity-70" /> : <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-70" />}
            </button>
            {feedbackOpen === "will" && (
              <div className="px-4 py-3.5 space-y-3" style={{ backgroundColor: tc.cardBg, borderTop: `1px solid ${tc.borderColor}` }}>
                <p className="text-sm leading-relaxed" style={{ color: mutedText }}>Secure your family's future with a professionally drafted will at no cost. Complete a short form and our team will be in touch.</p>
                <button onClick={() => navigate(`/${advisor.profileSlug}/claim-will`)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-80"
                  style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}
                  data-testid="button-claim-will-continue">
                  Continue to Form →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Request Your Financial Documents */}
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

        {/* m. General Financial Media */}
        {(advisor as any).showFinancialMedia && (
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
        )}

        {/* n. Financial Tools */}
        {(advisor as any).showTools && (
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
                !!(advisor as any).showToolPension && "pension",
                !!(advisor as any).showToolCgt && "cgt",
                !!(advisor as any).showToolVehicle && "vehicle",
              ].filter(Boolean) as string[];

              // Pension calc
              const penB = parseFloat(penBalance) || 0, penM = parseFloat(penMonthly) || 0;
              const penR = parseFloat(penRate) / 100, penY = parseFloat(penYears) || 1;
              const penN = 12;
              const penFV = penB * Math.pow(1 + penR / penN, penN * penY)
                + (penR > 0 ? penM * ((Math.pow(1 + penR / penN, penN * penY) - 1) / (penR / penN)) : penM * penN * penY);
              const penContrib = penB + penM * penN * penY;

              // CGT calc (SA 2024/25 — individuals)
              const cgtGain = Math.max(0, (parseFloat(cgtSalePrice) || 0) - (parseFloat(cgtCostBase) || 0));
              const cgtAnnualExclusion = 40000;
              const cgtNet = Math.max(0, cgtGain - cgtAnnualExclusion);
              const cgtInclusion = cgtNet * 0.4; // 40% inclusion rate
              const cgtAnnualInc = (parseFloat(cgtIncome) || 0) * 12;
              const cgtTaxable = cgtAnnualInc + cgtInclusion;
              const cgtTaxFull = (() => { const TAX_B = [{min:0,max:237100,rate:0.18,base:0},{min:237101,max:370500,rate:0.26,base:42678},{min:370501,max:512800,rate:0.31,base:77362},{min:512801,max:673000,rate:0.36,base:121475},{min:673001,max:857900,rate:0.39,base:179147},{min:857901,max:1817000,rate:0.41,base:251258},{min:1817001,max:Infinity,rate:0.45,base:644489}]; let g=0; for(const b of TAX_B){if(cgtTaxable>=b.min)g=b.base+(Math.min(cgtTaxable,b.max)-b.min)*b.rate;} return Math.max(0,g-17235); })();
              const cgtTaxBase = (() => { const TAX_B = [{min:0,max:237100,rate:0.18,base:0},{min:237101,max:370500,rate:0.26,base:42678},{min:370501,max:512800,rate:0.31,base:77362},{min:512801,max:673000,rate:0.36,base:121475},{min:673001,max:857900,rate:0.39,base:179147},{min:857901,max:1817000,rate:0.41,base:251258},{min:1817001,max:Infinity,rate:0.45,base:644489}]; let g=0; for(const b of TAX_B){if(cgtAnnualInc>=b.min)g=b.base+(Math.min(cgtAnnualInc,b.max)-b.min)*b.rate;} return Math.max(0,g-17235); })();
              const cgtTaxDue = Math.max(0, cgtTaxFull - cgtTaxBase);

              // Vehicle finance calc
              const vehP = (parseFloat(vehPrice) || 0) - (parseFloat(vehDeposit) || 0);
              const vehR = parseFloat(vehRate) / 100 / 12;
              const vehN2 = parseInt(vehMonths) || 60;
              const vehBal = parseFloat(vehBalloon) || 0;
              const vehPMT = vehR > 0
                ? (vehP - vehBal * Math.pow(1 + vehR, -vehN2)) * (vehR * Math.pow(1 + vehR, vehN2)) / (Math.pow(1 + vehR, vehN2) - 1)
                : (vehP - vehBal) / vehN2;
              const vehTotal = vehPMT * vehN2 + vehBal;

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
                          {toolKey === "pension" && <><TrendingUp className="h-3.5 w-3.5" /> Pension Savings</>}
                          {toolKey === "cgt" && <><Calculator className="h-3.5 w-3.5" /> Capital Gains Tax</>}
                          {toolKey === "vehicle" && <><Calculator className="h-3.5 w-3.5" /> Vehicle Finance</>}
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
                          {toolKey === "pension" && (
                            <>
                              <p className="text-xs" style={{ color: mutedText }}>Estimate your retirement fund value based on current savings and monthly contributions.</p>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Current Balance (R)</label>
                                  <input type="number" value={penBalance} onChange={e => setPenBalance(e.target.value)} style={is} data-testid="input-tool-pen-balance" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Monthly Contribution (R)</label>
                                  <input type="number" value={penMonthly} onChange={e => setPenMonthly(e.target.value)} style={is} data-testid="input-tool-pen-monthly" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Annual Growth Rate (%)</label>
                                  <input type="number" value={penRate} onChange={e => setPenRate(e.target.value)} style={is} data-testid="input-tool-pen-rate" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Years to Retirement</label>
                                  <input type="number" value={penYears} onChange={e => setPenYears(e.target.value)} style={is} data-testid="input-tool-pen-years" />
                                </div>
                              </div>
                              <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: tc.inputBg }}>
                                {[
                                  { label: "Projected Fund Value", val: `R ${penFV.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`, accent: true },
                                  { label: "Total Contributed", val: `R ${penContrib.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}` },
                                  { label: "Growth Earned", val: `R ${(penFV - penContrib).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}` },
                                ].map(({ label, val, accent }) => (
                                  <div key={label} className="flex justify-between text-xs">
                                    <span style={{ color: mutedText }}>{label}</span>
                                    <span className="font-semibold" style={{ color: accent ? accentColor : textColor }}>{val}</span>
                                  </div>
                                ))}
                                <p className="text-xs pt-1" style={{ color: mutedText, borderTop: `1px solid ${tc.borderColor}` }}>Estimate only — excludes inflation, tax, and fund charges.</p>
                              </div>
                            </>
                          )}
                          {toolKey === "cgt" && (
                            <>
                              <p className="text-xs" style={{ color: mutedText }}>Estimate SA Capital Gains Tax payable when selling an asset (2024/25).</p>
                              <div className="space-y-2">
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Sale Price (R)</label>
                                  <input type="number" value={cgtSalePrice} onChange={e => setCgtSalePrice(e.target.value)} style={is} data-testid="input-tool-cgt-sale" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Cost Base / Purchase Price (R)</label>
                                  <input type="number" value={cgtCostBase} onChange={e => setCgtCostBase(e.target.value)} style={is} data-testid="input-tool-cgt-cost" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs" style={{ color: mutedText }}>Monthly Income (R)</label>
                                  <input type="number" value={cgtIncome} onChange={e => setCgtIncome(e.target.value)} style={is} data-testid="input-tool-cgt-income" />
                                </div>
                              </div>
                              <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: tc.inputBg }}>
                                {[
                                  { label: "Capital Gain", val: `R ${cgtGain.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}` },
                                  { label: "Annual Exclusion", val: `R ${cgtAnnualExclusion.toLocaleString("en-ZA")}` },
                                  { label: "Taxable Gain (40% inclusion)", val: `R ${cgtInclusion.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}` },
                                  { label: "Estimated CGT Payable", val: `R ${cgtTaxDue.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`, accent: true },
                                ].map(({ label, val, accent }) => (
                                  <div key={label} className="flex justify-between text-xs">
                                    <span style={{ color: mutedText }}>{label}</span>
                                    <span className="font-semibold" style={{ color: accent ? accentColor : textColor }}>{val}</span>
                                  </div>
                                ))}
                                <p className="text-xs pt-1" style={{ color: mutedText, borderTop: `1px solid ${tc.borderColor}` }}>Estimate only — primary residence exclusion and other deductions not included.</p>
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
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

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
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent((advisor as any).location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  style={{ color: textColor }}
                  data-testid="link-location-maps"
                >
                  {(advisor as any).location}
                </a>
              </div>
            )}
          </div>
        )}

        {/* o. QR Code / barcode */}
        {advisor.showQrCode !== false && (
          <div className="flex flex-col items-center pt-4 space-y-3" data-testid="section-qr">
            <div className="p-4 rounded-xl" style={{ backgroundColor: "#ffffff" }}>
              <QRCodeSVG value={`https://${profileUrl}`} size={200} level="M" data-testid="qr-code" />
            </div>
            <p className="text-xs" style={{ color: mutedText }} data-testid="text-profile-url">{profileUrl}</p>
          </div>
        )}

        <p className="text-center text-xs pt-4 pb-2" style={{ color: mutedText }}>
          {t.poweredBy}
        </p>
      </div>
    </div>
  );
}