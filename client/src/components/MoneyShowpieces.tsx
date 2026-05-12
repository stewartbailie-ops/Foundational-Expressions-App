import { useState } from "react";
import { TrendingDown, Receipt, Flame, Clock, TrendingUp, Coffee, Utensils, Tv, Dumbbell, Wine, Cigarette, ShoppingCart, Smartphone } from "lucide-react";

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
  // Optional — only Latte/Reality use this for sub-row backgrounds. Falls back
  // to a translucent accent so existing call sites that don't pass it still work.
  inputBg?: string;
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

// ─── Inflation Eats Your Million ─────────────────────────────────────────────
export function InflationMillion({ accentColor, borderColor, cardBg, textColor, mutedText }: ThemeProps) {
  const [amount, setAmount] = useState(1000000);
  const [years, setYears] = useState(20);
  const [inflation, setInflation] = useState(6);

  const realValue = amount / Math.pow(1 + inflation / 100, years);
  const lost = amount - realValue;
  const lostPct = (lost / amount) * 100;
  const barWidth = Math.max(6, (realValue / amount) * 100);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
      data-testid="card-inflation-million"
    >
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${borderColor}`, background: `linear-gradient(135deg, rgba(239,68,68,0.12) 0%, transparent 60%)` }}>
        <Flame className="h-4 w-4" style={{ color: "#ef4444" }} />
        <div>
          <div className="text-sm font-bold" style={{ color: textColor }}>Inflation Eats Your Million</div>
          <div className="text-[11px]" style={{ color: mutedText }}>What a lump sum is really worth in the future</div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <SliderRow
          label="Lump sum today"
          value={amount}
          display={fmtCompact(amount)}
          min={100000} max={5000000} step={50000}
          onChange={setAmount}
          accentColor={accentColor}
          mutedText={mutedText}
          testId="slider-inflation-amount"
        />
        <SliderRow
          label="Years from now"
          value={years}
          display={`${years} yrs`}
          min={5} max={40} step={1}
          onChange={setYears}
          accentColor={accentColor}
          mutedText={mutedText}
          testId="slider-inflation-years"
        />
        <SliderRow
          label="Assumed inflation"
          value={inflation}
          display={`${inflation}%`}
          min={3} max={12} step={0.5}
          onChange={setInflation}
          accentColor={accentColor}
          mutedText={mutedText}
          testId="slider-inflation-rate"
        />

        {/* Visual bar */}
        <div className="pt-2 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: mutedText }}>Buying power in {years} years</span>
            <span className="text-[11px] font-semibold" style={{ color: "#ef4444" }}>−{lostPct.toFixed(0)}% gone</span>
          </div>
          <div className="relative h-8 rounded-md overflow-hidden" style={{ backgroundColor: "rgba(239,68,68,0.12)", border: `1px solid rgba(239,68,68,0.25)` }}>
            <div
              className="h-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
              style={{ width: `${barWidth}%`, background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}cc 100%)` }}
              data-testid="bar-inflation-real"
            >
              {barWidth > 20 && <span className="text-[11px] font-bold text-white">{fmtCompact(realValue)}</span>}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg p-2.5" style={{ backgroundColor: `${accentColor}15`, border: `1px solid ${accentColor}35` }}>
            <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: mutedText }}>Real value</div>
            <div className="text-base font-bold" style={{ color: accentColor }} data-testid="text-inflation-real">{fmtCompact(realValue)}</div>
            <div className="text-[10px]" style={{ color: mutedText }}>in today's money</div>
          </div>
          <div className="rounded-lg p-2.5" style={{ backgroundColor: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.30)" }}>
            <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: mutedText }}>Buying power lost</div>
            <div className="text-base font-bold" style={{ color: "#ef4444" }} data-testid="text-inflation-lost">{fmtCompact(lost)}</div>
            <div className="text-[10px]" style={{ color: mutedText }}>silently evaporated</div>
          </div>
        </div>

        <div className="rounded-lg p-3 text-xs leading-relaxed" style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: textColor }} data-testid="text-inflation-punchline">
          Your <span className="font-bold">{fmtCompact(amount)}</span> today will only feel like <span className="font-bold" style={{ color: "#ef4444" }}>{fmtCompact(realValue)}</span> in {years} years. Inflation silently destroyed <span className="font-bold" style={{ color: "#ef4444" }}>{fmtCompact(lost)}</span> — without touching your account once.
        </div>
      </div>
    </div>
  );
}

