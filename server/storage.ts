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
  getEmailById(id: number): Promise<Email | undefined>;
  getEmailsByAdvisor(advisorId: number): Promise<Email[]>;
  createEmail(email: InsertEmail): Promise<Email>;
  updateEmailGrade(id: number, grade: string): Promise<Email | undefined>;
  updateEmailStatus(id: number, leadStatus: string): Promise<Email | undefined>;
  updateEmailOpened(id: number): Promise<Email | undefined>;
  deleteEmail(id: number): Promise<boolean>;
  getAdvisorStats(advisorId: number): Promise<{
    totalLeads: number;
    totalReferrals: number;
    totalCallbacks: number;
    totalWillRequests: number;
    weeklyActivity: { name: string; leads: number }[];
    gradeBreakdown: { grade: string; count: number }[];
    profileBreakdown: { slug: string; count: number }[];
    overdueCount: number;
  }>;

  getDashboardStats(): Promise<{
    totalEmails: number;
    totalAccesses: number;
    totalReferrals: number;
    activeAdvisors: number;
  }>;
  getWeeklyActivity(days?: number): Promise<{ name: string; emails: number; accesses: number }[]>;
  getLeadBreakdown(): Promise<{ typeBreakdown: { type: string; count: number }[]; gradeBreakdown: { grade: string; count: number }[] }>;
  getAdvisorViewCount(advisorId: number): Promise<number>;
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
    // Secondary profiles are FULLY INDEPENDENT from the primary advisor.
    // Only true advisor-level fields (identity, contact, account, auth) come from the
    // advisor row via the spread. All per-profile content is read directly from the
    // advisor_profiles row — no nullish fallback to the primary's values.
    return {
      ...profile.advisor,
      profileSlug: profile.profile.profileSlug,
      title: profile.profile.title,
      bio: profile.profile.bio,
      bioOption: profile.profile.bioOption,
      customBio: profile.profile.customBio,
      individualServices: profile.profile.individualServices,
      corporateServices: profile.profile.corporateServices,
      theme: profile.profile.theme,
      themeColor: profile.profile.themeColor,
      profilePicUrl: profile.profile.profilePicUrl,
      linkedinUrl: profile.profile.linkedinUrl,
      websiteUrl: profile.profile.websiteUrl,
      showCallbackLink: profile.profile.showCallbackLink,
      showReferralsLink: profile.profile.showReferralsLink,
      showQrCode: profile.profile.showQrCode,
      showHeader: profile.profile.showHeader,
      showProfilePic: profile.profile.showProfilePic,
      showIntro: profile.profile.showIntro,
      showIndividualServices: profile.profile.showIndividualServices,
      showCorporateServices: profile.profile.showCorporateServices,
      showSocials: profile.profile.showSocials,
      facebookUrl: profile.profile.facebookUrl,
      instagramUrl: profile.profile.instagramUrl,
      youtubeUrl: profile.profile.youtubeUrl,
      astuteUrl: profile.profile.astuteUrl,
      documentsUrl: profile.profile.documentsUrl,
      qaUrl: profile.profile.qaUrl,
      financialsNewsUrl: profile.profile.financialsNewsUrl,
      financialsFunFactsUrl: profile.profile.financialsFunFactsUrl,
      financialsVideosUrl: profile.profile.financialsVideosUrl,
      showAstute: profile.profile.showAstute,
      showDocuments: profile.profile.showDocuments,
      showComplimentaryWill: profile.profile.showComplimentaryWill,
      showFinancialMedia: profile.profile.showFinancialMedia,
      showMoneywebFeed: (profile.profile as any).showMoneywebFeed,
      showTools: profile.profile.showTools,
      profileSectionOrder: (profile.profile as any).profileSectionOrder,
      showToolTax: profile.profile.showToolTax,
      showToolExchange: profile.profile.showToolExchange,
      showToolCompound: profile.profile.showToolCompound,
      showToolPension: profile.profile.showToolPension,
      showToolCgt: profile.profile.showToolCgt,
      showToolVehicle: profile.profile.showToolVehicle,
      showToolReality: (profile.profile as any).showToolReality,
      showToolLatte: (profile.profile as any).showToolLatte,
      showInteractive: (profile.profile as any).showInteractive,
      showShowpieceSqueeze: (profile.profile as any).showShowpieceSqueeze,
      showShowpieceTaxBite: (profile.profile as any).showShowpieceTaxBite,
      showEmergencyContacts: (profile.profile as any).showEmergencyContacts,
      patternOpacity: profile.profile.patternOpacity,
      nickname: (profile.profile as any).nickname,
      profileDescription: (profile.profile as any).profileDescription,
      backgroundStyle: profile.profile.backgroundStyle,
      // Truly advisor-level (no per-profile column on advisor_profiles):
      contactNumber: profile.advisor.contactNumber,
      location: profile.advisor.location,
      workingHours: profile.advisor.workingHours,
      showContactDetails: profile.advisor.showContactDetails,
      active: profile.profile.active,
    };
  }

  async createAdvisor(advisor: InsertAdvisor): Promise<Advisor> {
    const [created] = await db.insert(advisors).values(advisor).returning();
    return created;
  }

  async updateAdvisor(id: number, data: Partial<InsertAdvisor>): Promise<Advisor | undefined> {
    // Updates touch ONLY the advisors row (the primary profile's content).
    // Secondary profiles (rows in advisor_profiles) are fully independent and are
    // NOT synced — editing the primary must never leak into a secondary.
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
        leadStatus: emails.leadStatus,
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
        sourceProfileSlug: emails.sourceProfileSlug,
        leadScore: emails.leadScore,
        leadTemperature: emails.leadTemperature,
        gradeBreakdown: emails.gradeBreakdown,
        receivedAt: emails.receivedAt,
        lastOpenedAt: emails.lastOpenedAt,
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

  async getEmailById(id: number): Promise<Email | undefined> {
    const [email] = await db.select().from(emails).where(eq(emails.id, id));
    return email;
  }

  async getEmailsByAdvisor(advisorId: number): Promise<Email[]> {
    return db.select().from(emails).where(eq(emails.advisorId, advisorId)).orderBy(desc(emails.receivedAt));
  }

  async getAdvisorStats(advisorId: number) {
    const [totalLeads] = await db.select({ value: count() }).from(emails).where(eq(emails.advisorId, advisorId));
    const [totalReferrals] = await db.select({ value: count() }).from(emails).where(sql`${emails.advisorId} = ${advisorId} AND ${emails.type} = 'Referral'`);
    const [totalCallbacks] = await db.select({ value: count() }).from(emails).where(sql`${emails.advisorId} = ${advisorId} AND ${emails.type} = 'Call Back'`);
    const [totalWillRequests] = await db.select({ value: count() }).from(emails).where(sql`${emails.advisorId} = ${advisorId} AND ${emails.type} = 'Will Request'`);

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

    // Grade distribution — group by grade, treat null as "Silver" (matches column default).
    const gradeRows = await db
      .select({ grade: emails.grade, value: count() })
      .from(emails)
      .where(eq(emails.advisorId, advisorId))
      .groupBy(emails.grade);
    const gradeBreakdown = gradeRows.map(r => ({ grade: r.grade || "Silver", count: r.value }));

    // Profile attribution — group by sourceProfileSlug. Null slugs (legacy leads,
    // pre-attribution) are returned as an empty string so the route layer can fold
    // them into the primary slug bucket.
    const profileRows = await db
      .select({ slug: emails.sourceProfileSlug, value: count() })
      .from(emails)
      .where(eq(emails.advisorId, advisorId))
      .groupBy(emails.sourceProfileSlug);
    const profileBreakdown = profileRows.map(r => ({ slug: r.slug || "", count: r.value }));

    // Inbox health — leads still flagged "Need to Contact" that arrived more than 7 days ago.
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const [overdue] = await db.select({ value: count() }).from(emails).where(
      sql`${emails.advisorId} = ${advisorId} AND ${emails.leadStatus} = 'Need to Contact' AND ${emails.receivedAt} < ${sevenDaysAgo}`
    );

    return {
      totalLeads: totalLeads.value,
      totalReferrals: totalReferrals.value,
      totalCallbacks: totalCallbacks.value,
      totalWillRequests: totalWillRequests.value,
      weeklyActivity,
      gradeBreakdown,
      profileBreakdown,
      overdueCount: overdue.value,
    };
  }

  async createEmail(email: InsertEmail & { receivedAt?: Date }): Promise<Email> {
    const values: any = { ...email };
    if (email.receivedAt) values.receivedAt = email.receivedAt;
    const [created] = await db.insert(emails).values(values).returning();
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

  async updateEmailGrading(
    id: number,
    fields: { grade: string; leadScore: number; leadTemperature: string; gradeBreakdown: string }
  ): Promise<Email | undefined> {
    const [updated] = await db.update(emails).set(fields).where(eq(emails.id, id)).returning();
    return updated;
  }

  async updateEmailStatus(id: number, leadStatus: string): Promise<Email | undefined> {
    const [updated] = await db.update(emails).set({ leadStatus }).where(eq(emails.id, id)).returning();
    return updated;
  }

  async updateEmailOpened(id: number): Promise<Email | undefined> {
    const [updated] = await db.update(emails).set({ lastOpenedAt: new Date() }).where(eq(emails.id, id)).returning();
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

  async getWeeklyActivity(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const emailsByDay = await db
      .select({
        dateStr: sql<string>`to_char(${emails.receivedAt}, 'YYYY-MM-DD')`,
        cnt: count(),
      })
      .from(emails)
      .where(sql`${emails.receivedAt} >= ${startDate}`)
      .groupBy(sql`to_char(${emails.receivedAt}, 'YYYY-MM-DD')`);

    const accessesByDay = await db
      .select({
        dateStr: sql<string>`to_char(${stats.eventDate}, 'YYYY-MM-DD')`,
        cnt: count(),
      })
      .from(stats)
      .where(sql`${stats.eventType} = 'app_access' AND ${stats.eventDate} >= ${startDate}`)
      .groupBy(sql`to_char(${stats.eventDate}, 'YYYY-MM-DD')`);

    const emailMap = new Map(emailsByDay.map(r => [r.dateStr, r.cnt]));
    const accessMap = new Map(accessesByDay.map(r => [r.dateStr, r.cnt]));

    const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const result: { name: string; emails: number; accesses: number }[] = [];

    if (days <= 30) {
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const name = days <= 7
          ? DAY_NAMES[d.getDay()]
          : `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
        result.push({ name, emails: emailMap.get(dateStr) ?? 0, accesses: accessMap.get(dateStr) ?? 0 });
      }
    } else {
      for (let w = 12; w >= 0; w--) {
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - w * 7);
        weekEnd.setHours(23, 59, 59, 999);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);

        let emailCount = 0;
        let accessCount = 0;
        const cur = new Date(weekStart);
        while (cur <= weekEnd) {
          const ds = cur.toISOString().slice(0, 10);
          emailCount += emailMap.get(ds) ?? 0;
          accessCount += accessMap.get(ds) ?? 0;
          cur.setDate(cur.getDate() + 1);
        }

        result.push({
          name: `${weekStart.getDate()} ${MONTH_NAMES[weekStart.getMonth()]}`,
          emails: emailCount,
          accesses: accessCount,
        });
      }
    }

    return result;
  }

  async getLeadBreakdown() {
    const typeRows = await db
      .select({ type: emails.type, cnt: count() })
      .from(emails)
      .groupBy(emails.type);

    const gradeRows = await db
      .select({ grade: emails.grade, cnt: count() })
      .from(emails)
      .groupBy(emails.grade);

    return {
      typeBreakdown: typeRows.map(r => ({ type: r.type, count: r.cnt })),
      gradeBreakdown: gradeRows.map(r => ({ grade: r.grade ?? "Unknown", count: r.cnt })),
    };
  }

  async getAdvisorViewCount(advisorId: number): Promise<number> {
    const result = await db
      .select({ cnt: count() })
      .from(stats)
      .where(sql`${stats.advisorId} = ${advisorId} AND ${stats.eventType} = 'app_access'`);
    return result[0]?.cnt ?? 0;
  }

  async recordStat(stat: InsertStat): Promise<Stat> {
    const [created] = await db.insert(stats).values(stat).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();