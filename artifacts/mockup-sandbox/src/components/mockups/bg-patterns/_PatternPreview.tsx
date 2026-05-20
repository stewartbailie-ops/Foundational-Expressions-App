import { useState } from "react";
import { Phone, Mail, QrCode, User } from "lucide-react";

type Props = {
  src: string;
  label: string;
  rationale: string;
};

export function PatternPreview({ src, label, rationale }: Props) {
  const [opacity, setOpacity] = useState(40);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      {/* Pattern layer */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url("${src}")`,
          opacity: opacity / 100,
        }}
      />
      {/* Black base under pattern for honest "low opacity" preview */}
      <div className="absolute inset-0 -z-10 bg-black" />

      {/* Top control strip */}
      <div className="relative z-10 flex flex-col gap-2 border-b border-white/10 bg-black/60 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs">
          <div>
            <div className="text-sm font-semibold tracking-tight">{label}</div>
            <div className="text-[10px] text-white/60">{rationale}</div>
          </div>
          <div className="font-mono text-xs text-white/70">{opacity}%</div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={opacity}
          onChange={(e) => setOpacity(parseInt(e.target.value, 10))}
          className="h-1 w-full cursor-pointer accent-white"
          data-testid="input-opacity"
        />
        <div className="flex justify-between text-[9px] uppercase tracking-wide text-white/40">
          <span>off</span>
          <span>low</span>
          <span>med</span>
          <span>high</span>
          <span>max</span>
        </div>
      </div>

      {/* Faux profile card — proxy for what the public profile looks like */}
      <div className="relative z-10 mx-auto max-w-sm px-5 pt-8">
        <div className="rounded-2xl bg-gradient-to-b from-zinc-900/90 to-black/90 p-6 shadow-2xl ring-1 ring-white/10 backdrop-blur-md">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800 ring-2 ring-white/20">
              <User className="h-10 w-10 text-zinc-400" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-lg font-semibold">Stewart Robertson</div>
              <div className="text-xs uppercase tracking-wider text-white/60">
                Executive Financial Advisor
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs hover:bg-white/20">
              <Phone className="h-3.5 w-3.5" /> Call Back
            </button>
            <button className="flex items-center justify-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs hover:bg-white/20">
              <Mail className="h-3.5 w-3.5" /> Refer
            </button>
          </div>

          <div className="mt-5 rounded-lg bg-white p-3">
            <div className="flex items-center justify-center">
              <QrCode className="h-24 w-24 text-black" strokeWidth={1.2} />
            </div>
            <div className="mt-2 text-center text-[10px] font-medium text-black">
              Scan to save contact
            </div>
          </div>

          <div className="mt-4 text-center text-[10px] text-white/40">
            advisoryconnect.pro
          </div>
        </div>
      </div>

      {/* Spacer + footer hint */}
      <div className="relative z-10 px-5 pb-10 pt-6 text-center text-[10px] text-white/30">
        Move the slider above to compare opacity behind the card.
      </div>
    </div>
  );
}
