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
  rotateInteractiveTools: boolean("rotate_interactive_tools").default(false),
  showShowpieceSqueeze: boolean("show_showpiece_squeeze").default(true),
  showShowpieceTaxBite: boolean("show_showpiece_taxbite").default(true),
  showShowpieceInflation: boolean("show_showpiece_inflation").default(true),
  showShowpieceWaiting: boolean("show_showpiece_waiting").default(true),
  showToolBond: boolean("show_tool_bond").default(true),
  showToolEmergency: boolean("show_tool_emergency").default(true),
  showToolLifeCover: boolean("show_tool_life_cover").default(true),
  showToolDebt: boolean("show_tool_debt").default(true),
  showMoneywebFeed: boolean("show_moneyweb_feed").default(false),
  showSecondNews: boolean("show_second_news").default(false),
  showForex: boolean("show_forex").default(false),
  showFunFacts: boolean("show_fun_facts").default(false),
  showLiberty: boolean("show_liberty").default(false),
  showStanlib: boolean("show_stanlib").default(false),
  showSigninghub: boolean("show_signinghub").default(false),
  // W1 T3: "My Email" platform tile (opens mailto:advisor.email). Opt-in default.
  showMyEmail: boolean("show_my_email").default(false),
  // Task #29 — Public Profile Feature Suite. Five opt-in toggles + supporting fields.
  showTradingView: boolean("show_trading_view").default(false),
  tradingViewSymbols: text("trading_view_symbols"),
  showDailyQuotes: boolean("show_daily_quotes").default(false),
  dailyQuotesSet: text("daily_quotes_set").default("general"),
  showCompoundCalc: boolean("show_compound_calc").default(false),
  showRetirementCalc: boolean("show_retirement_calc").default(false),
  showFinancialCalendar: boolean("show_financial_calendar").default(false),
  showFinancialDashboard: boolean("show_financial_dashboard").default(false),
  showSudoku: boolean("show_sudoku").default(false),
  showDailyTrivia: boolean("show_daily_trivia").default(false),
  patternOpacity: integer("pattern_opacity").default(50),
  imagePatternKey: text("image_pattern_key"),
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
  rotateInteractiveTools: boolean("rotate_interactive_tools").default(false),
  showShowpieceSqueeze: boolean("show_showpiece_squeeze").default(true),
  showShowpieceTaxBite: boolean("show_showpiece_taxbite").default(true),
  showShowpieceInflation: boolean("show_showpiece_inflation").default(true),
  showShowpieceWaiting: boolean("show_showpiece_waiting").default(true),
  showToolBond: boolean("show_tool_bond").default(true),
  showToolEmergency: boolean("show_tool_emergency").default(true),
  showToolLifeCover: boolean("show_tool_life_cover").default(true),
  showToolDebt: boolean("show_tool_debt").default(true),
  showMoneywebFeed: boolean("show_moneyweb_feed").default(false),
  showLiberty: boolean("show_liberty").default(false),
  showStanlib: boolean("show_stanlib").default(false),
  showSigninghub: boolean("show_signinghub").default(false),
  showFunFacts: boolean("show_fun_facts").default(false),
  showForex: boolean("show_forex").default(false),
  showSecondNews: boolean("show_second_news").default(false),
  // W1 T3: "My Email" platform tile (opens mailto:advisor.email). Opt-in default.
  showMyEmail: boolean("show_my_email").default(false),
  // Task #29 — Public Profile Feature Suite. Five opt-in toggles + supporting fields.
  showTradingView: boolean("show_trading_view").default(false),
  tradingViewSymbols: text("trading_view_symbols"),
  showDailyQuotes: boolean("show_daily_quotes").default(false),
  dailyQuotesSet: text("daily_quotes_set").default("general"),
  showCompoundCalc: boolean("show_compound_calc").default(false),
  showRetirementCalc: boolean("show_retirement_calc").default(false),
  showFinancialCalendar: boolean("show_financial_calendar").default(false),
  showFinancialDashboard: boolean("show_financial_dashboard").default(false),
  showSudoku: boolean("show_sudoku").default(false),
  showDailyTrivia: boolean("show_daily_trivia").default(false),
  patternOpacity: integer("pattern_opacity").default(50),
  imagePatternKey: text("image_pattern_key"),
  profileSectionOrder: text("profile_section_order"),
  advisorPasswordHash: text("advisor_password_hash"),
  advisorPasswordSet: boolean("advisor_password_set").default(false),
  advisorEmailVerified: boolean("advisor_email_verified").default(false),
  isDemo: boolean("is_demo").default(false),
  advisorCode: text("advisor_code"),
  faisAgreementUrl: text("fais_agreement_url"),
  tosAcceptedAt: timestamp("tos_accepted_at"),
  subscriptionTier: text("subscription_tier").default("trial"),
  // Task #26 — Paystack subscriptions (PIVOT from Stripe: SA not yet supported by Stripe).
  // All five columns nullable until the advisor completes a Paystack checkout.
  // See replit.md "Paystack Subscriptions (Task #26)" for the full flow + key rotation runbook.
  subscriptionStatus: text("subscription_status").default("trialing"),
  trialEndsAt: timestamp("trial_ends_at"),
  paystackCustomerCode: text("paystack_customer_code"),
  paystackSubscriptionCode: text("paystack_subscription_code"),
  paystackEmailToken: text("paystack_email_token"),
  trialExpiryEmailSentAt: timestamp("trial_expiry_email_sent_at"),
  // Period-end timestamp captured from Paystack's `next_payment_date` on
  // subscription events. While `subscriptionStatus = cancelled` AND
  // `subscriptionEndsAt > now()`, the advisor retains paid access until
  // their already-paid-for period elapses.
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  panelTheme: text("panel_theme").default("blue"),
  panelThemeColor: text("panel_theme_color").default("#4a8db5"),
  panelBackgroundStyle: integer("panel_background_style").default(1),
  notes: text("notes"),
  showEmergencyContacts: boolean("show_emergency_contacts").default(false),
  bookingUrl: text("booking_url"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Task #26 — tier split agreed Stewart + Friday + Claude, 16 May 2026.
// Full feature lists live in replit.md. Keep `value` stable — webhooks + DB rows reference it.
export const SUBSCRIPTION_TIERS = [
  { value: "trial",   label: "Free Trial", description: "14 days free — full Premium access, no card required.", price: "R0" },
  { value: "basic",   label: "Basic",      description: "One profile, all lead capture, analytics, business card.", price: "R299/mo" },
  { value: "premium", label: "Premium",    description: "Everything in Basic plus secondary profile, advanced analytics, practice management, white-label business cards.", price: "R499/mo" },
] as const;

export type SubscriptionTier = typeof SUBSCRIPTION_TIERS[number]["value"];

// Server + client share this list to gate Premium-only features. Keep in sync
// with replit.md tier-split section. Used by requirePremium / usePremium.
export const PREMIUM_FEATURES = [
  "secondary_profile",
  "advanced_analytics",
  "grader_breakdown_panel",
  "image_pattern_presets",
  "editors_article",
  "compound_calculator",
  "retirement_calculator",
  "financial_calendar",
  "fund_fact_sheets",
  "smartie_box",
  "risk_profile_quiz",
  "tradingview_multi",
  "multi_format_business_cards",
  "white_label_business_card",
  "my_clients",
  "weekly_brief",
  "meeting_recording",
  "priority_support",
] as const;
export type PremiumFeature = typeof PREMIUM_FEATURES[number];

type AccessShape = {
  subscriptionTier?: string | null;
  subscriptionStatus?: string | null;
  trialEndsAt?: Date | string | null;
  subscriptionEndsAt?: Date | string | null;
};

function toMs(v: Date | string | null | undefined): number | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  const t = d.getTime();
  return Number.isFinite(t) ? t : null;
}

