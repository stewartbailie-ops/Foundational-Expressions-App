import { pgTable, text, integer, boolean, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const advisors = pgTable("advisors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  title: text("title").default("Financial Advisor"),
  bio: text("bio"),
  bioOption: text("bio_option").default("a"),
  customBio: text("custom_bio"),
  entityType: text("entity_type").notNull().default("individual"),
  themeColor: text("theme_color").default("#000000"),
  theme: text("theme").default("dark"),
  font: text("font").default("inter"),
  profilePicUrl: text("profile_pic_url"),
  coverImageUrl: text("cover_image_url"),
  linkedinUrl: text("linkedin_url"),
  websiteUrl: text("website_url"),
  profileSlug: text("profile_slug").notNull().unique(),
  individualServices: text("individual_services").array(),
  corporateServices: text("corporate_services").array(),
  showCallbackLink: boolean("show_callback_link").default(true),
  showReferralsLink: boolean("show_referrals_link").default(true),
  showQrCode: boolean("show_qr_code").default(true),
  advisorPasswordHash: text("advisor_password_hash"),
  advisorPasswordSet: boolean("advisor_password_set").default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAdvisorSchema = createInsertSchema(advisors).omit({
  id: true,
  createdAt: true,
});
export type InsertAdvisor = z.infer<typeof insertAdvisorSchema>;
export type Advisor = typeof advisors.$inferSelect;

export const TITLE_OPTIONS = [
  "Executive Financial Planner",
  "Financial Planner",
  "Executive Financial Advisor",
  "Financial Advisor",
] as const;

export const BIO_OPTIONS: Record<string, string> = {
  a: "Your single point of contact for all your financial needs and wealth planning. Please see the drop-down sections below for a concise overview of services provided.\n\nShould you wish to explore how our advisory services may add value, you are welcome to arrange a consultation at your convenience.",
  b: "Your single point of contact for your financial needs and wealth planning. Please see the drop-down sections below for a concise overview of services and solutions available. Should you, or anyone within your network, wish to discuss your requirements further, you are welcome to request a call-back or consultation at a convenient time.",
  c: "Thank you for the opportunity to share a brief overview of the value I strive to deliver to my clients.\n\nMy objective is to deliver clarity, structure, and sustainable growth through disciplined strategy and professional oversight. A concise outline of my services is available in the sections below.\n\nShould you, or anyone within your network, wish to explore how our services may add value, you are welcome to share this link, request a consultation, or arrange a call at a time that suits you. We look forward to connecting and assisting further.",
};

export const INDIVIDUAL_SERVICES = [
  {
    key: "tax-efficiency",
    name: "Optimize Tax Efficiency",
    description: "Strategic tax planning to minimize your tax burden while maintaining full compliance. We analyze your financial situation to identify legitimate tax-saving opportunities and implement structures that optimize your after-tax returns.",
  },
  {
    key: "tax-investment",
    name: "Tax-efficient Investment",
    description: "Investment strategies designed to maximize returns while minimizing tax impact. We structure portfolios using tax-advantaged vehicles and timing strategies to help grow your wealth more efficiently.",
  },
  {
    key: "personal-risk",
    name: "Personal Risk Cover",
    description: "Comprehensive risk assessment and insurance solutions to protect you and your family. We evaluate your unique circumstances to recommend appropriate life, disability, and income protection cover.",
  },
  {
    key: "retirement",
    name: "Retirement",
    description: "End-to-end retirement planning from accumulation through to comfortable retirement. We help you set realistic goals, choose appropriate retirement vehicles, and plan for a sustainable income in retirement.",
  },
  {
    key: "medical-aid",
    name: "Medical Aid",
    description: "Expert guidance on selecting the right medical aid plan for your needs and budget. We compare options across providers to ensure you get comprehensive healthcare coverage at the best possible value.",
  },
  {
    key: "short-term",
    name: "Short-term Insurance",
    description: "Protection for your assets including home, vehicle, and personal belongings. We assess your risk profile and recommend tailored short-term insurance solutions that provide adequate cover without overpaying.",
  },
  {
    key: "wills-estates",
    name: "Will & Estates",
    description: "Professional estate planning and will drafting to ensure your wishes are clearly documented and support effective estate planning and legacy protection. As part of our commitment to supporting your long-term wellbeing, we offer a complimentary Will.",
  },
] as const;

export const CORPORATE_SERVICES = [
  {
    key: "corporate-planning",
    name: "Corporate Planning",
    description: "Strategic financial planning for businesses. Our solutions help businesses attract, retain, and protect their most valuable assets: their people.",
  },
  {
    key: "group-risk",
    name: "Group Risk Cover",
    description: "Comprehensive group life, disability, and income protection solutions to safeguard employees and ensure business continuity in the event of unforeseen circumstances.",
  },
  {
    key: "pension-provident",
    name: "Pension/Provident Funds",
    description: "End-to-end retirement fund setup plans that allow employees to build their futures with contributions held in an acceptable structure.",
  },
  {
    key: "group-medical",
    name: "Group Medical Aid",
    description: "Access to a central healthcare solution for employees. The process includes analysis to determine the best group medical aid provider.",
  },
  {
    key: "corporate-short-term",
    name: "Corporate Short-Term Insurance",
    description: "Tailored coverage for company vehicles, equipment, offices, and facilities, with competitive premiums and comprehensive protection.",
  },
] as const;

export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  advisorId: integer("advisor_id").notNull(),
  senderName: text("sender_name").notNull(),
  senderEmail: text("sender_email").notNull(),
  type: text("type").notNull().default("Referral"),
  grade: text("grade").default("Silver"),
  subject: text("subject"),
  body: text("body"),
  clientAge: integer("client_age"),
  clientIncome: text("client_income"),
  clientIndustry: text("client_industry"),
  clientPhone: text("client_phone"),
  clientMarried: boolean("client_married"),
  clientChildren: boolean("client_children"),
  clientVehicle: boolean("client_vehicle"),
  clientProperty: boolean("client_property"),
  preferredContactTime: text("preferred_contact_time"),
  servicesRequested: text("services_requested"),
  referrerName: text("referrer_name"),
  referrerEmail: text("referrer_email"),
  referrerPhone: text("referrer_phone"),
  referrerRelation: text("referrer_relation"),
  source: text("source"),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
});

