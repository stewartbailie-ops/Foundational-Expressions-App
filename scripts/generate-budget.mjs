import * as XLSX from "xlsx";
import { fileURLToPath } from "url";
import path from "path";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, "..", "planning", "Advisory-Connect-Budget.xlsx");

const wb = XLSX.utils.book_new();

// ── SHEET 1: Monthly Upkeep ─────────────────────────────────────────────────

const monthlyRows = [
  ["Advisory Connect — Monthly Upkeep Costs"],
  [],
  ["Service", "Monthly Cost (R)", "Debit Date", "Notes"],
  ["MS Business Std (Email) ×2", 450, "", ""],
  ["Replit (App Hosting & Data)", 500, "", ""],
  ["AI Assistance (Claude Code)", 400, "", ""],
  ["SendGrid (Auto Mails) 50k cap)", 350, "", ""],
  ["TOTAL", { f: "SUM(B4:B7)" }, "", ""],
  [],
  ["Once-off Costs Upcoming"],
  ["Service", "Cost (R)", "Due Date", "Notes"],
  ["Google Play Store (Once-off)", 460, "", "One-time developer account fee"],
];

const ws1 = XLSX.utils.aoa_to_sheet(monthlyRows);

ws1["!cols"] = [
  { wch: 35 },
  { wch: 18 },
  { wch: 15 },
  { wch: 40 },
];

// Bold / style headings via cell metadata
ws1["A1"].s = { font: { bold: true, sz: 14 } };
ws1["A3"].s = { font: { bold: true } };
ws1["B3"].s = { font: { bold: true } };
ws1["C3"].s = { font: { bold: true } };
ws1["D3"].s = { font: { bold: true } };
ws1["A8"].s = { font: { bold: true } };
ws1["A10"].s = { font: { bold: true } };

XLSX.utils.book_append_sheet(wb, ws1, "Monthly Upkeep");

// ── SHEET 2: Costs to Date — Zeeman ─────────────────────────────────────────

const zeemanRows = [
  ["Advisory Connect — Costs to Date: Zeeman"],
  [],
  ["Date", "Description", "Amount (R)", "Running Total (R)"],
  ["25/02/2026", "Investment / Registration", 1200, { f: "C4" }],
  ["17/03/2026", "Investment / Registration", 1999.99, { f: "D4+C5" }],
  ["03/04/2026", "Investment / Registration", 1999.99, { f: "D5+C6" }],
  ["03/04/2026", "Full Registration", 2170, { f: "D6+C7" }],
  [],
  ["TOTAL INVESTED", "", { f: "SUM(C4:C7)" }, ""],
];

const ws2 = XLSX.utils.aoa_to_sheet(zeemanRows);
ws2["!cols"] = [{ wch: 18 }, { wch: 35 }, { wch: 18 }, { wch: 18 }];

XLSX.utils.book_append_sheet(wb, ws2, "Costs to Date — Zeeman");

// ── SHEET 3: Costs to Date — Stew ───────────────────────────────────────────

const stewRows = [
  ["Advisory Connect — Costs to Date: Stewart"],
  [],
  ["Date", "Category", "Description / Notes", "Amount (R)", "Running Total (R)"],
  ["24/01/2026", "", "", 570, { f: "D4" }],
  ["26/02/2026", "Email", "Zoho Mail", 210, { f: "E4+D5" }],
  ["26/02/2026", "", "", 480, { f: "E5+D6" }],
  ["06/03/2026", "", "", 320, { f: "E6+D7" }],
  ["18/03/2026", "", "", 850, { f: "E7+D8" }],
  ["18/03/2026", "AI Tools", "AI Codex", 150, { f: "E8+D9" }],
  ["18/03/2026", "AI Tools", "AI Codex", 150, { f: "E9+D10" }],
  ["24/03/2026", "", "", 200, { f: "E10+D11" }],
  ["24/03/2026", "Email", "SendGrid", 120, { f: "E11+D12" }],
  ["26/03/2026", "", "", 350, { f: "E12+D13" }],
  ["29/03/2026", "News", "MoneyWeb", 70, { f: "E13+D14" }],
  ["14/04/2026", "", "", 835, { f: "E14+D15" }],
  ["18/04/2026", "AI Tools", "AI Codex", 150, { f: "E15+D16" }],
  ["18/04/2026", "", "", 830, { f: "E16+D17" }],
  ["22/04/2026", "AI Tools", "Claude Code", 390, { f: "E17+D18" }],
  ["22/04/2026", "", "", 580, { f: "E18+D19" }],
  ["24/04/2026", "Microsoft 365", "Microsoft (R5159 - R5100 correction + R1999)", 2580, { f: "E19+D20" }],
  ["24/04/2026", "Email", "SendGrid", 420, { f: "E20+D21" }],
  ["24/04/2026", "", "", 1170, { f: "E21+D22" }],
  ["29/04/2026", "", "", 335, { f: "E22+D23" }],
  [],
  ["TOTAL SPENT", "", "", { f: "SUM(D4:D23)" }, ""],
];

const ws3 = XLSX.utils.aoa_to_sheet(stewRows);
ws3["!cols"] = [{ wch: 18 }, { wch: 18 }, { wch: 45 }, { wch: 15 }, { wch: 18 }];

XLSX.utils.book_append_sheet(wb, ws3, "Costs to Date — Stew");

// ── SHEET 4: Summary ─────────────────────────────────────────────────────────

const summaryRows = [
  ["Advisory Connect — Budget Summary"],
  [],
  ["Item", "Amount (R)"],
  ["Monthly Upkeep (recurring)", 1700],
  ["Google Play Store (once-off, upcoming)", 460],
  [],
  ["Total Invested — Zeeman", 7369.99],
  ["Total Spent — Stewart", ""],
  [],
  ["Notes"],
  ["• Add debit order dates to the Monthly Upkeep sheet once debit orders are set up"],
  ["• Stew sheet: fill in Category and Description for uncategorised rows"],
  ["• Zeeman sheet: update descriptions once payment purpose is confirmed"],
];

const ws4 = XLSX.utils.aoa_to_sheet(summaryRows);
ws4["!cols"] = [{ wch: 40 }, { wch: 20 }];

XLSX.utils.book_append_sheet(wb, ws4, "Summary");

// ── Write file ───────────────────────────────────────────────────────────────

XLSX.writeFile(wb, outputPath);
console.log(`Budget saved to: ${outputPath}`);