// A cancelled-but-still-paid-up subscription keeps access until the period
// end. Paystack tells us this via `next_payment_date` on the subscription
// row, which the webhook stores into `subscriptionEndsAt`. We grant access
// when either the status is genuinely live (active/trialing) OR the status
// is `cancelled` / `non-renewing` AND the paid period has not yet elapsed.
function withinPaidPeriod(advisor: AccessShape): boolean {
  const ends = toMs(advisor.subscriptionEndsAt);
  return ends !== null && ends > Date.now();
}

export function isPremiumActive(advisor: AccessShape): boolean {
  const tier = advisor.subscriptionTier ?? "trial";
  const status = advisor.subscriptionStatus ?? "trialing";
  if (tier === "premium") {
    if (status === "active" || status === "trialing") return true;
    // Cancellation does not revoke access until the paid period ends.
    if ((status === "cancelled" || status === "non-renewing") && withinPaidPeriod(advisor)) return true;
  }
  // Trial = full Premium access until trialEndsAt passes
  if (tier === "trial" && status === "trialing") {
    if (!advisor.trialEndsAt) return true; // legacy advisors without trialEndsAt — grandfathered
    const ends = toMs(advisor.trialEndsAt);
    return ends !== null && ends > Date.now();
  }
  return false;
}

export function isBasicOrBetter(advisor: AccessShape): boolean {
  const tier = advisor.subscriptionTier ?? "trial";
  const status = advisor.subscriptionStatus ?? "trialing";
  if (tier === "basic" || tier === "premium") {
    if (status === "active" || status === "trialing") return true;
    if ((status === "cancelled" || status === "non-renewing") && withinPaidPeriod(advisor)) return true;
  }
  if (tier === "trial" && status === "trialing") {
    if (!advisor.trialEndsAt) return true;
    const ends = toMs(advisor.trialEndsAt);
    return ends !== null && ends > Date.now();
  }
  return false;
}

