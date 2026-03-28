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

const MARITAL_STATUS_OPTIONS = ["Single", "Married", "Divorced", "Widowed", "Life Partnership"];
const CHILDREN_COUNT = ["0", "1", "2", "3", "4", "5", "6+"];

export default function WillForm() {
  const [, profileParams] = useRoute("/profile/:slug/claim-will");
  const [, directParams] = useRoute("/:slug/claim-will");
  const slug = profileParams?.slug || directParams?.slug || "";

  const { data: advisor, isLoading, error } = useQuery<Advisor>({
    queryKey: [`/api/advisors/slug/${slug}`],
    enabled: !!slug,
  });

  const tc = getThemeColors(advisor?.theme);

  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [spouseName, setSpouseName] = useState("");
  const [numberOfChildren, setNumberOfChildren] = useState("");
  const [childrenDetails, setChildrenDetails] = useState("");
  const [address, setAddress] = useState("");
  const [incomeRange, setIncomeRange] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }); }, []);

  const submitMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/will-request", {
        advisorId: advisor!.id,
        fullName,
        idNumber: idNumber || undefined,
        dateOfBirth: dateOfBirth || undefined,
        email: email || undefined,
        phone: phone || undefined,
        maritalStatus: maritalStatus || undefined,
        spouseName: spouseName || undefined,
        numberOfChildren: numberOfChildren || undefined,
        childrenDetails: childrenDetails || undefined,
        address: address || undefined,
        incomeRange: incomeRange || undefined,
        source: `claim-will/${slug}`,
      });
    },
    onSuccess: () => setSubmitted(true),
  });

  const canSubmit = fullName.trim().length > 0 && confirmed && !submitMutation.isPending;

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
              Thank you, {fullName.split(" ")[0]}. Your complimentary Will request has been submitted. {advisor.name} will be in touch with you shortly.
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

  const InputField = ({
    label, value, onChange, placeholder, type = "text", required = false,
  }: {
    label: string; value: string; onChange: (v: string) => void;
    placeholder?: string; type?: string; required?: boolean;
  }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-medium" style={{ color: tc.mutedText }}>
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-colors"
        style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }}
      />
    </div>
  );

  const SelectField = ({
    label, value, onChange, options, placeholder,
  }: {
    label: string; value: string; onChange: (v: string) => void;
    options: string[]; placeholder?: string;
  }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-medium" style={{ color: tc.mutedText }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-colors appearance-none"
        style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: value ? tc.textColor : tc.mutedText }}
      >
        <option value="">{placeholder || `Select ${label.toLowerCase()}`}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: tc.bgColor }}>
      <div className="max-w-md mx-auto px-4 pt-5 space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" style={{ color: tc.textColor }} />
          </button>
          <div className="flex items-center gap-3 flex-1">
            {advisor.profilePicUrl ? (
              <img src={advisor.profilePicUrl} alt={advisor.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" style={{ border: `1.5px solid ${tc.initialsCircleBorder}` }} />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: tc.initialsCircleBg, color: tc.accentColor, border: `1.5px solid ${tc.initialsCircleBorder}` }}>
                {getInitials(advisor.name)}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold leading-tight" style={{ color: tc.textColor }}>{advisor.name}</p>
              {advisor.title && <p className="text-xs" style={{ color: tc.mutedText }}>{advisor.title}</p>}
            </div>
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
          <h2 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Personal Details</h2>
          <InputField label="Full Name" value={fullName} onChange={setFullName} placeholder="As it appears on your ID" required />
          <InputField label="ID Number" value={idNumber} onChange={setIdNumber} placeholder="South African ID number" />
          <InputField label="Date of Birth" value={dateOfBirth} onChange={setDateOfBirth} type="date" />
          <InputField label="Email Address" value={email} onChange={setEmail} type="email" placeholder="your@email.com" />
          <InputField label="Phone Number" value={phone} onChange={setPhone} type="tel" placeholder="+27 xx xxx xxxx" />
          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: tc.mutedText }}>Current Income</label>
            <select
              value={incomeRange}
              onChange={e => setIncomeRange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-colors"
              style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: incomeRange ? tc.textColor : tc.mutedText }}
              data-testid="select-will-income"
            >
              <option value="" style={{ backgroundColor: tc.isDark ? "#1a1a1a" : "#fff", color: tc.mutedText }}>Select income range</option>
              <option value="Above R15k p/m" style={{ backgroundColor: tc.isDark ? "#1a1a1a" : "#fff", color: tc.textColor }}>Above R15k p/m</option>
              <option value="Below R15k p/m" style={{ backgroundColor: tc.isDark ? "#1a1a1a" : "#fff", color: tc.textColor }}>Below R15k p/m</option>
            </select>
          </div>
          <InputField label="Residential Address" value={address} onChange={setAddress} placeholder="Street, City, Province" />
        </div>

        <div className="rounded-2xl p-4 space-y-4" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
          <h2 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Family Details</h2>
          <SelectField label="Marital Status" value={maritalStatus} onChange={setMaritalStatus} options={MARITAL_STATUS_OPTIONS} placeholder="Select marital status" />
          {(maritalStatus === "Married" || maritalStatus === "Life Partnership") && (
            <InputField label="Spouse / Partner Full Name" value={spouseName} onChange={setSpouseName} placeholder="Full name of spouse or partner" />
          )}
          <SelectField label="Number of Children" value={numberOfChildren} onChange={setNumberOfChildren} options={CHILDREN_COUNT} placeholder="Select number of children" />
          {numberOfChildren && numberOfChildren !== "0" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: tc.mutedText }}>Children's Names & Ages</label>
              <textarea
                value={childrenDetails}
                onChange={e => setChildrenDetails(e.target.value)}
                placeholder="e.g. Sarah (12), John (8)"
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none transition-colors"
                style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }}
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
            <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
              style={{ backgroundColor: confirmed ? tc.accentColor : "transparent", border: `2px solid ${confirmed ? tc.accentColor : tc.borderColor}` }}>
              {confirmed && <span className="text-white text-xs font-bold">✓</span>}
            </div>
            <p className="text-xs leading-relaxed" style={{ color: tc.mutedText }}>
              I confirm that I am over 18 years of age and that the information provided is accurate. I consent to being contacted by {advisor.name} regarding my complimentary Will.
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
      </div>
    </div>
  );
}
