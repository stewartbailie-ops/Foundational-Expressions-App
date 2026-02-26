import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const advisors = pgTable("advisors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  bio: text("bio"),
  entityType: text("entity_type").notNull().default("individual"),
  themeColor: text("theme_color").default("#000000"),
  font: text("font").default("inter"),
  coverImageUrl: text("cover_image_url"),
  linkedinUrl: text("linkedin_url"),
  websiteUrl: text("website_url"),
  profileSlug: text("profile_slug").notNull().unique(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAdvisorSchema = createInsertSchema(advisors).omit({
  id: true,
  createdAt: true,
});
export type InsertAdvisor = z.infer<typeof insertAdvisorSchema>;
export type Advisor = typeof advisors.$inferSelect;

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