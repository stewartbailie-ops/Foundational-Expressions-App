import { useMemo, useState } from "react";
import { Brain, CheckCircle2, Eye, RotateCcw } from "lucide-react";
import { makepuzzle, solvepuzzle } from "sudoku";
import { type getThemeColors } from "@/lib/themeUtils";

type SudokuCardProps = {
  tc: ReturnType<typeof getThemeColors>;
};

type SudokuValue = number | null;

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number) {
  return () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function withSeededRandom<T>(seed: string, build: () => T) {
  const originalRandom = Math.random;
  Math.random = seededRandom(hashSeed(seed));
  try {
    return build();
  } finally {
    Math.random = originalRandom;
  }
}

function buildDailyPuzzle(seed: string) {
  const puzzle = withSeededRandom(seed, () => makepuzzle()) as SudokuValue[];
  const solution = solvepuzzle(puzzle) as number[];
  return { puzzle, solution };
}

function toDisplayValue(value: SudokuValue) {
  return value === null || value === undefined ? "" : String(value + 1);
}

export function SudokuCard({ tc }: SudokuCardProps) {
  const todaySeed = new Date().toISOString().slice(0, 10);
  const { puzzle, solution } = useMemo(() => buildDailyPuzzle(todaySeed), [todaySeed]);
  const [cells, setCells] = useState(() => puzzle.map(toDisplayValue));
  const [errors, setErrors] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState("Same puzzle for every visitor today.");

  const resetPuzzle = () => {
    setCells(puzzle.map(toDisplayValue));
    setErrors(new Set());
    setMessage("Same puzzle for every visitor today.");
  };

  const updateCell = (index: number, value: string) => {
    if (puzzle[index] !== null) return;
    const digit = value.replace(/[^1-9]/g, "").slice(0, 1);
    setCells((current) => current.map((cell, i) => (i === index ? digit : cell)));
    setErrors((current) => {
      const next = new Set(current);
      next.delete(index);
      return next;
    });
  };

  const checkPuzzle = () => {
    const nextErrors = new Set<number>();
    cells.forEach((cell, index) => {
      if (!cell || puzzle[index] !== null) return;
      if (Number(cell) !== solution[index] + 1) nextErrors.add(index);
    });
    setErrors(nextErrors);
    const complete = cells.every(Boolean);
    if (nextErrors.size > 0) {
      setMessage(`${nextErrors.size} square${nextErrors.size === 1 ? "" : "s"} need another look.`);
    } else if (complete) {
      setMessage("Solved. Lovely work.");
    } else {
      setMessage("No errors found so far.");
    }
  };

  const revealPuzzle = () => {
    setCells(solution.map((value) => String(value + 1)));
    setErrors(new Set());
    setMessage("Revealed for today's puzzle.");
  };

  return (
    <section className="rounded-xl p-4 space-y-4" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }} data-testid="sudoku-card">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor }}>
          <Brain className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase" style={{ color: tc.mutedText }}>Game of the Day</p>
          <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Sudoku</h3>
          <p className="text-xs" style={{ color: tc.mutedText }}>{message}</p>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[21rem] grid-cols-9 overflow-hidden rounded-lg" style={{ border: `2px solid ${tc.borderColor}` }}>
        {cells.map((cell, index) => {
          const row = Math.floor(index / 9);
          const col = index % 9;
          const locked = puzzle[index] !== null;
          const error = errors.has(index);
          return (
            <input
              key={index}
              value={cell}
              readOnly={locked}
              inputMode="numeric"
              maxLength={1}
              aria-label={`Sudoku row ${row + 1} column ${col + 1}`}
              onChange={(event) => updateCell(index, event.target.value)}
              className="aspect-square min-w-0 text-center text-sm font-bold outline-none"
              style={{
                backgroundColor: error ? "rgba(239,68,68,0.18)" : locked ? tc.inputBg : tc.cardBg,
                borderColor: tc.borderColor,
                borderRightWidth: col === 2 || col === 5 ? 2 : 1,
                borderBottomWidth: row === 2 || row === 5 ? 2 : 1,
                color: error ? "#ef4444" : locked ? tc.mutedText : tc.textColor,
              }}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={checkPuzzle} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold" style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}>
          <CheckCircle2 className="h-3.5 w-3.5" /> Check
        </button>
        <button type="button" onClick={revealPuzzle} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor }}>
          <Eye className="h-3.5 w-3.5" /> Reveal
        </button>
        <button type="button" onClick={resetPuzzle} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold" style={{ backgroundColor: tc.inputBg, color: tc.textColor, border: `1px solid ${tc.borderColor}` }}>
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>
    </section>
  );
}
