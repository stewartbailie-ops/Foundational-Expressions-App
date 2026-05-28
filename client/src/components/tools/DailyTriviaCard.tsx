import { useMemo, useState, useEffect } from "react";
import { Trophy, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { type getThemeColors } from "@/lib/themeUtils";

type TriviaCardProps = { tc: ReturnType<typeof getThemeColors> };

type Question = {
  q: string;
  opts: [string, string, string, string];
  ans: number;
  explain: string;
};

const BANK: Question[] = [
  { q: "What does the repo rate represent?", opts: ["Rate banks lend to each other","Rate SARB lends to commercial banks","The prime lending rate","Interest on government bonds"], ans: 1, explain: "The repo rate is what the SARB charges commercial banks to borrow. Prime is conventionally repo + 3.5%." },
  { q: "South Africa's inflation target range is:", opts: ["1%–3%","3%–6%","4%–8%","5%–10%"], ans: 1, explain: "The SARB targets CPI between 3% and 6%, with 4.5% as the preferred midpoint." },
  { q: "What is the maximum annual TFSA contribution (2025/26)?", opts: ["R25,000","R33,000","R36,000","R50,000"], ans: 2, explain: "R36,000 per year, R500,000 lifetime. All growth and withdrawals inside a TFSA are completely tax-free." },
  { q: "RA contributions are deductible at up to what percentage of gross income?", opts: ["15%","22.5%","27.5%","33%"], ans: 2, explain: "SARS allows a deduction of the lesser of 27.5% of gross income or R350,000 per year across all retirement funds." },
  { q: "What is the annual cap on retirement fund contribution deductions?", opts: ["R200,000","R250,000","R300,000","R350,000"], ans: 3, explain: "The cap is R350,000. Excess contributions are carried forward and deducted in future tax years." },
  { q: "From what minimum age can you access a retirement annuity?", opts: ["50","55","60","65"], ans: 1, explain: "RA funds can be accessed from age 55. Up to one-third can be taken as a lump sum; the rest must buy an annuity." },
  { q: "The two-pot retirement system splits contributions as:", opts: ["Equal halves into two funds","One-third savings pot, two-thirds retirement pot","All into a savings pot","All into a preservation fund"], ans: 1, explain: "One-third goes into a savings pot (one withdrawal per tax year) and two-thirds into a preserved retirement pot." },
  { q: "What does JSE stand for?", opts: ["Johannesburg Securities Exchange","Johannesburg Stock Exchange","Joint Securities Exchange","Junior Stock Exchange"], ans: 1, explain: "The JSE (Johannesburg Stock Exchange) is Africa's largest stock exchange, headquartered in Sandton." },
  { q: "The 'Rule of 72' estimates:", opts: ["Maximum safe withdrawal rate","Years to double an investment","Ideal emergency fund size","Recommended stock-to-bond ratio"], ans: 1, explain: "Divide 72 by the annual return rate. At 8% p.a., money doubles in approximately 9 years." },
  { q: "A healthy emergency fund typically covers:", opts: ["1 month of expenses","2 months of expenses","3–6 months of expenses","12 months of expenses"], ans: 2, explain: "3–6 months of essential expenses in liquid cash covers job loss or emergencies without disrupting investments." },
  { q: "Compound interest is best described as:", opts: ["Interest on the original principal only","Monthly rather than annual interest","Earning interest on both principal and prior interest","A fixed rate that cannot change"], ans: 2, explain: "Compound interest accelerates wealth — your interest earns interest. Time is the key ingredient." },
  { q: "Diversification in a portfolio means:", opts: ["Investing only in high-growth assets","Spreading across asset classes, sectors or geographies","Moving all savings into one low-risk fund","Rebalancing monthly"], ans: 1, explain: "Diversification reduces risk: a loss in one area is offset by others. Don't put all your eggs in one basket." },
  { q: "South Africa's prime lending rate is typically:", opts: ["Repo + 1%","Repo + 2%","Repo + 3.5%","Repo + 5%"], ans: 2, explain: "Prime = repo + 3.5%. If repo is 8%, prime is 11.5%. Most consumer loans are priced at or above prime." },
  { q: "A living annuity in retirement is:", opts: ["Fixed income for life from an insurer","Income drawn from your own invested capital","A government pension","A bank savings account for retirees"], ans: 1, explain: "A living annuity lets you invest your capital and draw income (2.5%–17.5%/year). Risk: you can outlive the capital." },
  { q: "Income protection insurance covers:", opts: ["Home loan repayments if you die","Lump sum for critical illness","Monthly income if unable to work","Employer liability for accidents"], ans: 2, explain: "Income protection replaces ~75% of your salary if illness or injury prevents you from working. It differs from life cover." },
  { q: "A 'rand hedge' investment:", opts: ["A SA government bond","A money market fund","Rises when the rand weakens","A fixed deposit at a local bank"], ans: 2, explain: "Rand hedges earn revenue in foreign currencies (like gold miners or offshore funds). When the rand falls, these assets rise in rand terms." },
  { q: "What is an ETF?", opts: ["A single listed company share","A basket of assets traded on an exchange like a share","A fixed-interest savings product","A currency trading instrument"], ans: 1, explain: "An ETF tracks an index (e.g., JSE Top 40) and trades like a share, offering diversification at low cost." },
  { q: "A bear market is defined as:", opts: ["Markets falling 10% from a peak","Markets rising 10%","Markets falling 20%+ from a recent peak","A short-term correction"], ans: 2, explain: "A bear market is a 20%+ decline from a peak, often driven by economic contraction. Bull markets historically last longer." },
  { q: "CPI stands for:", opts: ["Capital Price Indicator","Consumer Price Index","Credit Protection Insurance","Currency Price Inflation"], ans: 1, explain: "The Consumer Price Index measures average changes in prices of a basket of goods and services — South Africa's primary inflation measure." },
  { q: "Estate planning is primarily concerned with:", opts: ["Reducing income tax on investments","Planning for early retirement","Distributing assets after death per your wishes","Protecting against business losses"], ans: 2, explain: "Estate planning ensures your assets go to the right people through a valid will, named beneficiaries, and possibly trusts." },
  { q: "Liquidity in personal finance means:", opts: ["Total value of your portfolio","How quickly an asset converts to cash without significant loss","Interest rate on a savings account","Monthly cash flow after expenses"], ans: 1, explain: "Liquidity matters for emergencies. Savings accounts are liquid; property is illiquid. Emergency funds must stay liquid." },
  { q: "'Pay yourself first' means:", opts: ["Spending on yourself before paying bills","Automating savings before spending on anything else","Paying off debt before luxuries","Leaving your salary in savings for 30 days"], ans: 1, explain: "Automating savings on payday — before lifestyle spending — is one of the most effective wealth-building habits." },
  { q: "Sequence of returns risk affects you most:", opts: ["During the wealth accumulation phase","In the early years of retirement when drawing down","When investing in offshore assets","During periods of low inflation"], ans: 1, explain: "Retiring into a market downturn forces you to sell assets at low prices to fund expenses, permanently damaging the portfolio." },
  { q: "Rand cost averaging means:", opts: ["Investing all capital at once","Investing a fixed rand amount at regular intervals","Averaging rand exposure across currencies","Setting a rand target for a goal"], ans: 1, explain: "By investing fixed amounts regularly, you buy more units when prices are low and fewer when high — reducing average cost over time." },
  { q: "Capital gains tax (CGT) in SA applies to:", opts: ["Dividends from shares","Profit when selling an asset for more than cost","Surcharge on income above R1 million","Interest earned in savings accounts"], ans: 1, explain: "Individuals have an R40,000 annual exclusion, and only 40% of the net gain is included in taxable income." },
  { q: "What is a unit trust (mutual fund)?", opts: ["A trust for a single beneficiary","A pooled investment vehicle where many investors share returns","A government savings bond","A fixed-interest bank product"], ans: 1, explain: "Unit trusts pool capital from many investors into a diversified, professionally managed portfolio accessible with small amounts." },
  { q: "The FSCA (Financial Sector Conduct Authority) does what?", opts: ["Regulates banks","Regulates market conduct of financial institutions","Sets the repo rate","Issues government bonds"], ans: 1, explain: "The FSCA replaced the FSB in 2018 and regulates financial institutions' market conduct — protecting consumers." },
  { q: "FAIS stands for:", opts: ["Financial Advice and Intermediary Services","Financial Assets and Investment Standards","Financial Advisors Information System","Financial Affairs Investigation Services"], ans: 0, explain: "The FAIS Act regulates financial advisors, requiring them to be licensed and to act in clients' best interests." },
  { q: "A 'guaranteed annuity' (life annuity) pays:", opts: ["A lump sum on diagnosis of illness","A fixed income for the rest of your life","An investment-linked return","A withdrawal at a fixed future date"], ans: 1, explain: "A guaranteed annuity pays for life — the insurer bears the longevity risk. It offers certainty but less flexibility than a living annuity." },
  { q: "Critical illness (dread disease) cover pays:", opts: ["Monthly income while off work","A lump sum on diagnosis of a listed serious illness","Hospital bills covered by medical aid","Only if you die within 12 months of diagnosis"], ans: 1, explain: "The tax-free lump sum covers non-medical costs like lost income, home adjustments, and family support during recovery." },
  { q: "Asset allocation refers to:", opts: ["Picking the best-performing share each year","The mix of asset classes (equities, bonds, cash, property) in a portfolio","Allocating a fixed rand amount to each investment","Selecting a fund manager"], ans: 1, explain: "Research shows asset allocation — not stock selection — is the biggest driver of long-term portfolio returns." },
  { q: "What is the debt-to-income (DTI) ratio?", opts: ["Calculating income tax owed","Total monthly debt payments ÷ gross monthly income","Eligibility for a TFSA","Net asset value calculation"], ans: 1, explain: "SA banks typically want a DTI below 30%–35% for home loan approval. High DTI signals financial stress." },
  { q: "An endowment policy in SA is:", opts: ["Short-term insurance","Medium-term investment with a 5-year lock-in","A government savings bond","Retirement annuity with guaranteed returns"], ans: 1, explain: "Endowments grow tax-deferred at a 30% fund rate — beneficial for high-income earners in the 41%–45% tax bracket." },
  { q: "Net asset value (NAV) in a unit trust is:", opts: ["Total fund profit","Price per unit, calculated daily","The annual management fee","Total amount invested by all unit holders"], ans: 1, explain: "NAV = (total fund assets − liabilities) ÷ units in issue. It's the price you pay or receive when transacting in the fund." },
  { q: "What does 'inflation-linked' mean for a bond?", opts: ["The bond price is fixed regardless of inflation","Both the principal and interest payments adjust with CPI","The bond only pays out during high-inflation periods","The bond converts to equity if inflation rises above 6%"], ans: 1, explain: "Inflation-linked bonds (like RSA Retail Savings Bonds ILBs) protect purchasing power by adjusting returns with CPI." },
  { q: "A 'needs analysis' in financial planning is:", opts: ["A credit check conducted by a bank","A comprehensive assessment of your protection, investment and retirement needs","A SARS audit of your tax returns","An annual review of your medical aid benefits"], ans: 1, explain: "A proper needs analysis by a licensed advisor considers life cover, disability, income protection, retirement and estate needs holistically." },
  { q: "What is 'dollar-cost averaging' (DCA)?", opts: ["Investing only in USD assets","Regularly investing a fixed amount regardless of price","Converting rands to dollars first","Averaging foreign currency exposure"], ans: 1, explain: "DCA removes timing risk. By investing consistently, you benefit from market dips without needing to predict them." },
  { q: "JSE-listed companies are:", opts: ["Registered with SARS only","Publicly tradeable on the stock exchange","Approved by FSCA as financial advisors","Government-guaranteed entities"], ans: 1, explain: "Listing on the JSE gives companies access to public capital and investors liquidity to buy and sell shares freely." },
  { q: "Inflation reduces purchasing power, meaning:", opts: ["The rand gains value over time","R1,000 today buys less in 10 years","The JSE grows faster than CPI","Interest rates rise automatically"], ans: 1, explain: "At 5% inflation, purchasing power halves in ~14 years. Investments must beat inflation to create real wealth." },
  { q: "What is a 'beneficiary' on a retirement fund?", opts: ["The fund manager","The insurer","The person nominated to receive proceeds on your death","The government regulator"], ans: 2, explain: "For retirement funds in SA, trustees have discretion on distribution — but naming beneficiaries provides important guidance they must consider." },
];

function hashSeed(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const STORAGE_KEY = "ac_trivia";

type StoredState = { date: string; selected: number; streak: number };

export function DailyTriviaCard({ tc }: TriviaCardProps) {
  const { accentColor, borderColor, cardBg, inputBg, textColor, mutedText } = tc;
  const today = dateKey();

  const question = useMemo(() => {
    const seed = hashSeed(today);
    return BANK[seed % BANK.length];
  }, [today]);

  const [stored, setStored] = useState<StoredState | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed: StoredState = JSON.parse(raw);
      return parsed;
    } catch {
      return null;
    }
  });

  const answeredToday = stored?.date === today && stored.selected >= 0;
  const [selected, setSelected] = useState<number>(answeredToday ? stored!.selected : -1);
  const [revealed, setRevealed] = useState(answeredToday);

  const streak = stored?.streak ?? 0;

  const submit = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    const correct = idx === question.ans;
    const prev = stored;
    const wasYesterday = prev?.date === dateKey(new Date(Date.now() - 86400000));
    const newStreak = correct ? (wasYesterday && (prev?.selected === BANK[hashSeed(prev.date) % BANK.length].ans) ? prev.streak + 1 : 1) : 0;
    const next: StoredState = { date: today, selected: idx, streak: newStreak };
    setStored(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const isCorrect = revealed && selected === question.ans;
  const labels = ["A", "B", "C", "D"] as const;

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }} data-testid="section-dailytrivia">
      <div className="flex items-center justify-between p-4" style={{ background: `linear-gradient(135deg, ${accentColor}18, ${accentColor}08)`, borderBottom: `1px solid ${borderColor}` }}>
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4" style={{ color: accentColor }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: textColor }}>Finance Trivia</p>
            <p className="text-[11px]" style={{ color: mutedText }}>Daily challenge · {new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}</p>
          </div>
        </div>
        {streak > 0 && (
          <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}44` }}>
            🔥 {streak} day{streak === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        <p className="text-sm font-semibold leading-snug" style={{ color: textColor }}>{question.q}</p>

        <div className="space-y-2">
          {question.opts.map((opt, i) => {
            let bg = inputBg;
            let border = borderColor;
            let color = textColor;
            if (revealed) {
              if (i === question.ans) { bg = "rgba(16,185,129,0.14)"; border = "#10b981"; color = "#10b981"; }
              else if (i === selected) { bg = "rgba(239,68,68,0.14)"; border = "#ef4444"; color = "#ef4444"; }
              else { color = mutedText; }
            } else if (selected === i) {
              bg = `${accentColor}20`; border = accentColor;
            }
            return (
              <button
                key={i}
                type="button"
                disabled={revealed}
                onClick={() => submit(i)}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs transition-opacity hover:opacity-80 disabled:cursor-default"
                style={{ backgroundColor: bg, border: `1px solid ${border}`, color }}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-black" style={{ backgroundColor: revealed && i === question.ans ? "#10b981" : revealed && i === selected ? "#ef4444" : accentColor + "22", color: revealed && (i === question.ans || i === selected) ? "#fff" : accentColor }}>
                  {labels[i]}
                </span>
                <span className="leading-snug font-medium">{opt}</span>
                {revealed && i === question.ans && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0" style={{ color: "#10b981" }} />}
                {revealed && i === selected && i !== question.ans && <XCircle className="ml-auto h-4 w-4 shrink-0" style={{ color: "#ef4444" }} />}
              </button>
            );
          })}
        </div>

        {revealed && (
          <div className="rounded-lg p-3 space-y-1.5" style={{ backgroundColor: isCorrect ? "rgba(16,185,129,0.10)" : "rgba(239,68,68,0.10)", border: `1px solid ${isCorrect ? "#10b981" : "#ef4444"}44` }}>
            <p className="text-xs font-bold" style={{ color: isCorrect ? "#10b981" : "#ef4444" }}>
              {isCorrect ? "Correct!" : "Not quite —"}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: textColor }}>{question.explain}</p>
          </div>
        )}

        {revealed && (
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: mutedText }}>
            <ChevronRight className="h-3 w-3" />
            <span>A new question every day. Come back tomorrow to keep your streak going.</span>
          </div>
        )}
      </div>
    </div>
  );
}
