import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Download,
  HeartPulse,
  PiggyBank,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { jsPDF } from "jspdf";
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

type LifeEventKey = "marriage" | "child" | "vehicle" | "home" | "promotion" | "jobLoss";

const LIFE_EVENTS: Array<{ key: LifeEventKey; label: string; detail: string }> = [
  { key: "marriage", label: "Marriage", detail: "+R5k expenses" },
  { key: "child", label: "Child", detail: "+R7k expenses" },
  { key: "vehicle", label: "Vehicle", detail: "+R250k debt" },
  { key: "home", label: "Home purchase", detail: "+R1.5m debt" },
  { key: "promotion", label: "Promotion", detail: "+R15k income" },
  { key: "jobLoss", label: "Job loss", detail: "income pause" },
];

const SA_BENCHMARKS = {
  avgSavings: 85000,
  avgDebt: 320000,
  avgIncome: 28000,
  avgEmergencyMonths: 0.8,
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
          <p className="text-[11px] font-semibold uppercase leading-tight" style={{ color: mutedText }}>{label}</p>
          <p className="break-words text-sm font-bold leading-tight" style={{ color: textColor }}>{value}</p>
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
          <p className="break-words text-base font-extrabold" style={{ color: textColor }}>{value}</p>
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

function buildDashboardModel(inputs: PulseInputs, boost: number, taxableDeductionAnnual = 0) {
  const years = Math.max(1, inputs.retirementAge - inputs.age);
  const taxableAnnualIncome = Math.max(0, inputs.grossIncome * 12 - taxableDeductionAnnual);
  const taxMonthly = annualTax(taxableAnnualIncome, inputs.age) / 12;
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
}

export function FinancialDashboard({ tc, advisorName }: FinancialDashboardProps) {
  const { accentColor, borderColor, cardBg, inputBg, textColor, mutedText } = tc;
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [withAdvisor, setWithAdvisor] = useState(false);
  const [lifeEventsOpen, setLifeEventsOpen] = useState(false);
  const [lifeEvents, setLifeEvents] = useState<LifeEventKey[]>([]);
  const [boost, setBoost] = useState(500);
  const update = <K extends keyof PulseInputs>(key: K, value: PulseInputs[K]) => setInputs((current) => ({ ...current, [key]: value }));

  const effectiveInputs = useMemo(() => {
    const next = { ...inputs };
    if (lifeEvents.includes("marriage")) next.essentialExpenses += 5000;
    if (lifeEvents.includes("child")) next.essentialExpenses += 7000;
    if (lifeEvents.includes("vehicle")) {
      next.debtBalance += 250000;
      next.debtPayment += 3000;
    }
    if (lifeEvents.includes("home")) {
      next.debtBalance += 1500000;
      next.debtPayment += 9000;
    }
    if (lifeEvents.includes("promotion")) {
      next.grossIncome += 15000;
      next.monthlySave += 2000;
    }
    if (lifeEvents.includes("jobLoss")) {
      next.grossIncome = 0;
      next.monthlySave = 0;
    }
    return next;
  }, [inputs, lifeEvents]);

  const model = useMemo(() => buildDashboardModel(effectiveInputs, boost), [boost, effectiveInputs]);

  const advisorScenario = useMemo(() => {
    const monthlySaveDelta = effectiveInputs.grossIncome * 0.15;
    const annualRaDeduction = Math.min(monthlySaveDelta * 12, effectiveInputs.grossIncome * 12 * 0.275, 350000);
    const advisedInputs = {
      ...effectiveInputs,
      monthlySave: effectiveInputs.monthlySave + monthlySaveDelta,
      debtRate: Math.max(0, effectiveInputs.debtRate - 3),
      emergencySavings: Math.max(effectiveInputs.emergencySavings, effectiveInputs.essentialExpenses * 6),
      existingLifeCover: Math.max(effectiveInputs.existingLifeCover, effectiveInputs.grossIncome * 12 * 10),
    };
    const advisedModel = buildDashboardModel(advisedInputs, boost, annualRaDeduction);
    return {
      model: advisedModel,
      taxSavingMonthly: Math.max(0, model.taxMonthly - advisedModel.taxMonthly),
    };
  }, [boost, effectiveInputs, model.taxMonthly]);

  const visibleModel = withAdvisor ? advisorScenario.model : model;
  const displayEmergencySavings = withAdvisor
    ? Math.max(effectiveInputs.emergencySavings, effectiveInputs.essentialExpenses * 6)
    : effectiveInputs.emergencySavings;

  const band = scoreBand(visibleModel.score);
  const advisedBand = scoreBand(advisorScenario.model.score);
  const protectionColor = visibleModel.protectionScore >= 75 ? "#10b981" : visibleModel.protectionScore >= 45 ? "#f59e0b" : "#ef4444";
  const futureColor = visibleModel.futureScore >= 75 ? "#10b981" : visibleModel.futureScore >= 45 ? "#f59e0b" : "#ef4444";
  const debtColor = visibleModel.debtScore >= 75 ? "#10b981" : visibleModel.debtScore >= 45 ? "#f59e0b" : "#ef4444";
  const scoreDelta = advisorScenario.model.score - model.score;
  const retirementDelta = advisorScenario.model.retirementPot - model.retirementPot;
  const fireNumber = effectiveInputs.essentialExpenses * 12 * 25;
  let fireYears = 0;
  for (let y = 1; y <= 60; y += 1) {
    if (futureValue(effectiveInputs.currentInvestments, effectiveInputs.monthlySave, effectiveInputs.expectedReturn, y) >= fireNumber) {
      fireYears = y;
      break;
    }
  }
  const freedomAge = effectiveInputs.age + fireYears;
  const savingsTotal = effectiveInputs.currentInvestments + effectiveInputs.emergencySavings;
  const activeLifeEvents = LIFE_EVENTS.filter((event) => lifeEvents.includes(event.key));
  const benchmarkRows = [
    {
      label: "Income",
      positive: effectiveInputs.grossIncome >= SA_BENCHMARKS.avgIncome,
      text: `${ZAR(Math.abs(effectiveInputs.grossIncome - SA_BENCHMARKS.avgIncome))} ${effectiveInputs.grossIncome >= SA_BENCHMARKS.avgIncome ? "more" : "less"} than average`,
    },
    {
      label: "Savings",
      positive: savingsTotal >= SA_BENCHMARKS.avgSavings,
      text: `${ZAR(Math.abs(savingsTotal - SA_BENCHMARKS.avgSavings))} ${savingsTotal >= SA_BENCHMARKS.avgSavings ? "ahead" : "behind"}`,
    },
    {
      label: "Debt",
      positive: effectiveInputs.debtBalance <= SA_BENCHMARKS.avgDebt,
      text: `${ZAR(Math.abs(effectiveInputs.debtBalance - SA_BENCHMARKS.avgDebt))} ${effectiveInputs.debtBalance <= SA_BENCHMARKS.avgDebt ? "less" : "more"} debt`,
    },
  ];
  const flags = [
    visibleModel.emergencyRatio < 0.5 && "Build a stronger cash buffer before life gets noisy.",
    visibleModel.lifeCoverRatio < 0.5 && "Discuss whether your dependants need more protection.",
    visibleModel.retirementRatio < 0.65 && "Test a higher retirement contribution while time can still compound it.",
    visibleModel.debtScore < 60 && "A debt strategy may free up future monthly breathing room.",
  ].filter(Boolean) as string[];

  const toggleLifeEvent = (key: LifeEventKey) => {
    setLifeEvents((current) => current.includes(key) ? current.filter((event) => event !== key) : [...current, key]);
  };

  const downloadSummaryPdf = () => {
    const generatedAt = new Date();
    const pdf = new jsPDF();
    pdf.setFillColor(18, 45, 68);
    pdf.rect(0, 0, 210, 38, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.text("Financial Dashboard", 16, 22);
    pdf.setFontSize(10);
    pdf.text(`Prepared for ${advisorName || "your advisor"} | ${generatedAt.toLocaleDateString("en-ZA")}`, 16, 31);

    pdf.setTextColor(24, 35, 48);
    pdf.setFontSize(14);
    pdf.text("Key inputs", 16, 54);
    pdf.setFontSize(10);
    const inputRows = [
      ["Monthly gross income", ZAR(inputs.grossIncome)],
      ["Current age", `${inputs.age} years`],
      ["Retirement age", `${inputs.retirementAge} years`],
      ["Monthly investing", ZAR(inputs.monthlySave)],
    ];
    inputRows.forEach(([label, value], index) => {
      const y = 66 + index * 8;
      pdf.setFont("helvetica", "bold");
      pdf.text(label, 16, y);
      pdf.setFont("helvetica", "normal");
      pdf.text(value, 82, y);
    });

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("Score snapshot", 16, 108);
    pdf.setFontSize(10);
    const scoreRows = [
      ["Health score", `${visibleModel.score} / 100 (${band.label})`],
      ["Future readiness", `${visibleModel.futureScore} / 100`],
      ["Protection", `${visibleModel.protectionScore} / 100`],
      ["Debt pressure", `${visibleModel.debtScore} / 100`],
    ];
    scoreRows.forEach(([label, value], index) => {
      const y = 120 + index * 8;
      pdf.setFont("helvetica", "bold");
      pdf.text(label, 16, y);
      pdf.setFont("helvetica", "normal");
      pdf.text(value, 82, y);
    });

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("Advisor conversation flags", 16, 162);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    const flagLines = flags.length ? flags : ["No urgent flags from this educational snapshot."];
    let y = 174;
    flagLines.forEach((flag) => {
      const wrapped = pdf.splitTextToSize(`- ${flag}`, 178);
      pdf.text(wrapped, 16, y);
      y += wrapped.length * 5 + 4;
    });

    pdf.setDrawColor(198, 214, 226);
    pdf.line(16, 275, 194, 275);
    pdf.setTextColor(90, 103, 117);
    pdf.setFontSize(9);
    pdf.text("Educational estimate only. Not personalised financial advice.", 16, 286);
    pdf.save("advisory-connect-financial-dashboard.pdf");
  };

  return (
    <section className="overflow-hidden rounded-2xl" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }} data-testid="financial-dashboard">
      <div className="p-4" style={{ background: `linear-gradient(135deg, ${accentColor}22 0%, rgba(16,185,129,0.08) 44%, rgba(239,68,68,0.08) 100%)`, borderBottom: `1px solid ${borderColor}` }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2"><HeartPulse className="h-5 w-5" style={{ color: accentColor }} /><h3 className="text-base font-extrabold" style={{ color: textColor }}>Financial Dashboard</h3></div>
            <p className="max-w-xl text-xs leading-relaxed" style={{ color: mutedText }}>A live view of tax, inflation, retirement, protection and debt under the same assumptions.</p>
          </div>
          <div className="flex flex-col gap-3 rounded-xl p-3 sm:flex-row sm:items-center" style={{ backgroundColor: inputBg, border: `1px solid ${borderColor}` }}>
            <div className="grid h-16 w-16 place-items-center rounded-full" style={{ background: `conic-gradient(${band.color} ${visibleModel.score}%, rgba(255,255,255,0.08) ${visibleModel.score}% 100%)` }}>
              <div className="grid h-12 w-12 place-items-center rounded-full text-lg font-black" style={{ backgroundColor: cardBg, color: band.color }}>{visibleModel.score}</div>
            </div>
            <div className="min-w-0"><p className="text-[11px] font-semibold uppercase" style={{ color: mutedText }}>Health score</p><p className="text-sm font-bold" style={{ color: textColor }}>{band.label}</p><p className="text-[11px]" style={{ color: mutedText }}>Educational snapshot</p></div>
            <div className="grid grid-cols-2 overflow-hidden rounded-lg text-[11px] font-bold" style={{ border: `1px solid ${borderColor}` }}>
              <button type="button" onClick={() => setWithAdvisor(false)} className="px-3 py-2 transition-colors" style={{ backgroundColor: withAdvisor ? "transparent" : tc.buttonBg, color: withAdvisor ? mutedText : tc.buttonText }}>
                Without advisor
              </button>
              <button type="button" onClick={() => setWithAdvisor(true)} className="px-3 py-2 transition-colors" style={{ backgroundColor: withAdvisor ? "#10b981" : "transparent", color: withAdvisor ? "#ffffff" : mutedText }}>
                With advisor
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-4 p-4">
        <div className="rounded-xl p-3" style={{ backgroundColor: inputBg, border: `1px solid ${borderColor}` }}>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(10rem, 100%), 1fr))" }}>
            <RangeInput label="Monthly gross income" value={inputs.grossIncome} display={ZAR(inputs.grossIncome)} min={10000} max={250000} step={1000} onChange={(value) => update("grossIncome", value)} accentColor={accentColor} mutedText={mutedText} testId="pulse-income" />
            <RangeInput label="Your age" value={inputs.age} display={`${inputs.age} yrs`} min={18} max={70} step={1} onChange={(value) => update("age", Math.min(value, inputs.retirementAge - 1))} accentColor={accentColor} mutedText={mutedText} testId="pulse-age" />
            <RangeInput label="Monthly investing" value={inputs.monthlySave} display={ZAR(inputs.monthlySave)} min={0} max={30000} step={250} onChange={(value) => update("monthlySave", value)} accentColor={accentColor} mutedText={mutedText} testId="pulse-saving" />
          </div>
          <button type="button" onClick={() => setAdvancedOpen((current) => !current)} className="mt-3 flex items-center gap-1 text-xs font-semibold" style={{ color: accentColor }}>
            {advancedOpen ? "Hide" : "Tune"} assumptions and protection inputs <ArrowRight className={`h-3.5 w-3.5 transition-transform ${advancedOpen ? "rotate-90" : ""}`} />
          </button>
          {advancedOpen && (
            <div className="mt-3 grid gap-2 border-t pt-3" style={{ borderColor, gridTemplateColumns: "repeat(auto-fit, minmax(min(10rem, 100%), 1fr))" }}>
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
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(11rem, 100%), 1fr))" }}>
          <PulseRing label="Future readiness" score={visibleModel.futureScore} value={`${Math.round(visibleModel.retirementRatio * 100)}% of target`} color={futureColor} textColor={textColor} mutedText={mutedText} borderColor={borderColor} inputBg={inputBg} />
          <PulseRing label="Protection" score={visibleModel.protectionScore} value={`${(displayEmergencySavings / Math.max(effectiveInputs.essentialExpenses, 1)).toFixed(1)} months cash`} color={protectionColor} textColor={textColor} mutedText={mutedText} borderColor={borderColor} inputBg={inputBg} />
          <PulseRing label="Debt pressure" score={visibleModel.debtScore} value={`${Math.round(visibleModel.debtToIncome * 100)}% of gross pay`} color={debtColor} textColor={textColor} mutedText={mutedText} borderColor={borderColor} inputBg={inputBg} />
        </div>
        <div className="rounded-xl p-3" style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(16,185,129,0.18))", border: `1px solid ${borderColor}` }}>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(13rem, 100%), 1fr))" }}>
            <div className="rounded-lg p-3" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}>
              <p className="text-[11px] font-semibold uppercase" style={{ color: mutedText }}>Without advisor</p>
              <p className="mt-1 text-base font-black" style={{ color: textColor }}>Score: {model.score} ({scoreBand(model.score).label})</p>
              <p className="text-xs" style={{ color: mutedText }}>Retirement: <strong style={{ color: textColor }}>{compactZar(model.retirementPot)}</strong></p>
              <p className="text-xs" style={{ color: mutedText }}>Tax saving: -</p>
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.42)" }}>
              <p className="text-[11px] font-semibold uppercase" style={{ color: mutedText }}>With advisor</p>
              <p className="mt-1 text-base font-black" style={{ color: textColor }}>
                Score: {advisorScenario.model.score} ({advisedBand.label}) <span style={{ color: "#10b981" }}>+{Math.max(0, scoreDelta)}</span>
              </p>
              <p className="text-xs" style={{ color: mutedText }}>
                Retirement: <strong style={{ color: textColor }}>{compactZar(advisorScenario.model.retirementPot)}</strong> <span className="text-sm font-black" style={{ color: "#10b981" }}>+{compactZar(retirementDelta)}</span>
              </p>
              <p className="text-xs" style={{ color: mutedText }}>Tax saving: <strong style={{ color: "#10b981" }}>{ZAR(advisorScenario.taxSavingMonthly)} / month saved</strong></p>
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed" style={{ color: mutedText }}>Illustrative optimisation. Actual results depend on your full financial plan.</p>
        </div>
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(14rem, 100%), 1fr))" }}>
          <InsightCard icon={<Banknote className="h-4 w-4" />} title="What SARS takes" value={`${ZAR(visibleModel.taxMonthly)} / month`} detail={`${ZAR(visibleModel.takeHome)} remains before the rest of life starts spending it.`} color="#ef4444" borderColor={borderColor} inputBg={inputBg} textColor={textColor} mutedText={mutedText} bar={(visibleModel.taxMonthly / Math.max(effectiveInputs.grossIncome, 1)) * 100} />
          <InsightCard icon={<TrendingDown className="h-4 w-4" />} title="Inflation squeeze" value={`${ZAR(visibleModel.futureIncomeValue)} real pay`} detail={`Your ${ZAR(effectiveInputs.grossIncome)} monthly income only feels like this in ${visibleModel.years} years at ${effectiveInputs.inflation}% inflation.`} color="#f59e0b" borderColor={borderColor} inputBg={inputBg} textColor={textColor} mutedText={mutedText} bar={(visibleModel.futureIncomeValue / Math.max(effectiveInputs.grossIncome, 1)) * 100} />
          <InsightCard icon={<PiggyBank className="h-4 w-4" />} title="Retirement gap" value={visibleModel.retirementRatio >= 1 ? "Target covered" : `${compactZar(visibleModel.retirementNeed - visibleModel.retirementPot)} gap`} detail={`${compactZar(visibleModel.retirementPot)} projected pot, worth ${compactZar(visibleModel.realPot)} in today's money.`} color={futureColor} borderColor={borderColor} inputBg={inputBg} textColor={textColor} mutedText={mutedText} bar={visibleModel.retirementRatio * 100} />
          <InsightCard icon={<ShieldCheck className="h-4 w-4" />} title="Emergency fund" value={`${compactZar(Math.max(0, visibleModel.emergencyTarget - effectiveInputs.emergencySavings))} gap`} detail={`A six-month cash target is ${compactZar(visibleModel.emergencyTarget)} from your essential expenses.`} color={protectionColor} borderColor={borderColor} inputBg={inputBg} textColor={textColor} mutedText={mutedText} bar={visibleModel.emergencyRatio * 100} />
          <InsightCard icon={<AlertTriangle className="h-4 w-4" />} title="Life cover lens" value={`${compactZar(Math.max(0, visibleModel.lifeCoverNeed - effectiveInputs.existingLifeCover))} short`} detail={`Simple ten-year income replacement target: ${compactZar(visibleModel.lifeCoverNeed)} before a full needs analysis.`} color={protectionColor} borderColor={borderColor} inputBg={inputBg} textColor={textColor} mutedText={mutedText} bar={visibleModel.lifeCoverRatio * 100} />
          <InsightCard icon={<TrendingUp className="h-4 w-4" />} title="Small spend, big future" value={compactZar(visibleModel.latteValue)} detail={`${ZAR(effectiveInputs.discretionarySpend)} redirected monthly could compound over ${visibleModel.years} years.`} color={accentColor} borderColor={borderColor} inputBg={inputBg} textColor={textColor} mutedText={mutedText} />
          <InsightCard icon={<PiggyBank className="h-4 w-4" />} title="Your freedom number" value={compactZar(fireNumber)} detail={fireYears > 0 ? `At current savings, financial independence at age ${freedomAge}.` : "Current savings rate won't reach your FIRE number - try increasing monthly investing."} color={accentColor} borderColor={borderColor} inputBg={inputBg} textColor={textColor} mutedText={mutedText} bar={fireYears > 0 ? (60 - fireYears) / 60 * 100 : 0} />
          <div className="rounded-xl p-3" style={{ backgroundColor: inputBg, border: `1px solid ${borderColor}` }}>
            <div className="flex min-w-0 items-start gap-2">
              <span className="mt-0.5" style={{ color: accentColor }}><Banknote className="h-4 w-4" /></span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase" style={{ color: mutedText }}>vs. the average South African</p>
                <div className="mt-2 space-y-1.5">
                  {benchmarkRows.map((row) => (
                    <p key={row.label} className="text-xs font-semibold" style={{ color: row.positive ? "#10b981" : "#ef4444" }}>
                      <span style={{ color: mutedText }}>{row.label}: </span>{row.text}
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed" style={{ color: mutedText }}>National averages are estimates - every situation is unique. Emergency benchmark: {SA_BENCHMARKS.avgEmergencyMonths} months.</p>
          </div>
        </div>
        <div className="grid gap-3">
          <div className="rounded-xl p-3" style={{ backgroundColor: inputBg, border: `1px solid ${borderColor}` }}>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(10rem, 100%), 1fr))" }}>
              <div><p className="text-[11px] font-semibold uppercase" style={{ color: mutedText }}>What changes most?</p><p className="text-sm font-bold" style={{ color: textColor }}>Add {ZAR(boost)} to monthly investing</p></div>
              <div className="w-full"><RangeInput label="Monthly boost" value={boost} display={ZAR(boost)} min={0} max={5000} step={250} onChange={setBoost} accentColor={accentColor} mutedText={mutedText} testId="pulse-boost" /></div>
            </div>
            <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(8rem, 100%), 1fr))" }}>
              <div className="rounded-lg p-3" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}><p className="text-[11px] font-semibold uppercase" style={{ color: mutedText }}>Current path</p><p className="text-lg font-black" style={{ color: textColor }}>{compactZar(visibleModel.retirementPot)}</p></div>
              <div className="rounded-lg p-3" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}><p className="text-[11px] font-semibold uppercase" style={{ color: mutedText }}>Small change</p><p className="text-lg font-black" style={{ color: accentColor }}>{compactZar(visibleModel.improvedPot)}</p></div>
              <div className="rounded-lg p-3" style={{ backgroundColor: `${accentColor}16`, border: `1px solid ${accentColor}55` }}><p className="text-[11px] font-semibold uppercase" style={{ color: mutedText }}>Difference</p><p className="text-lg font-black" style={{ color: textColor }}>{compactZar(visibleModel.improvedPot - visibleModel.retirementPot)}</p></div>
            </div>
            <div className="mt-3 rounded-lg p-3 text-xs leading-relaxed" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, color: mutedText }}>Starting ten years later with the same monthly investment projects about <strong style={{ color: "#ef4444" }}>{compactZar(visibleModel.delayedValue)}</strong>. The time gap does the loudest talking.</div>
          </div>
          <div className="rounded-xl p-3" style={{ backgroundColor: inputBg, border: `1px solid ${borderColor}` }}>
            <button type="button" onClick={() => setLifeEventsOpen((current) => !current)} className="flex w-full items-center justify-between gap-3 text-left">
              <span>
                <span className="block text-[11px] font-semibold uppercase" style={{ color: mutedText }}>Life events</span>
                <span className="block text-sm font-bold" style={{ color: textColor }}>Stress-test the whole dashboard instantly</span>
              </span>
              <ArrowRight className={`h-4 w-4 shrink-0 transition-transform ${lifeEventsOpen ? "rotate-90" : ""}`} style={{ color: accentColor }} />
            </button>
            {activeLifeEvents.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {activeLifeEvents.map((event) => (
                  <span key={event.key} className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: `${accentColor}22`, color: accentColor, border: `1px solid ${accentColor}55` }}>
                    {event.label}
                  </span>
                ))}
              </div>
            )}
            {lifeEventsOpen && (
              <div className="mt-3 grid gap-2 border-t pt-3" style={{ borderColor, gridTemplateColumns: "repeat(auto-fit, minmax(min(9rem, 100%), 1fr))" }}>
                {LIFE_EVENTS.map((event) => {
                  const checked = lifeEvents.includes(event.key);
                  return (
                    <button
                      key={event.key}
                      type="button"
                      onClick={() => toggleLifeEvent(event.key)}
                      className="rounded-lg p-3 text-left transition-transform hover:scale-[1.01]"
                      style={{
                        backgroundColor: checked ? `${accentColor}24` : cardBg,
                        border: `1px solid ${checked ? accentColor : borderColor}`,
                        color: textColor,
                      }}
                    >
                      <span className="flex items-center gap-2 text-xs font-bold">
                        <span className="grid h-4 w-4 place-items-center rounded" style={{ backgroundColor: checked ? accentColor : inputBg, border: `1px solid ${checked ? accentColor : borderColor}` }}>
                          {checked ? <span style={{ color: tc.buttonText }}>✓</span> : null}
                        </span>
                        {event.label}
                      </span>
                      <span className="mt-1 block text-[11px]" style={{ color: mutedText }}>{event.detail}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="space-y-2 rounded-xl p-3" style={{ backgroundColor: inputBg, border: `1px solid ${borderColor}` }}>
            <div><p className="text-[11px] font-semibold uppercase" style={{ color: mutedText }}>Advisor conversation flags</p><p className="text-sm font-bold" style={{ color: textColor }}>Areas worth discussing{advisorName ? ` with ${advisorName}` : ""}</p></div>
            {flags.length === 0 ? <p className="rounded-lg p-3 text-xs" style={{ backgroundColor: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.32)", color: textColor }}>This snapshot looks balanced. Try a more demanding scenario to see where it bends.</p> : flags.map((flag) => <p key={flag} className="rounded-lg p-2.5 text-xs leading-relaxed" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, color: textColor }}>{flag}</p>)}
            <div className="rounded-lg p-3 text-xs leading-relaxed" style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.24)", color: mutedText }}>These flags are conversation starters. A full needs analysis still belongs with the advisor.</div>
          </div>
        </div>
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(14rem, 100%), 1fr))" }}>
          <InsightCard icon={<TrendingDown className="h-4 w-4" />} title="Inflation eats the lump sum" value={`${compactZar(visibleModel.lumpSumRealValue)} real value`} detail={`${compactZar(effectiveInputs.futureLumpSum)} today after ${visibleModel.years} years of inflation pressure.`} color="#ef4444" borderColor={borderColor} inputBg={inputBg} textColor={textColor} mutedText={mutedText} bar={(visibleModel.lumpSumRealValue / Math.max(effectiveInputs.futureLumpSum, 1)) * 100} />
          <InsightCard icon={<AlertTriangle className="h-4 w-4" />} title="Debt freedom" value={visibleModel.debt.canPay ? visibleModel.debt.months > 0 ? `${visibleModel.debt.months} months` : "No debt loaded" : "Payment stalls"} detail={visibleModel.debt.canPay ? `${compactZar(Math.max(0, visibleModel.debt.totalPaid - effectiveInputs.debtBalance))} estimated interest on the current payoff path.` : "The current payment does not clear monthly interest. Raise the payment or lower the rate."} color={debtColor} borderColor={borderColor} inputBg={inputBg} textColor={textColor} mutedText={mutedText} />
        </div>
        <button type="button" onClick={downloadSummaryPdf} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold" style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}>
          <Download className="h-3.5 w-3.5" /> Download summary
        </button>
        <p className="text-[11px] leading-relaxed" style={{ color: mutedText }}>Educational estimate only. It uses simplified South African tax assumptions based on 2025/26 SARS rates, inflation, protection and compound-growth assumptions and is not personalised financial advice.</p>
      </div>
    </section>
  );
}
