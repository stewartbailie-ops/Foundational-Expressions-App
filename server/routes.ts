import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAdvisorSchema, insertAdvisorProfileSchema, insertEmailSchema, autoGradeClient, GRADE_OPTIONS, LEAD_STATUS_OPTIONS } from "@shared/schema";
import { sendEmail, isSendGridConfigured, buildRecipients } from "./sendgrid";
import { z } from "zod";
import multer from "multer";
import bcrypt from "bcryptjs";

const otpStore = new Map<string, { code: string; expires: number }>();

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function verifyRecaptcha(token: string): Promise<boolean> {
  try {
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) return true; // skip if not configured
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${secret}&response=${token}`,
    });
    const data = await response.json() as { success: boolean };
    return data.success === true;
  } catch {
    return false;
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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/auth/login", async (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return res.status(500).json({ message: "Admin password not configured" });
    }
    if (password !== adminPassword) {
      return res.status(401).json({ message: "Invalid password" });
    }
    (req.session as any).authenticated = true;
    res.json({ authenticated: true });
  });

  app.get("/api/auth/session", async (req, res) => {
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

  app.get("/api/dashboard/stats", async (_req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  app.get("/api/dashboard/activity", async (_req, res) => {
    const activity = await storage.getWeeklyActivity();
    res.json(activity);
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
    res.json(advisor);
  });

  app.get("/api/advisors/:id", async (req, res) => {
    const advisor = await storage.getAdvisor(Number(req.params.id));
    if (!advisor) return res.status(404).json({ message: "Advisor not found" });
    res.json(advisor);
  });

  app.post("/api/advisors", async (req, res) => {
    const parsed = insertAdvisorSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    }
    const advisor = await storage.createAdvisor(parsed.data);
    res.status(201).json(advisor);
  });

  app.patch("/api/advisors/:id", async (req, res) => {
    const partial = insertAdvisorSchema.partial().safeParse(req.body);
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
    const parsed = insertAdvisorProfileSchema.safeParse({ ...req.body, advisorId: Number(req.params.id) });
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
    const partial = insertAdvisorProfileSchema.partial().safeParse(req.body);
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

  app.post("/api/emails", async (req, res) => {
    const parsed = insertEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    }
    const data = parsed.data;
    if (!data.grade || data.grade === "Silver") {
      data.grade = autoGradeClient(data.clientAge, data.clientIncome, data.clientIndustry);
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

  app.post("/api/advisor-auth/:slug/send-otp", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });
    const advisor = await storage.getAdvisorBySlug(req.params.slug);
    if (!advisor) return res.status(404).json({ message: "Advisor not found" });
    if (!advisor.email || advisor.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(400).json({ message: "Email does not match our records for this advisor" });
    }
    const code = generateOtp();
    otpStore.set(req.params.slug, { code, expires: Date.now() + 10 * 60 * 1000 });
    try {
      await sendEmail(
        advisor.email,
        "Your Advisory Connect Login Code",
        `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
          <h2 style="color:#4a8db5;margin-bottom:8px;">Your Login Code</h2>
          <p style="color:#555;margin-bottom:24px;">Use the code below to access your Advisory Connect control panel. It expires in <strong>10 minutes</strong>.</p>
          <div style="background:#f5f7fa;border-radius:12px;padding:24px;text-align:center;letter-spacing:8px;font-size:36px;font-weight:bold;color:#1a1a1a;">${code}</div>
          <p style="color:#999;font-size:12px;margin-top:24px;">If you didn't request this, you can safely ignore this email.</p>
        </div>`
      );
    } catch (err) {
      console.error("OTP email error:", err);
      return res.status(500).json({ message: "Failed to send OTP email. Please try again." });
    }
    res.json({ success: true });
  });

  app.post("/api/advisor-auth/:slug/verify-otp", async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Code required" });
    const entry = otpStore.get(req.params.slug);
    if (!entry) return res.status(400).json({ message: "No OTP found. Please request a new code." });
    if (Date.now() > entry.expires) {
      otpStore.delete(req.params.slug);
      return res.status(400).json({ message: "Code expired. Please request a new one." });
    }
    if (entry.code !== code.trim()) {
      return res.status(400).json({ message: "Incorrect code. Please try again." });
    }
    otpStore.delete(req.params.slug);
    const advisor = await storage.getAdvisorBySlug(req.params.slug);
    res.json({ verified: true, passwordSet: advisor?.advisorPasswordSet ?? false });
  });

  app.get("/api/advisor-auth/:slug/status", async (req, res) => {
    const advisor = await storage.getAdvisorBySlug(req.params.slug);
    if (!advisor) return res.status(404).json({ message: "Advisor not found" });
    res.json({ passwordSet: advisor.advisorPasswordSet ?? false });
  });

  app.post("/api/advisor-auth/:slug/set-password", async (req, res) => {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    const advisor = await storage.getAdvisorBySlug(req.params.slug);
    if (!advisor) return res.status(404).json({ message: "Advisor not found" });
    if (advisor.advisorPasswordSet) {
      return res.status(400).json({ message: "Password already set" });
    }
    const hash = await bcrypt.hash(password, 10);
    await storage.updateAdvisor(advisor.id, { advisorPasswordHash: hash, advisorPasswordSet: true });
    (req.session as any)[`advisor_${req.params.slug}`] = true;
    res.json({ success: true });
  });

  app.post("/api/advisor-auth/:slug/login", async (req, res) => {
    const { password } = req.body;
    const advisor = await storage.getAdvisorBySlug(req.params.slug);
    if (!advisor) return res.status(404).json({ message: "Advisor not found" });
    if (!advisor.advisorPasswordHash) return res.status(401).json({ message: "Password not set" });
    const valid = await bcrypt.compare(password, advisor.advisorPasswordHash);
    if (!valid) return res.status(401).json({ message: "Invalid password" });
    (req.session as any)[`advisor_${req.params.slug}`] = true;
    res.json({ authenticated: true });
  });

  app.post("/api/advisor-auth/:slug/logout", async (req, res) => {
    (req.session as any)[`advisor_${req.params.slug}`] = false;
    res.json({ authenticated: false });
  });

  app.get("/api/advisor-auth/:slug/session", async (req, res) => {
    const authenticated = !!(req.session as any)?.[`advisor_${req.params.slug}`];
    res.json({ authenticated });
  });

  app.get("/api/advisors/:slug/emails", async (req, res) => {
    const slug = req.params.slug;
    const isAuthenticated = !!(req.session as any)?.[`advisor_${slug}`] || !!(req.session as any)?.authenticated;
    if (!isAuthenticated) return res.status(401).json({ message: "Unauthorized" });
    const advisor = await storage.getAdvisorBySlug(slug);
    if (!advisor) return res.status(404).json({ message: "Advisor not found" });
    const allEmails = await storage.getEmailsByAdvisor(advisor.id);
    res.json(allEmails);
  });

  app.get("/api/advisors/:slug/stats", async (req, res) => {
    const slug = req.params.slug;
    const isAuthenticated = !!(req.session as any)?.[`advisor_${slug}`] || !!(req.session as any)?.authenticated;
    if (!isAuthenticated) return res.status(401).json({ message: "Unauthorized" });
    const advisor = await storage.getAdvisorBySlug(slug);
    if (!advisor) return res.status(404).json({ message: "Advisor not found" });
    const advisorStats = await storage.getAdvisorStats(advisor.id);
    res.json(advisorStats);
  });

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
      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AdvisoryConnect/1.0)" },
        signal: AbortSignal.timeout(10000),
      });
      const xml = await response.text();
      const items: Array<{ title: string; link: string; description: string; pubDate: string; category: string }> = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      while ((match = itemRegex.exec(xml)) !== null) {
        const item = match[1];
        const title = (item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || item.match(/<title>([\s\S]*?)<\/title>/))?.[1]?.trim() || "";
        const link = item.match(/<link>(https?:\/\/[^\s<]*)<\/link>/)?.[1]?.trim() || "";
        const desc = (item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || item.match(/<description>([\s\S]*?)<\/description>/))?.[1]?.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 220) || "";
        const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || "";
        const cat = (item.match(/<category><!\[CDATA\[([\s\S]*?)\]\]><\/category>/) || item.match(/<category>([\s\S]*?)<\/category>/))?.[1]?.trim() || "";
        if (title && link) items.push({ title, link, description: desc, pubDate, category: cat });
      }
      res.json({ items: items.slice(0, 12) });
    } catch {
      res.status(500).json({ message: "Failed to fetch feed", items: [] });
    }
  });

  return httpServer;
}