// ─── The Cost of Waiting ──────────────────────────────────────────────────────
export function CostOfWaiting({ accentColor, borderColor, cardBg, textColor, mutedText }: ThemeProps) {
  const [monthly, setMonthly] = useState(2000);
  const [returnRate, setReturnRate] = useState(10);

  const fv = (startAge: number) => {
    const months = (65 - startAge) * 12;
    const r = returnRate / 100 / 12;
    if (months <= 0) return 0;
    return r > 0 ? monthly * ((Math.pow(1 + r, months) - 1) / r) : monthly * months;
  };

  const ages = [25, 35, 45] as const;
  const values = ages.map(age => ({ age, value: fv(age) }));
  const maxVal = Math.max(...values.map(v => v.value), 1);
  const COLORS = [accentColor, "#F59E0B", "#ef4444"];

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
      data-testid="card-cost-of-waiting"
    >
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${borderColor}`, background: `linear-gradient(135deg, ${accentColor}18 0%, transparent 60%)` }}>
        <Clock className="h-4 w-4" style={{ color: accentColor }} />
        <div>
          <div className="text-sm font-bold" style={{ color: textColor }}>The Cost of Waiting</div>
          <div className="text-[11px]" style={{ color: mutedText }}>Why starting sooner changes everything</div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <SliderRow
          label="Monthly investment"
          value={monthly}
          display={fmt(monthly)}
          min={500} max={10000} step={100}
          onChange={setMonthly}
          accentColor={accentColor}
          mutedText={mutedText}
          testId="slider-waiting-monthly"
        />
        <SliderRow
          label="Annual return"
          value={returnRate}
          display={`${returnRate}%`}
          min={7} max={15} step={0.5}
          onChange={setReturnRate}
          accentColor={accentColor}
          mutedText={mutedText}
          testId="slider-waiting-return"
        />

        {/* Horizontal bar chart */}
        <div className="space-y-3 pt-1">
          {values.map(({ age, value }, i) => {
            const barPct = Math.max(6, (value / maxVal) * 100);
            return (
              <div key={age} className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: mutedText }}>
                    Start at {age} → {65 - age} yrs
                  </span>
                  <span className="text-sm font-bold" style={{ color: COLORS[i] }}>{fmtCompact(value)}</span>
                </div>
                <div className="relative h-7 rounded-md overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: `1px solid ${borderColor}` }}>
                  <div
                    className="h-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                    style={{ width: `${barPct}%`, background: `linear-gradient(90deg, ${COLORS[i]}ee 0%, ${COLORS[i]}bb 100%)` }}
                    data-testid={`bar-waiting-age-${age}`}
                  >
                    {barPct > 22 && <span className="text-[11px] font-bold text-white">{fmtCompact(value)}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg p-3 text-xs leading-relaxed" style={{ backgroundColor: `${accentColor}10`, border: `1px solid ${accentColor}28`, color: textColor }} data-testid="text-waiting-punchline">
          Starting at <span className="font-bold" style={{ color: COLORS[0] }}>25</span> vs <span className="font-bold" style={{ color: "#ef4444" }}>45</span> with the same <span className="font-bold">{fmt(monthly)}/month</span> produces{" "}
          <span className="font-bold" style={{ color: COLORS[0] }}>{fmtCompact(values[0].value - values[2].value)} more</span> at retirement. Time in the market beats timing the market.
        </div>
      </div>
    </div>
  );
}

// ─── TaxBite ──────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// 30-Year Reality Check
// Extracted from AdvisorProfile.tsx (May 2026) so the same widget can render
// inside the advisor panel's Interactive Tools drop-down for previewing.
// ─────────────────────────────────────────────────────────────────────────────
export function RealityCheck({ accentColor, borderColor, cardBg, textColor, mutedText }: ThemeProps) {
  const [salary, setSalary] = useState(45000);
  const [savePct, setSavePct] = useState(10);
  const [years, setYears] = useState(30);

  const monthlySave = salary * (savePct / 100);
  const r = 0.09 / 12;
  const n = years * 12;
  const futureValue = r > 0 ? monthlySave * ((Math.pow(1 + r, n) - 1) / r) : monthlySave * n;
  const todaysMoney = futureValue / Math.pow(1.06, years);
  const annualExpensesNow = salary * (1 - savePct / 100) * 12;
  const futureAnnualExpenses = annualExpensesNow * Math.pow(1.06, years);
  const needAtRetirement = futureAnnualExpenses * 25;
  const gapPct = needAtRetirement > 0 ? (futureValue / needAtRetirement) * 100 : 0;
  const onTrack = gapPct >= 100;
  const gapColor = onTrack ? "#10B981" : gapPct >= 50 ? "#F59E0B" : "#EF4444";
  const gapLabel = onTrack ? "On track" : gapPct >= 50 ? "Halfway there" : "Big gap";
  const fmtZ = (v: number) => `R ${Math.round(v).toLocaleString("en-ZA")}`;

  const sliderRow = (label: string, value: number, min: number, max: number, step: number, display: string, onChange: (v: number) => void, testId: string) => (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: mutedText }}>{label}</span>
        <span className="text-sm font-bold" style={{ color: accentColor }}>{display}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.08) ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.08) 100%)`,
          accentColor,
        }}
        data-testid={testId}
        aria-label={`${label}: ${display}`}
      />
    </div>
  );

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }} data-testid="card-reality-check">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4" style={{ color: accentColor }} />
        <h3 className="text-sm font-semibold" style={{ color: textColor }}>30-Year Reality Check</h3>
      </div>
      <p className="text-xs" style={{ color: mutedText }}>
        A quick reality check on your retirement nest egg. Defaults are SA averages — tweak to match your own life.
      </p>
      <div className="space-y-3">
        {sliderRow("Salary / month", salary, 5000, 200000, 1000, `R ${salary.toLocaleString("en-ZA")}`, setSalary, "input-tool-rc-salary")}
        {sliderRow("You save", savePct, 0, 50, 1, `${savePct}%`, setSavePct, "input-tool-rc-save")}
        {sliderRow("Years to go", years, 1, 50, 1, `${years} yrs`, setYears, "input-tool-rc-years")}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { color: "#10B981", label: "What you'll have", val: fmtZ(futureValue), sub: "in future rands", testId: "stat-rc-have" },
          { color: "#F59E0B", label: "In today's money", val: fmtZ(todaysMoney), sub: "after inflation", testId: "stat-rc-today" },
          { color: "#EF4444", label: "What you'll need", val: fmtZ(needAtRetirement), sub: "to retire comfortably", testId: "stat-rc-need" },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3 text-center overflow-hidden" style={{ background: `linear-gradient(160deg, ${s.color}28, ${s.color}10)`, border: `1px solid ${s.color}55` }} data-testid={s.testId}>
            <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: s.color }}>{s.label}</div>
            <div className="text-sm font-extrabold mt-1 leading-tight" style={{ color: textColor }}>{s.val}</div>
            <div className="text-[9px] mt-0.5" style={{ color: mutedText }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl p-4 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${gapColor}22, ${gapColor}08)`, border: `1px solid ${gapColor}66` }} data-testid="banner-rc-shock">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: gapColor }}>{gapLabel}</div>
            <div className="text-[11px]" style={{ color: mutedText }}>
              You're at <span className="font-bold" style={{ color: textColor }}>{gapPct.toFixed(0)}%</span> of your retirement target
            </div>
          </div>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${gapColor}22` }}>
          <div className="h-full transition-all duration-500" style={{ width: `${Math.min(100, gapPct)}%`, backgroundColor: gapColor }} />
        </div>
        {!onTrack && (
          <p className="text-[11px] mt-2 leading-snug" style={{ color: textColor }}>
            {gapPct >= 50
              ? <>You're halfway there. Bumping your savings to <strong>{Math.min(50, Math.ceil(savePct + 5))}%</strong> could close the gap. Worth a chat?</>
              : <>That's a meaningful shortfall. A small bump in monthly savings now compounds into a huge difference later. Let's chat.</>
            }
          </p>
        )}
      </div>
      <p className="text-[10px]" style={{ color: mutedText }}>
        Assumes 9% growth p.a. and 6% inflation (SA long-run averages). Retirement need uses the 25× rule (4% safe withdrawal). Estimate only — for fun, not advice.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The Latte Millionaire
