import { useState, useMemo, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, AlertCircle, ChevronDown, ChevronUp, Linkedin, Globe, Phone, Users, Calculator, MapPin, Clock, Mail } from "lucide-react";
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

const INCOME_RANGES_TAX = [
  { label: "R0k - R21k p/m", annual: 252000 },
  { label: "R21k - R32k p/m", annual: 384000 },
  { label: "R32k - R44k p/m", annual: 528000 },
  { label: "R44k - R56k p/m", annual: 672000 },
  { label: "R56k - R72k p/m", annual: 864000 },
  { label: "R72k - R150k p/m", annual: 1332000 },
  { label: "R150k+ p/m", annual: 1900000 },
];

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
  const [selectedIncome, setSelectedIncome] = useState("");
  const [growthRate, setGrowthRate] = useState("5");
  const [inflationRate, setInflationRate] = useState("5");
  const [showBreakdown, setShowBreakdown] = useState(false);

  const annualIncome = selectedIncome ? INCOME_RANGES_TAX.find(r => r.label === selectedIncome)?.annual || 0 : 0;
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
        <label className="block text-xs mb-1" style={{ color: mutedText }}>Income Range (Monthly)</label>
        <select value={selectedIncome} onChange={(e) => setSelectedIncome(e.target.value)} style={selectStyleCalc} data-testid="select-tax-income">
          <option value="" style={optionStyleCalc}>Select your income range</option>
          {INCOME_RANGES_TAX.map(r => (
            <option key={r.label} value={r.label} style={optionStyleCalc}>{r.label}</option>
          ))}
        </select>
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
    (advisor as any).contactNumber || (advisor as any).location || (advisor as any).workingHours || advisor.email
  );

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: bgColor, color: textColor }}
      data-testid="profile-container"
    >
      <div className="max-w-md mx-auto px-5 py-8 space-y-6">

        <div className="flex justify-center pt-2 pb-1">
          <img
            src="/advisory-connect-logo.png"
            alt="Advisory Connect"
            className="h-20 object-contain"
            data-testid="img-ac-logo"
          />
        </div>

        <div className="flex flex-col items-center text-center space-y-4" data-testid="profile-header">
          {advisor.profilePicUrl ? (
            <img
              src={advisor.profilePicUrl}
              alt={advisor.name}
              className="w-56 h-56 rounded-full object-cover border-4"
              style={{ borderColor: tc.initialsCircleBorder }}
              data-testid="img-profile-pic"
            />
          ) : (
            <div
              className="w-56 h-56 rounded-full flex items-center justify-center text-6xl font-bold"
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
            {(advisor as any).location && (
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: tc.accentColor }} />
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent((advisor as any).location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  style={{ color: textColor }}
                  data-testid="text-contact-location"
                >
                  {(advisor as any).location}
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