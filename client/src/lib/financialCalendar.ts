export type CalendarCategory = "SARB" | "SARS" | "Budget" | "JSE" | "FAIS";

export type FinancialEvent = {
  date: string;
  title: string;
  category: CalendarCategory;
  detail?: string;
};

export const SA_FINANCIAL_EVENTS_2026: FinancialEvent[] = [
  { date: "2026-01-29", title: "SARB MPC Meeting (Jan)", category: "SARB", detail: "Repo rate announcement, 15:00 SAST." },
  { date: "2026-02-25", title: "National Budget Speech", category: "Budget", detail: "Minister of Finance presents the 2026/27 Budget to Parliament." },
  { date: "2026-02-28", title: "SARS Provisional Tax (IRP6) — Period 2", category: "SARS", detail: "Second provisional tax payment due for 2026 tax year." },
  { date: "2026-03-19", title: "SARB MPC Meeting (Mar)", category: "SARB", detail: "Repo rate announcement, 15:00 SAST." },
  { date: "2026-03-31", title: "Year-End Tax Planning Deadline", category: "SARS", detail: "Last day of the 2026 SA tax year — RA / TFSA contributions must clear." },
  { date: "2026-05-21", title: "SARB MPC Meeting (May)", category: "SARB", detail: "Repo rate announcement, 15:00 SAST." },
  { date: "2026-05-31", title: "EMP501 Annual Reconciliation", category: "SARS", detail: "Employer reconciliation declaration due." },
  { date: "2026-05-31", title: "FAIS CPD Cycle Mid-Point", category: "FAIS", detail: "Review your CPD hours — full 18 hours must clear by 31 May 2026." },
  { date: "2026-07-15", title: "Tax Filing Season Opens", category: "SARS", detail: "SARS auto-assessments begin; e-filing opens shortly after." },
  { date: "2026-07-23", title: "SARB MPC Meeting (Jul)", category: "SARB", detail: "Repo rate announcement, 15:00 SAST." },
  { date: "2026-08-31", title: "SARS Provisional Tax (IRP6) — Period 1", category: "SARS", detail: "First provisional tax payment for 2027 tax year." },
  { date: "2026-09-17", title: "SARB MPC Meeting (Sep)", category: "SARB", detail: "Repo rate announcement, 15:00 SAST." },
  { date: "2026-10-21", title: "Medium-Term Budget Policy Statement", category: "Budget", detail: "Minister of Finance presents the MTBPS to Parliament." },
  { date: "2026-10-23", title: "Tax Filing Deadline (non-provisional)", category: "SARS", detail: "Final day for non-provisional taxpayers to submit ITR12." },
  { date: "2026-11-19", title: "SARB MPC Meeting (Nov)", category: "SARB", detail: "Repo rate announcement, 15:00 SAST." },
  { date: "2026-03-12", title: "JSE Top 40 — Major Results Window", category: "JSE", detail: "Naspers, Prosus, Sasol typically report interim/full year results around this period." },
  { date: "2026-08-20", title: "JSE Top 40 — Major Results Window", category: "JSE", detail: "Standard Bank, FirstRand, Anglo American typically report interim results." },
  { date: "2026-11-26", title: "JSE Top 40 — Major Results Window", category: "JSE", detail: "Discovery, Sanlam, Old Mutual typically report annual results." },
  { date: "2026-01-20", title: "SARS PAYE / VAT — Monthly", category: "SARS", detail: "Monthly EMP201 + VAT201 due (recurs on the 25th–7th each month)." },
];

export function getUpcomingEvents(limit = 5, from: Date = new Date()): FinancialEvent[] {
  const fromMs = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  return SA_FINANCIAL_EVENTS_2026
    .filter(e => new Date(e.date).getTime() >= fromMs)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

export function getCategoryColor(cat: CalendarCategory): string {
  switch (cat) {
    case "SARB": return "#3B82F6";
    case "SARS": return "#10B981";
    case "Budget": return "#F59E0B";
    case "JSE": return "#8B5CF6";
    case "FAIS": return "#EC4899";
  }
}

export const TRADINGVIEW_SYMBOLS: { value: string; label: string }[] = [
  { value: "FX_IDC:USDZAR", label: "USD / ZAR" },
  { value: "FX_IDC:EURZAR", label: "EUR / ZAR" },
  { value: "FX_IDC:GBPZAR", label: "GBP / ZAR" },
  { value: "TVC:GOLD", label: "Gold (USD/oz)" },
  { value: "TVC:SILVER", label: "Silver (USD/oz)" },
  { value: "TVC:USOIL", label: "Crude Oil (Brent)" },
  { value: "JSE:J203", label: "JSE All Share Index" },
  { value: "JSE:TOP40", label: "JSE Top 40" },
  { value: "JSE:NPN", label: "Naspers" },
  { value: "JSE:PRX", label: "Prosus" },
  { value: "JSE:SOL", label: "Sasol" },
  { value: "JSE:AGL", label: "Anglo American" },
  { value: "JSE:SBK", label: "Standard Bank" },
  { value: "JSE:FSR", label: "FirstRand" },
  { value: "JSE:DSY", label: "Discovery" },
  { value: "JSE:SLM", label: "Sanlam" },
  { value: "JSE:STX40", label: "Satrix Top 40 ETF" },
  { value: "SP:SPX", label: "S&P 500" },
  { value: "NASDAQ:NDX", label: "Nasdaq 100" },
  { value: "BITSTAMP:BTCUSD", label: "Bitcoin (USD)" },
];
