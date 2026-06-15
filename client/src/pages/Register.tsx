import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, ArrowRight, ArrowLeft, BookOpen, Users, Palette, Globe, ShieldCheck } from "lucide-react";

const TITLE_OPTIONS = [
  "Financial Planner",
  "Junior Financial Planner",
  "Senior Financial Advisor",
  "CFP (Certified Financial Planner)",
  "Wealth Manager",
  "Estate Planner",
  "Independent Financial Advisor",
];

const PLANS = [
  {
    value: "trial",
    label: "Free Trial",
    price: "R0 / month",
    desc: "Full access for 30 days. No card required.",
    highlight: false,
  },
  {
    value: "pro",
    label: "Professional",
    price: "R299 / month",
    desc: "Unlimited leads, Book of Life, full branding.",
    highlight: true,
  },
  {
    value: "enterprise",
    label: "Enterprise",
    price: "Custom pricing",
    desc: "Bulk licences for firms and franchises.",
    highlight: false,
  },
];

const TOS_TEXT = `Welcome to Advisory Connect.

By creating an account, you agree to:

1. Use the platform in accordance with all applicable financial services regulations in South Africa, including the FAIS Act.

2. Maintain the accuracy of all client information shared through the platform and treat it with appropriate confidentiality.

3. Not use the platform to provide unauthorised financial advice outside the scope of your FAIS licence.

4. Allow Advisory Connect to send transactional emails (lead notifications, account-related communications) to your registered email address.

5. Acknowledge that your public-facing profile at app.advisoryconnect.pro/[your-slug] will be visible to anyone with the link.

The full Terms of Service document is currently being finalised and will be made available shortly. By ticking the box below, you confirm you accept these interim terms and the formal Terms of Service once published.`;

const STEPS = [
  { num: 1, label: "Your Details" },
  { num: 2, label: "Choose Plan" },
  { num: 3, label: "Terms of Service" },
];

export default function Register() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [createdSlug, setCreatedSlug] = useState("");

  const [name, setName] = useState("");
  const [title, setTitle] = useState("Financial Planner");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [notRobot, setNotRobot] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState("trial");
  const [tosAccepted, setTosAccepted] = useState(false);

  const previewSlug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const step1Valid = name.trim().length >= 2 && /\S+@\S+\.\S+/.test(email.trim()) && notRobot;

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          title,
          contactNumber: contactNumber.trim() || null,
          subscriptionTier,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      setCreatedSlug(data.slug);
      setStep(4);
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="mb-8 text-center">
        <img src="/logo/icon-192.png" alt="Advisory Connect" className="w-12 h-12 rounded-xl mx-auto mb-3 shadow-sm" />
        <h1 className="text-2xl font-bold text-gray-900">Create Your Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Your digital advisory presence, live in minutes.</p>
      </div>

      {step < 4 && (
        <div className="w-full max-w-md mb-6">
          <div className="flex items-center">
            {STEPS.map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all ${
                    step > s.num ? "bg-blue-600 border-blue-600 text-white"
                    : step === s.num ? "bg-white border-blue-600 text-blue-600"
                    : "bg-white border-gray-200 text-gray-400"
                  }`}>
                    {step > s.num ? <Check className="h-4 w-4" /> : s.num}
                  </div>
                  <span className={`text-xs font-medium whitespace-nowrap ${step === s.num ? "text-blue-600" : "text-gray-400"}`}>{s.label}</span>
                </div>
                {idx < STEPS.length - 1 && <div className={`h-0.5 flex-1 mx-3 ${step > s.num ? "bg-blue-600" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="w-full max-w-md">
        {/* Step 1 — Details */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Smith"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
              />
              {previewSlug && (
                <p className="text-xs text-gray-400 mt-1 ml-0.5">
                  Your profile URL: <span className="text-gray-600">advisoryconnect.pro/{previewSlug}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
              <select
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white transition-colors"
              >
                {TITLE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contact Number <span className="text-xs text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="+27 82 123 4567"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
              />
            </div>

            <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${notRobot ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
              <div className={`h-5 w-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${notRobot ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
                {notRobot && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
              </div>
              <input type="checkbox" checked={notRobot} onChange={(e) => setNotRobot(e.target.checked)} className="sr-only" />
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700">I'm not a robot</span>
              </div>
            </label>

            <button
              onClick={() => setStep(2)}
              disabled={!step1Valid}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next <ArrowRight className="h-4 w-4" />
            </button>

            <p className="text-center text-xs text-gray-400">
              Already have a profile?{" "}
              <a href="/portal" className="text-blue-600 hover:underline font-medium">Sign in</a>
            </p>
          </div>
        )}

        {/* Step 2 — Choose Plan */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Choose Your Plan</h2>
              <p className="text-xs text-gray-500 mt-0.5">All plans include full access. Upgrade or downgrade anytime.</p>
            </div>

            <div className="space-y-3">
              {PLANS.map((plan) => (
                <label
                  key={plan.value}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    subscriptionTier === plan.value
                      ? plan.highlight ? "border-blue-600 bg-blue-50" : "border-blue-500 bg-blue-50/60"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={plan.value}
                    checked={subscriptionTier === plan.value}
                    onChange={() => setSubscriptionTier(plan.value)}
                    className="sr-only"
                  />
                  <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    subscriptionTier === plan.value ? "border-blue-600 bg-blue-600" : "border-gray-300"
                  }`}>
                    {subscriptionTier === plan.value && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">{plan.label}</span>
                      <span className="text-sm font-bold text-blue-600">{plan.price}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{plan.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-all"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-all"
              >
                Next <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Terms of Service */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Terms of Service</h2>
              <p className="text-xs text-gray-500 mt-0.5">Please read and accept before continuing.</p>
            </div>

            <div className="border border-gray-100 rounded-lg bg-gray-50 p-4 max-h-56 overflow-y-auto">
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{TOS_TEXT}</p>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50 cursor-pointer">
              <input
                type="checkbox"
                checked={tosAccepted}
                onChange={(e) => setTosAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-blue-600 flex-shrink-0"
              />
              <span className="text-sm text-blue-900 font-medium">I accept the Terms of Service</span>
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-all"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={handleCreate}
                disabled={!tosAccepted || loading}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create My Profile"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Success */}
        {step === 4 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-6">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-green-600" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">You're in!</h2>
              <p className="text-sm text-gray-500 mt-1.5">
                Your profile is live at{" "}
                <span className="font-medium text-gray-700">advisoryconnect.pro/{createdSlug}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              {[
                { icon: Globe, label: "Public Profile", desc: "Your digital business card is live" },
                { icon: BookOpen, label: "Book of Life", desc: "Emergency QR access for clients" },
                { icon: Users, label: "Lead Registry", desc: "Client enquiries land here" },
                { icon: Palette, label: "Make It Yours", desc: "Add photo, bio & colours" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-xs font-semibold text-gray-800">{label}</span>
                  </div>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-left">
              <p className="text-xs text-blue-800">
                <strong>Next:</strong> Set your password on the next screen to activate your control panel.
              </p>
            </div>

            <button
              onClick={() => navigate(`/advisor/${createdSlug}`)}
              className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-all"
            >
              Set Up My Panel <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
