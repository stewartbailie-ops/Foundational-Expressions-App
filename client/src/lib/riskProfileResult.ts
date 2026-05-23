export type StoredRiskProfileResult = {
  profile: string;
  score: number;
};

const RISK_RESULT_KEY = "ac_risk_result";

export function writeStoredRiskProfileResult(result: StoredRiskProfileResult) {
  try {
    localStorage.setItem(RISK_RESULT_KEY, JSON.stringify(result));
  } catch {
    // Private browsing or disabled storage should not block the quiz.
  }
}

export function readStoredRiskProfileResult(): StoredRiskProfileResult | null {
  try {
    const raw = localStorage.getItem(RISK_RESULT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredRiskProfileResult>;
    if (typeof parsed.profile !== "string" || typeof parsed.score !== "number") return null;
    return { profile: parsed.profile, score: parsed.score };
  } catch {
    return null;
  }
}
