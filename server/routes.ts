import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAdvisorSchema, insertAdvisorProfileSchema, insertEmailSchema, autoGradeClient, calculateLeadGrade, GRADE_OPTIONS, LEAD_STATUS_OPTIONS } from "@shared/schema";
import { sendEmail, isSendGridConfigured, buildRecipients } from "./sendgrid";
import { z } from "zod";
import multer from "multer";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import rateLimit from "express-rate-limit";

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { message: "Too many login attempts. Please try again in 15 minutes." } });
const advisorLoginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { message: "Too many login attempts. Please try again in 15 minutes." } });
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { message: "Too many OTP attempts. Please try again in 15 minutes." } });
const otpSendLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false, message: { message: "Too many verification emails sent. Please try again in an hour." } });

// Task #25 — per-IP rate limits on public endpoints. Lead-form limits are
// intentionally generous (a sole advisor demoing live in a meeting might
// submit two test referrals back-to-back), but tight enough that a script
// hammering /api/callback hits a 429 well before it can fill the DB. Profile
// + stats lookups are higher because every page view fires them. Webhook
// endpoint is its own bucket — providers retry, but never at high volume.
// Audit hook logs each block to audit_pii so admin can spot abuse patterns.
const auditRateLimitBlock = (req: import("express").Request, bucket: string) => {
  storage.recordAuditPii({
    actorRole: "anon",
    actorAdvisorId: null,
    action: "rate_limit_block",
    tableName: bucket,
    rowId: 0,
    fieldName: null,
    ipAddress: req.ip || null,
    userAgent: (req.headers["user-agent"] as string) || null,
  }).catch(() => {});
};
const leadFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false,
  message: { message: "Too many submissions from this IP. Please try again later." },
  handler: (req, res, _next, opts) => { auditRateLimitBlock(req, "lead_form"); res.status(opts.statusCode).json(opts.message); },
});
const publicReadLimiter = rateLimit({
  windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false,
  message: { message: "Too many requests. Please slow down." },
  handler: (req, res, _next, opts) => { auditRateLimitBlock(req, "public_read"); res.status(opts.statusCode).json(opts.message); },
});
const statsAccessLimiter = rateLimit({
  windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false,
  message: { message: "Too many requests." },
  handler: (req, res, _next, opts) => { auditRateLimitBlock(req, "stats_access"); res.status(opts.statusCode).json(opts.message); },
});
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false,
  message: { message: "Webhook rate exceeded." },
  handler: (req, res, _next, opts) => { auditRateLimitBlock(req, "webhook"); res.status(opts.statusCode).json(opts.message); },
});

const safeUrlField = z
  .string()
  .nullable()
  .optional()
  .refine(
    (val) => val === null || val === undefined || val === "" || /^https?:\/\//i.test(val.trim()),
    { message: "URL must start with http:// or https://" }
  );

const URL_FIELD_OVERRIDES = {
  linkedinUrl: safeUrlField,
  websiteUrl: safeUrlField,
  facebookUrl: safeUrlField,
  instagramUrl: safeUrlField,
  youtubeUrl: safeUrlField,
  astuteUrl: safeUrlField,
  documentsUrl: safeUrlField,
  qaUrl: safeUrlField,
  financialsNewsUrl: safeUrlField,
  financialsFunFactsUrl: safeUrlField,
  financialsVideosUrl: safeUrlField,
  bookingUrl: safeUrlField,
} as const;

const safeInsertAdvisorSchema = insertAdvisorSchema.extend(URL_FIELD_OVERRIDES);
const safeInsertAdvisorProfileSchema = insertAdvisorProfileSchema.extend(URL_FIELD_OVERRIDES);
// PATCH must never let the caller change ownership of a profile to another advisor.
const safeUpdateAdvisorProfileSchema = safeInsertAdvisorProfileSchema.omit({ advisorId: true }).partial();

const otpStore = new Map<string, { code: string; expires: number }>();

// Returns true if the request session is allowed to manage the given advisor's data.
// Allowed when: master admin, the advisor's own logged-in panel session, or a demo advisor.
async function canAccessAdvisor(req: import("express").Request, advisorId: number): Promise<boolean> {
  const session = req.session as any;
  if (session?.authenticated) return true;
  // Task #24 — canonical advisor session contract: session.advisorId is set
  // at login time and is the primary identity. Slug-keyed flags
  // (advisor_${slug}) are kept for back-compat with legacy session cookies
  // still in circulation and the slug-scoped /api/advisors/:slug/* routes.
  if (session?.advisorId === advisorId) return true;
  const advisor = await storage.getAdvisor(advisorId);
  if (!advisor) return false;
  // Demo advisors are intentionally publicly browsable for sales walk-throughs,
  // but we still require a session signal — visiting the demo profile sets
  // session[`advisor_${slug}`] via /api/advisor-auth/:slug/session below. That
  // way anonymous direct-API hits to demo lead data are still rejected.
  if (advisor.isDemo && !!session?.[`advisor_${advisor.profileSlug}`]) return true;
  return !!session?.[`advisor_${advisor.profileSlug}`];
}

