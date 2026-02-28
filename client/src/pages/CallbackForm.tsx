import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
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
  "R75k+",
];

const CONTACT_TIMES = [
  "Morning (8am - 12pm)",
  "Afternoon (12pm - 5pm)",
  "Evening (5pm - 8pm)",
  "Any Time",
];

export default function CallbackForm() {
  const [, params] = useRoute("/profile/:slug/request-callback");
  const slug = params?.slug || "";

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
    married: false,
    children: false,
    vehicle: false,
    property: false,
    preferredContactTime: "",
    servicesRequested: "",
    confirmOver18: false,
  });

  const [submitted, setSubmitted] = useState(false);

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
  const isDark = tc.isDark;
  const accentColor = tc.accentColor;
  const bgColor = tc.bgColor;
  const textColor = tc.textColor;
  const mutedText = tc.mutedText;
  const cardBg = tc.cardBg;
  const borderColor = tc.borderColor;
  const inputBg = tc.inputBg;
  const inputBorder = tc.inputBorder;
  const initials = getInitials(advisor.name);

  const allServices = [
    ...INDIVIDUAL_SERVICES.filter((s) => advisor.individualServices?.includes(s.key)).map((s) => s.name),
    ...CORPORATE_SERVICES.filter((s) => advisor.corporateServices?.includes(s.key)).map((s) => s.name),
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
    backgroundColor: "#1a1a1a",
    color: "#ffffff",
  };

  const labelStyle: React.CSSProperties = {
    color: mutedText,
    fontSize: "0.75rem",
    fontWeight: 500,
    marginBottom: "0.25rem",
    display: "block",
  };

  const update = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.confirmOver18) return;

    mutation.mutate({
      advisorId: advisor.id,
      clientName: `${formData.firstName} ${formData.surname}`.trim(),
      clientEmail: formData.email,
      clientPhone: formData.phone,
      clientAge: formData.age ? parseInt(formData.age) : undefined,
      clientIncome: formData.incomeRange,
      clientMarried: formData.married,
      clientChildren: formData.children,
      clientVehicle: formData.vehicle,
      clientProperty: formData.property,
      preferredContactTime: formData.preferredContactTime,
      servicesRequested: formData.servicesRequested,
      source: "callback-form",
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
        <div className="flex items-center gap-3" data-testid="callback-advisor-header">
          {advisor.profilePicUrl ? (
            <img
              src={advisor.profilePicUrl}
              alt={advisor.name}
              className="w-12 h-12 rounded-full object-cover border"
              style={{ borderColor }}
              data-testid="img-advisor-pic"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                backgroundColor: tc.initialsCircleBg,
                color: accentColor,
                border: `1px solid ${borderColor}`,
              }}
              data-testid="icon-advisor-initials"
            >
              {initials}
            </div>
          )}
          <div>
            <h2 className="font-semibold text-base" data-testid="text-advisor-name">{advisor.name}</h2>
            {advisor.title && (
              <p className="text-xs" style={{ color: mutedText }} data-testid="text-advisor-title">{advisor.title}</p>
            )}
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold" data-testid="text-form-title">Request a Call Back</h1>
          <p className="text-sm mt-1" style={{ color: mutedText }}>
            Fill in your details and {advisor.name} will contact you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="callback-form">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                style={inputStyle}
                data-testid="input-first-name"
              />
            </div>
            <div>
              <label style={labelStyle}>Surname *</label>
              <input
                type="text"
                required
                value={formData.surname}
                onChange={(e) => update("surname", e.target.value)}
                style={inputStyle}
                data-testid="input-surname"
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => update("email", e.target.value)}
              style={inputStyle}
              data-testid="input-email"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Phone *</label>
              <input
                type="tel"
                required
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
                value={formData.age}
                onChange={(e) => update("age", e.target.value)}
                style={inputStyle}
                data-testid="input-age"
              />
            </div>
          </div>

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

          <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: cardBg }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: tc.sectionTitle }}>
              Your Situation
            </p>
            <div className="grid grid-cols-2 gap-3">
              {([
                ["married", "Married"],
                ["children", "Children"],
                ["vehicle", "Vehicle"],
                ["property", "Property"],
              ] as const).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                  style={{ color: textColor }}
                  data-testid={`toggle-${key}`}
                >
                  <button
                    type="button"
                    onClick={() => update(key, !formData[key])}
                    className="w-10 h-5 rounded-full relative transition-colors"
                    style={{
                      backgroundColor: formData[key]
                        ? tc.checkActive
                        : tc.checkInactive,
                    }}
                    data-testid={`switch-${key}`}
                  >
                    <span
                      className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
                      style={{
                        backgroundColor: formData[key]
                          ? tc.checkDotActive
                          : tc.checkDotInactive,
                        left: formData[key] ? "calc(100% - 1.125rem)" : "0.125rem",
                      }}
                    />
                  </button>
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Preferred Contact Time</label>
            <select
              value={formData.preferredContactTime}
              onChange={(e) => update("preferredContactTime", e.target.value)}
              style={selectStyle}
              data-testid="select-contact-time"
            >
              <option value="" style={optionStyle}>Select preferred time</option>
              {CONTACT_TIMES.map((t) => (
                <option key={t} value={t} style={optionStyle}>{t}</option>
              ))}
            </select>
          </div>

          {allServices.length > 0 && (
            <div>
              <label style={labelStyle}>Service of Interest</label>
              <select
                value={formData.servicesRequested}
                onChange={(e) => update("servicesRequested", e.target.value)}
                style={selectStyle}
                data-testid="select-services"
              >
                <option value="" style={optionStyle}>Select a service</option>
                {allServices.map((s) => (
                  <option key={s} value={s} style={optionStyle}>{s}</option>
                ))}
              </select>
            </div>
          )}

          <label
            className="flex items-start gap-3 text-sm cursor-pointer pt-2"
            style={{ color: textColor }}
            data-testid="toggle-confirm-18"
          >
            <input
              type="checkbox"
              checked={formData.confirmOver18}
              onChange={(e) => update("confirmOver18", e.target.checked)}
              className="mt-0.5 w-4 h-4"
              data-testid="checkbox-confirm-18"
            />
            <span>I confirm that I am over 18 years of age *</span>
          </label>

          {mutation.isError && (
            <div className="text-red-400 text-sm text-center" data-testid="text-error">
              Something went wrong. Please try again.
            </div>
          )}

          <button
            type="submit"
            disabled={!formData.confirmOver18 || mutation.isPending}
            className="w-full py-3.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{
              backgroundColor: tc.buttonBg,
              color: tc.buttonText,
            }}
            data-testid="button-submit-callback"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            ) : (
              "Submit Request"
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