export const insertAdvisorSchema = createInsertSchema(advisors).omit({
  id: true,
  createdAt: true,
}).extend({
  tosAcceptedAt: z.coerce.date().nullable().optional(),
});
export type InsertAdvisor = z.infer<typeof insertAdvisorSchema>;
export type Advisor = typeof advisors.$inferSelect;

export const DEFAULT_PROFILE_SECTION_ORDER = [
  "bio", "moneyweb", "secondnews", "forex", "interactive", "funfacts",
  "individual", "corporate", "socials",
  "callback", "referral", "will", "tools", "platforms",
  "tradingview", "dailyquotes", "compoundcalc", "retirementcalc", "calendar", "financialdashboard", "sudoku",
] as const;

export const PROFILE_SECTION_LABELS: Record<string, string> = {
  bio: "Introduction & Bio",
  moneyweb: "Live News Feed",
  secondnews: "More Finance News",
  forex: "Live Exchange Rates",
  interactive: "Interactive Financial Tools",
  funfacts: "Financial Facts of the Day",
  individual: "Individual Services",
  corporate: "Corporate Services",
  socials: "Social Links",
  callback: "Call Back Button",
  referral: "Refer Friends Button",
  will: "Complimentary Will",
  tools: "Financial Tools",
  platforms: "Financial Platforms",
  tradingview: "TradingView Markets",
  dailyquotes: "Quote of the Day",
  compoundcalc: "Compound Interest Calculator",
  retirementcalc: "Retirement Savings Calculator",
  calendar: "Financial Calendar",
  financialdashboard: "Financial Health Dashboard",
  sudoku: "Game of the Day",
};

// Category-tinted backgrounds for fun-fact cards (dark, professional, white text on top)
export const FUN_FACT_CATEGORY_COLORS: Record<string, { bg: string; accent: string }> = {
  "Tax":                  { bg: "#0d4f4a", accent: "#4fd9c8" },
  "Retirement":           { bg: "#5b3473", accent: "#c9a3e8" },
  "Wills & Estate":       { bg: "#2a3a4d", accent: "#8aaecf" },
  "Investment":           { bg: "#1d3a6e", accent: "#7ea7f0" },
  "Budgeting & Saving":   { bg: "#2d5239", accent: "#7fd99e" },
  "Insurance":            { bg: "#6b2a35", accent: "#e89aa5" },
  "Property":             { bg: "#5b4129", accent: "#dba577" },
  "Medical Aid":          { bg: "#7a3d4f", accent: "#e8a3b6" },
};

