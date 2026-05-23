import { useEffect, useMemo, useState } from "react";
import { Download, Gauge, RotateCcw } from "lucide-react";
import { jsPDF } from "jspdf";
import { type getThemeColors } from "@/lib/themeUtils";
import { writeStoredRiskProfileResult } from "@/lib/riskProfileResult";

type RiskProfileQuizProps = {
  tc: ReturnType<typeof getThemeColors>;
};

type QuizOption = {
  label: string;
  score: number;
};

type QuizQuestion = {
  prompt: string;
  options: QuizOption[];
};

type ProfileBand = "Conservative" | "Moderate" | "Aggressive";

const QUESTIONS: QuizQuestion[] = [
  {
    prompt: "When do you expect to use most of this money?",
    options: [
      { label: "Within 3 years", score: 1 },
      { label: "In 3 to 7 years", score: 2 },
      { label: "More than 7 years from now", score: 3 },
    ],
  },
  {
    prompt: "How would you react if an investment fell 15% in a bad year?",
    options: [
      { label: "Sell quickly to protect what remains", score: 1 },
      { label: "Hold and review the plan", score: 2 },
      { label: "Stay invested or add if the plan still fits", score: 3 },
    ],
  },
  {
    prompt: "Which outcome matters most to you?",
    options: [
      { label: "Protect capital and limit shocks", score: 1 },
      { label: "Balance growth with manageable movement", score: 2 },
      { label: "Maximise long-term growth", score: 3 },
    ],
  },
  {
    prompt: "How stable is your current income and cash buffer?",
    options: [
      { label: "Uncertain or cash buffer is thin", score: 1 },
      { label: "Reasonably stable", score: 2 },
      { label: "Stable with emergency reserves", score: 3 },
    ],
  },
  {
    prompt: "What level of month-to-month investment movement feels acceptable?",
    options: [
      { label: "Small movement only", score: 1 },
      { label: "Some movement for better growth", score: 2 },
      { label: "Large swings if the long-term reward is stronger", score: 3 },
    ],
  },
  {
    prompt: "How much investing experience do you have?",
    options: [
      { label: "Little or none", score: 1 },
      { label: "Some funds or retirement products", score: 2 },
      { label: "Comfortable with markets and cycles", score: 3 },
    ],
  },
  {
    prompt: "If goals changed unexpectedly, what flexibility do you have?",
    options: [
      { label: "I may need access quickly", score: 1 },
      { label: "I can adjust some plans", score: 2 },
      { label: "I can leave long-term money invested", score: 3 },
    ],
  },
];

const PROFILE_DESCRIPTIONS: Record<ProfileBand, string> = {
  Conservative: "You prioritise stability, access and capital protection. A plan should focus on resilience before taking meaningful market risk.",
  Moderate: "You can accept measured volatility for long-term progress. A balanced strategy can pair growth assets with stabilising reserves.",
  Aggressive: "You are prepared for wider market swings in pursuit of long-term growth. The plan still needs time horizon, liquidity and protection checks.",
};

function scoreProfile(score: number): ProfileBand {
  if (score <= 11) return "Conservative";
  if (score <= 16) return "Moderate";
  return "Aggressive";
}

