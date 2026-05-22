import { db } from "./db";
import { advisors, advisorProfiles, emails, stats, loginAudit, clients, auditPii, clientConsent, clientDocuments, type Advisor, type InsertAdvisor, type AdvisorProfile, type InsertAdvisorProfile, type Email, type InsertEmail, type Stat, type InsertStat, type InsertLoginAudit, type Client, type InsertClient, type AuditPii, type InsertAuditPii, type ClientConsent, type InsertClientConsent, type ClientDocument, type InsertClientDocument } from "@shared/schema";
import { eq, desc, sql, count, and, isNull } from "drizzle-orm";
import { encryptString, decryptString } from "./encryption";

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
  updateEmailViewedByAdvisor(id: number): Promise<Email | undefined>;
  deleteEmail(id: number): Promise<boolean>;
  findDuplicateLead(advisorId: number, newId: number, phone?: string | null, email?: string | null): Promise<Email | undefined>;
  markEmailDuplicate(id: number, duplicateOfId: number): Promise<void>;
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
  // S7: split view counts by Primary vs Secondary. Slug attribution is encoded
  // in the eventType column as `app_access:<slug>` (no schema change). Legacy
  // rows that are just `app_access` (pre-attribution) fold into Primary.
  getAdvisorViewCountsSplit(advisorId: number, primarySlug: string, secondarySlugs: string[]): Promise<{ primary: number; secondary: number; total: number }>;
  // S7: time series of views over the last `days` days, split P vs S, in
  // chronological order so the chart can render directly.
  getAdvisorViewSeries(advisorId: number, primarySlug: string, secondarySlugs: string[], days: number): Promise<{ name: string; primary: number; secondary: number }[]>;
  recordStat(stat: InsertStat): Promise<Stat>;
  // Task #24 — login audit. Fire-and-forget from login routes.
  recordLoginAudit(entry: InsertLoginAudit): Promise<void>;

  // Task #25 — Client / PII methods. Every method is advisorId-scoped: passing
  // a different advisorId than the row's owner returns undefined / refuses to
  // mutate. Plaintext PII fields (idNumber, bankAccount, bankBranch, taxNumber)
  // are encrypted on write and decrypted on read by these methods — callers
  // never see the *_enc columns directly.
  listClients(advisorId: number): Promise<ClientWithPlaintext[]>;
  getClient(advisorId: number, id: number): Promise<ClientWithPlaintext | undefined>;
  createClient(advisorId: number, data: InsertClient & { idNumber?: string | null; bankAccount?: string | null; bankBranch?: string | null; taxNumber?: string | null }): Promise<ClientWithPlaintext>;
  updateClient(advisorId: number, id: number, data: Partial<InsertClient> & { idNumber?: string | null; bankAccount?: string | null; bankBranch?: string | null; taxNumber?: string | null }): Promise<ClientWithPlaintext | undefined>;
  eraseClient(advisorId: number, id: number, erasedBy: string): Promise<boolean>;

  // Task #26 — Paystack subscription lookups.
  findAdvisorByPaystackCustomerCode(code: string): Promise<Advisor | undefined>;
  findAdvisorByEmail(email: string): Promise<Advisor | undefined>;
  findTrialsExpiringSoon(daysAhead: number): Promise<Advisor[]>;

  recordAuditPii(entry: InsertAuditPii): Promise<void>;
  listAuditPii(opts?: { tableName?: string; rowId?: number; limit?: number }): Promise<AuditPii[]>;

  recordConsent(entry: InsertClientConsent): Promise<ClientConsent>;
  listConsentForClient(advisorId: number, clientId: number): Promise<ClientConsent[]>;

  createClientDocument(entry: InsertClientDocument): Promise<ClientDocument>;
  getClientDocument(advisorId: number, id: number): Promise<ClientDocument | undefined>;
  listClientDocuments(advisorId: number, clientId: number): Promise<ClientDocument[]>;
  markDocumentErased(advisorId: number, id: number): Promise<void>;
}

// Client row with decrypted PII fields surfaced as plaintext. Returned by
// every storage method that reads a client — callers should treat these
// fields as sensitive (never log, never serialize to a public payload).
export interface ClientWithPlaintext extends Omit<Client, "idNumberEnc" | "bankAccountEnc" | "bankBranchEnc" | "taxNumberEnc"> {
  idNumber: string | null;
  bankAccount: string | null;
  bankBranch: string | null;
  taxNumber: string | null;
}

