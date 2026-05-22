import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  HeartPulse,
  PiggyBank,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { type getThemeColors } from "@/lib/themeUtils";

export type FinancialDashboardProps = {
  tc: ReturnType<typeof getThemeColors>;
  advisorName?: string | null;
};

type PulseInputs = {
  age: number;
  retirementAge: number;
  grossIncome: number;
  monthlySave: number;
  currentInvestments: number;
  essentialExpenses: number;
  emergencySavings: number;
  existingLifeCover: number;
  debtBalance: number;
  debtRate: number;
  debtPayment: number;
  inflation: number;
  expectedReturn: number;
  futureLumpSum: number;
  discretionarySpend: number;
};

const DEFAULT_INPUTS: PulseInputs = {
  age: 35,
  retirementAge: 65,
  grossIncome: 45000,
  monthlySave: 3000,
  currentInvestments: 250000,
  essentialExpenses: 25000,
  emergencySavings: 50000,
  existingLifeCover: 0,
  debtBalance: 150000,
  debtRate: 20,
  debtPayment: 3000,
  inflation: 6,
  expectedReturn: 9,
  futureLumpSum: 1000000,
  discretionarySpend: 3000,
};

const TAX_SCORE_SENSITIVITY = 140;
const DEBT_TO_INCOME_SCORE_WEIGHT = 250;
const DEBT_BALANCE_SCORE_WEIGHT = 35;
const SCORE_WEIGHTS = {
  future: 0.38,
  protection: 0.28,
  debt: 0.22,
  tax: 0.12,
};
const PROTECTION_SCORE_WEIGHTS = {
  emergencyFund: 0.55,
  lifeCover: 0.45,
};

const ZAR = (value: number) => `R ${Math.round(Math.max(0, value)).toLocaleString("en-ZA")}`;

const compactZar = (value: number) => {
  const safe = Math.max(0, value);
  if (safe >= 1_000_000) return `R ${(safe / 1_000_000).toFixed(1)}m`;
  if (safe >= 1_000) return `R ${Math.round(safe / 1_000)}k`;
  return ZAR(safe);
};

function annualTax(annualIncome: number, age: number) {
  const brackets = [
    { min: 0, max: 237100, rate: 0.18, base: 0 },
    { min: 237101, max: 370500, rate: 0.26, base: 42678 },
    { min: 370501, max: 512800, rate: 0.31, base: 77362 },
    { min: 512801, max: 673000, rate: 0.36, base: 121475 },
    { min: 673001, max: 857900, rate: 0.39, base: 179147 },
    { min: 857901, max: 1817000, rate: 0.41, base: 251258 },
    { min: 1817001, max: Infinity, rate: 0.45, base: 644489 },
  ];
  let grossTax = 0;
  for (const bracket of brackets) {
    if (annualIncome >= bracket.min) {
      grossTax = bracket.base + (Math.min(annualIncome, bracket.max) - bracket.min) * bracket.rate;
    }
  }
  let rebate = 17235;
  if (age >= 65) rebate += 9444;
  if (age >= 75) rebate += 3145;
  return Math.max(0, grossTax - rebate);
}

function futureValue(principal: number, monthly: number, annualRate: number, years: number) {
  const months = Math.max(0, years) * 12;
  const r = annualRate / 100 / 12;
  const grownPrincipal = principal * Math.pow(1 + r, months);
  const monthlySeries = r > 0 ? monthly * ((Math.pow(1 + r, months) - 1) / r) : monthly * months;
  return grownPrincipal + monthlySeries;
}

