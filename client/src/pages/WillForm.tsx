import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, CheckCircle2, ArrowLeft, FileText, AlertCircle } from "lucide-react";
import type { Advisor } from "@shared/schema";
import { getThemeColors } from "@/lib/themeUtils";
import { apiRequest } from "@/lib/queryClient";

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
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

export default function WillForm() {
  const [, profileParams] = useRoute("/profile/:slug/claim-will");
  const [, directParams] = useRoute("/:slug/claim-will");
  const slug = profileParams?.slug || directParams?.slug || "";

  const { data: advisor, isLoading, error } = useQuery<Advisor>({
    queryKey: [`/api/advisors/slug/${slug}`],
    enabled: !!slug,
  });

  const tc = getThemeColors(advisor?.theme);

  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [married, setMarried] = useState(false);
  const [spouseName, setSpouseName] = useState("");
  const [hasChildren, setHasChildren] = useState(false);
  const [childrenDetails, setChildrenDetails] = useState("");
  const [incomeRange, setIncomeRange] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }); }, []);

  const fullName = `${firstName.trim()} ${surname.trim()}`.trim();

  const submitMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/will-request", {
        advisorId: advisor!.id,
        fullName,
        age: age ? parseInt(age) : undefined,
        email: email || undefined,
        phone: phone || undefined,
        maritalStatus: married ? "Married" : "Single",
        spouseName: married ? (spouseName || undefined) : undefined,
        numberOfChildren: hasChildren ? "1+" : "0",
        childrenDetails: hasChildren ? (childrenDetails || undefined) : undefined,
        incomeRange: incomeRange || undefined,
        source: `claim-will/${slug}`,
        sourceProfileSlug: slug || undefined,
      });
    },
    onSuccess: () => setSubmitted(true),
  });

  const canSubmit = firstName.trim().length > 0 && surname.trim().length > 0 && confirmed && !submitMutation.isPending;

  const inputStyle: React.CSSProperties = {
    backgroundColor: tc.inputBg,
    border: `1px solid ${tc.inputBorder}`,
    color: tc.textColor,
    borderRadius: "0.75rem",
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

  const labelStyle: React.CSSProperties = {
    color: tc.mutedText,
    fontSize: "0.75rem",
    fontWeight: 600,
    marginBottom: "0.25rem",
    display: "block",
  };

  const req = <span style={{ color: "#ef4444" }}>*</span>;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0a0a0a" }}>
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
      </div>
    );
  }

  if (error || !advisor) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="text-center">
          <AlertCircle className="h-10 w-10 mx-auto mb-3 text-red-400" />
          <p className="text-white/60 text-sm">Advisor profile not found.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: tc.bgColor }}>
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: "rgba(34,197,94,0.15)" }}>
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2" style={{ color: tc.textColor }}>Request Received!</h2>
            <p className="text-sm leading-relaxed" style={{ color: tc.mutedText }}>
              Thank you, {firstName}. Your complimentary Will request has been submitted. {advisor.name} will be in touch with you shortly.
            </p>
          </div>
          <button
            onClick={() => window.location.href = `/${slug}`}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: tc.bgColor }}>
      <div className="max-w-md mx-auto px-4 pt-5 space-y-5">

        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-sm font-medium mb-2"
          style={{ color: tc.mutedText }}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex items-center gap-4 rounded-xl px-4 py-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }} data-testid="advisor-header">
          {advisor.profilePicUrl ? (
            <img src={advisor.profilePicUrl} alt={advisor.name} className="h-12 w-12 rounded-full object-cover border-2 flex-shrink-0" style={{ borderColor: tc.initialsCircleBorder }} />
          ) : (
            <div className="h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: tc.initialsCircleBg, color: tc.accentColor, border: `2px solid ${tc.initialsCircleBorder}` }}>
              {getInitials(advisor.name)}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: tc.textColor }}>{advisor.name}</p>
            {advisor.title && <p className="text-xs truncate" style={{ color: tc.mutedText }}>{advisor.title}</p>}
          </div>
        </div>

        <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" style={{ color: tc.accentColor }} />
            <h1 className="text-base font-bold" style={{ color: tc.textColor }}>Claim Your Free Will</h1>
          </div>
          <p className="text-sm leading-relaxed font-medium" style={{ color: tc.textColor }}>
            Over 70% of South Africans die without a Will — should something happen to you yesterday, is your family protected?
          </p>
          <p className="text-xs leading-relaxed" style={{ color: tc.mutedText }}>
            Please fill in the information below and {advisor.name} will reach out to you to arrange your complimentary Will.
          </p>
        </div>

        <div className="rounded-2xl p-4 space-y-4" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: tc.sectionTitle }}>Personal Details</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>First Name {req}</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="John"
                style={inputStyle}
                data-testid="input-will-firstname"
              />
            </div>
            <div>
              <label style={labelStyle}>Surname {req}</label>
              <input
                type="text"
                value={surname}
                onChange={e => setSurname(e.target.value)}
                placeholder="Smith"
                style={inputStyle}
                data-testid="input-will-surname"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Phone Number {req}</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="0821234567"
                style={inputStyle}
                data-testid="input-will-phone"
              />
            </div>
            <div>
              <label style={labelStyle}>Age</label>
              <input
                type="number"
                value={age}
                onChange={e => setAge(e.target.value)}
                placeholder="e.g. 35"
                min={18}
                max={120}
                style={inputStyle}
                data-testid="input-will-age"
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>E-mail Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="john@example.co.za"
              style={inputStyle}
              data-testid="input-will-email"
            />
          </div>

          <div>
            <label style={labelStyle}>Income Range</label>
            <select
              value={incomeRange}
              onChange={e => setIncomeRange(e.target.value)}
              style={selectStyle}
              data-testid="select-will-income"
            >
              <option value="" style={{ backgroundColor: tc.isDark ? "#1a1a1a" : "#fff", color: tc.mutedText }}>Select income range</option>
              {INCOME_RANGES.map(r => (
                <option key={r} value={r} style={{ backgroundColor: tc.isDark ? "#1a1a1a" : "#fff", color: tc.textColor }}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-2xl p-4 space-y-4" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: tc.sectionTitle }}>Family Details</h2>

          <div className="grid grid-cols-2 gap-x-3 gap-y-3">
            <label
              className="flex items-center gap-2 text-sm cursor-pointer"
              style={{ color: tc.textColor }}
              data-testid="checkbox-will-married"
            >
              <input
                type="checkbox"
                checked={married}
                onChange={e => setMarried(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-xs">Are you married</span>
            </label>
            <label
              className="flex items-center gap-2 text-sm cursor-pointer"
              style={{ color: tc.textColor }}
              data-testid="checkbox-will-children"
            >
              <input
                type="checkbox"
                checked={hasChildren}
                onChange={e => setHasChildren(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-xs">Do you have children</span>
            </label>
          </div>

          {married && (
            <div>
              <label style={labelStyle}>Spouse / Partner Full Name</label>
              <input
                type="text"
                value={spouseName}
                onChange={e => setSpouseName(e.target.value)}
                placeholder="Full name of spouse or partner"
                style={inputStyle}
                data-testid="input-will-spouse"
              />
            </div>
          )}

          {hasChildren && (
            <div className="space-y-1.5">
              <label style={labelStyle}>Children's Names & Ages</label>
              <textarea
                value={childrenDetails}
                onChange={e => setChildrenDetails(e.target.value)}
                placeholder="e.g. Sarah (12), John (8)"
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none transition-colors"
                style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }}
                data-testid="input-will-children-details"
              />
            </div>
          )}
        </div>

        <div className="rounded-2xl p-4" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
          <div
            className="flex items-start gap-3 cursor-pointer"
            onClick={() => setConfirmed(v => !v)}
            data-testid="checkbox-confirm"
          >
            <div
              className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
              style={{
                backgroundColor: confirmed ? tc.accentColor : "transparent",
                border: `2px solid ${confirmed ? tc.accentColor : tc.borderColor}`,
              }}
            >
              {confirmed && <span className="text-white text-xs font-bold">✓</span>}
            </div>
            <p className="text-xs leading-relaxed" style={{ color: tc.mutedText }}>
              I confirm that I am over 18 years of age and that the information provided is accurate. I consent to being contacted by {advisor.name} regarding my complimentary Will. <span style={{ color: "#ef4444" }}>*</span>
            </p>
          </div>
        </div>

        {submitMutation.isError && (
          <div className="rounded-xl p-3 text-xs text-red-400 flex items-center gap-2" style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            Something went wrong. Please try again.
          </div>
        )}

        <button
          onClick={() => submitMutation.mutate()}
          disabled={!canSubmit}
          className="w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-opacity"
          style={{
            backgroundColor: canSubmit ? tc.buttonBg : tc.inputBg,
            color: canSubmit ? tc.buttonText : tc.mutedText,
            opacity: canSubmit ? 1 : 0.6,
          }}
          data-testid="button-submit-will"
        >
          {submitMutation.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
          ) : (
            <>Submit Will Request</>
          )}
        </button>

        <p className="text-center text-xs pt-2 pb-2" style={{ color: tc.mutedText }}>
          Powered by Advisory Connect
        </p>
      </div>
    </div>
  );
}