// Decrypt or throw. We deliberately do NOT swallow decrypt errors to null —
// returning null on a failed decrypt would silently hide PII after a key
// rotation or key-mismatch incident (the row looks "blank" instead of
// broken). Callers see a thrown DecryptError and surface a 500 so the
// operator notices immediately.
export class DecryptError extends Error {
  constructor(msg: string) { super(msg); this.name = "DecryptError"; }
}
function decryptOrThrow(blob: string | null | undefined): string | null {
  if (!blob) return null;
  try {
    return decryptString(blob);
  } catch (err) {
    throw new DecryptError(`[storage] PII decrypt failed: ${(err as Error).message}`);
  }
}

function toPlaintext(row: Client): ClientWithPlaintext {
  const { idNumberEnc, bankAccountEnc, bankBranchEnc, taxNumberEnc, ...rest } = row;
  return {
    ...rest,
    idNumber: decryptOrThrow(idNumberEnc),
    bankAccount: decryptOrThrow(bankAccountEnc),
    bankBranch: decryptOrThrow(bankBranchEnc),
    taxNumber: decryptOrThrow(taxNumberEnc),
  };
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
    // Secondary profile = fully independent. Every visibility toggle is sourced
    // from the secondary's OWN row in advisor_profiles, not from the primary
    // advisor row. Changing primary toggles must have zero effect on a secondary.
    // (Truly advisor-level fields like contact number, location, working hours
    // and showContactDetails still come from the parent advisor row.)
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
      // ── Visibility toggles: per-secondary, NOT inherited from primary ──
      showCallbackLink: (profile.profile as any).showCallbackLink,
      showReferralsLink: (profile.profile as any).showReferralsLink,
      showQrCode: (profile.profile as any).showQrCode,
      showHeader: (profile.profile as any).showHeader,
      showProfilePic: (profile.profile as any).showProfilePic,
      showIntro: (profile.profile as any).showIntro,
      showIndividualServices: (profile.profile as any).showIndividualServices,
      showCorporateServices: (profile.profile as any).showCorporateServices,
      showSocials: (profile.profile as any).showSocials,
      showAstute: (profile.profile as any).showAstute,
      showDocuments: (profile.profile as any).showDocuments,
      showComplimentaryWill: (profile.profile as any).showComplimentaryWill,
      showFinancialMedia: (profile.profile as any).showFinancialMedia,
      showMoneywebFeed: (profile.profile as any).showMoneywebFeed,
      showSecondNews: (profile.profile as any).showSecondNews,
      showForex: (profile.profile as any).showForex,
      showFunFacts: (profile.profile as any).showFunFacts,
      showLiberty: (profile.profile as any).showLiberty,
      showStanlib: (profile.profile as any).showStanlib,
      showSigninghub: (profile.profile as any).showSigninghub,
      // W1 T3: secondary profiles get their own My Email toggle too.
      showMyEmail: (profile.profile as any).showMyEmail,
      showTools: (profile.profile as any).showTools,
      showToolTax: (profile.profile as any).showToolTax,
      showToolExchange: (profile.profile as any).showToolExchange,
      showToolCompound: (profile.profile as any).showToolCompound,
      showToolPension: (profile.profile as any).showToolPension,
      showToolCgt: (profile.profile as any).showToolCgt,
      showToolVehicle: (profile.profile as any).showToolVehicle,
      showToolReality: (profile.profile as any).showToolReality,
      showToolLatte: (profile.profile as any).showToolLatte,
      // M6 + W1 review-fix: these per-secondary toggles were stored in the DB
      // and writable from the editor, but the slug mapper wasn't including them
      // — secondary profiles fell back to undefined and didn't render correctly.
      showToolBond: (profile.profile as any).showToolBond,
      showToolEmergency: (profile.profile as any).showToolEmergency,
      showToolLifeCover: (profile.profile as any).showToolLifeCover,
      showToolDebt: (profile.profile as any).showToolDebt,
      showInteractive: (profile.profile as any).showInteractive,
      rotateInteractiveTools: (profile.profile as any).rotateInteractiveTools,
      showShowpieceSqueeze: (profile.profile as any).showShowpieceSqueeze,
      showShowpieceTaxBite: (profile.profile as any).showShowpieceTaxBite,
      showShowpieceInflation: (profile.profile as any).showShowpieceInflation,
      showShowpieceWaiting: (profile.profile as any).showShowpieceWaiting,
      showEmergencyContacts: (profile.profile as any).showEmergencyContacts,
      // Task #29: per-secondary Public Profile Feature Suite toggles +
      // their config (instrument list + quote set). Must be mapped here so
      // a secondary slug renders its own settings, not the primary's.
      showTradingView: (profile.profile as any).showTradingView,
      tradingViewSymbols: (profile.profile as any).tradingViewSymbols,
      showDailyQuotes: (profile.profile as any).showDailyQuotes,
      dailyQuotesSet: (profile.profile as any).dailyQuotesSet,
      showCompoundCalc: (profile.profile as any).showCompoundCalc,
      showRetirementCalc: (profile.profile as any).showRetirementCalc,
      showFinancialCalendar: (profile.profile as any).showFinancialCalendar,
      // ── End per-secondary toggles ──
      facebookUrl: profile.profile.facebookUrl,
      instagramUrl: profile.profile.instagramUrl,
      youtubeUrl: profile.profile.youtubeUrl,
      astuteUrl: profile.profile.astuteUrl,
      documentsUrl: profile.profile.documentsUrl,
      qaUrl: profile.profile.qaUrl,
      financialsNewsUrl: profile.profile.financialsNewsUrl,
      financialsFunFactsUrl: profile.profile.financialsFunFactsUrl,
      financialsVideosUrl: profile.profile.financialsVideosUrl,
      profileSectionOrder: (profile.profile as any).profileSectionOrder,
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
    // Every new advisor gets a 14-day trial by default. Task #26 invariant:
    // trial_ends_at MUST be non-null on every row so the trial-expiry email
    // sweep (findTrialsExpiringSoon) can reason about expiry, and the gating
    // helpers (isPremiumActive / isBasicOrBetter) never hit the legacy-null
    // grandfather branch for fresh accounts. Caller can still override.
    const withTrial: InsertAdvisor = {
      ...advisor,
      trialEndsAt: (advisor as any).trialEndsAt ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    } as InsertAdvisor;
    const [created] = await db.insert(advisors).values(withTrial).returning();
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
        firstViewedAt: emails.firstViewedAt,
        lastViewedAt: emails.lastViewedAt,
        archivedAt: emails.archivedAt,
        duplicateOfId: emails.duplicateOfId,
        // Task #23 — grader gap fields. Must be selected here so CIV's typed
        // list includes them; otherwise the (Email & { advisorName }) row shape
        // is missing the new columns and TypeScript rejects the .map() result.
        howFound: emails.howFound,
        netWorthBracket: emails.netWorthBracket,
        biggestConcern: emails.biggestConcern,
        hasAdvisor: emails.hasAdvisor,
        existingAdvisorName: emails.existingAdvisorName,
        referralReason: emails.referralReason,
        hasWill: emails.hasWill,
        estateValueBracket: emails.estateValueBracket,
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
    // Maintain archivedAt as a derived timestamp of the Archive transition.
    // - moving INTO Archive sets archivedAt = now (only on transition, not re-archive)
    // - moving OUT of Archive clears archivedAt
    const [current] = await db.select().from(emails).where(eq(emails.id, id));
    if (!current) return undefined;
    const wasArchived = current.leadStatus === "Archive";
    const willBeArchived = leadStatus === "Archive";
    const patch: { leadStatus: string; archivedAt?: Date | null } = { leadStatus };
    if (willBeArchived && !wasArchived) patch.archivedAt = new Date();
    else if (!willBeArchived && wasArchived) patch.archivedAt = null;
    const [updated] = await db.update(emails).set(patch).where(eq(emails.id, id)).returning();
    return updated;
  }

  async updateEmailOpened(id: number): Promise<Email | undefined> {
    const [updated] = await db.update(emails).set({ lastOpenedAt: new Date() }).where(eq(emails.id, id)).returning();
    return updated;
  }

  async updateEmailViewedByAdvisor(id: number): Promise<Email | undefined> {
    // Set firstViewedAt only on the first advisor view; always bump lastViewedAt.
    const [current] = await db.select().from(emails).where(eq(emails.id, id));
    if (!current) return undefined;
    const now = new Date();
    const patch: { lastViewedAt: Date; firstViewedAt?: Date } = { lastViewedAt: now };
    if (!current.firstViewedAt) patch.firstViewedAt = now;
    const [updated] = await db.update(emails).set(patch).where(eq(emails.id, id)).returning();
    return updated;
  }

  async deleteEmail(id: number): Promise<boolean> {
    const [deleted] = await db.delete(emails).where(eq(emails.id, id)).returning();
    return !!deleted;
  }

  // W1 T9: Soft-warn duplicate lead detection.
  // Find the most recent prior lead for this advisor that matches on phone or
  // email (case-insensitive, ignoring blanks). Returns undefined if none found.
  // Caller is responsible for excluding the newly-inserted lead via newId.
  async findDuplicateLead(advisorId: number, newId: number, phone?: string | null, email?: string | null): Promise<Email | undefined> {
    const phoneClean = (phone || "").trim();
    const emailClean = (email || "").trim().toLowerCase();
    if (!phoneClean && !emailClean) return undefined;
    const conditions: any[] = [];
    if (phoneClean) conditions.push(sql`${emails.clientPhone} = ${phoneClean}`);
    if (emailClean) conditions.push(sql`lower(${emails.senderEmail}) = ${emailClean}`);
    const orClause = conditions.length === 1
      ? conditions[0]
      : sql`(${conditions[0]} OR ${conditions[1]})`;
    const [match] = await db
      .select()
      .from(emails)
      .where(sql`${emails.advisorId} = ${advisorId} AND ${emails.id} != ${newId} AND ${orClause}`)
      .orderBy(desc(emails.receivedAt))
      .limit(1);
    return match;
  }

  async markEmailDuplicate(id: number, duplicateOfId: number): Promise<void> {
    await db.update(emails).set({ duplicateOfId }).where(eq(emails.id, id));
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
    // S7: count ANY app_access event (legacy untagged + new `app_access:<slug>`).
    const result = await db
      .select({ cnt: count() })
      .from(stats)
      .where(sql`${stats.advisorId} = ${advisorId} AND (${stats.eventType} = 'app_access' OR ${stats.eventType} LIKE 'app_access:%')`);
    return result[0]?.cnt ?? 0;
  }

  async getAdvisorViewCountsSplit(advisorId: number, primarySlug: string, secondarySlugs: string[]): Promise<{ primary: number; secondary: number; total: number }> {
    // Group all app_access* events for this advisor by their full eventType,
    // then bucket into primary vs secondary. Legacy rows ("app_access" with no
    // suffix) and rows tagged with the primary slug count as primary; rows
    // tagged with any of the advisor's secondary slugs count as secondary.
    const rows = await db
      .select({ eventType: stats.eventType, cnt: count() })
      .from(stats)
      .where(sql`${stats.advisorId} = ${advisorId} AND (${stats.eventType} = 'app_access' OR ${stats.eventType} LIKE 'app_access:%')`)
      .groupBy(stats.eventType);
    const secondarySet = new Set(secondarySlugs);
    let primary = 0;
    let secondary = 0;
    for (const r of rows) {
      const c = Number(r.cnt) || 0;
      if (r.eventType === "app_access") { primary += c; continue; }
      const slug = r.eventType.slice("app_access:".length);
      if (secondarySet.has(slug)) secondary += c;
      else primary += c; // primary slug match OR unknown slug (treat as primary)
    }
    return { primary, secondary, total: primary + secondary };
  }

  async getAdvisorViewSeries(advisorId: number, primarySlug: string, secondarySlugs: string[], days: number): Promise<{ name: string; primary: number; secondary: number }[]> {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (days - 1));
    const rows = await db
      .select({ eventType: stats.eventType, day: sql<string>`to_char(${stats.eventDate}, 'YYYY-MM-DD')` })
      .from(stats)
      .where(sql`${stats.advisorId} = ${advisorId} AND (${stats.eventType} = 'app_access' OR ${stats.eventType} LIKE 'app_access:%') AND ${stats.eventDate} >= ${startDate}`);
    const secondarySet = new Set(secondarySlugs);
    const byDay: Record<string, { primary: number; secondary: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      byDay[key] = { primary: 0, secondary: 0 };
    }
    for (const r of rows) {
      const bucket = byDay[r.day];
      if (!bucket) continue;
      if (r.eventType === "app_access") { bucket.primary += 1; continue; }
      const slug = r.eventType.slice("app_access:".length);
      if (secondarySet.has(slug)) bucket.secondary += 1;
      else bucket.primary += 1;
    }
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return Object.entries(byDay).map(([key, v]) => {
      const d = new Date(key + "T00:00:00");
      return { name: dayNames[d.getDay()], primary: v.primary, secondary: v.secondary };
    });
  }

  async recordStat(stat: InsertStat): Promise<Stat> {
    const [created] = await db.insert(stats).values(stat).returning();
    return created;
  }

  // Task #24 — login audit. Swallows errors so a logging failure never blocks
  // an actual login response from going out.
  async recordLoginAudit(entry: InsertLoginAudit): Promise<void> {
    try {
      await db.insert(loginAudit).values(entry);
    } catch (err) {
      console.error("[login_audit] insert failed:", err);
    }
  }

  // ── Task #25: Clients ────────────────────────────────────────────────────
  // Per-advisor isolation enforced HERE at the storage layer, not in routes.
  // Every read/write is `WHERE advisor_id = $advisorId AND id = $id`, so even
  // a route handler that forgets its auth check cannot leak across advisors.
  async listClients(advisorId: number): Promise<ClientWithPlaintext[]> {
    const rows = await db
      .select()
      .from(clients)
      .where(and(eq(clients.advisorId, advisorId), isNull(clients.erasedAt)))
      .orderBy(desc(clients.createdAt));
    return rows.map(toPlaintext);
  }

  async getClient(advisorId: number, id: number): Promise<ClientWithPlaintext | undefined> {
    const [row] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.advisorId, advisorId)));
    return row ? toPlaintext(row) : undefined;
  }

  async createClient(advisorId: number, data: any): Promise<ClientWithPlaintext> {
    const insertRow: any = {
      advisorId,
      sourceLeadId: data.sourceLeadId ?? null,
      name: data.name,
      email: data.email ?? null,
      phone: data.phone ?? null,
      notes: data.notes ?? null,
      idNumberEnc: data.idNumber ? encryptString(data.idNumber) : null,
      bankAccountEnc: data.bankAccount ? encryptString(data.bankAccount) : null,
      bankBranchEnc: data.bankBranch ? encryptString(data.bankBranch) : null,
      taxNumberEnc: data.taxNumber ? encryptString(data.taxNumber) : null,
    };
    const [created] = await db.insert(clients).values(insertRow).returning();
    return toPlaintext(created);
  }

  async updateClient(advisorId: number, id: number, data: any): Promise<ClientWithPlaintext | undefined> {
    const existing = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.advisorId, advisorId)));
    if (existing.length === 0) return undefined;
    const patch: any = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.email !== undefined) patch.email = data.email;
    if (data.phone !== undefined) patch.phone = data.phone;
    if (data.notes !== undefined) patch.notes = data.notes;
    // For encrypted fields: undefined = leave alone, null/'' = clear, value = re-encrypt.
    if (data.idNumber !== undefined) patch.idNumberEnc = data.idNumber ? encryptString(data.idNumber) : null;
    if (data.bankAccount !== undefined) patch.bankAccountEnc = data.bankAccount ? encryptString(data.bankAccount) : null;
    if (data.bankBranch !== undefined) patch.bankBranchEnc = data.bankBranch ? encryptString(data.bankBranch) : null;
    if (data.taxNumber !== undefined) patch.taxNumberEnc = data.taxNumber ? encryptString(data.taxNumber) : null;
    const [updated] = await db
      .update(clients)
      .set(patch)
      .where(and(eq(clients.id, id), eq(clients.advisorId, advisorId)))
      .returning();
    return updated ? toPlaintext(updated) : undefined;
  }

  // Right-to-erasure: nukes encrypted PII columns, marks the row as erased,
  // wipes the document files on disk (caller's responsibility — we just mark
  // the document rows). The shell row + erased_at tombstone stays so the
  // audit trail in audit_pii continues to resolve `row_id` lookups.
  async eraseClient(advisorId: number, id: number, erasedBy: string): Promise<boolean> {
    const [erased] = await db
      .update(clients)
      .set({
        name: "[ERASED]",
        email: null,
        phone: null,
        notes: null,
        idNumberEnc: null,
        bankAccountEnc: null,
        bankBranchEnc: null,
        taxNumberEnc: null,
        erasedAt: new Date(),
        erasedBy,
      })
      .where(and(eq(clients.id, id), eq(clients.advisorId, advisorId), isNull(clients.erasedAt)))
      .returning();
    return !!erased;
  }

  // ── Task #25: Audit (append-only) ────────────────────────────────────────
  async recordAuditPii(entry: InsertAuditPii): Promise<void> {
    try {
      await db.insert(auditPii).values(entry);
    } catch (err) {
      console.error("[audit_pii] insert failed:", err);
    }
  }

  async listAuditPii(opts: { tableName?: string; rowId?: number; limit?: number } = {}): Promise<AuditPii[]> {
    const limit = Math.min(opts.limit ?? 200, 1000);
    const where: any[] = [];
    if (opts.tableName) where.push(eq(auditPii.tableName, opts.tableName));
    if (opts.rowId !== undefined) where.push(eq(auditPii.rowId, opts.rowId));
    const q = db.select().from(auditPii).orderBy(desc(auditPii.createdAt)).limit(limit);
    if (where.length === 0) return q;
    return q.where(where.length === 1 ? where[0] : and(...where));
  }

  // ── Task #25: Consent ────────────────────────────────────────────────────
  // Same ownership invariant: only allow a consent row for a client the
  // supplied advisorId actually owns.
  async recordConsent(entry: InsertClientConsent): Promise<ClientConsent> {
    const [parent] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.id, entry.clientId), eq(clients.advisorId, entry.advisorId)));
    if (!parent) throw new Error("[storage] recordConsent: client not owned by advisor");
    const [row] = await db.insert(clientConsent).values(entry).returning();
    return row;
  }

  async listConsentForClient(advisorId: number, clientId: number): Promise<ClientConsent[]> {
    return db
      .select()
      .from(clientConsent)
      .where(and(eq(clientConsent.clientId, clientId), eq(clientConsent.advisorId, advisorId)))
      .orderBy(desc(clientConsent.consentedAt));
  }

  // ── Task #25: Client documents ───────────────────────────────────────────
  // Ownership invariant enforced HERE: we verify the parent client row belongs
  // to the supplied advisorId before inserting the document. Same belt-and-
  // braces pattern as the clients methods — a route-handler oversight cannot
  // attach a document to a foreign advisor's client.
  async createClientDocument(entry: InsertClientDocument): Promise<ClientDocument> {
    const [parent] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.id, entry.clientId), eq(clients.advisorId, entry.advisorId)));
    if (!parent) throw new Error("[storage] createClientDocument: client not owned by advisor");
    const [row] = await db.insert(clientDocuments).values(entry).returning();
    return row;
  }

  async getClientDocument(advisorId: number, id: number): Promise<ClientDocument | undefined> {
    const [row] = await db
      .select()
      .from(clientDocuments)
      .where(and(eq(clientDocuments.id, id), eq(clientDocuments.advisorId, advisorId)));
    return row;
  }

  async listClientDocuments(advisorId: number, clientId: number): Promise<ClientDocument[]> {
    return db
      .select()
      .from(clientDocuments)
      .where(and(
        eq(clientDocuments.clientId, clientId),
        eq(clientDocuments.advisorId, advisorId),
        isNull(clientDocuments.erasedAt),
      ))
      .orderBy(desc(clientDocuments.createdAt));
  }

  // Advisor-scoped to keep the storage-layer isolation invariant.
  async markDocumentErased(advisorId: number, id: number): Promise<void> {
    await db
      .update(clientDocuments)
      .set({ erasedAt: new Date() })
      .where(and(eq(clientDocuments.id, id), eq(clientDocuments.advisorId, advisorId)));
  }

  // Task #26 — Paystack subscription helpers.
  async findAdvisorByPaystackCustomerCode(code: string): Promise<Advisor | undefined> {
    const [row] = await db.select().from(advisors).where(eq(advisors.paystackCustomerCode, code));
    return row;
  }

  async findAdvisorByEmail(email: string): Promise<Advisor | undefined> {
    const [row] = await db.select().from(advisors).where(eq(advisors.email, email));
    return row;
  }

  // Advisors whose trial ends within `daysAhead` and who have not yet been
  // emailed. Used by the daily trial-expiry cron in server/index.ts.
  async findTrialsExpiringSoon(daysAhead: number): Promise<Advisor[]> {
    const cutoff = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    return db.select().from(advisors).where(sql`
      ${advisors.subscriptionTier} = 'trial'
      AND ${advisors.subscriptionStatus} = 'trialing'
      AND ${advisors.trialEndsAt} IS NOT NULL
      AND ${advisors.trialEndsAt} <= ${cutoff}
      AND ${advisors.trialEndsAt} > NOW()
      AND ${advisors.trialExpiryEmailSentAt} IS NULL
      AND ${advisors.active} = true
    `);
  }
}

export const storage = new DatabaseStorage();