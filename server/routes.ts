import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAdvisorSchema, insertAdvisorProfileSchema, insertEmailSchema, autoGradeClient, GRADE_OPTIONS, LEAD_STATUS_OPTIONS } from "@shared/schema";
import { sendEmail, isSendGridConfigured, buildRecipients } from "./sendgrid";
import { z } from "zod";
import multer from "multer";
import bcrypt from "bcryptjs";
import crypto from "crypto";

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

const otpStore = new Map<string, { code: string; expires: number }>();

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const PUBLIC_ADVISOR_FIELDS = [
  "id", "name", "contactNumber", "location", "workingHours", "showContactDetails",
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
  "showToolCompound", "showToolPension", "showToolCgt", "showToolVehicle", "showToolReality", "showToolLatte",
  "showMoneywebFeed", "showEmergencyContacts",
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

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return res.status(500).json({ message: "Admin password not configured" });
    }
    const adminEmail = (process.env.ADMIN_EMAIL || "info@corefinancials.org").toLowerCase().trim();
    if (!email || email.toLowerCase().trim() !== adminEmail) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (password !== adminPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
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

  app.use("/uploads", (await import("express")).default.static("uploads"));

  app.post("/api/upload/profile-pic", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded or invalid file type" });
    }
    const base64 = req.file.buffer.toString("base64");
    const url = `data:${req.file.mimetype};base64,${base64}`;
    res.json({ url });
  });

  app.post("/api/upload/fais", pdfUpload.single("file"), async (req, res) => {
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

  app.get("/api/advisors/slug/:slug", async (req, res) => {
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
    const profiles = await storage.getAdvisorProfiles(Number(req.params.id));
    res.json(profiles);
  });

  app.post("/api/advisors/:id/profiles", async (req, res) => {
    const parsed = safeInsertAdvisorProfileSchema.safeParse({ ...req.body, advisorId: Number(req.params.id) });
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    }
    const existing = await storage.getAdvisorProfiles(Number(req.params.id));
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
    const partial = safeInsertAdvisorProfileSchema.partial().safeParse(req.body);
    if (!partial.success) {
      return res.status(400).json({ message: "Invalid data", errors: partial.error.flatten() });
    }
    try {
      const updated = await storage.updateAdvisorProfile(Number(req.params.profileId), partial.data);
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
    const deleted = await storage.deleteAdvisorProfile(Number(req.params.profileId));
    if (!deleted) return res.status(404).json({ message: "Profile not found" });
    res.json({ success: true });
  });

  app.get("/api/emails", async (_req, res) => {
    const emails = await storage.getEmails();
    res.json(emails);
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
    if (!data.grade || data.grade === "Silver") {
      data.grade = autoGradeClient(data.clientAge, data.clientIncome, data.clientIndustry);
    }
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
    if (!data.grade || data.grade === "Silver") {
      data.grade = autoGradeClient(data.clientAge, data.clientIncome, data.clientIndustry);
    }
    if (req.body?.receivedAt) {
      const d = new Date(req.body.receivedAt);
      if (!isNaN(d.getTime())) data.receivedAt = d;
    }
    const email = await storage.createEmail(data);
    res.status(201).json(email);
  });

  app.patch("/api/emails/:id/grade", async (req, res) => {
    const { grade } = req.body;
    if (!grade || !GRADE_OPTIONS.includes(grade)) {
      return res.status(400).json({ message: `grade must be one of: ${GRADE_OPTIONS.join(", ")}` });
    }
    const updated = await storage.updateEmailGrade(Number(req.params.id), grade);
    if (!updated) return res.status(404).json({ message: "Email not found" });
    res.json(updated);
  });

  app.patch("/api/emails/:id/status", async (req, res) => {
    const { leadStatus } = req.body;
    if (!leadStatus || !LEAD_STATUS_OPTIONS.includes(leadStatus)) {
      return res.status(400).json({ message: `leadStatus must be one of: ${LEAD_STATUS_OPTIONS.join(", ")}` });
    }
    const updated = await storage.updateEmailStatus(Number(req.params.id), leadStatus);
    if (!updated) return res.status(404).json({ message: "Email not found" });
    res.json(updated);
  });

  app.patch("/api/emails/:id/open", async (req, res) => {
    const updated = await storage.updateEmailOpened(Number(req.params.id));
    if (!updated) return res.status(404).json({ message: "Email not found" });
    res.json(updated);
  });

  app.delete("/api/emails/:id", async (req, res) => {
    const deleted = await storage.deleteEmail(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Email not found" });
    res.json({ message: "Deleted" });
  });

  app.post("/api/referral", async (req, res) => {
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
      const grade = autoGradeClient(data.clientAge, data.clientIncome, data.clientIndustry);

      const email = await storage.createEmail({
        advisorId: data.advisorId,
        senderName: data.clientName,
        senderEmail: data.clientEmail || "",
        type: "Referral",
        grade,
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
        source: data.source,
      });

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
            <p><strong>Grade:</strong> ${grade}</p>
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

      res.status(201).json({ message: "Referral received", grade, email });
    } catch (error) {
      console.error("Referral error:", error);
      res.status(500).json({ message: "Failed to process referral" });
    }
  });

  app.post("/api/callback", async (req, res) => {
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
      const grade = autoGradeClient(data.clientAge, data.clientIncome, data.clientIndustry || null);

      const email = await storage.createEmail({
        advisorId: data.advisorId,
        senderName: data.clientName,
        senderEmail: data.clientEmail || "",
        type: "Call Back",
        grade,
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
        source: data.source,
      });

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
            <p><strong>Grade:</strong> ${grade}</p>
            ${servicesText}
            <p><strong>Preferred Contact:</strong> ${data.preferredContactTime || "Not specified"}</p>
            <hr/>
            <p style="color: #888; font-size: 12px;">This notification was sent via Advisory Connect.</p>`
          );
        } catch (emailErr) {
          console.error("Failed to send callback notification email:", emailErr);
        }
      }

      res.status(201).json({ message: "Callback request received", grade, email });
    } catch (error) {
      console.error("Callback error:", error);
      res.status(500).json({ message: "Failed to process callback" });
    }
  });

  app.post("/api/will-request", async (req, res) => {
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
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }

      const data = parsed.data;
      const details = [
        data.idNumber && `ID: ${data.idNumber}`,
        data.dateOfBirth && `DOB: ${data.dateOfBirth}`,
        data.maritalStatus && `Marital Status: ${data.maritalStatus}`,
        data.spouseName && `Spouse: ${data.spouseName}`,
        data.numberOfChildren && `Children: ${data.numberOfChildren}`,
        data.childrenDetails && `Children Details: ${data.childrenDetails}`,
        data.address && `Address: ${data.address}`,
      ].filter(Boolean).join(" | ");

      const email = await storage.createEmail({
        advisorId: data.advisorId,
        senderName: data.fullName,
        senderEmail: data.email || "",
        type: "Will Request",
        grade: "Silver",
        subject: `Complimentary Will Request from ${data.fullName}`,
        body: details,
        clientPhone: data.phone,
        source: data.source || "will-form",
      });

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

  app.post("/api/webhook/zoho", async (req, res) => {
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

      const grade = autoGradeClient(null, null, null);

      await storage.createEmail({
        advisorId: targetAdvisor.id,
        senderName,
        senderEmail,
        type,
        grade,
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

  app.post("/api/webhook/inbound-email", async (req, res) => {
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

      const grade = autoGradeClient(null, null, null);

      await storage.createEmail({
        advisorId: targetAdvisor.id,
        senderName,
        senderEmail,
        type,
        grade,
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

  app.post("/api/stats/access", async (req, res) => {
    const { advisorId } = req.body;
    await storage.recordStat({ advisorId: advisorId || null, eventType: "app_access" });
    res.json({ success: true });
  });

  app.get("/api/advisors/:slug/profile-stats", async (req, res) => {
    const advisor = await storage.getAdvisorBySlug(req.params.slug);
    if (!advisor) return res.status(404).json({ message: "Not found" });
    const totalViews = await storage.getAdvisorViewCount(advisor.id);
    res.json({ totalViews });
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
  app.post("/api/advisor-auth/:slug/setup", async (req, res) => {
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
  app.post("/api/advisor-auth/:slug/verify-otp", async (req, res) => {
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
    (req.session as any)[`advisor_${req.params.slug}`] = true;
    res.json({ authenticated: true });
  });

  // Resend verification OTP (only for unverified accounts)
  app.post("/api/advisor-auth/:slug/resend-otp", async (req, res) => {
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
  app.post("/api/advisor-auth/:slug/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });
    const advisor = await storage.getAdvisorBySlug(req.params.slug);
    if (!advisor) return res.status(404).json({ message: "Advisor not found" });
    if (!advisor.email || advisor.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }
    if (!advisor.advisorPasswordHash) {
      return res.status(401).json({ message: "Account not set up yet.", needsSetup: true });
    }
    const valid = await bcrypt.compare(password, advisor.advisorPasswordHash);
    if (!valid) return res.status(401).json({ message: "Incorrect email or password." });
    if (!advisor.advisorEmailVerified) {
      return res.status(401).json({ message: "Email not verified. Please complete the verification step.", needsVerification: true });
    }
    (req.session as any)[`advisor_${req.params.slug}`] = true;
    res.json({ authenticated: true });
  });

  app.post("/api/advisor-auth/:slug/logout", async (req, res) => {
    (req.session as any)[`advisor_${req.params.slug}`] = false;
    res.json({ authenticated: false });
  });

  app.get("/api/advisor-auth/:slug/session", async (req, res) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    const advisor = await storage.getAdvisorBySlug(req.params.slug);
    if (advisor?.isDemo) {
      return res.json({ authenticated: true, isDemo: true });
    }
    const authenticated = !!(req.session as any)?.[`advisor_${req.params.slug}`];
    res.json({ authenticated });
  });

  app.get("/api/advisors/:slug/emails", async (req, res) => {
    const slug = req.params.slug;
    const advisor = await storage.getAdvisorBySlug(slug);
    if (!advisor) return res.status(404).json({ message: "Advisor not found" });
    const isAuthenticated = !!(req.session as any)?.[`advisor_${slug}`] || !!(req.session as any)?.authenticated || !!advisor.isDemo;
    if (!isAuthenticated) return res.status(401).json({ message: "Unauthorized" });
    const allEmails = await storage.getEmailsByAdvisor(advisor.id);
    res.json(allEmails);
  });

  app.get("/api/advisors/:slug/stats", async (req, res) => {
    const slug = req.params.slug;
    const advisor = await storage.getAdvisorBySlug(slug);
    if (!advisor) return res.status(404).json({ message: "Advisor not found" });
    const isAuthenticated = !!(req.session as any)?.[`advisor_${slug}`] || !!(req.session as any)?.authenticated || !!advisor.isDemo;
    if (!isAuthenticated) return res.status(401).json({ message: "Unauthorized" });
    const advisorStats = await storage.getAdvisorStats(advisor.id);
    res.json(advisorStats);
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
  app.get("/api/news/feed", async (_req, res) => {
    try {
      // Curated mix of SA + global business/finance feeds that we know respond
      // reliably without auth and (for the latter two) carry article thumbnails.
      const sources: Array<{ name: string; url: string }> = [
        { name: "MoneyWeb",     url: "https://www.moneyweb.co.za/feed/" },
        { name: "BBC Business", url: "https://feeds.bbci.co.uk/news/business/rss.xml" },
        { name: "Investing",    url: "https://www.investing.com/rss/news_25.rss" },
      ];
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

  return httpServer;
}