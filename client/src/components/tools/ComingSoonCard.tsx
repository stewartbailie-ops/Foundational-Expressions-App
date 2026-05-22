import { type LucideIcon } from "lucide-react";
import { type getThemeColors } from "@/lib/themeUtils";

type ComingSoonCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  tc: ReturnType<typeof getThemeColors>;
};

export function ComingSoonCard({ title, description, icon: Icon, tc }: ComingSoonCardProps) {
  return (
    <section className="rounded-xl p-4" style={{ backgroundColor: tc.cardBg, border: `1px dashed ${tc.borderColor}` }}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor }}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>{title}</h3>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor }}>
              Coming Soon
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: tc.mutedText }}>{description}</p>
        </div>
      </div>
    </section>
  );
}
