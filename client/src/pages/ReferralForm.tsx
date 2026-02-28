import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, AlertCircle, CheckCircle2, Plus, Trash2, ArrowLeft } from "lucide-react";
import type { Advisor } from "@shared/schema";
import { INDIVIDUAL_SERVICES, CORPORATE_SERVICES } from "@shared/schema";
import { getThemeColors } from "@/lib/themeUtils";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const INCOME_OPTIONS = [
  "R0k - R15k",
  "R15k - R30k",
  "R30k - R45k",
  "R45k - R60k",
  "R60k - R75k",
  "R75k+",
];

const RELATIONSHIP_OPTIONS = [
  "Friend",
  "Family Member",
  "Colleague",
  "Client",
  "Other",
];

const CONTACT_TIME_OPTIONS = [
  "Morning (8am - 12pm)",
  "Afternoon (12pm - 5pm)",
  "Evening (5pm - 8pm)",
  "Any Time",
];

interface ReferralEntry {
  firstName: string;
  surname: string;
  email: string;
  phone: string;
  age: string;
  incomeRange: string;
  married: boolean;
  children: boolean;
  vehicle: boolean;
  property: boolean;
  relationship: string;
  preferredContactTime: string;
  servicesRequested: string;
  confirmedOver18: boolean;
}

function emptyReferral(): ReferralEntry {
  return {
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
    relationship: "",
    preferredContactTime: "",
    servicesRequested: "",
    confirmedOver18: false,
  };
}