// Returns true if the session can read/mutate a specific lead (admin or the lead's own advisor).
async function canAccessLead(req: import("express").Request, leadId: number): Promise<boolean> {
  const email = await storage.getEmailById(leadId);
  if (!email) return false;
  return canAccessAdvisor(req, email.advisorId);
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const PUBLIC_ADVISOR_FIELDS = [
  "id", "name", "email", "contactNumber", "location", "workingHours", "showContactDetails",
  // S5 fix: email/advisorCode/faisAgreementUrl were silently stripped by this
  // allowlist, so when the advisor refreshed their panel the form re-initialised
  // from the public payload with empty values — looking like the save was lost.
  // email is already rendered publicly (mailto link), advisorCode is the FAIS
  // licence number (compliance-public), faisAgreementUrl is the Section 5
  // disclosure PDF whose file is already publicly served from /uploads/.
  "advisorCode", "faisAgreementUrl",
  "title", "bio", "bioOption", "customBio", "entityType",
  "themeColor", "theme", "backgroundStyle", "font",
  "panelTheme", "panelThemeColor", "panelBackgroundStyle",
  "profilePicUrl", "coverImageUrl",
  "linkedinUrl", "websiteUrl", "facebookUrl", "instagramUrl", "youtubeUrl",
  "astuteUrl", "documentsUrl", "qaUrl",
  "financialsNewsUrl", "financialsFunFactsUrl", "financialsVideosUrl",
  "nickname", "profileDescription", "profileSlug",
  "individualServices", "corporateServices",
  "showCallbackLink", "showReferralsLink", "showQrCode", "showHeader",
  "showProfilePic", "showIntro", "showIndividualServices", "showCorporateServices",
  "showSocials", "showAstute", "showDocuments", "showComplimentaryWill",
  "showFinancialMedia", "showTools", "showToolTax", "showToolExchange",
  "showToolCompound", "showToolVehicle", "showToolReality", "showToolLatte",
  "showInteractive", "showShowpieceSqueeze", "showShowpieceTaxBite",
  // M6 parity: 6 toggles added to both primary + secondary editors. Without
  // these in the public allowlist the panel reads them as undefined and the
  // `!== false` defaulting flips them back to true on every save (same class
  // of bug as the S5 email/advisorCode regression).
  "showShowpieceInflation", "showShowpieceWaiting",
  "showToolBond", "showToolEmergency", "showToolLifeCover", "showToolDebt",
  "showMoneywebFeed", "showEmergencyContacts",
  "showLiberty", "showStanlib", "showSigninghub",
  // W1 T3: My Email tile — must be public so the profile page can render it.
  "showMyEmail",
  "showFunFacts", "showForex", "showSecondNews",
  // Task #29: Public Profile Feature Suite — five toggleable sections +
  // their per-feature config must reach the public profile fetcher, else
  // every section would be silently off regardless of advisor settings.
  "showTradingView", "tradingViewSymbols",
  "showDailyQuotes", "dailyQuotesSet",
  "showCompoundCalc", "showRetirementCalc", "showFinancialCalendar",
  "patternOpacity", "profileSectionOrder", "active",
  "bookingUrl",
] as const;

type PublicAdvisor = Pick<import("@shared/schema").Advisor, (typeof PUBLIC_ADVISOR_FIELDS)[number]>;

function toPublicAdvisor(advisor: import("@shared/schema").Advisor): PublicAdvisor {
  return PUBLIC_ADVISOR_FIELDS.reduce((acc, key) => {
    (acc as any)[key] = (advisor as any)[key];
    return acc;
  }, {} as PublicAdvisor);
}

export function registerOgImageRoute(app: Express) {
  app.get("/api/og-image/:slug", async (req, res) => {
    try {
      const advisor = await storage.getAdvisorBySlug(req.params.slug);
      if (!advisor) return res.status(404).send("Not found");
      const picUrl = (advisor as any).profilePicUrl as string | null | undefined;
      if (!picUrl) return res.status(404).send("No image");
      if (picUrl.startsWith("data:")) {
        const match = picUrl.match(/^data:([^;]+);base64,(.+)$/s);
        if (!match) return res.status(400).send("Invalid");
        const [, mime, b64] = match;
        const buf = Buffer.from(b64, "base64");
        res.set({ "Content-Type": mime, "Content-Length": buf.length, "Cache-Control": "public, max-age=86400" });
        return res.send(buf);
      }
      return res.redirect(302, picUrl);
    } catch {
      res.status(500).send("Error");
    }
  });
}

async function verifyRecaptcha(token: string): Promise<boolean> {
  try {
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) return true;
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${secret}&response=${token}`,
    });
    const data = await response.json() as { success: boolean };
    return data.success === true;
  } catch {
    return true;
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    cb(null, allowed.includes(file.mimetype));
  },
});

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype === "application/pdf");
  },
});

function verifyZohoWebhook(req: import("express").Request): boolean {
  const secret = process.env.ZOHO_WEBHOOK_SECRET;
  if (!secret) {
    console.error("ZOHO_WEBHOOK_SECRET is not configured — rejecting webhook request");
    return false;
  }
  const token = req.headers["x-zoho-webhook-token"] as string | undefined;
  if (!token) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(secret));
  } catch {
    return false;
  }
}

function verifySendGridWebhook(req: import("express").Request): boolean {
  const secret = process.env.SENDGRID_WEBHOOK_SECRET;
  if (!secret) {
    console.error("SENDGRID_WEBHOOK_SECRET is not configured — rejecting webhook request");
    return false;
  }
  const token = req.headers["x-sendgrid-webhook-token"] as string | undefined;
  if (!token) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(secret));
  } catch {
    return false;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Dynamic sitemap.xml — includes static legal pages plus every active
  // advisor's primary slug and all of their secondary profile slugs, so
  // Google can discover advisor profiles without us hand-maintaining a
  // static file. Replaces the old client/public/sitemap.xml.
  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const allAdvisors = await storage.getAdvisors();
      const active = allAdvisors.filter((a) => a.active && a.profileSlug);

      const urls: { loc: string; priority: string; changefreq: string }[] = [
        { loc: "https://app.advisoryconnect.pro/", priority: "1.0", changefreq: "weekly" },
        { loc: "https://app.advisoryconnect.pro/privacy-policy", priority: "0.3", changefreq: "monthly" },
        { loc: "https://app.advisoryconnect.pro/terms", priority: "0.3", changefreq: "monthly" },
      ];

      for (const a of active) {
        urls.push({
          loc: `https://app.advisoryconnect.pro/${encodeURIComponent(a.profileSlug)}`,
          priority: "0.8",
          changefreq: "weekly",
        });
        const secondaries = await storage.getAdvisorProfiles(a.id);
        for (const sp of secondaries) {
          if (!sp.profileSlug) continue;
          urls.push({
            loc: `https://app.advisoryconnect.pro/${encodeURIComponent(sp.profileSlug)}`,
            priority: "0.6",
            changefreq: "weekly",
          });
        }
      }

      const xml =
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        urls
          .map(
            (u) =>
              `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
          )
          .join("\n") +
        `\n</urlset>\n`;

      res.set("Content-Type", "application/xml; charset=utf-8");
      res.set("Cache-Control", "public, max-age=3600");
      res.send(xml);
    } catch (err) {
      console.error("[sitemap] generation failed:", err);
      res.status(500).send("sitemap generation failed");
    }
  });

  app.post("/api/auth/login", loginLimiter, async (req, res) => {
    const { email, password } = req.body;
    // Task #24 — capture IP + UA once for audit rows regardless of outcome.
    const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || null;
    const userAgent = req.headers["user-agent"]?.slice(0, 500) || null;
    const audit = (outcome: string) => storage.recordLoginAudit({
      role: "admin",
      advisorId: null,
      emailAttempted: typeof email === "string" ? email.slice(0, 200) : null,
      slug: null,
      outcome,
      ipAddress,
      userAgent,
    });
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return res.status(500).json({ message: "Admin password not configured" });
    }
    const adminEmail = (process.env.ADMIN_EMAIL || "info@advisoryconnect.pro").toLowerCase().trim();
    if (!email || email.toLowerCase().trim() !== adminEmail) {
      audit("invalid_email");
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (password !== adminPassword) {
      audit("invalid_password");
      return res.status(401).json({ message: "Invalid email or password" });
    }
    audit("success");
    (req.session as any).authenticated = true;
    req.session.save((err) => {
      if (err) {
        console.error("[LOGIN] Session save error:", err);
        return res.status(500).json({ message: `Session save failed: ${err.message || err}` });
      }
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.json({ authenticated: true });
    });
  });

  app.get("/api/auth/session", async (req, res) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.json({ authenticated: !!(req.session as any)?.authenticated });
  });

  app.post("/api/auth/logout", async (req, res) => {
    req.session.destroy(() => {
      res.json({ authenticated: false });
    });
  });

  // Reserved VM redeploys rebuild the container, so anything written under
  // ./uploads/ at runtime is lost. Pre-create the directory tree so the static
  // handler doesn't 5xx on a cold deploy with no prior uploads, and so the
  // failure mode for missing files is a clean 404 (the client renders the
  // initials badge as fallback via the img onError handler on the profile).
  // Permanent fix: migrate to Replit Object Storage (tracked separately).
  try {
    const fsSync = await import("fs");
    fsSync.mkdirSync("uploads/profile", { recursive: true });
    fsSync.mkdirSync("uploads/fais", { recursive: true });
  } catch { /* best-effort */ }
  app.use("/uploads", (await import("express")).default.static("uploads"));

  app.post("/api/upload/profile-pic", upload.single("file"), async (req, res) => {
    const session = req.session as any;
    const hasSession = session?.authenticated || Object.keys(session || {}).some(k => k.startsWith("advisor_") && session[k] === true);
    if (!hasSession) return res.status(401).json({ message: "Unauthorized" });
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded or invalid file type" });
    }
    const fs = await import("fs/promises");
    const path = await import("path");
    const crypto = await import("crypto");
    const extByMime: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };
    const ext = extByMime[req.file.mimetype] ?? ".jpg";
    const dir = path.join("uploads", "profile");
    await fs.mkdir(dir, { recursive: true });
    const filename = `${crypto.randomBytes(16).toString("hex")}${ext}`;
    await fs.writeFile(path.join(dir, filename), req.file.buffer);
    res.json({ url: `/uploads/profile/${filename}` });
  });

  app.post("/api/upload/fais", pdfUpload.single("file"), async (req, res) => {
    const session = req.session as any;
    const hasSession = session?.authenticated || Object.keys(session || {}).some(k => k.startsWith("advisor_") && session[k] === true);
    if (!hasSession) return res.status(401).json({ message: "Unauthorized" });
    if (!req.file) {
      return res.status(400).json({ message: "PDF required (max 10MB)" });
    }
    const base64 = req.file.buffer.toString("base64");
    const url = `data:application/pdf;base64,${base64}`;
    res.json({ url, filename: req.file.originalname });
  });

  app.get("/api/dashboard/stats", async (_req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  app.get("/api/dashboard/activity", async (req, res) => {
    const raw = Number(req.query.days);
    const days = [7, 30, 90].includes(raw) ? raw : 7;
    const activity = await storage.getWeeklyActivity(days);
    res.json(activity);
  });

  app.get("/api/dashboard/breakdown", async (_req, res) => {
    const breakdown = await storage.getLeadBreakdown();
    res.json(breakdown);
  });

  app.get("/api/config/status", async (_req, res) => {
    res.json({ sendgrid: isSendGridConfigured() });
  });

  app.get("/api/advisors", async (_req, res) => {
    const advisors = await storage.getAdvisors();
    res.json(advisors);
  });

  app.get("/api/advisors/profile-counts", async (_req, res) => {
    const counts = await storage.getAdvisorProfileCounts();
    res.json(counts);
  });

  // Task #31 — soft-warn duplicate pre-check. Lets the lead forms + Add-Lead
  // modal show an inline "this contact is already on file" notice before
  // submit. Uses the same `findDuplicateLead` storage helper that powers the
  // post-submit `duplicate_of_id` flag, so detection rules stay in one place.
  // newId=0 because there is no current lead yet; the helper excludes that id.
  // Response is intentionally minimal — only fields the client needs to render
  // the notice — so this endpoint can stay public/unauthenticated.
  app.get("/api/leads/check-duplicate", publicReadLimiter, async (req, res) => {
    const advisorId = Number(req.query.advisorId);
    const phone = typeof req.query.phone === "string" ? req.query.phone : "";
    const email = typeof req.query.email === "string" ? req.query.email : "";
    if (!Number.isFinite(advisorId) || advisorId <= 0) return res.json({ duplicate: false });
    if (!phone.trim() && !email.trim()) return res.json({ duplicate: false });
    try {
      const dup = await storage.findDuplicateLead(advisorId, 0, phone, email);
      if (!dup) return res.json({ duplicate: false });
      // Privacy gate: a public/unauthenticated caller would otherwise be able
      // to probe (advisorId, phone/email) pairs and read back the existing
      // lead's name/id — a user-enumeration vector. So only the boolean is
      // returned to the public; the advisor (or admin) who actually owns the
      // lead gets the full metadata needed to render a useful inline notice.
      const canSeeDetails = await canAccessAdvisor(req, advisorId);
      if (!canSeeDetails) return res.json({ duplicate: true });
      res.json({
        duplicate: true,
        id: dup.id,
        name: dup.senderName,
        type: dup.type,
        receivedAt: dup.receivedAt,
      });
    } catch (err) {
      console.warn("[check-duplicate]", err);
      res.json({ duplicate: false });
    }
  });

  app.get("/api/advisors/slug/:slug", publicReadLimiter, async (req, res) => {
    const advisor = await storage.getAdvisorBySlug(req.params.slug);
    if (!advisor) return res.status(404).json({ message: "Advisor not found" });
    res.json(toPublicAdvisor(advisor));
  });

  app.get("/api/advisors/:id", async (req, res) => {
    const advisor = await storage.getAdvisor(Number(req.params.id));
    if (!advisor) return res.status(404).json({ message: "Advisor not found" });
    res.json(advisor);
  });

  app.post("/api/advisors", async (req, res) => {
    const parsed = safeInsertAdvisorSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    }
    const advisor = await storage.createAdvisor(parsed.data);
    res.status(201).json(advisor);
  });

  app.patch("/api/advisors/:id", async (req, res) => {
    const partial = safeInsertAdvisorSchema.partial().safeParse(req.body);
    if (!partial.success) {
      return res.status(400).json({ message: "Invalid data", errors: partial.error.flatten() });
    }
    const updated = await storage.updateAdvisor(Number(req.params.id), partial.data);
    if (!updated) return res.status(404).json({ message: "Advisor not found" });
    res.json(updated);
  });

  app.patch("/api/advisors/:id/toggle", async (req, res) => {
    const { active } = req.body;
    if (typeof active !== "boolean") {
      return res.status(400).json({ message: "active must be a boolean" });
    }
    const updated = await storage.toggleAdvisorActive(Number(req.params.id), active);
    if (!updated) return res.status(404).json({ message: "Advisor not found" });
    res.json(updated);
  });

  app.delete("/api/advisors/:id", async (req, res) => {
    const deleted = await storage.deleteAdvisor(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Advisor not found" });
    res.json({ success: true });
  });

  app.get("/api/advisors/:id/profiles", async (req, res) => {
    const advisorId = Number(req.params.id);
    if (!(await canAccessAdvisor(req, advisorId))) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const profiles = await storage.getAdvisorProfiles(advisorId);
    res.json(profiles);
  });

  app.post("/api/advisors/:id/profiles", async (req, res) => {
    const advisorId = Number(req.params.id);
    if (!(await canAccessAdvisor(req, advisorId))) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // Premium gate: secondary profiles are a Premium-only feature per the
    // agreed tier-split (Stewart + Friday + Claude, 16 May 2026). Admin
    // sessions bypass the gate so support can still provision profiles.
    const isAdmin = !!(req.session as any)?.authenticated;
    if (!isAdmin) {
      const { isPremiumActive } = await import("@shared/schema");
      const gateAdvisor = await storage.getAdvisor(advisorId);
      if (!gateAdvisor || !isPremiumActive(gateAdvisor)) {
        return res.status(402).json({ message: "Secondary profiles require a Premium subscription", tier: gateAdvisor?.subscriptionTier ?? "trial" });
      }
    }
    const parsed = safeInsertAdvisorProfileSchema.safeParse({ ...req.body, advisorId });
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    }
    const existing = await storage.getAdvisorProfiles(advisorId);
    if (existing.length >= 4) {
      return res.status(400).json({ message: "Maximum of 5 profiles (1 primary + 4 additional) per advisor." });
    }
    try {
      const profile = await storage.createAdvisorProfile(parsed.data);
      res.status(201).json(profile);
    } catch (err: any) {
      if (err.code === "23505") {
        return res.status(409).json({ message: "That profile URL is already taken. Please choose a different one." });
      }
      throw err;
    }
  });

  app.patch("/api/advisors/:id/profiles/:profileId", async (req, res) => {
    const advisorId = Number(req.params.id);
    const profileId = Number(req.params.profileId);
    if (!(await canAccessAdvisor(req, advisorId))) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // Prevent IDOR: profileId must belong to this advisorId.
    const owned = await storage.getAdvisorProfiles(advisorId);
    if (!owned.some((p) => p.id === profileId)) {
      return res.status(404).json({ message: "Profile not found" });
    }
    const partial = safeUpdateAdvisorProfileSchema.safeParse(req.body);
    if (!partial.success) {
      return res.status(400).json({ message: "Invalid data", errors: partial.error.flatten() });
    }
    try {
      const updated = await storage.updateAdvisorProfile(profileId, partial.data);
      if (!updated) return res.status(404).json({ message: "Profile not found" });
      res.json(updated);
    } catch (err: any) {
      if (err.code === "23505") {
        return res.status(409).json({ message: "That profile URL is already taken. Please choose a different one." });
      }
      throw err;
    }
  });

  app.delete("/api/advisors/:id/profiles/:profileId", async (req, res) => {
    // W1 T8: Secondary profiles are NOT independently deletable. They cascade
    // away only when their parent advisor is deleted (see storage.deleteAdvisor).
    // Master-admin sessions retain the override so support can still clean up
    // orphans, but advisors cannot delete their own secondary profiles from the
    // panel — only edit them. UI hides the button; this is the defence in depth.
    const isAdmin = !!(req.session as any)?.authenticated;
    if (!isAdmin) {
      return res.status(400).json({
        message: "Secondary profiles cannot be deleted individually. Remove the advisor to remove all their profiles.",
      });
    }
    const advisorId = Number(req.params.id);
    const profileId = Number(req.params.profileId);
    // Prevent IDOR: profileId must belong to this advisorId.
    const owned = await storage.getAdvisorProfiles(advisorId);
    if (!owned.some((p) => p.id === profileId)) {
      return res.status(404).json({ message: "Profile not found" });
    }
    const deleted = await storage.deleteAdvisorProfile(profileId);
    if (!deleted) return res.status(404).json({ message: "Profile not found" });
    res.json({ success: true });
  });

  app.get("/api/emails", async (req, res) => {
    // Task #24 — admin sees all leads (master CIV); an authenticated advisor
    // sees only their own leads. Anonymous → 401, no PII disclosure.
    const session = req.session as any;
    if (session?.authenticated) {
      const emails = await storage.getEmails();
      return res.json(emails);
    }
    if (typeof session?.advisorId === "number") {
      const advisor = await storage.getAdvisor(session.advisorId);
      const leads = await storage.getEmailsByAdvisor(session.advisorId);
      // Mirror the admin shape (`advisorName` joined in) so the same UI works.
      const name = advisor?.name ?? "";
      return res.json(leads.map(l => ({ ...l, advisorName: name })));
    }
    return res.status(401).json({ message: "Unauthorized" });
  });

  // Admin-only CSV export of all leads
  app.get("/api/emails/export.csv", async (req, res) => {
    if (!(req.session as any)?.authenticated) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const emails = await storage.getEmails();

    const escape = (val: unknown): string => {
      if (val === null || val === undefined) return "";
      let s = String(val);
      // Defuse CSV formula injection: prefix a leading =, +, -, @, tab or CR
      // with an apostrophe so spreadsheets treat the cell as text, not a formula.
      if (/^[=+\-@\t\r]/.test(s)) {
        s = "'" + s;
      }
      if (/[",\r\n]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const yesNo = (v: boolean | null | undefined): string =>
      v === true ? "Yes" : v === false ? "No" : "";

    const headers = [
      "ID", "Received", "Type", "Sender Name", "Sender Email", "Phone",
      "Advisor", "Age", "Income", "Industry",
      "Married", "Children", "Vehicle", "Property",
      "Services Requested", "Preferred Contact Time",
      "Source", "Source Profile",
      "Score", "Grade", "Temperature",
      "Status", "Last Opened",
      "Subject", "Message",
      "Referrer Name", "Referrer Email", "Referrer Phone", "Referrer Relation",
    ];

    const rows = emails.map((e: any) => [
      e.id,
      e.receivedAt ? new Date(e.receivedAt).toISOString() : "",
      e.type,
      e.senderName,
      e.senderEmail,
      e.clientPhone,
      e.advisorName,
      e.clientAge,
      e.clientIncome,
      e.clientIndustry,
      yesNo(e.clientMarried),
      yesNo(e.clientChildren),
      yesNo(e.clientVehicle),
      yesNo(e.clientProperty),
      e.servicesRequested,
      e.preferredContactTime,
      e.source,
      e.sourceProfileSlug,
      e.leadScore,
      e.grade,
      e.leadTemperature,
      e.leadStatus,
      e.lastOpenedAt ? new Date(e.lastOpenedAt).toISOString() : "",
      e.subject,
      e.body,
      e.referrerName,
      e.referrerEmail,
      e.referrerPhone,
      e.referrerRelation,
    ].map(escape).join(","));

    const csv = [headers.join(","), ...rows].join("\r\n");
    const bom = "\uFEFF"; // UTF-8 BOM so Excel reads accents correctly
    const filename = `advisory-connect-leads-${new Date().toISOString().split("T")[0]}.csv`;

    res.set("Content-Type", "text/csv; charset=utf-8");
    res.set("Content-Disposition", `attachment; filename="${filename}"`);
    res.set("Cache-Control", "no-store");
    res.send(bom + csv);
  });

  // Public demo-only lead wiper. Removes ALL leads for a single demo advisor.
  app.delete("/api/demo-emails/by-advisor/:id", async (req, res) => {
    const advisorId = Number(req.params.id);
    const advisor = await storage.getAdvisor(advisorId);
    if (!advisor) return res.status(404).json({ message: "Advisor not found" });
    if (!advisor.isDemo) return res.status(403).json({ message: "Only demo advisors can be wiped" });
    const leads = await storage.getEmailsByAdvisor(advisorId);
    let count = 0;
    for (const l of leads) {
      const ok = await storage.deleteEmail(l.id);
      if (ok) count++;
    }
    res.json({ deleted: count });
  });

  // Public demo-only lead seeder. Refuses any non-demo advisor.
  // Admin-only: top up realistic synthetic leads across ALL demo profiles.
  // Body: { perAdvisor?: number }  (default 5, capped at 50)
  app.post("/api/demo-emails/topup", async (req, res) => {
    if (!(req.session as any)?.authenticated) {
      return res.status(401).json({ message: "Admin authentication required" });
    }
    const requested = Math.max(1, Math.min(50, parseInt(req.body?.perAdvisor ?? "5", 10) || 5));
    const { autoTrickleDemoLeads } = await import("./demoSeeder");
    const result = await autoTrickleDemoLeads(requested);
    res.json({ ...result, perAdvisor: requested });
  });

  app.post("/api/demo-emails", async (req, res) => {
    const advisorId = Number(req.body?.advisorId);
    if (!advisorId) return res.status(400).json({ message: "advisorId required" });
    const advisor = await storage.getAdvisor(advisorId);
    if (!advisor) return res.status(404).json({ message: "Advisor not found" });
    if (!advisor.isDemo) return res.status(403).json({ message: "Only demo advisors can be seeded" });
    const parsed = insertEmailSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const data: any = parsed.data;
    // Always recalculate via Grader 2.0 — uses full lead context (age, income, lifestyle, services, type)
    const result = calculateLeadGrade({
      age: data.clientAge,
      income: data.clientIncome,
      married: data.clientMarried,
      children: data.clientChildren,
      vehicle: data.clientVehicle,
      property: data.clientProperty,
      servicesRequested: data.servicesRequested,
      type: data.type,
      netWorthBracket: data.netWorthBracket,
      biggestConcern: data.biggestConcern,
      hasAdvisor: data.hasAdvisor,
      hasWill: data.hasWill,
      estateValueBracket: data.estateValueBracket,
    });
    data.grade = result.grade;
    data.leadScore = result.score;
    data.leadTemperature = result.temperature;
    data.gradeBreakdown = JSON.stringify(result.breakdown);
    if (req.body?.receivedAt) {
      const d = new Date(req.body.receivedAt);
      if (!isNaN(d.getTime())) data.receivedAt = d;
    }
    const email = await storage.createEmail(data);
    res.status(201).json(email);
  });

  app.post("/api/emails", async (req, res) => {
    const parsed = insertEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    }
    const data: any = parsed.data;
    // Task #24 — full lockdown: every POST /api/emails write requires either
    // an admin session or an advisor session that owns `data.advisorId`.
    // Public lead submissions flow through the dedicated /api/callback,
    // /api/referral, /api/will-request endpoints — never this one. The only
    // in-product caller is AdvisorPanel's "Add Lead Manually" button, which
    // carries the advisor session.
    if (!(await canAccessAdvisor(req, data.advisorId))) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = calculateLeadGrade({
      age: data.clientAge,
      income: data.clientIncome,
      married: data.clientMarried,
      children: data.clientChildren,
      vehicle: data.clientVehicle,
      property: data.clientProperty,
      servicesRequested: data.servicesRequested,
      type: data.type,
      netWorthBracket: data.netWorthBracket,
      biggestConcern: data.biggestConcern,
      hasAdvisor: data.hasAdvisor,
      hasWill: data.hasWill,
      estateValueBracket: data.estateValueBracket,
    });
    data.grade = result.grade;
    data.leadScore = result.score;
    data.leadTemperature = result.temperature;
    data.gradeBreakdown = JSON.stringify(result.breakdown);
    if (req.body?.receivedAt) {
      const d = new Date(req.body.receivedAt);
      if (!isNaN(d.getTime())) data.receivedAt = d;
    }
    const email = await storage.createEmail(data);
    res.status(201).json(email);
  });

  app.patch("/api/emails/:id/grade", async (req, res) => {
    // Task #24 — admin OR the owning advisor may grade. canAccessLead enforces
    // the ownership check (returns true for admin session or matching advisor).
    if (!await canAccessLead(req, Number(req.params.id))) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { grade } = req.body;
    if (!grade || !GRADE_OPTIONS.includes(grade)) {
      return res.status(400).json({ message: `grade must be one of: ${GRADE_OPTIONS.join(", ")}` });
    }
    const updated = await storage.updateEmailGrade(Number(req.params.id), grade);
    if (!updated) return res.status(404).json({ message: "Email not found" });
    res.json(updated);
  });

  app.patch("/api/emails/:id/status", async (req, res) => {
    if (!await canAccessLead(req, Number(req.params.id))) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { leadStatus } = req.body;
    if (!leadStatus || !LEAD_STATUS_OPTIONS.includes(leadStatus)) {
      return res.status(400).json({ message: `leadStatus must be one of: ${LEAD_STATUS_OPTIONS.join(", ")}` });
    }
    const updated = await storage.updateEmailStatus(Number(req.params.id), leadStatus);
    if (!updated) return res.status(404).json({ message: "Email not found" });
    res.json(updated);
  });

  app.patch("/api/emails/:id/open", async (req, res) => {
    const id = Number(req.params.id);
    if (!await canAccessLead(req, id)) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // Branch on session type:
    // - Master admin in CIV → only bumps lastOpenedAt (admin tracking)
    // - Advisor in their own panel → bumps firstViewedAt (if null) + lastViewedAt
    // This prevents admin views from polluting advisor-facing "Last viewed" timestamps.
    const isAdmin = !!(req.session as any)?.authenticated;
    const updated = isAdmin
      ? await storage.updateEmailOpened(id)
      : await storage.updateEmailViewedByAdvisor(id);
    if (!updated) return res.status(404).json({ message: "Email not found" });
    res.json(updated);
  });

  app.delete("/api/emails/:id", async (req, res) => {
    if (!await canAccessLead(req, Number(req.params.id))) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const deleted = await storage.deleteEmail(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Email not found" });
    res.json({ message: "Deleted" });
  });

  app.post("/api/referral", leadFormLimiter, async (req, res) => {
    try {
      const schema = z.object({
        advisorId: z.number(),
        clientName: z.string().min(1),
        clientEmail: z.string().optional(),
        clientAge: z.number().optional(),
        clientIncome: z.string().optional(),
        clientIndustry: z.string().optional(),
        clientPhone: z.string().optional(),
        clientMarried: z.boolean().optional(),
        clientChildren: z.boolean().optional(),
        clientVehicle: z.boolean().optional(),
        clientProperty: z.boolean().optional(),
        preferredContactTime: z.string().optional(),
        servicesRequested: z.string().optional(),
        referrerName: z.string().optional(),
        referrerEmail: z.string().optional(),
        referrerPhone: z.string().optional(),
        referrerRelation: z.string().optional(),
        message: z.string().optional(),
        source: z.string().optional(),
        sourceProfileSlug: z.string().optional(),
        // Task #23 — per-referral "why are you referring them?" open text.
        referralReason: z.string().optional(),
        recaptchaToken: z.string().optional(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }

      const data = parsed.data;

      if (data.recaptchaToken) {
        const valid = await verifyRecaptcha(data.recaptchaToken);
        if (!valid) {
          return res.status(400).json({ message: "reCAPTCHA verification failed. Please try again." });
        }
      }
      const result = calculateLeadGrade({
        age: data.clientAge,
        income: data.clientIncome,
        married: data.clientMarried,
        children: data.clientChildren,
        vehicle: data.clientVehicle,
        property: data.clientProperty,
        servicesRequested: data.servicesRequested,
        type: "Referral",
      });

      const email = await storage.createEmail({
        advisorId: data.advisorId,
        senderName: data.clientName,
        senderEmail: data.clientEmail || "",
        type: "Referral",
        grade: result.grade,
        leadScore: result.score,
        leadTemperature: result.temperature,
        gradeBreakdown: JSON.stringify(result.breakdown),
        subject: `Referral from ${data.source || "advisor app"}`,
        body: data.message || "",
        clientAge: data.clientAge,
        clientIncome: data.clientIncome,
        clientIndustry: data.clientIndustry,
        clientPhone: data.clientPhone,
        clientMarried: data.clientMarried,
        clientChildren: data.clientChildren,
        clientVehicle: data.clientVehicle,
        clientProperty: data.clientProperty,
        preferredContactTime: data.preferredContactTime,
        servicesRequested: data.servicesRequested,
        referrerName: data.referrerName,
        referrerEmail: data.referrerEmail,
        referrerPhone: data.referrerPhone,
        referrerRelation: data.referrerRelation,
        referralReason: data.referralReason,
        source: data.source,
        sourceProfileSlug: data.sourceProfileSlug,
      });

      // W1 T9: soft-warn duplicate detection. Non-blocking — just attaches a flag.
      try {
        const dup = await storage.findDuplicateLead(data.advisorId, email.id, data.clientPhone, data.clientEmail);
        if (dup) await storage.markEmailDuplicate(email.id, dup.id);
      } catch (dupErr) { console.warn("[dup-detect] referral:", dupErr); }

      const advisor = await storage.getAdvisor(data.advisorId);
      if (isSendGridConfigured()) {
        try {
          const servicesText = data.servicesRequested ? `<p><strong>Services:</strong> ${data.servicesRequested}</p>` : "";
          const referrerText = data.referrerName ? `<p><strong>Referred by:</strong> ${data.referrerName} (${data.referrerEmail || "no email"})</p>` : "";
          await sendEmail(
            buildRecipients(advisor?.email),
            `New Referral: ${data.clientName} (Advisor: ${advisor?.name || "Unknown"})`,
            `<h2>New Referral Received</h2>
            <p><strong>Advisor:</strong> ${advisor?.name || "Unknown"}</p>
            <p><strong>Client:</strong> ${data.clientName}</p>
            <p><strong>Email:</strong> ${data.clientEmail}</p>
            <p><strong>Phone:</strong> ${data.clientPhone || "Not provided"}</p>
            <p><strong>Age:</strong> ${data.clientAge || "Not provided"}</p>
            <p><strong>Income:</strong> ${data.clientIncome || "Not provided"}</p>
            <p><strong>Industry:</strong> ${data.clientIndustry || "Not provided"}</p>
            <p><strong>Grade:</strong> ${result.grade} (${result.score}/100, ${result.temperature})</p>
            ${servicesText}
            ${referrerText}
            <p><strong>Preferred Contact:</strong> ${data.preferredContactTime || "Not specified"}</p>
            <hr/>
            <p style="color: #888; font-size: 12px;">This notification was sent via Advisory Connect.</p>`
          );
        } catch (emailErr) {
          console.error("Failed to send referral notification email:", emailErr);
        }
      }

      res.status(201).json({ message: "Referral received", grade: result.grade, score: result.score, temperature: result.temperature, email });
    } catch (error) {
      console.error("Referral error:", error);
      res.status(500).json({ message: "Failed to process referral" });
    }
  });

  app.post("/api/callback", leadFormLimiter, async (req, res) => {
    try {
      const schema = z.object({
        advisorId: z.number(),
        clientName: z.string().min(1),
        clientEmail: z.string().optional(),
        clientAge: z.number().optional(),
        clientIncome: z.string().optional(),
        clientIndustry: z.string().optional(),
        clientPhone: z.string().optional(),
        clientMarried: z.boolean().optional(),
        clientChildren: z.boolean().optional(),
        clientVehicle: z.boolean().optional(),
        clientProperty: z.boolean().optional(),
        preferredContactTime: z.string().optional(),
        servicesRequested: z.string().optional(),
        message: z.string().optional(),
        source: z.string().optional(),
        sourceProfileSlug: z.string().optional(),
        // Task #23 — callback gap fields. All optional; feed grader + registry.
        howFound: z.string().optional(),
        netWorthBracket: z.string().optional(),
        biggestConcern: z.string().optional(),
        hasAdvisor: z.boolean().optional(),
        existingAdvisorName: z.string().optional(),
        recaptchaToken: z.string().optional(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }

      const data = parsed.data;

      if (data.recaptchaToken) {
        const valid = await verifyRecaptcha(data.recaptchaToken);
        if (!valid) {
          return res.status(400).json({ message: "reCAPTCHA verification failed. Please try again." });
        }
      }
      const result = calculateLeadGrade({
        age: data.clientAge,
        income: data.clientIncome,
        married: data.clientMarried,
        children: data.clientChildren,
        vehicle: data.clientVehicle,
        property: data.clientProperty,
        servicesRequested: data.servicesRequested,
        type: "Call Back",
        netWorthBracket: data.netWorthBracket,
        biggestConcern: data.biggestConcern,
        hasAdvisor: data.hasAdvisor,
      });

      const email = await storage.createEmail({
        advisorId: data.advisorId,
        senderName: data.clientName,
        senderEmail: data.clientEmail || "",
        type: "Call Back",
        grade: result.grade,
        leadScore: result.score,
        leadTemperature: result.temperature,
        gradeBreakdown: JSON.stringify(result.breakdown),
        subject: `Call back request from ${data.source || "advisor app"}`,
        body: data.message || "",
        clientAge: data.clientAge,
        clientIncome: data.clientIncome,
        clientIndustry: data.clientIndustry,
        clientPhone: data.clientPhone,
        clientMarried: data.clientMarried,
        clientChildren: data.clientChildren,
        clientVehicle: data.clientVehicle,
        clientProperty: data.clientProperty,
        preferredContactTime: data.preferredContactTime,
        servicesRequested: data.servicesRequested,
        howFound: data.howFound,
        netWorthBracket: data.netWorthBracket,
        biggestConcern: data.biggestConcern,
        hasAdvisor: data.hasAdvisor,
        existingAdvisorName: data.existingAdvisorName,
        source: data.source,
        sourceProfileSlug: data.sourceProfileSlug,
      });

      // W1 T9: soft-warn duplicate detection.
      try {
        const dup = await storage.findDuplicateLead(data.advisorId, email.id, data.clientPhone, data.clientEmail);
        if (dup) await storage.markEmailDuplicate(email.id, dup.id);
      } catch (dupErr) { console.warn("[dup-detect] callback:", dupErr); }

      const advisor = await storage.getAdvisor(data.advisorId);
      if (isSendGridConfigured()) {
        try {
          const servicesText = data.servicesRequested ? `<p><strong>Services:</strong> ${data.servicesRequested}</p>` : "";
          await sendEmail(
            buildRecipients(advisor?.email),
            `New Call Back Request: ${data.clientName} (Advisor: ${advisor?.name || "Unknown"})`,
            `<h2>New Call Back Request</h2>
            <p><strong>Advisor:</strong> ${advisor?.name || "Unknown"}</p>
            <p><strong>Client:</strong> ${data.clientName}</p>
            <p><strong>Email:</strong> ${data.clientEmail}</p>
            <p><strong>Phone:</strong> ${data.clientPhone || "Not provided"}</p>
            <p><strong>Age:</strong> ${data.clientAge || "Not provided"}</p>
            <p><strong>Income:</strong> ${data.clientIncome || "Not provided"}</p>
            <p><strong>Industry:</strong> ${data.clientIndustry || "Not provided"}</p>
            <p><strong>Grade:</strong> ${result.grade} (${result.score}/100, ${result.temperature})</p>
            ${servicesText}
            <p><strong>Preferred Contact:</strong> ${data.preferredContactTime || "Not specified"}</p>
            <hr/>
            <p style="color: #888; font-size: 12px;">This notification was sent via Advisory Connect.</p>`
          );
        } catch (emailErr) {
          console.error("Failed to send callback notification email:", emailErr);
        }
      }

      res.status(201).json({ message: "Callback request received", grade: result.grade, score: result.score, temperature: result.temperature, email });
    } catch (error) {
      console.error("Callback error:", error);
      res.status(500).json({ message: "Failed to process callback" });
    }
  });

  app.post("/api/will-request", leadFormLimiter, async (req, res) => {
    try {
      const schema = z.object({
        advisorId: z.number(),
        fullName: z.string().min(1),
        idNumber: z.string().optional(),
        dateOfBirth: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        maritalStatus: z.string().optional(),
        spouseName: z.string().optional(),
        numberOfChildren: z.string().optional(),
        childrenDetails: z.string().optional(),
        address: z.string().optional(),
        source: z.string().optional(),
        sourceProfileSlug: z.string().optional(),
        // Task #23 — will-form gap fields.
        hasWill: z.boolean().optional(),
        estateValueBracket: z.string().optional(),
        incomeRange: z.string().optional(),
        age: z.number().optional(),
        recaptchaToken: z.string().optional(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }

      const data = parsed.data;

      if (data.recaptchaToken) {
        const valid = await verifyRecaptcha(data.recaptchaToken);
        if (!valid) {
          return res.status(400).json({ message: "reCAPTCHA verification failed. Please try again." });
        }
      }
      const details = [
        data.idNumber && `ID: ${data.idNumber}`,
        data.dateOfBirth && `DOB: ${data.dateOfBirth}`,
        data.maritalStatus && `Marital Status: ${data.maritalStatus}`,
        data.spouseName && `Spouse: ${data.spouseName}`,
        data.numberOfChildren && `Children: ${data.numberOfChildren}`,
        data.childrenDetails && `Children Details: ${data.childrenDetails}`,
        data.address && `Address: ${data.address}`,
      ].filter(Boolean).join(" | ");

      // Will requests rarely include income/age — let the grader handle missing fields.
      // Marital status and children inform the lifestyle component.
      const married = data.maritalStatus
        ? /married|spouse/i.test(data.maritalStatus)
        : null;
      const children = data.numberOfChildren
        ? !/^0$|^none$|^no$/i.test(data.numberOfChildren.trim())
        : null;
      const result = calculateLeadGrade({
        age: data.age,
        income: data.incomeRange,
        married,
        children,
        servicesRequested: "Estate Planning, Will",
        type: "Will Request",
        hasWill: data.hasWill,
        estateValueBracket: data.estateValueBracket,
      });

      const email = await storage.createEmail({
        advisorId: data.advisorId,
        senderName: data.fullName,
        senderEmail: data.email || "",
        type: "Will Request",
        grade: result.grade,
        leadScore: result.score,
        leadTemperature: result.temperature,
        gradeBreakdown: JSON.stringify(result.breakdown),
        subject: `Complimentary Will Request from ${data.fullName}`,
        body: details,
        clientAge: data.age,
        clientIncome: data.incomeRange,
        clientPhone: data.phone,
        clientMarried: married,
        clientChildren: children,
        hasWill: data.hasWill,
        estateValueBracket: data.estateValueBracket,
        source: data.source || "will-form",
        sourceProfileSlug: data.sourceProfileSlug,
      });

      // W1 T9: soft-warn duplicate detection. Will requests use phone + email.
      try {
        const dup = await storage.findDuplicateLead(data.advisorId, email.id, data.phone, data.email);
        if (dup) await storage.markEmailDuplicate(email.id, dup.id);
      } catch (dupErr) { console.warn("[dup-detect] will-request:", dupErr); }

      const advisor = await storage.getAdvisor(data.advisorId);
      if (isSendGridConfigured()) {
        try {
          await sendEmail(
            buildRecipients(advisor?.email),
            `New Will Request: ${data.fullName} (Advisor: ${advisor?.name || "Unknown"})`,
            `<h2>New Complimentary Will Request</h2>
            <p><strong>Advisor:</strong> ${advisor?.name || "Unknown"}</p>
            <p><strong>Full Name:</strong> ${data.fullName}</p>
            <p><strong>ID Number:</strong> ${data.idNumber || "Not provided"}</p>
            <p><strong>Date of Birth:</strong> ${data.dateOfBirth || "Not provided"}</p>
            <p><strong>Email:</strong> ${data.email || "Not provided"}</p>
            <p><strong>Phone:</strong> ${data.phone || "Not provided"}</p>
            <p><strong>Marital Status:</strong> ${data.maritalStatus || "Not provided"}</p>
            <p><strong>Spouse Name:</strong> ${data.spouseName || "N/A"}</p>
            <p><strong>Number of Children:</strong> ${data.numberOfChildren || "Not provided"}</p>
            <p><strong>Children Details:</strong> ${data.childrenDetails || "N/A"}</p>
            <p><strong>Address:</strong> ${data.address || "Not provided"}</p>
            <hr/>
            <p style="color: #888; font-size: 12px;">This notification was sent via Advisory Connect.</p>`
          );
        } catch (emailErr) {
          console.error("Failed to send will request notification email:", emailErr);
        }
      }

      res.status(201).json({ message: "Will request received", email });
    } catch (error) {
      console.error("Will request error:", error);
      res.status(500).json({ message: "Failed to process will request" });
    }
  });

  // Task #44 — public "Scan Documents" tool on the advisor profile.
  // A prospective client snaps a photo (or picks a file) of an ID / payslip /
  // proof-of-address and hits Send. The file is encrypted at rest under
  // uploads/scans/<advisorId>/ (when PII_ENCRYPTION_KEY is configured) and
  // forwarded as a SendGrid attachment to the advisor's inbox + master inbox.
  // Public (no session) → wrapped in leadFormLimiter and a tight per-file
  // size cap. Mime allow-list keeps it to images + PDF; no scripts, no archives.
  const scanDocUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024, files: 6 },
    fileFilter: (_req, file, cb) => {
      const allowed = [
        "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif",
        "application/pdf",
      ];
      cb(null, allowed.includes(file.mimetype));
    },
  });

  app.post("/api/scan-document/:slug", leadFormLimiter, scanDocUpload.array("files", 6), async (req, res) => {
    try {
      const slug = String(req.params.slug || "").trim();
      if (!slug) return res.status(400).json({ message: "slug required" });
      const advisor = await storage.getAdvisorBySlug(slug);
      if (!advisor || !advisor.active) return res.status(404).json({ message: "Advisor not found" });

      const files = (req.files as Express.Multer.File[] | undefined) || [];
      if (files.length === 0) return res.status(400).json({ message: "No files uploaded" });

      const senderName = String(req.body?.senderName || "").trim().slice(0, 120);
      const senderEmailRaw = String(req.body?.senderEmail || "").trim().slice(0, 160);
      const senderEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmailRaw) ? senderEmailRaw : "";
      const note = String(req.body?.note || "").trim().slice(0, 2000);

      const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

      // Encrypt at rest when the PII key is configured. We tolerate a missing
      // key here (some dev environments boot without it) so the email forward
      // still works — the audit row records which path was taken.
      const path = await import("path");
      const fsp = (await import("fs")).promises;
      const { encryptBuffer, isEncryptionConfigured } = await import("./encryption");
      const stored: { path: string; original: string; size: number }[] = [];
      if (isEncryptionConfigured()) {
        const dir = path.join(process.cwd(), "uploads", "scans", String(advisor.id));
        await fsp.mkdir(dir, { recursive: true });
        for (const f of files) {
          const enc = encryptBuffer(f.buffer);
          const filename = `${Date.now()}_${crypto.randomBytes(8).toString("hex")}.enc`;
          const fp = path.join(dir, filename);
          await fsp.writeFile(fp, enc, { mode: 0o600 });
          stored.push({ path: fp, original: f.originalname || "scan", size: f.size });
        }
      }

      // Audit trail (best-effort). Slug attribution lets admin trace abuse.
      storage.recordAuditPii({
        actorRole: "anon",
        actorAdvisorId: advisor.id,
        action: "write",
        tableName: "scan_uploads",
        rowId: 0,
        fieldName: `slug=${slug};files=${files.length};enc=${stored.length > 0 ? "y" : "n"};from=${senderEmail || senderName || "anon"}`,
        ipAddress: req.ip || null,
        userAgent: (req.headers["user-agent"] as string) || null,
      }).catch(() => {});

      // Delivery accounting. The task's done-criterion is "document arrives in
      // the advisor's inbox (email or in-panel inbox)" — so we treat a SendGrid
      // success OR a successful encrypted-at-rest write as delivery (the
      // encrypted copy is what the in-panel inbox view will read, follow-up
      // #46). If neither path succeeded we must NOT report success.
      let emailDelivered = false;
      let emailError: string | null = null;
      if (isSendGridConfigured() && advisor.email) {
        try {
          const attachments = files.map((f, i) => ({
            filename: f.originalname || `scan-${i + 1}`,
            content: f.buffer.toString("base64"),
            type: f.mimetype,
            disposition: "attachment",
          }));
          const fileList = files.map(f => `<li>${esc(f.originalname || "scan")} <span style="color:#6b7280;">(${(f.size / 1024).toFixed(0)} KB)</span></li>`).join("");
          const inner = `
            <h2 style="margin:0 0 12px;font-size:18px;color:#0a0e1a;">New document scan from your public profile</h2>
            <p style="margin:0 0 12px;font-size:14px;line-height:1.55;color:#374151;">
              ${senderName ? `<strong>${esc(senderName)}</strong>` : "An anonymous visitor"}${senderEmail ? ` &lt;${esc(senderEmail)}&gt;` : ""} sent ${files.length} document${files.length === 1 ? "" : "s"} via the Scan Documents tool on your Advisory Connect profile.
            </p>
            ${note ? `<div style="margin:0 0 12px;padding:10px 12px;background:#f3f4f6;border-radius:8px;font-size:13px;line-height:1.5;color:#374151;white-space:pre-wrap;"><strong style="display:block;margin-bottom:4px;color:#111827;">Note:</strong>${esc(note)}</div>` : ""}
            <ul style="margin:0 0 16px 18px;padding:0;font-size:13px;color:#374151;line-height:1.6;">${fileList}</ul>
            <p style="margin:0;font-size:12px;line-height:1.5;color:#6b7280;">
              Files are attached to this email${stored.length > 0 ? " and a copy is stored encrypted at rest on Advisory Connect" : ""}. Treat any personal information per POPIA.
            </p>`;
          await sendEmail(
            buildRecipients(advisor.email),
            `Scanned documents from ${senderName || "a profile visitor"} — ${advisor.name}`,
            inner,
            undefined,
            {
              previewText: `${files.length} document${files.length === 1 ? "" : "s"} from ${senderName || "a profile visitor"}`,
              attachments,
              replyTo: senderEmail || undefined,
            },
          );
          emailDelivered = true;
        } catch (emailErr: any) {
          emailError = emailErr?.message || String(emailErr);
          console.error("[scan-document] notification email failed:", emailErr);
        }
      } else {
        emailError = !isSendGridConfigured() ? "SendGrid not configured" : "Advisor has no email on file";
      }

      // Email is the only advisor-consumable channel today (the in-panel
      // inbox view is follow-up #46). If the send failed we must report
      // failure even when the encrypted copy is safely on disk — otherwise
      // the visitor sees "Sent" while the advisor sees nothing.
      if (!emailDelivered) {
        return res.status(502).json({
          message: "We couldn't deliver your documents to your advisor right now. Please try again in a few minutes or contact them directly.",
          emailError,
        });
      }

      res.status(201).json({
        message: "Documents delivered",
        count: files.length,
        emailDelivered: true,
        storedEncrypted: stored.length > 0,
      });
    } catch (err: any) {
      // multer rejects oversize / disallowed mime with `code` set.
      if (err && err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ message: "File too large. Max 8 MB per file." });
      }
      if (err && err.code === "LIMIT_FILE_COUNT") {
        return res.status(413).json({ message: "Too many files. Max 6 per submission." });
      }
      console.error("[scan-document] failed:", err);
      res.status(500).json({ message: "Failed to send documents" });
    }
  });

  app.post("/api/webhook/zoho", webhookLimiter, async (req, res) => {
    if (!verifyZohoWebhook(req)) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const body = req.body;

      const advisorEmail = body.to || body.recipient || "";
      const senderEmail = body.from || body.sender || "";
      const senderName = body.fromName || body.senderName || senderEmail.split("@")[0] || "Unknown";
      const subject = body.subject || "";
      const emailBody = body.content || body.textBody || body.htmlBody || body.text || "";

      const allAdvisors = await storage.getAdvisors();
      const targetAdvisor = allAdvisors.find((a) => {
        const toField = advisorEmail.toLowerCase();
        return toField.includes(a.email.toLowerCase()) || toField.includes(a.profileSlug);
      });

      if (!targetAdvisor) {
        console.log(`Zoho webhook: No matching advisor for ${advisorEmail}`);
        return res.status(200).json({ message: "No matching advisor found", received: true });
      }

      const isCallBack = subject.toLowerCase().includes("call back") ||
                          subject.toLowerCase().includes("callback") ||
                          emailBody.toLowerCase().includes("call back") ||
                          emailBody.toLowerCase().includes("request a call");
      const type = isCallBack ? "Call Back" : "Referral";

      // Inbound email — no client data, so grade reflects only the type signal
      const result = calculateLeadGrade({ type });

      await storage.createEmail({
        advisorId: targetAdvisor.id,
        senderName,
        senderEmail,
        type,
        grade: result.grade,
        leadScore: result.score,
        leadTemperature: result.temperature,
        gradeBreakdown: JSON.stringify(result.breakdown),
        subject,
        body: emailBody,
        source: "zoho",
      });

      console.log(`Zoho webhook: Processed ${type} from ${senderEmail} for ${targetAdvisor.name}`);
      res.status(200).json({ message: "Email processed", received: true });
    } catch (error) {
      console.error("Zoho webhook error:", error);
      res.status(500).json({ message: "Failed to process email" });
    }
  });

  app.post("/api/webhook/inbound-email", webhookLimiter, async (req, res) => {
    if (!verifySendGridWebhook(req)) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const { from, to, subject, text: body } = req.body;

      const senderEmail = from || "";
      const senderName = senderEmail.split("@")[0] || "Unknown";

      const allAdvisors = await storage.getAdvisors();
      const targetAdvisor = allAdvisors.find((a) => {
        const toField = (to || "").toLowerCase();
        return toField.includes(a.email.toLowerCase()) || toField.includes(a.profileSlug);
      });

      if (!targetAdvisor) {
        return res.status(200).json({ message: "No matching advisor found" });
      }

      const isCallBack = (subject || "").toLowerCase().includes("call back") ||
                          (body || "").toLowerCase().includes("call back") ||
                          (subject || "").toLowerCase().includes("callback");
      const type = isCallBack ? "Call Back" : "Referral";

      const result = calculateLeadGrade({ type });

      await storage.createEmail({
        advisorId: targetAdvisor.id,
        senderName,
        senderEmail,
        type,
        grade: result.grade,
        leadScore: result.score,
        leadTemperature: result.temperature,
        gradeBreakdown: JSON.stringify(result.breakdown),
        subject: subject || "",
        body: body || "",
        source: "sendgrid",
      });

      res.status(200).json({ message: "Email processed" });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ message: "Failed to process email" });
    }
  });

  app.post("/api/stats/access", statsAccessLimiter, async (req, res) => {
    const { advisorId, slug } = req.body;
    // S7: encode the viewed slug into eventType so the server can later split
    // Primary vs Secondary view counts WITHOUT a schema change. Sanitise the
    // slug to the same pattern profile slugs use; on anything weird we fall
    // back to the legacy untagged event.
    const safeSlug = typeof slug === "string" && /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug) ? slug : null;
    const eventType = safeSlug ? `app_access:${safeSlug}` : "app_access";
    await storage.recordStat({ advisorId: advisorId || null, eventType });
    res.json({ success: true });
  });

  app.get("/api/advisors/:slug/profile-stats", async (req, res) => {
    const advisor = await storage.getAdvisorBySlug(req.params.slug);
    if (!advisor) return res.status(404).json({ message: "Not found" });
    // S7: return both the legacy `totalViews` AND the new `primary`/`secondary`
    // split so existing callers keep working while new UI can show the breakdown.
    const profiles = await storage.getAdvisorProfiles(advisor.id);
    const secondarySlugs = profiles.map(p => p.profileSlug).filter(Boolean) as string[];
    const split = await storage.getAdvisorViewCountsSplit(advisor.id, advisor.profileSlug, secondarySlugs);
    res.json({ totalViews: split.total, primaryViews: split.primary, secondaryViews: split.secondary });
  });

  // S7: 7-day time-series of views split Primary vs Secondary, for the
  // Stats tab line chart. Owner-level auth: admin, the advisor's own panel
  // session (looked up via the advisor's PRIMARY slug, not the URL slug, so
  // requesting the chart from a secondary URL still works), or demo advisor.
  app.get("/api/advisors/:slug/views-series", async (req, res) => {
    const advisor = await storage.getAdvisorBySlug(req.params.slug);
    if (!advisor) return res.status(404).json({ message: "Not found" });
    if (!(await canAccessAdvisor(req, advisor.id))) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const profiles = await storage.getAdvisorProfiles(advisor.id);
    const secondarySlugs = profiles.map(p => p.profileSlug).filter(Boolean) as string[];
    const series = await storage.getAdvisorViewSeries(advisor.id, advisor.profileSlug, secondarySlugs, 7);
    res.json({ series });
  });

  // Check if account has been set up (used on page load to auto-route first-timers)
  app.get("/api/advisor-auth/:slug/status", async (req, res) => {
    const advisor = await storage.getAdvisorBySlug(req.params.slug);
    if (!advisor) return res.status(404).json({ message: "Advisor not found" });
    res.json({
      passwordSet: advisor.isDemo ? true : (advisor.advisorPasswordSet ?? false),
      emailVerified: advisor.isDemo ? true : (advisor.advisorEmailVerified ?? false),
      isDemo: !!advisor.isDemo,
    });
  });

  // Setup account (first time): store password hash + send verification OTP
  app.post("/api/advisor-auth/:slug/setup", otpSendLimiter, async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });
    if (password.length < 10) return res.status(400).json({ message: "Password must be at least 10 characters" });
    const advisor = await storage.getAdvisorBySlug(req.params.slug);
    if (!advisor) return res.status(404).json({ message: "Advisor not found" });
    if (!advisor.email || advisor.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(400).json({ message: "That email address is not registered for this account." });
    }
    if (advisor.advisorEmailVerified) {
      return res.status(400).json({ message: "Account already set up. Please sign in." });
    }
    const hash = await bcrypt.hash(password, 10);
    (req.session as any)[`setup_hash_${req.params.slug}`] = hash;
    const code = generateOtp();
    otpStore.set(req.params.slug, { code, expires: Date.now() + 10 * 60 * 1000 });
    try {
      await sendEmail(
        advisor.email,
        "Verify your Advisory Connect account",
        `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
          <h2 style="color:#4a8db5;margin-bottom:8px;">Verify Your Email</h2>
          <p style="color:#555;margin-bottom:8px;">Welcome to Advisory Connect, ${advisor.name}!</p>
          <p style="color:#555;margin-bottom:24px;">Enter the code below to verify your email address and activate your control panel. This is a one-time step — you won't need to do this again.</p>
          <div style="background:#f5f7fa;border-radius:12px;padding:24px;text-align:center;letter-spacing:8px;font-size:36px;font-weight:bold;color:#1a1a1a;">${code}</div>
          <p style="color:#999;font-size:12px;margin-top:24px;">Code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
        </div>`
      );
    } catch (err) {
      console.error("Verification email error:", err);
      return res.status(500).json({ message: "Failed to send verification email. Please try again." });
    }
    res.json({ success: true });
  });

  // Verify email OTP (one-time) — marks account as verified and starts session
  app.post("/api/advisor-auth/:slug/verify-otp", otpLimiter, async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Code required" });
    const entry = otpStore.get(req.params.slug);
    if (!entry) return res.status(400).json({ message: "No verification code found. Please go back and try again." });
    if (Date.now() > entry.expires) {
      otpStore.delete(req.params.slug);
      return res.status(400).json({ message: "Code expired. Please go back and request a new one." });
    }
    if (entry.code !== code.trim()) {
      return res.status(400).json({ message: "Incorrect code. Please try again." });
    }
    otpStore.delete(req.params.slug);
    const advisor = await storage.getAdvisorBySlug(req.params.slug);
    if (!advisor) return res.status(404).json({ message: "Advisor not found" });
    const pendingHash = (req.session as any)[`setup_hash_${req.params.slug}`];
    if (pendingHash) {
      await storage.updateAdvisor(advisor.id, { advisorPasswordHash: pendingHash, advisorPasswordSet: true, advisorEmailVerified: true });
      delete (req.session as any)[`setup_hash_${req.params.slug}`];
    } else if (advisor.advisorPasswordHash) {
      await storage.updateAdvisor(advisor.id, { advisorPasswordSet: true, advisorEmailVerified: true });
    } else {
      return res.status(400).json({ message: "Setup session expired. Please go back and start again." });
    }
    // Task #24 — set canonical session.advisorId so newly-verified advisors
    // can hit /api/emails* immediately without an extra login round-trip.
    (req.session as any).advisorId = advisor.id;
    (req.session as any)[`advisor_${req.params.slug}`] = true;
    res.json({ authenticated: true });
  });

  // Resend verification OTP (only for unverified accounts)
  app.post("/api/advisor-auth/:slug/resend-otp", otpSendLimiter, async (req, res) => {
    const advisor = await storage.getAdvisorBySlug(req.params.slug);
    if (!advisor) return res.status(404).json({ message: "Advisor not found" });
    if (advisor.advisorEmailVerified) return res.status(400).json({ message: "Account already verified." });
    const hasPendingHash = !!(req.session as any)[`setup_hash_${req.params.slug}`] || !!advisor.advisorPasswordHash;
    if (!hasPendingHash) return res.status(400).json({ message: "Please complete account setup first." });
    const code = generateOtp();
    otpStore.set(req.params.slug, { code, expires: Date.now() + 10 * 60 * 1000 });
    try {
      await sendEmail(
        advisor.email!,
        "Your Advisory Connect verification code",
        `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
          <h2 style="color:#4a8db5;margin-bottom:8px;">New Verification Code</h2>
          <p style="color:#555;margin-bottom:24px;">Here is your new verification code:</p>
          <div style="background:#f5f7fa;border-radius:12px;padding:24px;text-align:center;letter-spacing:8px;font-size:36px;font-weight:bold;color:#1a1a1a;">${code}</div>
          <p style="color:#999;font-size:12px;margin-top:24px;">Expires in 10 minutes.</p>
        </div>`
      );
    } catch { return res.status(500).json({ message: "Failed to resend code." }); }
    res.json({ success: true });
  });

  // Request password change — verify current password, send OTP, stash pending hash
  app.post("/api/advisor-auth/:slug/request-password-change", async (req, res) => {
    if (!(req.session as any)?.[`advisor_${req.params.slug}`]) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "Both current and new password required" });
    if (newPassword.length < 10) return res.status(400).json({ message: "New password must be at least 10 characters" });
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return res.status(400).json({ message: "Password must contain upper-case, lower-case and a number" });
    }
    const advisor = await storage.getAdvisorBySlug(req.params.slug);
    if (!advisor || !advisor.advisorPasswordHash) return res.status(404).json({ message: "Advisor not found" });
    const valid = await bcrypt.compare(currentPassword, advisor.advisorPasswordHash);
    if (!valid) return res.status(401).json({ message: "Current password is incorrect" });
    const newHash = await bcrypt.hash(newPassword, 10);
    const code = generateOtp();
    otpStore.set(`pwchange_${req.params.slug}`, { code, expires: Date.now() + 10 * 60 * 1000 });
    (req.session as any)[`pwchange_${req.params.slug}`] = newHash;
    try {
      await sendEmail(
        advisor.email!,
        "Confirm your password change",
        `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
          <h2 style="color:#4a8db5;margin-bottom:8px;">Confirm Password Change</h2>
          <p style="color:#555;margin-bottom:8px;">Hi ${advisor.name},</p>
          <p style="color:#555;margin-bottom:24px;">Use the code below to confirm the change to your control panel password:</p>
          <div style="background:#f5f7fa;border-radius:12px;padding:24px;text-align:center;letter-spacing:8px;font-size:36px;font-weight:bold;color:#1a1a1a;">${code}</div>
          <p style="color:#999;font-size:12px;margin-top:24px;">Code expires in 10 minutes. If you didn't request this, sign in and change your password immediately.</p>
        </div>`
      );
    } catch (err) {
      console.error("Password change email error:", err);
      return res.status(500).json({ message: "Failed to send confirmation email." });
    }
    res.json({ success: true });
  });

  // Confirm password change — apply OTP + pending hash
  app.post("/api/advisor-auth/:slug/confirm-password-change", async (req, res) => {
    if (!(req.session as any)?.[`advisor_${req.params.slug}`]) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Code required" });
    const entry = otpStore.get(`pwchange_${req.params.slug}`);
    const pendingHash = (req.session as any)[`pwchange_${req.params.slug}`];
    if (!entry || !pendingHash) return res.status(400).json({ message: "No pending password change. Please start again." });
    if (Date.now() > entry.expires) {
      otpStore.delete(`pwchange_${req.params.slug}`);
      delete (req.session as any)[`pwchange_${req.params.slug}`];
      return res.status(400).json({ message: "Code expired. Please start again." });
    }
    if (entry.code !== code.trim()) return res.status(400).json({ message: "Incorrect code." });
    const advisor = await storage.getAdvisorBySlug(req.params.slug);
    if (!advisor) return res.status(404).json({ message: "Advisor not found" });
    await storage.updateAdvisor(advisor.id, { advisorPasswordHash: pendingHash });
    otpStore.delete(`pwchange_${req.params.slug}`);
    delete (req.session as any)[`pwchange_${req.params.slug}`];
    res.json({ success: true });
  });

  // Standard login: email + password
  app.post("/api/advisor-auth/:slug/login", advisorLoginLimiter, async (req, res) => {
    const { email, password } = req.body;
    // Task #24 — capture IP + UA for audit regardless of outcome.
    const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || null;
    const userAgent = req.headers["user-agent"]?.slice(0, 500) || null;
    const audit = (outcome: string, advisorId: number | null) => storage.recordLoginAudit({
      role: "advisor",
      advisorId,
      emailAttempted: typeof email === "string" ? email.slice(0, 200) : null,
      slug: req.params.slug,
      outcome,
      ipAddress,
      userAgent,
    });
    if (!email || !password) {
      audit("missing_credentials", null);
      return res.status(400).json({ message: "Email and password required" });
    }
    const advisor = await storage.getAdvisorBySlug(req.params.slug);
    if (!advisor) {
      audit("invalid_email", null);
      return res.status(404).json({ message: "Advisor not found" });
    }
    if (!advisor.email || advisor.email.toLowerCase() !== email.toLowerCase()) {
      audit("invalid_email", advisor.id);
      return res.status(401).json({ message: "Incorrect email or password." });
    }
    if (!advisor.advisorPasswordHash) {
      audit("not_setup", advisor.id);
      return res.status(401).json({ message: "Account not set up yet.", needsSetup: true });
    }
    const valid = await bcrypt.compare(password, advisor.advisorPasswordHash);
    if (!valid) {
      audit("invalid_password", advisor.id);
      return res.status(401).json({ message: "Incorrect email or password." });
    }
    if (!advisor.advisorEmailVerified) {
      audit("unverified", advisor.id);
      return res.status(401).json({ message: "Email not verified. Please complete the verification step.", needsVerification: true });
    }
    audit("success", advisor.id);
    // Task #24 — set the canonical session.advisorId alongside the legacy
    // slug-keyed flag so both the new middleware and existing handlers work.
    (req.session as any).advisorId = advisor.id;
    (req.session as any)[`advisor_${req.params.slug}`] = true;
    res.json({ authenticated: true });
  });

  app.post("/api/advisor-auth/:slug/logout", async (req, res) => {
    (req.session as any)[`advisor_${req.params.slug}`] = false;
    if ((req.session as any).advisorId) delete (req.session as any).advisorId;
    res.json({ authenticated: false });
  });

  // Task #24 — canonical advisor auth surface (slug-less, identifies advisor
  // by email). Thin alias around the slug-scoped flow above so docs/tooling
  // can use a stable URL while legacy callers continue to work.
  app.post("/api/advisor/login", advisorLoginLimiter, async (req, res) => {
    const { email, password } = req.body;
    const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || null;
    const userAgent = req.headers["user-agent"]?.slice(0, 500) || null;
    const audit = (outcome: string, advisorId: number | null, slug: string | null) => storage.recordLoginAudit({
      role: "advisor",
      advisorId,
      emailAttempted: typeof email === "string" ? email.slice(0, 200) : null,
      slug,
      outcome,
      ipAddress,
      userAgent,
    });
    if (!email || !password) {
      audit("missing_credentials", null, null);
      return res.status(400).json({ message: "Email and password required" });
    }
    const all = await storage.getAdvisors();
    const advisor = all.find(a => a.email?.toLowerCase() === String(email).toLowerCase());
    if (!advisor) {
      audit("invalid_email", null, null);
      return res.status(401).json({ message: "Incorrect email or password." });
    }
    if (!advisor.advisorPasswordHash) {
      audit("not_setup", advisor.id, advisor.profileSlug);
      return res.status(401).json({ message: "Account not set up yet.", needsSetup: true });
    }
    const valid = await bcrypt.compare(password, advisor.advisorPasswordHash);
    if (!valid) {
      audit("invalid_password", advisor.id, advisor.profileSlug);
      return res.status(401).json({ message: "Incorrect email or password." });
    }
    if (!advisor.advisorEmailVerified) {
      audit("unverified", advisor.id, advisor.profileSlug);
      return res.status(401).json({ message: "Email not verified.", needsVerification: true });
    }
    audit("success", advisor.id, advisor.profileSlug);
    (req.session as any).advisorId = advisor.id;
    (req.session as any)[`advisor_${advisor.profileSlug}`] = true;
    res.json({ authenticated: true, slug: advisor.profileSlug });
  });

  app.get("/api/advisor/session", async (req, res) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    const advisorId = (req.session as any)?.advisorId;
    if (typeof advisorId !== "number") return res.json({ authenticated: false });
    const advisor = await storage.getAdvisor(advisorId);
    if (!advisor) return res.json({ authenticated: false });
    res.json({ authenticated: true, advisorId, slug: advisor.profileSlug });
  });

  app.post("/api/advisor/logout", async (req, res) => {
    const session = req.session as any;
    const advisorId = session?.advisorId;
    if (advisorId) {
      const advisor = await storage.getAdvisor(advisorId);
      if (advisor?.profileSlug) session[`advisor_${advisor.profileSlug}`] = false;
      delete session.advisorId;
    }
    res.json({ authenticated: false });
  });

  app.get("/api/advisor-auth/:slug/session", async (req, res) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    const advisor = await storage.getAdvisorBySlug(req.params.slug);
    if (advisor?.isDemo) {
      // Auto-establish a demo session so subsequent /api/emails etc requests
      // carry real session evidence and pass canAccessAdvisor — no more
      // unconditional isDemo bypass at the helper level.
      (req.session as any)[`advisor_${req.params.slug}`] = true;
      (req.session as any).advisorId = advisor.id;
      return res.json({ authenticated: true, isDemo: true });
    }
    const authenticated = !!(req.session as any)?.[`advisor_${req.params.slug}`];
    res.json({ authenticated });
  });

  app.get("/api/advisors/:slug/emails", async (req, res) => {
    const slug = req.params.slug;
    const advisor = await storage.getAdvisorBySlug(slug);
    if (!advisor) return res.status(404).json({ message: "Advisor not found" });
    if (!(await canAccessAdvisor(req, advisor.id))) return res.status(401).json({ message: "Unauthorized" });
    const allEmails = await storage.getEmailsByAdvisor(advisor.id);
    res.json(allEmails);
  });

  app.get("/api/advisors/:slug/stats", async (req, res) => {
    const slug = req.params.slug;
    const advisor = await storage.getAdvisorBySlug(slug);
    if (!advisor) return res.status(404).json({ message: "Advisor not found" });
    if (!(await canAccessAdvisor(req, advisor.id))) return res.status(401).json({ message: "Unauthorized" });
    const advisorStats = await storage.getAdvisorStats(advisor.id);

    // Enrich profile attribution with friendly labels.
    // Primary slug uses advisor.name; secondary slugs use the profile nickname (or the slug itself).
    // Legacy leads with a NULL/empty source slug are folded into the primary bucket.
    const profiles = await storage.getAdvisorProfiles(advisor.id);
    const labelBySlug: Record<string, string> = {};
    if (advisor.profileSlug) labelBySlug[advisor.profileSlug] = `${advisor.name} (Primary)`;
    for (const p of profiles) {
      if (p.profileSlug) labelBySlug[p.profileSlug] = p.nickname?.trim() || p.profileSlug;
    }
    const merged: Record<string, { slug: string; label: string; count: number }> = {};
    for (const row of advisorStats.profileBreakdown) {
      // Fold legacy nulls into the primary slug bucket.
      const key = row.slug || advisor.profileSlug || "";
      if (!merged[key]) {
        merged[key] = { slug: key, label: labelBySlug[key] || key || "Unknown", count: 0 };
      }
      merged[key].count += row.count;
    }
    // Ensure primary always appears (even with 0 leads) so attribution is meaningful at-a-glance.
    if (advisor.profileSlug && !merged[advisor.profileSlug]) {
      merged[advisor.profileSlug] = { slug: advisor.profileSlug, label: labelBySlug[advisor.profileSlug], count: 0 };
    }
    const profileBreakdown = Object.values(merged).sort((a, b) => b.count - a.count);

    const totalViews = await storage.getAdvisorViewCount(advisor.id);
    res.json({ ...advisorStats, profileBreakdown, totalViews });
  });

  // Parse a single RSS feed XML string into normalized items, including a thumbnail image if found
  const parseRssFeed = (xml: string, source: string): Array<{ title: string; link: string; description: string; pubDate: string; category: string; image: string | null; source: string }> => {
    const items: Array<{ title: string; link: string; description: string; pubDate: string; category: string; image: string | null; source: string }> = [];
    const itemRegex = /<item[\s>][\s\S]*?<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const item = match[0];
      const title = (item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || item.match(/<title>([\s\S]*?)<\/title>/))?.[1]?.trim() || "";
      const link = (item.match(/<link>(https?:\/\/[^\s<]*)<\/link>/) || item.match(/<link[^>]*href=["'](https?:\/\/[^"']+)["']/))?.[1]?.trim() || "";
      const contentEncoded = (item.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/) || item.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/))?.[1] || "";
      const descRaw = (item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || item.match(/<description>([\s\S]*?)<\/description>/))?.[1] || "";
      const desc = descRaw.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 220);
      const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || "";
      const cat = (item.match(/<category><!\[CDATA\[([\s\S]*?)\]\]><\/category>/) || item.match(/<category>([\s\S]*?)<\/category>/))?.[1]?.trim() || "";

      // Extract a thumbnail: try multiple RSS image conventions
      let image: string | null = null;
      const mediaThumb = item.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/);
      const mediaContent = item.match(/<media:content[^>]*url=["']([^"']+)["'][^>]*(?:medium=["']image["']|type=["']image\/)/);
      const enclosure = item.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image\//);
      const imgInContent = (contentEncoded || descRaw).match(/<img[^>]*src=["']([^"']+)["']/i);
      if (mediaThumb) image = mediaThumb[1];
      else if (mediaContent) image = mediaContent[1];
      else if (enclosure) image = enclosure[1];
      else if (imgInContent) image = imgInContent[1];

      if (title && link) items.push({ title, link, description: desc, pubDate, category: cat, image, source });
    }
    return items;
  };

  // Single-feed fetch helper with timeout + error tolerance.
  // Uses a real browser UA — many CDNs (Cloudflare, Akamai) 403 generic UAs.
  const BROWSER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";
  const fetchFeedSafe = async (url: string, source: string) => {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": BROWSER_UA, "Accept": "application/rss+xml, application/xml, text/xml, */*" },
        signal: AbortSignal.timeout(8000),
        redirect: "follow",
      });
      if (!response.ok) return [];
      const xml = await response.text();
      return parseRssFeed(xml, source);
    } catch {
      return [];
    }
  };

  // Dynamic PWA manifest (S4). The static /manifest.json has start_url="/" and
  // scope="/", so on Android any "Add to Home Screen" — whether from the advisor
  // panel or a client viewing a public card — pins an icon that opens the master
  // landing page instead of the page they were on. iOS uses the current page URL
  // as start_url so it usually works there, but the title still defaults to
  // "Advisory Connect" for everyone. This endpoint returns a per-context manifest
  // so the icon and title both reflect what the user actually pinned.
  app.get("/api/manifest", (req, res) => {
    const startQ = String(req.query.start || "/");
    const nameQ = String(req.query.name || "Advisory Connect").slice(0, 100);
    const shortQ = String(req.query.short || nameQ).slice(0, 24);
    // Only accept same-origin pathnames so we can't be turned into a PWA pointer
    // at an arbitrary external URL.
    const start = /^\/[a-zA-Z0-9/_\-?=&]*$/.test(startQ) ? startQ : "/";
    res.setHeader("Content-Type", "application/manifest+json");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json({
      name: nameQ,
      short_name: shortQ,
      description: "Advisory Connect",
      start_url: start,
      scope: "/",
      display: "standalone",
      orientation: "portrait",
      background_color: "#0a0e1a",
      theme_color: "#0a0e1a",
      lang: "en-ZA",
      dir: "ltr",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        { src: "/icon-maskable-1024.png", sizes: "1024x1024", type: "image/png", purpose: "maskable" },
      ],
    });
  });

  // Live FX rates (W2.1). Proxies api.frankfurter.app — no key, free, reliable.
  // Returns ZAR per 1 USD/EUR/GBP plus a 24hr change % per currency so the widget
  // can colour-code the Rand's daily move (S1 — Red = Rand weakened, Green = Rand
  // strengthened). 60s in-memory cache so the upstream isn't hammered.
  let forexCache: { ts: number; payload: any } | null = null;
  const FOREX_TTL_MS = 60_000;
  app.get("/api/forex/rates", async (_req, res) => {
    try {
      const now = Date.now();
      if (forexCache && (now - forexCache.ts) < FOREX_TTL_MS) {
        return res.json(forexCache.payload);
      }
      const r = await fetch("https://api.frankfurter.app/latest?base=ZAR&symbols=USD,EUR,GBP");
      if (!r.ok) throw new Error(`upstream ${r.status}`);
      const data = await r.json() as { date?: string; rates?: { USD?: number; EUR?: number; GBP?: number } };

      // Pull yesterday's rates so we can compute a 24hr Rand-move %. Frankfurter
      // returns the most-recent-business-day rate when the requested date falls
      // on a weekend/holiday, so this handles Mondays gracefully too. If the
      // call fails for any reason we still ship today's rates with change=null.
      let prevData: { date?: string; rates?: { USD?: number; EUR?: number; GBP?: number } } | null = null;
      try {
        const todayIso = data.date || new Date().toISOString().slice(0, 10);
        const d = new Date(todayIso + "T00:00:00Z");
        d.setUTCDate(d.getUTCDate() - 1);
        const yesterdayIso = d.toISOString().slice(0, 10);
        const r2 = await fetch(`https://api.frankfurter.app/${yesterdayIso}?base=ZAR&symbols=USD,EUR,GBP`);
        if (r2.ok) prevData = await r2.json();
      } catch {
        // Non-fatal — change comparison just becomes null below.
      }

      // We display ZAR per 1 unit foreign — invert Frankfurter's base=ZAR figure.
      const inv = (v?: number) => (v && v > 0 ? 1 / v : null);
      const round2 = (v: number | null) => (v == null ? null : +v.toFixed(2));
      const todayInv = {
        USD: inv(data.rates?.USD),
        EUR: inv(data.rates?.EUR),
        GBP: inv(data.rates?.GBP),
      };
      const prevInv = prevData ? {
        USD: inv(prevData.rates?.USD),
        EUR: inv(prevData.rates?.EUR),
        GBP: inv(prevData.rates?.GBP),
      } : { USD: null, EUR: null, GBP: null };

      // % change of "ZAR per unit foreign". Positive = more Rand needed today =
      // Rand weakened (red on the client). Negative = Rand strengthened (green).
      const pct = (today: number | null, prev: number | null) =>
        today != null && prev != null && prev !== 0
          ? +(((today - prev) / prev) * 100).toFixed(2)
          : null;

      const payload = {
        date: data.date ?? null,
        previousDate: prevData?.date ?? null,
        base: "ZAR",
        rates: {
          USD: round2(todayInv.USD),
          EUR: round2(todayInv.EUR),
          GBP: round2(todayInv.GBP),
        },
        change: {
          USD: pct(todayInv.USD, prevInv.USD),
          EUR: pct(todayInv.EUR, prevInv.EUR),
          GBP: pct(todayInv.GBP, prevInv.GBP),
        },
      };
      forexCache = { ts: now, payload };
      res.json(payload);
    } catch {
      // If upstream fails but cache exists, serve stale rather than nothing.
      if (forexCache) return res.json({ ...forexCache.payload, stale: true });
      res.status(502).json({
        message: "forex unavailable",
        rates: { USD: null, EUR: null, GBP: null },
        change: { USD: null, EUR: null, GBP: null },
      });
    }
  });

  // Backward-compatible single-source MoneyWeb endpoint
  app.get("/api/moneyweb/feed", async (req, res) => {
    try {
      const category = (req.query.category as string) || "all";
      const feedUrls: Record<string, string> = {
        all: "https://www.moneyweb.co.za/feed/",
        news: "https://www.moneyweb.co.za/category/news/feed/",
        markets: "https://www.moneyweb.co.za/category/markets/feed/",
        investing: "https://www.moneyweb.co.za/category/investing/feed/",
        "personal-finance": "https://www.moneyweb.co.za/category/personal-finance/feed/",
      };
      const url = feedUrls[category] || feedUrls.all;
      const items = await fetchFeedSafe(url, "MoneyWeb");
      res.json({ items: items.slice(0, 12) });
    } catch {
      res.status(500).json({ message: "Failed to fetch feed", items: [] });
    }
  });

  // Aggregated multi-source SA finance news feed
  // Pulls from MoneyWeb, BizNews, Daily Investor, Fin24 in parallel.
  // One slow/failing source never blocks the others.
  app.get("/api/news/feed", async (req, res) => {
    try {
      const category = (req.query.category as string) || "all";
      // Per-category sources. "all" stays as the curated multi-source mix; specific
      // categories fall back to the relevant MoneyWeb subcategory feed so each
      // NewsHero instance shows distinct content.
      const SOURCES_BY_CAT: Record<string, Array<{ name: string; url: string }>> = {
        all: [
          { name: "MoneyWeb",     url: "https://www.moneyweb.co.za/feed/" },
          { name: "BBC Business", url: "https://feeds.bbci.co.uk/news/business/rss.xml" },
          { name: "Investing",    url: "https://www.investing.com/rss/news_25.rss" },
        ],
        news:               [{ name: "MoneyWeb News",     url: "https://www.moneyweb.co.za/category/news/feed/" }],
        markets:            [{ name: "MoneyWeb Markets",  url: "https://www.moneyweb.co.za/category/markets/feed/" }],
        investing:          [{ name: "MoneyWeb Investing", url: "https://www.moneyweb.co.za/category/investing/feed/" }],
        "personal-finance": [{ name: "MoneyWeb Personal Finance", url: "https://www.moneyweb.co.za/category/personal-finance/feed/" }],
        // Secondary feed mix (W2.2). Distinct from "all" so the second news card
        // on a profile shows different content. Most SA-domestic feeds (BusinessTech,
        // Daily Investor, Fin24) are bot-blocked by Cloudflare/Akamai so we lean on
        // Africa-focused + global finance sources that reliably serve their RSS.
        secondary: [
          { name: "BBC Africa",   url: "https://feeds.bbci.co.uk/news/world/africa/rss.xml" },
          { name: "MarketWatch",  url: "https://feeds.content.dowjones.io/public/rss/mw_topstories" },
          { name: "Investing FX", url: "https://www.investing.com/rss/news_1.rss" },
        ],
      };
      const sources = SOURCES_BY_CAT[category] || SOURCES_BY_CAT.all;
      const results = await Promise.all(
        sources.map(s => fetchFeedSafe(s.url, s.name))
      );
      const merged = results.flat();
      // Sort newest first by pubDate (fallback: keep original order)
      merged.sort((a, b) => {
        const ta = Date.parse(a.pubDate) || 0;
        const tb = Date.parse(b.pubDate) || 0;
        return tb - ta;
      });
      // Return up to the most recent 24 across all sources, but interleave a bit
      // so we don't get 12 from MoneyWeb followed by 12 from BizNews when their
      // pubDates are close.
      res.json({ items: merged.slice(0, 24) });
    } catch {
      res.status(500).json({ message: "Failed to fetch feed", items: [] });
    }
  });

  // ──────────────────────────────────────────────────────────────────────
  // Task #25 — Client / PII / Audit endpoints.
  // Per-advisor isolation: every handler resolves the effective advisorId
  // from the session (admin must supply ?advisorId=, advisor sessions use
  // their own). Storage methods then enforce `WHERE advisor_id = ?` at the
  // SQL layer — even if a route is missed in code review, an advisor cannot
  // read another advisor's clients.
  const { encryptBuffer, decryptBuffer, isEncryptionConfigured } = await import("./encryption");
  const path = await import("path");
  const fs = await import("fs");
  const fsp = fs.promises;
  const CLIENTS_UPLOAD_ROOT = path.join(process.cwd(), "uploads", "clients");
  await fsp.mkdir(CLIENTS_UPLOAD_ROOT, { recursive: true });
  const docUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  function sessionRole(req: import("express").Request): "admin" | "advisor" | null {
    const s = req.session as any;
    if (s?.authenticated) return "admin";
    if (typeof s?.advisorId === "number") return "advisor";
    return null;
  }

  // Resolve effective advisorId scope for a client request.
  // - Admin sessions may pass ?advisorId= (or body.advisorId) to scope.
  // - Advisor sessions are pinned to their own advisorId; ignore overrides.
  function effectiveAdvisorId(req: import("express").Request): number | null {
    const role = sessionRole(req);
    if (!role) return null;
    if (role === "advisor") return (req.session as any).advisorId as number;
    const raw = (req.query.advisorId ?? req.body?.advisorId);
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function auditCtx(req: import("express").Request) {
    return {
      actorRole: sessionRole(req) || "anon",
      actorAdvisorId: (req.session as any)?.advisorId ?? null,
      ipAddress: req.ip || null,
      userAgent: (req.headers["user-agent"] as string) || null,
    };
  }

  // List clients for the calling advisor (admin must scope with ?advisorId=).
  app.get("/api/clients", async (req, res) => {
    const advisorId = effectiveAdvisorId(req);
    if (!advisorId) return res.status(400).json({ message: "advisorId required" });
    if (!(await canAccessAdvisor(req, advisorId))) return res.status(401).json({ message: "Unauthorized" });
    let rows;
    try {
      rows = await storage.listClients(advisorId);
    } catch (err: any) {
      // DecryptError = bad/rotated key. Surface as 500 rather than blanking PII.
      console.error("[clients] list decrypt failed:", err?.message);
      return res.status(500).json({ message: "Failed to read client data (decrypt error)" });
    }
    // audit_pii: record the read at the list level (one row per call, not per record)
    storage.recordAuditPii({ ...auditCtx(req), action: "read", tableName: "clients", rowId: 0, fieldName: "list" });
    res.json(rows);
  });

  app.get("/api/clients/:id", async (req, res) => {
    const advisorId = effectiveAdvisorId(req);
    if (!advisorId) return res.status(400).json({ message: "advisorId required" });
    if (!(await canAccessAdvisor(req, advisorId))) return res.status(401).json({ message: "Unauthorized" });
    const id = Number(req.params.id);
    let row;
    try {
      row = await storage.getClient(advisorId, id);
    } catch (err: any) {
      console.error("[clients] get decrypt failed:", err?.message);
      return res.status(500).json({ message: "Failed to read client data (decrypt error)" });
    }
    if (!row) return res.status(404).json({ message: "Not found" });
    storage.recordAuditPii({ ...auditCtx(req), action: "read", tableName: "clients", rowId: id, fieldName: "row" });
    res.json(row);
  });

  app.post("/api/clients", async (req, res) => {
    if (!isEncryptionConfigured()) {
      return res.status(503).json({ message: "PII encryption key not configured. See server logs." });
    }
    const advisorId = effectiveAdvisorId(req);
    if (!advisorId) return res.status(400).json({ message: "advisorId required" });
    if (!(await canAccessAdvisor(req, advisorId))) return res.status(401).json({ message: "Unauthorized" });
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email().nullable().optional(),
      phone: z.string().nullable().optional(),
      notes: z.string().nullable().optional(),
      sourceLeadId: z.number().nullable().optional(),
      idNumber: z.string().nullable().optional(),
      bankAccount: z.string().nullable().optional(),
      bankBranch: z.string().nullable().optional(),
      taxNumber: z.string().nullable().optional(),
      consentText: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const data = parsed.data;
    const created = await storage.createClient(advisorId, data as any);
    storage.recordAuditPii({ ...auditCtx(req), action: "write", tableName: "clients", rowId: created.id, fieldName: "create" });
    if (data.consentText) {
      await storage.recordConsent({
        clientId: created.id, advisorId,
        consentText: data.consentText,
        ipAddress: req.ip || null,
        userAgent: (req.headers["user-agent"] as string) || null,
      });
    }
    res.status(201).json(created);
  });

  app.patch("/api/clients/:id", async (req, res) => {
    if (!isEncryptionConfigured()) {
      return res.status(503).json({ message: "PII encryption key not configured. See server logs." });
    }
    const advisorId = effectiveAdvisorId(req);
    if (!advisorId) return res.status(400).json({ message: "advisorId required" });
    if (!(await canAccessAdvisor(req, advisorId))) return res.status(401).json({ message: "Unauthorized" });
    const id = Number(req.params.id);
    const updated = await storage.updateClient(advisorId, id, req.body || {});
    if (!updated) return res.status(404).json({ message: "Not found" });
    storage.recordAuditPii({ ...auditCtx(req), action: "write", tableName: "clients", rowId: id, fieldName: "update" });
    res.json(updated);
  });

  // Right-to-erasure (POPIA s.24). Admin-only. Wipes encrypted columns,
  // deletes encrypted document files on disk, marks the row as erased.
  // The audit trail in audit_pii is intentionally retained — POPIA Reg 4
  // permits keeping anonymised processing records.
  app.post("/api/clients/:id/erase", async (req, res) => {
    if (sessionRole(req) !== "admin") return res.status(401).json({ message: "Admin only" });
    const id = Number(req.params.id);
    const targetAdvisorId = Number(req.query.advisorId || req.body?.advisorId);
    if (!Number.isFinite(targetAdvisorId)) return res.status(400).json({ message: "advisorId required" });
    // Wipe document files first so a half-erased state doesn't leave files behind.
    // We tolerate ENOENT (file already gone) but FAIL the erase on any other
    // unlink error so the operator notices instead of getting a false success.
    const docs = await storage.listClientDocuments(targetAdvisorId, id);
    const unlinkFailures: string[] = [];
    for (const d of docs) {
      try { await fsp.unlink(d.encryptedPath); }
      catch (err: any) {
        if (err?.code !== "ENOENT") { unlinkFailures.push(`doc#${d.id}: ${err?.code || err?.message}`); continue; }
      }
      await storage.markDocumentErased(targetAdvisorId, d.id);
    }
    if (unlinkFailures.length > 0) {
      storage.recordAuditPii({ ...auditCtx(req), action: "erase_partial", tableName: "clients", rowId: id, fieldName: unlinkFailures.join(",") });
      return res.status(500).json({ message: "Partial erase — file unlink failed", failures: unlinkFailures });
    }
    const ok = await storage.eraseClient(targetAdvisorId, id, "admin");
    if (!ok) return res.status(404).json({ message: "Not found or already erased" });
    storage.recordAuditPii({ ...auditCtx(req), action: "erase", tableName: "clients", rowId: id, fieldName: "right-to-erasure" });
    res.json({ message: "Erased", id });
  });

  // Encrypted document upload. Bytes encrypted in memory before touching
  // disk; no plaintext file is ever written. Storage path is namespaced by
  // advisorId so a directory listing leak still doesn't cross advisors.
  app.post("/api/clients/:id/documents", docUpload.single("file"), async (req, res) => {
    if (!isEncryptionConfigured()) return res.status(503).json({ message: "PII encryption key not configured." });
    const advisorId = effectiveAdvisorId(req);
    if (!advisorId) return res.status(400).json({ message: "advisorId required" });
    if (!(await canAccessAdvisor(req, advisorId))) return res.status(401).json({ message: "Unauthorized" });
    const clientId = Number(req.params.id);
    const client = await storage.getClient(advisorId, clientId);
    if (!client) return res.status(404).json({ message: "Client not found" });
    if (!req.file) return res.status(400).json({ message: "file required" });
    const advisorDir = path.join(CLIENTS_UPLOAD_ROOT, String(advisorId));
    await fsp.mkdir(advisorDir, { recursive: true });
    const filename = `${Date.now()}_${crypto.randomBytes(8).toString("hex")}.enc`;
    const encPath = path.join(advisorDir, filename);
    const encrypted = encryptBuffer(req.file.buffer);
    await fsp.writeFile(encPath, encrypted, { mode: 0o600 });
    const doc = await storage.createClientDocument({
      clientId, advisorId,
      originalFilename: req.file.originalname,
      mimeType: req.file.mimetype,
      encryptedPath: encPath,
      sizeBytes: req.file.size,
    });
    storage.recordAuditPii({ ...auditCtx(req), action: "write", tableName: "client_documents", rowId: doc.id, fieldName: "upload" });
    res.status(201).json({ id: doc.id, originalFilename: doc.originalFilename, sizeBytes: doc.sizeBytes });
  });

  app.get("/api/clients/:clientId/documents", async (req, res) => {
    const advisorId = effectiveAdvisorId(req);
    if (!advisorId) return res.status(400).json({ message: "advisorId required" });
    if (!(await canAccessAdvisor(req, advisorId))) return res.status(401).json({ message: "Unauthorized" });
    const rows = await storage.listClientDocuments(advisorId, Number(req.params.clientId));
    res.json(rows.map(r => ({ id: r.id, originalFilename: r.originalFilename, mimeType: r.mimeType, sizeBytes: r.sizeBytes, createdAt: r.createdAt })));
  });

  app.get("/api/clients/documents/:id/download", async (req, res) => {
    if (!isEncryptionConfigured()) return res.status(503).json({ message: "PII encryption key not configured." });
    const advisorId = effectiveAdvisorId(req);
    if (!advisorId) return res.status(400).json({ message: "advisorId required" });
    if (!(await canAccessAdvisor(req, advisorId))) return res.status(401).json({ message: "Unauthorized" });
    const id = Number(req.params.id);
    const doc = await storage.getClientDocument(advisorId, id);
    if (!doc || doc.erasedAt) return res.status(404).json({ message: "Not found" });
    let plaintext: Buffer;
    try {
      const blob = await fsp.readFile(doc.encryptedPath);
      plaintext = decryptBuffer(blob);
    } catch (err) {
      console.error("[clients] document decrypt failed:", (err as Error).message);
      return res.status(500).json({ message: "Failed to read document" });
    }
    storage.recordAuditPii({ ...auditCtx(req), action: "read", tableName: "client_documents", rowId: id, fieldName: "download" });
    res.setHeader("Content-Type", doc.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${doc.originalFilename.replace(/"/g, "")}"`);
    res.send(plaintext);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Task #26 — Paystack subscriptions. PIVOT from Stripe (SA onboarding gap).
  // All /api/billing/* routes require an advisor session (enforced by
  // requireAuth middleware allow-list). Each handler scopes to session.advisorId
  // so an advisor session cannot read or mutate another advisor's billing.
  // The webhook is public; signature verified inline.
  // ───────────────────────────────────────────────────────────────────────────

  // Current advisor's billing snapshot — used by the Upgrade page to decide
  // which CTAs to show (start trial vs. switch tier vs. manage subscription).
  app.get("/api/billing/status", async (req, res) => {
    const advisorId = (req.session as any)?.advisorId;
    if (typeof advisorId !== "number") return res.status(401).json({ message: "Unauthorized" });
    const advisor = await storage.getAdvisor(advisorId);
    if (!advisor) return res.status(404).json({ message: "Not found" });
    const { isPremiumActive, isBasicOrBetter } = await import("@shared/schema");
    res.json({
      tier: advisor.subscriptionTier ?? "trial",
      status: advisor.subscriptionStatus ?? "trialing",
      trialEndsAt: advisor.trialEndsAt,
      hasSubscription: !!advisor.paystackSubscriptionCode,
      premiumActive: isPremiumActive(advisor),
      basicOrBetter: isBasicOrBetter(advisor),
      paystackConfigured: (await import("./paystack")).isPaystackConfigured(),
    });
  });

  // Initialize a Paystack hosted checkout. Returns the URL the client should
  // redirect to. Paystack auto-creates a subscription on first successful
  // charge (driven by the plan code) — we don't need a separate "create
  // subscription" call.
  app.post("/api/billing/checkout", async (req, res) => {
    const advisorId = (req.session as any)?.advisorId;
    if (typeof advisorId !== "number") return res.status(401).json({ message: "Unauthorized" });
    const tier = String(req.body?.tier || "");
    if (tier !== "basic" && tier !== "premium") {
      return res.status(400).json({ message: "tier must be 'basic' or 'premium'" });
    }
    const { initializeTransaction, isPaystackConfigured } = await import("./paystack");
    if (!isPaystackConfigured()) return res.status(503).json({ message: "Billing is not configured yet. Please contact support." });
    const advisor = await storage.getAdvisor(advisorId);
    if (!advisor) return res.status(404).json({ message: "Not found" });
    if (!advisor.email) return res.status(400).json({ message: "Advisor email is required for checkout" });
    const origin = `${req.protocol}://${req.headers.host}`;
    try {
      const result = await initializeTransaction({
        email: advisor.email,
        tier: tier as "basic" | "premium",
        callbackUrl: `${origin}/advisor/${advisor.profileSlug}?tab=billing&billing=success`,
        metadata: { advisorId: advisor.id, slug: advisor.profileSlug },
      });
      res.json({ authorizationUrl: result.authorizationUrl, reference: result.reference });
    } catch (err) {
      console.error("[billing] checkout init failed:", (err as Error).message);
      res.status(502).json({ message: "Could not start checkout. Please try again." });
    }
  });

  // Cancel the current subscription. Paystack requires the subscription code +
  // email token (we stored both at webhook time).
  app.post("/api/billing/cancel", async (req, res) => {
    const advisorId = (req.session as any)?.advisorId;
    if (typeof advisorId !== "number") return res.status(401).json({ message: "Unauthorized" });
    const advisor = await storage.getAdvisor(advisorId);
    if (!advisor) return res.status(404).json({ message: "Not found" });
    if (!advisor.paystackSubscriptionCode || !advisor.paystackEmailToken) {
      return res.status(400).json({ message: "No active subscription to cancel." });
    }
    const { disableSubscription } = await import("./paystack");
    try {
      await disableSubscription({ code: advisor.paystackSubscriptionCode, token: advisor.paystackEmailToken });
      // Don't optimistically update the row — the subscription.disable webhook
      // will land within seconds and flip status to "cancelled" idempotently.
      // This avoids drift if Paystack actually rejected the disable call.
      res.json({ ok: true });
    } catch (err) {
      console.error("[billing] cancel failed:", (err as Error).message);
      res.status(502).json({ message: "Could not cancel. Please try again or email support." });
    }
  });

  // Manage-subscription link (Paystack's closest analog to Stripe's Customer
  // Portal). Issues a one-time URL where the advisor can update card details +
  // view invoice history. Returns 400 if the advisor has no subscription yet.
  app.get("/api/billing/manage-link", async (req, res) => {
    const advisorId = (req.session as any)?.advisorId;
    if (typeof advisorId !== "number") return res.status(401).json({ message: "Unauthorized" });
    const advisor = await storage.getAdvisor(advisorId);
    if (!advisor?.paystackSubscriptionCode) return res.status(400).json({ message: "No subscription yet." });
    const { getManageSubscriptionLink } = await import("./paystack");
    const link = await getManageSubscriptionLink(advisor.paystackSubscriptionCode);
    if (!link) return res.status(502).json({ message: "Could not generate management link." });
    res.json({ link });
  });

  // Paystack webhook. PUBLIC route (allow-listed in server/auth.ts). Verifies
  // HMAC-SHA512 of the raw body against x-paystack-signature, then routes the
  // event. Every handler is idempotent — Paystack may retry, and we ignore
  // duplicates by checking the current advisor row before writing.
  app.post("/api/webhook/paystack", webhookLimiter, async (req, res) => {
    const { verifyWebhookSignature, tierForPlanCode } = await import("./paystack");
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const sig = req.header("x-paystack-signature");
    const raw = (req as any).rawBody;
    if (!raw || !verifyWebhookSignature(raw, sig)) {
      console.warn("[paystack-webhook] bad signature");
      return res.status(401).json({ message: "Bad signature" });
    }
    const event = req.body as { event?: string; data?: any; id?: string };
    const eventName = event?.event || "unknown";
    const data = event?.data || {};
    // Paystack events carry a unique top-level `id`. Some older payload shapes
    // put it inside data.id; we try both, then fall back to a hash of the raw
    // body so dedupe still works even on a payload without an id field.
    const crypto = await import("crypto");
    const eventId: string = String(
      event?.id ||
      data?.id ||
      crypto.createHash("sha256").update(raw as Buffer).digest("hex")
    );

    // Resolve the target advisor. Resolution order:
    //   1) metadata.advisorId — set at checkout-init time, server-controlled.
    //      This is the ONLY trusted source for first-time activation, before
    //      the customer row links back to our advisor row.
    //   2) paystack_customer_code — set by us on prior webhooks; unique-indexed.
    //   3) (intentionally NO email fallback — advisor email is not unique, and
    //      an email-based lookup could apply an event to the wrong advisor.)
    const metadataAdvisorId: number | undefined = (() => {
      const raw = data?.metadata?.advisorId ?? data?.metadata?.advisor_id;
      const n = typeof raw === "string" ? parseInt(raw, 10) : raw;
      return typeof n === "number" && Number.isFinite(n) ? n : undefined;
    })();
    const customerCode: string | undefined = data?.customer?.customer_code;
    let advisor = metadataAdvisorId
      ? await storage.getAdvisor(metadataAdvisorId)
      : undefined;
    if (!advisor && customerCode) {
      advisor = await storage.findAdvisorByPaystackCustomerCode(customerCode);
    }
    if (!advisor) {
      console.warn(`[paystack-webhook] no advisor for event=${eventName} id=${eventId}`);
      // 200 — Paystack retrying won't change the outcome. Already logged.
      return res.status(200).json({ ok: true, ignored: "unknown advisor" });
    }

    // Idempotency: insert event_id first. ON CONFLICT DO NOTHING gives us a
    // 0-row insert (rowCount === 0) on a replay. We then short-circuit with
    // 200 so Paystack stops retrying.
    try {
      const ins: any = await db.execute(sql`
        INSERT INTO paystack_webhook_events (event_id, event_name, advisor_id)
        VALUES (${eventId}, ${eventName}, ${advisor.id})
        ON CONFLICT (event_id) DO NOTHING
        RETURNING event_id
      `);
      const inserted = Array.isArray(ins?.rows) ? ins.rows.length : (ins?.rowCount ?? 0);
      if (!inserted) {
        console.log(`[paystack-webhook] replay ignored event=${eventName} id=${eventId} advisor=${advisor.id}`);
        return res.status(200).json({ ok: true, replay: true });
      }
    } catch (err) {
      // Transient DB failure — let Paystack retry.
      console.error(`[paystack-webhook] idempotency insert failed event=${eventName}:`, (err as Error).message);
      return res.status(500).json({ message: "Transient error, please retry" });
    }

    const updates: Partial<import("@shared/schema").InsertAdvisor> = {};
    if (customerCode && !advisor.paystackCustomerCode) updates.paystackCustomerCode = customerCode;

    let recognised = true;
    switch (eventName) {
      case "charge.success": {
        // First successful charge or recurring renewal. Treat as "active".
        // For first-time activation, tier is in metadata.tier or via plan code.
        const planCode: string | undefined = data?.plan?.plan_code || data?.plan_object?.plan_code;
        const metaTier: string | undefined = data?.metadata?.tier;
        const resolvedTier = (metaTier === "basic" || metaTier === "premium")
          ? metaTier
          : tierForPlanCode(planCode);
        if (resolvedTier) updates.subscriptionTier = resolvedTier;
        // Don't clobber a more recent cancellation with a stale charge success.
        // (We've already deduped by event id; this guards against true out-of-order
        // delivery of two distinct events.)
        if (advisor.subscriptionStatus !== "cancelled") {
          updates.subscriptionStatus = "active";
        }
        // A successful charge extends the paid-through period.
        const nextPay = data?.subscription?.next_payment_date || data?.plan?.next_payment_date;
        if (nextPay) (updates as any).subscriptionEndsAt = new Date(nextPay);
        break;
      }
      case "subscription.create": {
        if (data?.subscription_code) updates.paystackSubscriptionCode = data.subscription_code;
        if (data?.email_token) updates.paystackEmailToken = data.email_token;
        const planCode: string | undefined = data?.plan?.plan_code;
        const resolvedTier = tierForPlanCode(planCode);
        if (resolvedTier) updates.subscriptionTier = resolvedTier;
        if (advisor.subscriptionStatus !== "cancelled") {
          updates.subscriptionStatus = "active";
        }
        // next_payment_date is the end of the currently-paid period.
        if (data?.next_payment_date) {
          (updates as any).subscriptionEndsAt = new Date(data.next_payment_date);
        }
        break;
      }
      case "subscription.disable":
      case "subscription.not_renew": {
        updates.subscriptionStatus = "cancelled";
        // Tier intentionally NOT downgraded immediately — advisor keeps access
        // through the paid-up period. `subscriptionEndsAt` is the gate.
        if (data?.next_payment_date) {
          (updates as any).subscriptionEndsAt = new Date(data.next_payment_date);
        } else if (!advisor.subscriptionEndsAt) {
          // Defensive fallback: if Paystack didn't include a period-end and we
          // never captured one from the create/charge events, default to 30
          // days so we don't strip access instantly on the next request.
          (updates as any).subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }
        break;
      }
      case "invoice.payment_failed": {
        // Only flip to past_due from an active-ish state; don't resurrect a
        // cancelled subscription.
        if (advisor.subscriptionStatus !== "cancelled") {
          updates.subscriptionStatus = "past_due";
        }
        break;
      }
      case "invoice.create":
      case "invoice.update": {
        // No-op for tier state; useful for future invoice history surfacing.
        break;
      }
      default: {
        recognised = false;
        console.log(`[paystack-webhook] unhandled event=${eventName} id=${eventId} advisor=${advisor.id}`);
        break;
      }
    }

    try {
      if (Object.keys(updates).length > 0) {
        await storage.updateAdvisor(advisor.id, updates as any);
        console.log(`[paystack-webhook] event=${eventName} id=${eventId} advisor=${advisor.id} updates=${Object.keys(updates).join(",")}`);
      }
      res.status(200).json({ ok: true, recognised });
    } catch (err) {
      // Transient failure during the actual update. Roll back the dedupe row
      // so a Paystack retry can re-attempt the update — otherwise the event
      // is permanently lost.
      console.error(`[paystack-webhook] update failed event=${eventName} id=${eventId}:`, (err as Error).message);
      try {
        await db.execute(sql`DELETE FROM paystack_webhook_events WHERE event_id = ${eventId}`);
      } catch (rollbackErr) {
        console.error(`[paystack-webhook] dedupe rollback failed event=${eventName} id=${eventId}:`, (rollbackErr as Error).message);
      }
      res.status(500).json({ message: "Transient error, please retry" });
    }
  });

  // Admin-only audit-trail read.
  app.get("/api/audit-pii", async (req, res) => {
    if (sessionRole(req) !== "admin") return res.status(401).json({ message: "Admin only" });
    const tableName = typeof req.query.tableName === "string" ? req.query.tableName : undefined;
    const rowId = req.query.rowId ? Number(req.query.rowId) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const rows = await storage.listAuditPii({ tableName, rowId, limit });
    res.json(rows);
  });

  // Task #54 — Admin-only fresh-start wipe. Same transactional logic as
  // scripts/freshStart.ts, exposed here so Stewart can trigger from the
  // control panel without shell access. Requires admin session AND the
  // exact confirm phrase in the body so a stray click can't fire it.
  app.post("/api/admin/fresh-start", async (req, res) => {
    if (sessionRole(req) !== "admin") return res.status(401).json({ message: "Admin only" });
    if (req.body?.confirm !== "WIPE EVERYTHING") {
      return res.status(400).json({ message: "Missing confirm phrase" });
    }
    const fs = await import("fs/promises");
    const path = await import("path");
    const { pool } = await import("./db");

    const TABLES = ["advisors","advisor_profiles","emails","stats","clients","client_consent","client_documents","audit_pii"];
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const dir = path.resolve(".local", "backups", `fresh-start-${stamp}`);
    await fs.mkdir(dir, { recursive: true });

    const backupCounts: Record<string, number> = {};
    for (const t of TABLES) {
      const { rows } = await pool.query(`SELECT * FROM ${t}`);
      backupCounts[t] = rows.length;
      await fs.writeFile(path.join(dir, `${t}.json`), JSON.stringify(rows, null, 2));
    }

    const client = await pool.connect();
    const deleted: { sql: string; rowCount: number }[] = [];
    try {
      await client.query("BEGIN");
      await client.query(`DROP RULE IF EXISTS audit_pii_no_update ON audit_pii`);
      await client.query(`DROP RULE IF EXISTS audit_pii_no_delete ON audit_pii`);
      const order = [
        `DELETE FROM client_documents`,
        `DELETE FROM client_consent`,
        `DELETE FROM audit_pii`,
        `DELETE FROM clients`,
        `DELETE FROM emails`,
        `DELETE FROM stats WHERE event_type IN ('email_received','referral_sent') OR event_type LIKE 'app_access%'`,
        `DELETE FROM advisor_profiles`,
        `DELETE FROM advisors`,
      ];
      for (const sql of order) {
        const r = await client.query(sql);
        deleted.push({ sql, rowCount: r.rowCount ?? 0 });
      }
      await client.query(`CREATE RULE audit_pii_no_update AS ON UPDATE TO audit_pii DO INSTEAD NOTHING`);
      await client.query(`CREATE RULE audit_pii_no_delete AS ON DELETE TO audit_pii DO INSTEAD NOTHING`);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      client.release();
      console.error("[fresh-start] rollback:", err);
      return res.status(500).json({ message: "Wipe failed — rolled back, nothing changed", error: (err as Error).message });
    }
    client.release();

    // Best-effort disk cleanup. Errors logged, do not roll back the DB wipe.
    const diskResults: Record<string, { removed: number; errors: string[] }> = {};
    for (const d of ["uploads/clients", "uploads/scans"]) {
      const r = { removed: 0, errors: [] as string[] };
      try {
        const entries = await fs.readdir(path.resolve(d)).catch(() => [] as string[]);
        for (const e of entries) {
          try {
            await fs.rm(path.resolve(d, e), { recursive: true, force: true });
            r.removed++;
          } catch (err) { r.errors.push(`${e}: ${(err as Error).message}`); }
        }
      } catch (err) { r.errors.push((err as Error).message); }
      diskResults[d] = r;
    }

    const finalCounts: Record<string, number> = {};
    for (const t of TABLES) {
      const { rows } = await pool.query(`SELECT COUNT(*)::int AS n FROM ${t}`);
      finalCounts[t] = rows[0].n;
    }

    const manifest = [
      `Fresh-start wipe (admin panel trigger)`,
      `Triggered: ${new Date().toISOString()}`,
      ``,
      `Backup counts:`,
      ...TABLES.map((t) => `  ${t}: ${backupCounts[t]}`),
      ``,
      `Delete results:`,
      ...deleted.map((d) => `  ${d.sql}  ->  ${d.rowCount}`),
      ``,
      `Post-wipe verification:`,
      ...TABLES.map((t) => `  ${t}: ${finalCounts[t]} ${finalCounts[t] === 0 ? "OK" : "FAIL"}`),
      ``,
      `Disk cleanup:`,
      ...Object.entries(diskResults).map(([d, r]) => `  ${d}: removed ${r.removed}, errors ${r.errors.length}`),
    ].join("\n");
    await fs.writeFile(path.join(dir, "manifest.txt"), manifest);

    console.log(`[fresh-start] admin wipe complete. Backup at ${dir}`);
    res.json({ ok: true, backupCounts, deleted, finalCounts, diskResults, backupDir: dir });
  });

  return httpServer;
}