function debtPayoff(balance: number, annualRate: number, monthlyPayment: number) {
  const r = annualRate / 100 / 12;
  const minimumInterest = balance * r;
  if (balance <= 0 || monthlyPayment <= 0) return { months: 0, totalPaid: 0, canPay: balance <= 0 };
  if (r > 0 && monthlyPayment <= minimumInterest) return { months: 0, totalPaid: 0, canPay: false };
  const months = r > 0
    ? Math.ceil(-Math.log(1 - (balance * r) / monthlyPayment) / Math.log(1 + r))
    : Math.ceil(balance / monthlyPayment);
  return { months, totalPaid: months * monthlyPayment, canPay: true };
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function scoreBand(score: number) {
  if (score >= 75) return { label: "Strong pulse", color: "#10b981" };
  if (score >= 50) return { label: "Building", color: "#f59e0b" };
  return { label: "Needs attention", color: "#ef4444" };
}

function RangeInput({
  label, value, display, min, max, step, onChange, accentColor, mutedText, testId,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  accentColor: string;
  mutedText: string;
  testId: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block space-y-1.5">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase" style={{ color: mutedText }}>{label}</span>
        <span className="text-sm font-bold" style={{ color: accentColor }}>{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full"
        style={{
          accentColor,
          background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${pct}%, rgba(255,255,255,0.11) ${pct}%, rgba(255,255,255,0.11) 100%)`,
        }}
        data-testid={testId}
      />
    </label>
  );
}

function NumberField({
  label, value, onChange, min = 0, suffix, inputBg, borderColor, textColor, mutedText,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  suffix?: string;
  inputBg: string;
  borderColor: string;
  textColor: string;
  mutedText: string;
}) {
  return (
    <label className="space-y-1">
      <span className="text-[11px] font-semibold uppercase" style={{ color: mutedText }}>{label}</span>
      <span className="relative block">
        <input
          type="number"
          min={min}
          value={value}
          onChange={(event) => onChange(Math.max(min, Number(event.target.value) || 0))}
          className="w-full rounded-lg px-3 py-2 pr-10 text-sm outline-none"
          style={{ backgroundColor: inputBg, border: `1px solid ${borderColor}`, color: textColor }}
        />
        {suffix && <span className="absolute right-3 top-2.5 text-xs" style={{ color: mutedText }}>{suffix}</span>}
      </span>
    </label>
  );
}

function PulseRing({
  label, score, value, color, textColor, mutedText, borderColor, inputBg,
}: {
  label: string;
  score: number;
  value: string;
  color: string;
  textColor: string;
  mutedText: string;
  borderColor: string;
  inputBg: string;
}) {
  return (
    <div className="rounded-xl p-3" style={{ backgroundColor: inputBg, border: `1px solid ${borderColor}` }}>
      <div className="flex items-center gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${color} ${score}%, rgba(255,255,255,0.08) ${score}% 100%)` }}>
          <div className="grid h-10 w-10 place-items-center rounded-full text-[11px] font-extrabold" style={{ backgroundColor: inputBg, color }}>{score}</div>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase" style={{ color: mutedText }}>{label}</p>
          <p className="truncate text-sm font-bold" style={{ color: textColor }}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function InsightCard({
  icon, title, value, detail, color, borderColor, inputBg, textColor, mutedText, bar,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  detail: string;
  color: string;
  borderColor: string;
  inputBg: string;
  textColor: string;
  mutedText: string;
  bar?: number;
}) {
  return (
    <div className="rounded-xl p-3" style={{ backgroundColor: inputBg, border: `1px solid ${borderColor}` }}>
      <div className="flex min-w-0 items-start gap-2">
        <span className="mt-0.5" style={{ color }}>{icon}</span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase" style={{ color: mutedText }}>{title}</p>
          <p className="text-base font-extrabold" style={{ color: textColor }}>{value}</p>
        </div>
      </div>
      {bar !== undefined && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${clampPercent(bar)}%`, backgroundColor: color }} />
        </div>
      )}
      <p className="mt-2 text-xs leading-relaxed" style={{ color: mutedText }}>{detail}</p>
    </div>
  );
}

export function FinancialDashboard({ tc, advisorName }: FinancialDashboardProps) {
  const { accentColor, borderColor, cardBg, inputBg, textColor, mutedText } = tc;
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [boost, setBoost] = useState(500);
  const update = <K extends keyof PulseInputs>(key: K, value: PulseInputs[K]) => setInputs((current) => ({ ...current, [key]: value }));

  const model = useMemo(() => {
    const years = Math.max(1, inputs.retirementAge - inputs.age);
    const taxMonthly = annualTax(inputs.grossIncome * 12, inputs.age) / 12;
    const takeHome = Math.max(0, inputs.grossIncome - taxMonthly);
    const retirementPot = futureValue(inputs.currentInvestments, inputs.monthlySave, inputs.expectedReturn, years);
    const improvedPot = futureValue(inputs.currentInvestments, inputs.monthlySave + boost, inputs.expectedReturn, years);
    const realPot = retirementPot / Math.pow(1 + inputs.inflation / 100, years);
    const retirementNeed = inputs.essentialExpenses * 12 * 25 * Math.pow(1 + inputs.inflation / 100, years);
    const retirementRatio = retirementNeed > 0 ? retirementPot / retirementNeed : 0;
    const emergencyTarget = inputs.essentialExpenses * 6;
    const emergencyRatio = emergencyTarget > 0 ? inputs.emergencySavings / emergencyTarget : 0;
    const lifeCoverNeed = inputs.grossIncome * 12 * 10;
    const lifeCoverRatio = lifeCoverNeed > 0 ? inputs.existingLifeCover / lifeCoverNeed : 0;
    const debt = debtPayoff(inputs.debtBalance, inputs.debtRate, inputs.debtPayment);
    const debtToIncome = inputs.grossIncome > 0 ? inputs.debtPayment / inputs.grossIncome : 0;
    const futureIncomeValue = inputs.grossIncome / Math.pow(1 + inputs.inflation / 100, years);
    const lumpSumRealValue = inputs.futureLumpSum / Math.pow(1 + inputs.inflation / 100, years);
    const latteValue = futureValue(0, inputs.discretionarySpend, inputs.expectedReturn, years);
    const delayedValue = futureValue(0, inputs.monthlySave, inputs.expectedReturn, Math.max(1, years - 10));
    const taxScore = clampPercent(100 - (taxMonthly / Math.max(inputs.grossIncome, 1)) * TAX_SCORE_SENSITIVITY);
    const futureScore = clampPercent(retirementRatio * 100);
    const protectionScore = clampPercent((
      Math.min(1, emergencyRatio) * PROTECTION_SCORE_WEIGHTS.emergencyFund
      + Math.min(1, lifeCoverRatio) * PROTECTION_SCORE_WEIGHTS.lifeCover
    ) * 100);
    const debtScore = clampPercent(
      100
      - debtToIncome * DEBT_TO_INCOME_SCORE_WEIGHT
      - (inputs.debtBalance / Math.max(inputs.grossIncome * 12, 1)) * DEBT_BALANCE_SCORE_WEIGHT,
    );
    const score = Math.round(
      futureScore * SCORE_WEIGHTS.future
      + protectionScore * SCORE_WEIGHTS.protection
      + debtScore * SCORE_WEIGHTS.debt
      + taxScore * SCORE_WEIGHTS.tax,
    );
    return {
      years, taxMonthly, takeHome, retirementPot, improvedPot, realPot, retirementNeed, retirementRatio,
      emergencyTarget, emergencyRatio, lifeCoverNeed, lifeCoverRatio, debt, debtToIncome, futureIncomeValue,
      lumpSumRealValue, latteValue, delayedValue, futureScore: Math.round(futureScore),
      protectionScore: Math.round(protectionScore), debtScore: Math.round(debtScore), score,
    };
  }, [boost, inputs]);

  const band = scoreBand(model.score);
  const protectionColor = model.protectionScore >= 75 ? "#10b981" : model.protectionScore >= 45 ? "#f59e0b" : "#ef4444";
  const futureColor = model.futureScore >= 75 ? "#10b981" : model.futureScore >= 45 ? "#f59e0b" : "#ef4444";
  const debtColor = model.debtScore >= 75 ? "#10b981" : model.debtScore >= 45 ? "#f59e0b" : "#ef4444";
  const flags = [
    model.emergencyRatio < 0.5 && "Build a stronger cash buffer before life gets noisy.",
    model.lifeCoverRatio < 0.5 && "Discuss whether your dependants need more protection.",
    model.retirementRatio < 0.65 && "Test a higher retirement contribution while time can still compound it.",
    model.debtScore < 60 && "A debt strategy may free up future monthly breathing room.",
  ].filter(Boolean) as string[];

  return (
    <section className="overflow-hidden rounded-2xl" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }} data-testid="financial-dashboard">
      <div className="p-4" style={{ background: `linear-gradient(135deg, ${accentColor}22 0%, rgba(16,185,129,0.08) 44%, rgba(239,68,68,0.08) 100%)`, borderBottom: `1px solid ${borderColor}` }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2"><HeartPulse className="h-5 w-5" style={{ color: accentColor }} /><h3 className="text-base font-extrabold" style={{ color: textColor }}>Financial Dashboard</h3></div>
            <p className="max-w-xl text-xs leading-relaxed" style={{ color: mutedText }}>A live view of tax, inflation, retirement, protection and debt under the same assumptions.</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: inputBg, border: `1px solid ${borderColor}` }}>
            <div className="grid h-16 w-16 place-items-center rounded-full" style={{ background: `conic-gradient(${band.color} ${model.score}%, rgba(255,255,255,0.08) ${model.score}% 100%)` }}>
              <div className="grid h-12 w-12 place-items-center rounded-full text-lg font-black" style={{ backgroundColor: cardBg, color: band.color }}>{model.score}</div>
            </div>
            <div><p className="text-[11px] font-semibold uppercase" style={{ color: mutedText }}>Health score</p><p className="text-sm font-bold" style={{ color: textColor }}>{band.label}</p><p className="text-[11px]" style={{ color: mutedText }}>Educational snapshot</p></div>
          </div>
        </div>
      </div>
      <div className="space-y-4 p-4">
        <div className="rounded-xl p-3" style={{ backgroundColor: inputBg, border: `1px solid ${borderColor}` }}>
          <div className="grid gap-3 lg:grid-cols-3">
            <RangeInput label="Monthly gross income" value={inputs.grossIncome} display={ZAR(inputs.grossIncome)} min={10000} max={250000} step={1000} onChange={(value) => update("grossIncome", value)} accentColor={accentColor} mutedText={mutedText} testId="pulse-income" />
            <RangeInput label="Your age" value={inputs.age} display={`${inputs.age} yrs`} min={18} max={70} step={1} onChange={(value) => update("age", Math.min(value, inputs.retirementAge - 1))} accentColor={accentColor} mutedText={mutedText} testId="pulse-age" />
            <RangeInput label="Monthly investing" value={inputs.monthlySave} display={ZAR(inputs.monthlySave)} min={0} max={30000} step={250} onChange={(value) => update("monthlySave", value)} accentColor={accentColor} mutedText={mutedText} testId="pulse-saving" />
          </div>
          <button type="button" onClick={() => setAdvancedOpen((current) => !current)} className="mt-3 flex items-center gap-1 text-xs font-semibold" style={{ color: accentColor }}>
            {advancedOpen ? "Hide" : "Tune"} assumptions and protection inputs <ArrowRight className={`h-3.5 w-3.5 transition-transform ${advancedOpen ? "rotate-90" : ""}`} />
          </button>
          {advancedOpen && (
            <div className="mt-3 grid gap-2 border-t pt-3 sm:grid-cols-2 lg:grid-cols-4" style={{ borderColor }}>
              <NumberField label="Retirement age" value={inputs.retirementAge} min={inputs.age + 1} onChange={(value) => update("retirementAge", value)} suffix="yrs" inputBg={cardBg} borderColor={borderColor} textColor={textColor} mutedText={mutedText} />
              <NumberField label="Investments now" value={inputs.currentInvestments} onChange={(value) => update("currentInvestments", value)} inputBg={cardBg} borderColor={borderColor} textColor={textColor} mutedText={mutedText} />
              <NumberField label="Essential expenses" value={inputs.essentialExpenses} onChange={(value) => update("essentialExpenses", value)} inputBg={cardBg} borderColor={borderColor} textColor={textColor} mutedText={mutedText} />
              <NumberField label="Emergency savings" value={inputs.emergencySavings} onChange={(value) => update("emergencySavings", value)} inputBg={cardBg} borderColor={borderColor} textColor={textColor} mutedText={mutedText} />
              <NumberField label="Existing life cover" value={inputs.existingLifeCover} onChange={(value) => update("existingLifeCover", value)} inputBg={cardBg} borderColor={borderColor} textColor={textColor} mutedText={mutedText} />
              <NumberField label="Debt balance" value={inputs.debtBalance} onChange={(value) => update("debtBalance", value)} inputBg={cardBg} borderColor={borderColor} textColor={textColor} mutedText={mutedText} />
              <NumberField label="Debt payment" value={inputs.debtPayment} onChange={(value) => update("debtPayment", value)} inputBg={cardBg} borderColor={borderColor} textColor={textColor} mutedText={mutedText} />
              <NumberField label="Debt rate" value={inputs.debtRate} onChange={(value) => update("debtRate", value)} suffix="%" inputBg={cardBg} borderColor={borderColor} textColor={textColor} mutedText={mutedText} />
              <NumberField label="Inflation" value={inputs.inflation} onChange={(value) => update("inflation", value)} suffix="%" inputBg={cardBg} borderColor={borderColor} textColor={textColor} mutedText={mutedText} />
              <NumberField label="Expected return" value={inputs.expectedReturn} onChange={(value) => update("expectedReturn", value)} suffix="%" inputBg={cardBg} borderColor={borderColor} textColor={textColor} mutedText={mutedText} />
              <NumberField label="Future lump sum (inheritance, property sale, etc.)" value={inputs.futureLumpSum} onChange={(value) => update("futureLumpSum", value)} inputBg={cardBg} borderColor={borderColor} textColor={textColor} mutedText={mutedText} />
              <NumberField label="Small spends / month" value={inputs.discretionarySpend} onChange={(value) => update("discretionarySpend", value)} inputBg={cardBg} borderColor={borderColor} textColor={textColor} mutedText={mutedText} />
            </div>
          )}
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          <PulseRing label="Future readiness" score={model.futureScore} value={`${Math.round(model.retirementRatio * 100)}% of target`} color={futureColor} textColor={textColor} mutedText={mutedText} borderColor={borderColor} inputBg={inputBg} />
          <PulseRing label="Protection" score={model.protectionScore} value={`${(inputs.emergencySavings / Math.max(inputs.essentialExpenses, 1)).toFixed(1)} months cash`} color={protectionColor} textColor={textColor} mutedText={mutedText} borderColor={borderColor} inputBg={inputBg} />
          <PulseRing label="Debt pressure" score={model.debtScore} value={`${Math.round(model.debtToIncome * 100)}% of gross pay`} color={debtColor} textColor={textColor} mutedText={mutedText} borderColor={borderColor} inputBg={inputBg} />
        </div>
        <div className="grid gap-2 lg:grid-cols-2">
          <InsightCard icon={<Banknote className="h-4 w-4" />} title="What SARS takes" value={`${ZAR(model.taxMonthly)} / month`} detail={`${ZAR(model.takeHome)} remains before the rest of life starts spending it.`} color="#ef4444" borderColor={borderColor} inputBg={inputBg} textColor={textColor} mutedText={mutedText} bar={(model.taxMonthly / Math.max(inputs.grossIncome, 1)) * 100} />
          <InsightCard icon={<TrendingDown className="h-4 w-4" />} title="Inflation squeeze" value={`${ZAR(model.futureIncomeValue)} real pay`} detail={`Your ${ZAR(inputs.grossIncome)} monthly income only feels like this in ${model.years} years at ${inputs.inflation}% inflation.`} color="#f59e0b" borderColor={borderColor} inputBg={inputBg} textColor={textColor} mutedText={mutedText} bar={(model.futureIncomeValue / Math.max(inputs.grossIncome, 1)) * 100} />
          <InsightCard icon={<PiggyBank className="h-4 w-4" />} title="Retirement gap" value={model.retirementRatio >= 1 ? "Target covered" : `${compactZar(model.retirementNeed - model.retirementPot)} gap`} detail={`${compactZar(model.retirementPot)} projected pot, worth ${compactZar(model.realPot)} in today's money.`} color={futureColor} borderColor={borderColor} inputBg={inputBg} textColor={textColor} mutedText={mutedText} bar={model.retirementRatio * 100} />
          <InsightCard icon={<ShieldCheck className="h-4 w-4" />} title="Emergency fund" value={`${compactZar(Math.max(0, model.emergencyTarget - inputs.emergencySavings))} gap`} detail={`A six-month cash target is ${compactZar(model.emergencyTarget)} from your essential expenses.`} color={protectionColor} borderColor={borderColor} inputBg={inputBg} textColor={textColor} mutedText={mutedText} bar={model.emergencyRatio * 100} />
          <InsightCard icon={<AlertTriangle className="h-4 w-4" />} title="Life cover lens" value={`${compactZar(Math.max(0, model.lifeCoverNeed - inputs.existingLifeCover))} short`} detail={`Simple ten-year income replacement target: ${compactZar(model.lifeCoverNeed)} before a full needs analysis.`} color={protectionColor} borderColor={borderColor} inputBg={inputBg} textColor={textColor} mutedText={mutedText} bar={model.lifeCoverRatio * 100} />
          <InsightCard icon={<TrendingUp className="h-4 w-4" />} title="Small spend, big future" value={compactZar(model.latteValue)} detail={`${ZAR(inputs.discretionarySpend)} redirected monthly could compound over ${model.years} years.`} color={accentColor} borderColor={borderColor} inputBg={inputBg} textColor={textColor} mutedText={mutedText} />
        </div>
        <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-xl p-3" style={{ backgroundColor: inputBg, border: `1px solid ${borderColor}` }}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="text-[11px] font-semibold uppercase" style={{ color: mutedText }}>What changes most?</p><p className="text-sm font-bold" style={{ color: textColor }}>Add {ZAR(boost)} to monthly investing</p></div>
              <div className="w-full sm:w-56"><RangeInput label="Monthly boost" value={boost} display={ZAR(boost)} min={0} max={5000} step={250} onChange={setBoost} accentColor={accentColor} mutedText={mutedText} testId="pulse-boost" /></div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg p-3" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}><p className="text-[11px] font-semibold uppercase" style={{ color: mutedText }}>Current path</p><p className="text-lg font-black" style={{ color: textColor }}>{compactZar(model.retirementPot)}</p></div>
              <div className="rounded-lg p-3" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}><p className="text-[11px] font-semibold uppercase" style={{ color: mutedText }}>Small change</p><p className="text-lg font-black" style={{ color: accentColor }}>{compactZar(model.improvedPot)}</p></div>
              <div className="rounded-lg p-3" style={{ backgroundColor: `${accentColor}16`, border: `1px solid ${accentColor}55` }}><p className="text-[11px] font-semibold uppercase" style={{ color: mutedText }}>Difference</p><p className="text-lg font-black" style={{ color: textColor }}>{compactZar(model.improvedPot - model.retirementPot)}</p></div>
            </div>
            <div className="mt-3 rounded-lg p-3 text-xs leading-relaxed" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, color: mutedText }}>Starting ten years later with the same monthly investment projects about <strong style={{ color: "#ef4444" }}>{compactZar(model.delayedValue)}</strong>. The time gap does the loudest talking.</div>
          </div>
          <div className="space-y-2 rounded-xl p-3" style={{ backgroundColor: inputBg, border: `1px solid ${borderColor}` }}>
            <div><p className="text-[11px] font-semibold uppercase" style={{ color: mutedText }}>Advisor conversation flags</p><p className="text-sm font-bold" style={{ color: textColor }}>Areas worth discussing{advisorName ? ` with ${advisorName}` : ""}</p></div>
            {flags.length === 0 ? <p className="rounded-lg p-3 text-xs" style={{ backgroundColor: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.32)", color: textColor }}>This snapshot looks balanced. Try a more demanding scenario to see where it bends.</p> : flags.map((flag) => <p key={flag} className="rounded-lg p-2.5 text-xs leading-relaxed" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, color: textColor }}>{flag}</p>)}
            <div className="rounded-lg p-3 text-xs leading-relaxed" style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.24)", color: mutedText }}>These flags are conversation starters. A full needs analysis still belongs with the advisor.</div>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <InsightCard icon={<TrendingDown className="h-4 w-4" />} title="Inflation eats the lump sum" value={`${compactZar(model.lumpSumRealValue)} real value`} detail={`${compactZar(inputs.futureLumpSum)} today after ${model.years} years of inflation pressure.`} color="#ef4444" borderColor={borderColor} inputBg={inputBg} textColor={textColor} mutedText={mutedText} bar={(model.lumpSumRealValue / Math.max(inputs.futureLumpSum, 1)) * 100} />
          <InsightCard icon={<AlertTriangle className="h-4 w-4" />} title="Debt freedom" value={model.debt.canPay ? model.debt.months > 0 ? `${model.debt.months} months` : "No debt loaded" : "Payment stalls"} detail={model.debt.canPay ? `${compactZar(Math.max(0, model.debt.totalPaid - inputs.debtBalance))} estimated interest on the current payoff path.` : "The current payment does not clear monthly interest. Raise the payment or lower the rate."} color={debtColor} borderColor={borderColor} inputBg={inputBg} textColor={textColor} mutedText={mutedText} />
        </div>
        <p className="text-[11px] leading-relaxed" style={{ color: mutedText }}>Educational estimate only. It uses simplified South African tax assumptions based on 2025/26 SARS rates, inflation, protection and compound-growth assumptions and is not personalised financial advice.</p>
      </div>
    </section>
  );
}