export const PLATFORMS_META = [
  {
    key: "liberty",
    name: "My Liberty",
    description: "Access your Liberty client portal — policies, statements, and account management.",
    url: "https://myliberty.liberty.co.za/logon",
    colorHex: "#e31837",
    showField: "showLiberty" as const,
  },
  {
    key: "stanlib",
    name: "Stanlib",
    description: "Log in to the Stanlib investment platform — fund performance and portfolio access.",
    url: "https://login.stanlib.com/Account/Login",
    colorHex: "#003087",
    showField: "showStanlib" as const,
  },
  {
    key: "signinghub",
    name: "SigningHub",
    description: "Send, sign and track digital documents — secure e-signatures for client paperwork.",
    url: "https://web.signinghub.com/",
    colorHex: "#1f7a4d",
    showField: "showSigninghub" as const,
  },
] as const;

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
    name: "Optimise Tax Efficiency",
    description: "Strategic tax planning to minimise your tax burden while maintaining full compliance. We analyse your financial situation to identify legitimate tax-saving opportunities and implement structures that optimise your after-tax returns.",
  },
  {
    key: "tax-investment",
    name: "Tax-free Savings Accounts",
    description: "Investment strategies designed to maximise returns while minimising tax impact. We structure portfolios using tax-advantaged vehicles and timing strategies to help grow your wealth more efficiently.",
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
  sourceProfileSlug: text("source_profile_slug"),
  // Grader 2.0 fields — weighted scoring system
  leadScore: integer("lead_score").default(0),
  leadTemperature: text("lead_temperature").default("Cold"),
  gradeBreakdown: text("grade_breakdown"), // JSON string of per-category points
  receivedAt: timestamp("received_at").defaultNow().notNull(),
  // Admin tracking — updated when admin opens the lead in CIV
  lastOpenedAt: timestamp("last_opened_at"),
  // Advisor tracking — updated when the advisor themselves opens the lead in their panel
  firstViewedAt: timestamp("first_viewed_at"),
  lastViewedAt: timestamp("last_viewed_at"),
  // Set when leadStatus transitions to "Archive", cleared when transitioning out
  archivedAt: timestamp("archived_at"),
  // W1 T9: Soft-warn duplicate detection. When a new lead matches an existing
  // lead's phone or email for the same advisor, this points to the prior lead's
  // id so the registry expand row can surface a non-blocking "Possible duplicate"
  // flag. Never blocks submission — advisor decides merge vs treat-as-new.
  duplicateOfId: integer("duplicate_of_id"),
  // Task #23 — Grader gap fields (Chris's 15 May meeting). All nullable, additive.
  // Callback form: how the prospect found the advisor (organic/social/referral/other).
  howFound: text("how_found"),
  // Callback form / Will form: net-worth bracket — feeds Income scoring as a floor
  // (high-net-worth retirees with low monthly income should still grade Gold).
  netWorthBracket: text("net_worth_bracket"),
  // Callback form: open text — biggest financial concern (feeds services keyword bonus).
  biggestConcern: text("biggest_concern"),
  // Callback form: yes/no — does the prospect currently work with another FA.
  hasAdvisor: boolean("has_advisor"),
  // Callback form: optional follow-up name if hasAdvisor === true.
  existingAdvisorName: text("existing_advisor_name"),
  // Referral form: open text — why the referrer is recommending this person.
  referralReason: text("referral_reason"),
  // Will form: yes/no — does the prospect already have a Will.
  hasWill: boolean("has_will"),
  // Will form: bracket — estimated estate value (drives Will temperature axis).
  estateValueBracket: text("estate_value_bracket"),
  // Risk Profile Quiz — captured from localStorage when client submits a lead form.
  riskProfile: text("risk_profile"),
  riskScore: integer("risk_score"),
});

export const insertEmailSchema = createInsertSchema(emails).omit({
  id: true,
  receivedAt: true,
});
export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Email = typeof emails.$inferSelect;

export const GRADE_OPTIONS = ["Gold", "Silver", "Bronze", "Development"] as const;
export type GradeType = typeof GRADE_OPTIONS[number];

export const TEMPERATURE_OPTIONS = ["Hot", "Warm", "Cold"] as const;
export type TemperatureType = typeof TEMPERATURE_OPTIONS[number];

