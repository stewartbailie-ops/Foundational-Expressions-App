import { useState } from "react";

export default function LegalPage({ section }: { section?: "privacy" | "terms" | "data-rights" }) {
  const activeSection = section ?? "privacy";

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-5 flex items-center gap-4">
        <a href="/" className="text-white/40 hover:text-white text-sm transition-colors">
          ← Advisory Connect
        </a>
        <span className="text-white/20">|</span>
        <span className="text-white/60 text-sm">Legal</span>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Tab switcher */}
        <div className="flex gap-2 mb-10">
          <a
            href="/privacy-policy"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSection === "privacy"
                ? "bg-white text-black"
                : "bg-white/10 text-white/60 hover:bg-white/15"
            }`}
          >
            Privacy Policy
          </a>
          <a
            href="/terms"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSection === "terms"
                ? "bg-white text-black"
                : "bg-white/10 text-white/60 hover:bg-white/15"
            }`}
          >
            Terms of Service
          </a>
          <a
            href="/data-rights"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSection === "data-rights"
                ? "bg-white text-black"
                : "bg-white/10 text-white/60 hover:bg-white/15"
            }`}
          >
            Data Rights (POPIA)
          </a>
        </div>

        {activeSection === "privacy" && <PrivacyPolicy />}
        {activeSection === "terms" && <TermsOfService />}
        {activeSection === "data-rights" && <DataRightsForm />}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-white mb-3 border-b border-white/10 pb-2">{title}</h2>
      <div className="space-y-3 text-white/70 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

function PrivacyPolicy() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-1">Privacy Policy</h1>
      <p className="text-white/40 text-sm mb-10">Advisory Connect (Pty) Ltd — Last Updated: 27 April 2026</p>

      <Section title="1. Who We Are">
        <p>
          Advisory Connect (Pty) Ltd ("Advisory Connect", "we", "us") operates the platform at{" "}
          <strong className="text-white">advisoryconnect.pro</strong>, a digital marketplace connecting
          financial advisors with prospective clients in South Africa.
        </p>
        <p>
          <strong className="text-white">POPIA Information Officer:</strong> The Director, Advisory Connect (Pty) Ltd —{" "}
          <a href="mailto:support@advisoryconnect.pro" className="text-white underline">
            support@advisoryconnect.pro
          </a>
        </p>
      </Section>

      <Section title="2. What Data We Collect">
        <p>
          <strong className="text-white">From prospective clients (form submissions):</strong> Name,
          email address, phone number, age, industry, income bracket, and any details voluntarily
          provided in callback requests, referral forms, or Will enquiry forms.
        </p>
        <p>
          <strong className="text-white">From advisors:</strong> Name, professional title, FAIS
          registration details, profile photo, biography, contact information, and service
          preferences.
        </p>
        <p>
          <strong className="text-white">Device & usage data:</strong> Browser type, approximate
          location (country/city), pages visited, and interaction timestamps — collected to improve
          platform performance.
        </p>
      </Section>

      <Section title="3. How We Use Your Data">
        <ul className="list-disc pl-5 space-y-1">
          <li>Route referral and callback submissions to the relevant financial advisor</li>
          <li>Enable advisors to manage and respond to leads via their control panel</li>
          <li>Send transactional emails (via SendGrid) confirming form submissions</li>
          <li>Maintain platform security and prevent abuse</li>
          <li>Comply with legal obligations under POPIA and applicable South African law</li>
        </ul>
      </Section>

      <Section title="4. The 90-Day Lead Protection Commitment">
        <p>
          Advisory Connect operates a master control panel through which all referral, callback, and
          enquiry submissions flow before being assigned to the relevant advisor's inbox.
        </p>
        <p className="bg-white/5 border border-white/15 rounded-lg p-4 text-white/80">
          <strong className="text-white block mb-1">Our commitment to advisors and their clients:</strong>
          Advisory Connect (Pty) Ltd, its directors, and staff will not directly contact, solicit,
          use, or act upon any lead, referral, or client enquiry submitted through the platform
          unless a period of <strong className="text-white">90 days (three months)</strong> has
          elapsed from the original submission timestamp without the assigned advisor having
          responded or engaged with the lead.
        </p>
        <p>
          This 90-day timestamp is permanently recorded against every submission in the platform
          and is auditable. The purpose of this commitment is to ensure that advisors can
          confidently share client referrals through Advisory Connect without risk of those
          referrals being redirected or used by the platform operator.
        </p>
        <p>
          After 90 days of advisor non-response, Advisory Connect reserves the right to
          re-assign or follow up on the lead solely to ensure the prospective client receives
          appropriate assistance.
        </p>
      </Section>

      <Section title="5. Data Sharing">
        <p>We do <strong className="text-white">not sell</strong> personal data. We share data only with:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong className="text-white">SendGrid (Twilio)</strong> — email delivery of form
            confirmation messages. Subject to Twilio's privacy policy.
          </li>
          <li>
            <strong className="text-white">Neon (PostgreSQL hosting)</strong> — your data is stored
            on Neon's cloud database servers, which are located in the United States. Appropriate
            data processing agreements are in place.
          </li>
          <li>
            <strong className="text-white">Google (reCAPTCHA)</strong> — form submissions are
            protected by Google reCAPTCHA. Google may process limited interaction data to detect
            automated abuse.
          </li>
          <li>
            <strong className="text-white">Google Fonts</strong> — fonts are loaded from Google's
            servers, which may log your IP address.
          </li>
          <li>
            Regulatory authorities or law enforcement where required by South African law.
          </li>
        </ul>
      </Section>

      <Section title="6. Cross-Border Data Transfers">
        <p>
          Our database is hosted by Neon Inc. (USA). By using Advisory Connect, you consent to your
          personal data being transferred to and processed in the United States. We have ensured
          that appropriate safeguards are in place consistent with POPIA's requirements for
          cross-border transfers.
        </p>
      </Section>

      <Section title="7. Data Retention">
        <p>
          Lead and referral submissions are retained for a minimum of 12 months to allow advisors
          sufficient time to manage their pipeline. Advisor profile data is retained for the
          duration of the subscription and deleted within 30 days of account termination upon
          request. Device/usage logs are retained for a maximum of 90 days.
        </p>
      </Section>

      <Section title="8. Your Rights (POPIA)">
        <p>
          Under the Protection of Personal Information Act (POPIA), you have the right to:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Access the personal information we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Withdraw consent at any time</li>
          <li>Lodge a complaint with the Information Regulator of South Africa</li>
        </ul>
        <p>
          To exercise any of these rights, email{" "}
          <a href="mailto:support@advisoryconnect.pro" className="text-white underline">
            support@advisoryconnect.pro
          </a>{" "}
          with the subject line "Data Request".
        </p>
      </Section>

      <Section title="9. Account & Data Deletion">
        <p>
          Advisors may request full account deletion at any time by emailing{" "}
          <a href="mailto:support@advisoryconnect.pro" className="text-white underline">
            support@advisoryconnect.pro
          </a>{" "}
          with the subject line "Delete My Account". We will permanently delete your profile,
          settings, and associated lead data within 14 business days. Some data may be retained
          where required by law.
        </p>
      </Section>

      <Section title="10. Security">
        <p>
          We protect your data using HTTPS encryption in transit, secure session management with
          HttpOnly cookies, hashed passwords, reCAPTCHA on all public forms, and regular
          dependency security audits. We implement reasonable safeguards but cannot guarantee
          absolute security.
        </p>
      </Section>

      <Section title="11. Children">
        <p>
          Advisory Connect is intended for use by adults aged 18 and over. We do not knowingly
          collect data from minors.
        </p>
      </Section>

      <Section title="12. Google Play Compliance">
        <p>
          Advisory Connect complies with Google Play's User Data Policy, including transparent
          disclosure of data collection, limited use of personal data, and secure handling of
          user information. Device permissions requested by the app are limited to those necessary
          for core functionality.
        </p>
      </Section>

      <Section title="13. Changes to This Policy">
        <p>
          We may update this policy from time to time. Material changes will be communicated via
          email to registered advisors. Continued use of the platform after changes constitutes
          acceptance.
        </p>
      </Section>

      <Section title="14. Contact">
        <p>
          Advisory Connect (Pty) Ltd
          <br />
          Email:{" "}
          <a href="mailto:support@advisoryconnect.pro" className="text-white underline">
            support@advisoryconnect.pro
          </a>
          <br />
          Website: advisoryconnect.pro
          <br />
          Governing law: Republic of South Africa
        </p>
      </Section>
    </div>
  );
}

function TermsOfService() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-1">Terms of Service</h1>
      <p className="text-white/40 text-sm mb-10">Advisory Connect (Pty) Ltd — Last Updated: 27 April 2026</p>

      <Section title="1. Introduction">
        <p>
          Welcome to Advisory Connect, a digital platform operated by Advisory Connect (Pty) Ltd
          that enables financial advisors to create and share professional digital profiles, manage
          client referrals and callbacks, and connect with prospective clients in South Africa.
        </p>
        <p>By accessing or using Advisory Connect, you agree to be bound by these Terms.</p>
      </Section>

      <Section title="2. Services Provided">
        <p>Advisory Connect provides:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Advisor digital profile pages (public-facing)</li>
          <li>Referral, callback, and Will enquiry forms on behalf of advisors</li>
          <li>Advisor control panels for lead management and profile customisation</li>
          <li>Financial calculators and tools for prospective clients</li>
          <li>Subscription-based access to premium features</li>
        </ul>
        <p>We may modify or discontinue any feature at any time with reasonable notice.</p>
      </Section>

      <Section title="3. Accounts">
        <ul className="list-disc pl-5 space-y-1">
          <li>You must provide accurate and complete information when registering</li>
          <li>You are responsible for maintaining the security of your account credentials</li>
          <li>You must notify us immediately of any unauthorised access</li>
          <li>Advisory Connect reserves one master administrator account per business entity</li>
        </ul>
      </Section>

      <Section title="4. Acceptable Use">
        <p>You may not:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Use the platform for any unlawful purpose or in violation of South African law</li>
          <li>Upload harmful, defamatory, or illegal content</li>
          <li>Impersonate another person or entity</li>
          <li>Attempt to gain unauthorised access to the platform or its infrastructure</li>
          <li>Submit false or misleading referral or client information</li>
          <li>Use the platform to spam, solicit, or harass users</li>
        </ul>
      </Section>

      <Section title="5. Lead & Referral Data Commitment">
        <p>
          All referral and callback submissions made through advisor profile pages are routed
          through the Advisory Connect master control panel before appearing in the relevant
          advisor's inbox.
        </p>
        <p>
          Advisory Connect (Pty) Ltd commits that it will not directly contact, solicit, use,
          or commercially exploit any referral or lead submission for a period of{" "}
          <strong className="text-white">90 days</strong> from the submission timestamp. This
          commitment is auditable via the timestamp recorded against each submission.
        </p>
        <p>
          After 90 days of advisor non-response, Advisory Connect may contact the prospective
          client solely to ensure they receive appropriate financial guidance.
        </p>
      </Section>

      <Section title="6. Subscription & Billing">
        <p>
          Access to advisor control panels and premium features is subject to a subscription fee
          as agreed at sign-up. Billing is managed directly by Advisory Connect. Subscriptions
          renew automatically unless cancelled before the renewal date.
        </p>
        <p>
          Cancellation requests should be submitted to{" "}
          <a href="mailto:support@advisoryconnect.pro" className="text-white underline">
            support@advisoryconnect.pro
          </a>
          . Cancellation takes effect at the end of the current billing period. Advisory Connect
          does not offer prorated refunds except where required by law.
        </p>
      </Section>

      <Section title="7. Intellectual Property">
        <p>
          The Advisory Connect platform, branding, and all original content created by Advisory
          Connect (Pty) Ltd are the intellectual property of Advisory Connect. Advisors retain
          ownership of the content they upload (profile photos, bios, etc.).
        </p>
        <p>
          By uploading content to the platform, you grant Advisory Connect a non-exclusive licence
          to display that content as part of your advisor profile.
        </p>
      </Section>

      <Section title="8. Third-Party Services">
        <p>
          Advisory Connect integrates with third-party services including SendGrid (email),
          Google reCAPTCHA (spam protection), and Neon (database hosting). We are not
          responsible for the availability or conduct of third-party services.
        </p>
      </Section>

      <Section title="9. Disclaimer">
        <p>
          Advisory Connect is a platform for connecting clients with financial advisors. We do
          not provide financial advice and are not a Financial Services Provider (FSP) under the
          FAIS Act. All advice given through the platform is the responsibility of the registered
          advisor.
        </p>
        <p>Services are provided "as is" without warranties of any kind.</p>
      </Section>

      <Section title="10. Limitation of Liability">
        <p>
          To the maximum extent permitted by South African law, Advisory Connect is not liable
          for loss of profits, data loss, or indirect damages arising from use of the platform.
          Our total liability is limited to the subscription fees paid by you in the three months
          preceding any claim.
        </p>
      </Section>

      <Section title="11. Termination">
        <p>
          We may suspend or terminate access to the platform at our discretion where these Terms
          are breached. Advisors will be given reasonable notice except in cases of serious breach
          or unlawful activity.
        </p>
      </Section>

      <Section title="12. Governing Law">
        <p>
          These Terms are governed by the laws of the Republic of South Africa. Any disputes
          shall be subject to the jurisdiction of the South African courts.
        </p>
      </Section>

      <Section title="13. Contact">
        <p>
          Advisory Connect (Pty) Ltd
          <br />
          Email:{" "}
          <a href="mailto:support@advisoryconnect.pro" className="text-white underline">
            support@advisoryconnect.pro
          </a>
          <br />
          Website: advisoryconnect.pro
        </p>
      </Section>
    </div>
  );
}

function DataRightsForm() {
  const [form, setForm] = useState({ name: "", email: "", requestType: "erasure", details: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setStatus("sending");
    try {
      const r = await fetch("/api/data-rights-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.message || "Request failed"); }
      setStatus("done");
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong");
      setStatus("error");
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-1">Data Rights Request</h1>
      <p className="text-white/40 text-sm mb-8">Advisory Connect (Pty) Ltd — POPIA Section 23–24</p>

      <div className="space-y-6 text-white/70 text-sm leading-relaxed mb-10">
        <p>
          Under the <strong className="text-white">Protection of Personal Information Act (POPIA)</strong> you have the right to request access to, correction of, or erasure of personal information we hold about you. Complete the form below and we will respond within <strong className="text-white">10 business days</strong> as required by law.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-white">Erasure</strong> — request that we delete your personal data.</li>
          <li><strong className="text-white">Access</strong> — request a copy of the personal data we hold.</li>
          <li><strong className="text-white">Correction</strong> — request that we correct inaccurate data.</li>
          <li><strong className="text-white">Portability</strong> — request your data in a machine-readable format.</li>
          <li><strong className="text-white">Objection</strong> — object to the processing of your personal data.</li>
        </ul>
      </div>

      {status === "done" ? (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6 text-center">
          <div className="text-green-400 font-semibold text-lg mb-1">Request Received</div>
          <p className="text-white/60 text-sm">We will respond to your request within 10 business days at the email address you provided.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-white/30"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-white/30"
                placeholder="you@example.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1">Request Type *</label>
            <select
              value={form.requestType}
              onChange={e => setForm(f => ({ ...f, requestType: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-white/30"
            >
              <option value="erasure">Erasure — delete my personal data</option>
              <option value="access">Access — provide a copy of my data</option>
              <option value="correction">Correction — fix inaccurate data</option>
              <option value="portability">Portability — export my data</option>
              <option value="objection">Objection — object to processing</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1">Additional Details</label>
            <textarea
              value={form.details}
              onChange={e => setForm(f => ({ ...f, details: e.target.value }))}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-white/30 resize-none"
              placeholder="Any additional context to help us process your request..."
            />
          </div>
          {status === "error" && (
            <p className="text-red-400 text-sm">{errorMsg}</p>
          )}
          <button
            type="submit"
            disabled={status === "sending"}
            className="px-6 py-2.5 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {status === "sending" ? "Submitting…" : "Submit Request"}
          </button>
        </form>
      )}
    </div>
  );
}