// Extracted from AdvisorProfile.tsx (May 2026). Self-contained — owns its own
// LATTE_ITEMS, toggle state and years input. Renders identically on the public
// profile and inside the advisor panel preview drop-down.
// ─────────────────────────────────────────────────────────────────────────────
const LATTE_ITEMS = [
  { key: "coffee",    icon: Coffee,       label: "Daily coffee shop",        defaultMonthly: 1350 },
  { key: "takeaways", icon: Utensils,     label: "Uber Eats / takeaways",    defaultMonthly: 1600 },
  { key: "streaming", icon: Tv,           label: "Streaming subscriptions",  defaultMonthly: 350 },
  { key: "gym",       icon: Dumbbell,     label: "Gym you don't really use", defaultMonthly: 500 },
  { key: "drinks",    icon: Wine,         label: "Friday night drinks",      defaultMonthly: 1200 },
  { key: "vape",      icon: Cigarette,    label: "Vape / cigarettes",        defaultMonthly: 600 },
  { key: "shopping",  icon: ShoppingCart, label: "Impulse online shopping",  defaultMonthly: 800 },
  { key: "phone",     icon: Smartphone,   label: "Latest phone every 2 yrs", defaultMonthly: 700 },
] as const;

export function LatteMillionaire({ accentColor, borderColor, cardBg, textColor, mutedText, inputBg }: ThemeProps) {
  const [items, setItems] = useState<Record<string, { enabled: boolean; amount: number }>>(
    () => Object.fromEntries(LATTE_ITEMS.map(i => [i.key, { enabled: i.key === "coffee" || i.key === "takeaways", amount: i.defaultMonthly }]))
  );
  const [years, setYears] = useState(30);
  const subBg = inputBg || `${accentColor}10`;

  const totalMonthly = LATTE_ITEMS.reduce(
    (sum, item) => sum + (items[item.key]?.enabled ? (items[item.key]?.amount || 0) : 0),
    0
  );
  const r = 0.09 / 12;
  const n = years * 12;
  const futureValue = r > 0 ? totalMonthly * ((Math.pow(1 + r, n) - 1) / r) : totalMonthly * n;
  const totalSpent = totalMonthly * n;
  const interestEarned = futureValue - totalSpent;
  const isMillionaire = futureValue >= 1_000_000;
  const fmtZ = (v: number) => `R ${Math.round(v).toLocaleString("en-ZA")}`;
  const enabledCount = LATTE_ITEMS.filter(i => items[i.key]?.enabled).length;

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }} data-testid="card-latte-millionaire">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4" style={{ color: accentColor }} />
        <h3 className="text-sm font-semibold" style={{ color: textColor }}>The Latte Millionaire</h3>
      </div>
      <p className="text-xs" style={{ color: mutedText }}>
        Tap the everyday spends that sound like you. Tweak the amounts to match your real life. Then prepare to clutch your wallet.
      </p>
      <div className="space-y-1.5">
        {LATTE_ITEMS.map((item, idx) => {
          const state = items[item.key];
          const enabled = state?.enabled;
          const isEditable = idx < 2;
          const amount = state?.amount || 0;
          const minAmt = 100, maxAmt = 5000;
          return (
            <div
              key={item.key}
              className="px-2.5 py-2 rounded-lg transition-all space-y-2"
              style={{
                backgroundColor: enabled ? `${accentColor}15` : subBg,
                border: `1px solid ${enabled ? `${accentColor}55` : borderColor}`,
                opacity: enabled ? 1 : 0.6,
              }}
              data-testid={`latte-item-${item.key}`}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setItems(prev => ({ ...prev, [item.key]: { ...prev[item.key], enabled: !prev[item.key]?.enabled } }))}
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: enabled ? `${accentColor}25` : "transparent",
                    color: enabled ? accentColor : mutedText,
                    border: `1px solid ${enabled ? `${accentColor}55` : borderColor}`,
                  }}
                  aria-label={`Toggle ${item.label}`}
                  data-testid={`button-latte-toggle-${item.key}`}
                >
                  <item.icon className="h-4 w-4" />
                </button>
                <span className="flex-1 text-xs font-medium truncate" style={{ color: textColor }}>{item.label}</span>
                <span className="text-xs font-bold whitespace-nowrap" style={{ color: enabled ? accentColor : mutedText }} data-testid={`text-latte-amount-${item.key}`}>R {amount.toLocaleString("en-ZA")}/mo</span>
              </div>
              {isEditable && enabled && (
                <input
                  type="range"
                  min={minAmt} max={maxAmt} step={50} value={Math.max(minAmt, Math.min(maxAmt, amount))}
                  onChange={e => setItems(prev => ({ ...prev, [item.key]: { ...prev[item.key], amount: Number(e.target.value) } }))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((Math.max(minAmt, Math.min(maxAmt, amount)) - minAmt) / (maxAmt - minAmt)) * 100}%, rgba(255,255,255,0.08) ${((Math.max(minAmt, Math.min(maxAmt, amount)) - minAmt) / (maxAmt - minAmt)) * 100}%, rgba(255,255,255,0.08) 100%)`,
                    accentColor,
                  }}
                  data-testid={`input-latte-amount-${item.key}`}
                  aria-label={`${item.label}: R${amount}/month`}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: mutedText }}>If invested instead for</span>
          <span className="text-sm font-bold" style={{ color: accentColor }}>{years} yrs</span>
        </div>
        <input
          type="range"
          min={5} max={40} step={1} value={years}
          onChange={e => setYears(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((years - 5) / 35) * 100}%, rgba(255,255,255,0.08) ${((years - 5) / 35) * 100}%, rgba(255,255,255,0.08) 100%)`,
            accentColor,
          }}
          data-testid="input-latte-years"
          aria-label={`Years invested: ${years}`}
        />
      </div>
      <div
        className="rounded-xl p-4 text-center relative overflow-hidden"
        style={{
          background: enabledCount === 0
            ? `linear-gradient(135deg, ${subBg}, ${subBg})`
            : isMillionaire
              ? `linear-gradient(135deg, #F59E0B33, #EF444422)`
              : `linear-gradient(135deg, ${accentColor}22, ${accentColor}08)`,
          border: `1px solid ${enabledCount === 0 ? borderColor : isMillionaire ? "#F59E0B66" : `${accentColor}55`}`,
        }}
        data-testid="banner-latte-result"
      >
        {enabledCount === 0 ? (
          <p className="text-xs" style={{ color: mutedText }}>Toggle on a few habits above to see the damage.</p>
        ) : (
          <>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: isMillionaire ? "#F59E0B" : accentColor }}>If you invested it instead</div>
            <div className="text-2xl font-extrabold" style={{ color: textColor }}>{fmtZ(futureValue)}</div>
            <div className="text-[11px] mt-1" style={{ color: mutedText }}>
              R {Math.round(totalMonthly).toLocaleString("en-ZA")}/mo × {years} yrs · interest earned: <strong style={{ color: textColor }}>{fmtZ(interestEarned)}</strong>
            </div>
            {isMillionaire && (
              <p className="text-[11px] mt-2 font-semibold" style={{ color: "#F59E0B" }}>
                That's a millionaire's worth of small change. Worth a chat?
              </p>
            )}
          </>
        )}
      </div>
      <p className="text-[10px]" style={{ color: mutedText }}>
        Assumes 9% growth p.a. (SA long-run average). Estimate only — for fun, not advice.
      </p>
    </div>
  );
}
