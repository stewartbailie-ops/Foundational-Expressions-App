import { useState } from "react";
import { TrendingDown, Receipt } from "lucide-react";

const fmt = (n: number) =>
  "R" + Math.round(n).toLocaleString("en-ZA");

const fmtCompact = (n: number) => {
  if (n >= 1_000_000) return "R" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "R" + Math.round(n / 1_000) + "k";
  return "R" + Math.round(n);
};

// SA 2024/25 income tax (annual)
function saTaxAnnual(annual: number, age = 35) {
  const brackets = [
    { min: 0, max: 237100, rate: 0.18, base: 0 },
    { min: 237101, max: 370500, rate: 0.26, base: 42678 },
    { min: 370501, max: 512800, rate: 0.31, base: 77362 },
    { min: 512801, max: 673000, rate: 0.36, base: 121475 },
    { min: 673001, max: 857900, rate: 0.39, base: 179147 },
    { min: 857901, max: 1817000, rate: 0.41, base: 251258 },
    { min: 1817001, max: Infinity, rate: 0.45, base: 644489 },
  ];
  let g = 0;
  for (const b of brackets) {
    if (annual >= b.min) g = b.base + (Math.min(annual, b.max) - b.min) * b.rate;
  }
  // SA 2024/25 rebates (cumulative): primary R17,235; +secondary R9,444 if 65+; +tertiary R3,145 if 75+
  let rebate = 17235;
  if (age >= 65) rebate += 9444;
  if (age >= 75) rebate += 3145;
  return Math.max(0, g - rebate);
}

type ThemeProps = {
  accentColor: string;
  borderColor: string;
  cardBg: string;
  textColor: string;
  mutedText: string;
};

