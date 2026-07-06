import { Fragment, useState, useRef, type ChangeEvent } from "react";
import { useLocation } from "wouter";
import ReCAPTCHA from "react-google-recaptcha";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Check, ArrowRight, ArrowLeft, BookOpen, Users,
  Palette, Globe, Camera, X,
} from "lucide-react";
import { TITLE_OPTIONS } from "@shared/schema";

// Theme names MUST match the keys in themeUtils.ts getThemeColors / getInitialsBadgeColors.
// Mismatches caused the "always blue" registration bug.
const THEMES = [
  { name: "light-blue",        color: "#0ea5e9", label: "Blue"       },
  { name: "navy",              color: "#1d4ed8", label: "Dark Blue"  },
  { name: "teal",              color: "#0d9488", label: "Teal"       },
  { name: "dark-green",        color: "#22c55e", label: "Green"      },
  { name: "dark-royal-purple", color: "#a855f7", label: "Purple"     },
  { name: "pink",              color: "#be185d", label: "Pink"       },
  { name: "dark",              color: "#111827", label: "Black"      },
  { name: "silver",            color: "#6b7280", label: "Silver"     },
];

const PLANS = [
  {
    value: "standard",
    label: "Standard",
    price: "R299 / month",
    desc: "Core lead generation — everything an advisor needs to go live.",
  },
  {
    value: "premium",
    label: "Premium",
    price: "R499 / month",
    desc: "Full practice management & client engagement.",
  },
];

const DISPLAYS = [
  { key: "showMoneywebFeed", label: "Live Market News",            desc: "Real-time finance headlines on your home screen" },
  { key: "showSecondNews",   label: "More Finance News",           desc: "Additional news feed for broader coverage" },
  { key: "showForex",        label: "Live Exchange Rates",         desc: "USD, EUR & GBP vs ZAR, updated daily" },
  { key: "showFunFacts",     label: "Financial Facts of the Day",  desc: "Daily rotating financial education infographic" },
  { key: "showDailyQuotes",  label: "Quote of the Day",           desc: "Motivational daily finance quote" },
];

const TOS_TEXT = `Welcome to Advisory Connect.

By creating an account, you agree to:

1. Use the platform in accordance with all applicable financial services regulations in South Africa, including the FAIS Act.

2. Maintain the accuracy of all client information shared through the platform and treat it with appropriate confidentiality.

3. Not use the platform to provide unauthorised financial advice outside the scope of your FAIS licence.

4. Allow Advisory Connect to send transactional emails (lead notifications, account-related communications) to your registered email address.

5. Acknowledge that your public-facing profile at app.advisoryconnect.pro/[your-slug] will be visible to anyone with the link.

The full Terms of Service document is currently being finalised and will be made available shortly. By ticking the box below, you confirm you accept these interim terms and the formal Terms of Service once published.`;

// Consent-first: Terms is step 1, so acceptance is captured before any details are entered.
const STEPS = [
  { num: 1, label: "Terms"    },
  { num: 2, label: "Details"  },
  { num: 3, label: "Photo"    },
  { num: 4, label: "Colours"  },
  { num: 5, label: "Displays" },
  { num: 6, label: "Plan"     },
];

const inputCls = "w-full px-4 py-2.5 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/20 text-sm focus:outline-none focus:border-white/40 transition-colors";
const labelCls = "block text-sm font-medium text-white/70 mb-1.5";

