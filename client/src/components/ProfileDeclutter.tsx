import { useState } from "react";
import { SlidersHorizontal, X, RotateCcw } from "lucide-react";

/**
 * Visitor-side "declutter" control for a public profile card.
 * Lets the person *viewing* the card hide sections they don't care about.
 * Choices are held by the parent and persisted per-advisor in localStorage
 * — no login, no backend, purely a nicer view for that visitor on that device.
 */
export function ProfileDeclutter({
  sections,
  labels,
  hidden,
  onToggle,
  onReset,
  accent = "#2563eb",
}: {
  sections: string[];
  labels: Record<string, string>;
  hidden: Set<string>;
  onToggle: (key: string) => void;
  onReset: () => void;
  accent?: string;
}) {
  const [open, setOpen] = useState(false);

  // Nothing to customise if the advisor exposes no reorderable sections.
  if (sections.length === 0) return null;

  const hiddenCount = sections.filter((k) => hidden.has(k)).length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Customise this card"
        className="fixed top-4 right-4 z-30 h-10 w-10 rounded-full bg-white shadow-lg border border-black/10 flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors"
        data-testid="button-declutter"
      >
        <SlidersHorizontal className="h-4 w-4" />
        {hiddenCount > 0 && (
          <span
            className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
            style={{ backgroundColor: accent }}
          >
            {hiddenCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            data-testid="declutter-panel"
          >
            <div className="flex items-start justify-between p-4 border-b border-gray-100">
              <div className="pr-2">
                <h3 className="text-base font-bold text-gray-900">Customise this card</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Hide sections you're not interested in. Saved on this device only.
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-2">
              {sections.map((key) => {
                const shown = !hidden.has(key);
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-sm text-gray-800">{labels[key] ?? key}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={shown}
                      onClick={() => onToggle(key)}
                      className="relative h-5 w-9 rounded-full flex-shrink-0 transition-colors"
                      style={{ backgroundColor: shown ? accent : "#d1d5db" }}
                      data-testid={`toggle-section-${key}`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${shown ? "translate-x-4" : "translate-x-0.5"}`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 p-3 border-t border-gray-100">
              <button
                onClick={onReset}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg"
                data-testid="button-declutter-reset"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ backgroundColor: accent }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
