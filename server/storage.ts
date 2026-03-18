import { db } from "./db";
import { advisors, advisorProfiles, emails, stats, type Advisor, type InsertAdvisor, type AdvisorProfile, type InsertAdvisorProfile, type Email, type InsertEmail, type Stat, type InsertStat } from "@shared/schema";
import { eq, desc, sql, count } from "drizzle-orm";

export interface IStorage {
  getAdvisors(): Promise<Advisor[]>;
  getAdvisor(id: number): Promise<Advisor | undefined>;
  getAdvisorBySlug(slug: string): Promise<Advisor | undefined>;
  createAdvisor(advisor: InsertAdvisor): Promise<Advisor>;
  updateAdvisor(id: number, data: Partial<InsertAdvisor>): Promise<Advisor | undefined>;
  toggleAdvisorActive(id: number, active: boolean): Promise<Advisor | undefined>;
  deleteAdvisor(id: number): Promise<boolean>;

  getAdvisorProfiles(advisorId: number): Promise<AdvisorProfile[]>;
  getAdvisorProfileCounts(): Promise<Record<number, number>>;
  createAdvisorProfile(profile: InsertAdvisorProfile): Promise<AdvisorProfile>;
  updateAdvisorProfile(id: number, data: Partial<InsertAdvisorProfile>): Promise<AdvisorProfile | undefined>;
  deleteAdvisorProfile(id: number): Promise<boolean>;

  getEmails(): Promise<(Email & { advisorName: string })[]>;
  getEmailsByAdvisor(advisorId: number): Promise<Email[]>;
  createEmail(email: InsertEmail): Promise<Email>;
  updateEmailGrade(id: number, grade: string): Promise<Email | undefined>;
  deleteEmail(id: number): Promise<boolean>;
  getAdvisorStats(advisorId: number): Promise<{ totalLeads: number; totalReferrals: number; totalCallbacks: number; weeklyActivity: { name: string; leads: number }[] }>;

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
    if (advisor) return advisor;
    const [profile] = await db
      .select({ profile: advisorProfiles, advisor: advisors })
      .from(advisorProfiles)
      .innerJoin(advisors, eq(advisorProfiles.advisorId, advisors.id))
      .where(eq(advisorProfiles.profileSlug, slug));
    if (!profile) return undefined;
    return {
      ...profile.advisor,
      profileSlug: profile.profile.profileSlug,
      title: profile.profile.title ?? profile.advisor.title,
      bio: profile.profile.bio ?? profile.advisor.bio,
      bioOption: profile.profile.bioOption ?? profile.advisor.bioOption,
      customBio: profile.profile.customBio ?? profile.advisor.customBio,
      individualServices: profile.profile.individualServices ?? profile.advisor.individualServices,
      corporateServices: profile.profile.corporateServices ?? profile.advisor.corporateServices,
      theme: profile.profile.theme ?? profile.advisor.theme,
      themeColor: profile.profile.themeColor ?? profile.advisor.themeColor,
      profilePicUrl: profile.profile.profilePicUrl ?? profile.advisor.profilePicUrl,
      linkedinUrl: profile.profile.linkedinUrl ?? profile.advisor.linkedinUrl,
      websiteUrl: profile.profile.websiteUrl ?? profile.advisor.websiteUrl,
      showCallbackLink: profile.profile.showCallbackLink ?? profile.advisor.showCallbackLink,
      showReferralsLink: profile.profile.showReferralsLink ?? profile.advisor.showReferralsLink,
      showQrCode: profile.profile.showQrCode ?? profile.advisor.showQrCode,
      active: profile.profile.active,
    };
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
    await db.delete(advisorProfiles).where(eq(advisorProfiles.advisorId, id));
    const result = await db.delete(advisors).where(eq(advisors.id, id)).returning();
    return result.length > 0;
  }

  async getAdvisorProfiles(advisorId: number): Promise<AdvisorProfile[]> {
    return db.select().from(advisorProfiles).where(eq(advisorProfiles.advisorId, advisorId)).orderBy(advisorProfiles.createdAt);
  }

  async createAdvisorProfile(profile: InsertAdvisorProfile): Promise<AdvisorProfile> {
    const [created] = await db.insert(advisorProfiles).values(profile).returning();
    return created;
  }

  async updateAdvisorProfile(id: number, data: Partial<InsertAdvisorProfile>): Promise<AdvisorProfile | undefined> {
    const [updated] = await db.update(advisorProfiles).set(data).where(eq(advisorProfiles.id, id)).returning();
    return updated;
  }

  async deleteAdvisorProfile(id: number): Promise<boolean> {
    const result = await db.delete(advisorProfiles).where(eq(advisorProfiles.id, id)).returning();
    return result.length > 0;
  }

  async getAdvisorProfileCounts(): Promise<Record<number, number>> {
    const rows = await db
      .select({ advisorId: advisorProfiles.advisorId, cnt: count() })
      .from(advisorProfiles)
      .groupBy(advisorProfiles.advisorId);
    return Object.fromEntries(rows.map((r) => [r.advisorId, Number(r.cnt)]));
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

  async getEmailsByAdvisor(advisorId: number): Promise<Email[]> {
    return db.select().from(emails).where(eq(emails.advisorId, advisorId)).orderBy(desc(emails.receivedAt));
  }

  async getAdvisorStats(advisorId: number): Promise<{ totalLeads: number; totalReferrals: number; totalCallbacks: number; weeklyActivity: { name: string; leads: number }[] }> {
    const [totalLeads] = await db.select({ value: count() }).from(emails).where(eq(emails.advisorId, advisorId));
    const [totalReferrals] = await db.select({ value: count() }).from(emails).where(sql`${emails.advisorId} = ${advisorId} AND ${emails.type} = 'Referral'`);
    const [totalCallbacks] = await db.select({ value: count() }).from(emails).where(sql`${emails.advisorId} = ${advisorId} AND ${emails.type} = 'Call Back'`);

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyActivity: { name: string; leads: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
      const [leadsDay] = await db.select({ value: count() }).from(emails).where(
        sql`${emails.advisorId} = ${advisorId} AND ${emails.receivedAt} >= ${dayStart} AND ${emails.receivedAt} <= ${dayEnd}`
      );
      weeklyActivity.push({ name: days[d.getDay()], leads: leadsDay.value });
    }

    return { totalLeads: totalLeads.value, totalReferrals: totalReferrals.value, totalCallbacks: totalCallbacks.value, weeklyActivity };
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