export default function Register() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [createdSlug, setCreatedSlug] = useState("");
  const [createdFirstName, setCreatedFirstName] = useState("");

  // Step 2 — details
  const [name, setName] = useState("");
  const [title, setTitle] = useState("Financial Planner");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [recaptchaFailed, setRecaptchaFailed] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  // Step 3 — profile photo (optional; uploads immediately to object storage)
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [uploadingPic, setUploadingPic] = useState(false);

  // Step 4
  const [theme, setTheme] = useState("light-blue");
  const [themeColor, setThemeColor] = useState("#0ea5e9");
  const [customColor, setCustomColor] = useState("#0ea5e9");
  const [useCustom, setUseCustom] = useState(false);

  // Step 5 — home display toggles
  const [displays, setDisplays] = useState<Record<string, boolean>>(
    Object.fromEntries(DISPLAYS.map(d => [d.key, true]))
  );

  // Step 6
  const [subscriptionTier, setSubscriptionTier] = useState("standard");

  // Step 1 — consent captured up front
  const [tosAccepted, setTosAccepted] = useState(false);

  const previewSlug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  // reCAPTCHA is satisfied if a token was solved, OR if the widget couldn't load
  // / isn't configured (soft gate — same advisory stance as the lead forms).
  const recaptchaOk = !!recaptchaToken || recaptchaFailed || !import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const step1Valid = name.trim().length >= 2 && /\S+@\S+\.\S+/.test(email.trim()) && recaptchaOk;

  const handleThemeSelect = (t: typeof THEMES[0]) => {
    setTheme(t.name);
    setThemeColor(t.color);
    setUseCustom(false);
  };

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({ title: "Unsupported format", description: "Please use a JPG, PNG or WebP image.", variant: "destructive" });
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Please choose an image under 5 MB.", variant: "destructive" });
      e.target.value = "";
      return;
    }
    setUploadingPic(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/registration-pic", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      setProfilePicUrl(data.url);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingPic(false);
      e.target.value = "";
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const finalColor = useCustom ? customColor : themeColor;
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          title,
          contactNumber: contactNumber.trim() || null,
          profilePicUrl: profilePicUrl || null,
          theme: useCustom ? "custom" : theme,
          themeColor: finalColor,
          panelTheme: useCustom ? "custom" : theme,
          panelThemeColor: finalColor,
          subscriptionTier,
          recaptchaToken: recaptchaToken ?? undefined,
          ...displays,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      setCreatedSlug(data.slug);
      setCreatedFirstName(name.trim().split(" ")[0]);
      setStep(7);
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const activeThemeColor = useCustom ? customColor : themeColor;

  const cardCls = "w-full max-w-md bg-white/5 rounded-2xl border border-white/10 p-6 space-y-4";
  const btnBack = "flex-1 py-3 rounded-xl border border-white/15 text-white/60 text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-white/5 transition-all";
  const btnNext = "flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-500 transition-all";
  const btnNextGated = "flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all";

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="text-center space-y-2 mb-8">
        <img src="/logo/icon-192.png" alt="Advisory Connect" className="w-12 h-12 rounded-xl mx-auto shadow-sm" />
        <h1 className="text-2xl font-bold text-white">Create Your Profile</h1>
        <p className="text-white/40 text-sm">Your digital advisory presence, live in minutes.</p>
      </div>

      {/* Progress bar — flex-1 connectors so it never overflows or clips */}
      {step < 7 && (
        <div className="w-full max-w-md mb-6 px-2">
          <div className="flex items-start w-full">
            {STEPS.map((s, idx) => (
              <Fragment key={s.num}>
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all ${
                    step > s.num  ? "bg-blue-600 border-blue-600 text-white"
                    : step === s.num ? "bg-transparent border-blue-500 text-blue-400"
                    : "bg-transparent border-white/20 text-white/30"
                  }`}>
                    {step > s.num ? <Check className="h-3.5 w-3.5" /> : s.num}
                  </div>
                  <span className={`text-[9px] font-medium whitespace-nowrap mt-1 ${step === s.num ? "text-blue-400" : "text-white/25"}`}>
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mt-3.5 mx-1 transition-colors ${step > s.num ? "bg-blue-600" : "bg-white/10"}`} />
                )}
              </Fragment>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 1: Terms of Service (consent-first) ── */}
      {step === 1 && (
        <div className={cardCls}>
          <div>
            <h2 className="text-base font-semibold text-white">Terms of Service</h2>
            <p className="text-xs text-white/40 mt-0.5">Please read and accept before creating your profile.</p>
          </div>
          <div className="border border-white/10 rounded-lg bg-white/3 p-4 max-h-56 overflow-y-auto">
            <p className="text-xs text-white/50 leading-relaxed whitespace-pre-line">{TOS_TEXT}</p>
          </div>
          <label className="flex items-start gap-3 p-3 rounded-lg border border-blue-500/40 bg-blue-500/8 cursor-pointer">
            <input type="checkbox" checked={tosAccepted} onChange={(e) => setTosAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-blue-600 flex-shrink-0" data-testid="check-tos" />
            <span className="text-sm text-blue-300 font-medium">I accept the Terms of Service</span>
          </label>
          <button onClick={() => setStep(2)} disabled={!tosAccepted} data-testid="button-tos-continue"
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            Continue <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-center text-xs text-white/25">Already have a profile?{" "}
            <a href="/portal" className="text-blue-400 hover:underline font-medium">Sign in</a>
          </p>
        </div>
      )}

      {/* ── STEP 2: Details ── */}
      {step === 2 && (
        <div className={cardCls}>
          <div>
            <label className={labelCls}>Full Name <span className="text-red-400">*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Smith"
              className={inputCls} />
            {previewSlug && (
              <p className="text-xs text-white/25 mt-1 ml-0.5">
                Profile URL: <span className="text-white/50">advisoryconnect.pro/{previewSlug}</span>
              </p>
            )}
          </div>
          <div>
            <label className={labelCls}>Title</label>
            <select value={title} onChange={(e) => setTitle(e.target.value)}
              className={inputCls + " bg-black/30"}>
              {TITLE_OPTIONS.map(t => (
                <option key={t} value={t} className="bg-gray-900 text-white">{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Email Address <span className="text-red-400">*</span></label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
              className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Contact Number <span className="text-xs text-white/30 font-normal">(optional)</span></label>
            <input type="tel" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="+27 82 123 4567"
              className={inputCls} />
          </div>
          {!recaptchaFailed && import.meta.env.VITE_RECAPTCHA_SITE_KEY && (
            <div className="flex justify-center" data-testid="recaptcha-register">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                theme="dark"
                onChange={(token) => setRecaptchaToken(token)}
                onExpired={() => setRecaptchaToken(null)}
                onErrored={() => setRecaptchaFailed(true)}
              />
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className={btnBack}><ArrowLeft className="h-4 w-4" /> Back</button>
            <button onClick={() => setStep(3)} disabled={!step1Valid} className={btnNextGated} data-testid="button-details-next">
              Next <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Profile Photo ── */}
      {step === 3 && (
        <div className={cardCls}>
          <div>
            <h2 className="text-base font-semibold text-white">Profile Photo</h2>
            <p className="text-xs text-white/40 mt-0.5">Add a photo now, or skip and add it later from your control panel.</p>
          </div>
          <div className="flex flex-col items-center gap-4 py-4">
            {profilePicUrl ? (
              <img src={profilePicUrl} alt="Profile preview" data-testid="img-profile-preview"
                className="h-28 w-28 rounded-full object-cover border-4 border-blue-500/30 shadow-lg" />
            ) : (
              <div className="h-28 w-28 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
                {uploadingPic ? <Loader2 className="h-8 w-8 text-white/40 animate-spin" /> : <Camera className="h-8 w-8 text-white/20" />}
              </div>
            )}

            <input id="reg-photo" type="file" accept="image/jpeg,image/png,image/webp"
              className="hidden" onChange={handlePhotoUpload} disabled={uploadingPic} data-testid="input-profile-photo" />
            <label htmlFor="reg-photo"
              className={`px-4 py-2 rounded-xl border border-white/15 text-sm font-medium text-white/80 flex items-center gap-2 transition-all ${uploadingPic ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-white/5"}`}
              data-testid="button-upload-photo">
              {uploadingPic
                ? (<><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>)
                : (<><Camera className="h-4 w-4" /> {profilePicUrl ? "Change Photo" : "Upload Photo"}</>)}
            </label>

            {profilePicUrl && !uploadingPic && (
              <button onClick={() => setProfilePicUrl(null)} data-testid="button-remove-photo"
                className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1 transition-colors">
                <X className="h-3 w-3" /> Remove photo
              </button>
            )}

            <p className="text-xs text-white/35 text-center max-w-[240px]">
              JPG, PNG or WebP, up to 5 MB. You can change or crop it anytime from your control panel.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(2)} className={btnBack}><ArrowLeft className="h-4 w-4" /> Back</button>
            <button onClick={() => setStep(4)} disabled={uploadingPic} className={btnNext} data-testid="button-photo-next">
              {profilePicUrl ? "Next" : "Skip"} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Colours ── */}
      {step === 4 && (
        <div className={cardCls}>
          <div>
            <h2 className="text-base font-semibold text-white">Choose Your Colours</h2>
            <p className="text-xs text-white/40 mt-0.5">Sets the look of both your public profile and control panel.</p>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {THEMES.map(t => (
              <button key={t.name} onClick={() => handleThemeSelect(t)} title={t.label}
                className={`h-12 rounded-xl transition-all border-2 relative ${!useCustom && theme === t.name ? "border-white scale-105 shadow-md" : "border-transparent hover:scale-105"}`}
                style={{ backgroundColor: t.color }}>
                {!useCustom && theme === t.name && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="h-4 w-4 text-white drop-shadow" strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2 cursor-pointer">
              <input type="checkbox" checked={useCustom} onChange={(e) => setUseCustom(e.target.checked)} className="h-3.5 w-3.5 accent-blue-500" />
              Use a custom colour
            </label>
            {useCustom && (
              <div className="flex items-center gap-3">
                <input type="color" value={customColor} onChange={(e) => setCustomColor(e.target.value)}
                  className="h-10 w-16 rounded-lg border border-white/20 cursor-pointer p-0.5 bg-transparent" />
                <span className="text-sm text-white/40 font-mono">{customColor.toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl border"
            style={{ backgroundColor: activeThemeColor + "18", borderColor: activeThemeColor + "40" }}>
            <div className="h-8 w-8 rounded-lg flex-shrink-0" style={{ backgroundColor: activeThemeColor }} />
            <p className="text-xs text-white/50">Preview: your profile accent and panel header will use this colour.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className={btnBack}><ArrowLeft className="h-4 w-4" /> Back</button>
            <button onClick={() => setStep(5)} className={btnNext}>Next <ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {/* ── STEP 5: Home Displays ── */}
      {step === 5 && (
        <div className={cardCls}>
          <div>
            <h2 className="text-base font-semibold text-white">Your Home Displays</h2>
            <p className="text-xs text-white/40 mt-0.5">Choose what appears on your control panel home screen. You can change these anytime.</p>
          </div>
          <div className="space-y-2">
            {DISPLAYS.map(d => (
              <div key={d.key}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${displays[d.key] ? "border-blue-500/40 bg-blue-500/8" : "border-white/10 hover:border-white/20"}`}
                onClick={() => setDisplays(prev => ({ ...prev, [d.key]: !prev[d.key] }))}>
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm font-medium text-white/90">{d.label}</p>
                  <p className="text-xs text-white/35">{d.desc}</p>
                </div>
                <div className={`relative h-5 w-9 rounded-full flex-shrink-0 transition-colors ${displays[d.key] ? "bg-blue-600" : "bg-white/15"}`}>
                  <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${displays[d.key] ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(4)} className={btnBack}><ArrowLeft className="h-4 w-4" /> Back</button>
            <button onClick={() => setStep(6)} className={btnNext}>Next <ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {/* ── STEP 6: Choose Plan (final step) ── */}
      {step === 6 && (
        <div className={cardCls}>
          <div>
            <h2 className="text-base font-semibold text-white">Choose Your Plan</h2>
          </div>
          <div className="space-y-3">
            {PLANS.map(plan => (
              <div key={plan.value} onClick={() => setSubscriptionTier(plan.value)}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${subscriptionTier === plan.value ? "border-blue-500 bg-blue-500/10" : "border-white/15 hover:border-white/25"}`}>
                <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${subscriptionTier === plan.value ? "border-blue-500 bg-blue-500" : "border-white/30"}`}>
                  {subscriptionTier === plan.value && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{plan.label}</span>
                    <span className="text-sm font-bold text-blue-400">{plan.price}</span>
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">{plan.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setStep(5)} className={btnBack}><ArrowLeft className="h-4 w-4" /> Back</button>
            <button onClick={handleCreate} disabled={!tosAccepted || loading} data-testid="button-create-profile"
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create My Profile"}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 7: Welcome + Onboarding ── */}
      {step === 7 && (
        <div className="w-full max-w-md bg-white/5 rounded-2xl border border-white/10 p-8 space-y-6 text-center">
          <div className="h-16 w-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto">
            <Check className="h-8 w-8 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Welcome, {createdFirstName || "Advisor"}!</h2>
            <p className="text-sm text-white/40 mt-1.5">
              Your profile is live at{" "}
              <span className="font-medium text-white/70">advisoryconnect.pro/{createdSlug}</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-left">
            {[
              { icon: Globe,    label: "Public Profile", desc: "Your digital business card — share your link with any client" },
              { icon: BookOpen, label: "Book of Life",   desc: "Emergency QR card for clients — vital info in a crisis" },
              { icon: Users,    label: "Lead Registry",  desc: "Client enquiries land here automatically" },
              { icon: Palette,  label: "Make It Yours",  desc: "Add your bio, services, branding and more" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-white/5 rounded-xl p-3 space-y-1 border border-white/8">
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-xs font-semibold text-white">{label}</span>
                </div>
                <p className="text-xs text-white/40">{desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-blue-500/10 border border-blue-500/25 rounded-xl p-3 text-left">
            <p className="text-xs text-blue-300">
              <strong>Next:</strong> Set your password to activate your control panel.
            </p>
          </div>
          <button onClick={() => navigate(`/advisor/${createdSlug}`)}
            className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-500 transition-all">
            Set Up My Panel <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

    </div>
  );
}
