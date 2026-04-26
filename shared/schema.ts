import { pgTable, text, integer, boolean, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const advisorProfiles = pgTable("advisor_profiles", {
  id: serial("id").primaryKey(),
  advisorId: integer("advisor_id").notNull(),
  profileSlug: text("profile_slug").notNull().unique(),
  title: text("title").default("Financial Advisor"),
  backgroundStyle: integer("background_style").default(1),
  bioOption: text("bio_option").default("a"),
  customBio: text("custom_bio"),
  bio: text("bio"),
  individualServices: text("individual_services").array(),
  corporateServices: text("corporate_services").array(),
  theme: text("theme").default("blue"),
  themeColor: text("theme_color").default("#4a8db5"),
  profilePicUrl: text("profile_pic_url"),
  linkedinUrl: text("linkedin_url"),
  websiteUrl: text("website_url"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  youtubeUrl: text("youtube_url"),
  astuteUrl: text("astute_url"),
  documentsUrl: text("documents_url"),
  qaUrl: text("qa_url"),
  financialsNewsUrl: text("financials_news_url"),
  financialsFunFactsUrl: text("financials_fun_facts_url"),
  financialsVideosUrl: text("financials_videos_url"),
  nickname: text("nickname"),
  profileDescription: text("profile_description"),
  showCallbackLink: boolean("show_callback_link").default(true),
  showReferralsLink: boolean("show_referrals_link").default(true),
  showQrCode: boolean("show_qr_code").default(true),
  showHeader: boolean("show_header").default(true),
  showProfilePic: boolean("show_profile_pic").default(true),
  showIntro: boolean("show_intro").default(true),
  showIndividualServices: boolean("show_individual_services").default(true),
  showCorporateServices: boolean("show_corporate_services").default(true),
  showSocials: boolean("show_socials").default(true),
  showAstute: boolean("show_astute").default(false),
  showDocuments: boolean("show_documents").default(false),
  showComplimentaryWill: boolean("show_complimentary_will").default(false),
  showFinancialMedia: boolean("show_financial_media").default(false),
  showTools: boolean("show_tools").default(false),
  showToolTax: boolean("show_tool_tax").default(true),
  showToolExchange: boolean("show_tool_exchange").default(true),
  showToolCompound: boolean("show_tool_compound").default(true),
  showToolPension: boolean("show_tool_pension").default(true),
  showToolCgt: boolean("show_tool_cgt").default(true),
  showToolVehicle: boolean("show_tool_vehicle").default(true),
  showToolReality: boolean("show_tool_reality").default(true),
  showToolLatte: boolean("show_tool_latte").default(true),
  showInteractive: boolean("show_interactive").default(true),
  showShowpieceSqueeze: boolean("show_showpiece_squeeze").default(true),
  showShowpieceTaxBite: boolean("show_showpiece_taxbite").default(true),
  showMoneywebFeed: boolean("show_moneyweb_feed").default(false),
  patternOpacity: integer("pattern_opacity").default(50),
  profileSectionOrder: text("profile_section_order"),
  notes: text("notes"),
  showEmergencyContacts: boolean("show_emergency_contacts").default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAdvisorProfileSchema = createInsertSchema(advisorProfiles).omit({
  id: true,
  createdAt: true,
});
export type InsertAdvisorProfile = z.infer<typeof insertAdvisorProfileSchema>;
export type AdvisorProfile = typeof advisorProfiles.$inferSelect;

export const advisors = pgTable("advisors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  contactNumber: text("contact_number"),
  location: text("location"),
  workingHours: text("working_hours"),
  showContactDetails: boolean("show_contact_details").default(true),
  title: text("title").default("Financial Advisor"),
  bio: text("bio"),
  bioOption: text("bio_option").default("a"),
  customBio: text("custom_bio"),
  entityType: text("entity_type").notNull().default("individual"),
  themeColor: text("theme_color").default("#4a8db5"),
  theme: text("theme").default("blue"),
  backgroundStyle: integer("background_style").default(1),
  font: text("font").default("inter"),
  profilePicUrl: text("profile_pic_url"),
  coverImageUrl: text("cover_image_url"),
  linkedinUrl: text("linkedin_url"),
  websiteUrl: text("website_url"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  youtubeUrl: text("youtube_url"),
  astuteUrl: text("astute_url"),
  documentsUrl: text("documents_url"),
  qaUrl: text("qa_url"),
  financialsNewsUrl: text("financials_news_url"),
  financialsFunFactsUrl: text("financials_fun_facts_url"),
  financialsVideosUrl: text("financials_videos_url"),
  nickname: text("nickname"),
  profileDescription: text("profile_description"),
  profileSlug: text("profile_slug").notNull().unique(),
  individualServices: text("individual_services").array(),
  corporateServices: text("corporate_services").array(),
  showCallbackLink: boolean("show_callback_link").default(true),
  showReferralsLink: boolean("show_referrals_link").default(true),
  showQrCode: boolean("show_qr_code").default(true),
  showHeader: boolean("show_header").default(true),
  showProfilePic: boolean("show_profile_pic").default(true),
  showIntro: boolean("show_intro").default(true),
  showIndividualServices: boolean("show_individual_services").default(true),
  showCorporateServices: boolean("show_corporate_services").default(true),
  showSocials: boolean("show_socials").default(true),
  showAstute: boolean("show_astute").default(false),
  showDocuments: boolean("show_documents").default(false),
  showComplimentaryWill: boolean("show_complimentary_will").default(false),
  showFinancialMedia: boolean("show_financial_media").default(false),
  showTools: boolean("show_tools").default(false),
  showToolTax: boolean("show_tool_tax").default(true),
  showToolExchange: boolean("show_tool_exchange").default(true),
  showToolCompound: boolean("show_tool_compound").default(true),
  showToolPension: boolean("show_tool_pension").default(true),
  showToolCgt: boolean("show_tool_cgt").default(true),
  showToolVehicle: boolean("show_tool_vehicle").default(true),
  showToolReality: boolean("show_tool_reality").default(true),
  showToolLatte: boolean("show_tool_latte").default(true),
  showInteractive: boolean("show_interactive").default(true),
  showShowpieceSqueeze: boolean("show_showpiece_squeeze").default(true),
  showShowpieceTaxBite: boolean("show_showpiece_taxbite").default(true),
  showMoneywebFeed: boolean("show_moneyweb_feed").default(false),
  patternOpacity: integer("pattern_opacity").default(50),
  profileSectionOrder: text("profile_section_order"),
  advisorPasswordHash: text("advisor_password_hash"),
  advisorPasswordSet: boolean("advisor_password_set").default(false),
  advisorEmailVerified: boolean("advisor_email_verified").default(false),
  isDemo: boolean("is_demo").default(false),
  advisorCode: text("advisor_code"),
  faisAgreementUrl: text("fais_agreement_url"),
  tosAcceptedAt: timestamp("tos_accepted_at"),
  subscriptionTier: text("subscription_tier").default("trial"),
  panelTheme: text("panel_theme").default("blue"),
  panelThemeColor: text("panel_theme_color").default("#4a8db5"),
  panelBackgroundStyle: integer("panel_background_style").default(1),
  notes: text("notes"),
  showEmergencyContacts: boolean("show_emergency_contacts").default(false),
  bookingUrl: text("booking_url"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const SUBSCRIPTION_TIERS = [
  { value: "trial", label: "Trial", description: "One month free — explore all features with no commitment.", price: "R0.00" },
  { value: "standard", label: "Standard", description: "Full access for active financial advisors.", price: "R199.99/mo" },
  { value: "premium", label: "Premium", description: "Standard plus priority support and advanced analytics.", price: "R499.99/mo" },
] as const;

export const insertAdvisorSchema = createInsertSchema(advisors).omit({
  id: true,
  createdAt: true,
}).extend({
  tosAcceptedAt: z.coerce.date().nullable().optional(),
});
export type InsertAdvisor = z.infer<typeof insertAdvisorSchema>;
export type Advisor = typeof advisors.$inferSelect;

export const DEFAULT_PROFILE_SECTION_ORDER = [
  "bio", "moneyweb", "interactive", "individual", "corporate", "socials",
  "callback", "referral", "will", "tools",
] as const;

export const PROFILE_SECTION_LABELS: Record<string, string> = {
  bio: "Introduction & Bio",
  moneyweb: "Live News Feed",
  interactive: "Interactive Financial Tools",
  individual: "Individual Services",
  corporate: "Corporate Services",
  socials: "Social Links",
  callback: "Call Back Button",
  referral: "Refer Friends Button",
  will: "Complimentary Will",
  tools: "Financial Tools",
};

export const TITLE_OPTIONS = [
  "Junior Financial Advisor",
  "Senior Financial Advisor",
  "Executive Financial Advisor",
  "CFP (Certified Financial Planner)",
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
    name: "Tax-free Savings Accounts",
    description: "Investment strategies designed to maximize returns while minimizing tax impact. We structure portfolios using tax-advantaged vehicles and timing strategies to help grow your wealth more efficiently.",
  },
  {
    key: "personal-risk",
    name: "Personal Protection Plan",
    description: "Comprehensive risk assessment and insurance solutions to protect you and your family. We evaluate your unique circumstances to recommend appropriate life, disability, and income protection cover.",
  },
  {
    key: "retirement",
    name: "Retirement Planning",
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
    name: "Wills, Estates & Trusts",
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
    name: "Group Protection Plan",
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

export const EMERGENCY_CONTACTS = [
  { key: "police",    label: "Police (Immediate Danger)",      number: "10111" },
  { key: "ambulance", label: "Ambulance (Medical Emergencies)", number: "10177" },
  { key: "fire",      label: "Fire (Fire Outbreaks)",           number: "10177" },
  { key: "childline", label: "Childline Support",               number: "0800055555" },
  { key: "domestic",  label: "Domestic Violence",               number: "0800150150" },
  { key: "lifeline",  label: "Lifeline (Suicide Crisis)",       number: "0861322322" },
  { key: "gbv",       label: "Gender-Based Violence",           number: "0800428428" },
  { key: "poison",    label: "Poison Information",              number: "0824468946" },
  { key: "searescue", label: "National Sea Rescue",             number: "087094977" },
] as const;

export const LEAD_STATUS_OPTIONS = ["Need to Contact", "Contacted", "Archive"] as const;
export type LeadStatus = typeof LEAD_STATUS_OPTIONS[number];

export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  advisorId: integer("advisor_id").notNull(),
  senderName: text("sender_name").notNull(),
  senderEmail: text("sender_email").notNull(),
  type: text("type").notNull().default("Referral"),
  grade: text("grade").default("Silver"),
  leadStatus: text("lead_status").default("Need to Contact"),
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
  lastOpenedAt: timestamp("last_opened_at"),
});

export const insertEmailSchema = createInsertSchema(emails).omit({
  id: true,
  receivedAt: true,
});
export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Email = typeof emails.$inferSelect;

export const GRADE_OPTIONS = ["Gold", "Silver", "Bronze", "Development"] as const;
export type GradeType = typeof GRADE_OPTIONS[number];

export function autoGradeClient(age?: number | null, income?: string | null, _industry?: string | null): GradeType {
  const incomeNum = parseIncomeToNumber(income);

  if (age && age >= 60) return "Development";
  if (incomeNum >= 75000) return "Gold";
  if (incomeNum >= 45000) return "Silver";
  if (incomeNum >= 15000) return "Bronze";
  if (incomeNum > 0) return "Development";
  return "Silver";
}

function parseIncomeToNumber(income?: string | null): number {
  if (!income) return 0;
  // Strip commas so "R10,000-R20,000" parses cleanly. Lowercase for "k" suffix matching.
  const normalized = income.toLowerCase().replace(/,/g, "").trim();
  // Match every "<number>[k]" token. For ranges like "R15k - R30k" or "R10000-R20000"
  // we use the LAST token (upper bound) so grading reflects what the client can earn,
  // not the floor of their bracket.
  const matches = [...normalized.matchAll(/(\d+(?:\.\d+)?)\s*(k)?/g)];
  if (matches.length === 0) return 0;
  const last = matches[matches.length - 1];
  const value = parseFloat(last[1]);
  return last[2] ? value * 1000 : value;
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
