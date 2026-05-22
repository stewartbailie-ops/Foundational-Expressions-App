import { Brain, ExternalLink } from "lucide-react";
import { type getThemeColors } from "@/lib/themeUtils";

type SudokuCardProps = {
  tc: ReturnType<typeof getThemeColors>;
};

const SUDOKU_URL = "https://sudoku.com/";

export function SudokuCard({ tc }: SudokuCardProps) {
  return (
    <section className="rounded-xl p-4" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }} data-testid="sudoku-card">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor }}>
          <Brain className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase" style={{ color: tc.mutedText }}>Game of the Day</p>
          <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Sudoku</h3>
        </div>
        <a href={SUDOKU_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold no-underline" style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}>
          Launch <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </section>
  );
}