// ============================================================================
// Grader 2.0 — Weighted scoring system
// ----------------------------------------------------------------------------
// Score is out of 100, split across 5 categories:
//   Income (0-35) + Age (0-20) + Lifestyle (0-20) + Services (0-15) + Source (0-10)
// Grade thresholds: Gold ≥75, Silver ≥55, Bronze ≥35, Development <35.
// Temperature is independent and reflects urgency/intent, not value.
// ============================================================================

export interface GraderInput {
  age?: number | null;
  income?: string | null;
  married?: boolean | null;
  children?: boolean | null;
  vehicle?: boolean | null;
  property?: boolean | null;
  servicesRequested?: string | null;
  type?: string | null; // "Call Back" | "Referral" | "Will Request"
  // Task #23 — gap fields. All optional so existing call-sites keep working.
  netWorthBracket?: string | null;
  biggestConcern?: string | null;
  hasAdvisor?: boolean | null;
  hasWill?: boolean | null;
  estateValueBracket?: string | null;
}

export interface GradeBreakdown {
  income: number;
  age: number;
  lifestyle: number;
  services: number;
  source: number;
}

export interface GraderResult {
  score: number;
  grade: GradeType;
  temperature: TemperatureType;
  breakdown: GradeBreakdown;
}

export function calculateLeadGrade(input: GraderInput): GraderResult {
  // ── Income / Wealth: 0-35 pts ──
  // Monthly income is the primary signal, but net-worth bracket can override
  // when supplied (a retiree with R10m saved and R20k monthly income is still
  // a Gold-tier client). We take the higher of the two contributions so the
  // category caps cleanly at 35 instead of double-counting.
  const incomeNum = parseIncomeToNumber(input.income);
  let monthlyIncomePts = 0;
  if (incomeNum >= 100000) monthlyIncomePts = 35;
  else if (incomeNum >= 75000) monthlyIncomePts = 30;
  else if (incomeNum >= 50000) monthlyIncomePts = 25;
  else if (incomeNum >= 35000) monthlyIncomePts = 20;
  else if (incomeNum >= 20000) monthlyIncomePts = 12;
  else if (incomeNum >= 10000) monthlyIncomePts = 6;

  const netWorthNum = parseNetWorthToNumber(input.netWorthBracket);
  let netWorthPts = 0;
  if (netWorthNum >= 20_000_000) netWorthPts = 35;
  else if (netWorthNum >= 5_000_000) netWorthPts = 28;
  else if (netWorthNum >= 1_000_000) netWorthPts = 20;
  else if (netWorthNum >= 250_000) netWorthPts = 10;
  else if (netWorthNum > 0) netWorthPts = 3;

  let incomePts = Math.max(monthlyIncomePts, netWorthPts);

  // ── Age: 0-20 pts (FA sweet-spot: 35-55, working life: 28-65) ──
  // Guard against null, 0, and bogus negative ages — only score real positive ages.
  let agePts = 0;
  if (typeof input.age === "number" && input.age > 0) {
    if (input.age >= 35 && input.age <= 55) agePts = 20;
    else if (input.age >= 28 && input.age <= 65) agePts = 14;
    else if (input.age >= 22) agePts = 8;
    else agePts = 3;
  }

  // ── Lifestyle complexity: 0-20 pts (life events drive financial planning needs) ──
  let lifestylePts = 0;
  if (input.married) lifestylePts += 5;
  if (input.children) lifestylePts += 5;
  if (input.vehicle) lifestylePts += 5;
  if (input.property) lifestylePts += 5;

  // ── Services complexity: 0-15 pts ──
  let servicesPts = 0;
  if (input.servicesRequested) {
    const services = input.servicesRequested.toLowerCase();
    const count = services.split(",").map(s => s.trim()).filter(Boolean).length;
    servicesPts = Math.min(15, count * 4);
    // Bonus for high-value service signals
    if (services.includes("estate") || services.includes("will") || services.includes("retirement")) {
      servicesPts = Math.min(15, servicesPts + 3);
    }
  }
  // Task #23 — "biggest concern" open text feeds the same services keyword
  // bonus. A prospect who writes "worried about retirement & tax" is signalling
  // demand even if they ticked zero service boxes.
  if (input.biggestConcern) {
    const concern = input.biggestConcern.toLowerCase();
    const concernKeywords = ["retir", "tax", "estate", "will", "invest", "insur", "debt", "medical", "cover", "save"];
    if (concernKeywords.some(k => concern.includes(k))) {
      servicesPts = Math.min(15, servicesPts + 3);
    }
  }

  // ── Source quality: 0-10 pts (intent signal embedded in submission type) ──
  let sourcePts = 5;
  const type = (input.type || "").toLowerCase();
  if (type.includes("callback") || type.includes("call back")) sourcePts = 10;
  else if (type.includes("will")) sourcePts = 7;
  else if (type.includes("manual")) sourcePts = 6; // advisor-logged from outside the funnel
  else if (type.includes("referral")) sourcePts = 5;

  const score = incomePts + agePts + lifestylePts + servicesPts + sourcePts;

  // ── Grade ──
  let grade: GradeType;
  if (score >= 75) grade = "Gold";
  else if (score >= 55) grade = "Silver";
  else if (score >= 35) grade = "Bronze";
  else grade = "Development";

  // ── Temperature: separate axis, primarily about urgency/intent ──
  let temperature: TemperatureType = "Cold";
  if (type.includes("callback") || type.includes("call back")) {
    temperature = "Hot";
    // Task #23 — a prospect who already has an FA is fishing for a second
    // opinion, not switching tomorrow. Demote Hot → Warm so the advisor
    // prioritises genuinely un-advised calls first.
    if (input.hasAdvisor === true) temperature = "Warm";
  } else if (type.includes("will")) {
    temperature = "Warm";
    // Task #23 — no existing Will + sizeable estate = urgent (intestate risk).
    // High estate value alone is enough to bump Will requests to Hot.
    const estateNum = parseNetWorthToNumber(input.estateValueBracket);
    if (input.hasWill === false && estateNum >= 5_000_000) temperature = "Hot";
    else if (estateNum >= 20_000_000) temperature = "Hot";
  } else if (type.includes("referral") || type.includes("manual")) {
    // Referrals + Manual Entries: warm if they came in with rich client data,
    // cold if minimal — the advisor either knows the prospect or doesn't yet.
    if (incomeNum > 0 || input.age || netWorthNum > 0) temperature = "Warm";
  }

  return {
    score,
    grade,
    temperature,
    breakdown: {
      income: incomePts,
      age: agePts,
      lifestyle: lifestylePts,
      services: servicesPts,
      source: sourcePts,
    },
  };
}