export const insertEmailSchema = createInsertSchema(emails).omit({
  id: true,
  receivedAt: true,
});
export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Email = typeof emails.$inferSelect;

export const GRADE_OPTIONS = ["Gold", "Silver", "Bronze", "Development"] as const;
export type GradeType = typeof GRADE_OPTIONS[number];

export function autoGradeClient(age?: number | null, income?: string | null, industry?: string | null): GradeType {
  const incomeNum = parseIncomeToNumber(income);

  if (age && age >= 60) return "Development";
  if (age && age >= 35 && age <= 55 && incomeNum >= 100000) return "Gold";
  if (age && age >= 35 && incomeNum >= 100000) return "Gold";
  if (industry && industry.toLowerCase().includes("it")) return "Gold";
  if (age && age >= 27 && age <= 35 && incomeNum >= 65000) return "Silver";
  if (age && age >= 18 && age <= 27 && incomeNum <= 25000) return "Bronze";
  if (incomeNum >= 100000) return "Gold";
  if (incomeNum >= 65000) return "Silver";
  if (incomeNum > 0 && incomeNum <= 25000) return "Bronze";
  return "Silver";
}

function parseIncomeToNumber(income?: string | null): number {
  if (!income) return 0;
  const cleaned = income.replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

export const stats = pgTable("stats", {
  id: serial("id").primaryKey(),
  advisorId: integer("advisor_id"),
  eventType: text("event_type").notNull(),
  eventDate: timestamp("event_date").defaultNow().notNull(),
});

export const insertStatSchema = createInsertSchema(stats).omit({
  id: true,
  eventDate: true,
});
export type InsertStat = z.infer<typeof insertStatSchema>;
export type Stat = typeof stats.$inferSelect;