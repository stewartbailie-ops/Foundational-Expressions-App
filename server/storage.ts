import { db } from "./db";
import { advisors, emails, stats, type Advisor, type InsertAdvisor, type Email, type InsertEmail, type Stat, type InsertStat } from "@shared/schema";
import { eq, desc, sql, count } from "drizzle-orm";

export interface IStorage {
  getAdvisors(): Promise<Advisor[]>;
  getAdvisor(id: number): Promise<Advisor | undefined>;
  getAdvisorBySlug(slug: string): Promise<Advisor | undefined>;
  createAdvisor(advisor: InsertAdvisor): Promise<Advisor>;
  updateAdvisor(id: number, data: Partial<InsertAdvisor>): Promise<Advisor | undefined>;
  toggleAdvisorActive(id: number, active: boolean): Promise<Advisor | undefined>;
  deleteAdvisor(id: number): Promise<boolean>;

  getEmails(): Promise<(Email & { advisorName: string })[]>;
  createEmail(email: InsertEmail): Promise<Email>;
  updateEmailGrade(id: number, grade: string): Promise<Email | undefined>;
  deleteEmail(id: number): Promise<boolean>;

  getDashboardStats(): Promise<{
    totalEmails: number;
    totalAccesses: number;
    totalReferrals: number;
    activeAdvisors: number;
  }>;
  getWeeklyActivity(): Promise<{ name: string; emails: number; accesses: number }[]>;
  recordStat(stat: InsertStat): Promise<Stat>;
}

export class DatabaseStorage implements IStorage {
  async getAdvisors(): Promise<Advisor[]> {
    return db.select().from(advisors).orderBy(desc(advisors.createdAt));
  }

  async getAdvisor(id: number): Promise<Advisor | undefined> {
    const [advisor] = await db.select().from(advisors).where(eq(advisors.id, id));
    return advisor;
  }

  async getAdvisorBySlug(slug: string): Promise<Advisor | undefined> {
    const [advisor] = await db.select().from(advisors).where(eq(advisors.profileSlug, slug));
    return advisor;
  }

  async createAdvisor(advisor: InsertAdvisor): Promise<Advisor> {
    const [created] = await db.insert(advisors).values(advisor).returning();
    return created;
  }

  async updateAdvisor(id: number, data: Partial<InsertAdvisor>): Promise<Advisor | undefined> {
    const [updated] = await db.update(advisors).set(data).where(eq(advisors.id, id)).returning();
    return updated;
  }

  async toggleAdvisorActive(id: number, active: boolean): Promise<Advisor | undefined> {
    const [updated] = await db.update(advisors).set({ active }).where(eq(advisors.id, id)).returning();
    return updated;
  }

  async deleteAdvisor(id: number): Promise<boolean> {
    const result = await db.delete(advisors).where(eq(advisors.id, id)).returning();
    return result.length > 0;
  }

  async getEmails(): Promise<(Email & { advisorName: string })[]> {
    const rows = await db
      .select({
        id: emails.id,
        advisorId: emails.advisorId,
        senderName: emails.senderName,
        senderEmail: emails.senderEmail,
        type: emails.type,
        grade: emails.grade,
        subject: emails.subject,
        body: emails.body,
        clientAge: emails.clientAge,
        clientIncome: emails.clientIncome,
        clientIndustry: emails.clientIndustry,
        clientPhone: emails.clientPhone,
        clientMarried: emails.clientMarried,
        clientChildren: emails.clientChildren,
        clientVehicle: emails.clientVehicle,
        clientProperty: emails.clientProperty,
        preferredContactTime: emails.preferredContactTime,
        servicesRequested: emails.servicesRequested,
        referrerName: emails.referrerName,
        referrerEmail: emails.referrerEmail,
        referrerPhone: emails.referrerPhone,
        referrerRelation: emails.referrerRelation,
        source: emails.source,
        receivedAt: emails.receivedAt,
        advisorName: advisors.name,
      })
      .from(emails)
      .leftJoin(advisors, eq(emails.advisorId, advisors.id))
      .orderBy(desc(emails.receivedAt));

    return rows.map((r) => ({
      ...r,
      advisorName: r.advisorName ?? "Unknown",
    }));
  }

  async createEmail(email: InsertEmail): Promise<Email> {
    const [created] = await db.insert(emails).values(email).returning();
    await db.insert(stats).values({ advisorId: email.advisorId, eventType: "email_received" });
    if (email.type === "Referral") {
      await db.insert(stats).values({ advisorId: email.advisorId, eventType: "referral_sent" });
    }
    return created;
  }

  async updateEmailGrade(id: number, grade: string): Promise<Email | undefined> {
    const [updated] = await db.update(emails).set({ grade }).where(eq(emails.id, id)).returning();
    return updated;
  }

  async deleteEmail(id: number): Promise<boolean> {
    const [deleted] = await db.delete(emails).where(eq(emails.id, id)).returning();
    return !!deleted;
  }

  async getDashboardStats() {
    const [emailCount] = await db.select({ value: count() }).from(emails);
    const [accessCount] = await db.select({ value: count() }).from(stats).where(eq(stats.eventType, "app_access"));
    const [referralCount] = await db.select({ value: count() }).from(stats).where(eq(stats.eventType, "referral_sent"));
    const [activeCount] = await db.select({ value: count() }).from(advisors).where(eq(advisors.active, true));

    return {
      totalEmails: emailCount.value,
      totalAccesses: accessCount.value,
      totalReferrals: referralCount.value,
      activeAdvisors: activeCount.value,
    };
  }

  async getWeeklyActivity() {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const result: { name: string; emails: number; accesses: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];

      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const [emailsDay] = await db
        .select({ value: count() })
        .from(emails)
        .where(sql`${emails.receivedAt} >= ${dayStart} AND ${emails.receivedAt} <= ${dayEnd}`);

      const [accessesDay] = await db
        .select({ value: count() })
        .from(stats)
        .where(sql`${stats.eventType} = 'app_access' AND ${stats.eventDate} >= ${dayStart} AND ${stats.eventDate} <= ${dayEnd}`);

      result.push({ name: dayName, emails: emailsDay.value, accesses: accessesDay.value });
    }

    return result;
  }

  async recordStat(stat: InsertStat): Promise<Stat> {
    const [created] = await db.insert(stats).values(stat).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();