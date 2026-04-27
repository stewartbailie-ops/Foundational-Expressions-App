import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft, Send, Check } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import type { Advisor } from "@shared/schema";
import { BIO_OPTIONS, INDIVIDUAL_SERVICES, CORPORATE_SERVICES } from "@shared/schema";
import { getThemeColors } from "@/lib/themeUtils";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const INCOME_RANGES = [
  "R0k - R15k",
  "R15k - R30k",
  "R30k - R45k",
  "R45k - R60k",
  "R60k - R75k",
  "R75k - R100k",
  "R100k+",
];

const CONTACT_TIMES = [
  "Morning (8am - 12pm)",
  "Afternoon (12pm - 5pm)",
  "Evening (5pm - 8pm)",
  "Any Time",
];

const INDUSTRIES = [
  "Information Technology",
  "Finance & Banking",
  "Healthcare",
  "Engineering",
  "Education",
  "Legal",
  "Other",
];

export default function CallbackForm() {
  const [, profileParams] = useRoute("/profile/:slug/request-callback");
  const [, directParams] = useRoute("/:slug/request-callback");
  const slug = profileParams?.slug || directParams?.slug || "";

  const { data: advisor, isLoading, error } = useQuery<Advisor>({
    queryKey: [`/api/advisors/slug/${slug}`],
    enabled: !!slug,
  });

  const [formData, setFormData] = useState({
    firstName: "",
    surname: "",
    email: "",
    phone: "",
    age: "",
    incomeRange: "",
    industry: "",
    married: false,
    children: false,
    vehicle: false,
    property: false,
    preferredContactTime: "",
    selectedServices: [] as string[],
    confirmOver18: false,
  });

  const [submitted, setSubmitted] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [recaptchaFailed, setRecaptchaFailed] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }); }, []);

  const mutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to submit");
      return res.json();
    },
    onSuccess: () => setSubmitted(true),
    onError: () => { recaptchaRef.current?.reset(); setRecaptchaToken(null); },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (error || !advisor) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold" data-testid="text-not-found">Advisor Not Found</h2>
          <p className="text-muted-foreground text-sm">
            The advisor profile you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const tc = getThemeColors(advisor.theme);
  const accentColor = tc.accentColor;
  const bgColor = tc.bgColor;
  const textColor = tc.textColor;
  const mutedText = tc.mutedText;
  const cardBg = tc.cardBg;
  const inputBg = tc.inputBg;
  const inputBorder = tc.inputBorder;
  const initials = getInitials(advisor.name);

  const allServices = [
    ...INDIVIDUAL_SERVICES.filter((s) => advisor.individualServices?.includes(s.key)),
    ...CORPORATE_SERVICES.filter((s) => advisor.corporateServices?.includes(s.key)),
  ];

  const inputStyle: React.CSSProperties = {
    backgroundColor: inputBg,
    border: `1px solid ${inputBorder}`,
    color: textColor,
    borderRadius: "0.5rem",
    padding: "0.625rem 0.75rem",
    width: "100%",
    fontSize: "0.875rem",
    outline: "none",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
  };

  const optionStyle: React.CSSProperties = {
    backgroundColor: tc.isDark ? "#1a1a1a" : "#ffffff",
    color: tc.isDark ? "#ffffff" : "#1a1a1a",
  };

  const labelStyle: React.CSSProperties = {
    color: mutedText,
    fontSize: "0.75rem",
    fontWeight: 600,
    marginBottom: "0.25rem",
    display: "block",
  };

  const update = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleService = (serviceName: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceName)
        ? prev.selectedServices.filter((s) => s !== serviceName)
        : [...prev.selectedServices, serviceName],
    }));
  };

  const canSubmit =
    formData.firstName.trim() &&
    formData.surname.trim() &&
    formData.phone.trim() &&
    formData.confirmOver18 &&
    true;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    mutation.mutate({
      advisorId: advisor.id,
      clientName: `${formData.firstName} ${formData.surname}`.trim(),
      clientEmail: formData.email,
      clientPhone: formData.phone,
      clientAge: formData.age ? parseInt(formData.age) : undefined,
      clientIncome: formData.incomeRange,
      clientIndustry: formData.industry || undefined,
      clientMarried: formData.married,
      clientChildren: formData.children,
      clientVehicle: formData.vehicle,
      clientProperty: formData.property,
      preferredContactTime: formData.preferredContactTime,
      servicesRequested: formData.selectedServices.join(", "),
      source: "callback-form",
      sourceProfileSlug: slug || undefined,
      recaptchaToken: recaptchaToken ?? undefined,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: bgColor, color: textColor }}>
        <div className="text-center space-y-4 max-w-sm">
          <CheckCircle2 className="h-16 w-16 mx-auto" style={{ color: tc.successColor }} />
          <h2 className="text-2xl font-bold" data-testid="text-success-title">Request Submitted</h2>
          <p className="text-sm" style={{ color: mutedText }} data-testid="text-success-message">
            Thank you! {advisor.name} will be in touch with you shortly.
          </p>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 mt-4 text-sm font-medium"
            style={{ color: accentColor }}
            data-testid="button-back-to-profile"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor, color: textColor }} data-testid="callback-form-container">
      <div className="max-w-md mx-auto px-5 py-8 space-y-6">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-sm font-medium mb-2"
          style={{ color: mutedText }}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex items-center gap-4 rounded-xl px-4 py-3" style={{ backgroundColor: cardBg }} data-testid="advisor-header">
          {advisor.profilePicUrl ? (
            <img src={advisor.profilePicUrl} alt={advisor.name} className="h-12 w-12 rounded-full object-cover border-2 flex-shrink-0" style={{ borderColor: tc.initialsCircleBorder }} />
          ) : (
            <div className="h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: tc.initialsCircleBg, color: accentColor, border: `2px solid ${tc.initialsCircleBorder}` }}>
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: textColor }}>{advisor.name}</p>
            {advisor.title && <p className="text-xs truncate" style={{ color: mutedText }}>{advisor.title}</p>}
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold" data-testid="text-form-title">Request a Call Back</h1>
          <p className="text-sm" style={{ color: mutedText }}>
            Please complete the details below. The more information you provide, the better I can assist you. I will contact you at your preferred time.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="callback-form">
          <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: cardBg }}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>First Name <span style={{ color: "#ef4444" }}>*</span></label>
                <input
                  type="text"
                  required
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  style={inputStyle}
                  data-testid="input-first-name"
                />
              </div>
              <div>
                <label style={labelStyle}>Surname <span style={{ color: "#ef4444" }}>*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Smith"
                  value={formData.surname}
                  onChange={(e) => update("surname", e.target.value)}
                  style={inputStyle}
                  data-testid="input-surname"
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>E-mail Address</label>
              <input
                type="email"
                placeholder="john@example.co.za"
                value={formData.email}
                onChange={(e) => update("email", e.target.value)}
                style={inputStyle}
                data-testid="input-email"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Phone Number <span style={{ color: "#ef4444" }}>*</span></label>
                <input
                  type="tel"
                  required
                  placeholder="082 123 4567"
                  value={formData.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  style={inputStyle}
                  data-testid="input-phone"
                />
              </div>
              <div>
                <label style={labelStyle}>Age</label>
                <input
                  type="number"
                  min="18"
                  max="120"
                  placeholder="e.g. 33"
                  value={formData.age}
                  onChange={(e) => update("age", e.target.value)}
                  style={inputStyle}
                  data-testid="input-age"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: cardBg }}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Income Range</label>
                <select
                  value={formData.incomeRange}
                  onChange={(e) => update("incomeRange", e.target.value)}
                  style={selectStyle}
                  data-testid="select-income-range"
                >
                  <option value="" style={optionStyle}>Select income range</option>
                  {INCOME_RANGES.map((r) => (
                    <option key={r} value={r} style={optionStyle}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Industry</label>
                <select
                  value={formData.industry}
                  onChange={(e) => update("industry", e.target.value)}
                  style={selectStyle}
                  data-testid="select-industry"
                >
                  <option value="" style={optionStyle}>Select industry</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind} style={optionStyle}>{ind}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {([
                ["married", "Are you married"],
                ["children", "Do you have children"],
                ["vehicle", "Do you own a vehicle"],
                ["property", "Do you own property"],
              ] as const).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                  style={{ color: textColor }}
                  data-testid={`toggle-${key}`}
                >
                  <input
                    type="checkbox"
                    checked={formData[key]}
                    onChange={(e) => update(key, e.target.checked)}
                    className="w-4 h-4 rounded"
                    data-testid={`checkbox-${key}`}
                  />
                  <span className="text-xs">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: cardBg }}>
            <div>
              <label style={labelStyle}>Preferred Time To Contact</label>
              <select
                value={formData.preferredContactTime}
                onChange={(e) => update("preferredContactTime", e.target.value)}
                style={selectStyle}
                data-testid="select-contact-time"
              >
                <option value="" style={optionStyle}>Select time</option>
                {CONTACT_TIMES.map((t) => (
                  <option key={t} value={t} style={optionStyle}>{t}</option>
                ))}
              </select>
            </div>

            {allServices.length > 0 && (
              <div>
                <label style={labelStyle}>What would you like assistance with? (select all that apply)</label>
                <div className="space-y-2 mt-2">
                  {allServices.map((s) => (
                    <label
                      key={s.key}
                      className="flex items-center gap-2.5 cursor-pointer text-sm"
                      style={{ color: textColor }}
                      data-testid={`checkbox-service-${s.key}`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedServices.includes(s.name)}
                        onChange={() => toggleService(s.name)}
                        className="w-4 h-4 rounded"
                      />
                      <span>{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div
            className="flex items-start gap-3 cursor-pointer"
            onClick={() => update("confirmOver18", !formData.confirmOver18)}
            data-testid="toggle-confirm-18"
          >
            <div
              className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
              style={{
                backgroundColor: formData.confirmOver18 ? tc.accentColor : "transparent",
                border: `2px solid ${formData.confirmOver18 ? tc.accentColor : tc.borderColor}`,
              }}
            >
              {formData.confirmOver18 && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
            </div>
            <p className="text-xs leading-relaxed" style={{ color: mutedText }}>
              I confirm that I am over 18 years of age and that the information provided is accurate. I consent to being contacted by {advisor.name} regarding my financial planning needs. <span style={{ color: "#ef4444" }}>*</span>
            </p>
          </div>

          {!recaptchaFailed && import.meta.env.VITE_RECAPTCHA_SITE_KEY && (
            <div className="flex justify-center" data-testid="recaptcha-callback">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                theme={tc.isDark ? "dark" : "light"}
                onChange={(token) => setRecaptchaToken(token)}
                onExpired={() => setRecaptchaToken(null)}
                onErrored={() => setRecaptchaFailed(true)}
              />
            </div>
          )}

          {mutation.isError && (
            <div className="text-red-400 text-sm text-center" data-testid="text-error">
              Something went wrong. Please try again.
            </div>
          )}

          <p className="text-center text-xs leading-relaxed px-2" style={{ color: mutedText }} data-testid="text-privacy-notice-callback">
            By submitting, you agree to our{" "}
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: tc.accentColor }}
              data-testid="link-privacy-policy-callback"
            >
              Privacy Policy
            </a>
            . We'll only use your details to respond to your request.
          </p>

          <button
            type="submit"
            disabled={!canSubmit || mutation.isPending}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{
              backgroundColor: tc.buttonBg,
              color: tc.buttonText,
            }}
            data-testid="button-submit-callback"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            ) : (
              <>
                Request Call Back
                <Send className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs pt-2 pb-2" style={{ color: mutedText }}>
          Powered by Advisory Connect
        </p>
      </div>
    </div>
  );
}