// Backwards-compatible wrapper — kept so any legacy caller without the full
// lead object still works. Prefer calculateLeadGrade() in new code.
export function autoGradeClient(age?: number | null, income?: string | null, _industry?: string | null): GradeType {
  return calculateLeadGrade({ age, income }).grade;
}

// Task #23 — parse net-worth / estate-value brackets like "R1m-R5m", "R20m+",
// "<R250k". Returns the upper bound in rand so the grader can compare cleanly.
function parseNetWorthToNumber(bracket?: string | null): number {
  if (!bracket) return 0;
  const normalized = bracket.toLowerCase().replace(/,/g, "").trim();
  // Match every "<number>[k|m]" token; use the LAST (upper bound of range or "+" anchor).
  const matches = [...normalized.matchAll(/(\d+(?:\.\d+)?)\s*([km])?/g)];
  if (matches.length === 0) return 0;
  const last = matches[matches.length - 1];
  const value = parseFloat(last[1]);
  const multiplied = last[2] === "m" ? value * 1_000_000 : last[2] === "k" ? value * 1_000 : value;
  // Task #23 fix — "Under R250k" / "<R250k" means the client is BELOW the
  // stated figure, so the upper-bound semantics flips. Return just under the
  // bound so it lands in the lowest scoring tier instead of inflating to the
  // bracket's ceiling.
  const isUnder = /^(under|less than|<)/.test(normalized);
  if (isUnder) return Math.max(0, multiplied - 1);
  return multiplied;
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

// Task #24 — Login audit log. Records every admin + advisor login attempt
// (success and failure) with IP and user-agent. Feeds the PII-audit work that
// follows. Kept as a single table with a nullable advisorId — admin logins
// store advisorId=null + role='admin'; advisor logins store advisorId + role.
// Outcome is 'success' | 'invalid_password' | 'invalid_email' | 'unverified'
// | 'not_setup' so we can spot brute-force attempts vs misconfigured accounts.
export const loginAudit = pgTable("login_audit", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(),
  advisorId: integer("advisor_id"),
  emailAttempted: text("email_attempted"),
  slug: text("slug"),
  outcome: text("outcome").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type LoginAudit = typeof loginAudit.$inferSelect;
export type InsertLoginAudit = typeof loginAudit.$inferInsert;

// Task #25 — PII / Client tables.
// `clients` holds promoted-from-lead client records. Identity fields are
// stored in plaintext for advisor day-to-day use; "special personal
// information" under POPIA (idNumber, bank details, tax number) is stored
// AES-256-GCM encrypted via server/encryption.ts. The plaintext value never
// hits disk. Per-advisor isolation is enforced at the storage layer — every
// client query takes `advisorId` as a required parameter.
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  advisorId: integer("advisor_id").notNull(),
  // Optional pointer back to the source lead in `emails` (when promoted).
  sourceLeadId: integer("source_lead_id"),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  // Encrypted PII columns. Storage methods encrypt on write + decrypt on read.
  // Wire format: v1:<iv>:<ct>:<tag> (see server/encryption.ts).
  idNumberEnc: text("id_number_enc"),
  bankAccountEnc: text("bank_account_enc"),
  bankBranchEnc: text("bank_branch_enc"),
  taxNumberEnc: text("tax_number_enc"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Right-to-erasure: set when erased; preserved as a tombstone for audit.
  erasedAt: timestamp("erased_at"),
  erasedBy: text("erased_by"),
});
export type Client = typeof clients.$inferSelect;
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  erasedAt: true,
  erasedBy: true,
  idNumberEnc: true,
  bankAccountEnc: true,
  bankBranchEnc: true,
  taxNumberEnc: true,
}).extend({
  // Callers pass plaintext; storage layer encrypts before INSERT.
  idNumber: z.string().optional().nullable(),
  bankAccount: z.string().optional().nullable(),
  bankBranch: z.string().optional().nullable(),
  taxNumber: z.string().optional().nullable(),
});
export type InsertClient = z.infer<typeof insertClientSchema>;