function SliderRow({
  label, value, display, min, max, step, onChange, accentColor, mutedText, testId,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
  accentColor: string;
  mutedText: string;
  testId: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: mutedText }}>{label}</span>
        <span className="text-sm font-bold" style={{ color: accentColor }}>{display}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        data-testid={testId}
        aria-label={`${label}: ${display}`}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.08) ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.08) 100%)`,
          accentColor: accentColor,
        }}
      />
    </div>
  );
}

export function RealMoneySqueeze({ accentColor, borderColor, cardBg, textColor, mutedText }: ThemeProps) {
  const [salary, setSalary] = useState(45000);
  const [years, setYears] = useState(20);
  const [inflation, setInflation] = useState(6);

  const realFactor = Math.pow(1 + inflation / 100, years);
  const realValue = salary / realFactor;
  const lossPct = ((salary - realValue) / salary) * 100;
  const widthPct = Math.max(8, (realValue / salary) * 100);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
      data-testid="card-real-money-squeeze"
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${borderColor}`, background: `linear-gradient(135deg, ${accentColor}18 0%, transparent 60%)` }}>
        <TrendingDown className="h-4 w-4" style={{ color: accentColor }} />
        <div>
          <div className="text-sm font-bold" style={{ color: textColor }}>The Real-Money Squeeze</div>
          <div className="text-[11px]" style={{ color: mutedText }}>What inflation does to your salary over time</div>
        </div>
      </div>

      {/* Sliders */}
      <div className="p-4 space-y-4">
        <SliderRow
          label="Monthly salary today"
          value={salary}
          display={fmt(salary)}
          min={10000} max={200000} step={1000}
          onChange={setSalary}
          accentColor={accentColor}
          mutedText={mutedText}
          testId="slider-squeeze-salary"
        />
        <SliderRow
          label="Years from now"
          value={years}
          display={`${years} yrs`}
          min={1} max={40} step={1}
          onChange={setYears}
          accentColor={accentColor}
          mutedText={mutedText}
          testId="slider-squeeze-years"
        />
        <SliderRow
          label="Assumed inflation"
          value={inflation}
          display={`${inflation}%`}
          min={3} max={10} step={0.5}
          onChange={setInflation}
          accentColor={accentColor}
          mutedText={mutedText}
          testId="slider-squeeze-inflation"
        />

        {/* Animated bar */}
        <div className="pt-2 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: mutedText }}>Real value in {years} years</span>
            <span className="text-[11px] font-semibold" style={{ color: "#ef4444" }}>−{lossPct.toFixed(0)}% buying power</span>
          </div>
          <div className="relative h-8 rounded-md overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: `1px solid ${borderColor}` }}>
            <div
              className="h-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
              style={{ width: `${widthPct}%`, background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}dd 100%)` }}
              data-testid="bar-squeeze-real"
            >
              <span className="text-[11px] font-bold text-white">{fmtCompact(realValue)}</span>
            </div>
          </div>
        </div>

        {/* Punchline */}
        <div className="rounded-lg p-3 text-xs leading-relaxed" style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: textColor }} data-testid="text-squeeze-punchline">
          In <span className="font-bold">{years} years</span>, your <span className="font-bold">{fmt(salary)}/month</span> will only feel like <span className="font-bold" style={{ color: "#ef4444" }}>{fmt(realValue)}</span> in today's money — that's how much inflation erodes.
        </div>
      </div>
    </div>
  );
}

export function TaxBite({ accentColor, borderColor, cardBg, textColor, mutedText }: ThemeProps) {
  const [salary, setSalary] = useState(45000);
  const [age, setAge] = useState(35);

  const annual = salary * 12;
  const tax = saTaxAnnual(annual, age);
  const monthlyTax = tax / 12;
  const takeHome = salary - monthlyTax;
  const takePct = annual > 0 ? (1 - tax / annual) * 100 : 100;
  const taxPct = annual > 0 ? (tax / annual) * 100 : 0;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
      data-testid="card-tax-bite"
    >
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${borderColor}`, background: `linear-gradient(135deg, ${accentColor}18 0%, transparent 60%)` }}>
        <Receipt className="h-4 w-4" style={{ color: accentColor }} />
        <div>
          <div className="text-sm font-bold" style={{ color: textColor }}>The Tax Bite</div>
          <div className="text-[11px]" style={{ color: mutedText }}>What SARS takes vs what you take home</div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <SliderRow
          label="Monthly salary"
          value={salary}
          display={fmt(salary)}
          min={10000} max={200000} step={1000}
          onChange={setSalary}
          accentColor={accentColor}
          mutedText={mutedText}
          testId="slider-taxbite-salary"
        />
        <SliderRow
          label="Your age"
          value={age}
          display={`${age} yrs`}
          min={18} max={80} step={1}
          onChange={setAge}
          accentColor={accentColor}
          mutedText={mutedText}
          testId="slider-taxbite-age"
        />

        {/* Split bar */}
        <div className="pt-1 space-y-2">
          <div className="flex h-9 rounded-md overflow-hidden" style={{ border: `1px solid ${borderColor}` }}>
            <div
              className="flex items-center justify-center text-[11px] font-bold text-white transition-all duration-500"
              style={{ width: `${takePct}%`, background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}dd 100%)` }}
              data-testid="bar-tax-takehome"
            >
              {takePct >= 18 ? `${takePct.toFixed(0)}% in pocket` : `${takePct.toFixed(0)}%`}
            </div>
            <div
              className="flex items-center justify-center text-[11px] font-bold text-white transition-all duration-500"
              style={{ width: `${taxPct}%`, background: "linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)" }}
              data-testid="bar-tax-sars"
            >
              {taxPct >= 12 ? `${taxPct.toFixed(0)}% to SARS` : `${taxPct.toFixed(0)}%`}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="rounded-lg p-2.5" style={{ backgroundColor: `${accentColor}15`, border: `1px solid ${accentColor}30` }}>
              <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: mutedText }}>Take-home</div>
              <div className="text-base font-bold" style={{ color: accentColor }} data-testid="text-tax-takehome">{fmt(takeHome)}</div>
              <div className="text-[10px]" style={{ color: mutedText }}>per month</div>
            </div>
            <div className="rounded-lg p-2.5" style={{ backgroundColor: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.30)" }}>
              <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: mutedText }}>SARS gets</div>
              <div className="text-base font-bold" style={{ color: "#ef4444" }} data-testid="text-tax-sars">{fmt(monthlyTax)}</div>
              <div className="text-[10px]" style={{ color: mutedText }}>per month</div>
            </div>
          </div>
        </div>

        <div className="rounded-lg p-3 text-xs leading-relaxed" style={{ backgroundColor: `${accentColor}10`, border: `1px solid ${accentColor}25`, color: textColor }} data-testid="text-taxbite-punchline">
          On <span className="font-bold">{fmt(salary)}/month</span>, SARS takes about <span className="font-bold" style={{ color: "#ef4444" }}>{fmt(monthlyTax)}</span> — leaving you <span className="font-bold" style={{ color: accentColor }}>{fmt(takeHome)}</span> to live on. That's <span className="font-bold">{taxPct.toFixed(1)}%</span> gone before you even see it.
        </div>
      </div>
    </div>
  );
}