export function RiskProfileQuiz({ tc }: RiskProfileQuizProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const answerCount = Object.keys(answers).length;
  const score = useMemo(() => Object.values(answers).reduce((total, answer) => total + answer, 0), [answers]);
  const complete = answerCount === QUESTIONS.length;
  const profile = complete ? scoreProfile(score) : null;

  useEffect(() => {
    if (!profile) return;
    writeStoredRiskProfileResult({ profile, score });
  }, [profile, score]);

  const downloadPdf = () => {
    if (!profile) return;
    const pdf = new jsPDF();
    pdf.setFillColor(18, 45, 68);
    pdf.rect(0, 0, 210, 38, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.text("Advisory Connect", 16, 22);
    pdf.setFontSize(11);
    pdf.text("Risk Profile Quiz", 16, 31);
    pdf.setTextColor(24, 35, 48);
    pdf.setFontSize(16);
    pdf.text(`${profile} profile`, 16, 58);
    pdf.setFontSize(11);
    pdf.text(`Score: ${score} / ${QUESTIONS.length * 3}`, 16, 69);
    pdf.text(PROFILE_DESCRIPTIONS[profile], 16, 81, { maxWidth: 178 });
    pdf.setDrawColor(198, 214, 226);
    pdf.line(16, 103, 194, 103);

    let y = 116;
    QUESTIONS.forEach((question, index) => {
      const selected = question.options.find((option) => option.score === answers[index]);
      const lines = pdf.splitTextToSize(`${index + 1}. ${question.prompt}`, 174);
      pdf.setFont("helvetica", "bold");
      pdf.text(lines, 16, y);
      y += lines.length * 5 + 3;
      pdf.setFont("helvetica", "normal");
      pdf.text(selected?.label || "Not answered", 20, y, { maxWidth: 170 });
      y += 12;
      if (y > 272) {
        pdf.addPage();
        y = 18;
      }
    });

    pdf.setTextColor(90, 103, 117);
    pdf.setFontSize(9);
    pdf.text("Educational screening only. Discuss suitability and advice with a licensed financial advisor.", 16, 287);
    pdf.save("advisory-connect-risk-profile.pdf");
  };

  return (
    <section className="rounded-xl p-4 space-y-4" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }} data-testid="risk-profile-quiz">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor }}>
            <Gauge className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Risk Profile Quiz</h3>
            <p className="text-xs leading-relaxed" style={{ color: tc.mutedText }}>
              Answer seven quick questions to frame a first advisor conversation.
            </p>
          </div>
        </div>
        <div className="rounded-lg px-3 py-2 text-right" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.borderColor}` }}>
          <p className="text-[11px] font-semibold uppercase" style={{ color: tc.mutedText }}>Answered</p>
          <p className="text-sm font-bold" style={{ color: tc.textColor }}>{answerCount} / {QUESTIONS.length}</p>
        </div>
      </div>

      <div className="space-y-3">
        {QUESTIONS.map((question, index) => (
          <fieldset key={question.prompt} className="rounded-lg p-3" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.borderColor}` }}>
            <legend className="px-1 text-xs font-semibold" style={{ color: tc.textColor }}>{index + 1}. {question.prompt}</legend>
            <div className="mt-2 grid gap-2">
              {question.options.map((option) => {
                const selected = answers[index] === option.score;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setAnswers((current) => ({ ...current, [index]: option.score }))}
                    className="rounded-lg px-3 py-2 text-left text-xs transition-colors"
                    style={{
                      backgroundColor: selected ? tc.buttonSecondaryBg : tc.cardBg,
                      border: `1px solid ${selected ? tc.accentColor : tc.borderColor}`,
                      color: tc.textColor,
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="rounded-xl p-3" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.borderColor}` }}>
        {profile ? (
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase" style={{ color: tc.mutedText }}>Your result</p>
                <h4 className="text-lg font-bold" style={{ color: tc.accentColor }}>{profile}</h4>
                <p className="max-w-2xl text-xs leading-relaxed" style={{ color: tc.textColor }}>{PROFILE_DESCRIPTIONS[profile]}</p>
              </div>
              <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor }}>
                Score {score} / {QUESTIONS.length * 3}
              </span>
            </div>
            <button type="button" onClick={downloadPdf} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold" style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}>
              <Download className="h-3.5 w-3.5" /> Download PDF result
            </button>
          </div>
        ) : (
          <p className="text-xs leading-relaxed" style={{ color: tc.mutedText }}>
            Complete every question to see whether the snapshot leans Conservative, Moderate or Aggressive.
          </p>
        )}
      </div>

      <button type="button" onClick={() => setAnswers({})} className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: tc.accentColor }}>
        <RotateCcw className="h-3.5 w-3.5" /> Reset quiz
      </button>
    </section>
  );
}