// Append-only audit table for every read/write/erase of PII rows. Postgres
// rules in server/migrations.ts reject UPDATE/DELETE so the trail is
// tamper-evident. Indexed on (table_name, row_id) for per-record lookup.
export const auditPii = pgTable("audit_pii", {
  id: serial("id").primaryKey(),
  actorRole: text("actor_role").notNull(), // 'admin' | 'advisor'
  actorAdvisorId: integer("actor_advisor_id"),
  action: text("action").notNull(), // 'read' | 'write' | 'erase'
  tableName: text("table_name").notNull(),
  rowId: integer("row_id").notNull(),
  fieldName: text("field_name"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type AuditPii = typeof auditPii.$inferSelect;
export type InsertAuditPii = typeof auditPii.$inferInsert;

// POPIA consent capture. One row per consent grant; never updated. Captures
// the exact consent text the user agreed to so we have a defensible record
// of WHAT they consented to, not just THAT they consented.
export const clientConsent = pgTable("client_consent", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  advisorId: integer("advisor_id").notNull(),
  consentText: text("consent_text").notNull(),
  consentedAt: timestamp("consented_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});
export type ClientConsent = typeof clientConsent.$inferSelect;
export type InsertClientConsent = typeof clientConsent.$inferInsert;

// Document upload metadata. Actual file bytes live on disk under
// /uploads/clients/<advisorId>/<random>.enc — never publicly served.
// Fetch requires advisor session + ownership check.
export const clientDocuments = pgTable("client_documents", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  advisorId: integer("advisor_id").notNull(),
  originalFilename: text("original_filename").notNull(),
  mimeType: text("mime_type").notNull(),
  encryptedPath: text("encrypted_path").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  erasedAt: timestamp("erased_at"),
});
export type ClientDocument = typeof clientDocuments.$inferSelect;
export type InsertClientDocument = typeof clientDocuments.$inferInsert;

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
