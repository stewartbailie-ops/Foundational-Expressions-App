import { useEffect, useRef, useState } from "react";
import { Download, Eye, FileText, Upload } from "lucide-react";
import { jsPDF } from "jspdf";
import { type getThemeColors } from "@/lib/themeUtils";

type BookOfLifeProps = {
  tc: ReturnType<typeof getThemeColors>;
  advisorName?: string;
};

type SlotKey = "will" | "medical" | "insurance" | "life" | "risk";

type DocumentSlot = {
  key: SlotKey;
  title: string;
  note: string;
};

type SlotFile = {
  name: string;
  url: string;
  isUpload: boolean;
};

const DOCUMENT_SLOTS: DocumentSlot[] = [
  { key: "will", title: "Latest Will & Testament", note: "Keep the signed estate document in one clear place." },
  { key: "medical", title: "Medical Aid Details", note: "Plan, membership and emergency contact information." },
  { key: "insurance", title: "Insurance Details", note: "Short-term and long-term policy reference documents." },
  { key: "life", title: "Life Cover", note: "Cover schedule and beneficiary discussion record." },
  { key: "risk", title: "Risk Cover", note: "Disability, income protection and critical illness cover." },
];

function buildDemoPdf(slot: DocumentSlot, advisorName?: string) {
  const pdf = new jsPDF();
  pdf.setFillColor(18, 45, 68);
  pdf.rect(0, 0, 210, 34, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.text("Foundational Expressions", 16, 21);
  pdf.setTextColor(20, 31, 44);
  pdf.setFontSize(15);
  pdf.text(slot.title, 16, 55);
  pdf.setFontSize(11);
  pdf.text(`Demo Book of Life document${advisorName ? ` for ${advisorName}` : ""}.`, 16, 68);
  pdf.text("This PDF is pre-loaded for presentation purposes only.", 16, 77);
  pdf.text(slot.note, 16, 91, { maxWidth: 172 });
  pdf.setDrawColor(198, 214, 226);
  pdf.line(16, 108, 194, 108);
  pdf.setTextColor(90, 103, 117);
  pdf.text("Replace this slot with the client's current signed document.", 16, 122);
  return URL.createObjectURL(pdf.output("blob"));
}

export function BookOfLife({ tc, advisorName }: BookOfLifeProps) {
  const [files, setFiles] = useState<Record<SlotKey, SlotFile> | null>(null);
  const uploadUrls = useRef<string[]>([]);

  useEffect(() => {
    const demoFiles = Object.fromEntries(DOCUMENT_SLOTS.map((slot) => [
      slot.key,
      {
        name: `${slot.title}.pdf`,
        url: buildDemoPdf(slot, advisorName),
        isUpload: false,
      },
    ])) as Record<SlotKey, SlotFile>;

    setFiles(demoFiles);
    return () => {
      Object.values(demoFiles).forEach((file) => URL.revokeObjectURL(file.url));
      uploadUrls.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [advisorName]);

  const handleUpload = (slot: SlotKey, file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    uploadUrls.current.push(url);
    setFiles((current) => current ? {
      ...current,
      [slot]: { name: file.name, url, isUpload: true },
    } : current);
  };

  return (
    <section className="rounded-xl p-4 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }} data-testid="book-of-life">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor }}>
          <FileText className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Book of Life</h3>
          <p className="text-xs leading-relaxed" style={{ color: tc.mutedText }}>
            A client document pack preview{advisorName ? ` for ${advisorName}` : ""}. Demo PDFs are pre-loaded until secure storage is wired.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {DOCUMENT_SLOTS.map((slot) => {
          const file = files?.[slot.key];
          return (
            <article key={slot.key} className="rounded-lg p-3 space-y-2" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.borderColor}` }}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h4 className="text-sm font-medium" style={{ color: tc.textColor }}>{slot.title}</h4>
                  <p className="text-xs" style={{ color: tc.mutedText }}>{slot.note}</p>
                  <p className="mt-1 truncate text-[11px]" style={{ color: tc.accentColor }}>
                    {file ? `${file.isUpload ? "Uploaded" : "Demo"}: ${file.name}` : "Preparing demo PDF..."}
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold" style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}>
                  <Upload className="h-3.5 w-3.5" />
                  Upload
                  <input type="file" accept="application/pdf" className="hidden" onChange={(event) => handleUpload(slot.key, event.target.files?.[0])} />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={file?.url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs ${file ? "" : "pointer-events-none opacity-50"}`} style={{ color: tc.textColor, border: `1px solid ${tc.borderColor}` }}>
                  <Eye className="h-3.5 w-3.5" /> View
                </a>
                <a href={file?.url} download={file?.name} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs ${file ? "" : "pointer-events-none opacity-50"}`} style={{ color: tc.textColor, border: `1px solid ${tc.borderColor}` }}>
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