export default function ReferralForm() {
  const [, params] = useRoute("/profile/:slug/referrals");
  const slug = params?.slug || "";

  const { data: advisor, isLoading, error } = useQuery<Advisor>({
    queryKey: [`/api/advisors/slug/${slug}`],
    enabled: !!slug,
  });

  const [referrerFirstName, setReferrerFirstName] = useState("");
  const [referrerSurname, setReferrerSurname] = useState("");
  const [referrerEmail, setReferrerEmail] = useState("");
  const [referrerPhone, setReferrerPhone] = useState("");

  const [referrals, setReferrals] = useState<ReferralEntry[]>([emptyReferral()]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const tc = getThemeColors(advisor?.theme);
  const isDark = tc.isDark;
  const accentColor = tc.accentColor;
  const bgColor = tc.bgColor;
  const cardBg = tc.cardBg;
  const textColor = tc.textColor;
  const mutedText = tc.mutedText;
  const sectionTitle = tc.sectionTitle;
  const inputBg = tc.inputBg;
  const inputBorder = tc.inputBorder;
  const inputText = tc.textColor;

  const allServices = [
    ...INDIVIDUAL_SERVICES.filter((s) => advisor?.individualServices?.includes(s.key)),
    ...CORPORATE_SERVICES.filter((s) => advisor?.corporateServices?.includes(s.key)),
  ];

  const updateReferral = (index: number, field: keyof ReferralEntry, value: any) => {
    setReferrals((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addReferral = () => {
    if (referrals.length < 4) {
      setReferrals((prev) => [...prev, emptyReferral()]);
    }
  };

  const removeReferral = (index: number) => {
    if (referrals.length > 1) {
      setReferrals((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const canSubmit =
    referrerFirstName.trim() &&
    referrerSurname.trim() &&
    referrerEmail.trim() &&
    referrals.every(
      (r) =>
        r.firstName.trim() &&
        r.surname.trim() &&
        r.email.trim() &&
        r.confirmedOver18
    );

  const handleSubmit = async () => {
    if (!advisor || !canSubmit) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      for (const ref of referrals) {
        await apiRequest("POST", "/api/referral", {
          advisorId: advisor.id,
          clientName: `${ref.firstName} ${ref.surname}`,
          clientEmail: ref.email,
          clientPhone: ref.phone || undefined,
          clientAge: ref.age ? parseInt(ref.age) : undefined,
          clientIncome: ref.incomeRange || undefined,
          clientMarried: ref.married,
          clientChildren: ref.children,
          clientVehicle: ref.vehicle,
          clientProperty: ref.property,
          preferredContactTime: ref.preferredContactTime || undefined,
          servicesRequested: ref.servicesRequested || undefined,
          referrerName: `${referrerFirstName} ${referrerSurname}`,
          referrerEmail: referrerEmail,
          referrerPhone: referrerPhone || undefined,
          referrerRelation: ref.relationship || undefined,
          source: `referral-form-${slug}`,
        });
      }
      setSubmitted(true);
    } catch (err) {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0a0a0a" }}>
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
          <p className="text-muted-foreground text-sm" data-testid="text-not-found-message">
            The advisor profile you're looking for doesn't exist or is no longer available.
          </p>
        </div>
      </div>
    );
  }

  if (!advisor.active) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold" data-testid="text-unavailable">Advisor Unavailable</h2>
          <p className="text-muted-foreground text-sm" data-testid="text-unavailable-message">
            This advisor is not currently accepting referrals.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: bgColor }}>
        <div className="text-center space-y-4 max-w-md">
          <CheckCircle2 className="h-16 w-16 mx-auto" style={{ color: accentColor }} />
          <h2 className="text-2xl font-bold" style={{ color: textColor }} data-testid="text-success-title">
            Thank You!
          </h2>
          <p className="text-sm" style={{ color: mutedText }} data-testid="text-success-message">
            Your referral{referrals.length > 1 ? "s have" : " has"} been submitted to{" "}
            <strong style={{ color: textColor }}>{advisor.name}</strong>. They will be in touch shortly.
          </p>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium mt-4"
            style={{
              backgroundColor: tc.buttonSecondaryBg,
              color: accentColor,
            }}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  const initials = getInitials(advisor.name);

  const inputStyle: React.CSSProperties = {
    backgroundColor: inputBg,
    border: `1px solid ${inputBorder}`,
    color: inputText,
    borderRadius: "0.5rem",
    padding: "0.625rem 0.75rem",
    fontSize: "0.875rem",
    width: "100%",
    outline: "none",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: "none" as const,
    backgroundImage: isDark
      ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='white' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`
      : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 0.75rem center",
    paddingRight: "2rem",
  };

  const labelStyle: React.CSSProperties = {
    color: mutedText,
    fontSize: "0.75rem",
    fontWeight: 500,
    marginBottom: "0.25rem",
    display: "block",
  };

  const checkboxRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    color: textColor,
    fontSize: "0.875rem",
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor, color: textColor }} data-testid="referral-form-container">
      <div className="max-w-md mx-auto px-5 py-8 space-y-6">
        <div className="flex items-center gap-3" data-testid="referral-advisor-header">
          {advisor.profilePicUrl ? (
            <img
              src={advisor.profilePicUrl}
              alt={advisor.name}
              className="w-12 h-12 rounded-full object-cover border"
              style={{ borderColor: inputBorder }}
              data-testid="img-advisor-pic"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                backgroundColor: tc.initialsCircleBg,
                color: accentColor,
                border: `1px solid ${inputBorder}`,
              }}
              data-testid="icon-advisor-initials"
            >
              {initials}
            </div>
          )}
          <div>
            <h2 className="font-semibold text-sm" data-testid="text-advisor-name">{advisor.name}</h2>
            {advisor.title && (
              <p className="text-xs" style={{ color: mutedText }} data-testid="text-advisor-title">
                {advisor.title}
              </p>
            )}
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold tracking-tight" data-testid="text-page-title">
            Refer Friends & Family
          </h1>
          <p className="text-sm mt-1" style={{ color: mutedText }}>
            Share the gift of professional financial advice with people you care about.
          </p>
        </div>

        <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: cardBg }} data-testid="section-referrer-details">
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: sectionTitle }}>
            Your Details
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>First Name *</label>
              <input
                type="text"
                placeholder="First name"
                value={referrerFirstName}
                onChange={(e) => setReferrerFirstName(e.target.value)}
                style={inputStyle}
                data-testid="input-referrer-firstname"
              />
            </div>
            <div>
              <label style={labelStyle}>Surname *</label>
              <input
                type="text"
                placeholder="Surname"
                value={referrerSurname}
                onChange={(e) => setReferrerSurname(e.target.value)}
                style={inputStyle}
                data-testid="input-referrer-surname"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Email *</label>
              <input
                type="email"
                placeholder="you@email.com"
                value={referrerEmail}
                onChange={(e) => setReferrerEmail(e.target.value)}
                style={inputStyle}
                data-testid="input-referrer-email"
              />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input
                type="tel"
                placeholder="+27 82 123 4567"
                value={referrerPhone}
                onChange={(e) => setReferrerPhone(e.target.value)}
                style={inputStyle}
                data-testid="input-referrer-phone"
              />
            </div>
          </div>
        </div>

        {referrals.map((ref, index) => (
          <div
            key={index}
            className="rounded-xl p-5 space-y-4"
            style={{ backgroundColor: cardBg }}
            data-testid={`section-referral-${index}`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: sectionTitle }}>
                Referral {referrals.length > 1 ? `#${index + 1}` : "Details"}
              </h3>
              {referrals.length > 1 && (
                <button
                  onClick={() => removeReferral(index)}
                  className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                  style={{ color: mutedText }}
                  data-testid={`button-remove-referral-${index}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>First Name *</label>
                <input
                  type="text"
                  placeholder="First name"
                  value={ref.firstName}
                  onChange={(e) => updateReferral(index, "firstName", e.target.value)}
                  style={inputStyle}
                  data-testid={`input-referral-firstname-${index}`}
                />
              </div>
              <div>
                <label style={labelStyle}>Surname *</label>
                <input
                  type="text"
                  placeholder="Surname"
                  value={ref.surname}
                  onChange={(e) => updateReferral(index, "surname", e.target.value)}
                  style={inputStyle}
                  data-testid={`input-referral-surname-${index}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Email *</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={ref.email}
                  onChange={(e) => updateReferral(index, "email", e.target.value)}
                  style={inputStyle}
                  data-testid={`input-referral-email-${index}`}
                />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  type="tel"
                  placeholder="+27 82 123 4567"
                  value={ref.phone}
                  onChange={(e) => updateReferral(index, "phone", e.target.value)}
                  style={inputStyle}
                  data-testid={`input-referral-phone-${index}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Age</label>
                <input
                  type="number"
                  placeholder="30"
                  min={18}
                  max={120}
                  value={ref.age}
                  onChange={(e) => updateReferral(index, "age", e.target.value)}
                  style={inputStyle}
                  data-testid={`input-referral-age-${index}`}
                />
              </div>
              <div>
                <label style={labelStyle}>Income Range</label>
                <select
                  value={ref.incomeRange}
                  onChange={(e) => updateReferral(index, "incomeRange", e.target.value)}
                  style={selectStyle}
                  data-testid={`select-referral-income-${index}`}
                >
                  <option value="">Select range</option>
                  {INCOME_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div style={checkboxRowStyle}>
                <input
                  type="checkbox"
                  checked={ref.married}
                  onChange={(e) => updateReferral(index, "married", e.target.checked)}
                  className="rounded"
                  data-testid={`checkbox-referral-married-${index}`}
                />
                <span>Married</span>
              </div>
              <div style={checkboxRowStyle}>
                <input
                  type="checkbox"
                  checked={ref.children}
                  onChange={(e) => updateReferral(index, "children", e.target.checked)}
                  className="rounded"
                  data-testid={`checkbox-referral-children-${index}`}
                />
                <span>Children</span>
              </div>
              <div style={checkboxRowStyle}>
                <input
                  type="checkbox"
                  checked={ref.vehicle}
                  onChange={(e) => updateReferral(index, "vehicle", e.target.checked)}
                  className="rounded"
                  data-testid={`checkbox-referral-vehicle-${index}`}
                />
                <span>Vehicle</span>
              </div>
              <div style={checkboxRowStyle}>
                <input
                  type="checkbox"
                  checked={ref.property}
                  onChange={(e) => updateReferral(index, "property", e.target.checked)}
                  className="rounded"
                  data-testid={`checkbox-referral-property-${index}`}
                />
                <span>Property</span>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Relationship</label>
              <select
                value={ref.relationship}
                onChange={(e) => updateReferral(index, "relationship", e.target.value)}
                style={selectStyle}
                data-testid={`select-referral-relationship-${index}`}
              >
                <option value="">Select relationship</option>
                {RELATIONSHIP_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Preferred Contact Time</label>
                <select
                  value={ref.preferredContactTime}
                  onChange={(e) => updateReferral(index, "preferredContactTime", e.target.value)}
                  style={selectStyle}
                  data-testid={`select-referral-contact-time-${index}`}
                >
                  <option value="">Select time</option>
                  {CONTACT_TIME_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Services</label>
                <select
                  value={ref.servicesRequested}
                  onChange={(e) => updateReferral(index, "servicesRequested", e.target.value)}
                  style={selectStyle}
                  data-testid={`select-referral-services-${index}`}
                >
                  <option value="">Select service</option>
                  {allServices.map((s) => (
                    <option key={s.key} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={checkboxRowStyle}>
              <input
                type="checkbox"
                checked={ref.confirmedOver18}
                onChange={(e) => updateReferral(index, "confirmedOver18", e.target.checked)}
                className="rounded"
                data-testid={`checkbox-referral-over18-${index}`}
              />
              <span className="text-sm">I confirm this person is over 18 years of age *</span>
            </div>
          </div>
        ))}

        {referrals.length < 4 && (
          <button
            onClick={addReferral}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-medium text-sm transition-opacity hover:opacity-80"
            style={{
              backgroundColor: tc.buttonSecondaryBg,
              color: accentColor,
              border: `1px dashed ${inputBorder}`,
            }}
            data-testid="button-add-referral"
          >
            <Plus className="h-4 w-4" />
            Add Another Referral ({referrals.length}/4)
          </button>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{
            backgroundColor: tc.buttonBg,
            color: tc.buttonText,
          }}
          data-testid="button-submit-referrals"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            `Submit Referral${referrals.length > 1 ? "s" : ""}`
          )}
        </button>

        {submitError && (
          <p className="text-red-500 text-sm text-center" data-testid="text-error">
            {submitError}
          </p>
        )}

        <p className="text-center text-xs pt-4 pb-2" style={{ color: mutedText }}>
          Powered by Advisory Connect
        </p>
      </div>
    </div>
  );
}
