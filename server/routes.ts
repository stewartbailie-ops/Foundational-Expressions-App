import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAdvisorSchema, insertEmailSchema, autoGradeClient, GRADE_OPTIONS } from "@shared/schema";
import { isSendGridConfigured } from "./sendgrid";
import { z } from "zod";

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

  app.post("/api/referral", async (req, res) => {
    try {
      const schema = z.object({
        advisorId: z.number(),
        clientName: z.string().min(1),
        clientEmail: z.string().email(),
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
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }

      const data = parsed.data;
      const grade = autoGradeClient(data.clientAge, data.clientIncome, data.clientIndustry);

      const email = await storage.createEmail({
        advisorId: data.advisorId,
        senderName: data.clientName,
        senderEmail: data.clientEmail,
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
        clientEmail: z.string().email(),
        clientAge: z.number().optional(),
        clientIncome: z.string().optional(),
        clientPhone: z.string().optional(),
        clientMarried: z.boolean().optional(),
        clientChildren: z.boolean().optional(),
        clientVehicle: z.boolean().optional(),
        clientProperty: z.boolean().optional(),
        preferredContactTime: z.string().optional(),
        servicesRequested: z.string().optional(),
        message: z.string().optional(),
        source: z.string().optional(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }

      const data = parsed.data;
      const grade = autoGradeClient(data.clientAge, data.clientIncome, null);

      const email = await storage.createEmail({
        advisorId: data.advisorId,
        senderName: data.clientName,
        senderEmail: data.clientEmail,
        type: "Call Back",
        grade,
        subject: `Call back request from ${data.source || "advisor app"}`,
        body: data.message || "",
        clientAge: data.clientAge,
        clientIncome: data.clientIncome,
        clientPhone: data.clientPhone,
        clientMarried: data.clientMarried,
        clientChildren: data.clientChildren,
        clientVehicle: data.clientVehicle,
        clientProperty: data.clientProperty,
        preferredContactTime: data.preferredContactTime,
        servicesRequested: data.servicesRequested,
        source: data.source,
      });

      res.status(201).json({ message: "Callback request received", grade, email });
    } catch (error) {
      console.error("Callback error:", error);
      res.status(500).json({ message: "Failed to process callback" });
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

  return httpServer;
}