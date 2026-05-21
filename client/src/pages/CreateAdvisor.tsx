import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2, Mail, Upload, ChevronDown, Check, X, Shield, FileText, ScrollText, CreditCard, User, Phone, FileCheck } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TITLE_OPTIONS, SUBSCRIPTION_TIERS } from "@shared/schema";
import { AdminImageCropper } from "@/components/AdminImageCropper";

function InitialsPreview({ name, size = 64 }: { name: string; size?: number }) {
  const parts = name.trim().split(" ").filter(Boolean);
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0]?.[0] || "N").toUpperCase() + (parts[0]?.[1] || "A").toUpperCase();
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="prev-ibg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4a8db5" />
          <stop offset="100%" stopColor="#1e3a5f" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="22" fill="url(#prev-ibg)" />
      <rect x="4" y="4" width="112" height="112" rx="19" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.8" />
      <text x="38" y="84" fontFamily="Georgia, 'Times New Roman', serif" fontSize="62" fontWeight="bold" fill="white" textAnchor="middle" opacity="0.92" letterSpacing="-2">{initials[0] || ""}</text>
      <text x="82" y="84" fontFamily="Georgia, 'Times New Roman', serif" fontSize="62" fontWeight="bold" fill="white" textAnchor="middle" opacity="0.78" letterSpacing="-2">{initials[1] || ""}</text>
    </svg>
  );
}

const STEPS = [
  { num: 1, label: "Personal Details", icon: User },
  { num: 2, label: "Terms of Service", icon: ScrollText },
  { num: 3, label: "FA Details", icon: FileText },
  { num: 4, label: "Login Email", icon: Mail },
  { num: 5, label: "Subscription", icon: CreditCard },
];

const TOS_PLACEHOLDER = `Welcome to Advisory Connect.

By accepting these terms, the advisor agrees to:

1. Use the platform in accordance with all applicable financial services regulations in South Africa, including the FAIS Act.

2. Maintain the accuracy of all client information shared through the platform and treat it with appropriate confidentiality.

3. Not use the platform to provide unauthorised financial advice outside the scope of their FAIS licence.

4. Allow Advisory Connect to send transactional emails (lead notifications, OTPs, account-related communications) to the registered email address.

5. Acknowledge that the public-facing profile served at app.advisoryconnect.pro/[their-slug] will be visible to anyone with the link.

The full Terms of Service document is currently being finalised and will be made available shortly. By ticking the box below, the advisor confirms they accept these interim terms and the formal Terms of Service once published.`;

export default function CreateAdvisor() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const picInputRef = useRef<HTMLInputElement>(null);
  const faisInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);

  // Step 1
  const [name, setName] = useState("");
  const [title, setTitle] = useState<string>(TITLE_OPTIONS[3]);
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [contactNumber, setContactNumber] = useState("");
  const [uploading, setUploading] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [notRobot, setNotRobot] = useState(false);

  // Step 2
  const [tosAccepted, setTosAccepted] = useState(false);

  // Step 3
  const [advisorCode, setAdvisorCode] = useState("");
  const [faisAgreementUrl, setFaisAgreementUrl] = useState<string | null>(null);
  const [faisFilename, setFaisFilename] = useState<string | null>(null);
  const [faisUploading, setFaisUploading] = useState(false);

  // Step 4
  const [email, setEmail] = useState("");

  // Step 5
  const [subscriptionTier, setSubscriptionTier] = useState<string>("trial");

  const formattedSlug = name.trim()
    ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    : "";

  const handlePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setCropperSrc(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropConfirm = async (dataUrl: string) => {
    setCropperSrc(null);
    setUploading(true);
    try {
      const [header, b64] = dataUrl.split(",");
      const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
      const bytes = atob(b64);
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      const blob = new Blob([arr], { type: mime });
      const fd = new FormData();
      fd.append("file", blob, "profile.jpg");
      const res = await fetch("/api/upload/profile-pic", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setProfilePicUrl(data.url);
    } catch {
      toast({ title: "Upload Failed", description: "Could not upload image.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleFaisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ title: "PDF only", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }
    setFaisUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/fais", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setFaisAgreementUrl(data.url);
      setFaisFilename(data.filename || file.name);
    } catch {
      toast({ title: "Upload Failed", description: "Could not upload PDF.", variant: "destructive" });
    } finally {
      setFaisUploading(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/advisors", {
        name,
        email,
        title,
        contactNumber: contactNumber || null,
        profilePicUrl: profilePicUrl || null,
        profileSlug: formattedSlug,
        theme: "blue",
        themeColor: "#4a8db5",
        panelTheme: "blue",
        panelThemeColor: "#4a8db5",
        bioOption: "a",
        active: true,
        entityType: "individual",
        showCallbackLink: true,
        showReferralsLink: true,
        showQrCode: true,
        showHeader: true,
        showProfilePic: true,
        showIntro: true,
        showSocials: true,
        advisorCode: advisorCode || null,
        faisAgreementUrl: faisAgreementUrl || null,
        tosAcceptedAt: tosAccepted ? new Date().toISOString() : null,
        subscriptionTier,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advisors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Advisor Created",
        description: `${name}'s account is ready. They will set their password on first login.`,
      });
      navigate("/manage");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Per-step validation
  const step1Valid = name.trim() !== "" && ageConfirmed && notRobot;
  const step2Valid = tosAccepted;
  const step3Valid = advisorCode.trim() !== "";
  const step4Valid = email.trim() !== "" && /\S+@\S+\.\S+/.test(email);
  const step5Valid = !!subscriptionTier;

  const stepValid = [step1Valid, step2Valid, step3Valid, step4Valid, step5Valid][step - 1];

  const next = () => {
    if (step < 5 && stepValid) setStep(step + 1);
  };
  const back = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <>
    {cropperSrc && (
      <AdminImageCropper
        src={cropperSrc}
        onConfirm={handleCropConfirm}
        onCancel={() => setCropperSrc(null)}
      />
    )}
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
        <Link href="/manage" className="hover:text-foreground flex items-center gap-1 transition-colors" data-testid="link-back-manage">
          <ArrowLeft className="h-4 w-4" />
          Back to Manage Advisors
        </Link>
      </div>

      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create New Advisor</h2>
        <p className="text-muted-foreground mt-1">A guided 5-step setup. The advisor can fine-tune everything else from their own panel.</p>
      </div>

      {/* Progress bar */}
      <div className="border border-border rounded-xl bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((s, idx) => {
            const isComplete = step > s.num;
            const isActive = step === s.num;
            const Icon = s.icon;
            return (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1.5 flex-shrink-0" data-testid={`step-indicator-${s.num}`}>
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all ${
                      isComplete
                        ? "bg-primary border-primary text-white"
                        : isActive
                        ? "bg-white border-primary text-primary ring-4 ring-primary/15"
                        : "bg-muted border-border text-muted-foreground"
                    }`}
                  >
                    {isComplete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={`text-[10px] font-medium text-center hidden sm:block whitespace-nowrap ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 transition-colors ${isComplete ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main step content */}
        <div className="lg:col-span-2">
          <Card className="border-border">
            <CardContent className="p-6 space-y-5">

              {/* STEP 1 — Personal Details + Security */}
              {step === 1 && (
                <div className="space-y-5" data-testid="step-1-content">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Step 1 — Personal Details</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">The advisor's name, photo and contact details, plus a quick security check.</p>
                  </div>

                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0">
                      {profilePicUrl ? (
                        <img src={profilePicUrl} alt="Profile" className="h-16 w-16 rounded-full object-cover border-2 border-border" />
                      ) : (
                        <InitialsPreview name={name} />
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="space-y-1.5">
                        <Label>Full Name <span className="text-red-500">*</span></Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" data-testid="input-advisor-name" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Title</Label>
                        <div className="relative">
                          <select
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm outline-none appearance-none pr-8"
                            data-testid="select-advisor-title"
                          >
                            {TITLE_OPTIONS.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Profile Picture (optional)</Label>
                    <input type="file" ref={picInputRef} accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handlePicUpload} />
                    <div className="flex gap-2 mt-1.5">
                      <Button variant="outline" size="sm" type="button" onClick={() => picInputRef.current?.click()} disabled={uploading} data-testid="button-upload-pic">
                        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
                        {profilePicUrl ? "Change Photo" : "Upload Photo"}
                      </Button>
                      {profilePicUrl && (
                        <Button variant="ghost" size="sm" type="button" onClick={() => setProfilePicUrl(null)} className="text-muted-foreground">
                          <X className="h-3.5 w-3.5 mr-1" /> Remove
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label><Phone className="h-3.5 w-3.5 inline mr-1.5 text-muted-foreground" />Contact Number</Label>
                    <Input
                      type="tel"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="+27 82 123 4567"
                      data-testid="input-contact-number"
                    />
                  </div>

                  {/* Security checks */}
                  <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-amber-700" />
                      <span className="text-sm font-semibold text-amber-900">Security Check</span>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer" data-testid="check-age">
                      <input
                        type="checkbox"
                        checked={ageConfirmed}
                        onChange={(e) => setAgeConfirmed(e.target.checked)}
                        className="mt-0.5 h-4 w-4 accent-primary"
                      />
                      <span className="text-sm text-amber-900">I confirm this advisor is over the age of 18.</span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer" data-testid="check-not-robot">
                      <input
                        type="checkbox"
                        checked={notRobot}
                        onChange={(e) => setNotRobot(e.target.checked)}
                        className="mt-0.5 h-4 w-4 accent-primary"
                      />
                      <span className="text-sm text-amber-900">I'm not a robot — I am setting up this profile manually.</span>
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 2 — Terms of Service */}
              {step === 2 && (
                <div className="space-y-5" data-testid="step-2-content">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2"><ScrollText className="h-4 w-4 text-primary" /> Step 2 — Terms of Service</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Interim terms — the full Terms of Service is being finalised.</p>
                  </div>

                  <div className="border border-border rounded-lg bg-muted/30 p-4 max-h-72 overflow-y-auto">
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{TOS_PLACEHOLDER}</p>
                  </div>

                  <label className="flex items-start gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5 cursor-pointer" data-testid="check-tos">
                    <input
                      type="checkbox"
                      checked={tosAccepted}
                      onChange={(e) => setTosAccepted(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-primary"
                    />
                    <span className="text-sm font-medium">
                      I confirm the advisor accepts the interim Terms of Service shown above and the formal Terms of Service once published.
                    </span>
                  </label>
                </div>
              )}

              {/* STEP 3 — FA Details */}
              {step === 3 && (
                <div className="space-y-5" data-testid="step-3-content">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Step 3 — Financial Advisor Details</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Their advisor code and signed FAIS agreement.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Advisor Code <span className="text-red-500">*</span></Label>
                    <Input
                      value={advisorCode}
                      onChange={(e) => setAdvisorCode(e.target.value)}
                      placeholder="e.g. FA-12345"
                      data-testid="input-advisor-code"
                    />
                    <p className="text-xs text-muted-foreground">The advisor's unique code from your FSP / brokerage.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label>FAIS Agreement (PDF only) <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                    <input type="file" ref={faisInputRef} accept="application/pdf" className="hidden" onChange={handleFaisUpload} />
                    {faisAgreementUrl ? (
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50">
                        <FileCheck className="h-5 w-5 text-emerald-700 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-emerald-900 truncate">{faisFilename || "FAIS Agreement.pdf"}</p>
                          <p className="text-xs text-emerald-700">Uploaded successfully</p>
                        </div>
                        <Button variant="outline" size="sm" type="button" onClick={() => faisInputRef.current?.click()} disabled={faisUploading}>
                          Replace
                        </Button>
                        <Button variant="ghost" size="sm" type="button" onClick={() => { setFaisAgreementUrl(null); setFaisFilename(null); }}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        onClick={() => faisInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl cursor-pointer border-2 border-dashed border-border hover:border-primary/40 transition-colors"
                        data-testid="upload-fais"
                      >
                        {faisUploading ? <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /> : <Upload className="h-7 w-7 text-muted-foreground" />}
                        <span className="text-sm text-muted-foreground">{faisUploading ? "Uploading..." : "Click to upload FAIS PDF"}</span>
                        <span className="text-xs text-muted-foreground/60">PDF only — max 10MB</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 4 — Login Email */}
              {step === 4 && (
                <div className="space-y-5" data-testid="step-4-content">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> Step 4 — Login Email</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">The email the advisor will use to access their Sub-Control Panel.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Email Address <span className="text-red-500">*</span></Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="advisor@example.com"
                      data-testid="input-advisor-email"
                    />
                  </div>

                  <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">What happens next</h4>
                    <ol className="text-xs text-blue-900/90 space-y-1.5 list-decimal list-inside leading-relaxed">
                      <li>You'll send the advisor their unique panel link from the Manage Advisors screen.</li>
                      <li>On their first visit, they'll set their own password (strong password rules apply).</li>
                      <li>A one-time password (OTP) will be emailed to the address above to verify it's really them.</li>
                      <li>Once verified, they'll have full access to their Sub-Control Panel.</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* STEP 5 — Subscription */}
              {step === 5 && (
                <div className="space-y-5" data-testid="step-5-content">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> Step 5 — Choose a Plan</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Pick the subscription tier this advisor will start on. Billing is not yet active — this is for your records.</p>
                  </div>

                  <div className="space-y-3">
                    {SUBSCRIPTION_TIERS.map((tier) => {
                      const selected = subscriptionTier === tier.value;
                      return (
                        <label
                          key={tier.value}
                          className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                          }`}
                          data-testid={`tier-${tier.value}`}
                        >
                          <input
                            type="radio"
                            name="tier"
                            value={tier.value}
                            checked={selected}
                            onChange={() => setSubscriptionTier(tier.value)}
                            className="mt-1 h-4 w-4 accent-primary"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-base font-semibold">{tier.label}</span>
                              <span className={`text-sm font-medium ${selected ? "text-primary" : "text-muted-foreground"}`}>{tier.price}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{tier.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 text-xs text-amber-900">
                    <strong>Note:</strong> The subscription service is a placeholder. The selected tier will be saved on the advisor's record but no payment will be collected yet.
                  </div>
                </div>
              )}

              {/* Footer nav */}
              <div className="flex items-center justify-between pt-5 border-t border-border">
                <Button
                  variant="outline"
                  type="button"
                  onClick={back}
                  disabled={step === 1}
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
                </Button>

                <span className="text-xs text-muted-foreground">Step {step} of 5</span>

                {step < 5 ? (
                  <Button
                    type="button"
                    onClick={next}
                    disabled={!stepValid}
                    data-testid="button-next"
                  >
                    Next <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => createMutation.mutate()}
                    disabled={!stepValid || createMutation.isPending}
                    data-testid="button-create"
                  >
                    {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                    Create Advisor
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right preview */}
        <div className="space-y-4">
          <Card className="border-border shadow-sm overflow-hidden sticky top-24">
            <CardContent className="p-0">
              <div
                className="flex flex-col items-center py-6 px-5 space-y-2 text-white"
                style={{ background: "linear-gradient(135deg, #4a8db5, #1e3a5f)" }}
              >
                {profilePicUrl ? (
                  <img src={profilePicUrl} alt="Profile" className="h-20 w-20 rounded-full object-cover border-4 border-white/30" />
                ) : (
                  <InitialsPreview name={name} size={80} />
                )}
                <div className="text-center">
                  <h3 className="text-base font-bold" data-testid="preview-name">{name || "New Advisor"}</h3>
                  <p className="text-xs opacity-80">{title}</p>
                </div>
              </div>
              <div className="p-4 space-y-2.5 text-xs">
                <Row label="Profile URL" value={formattedSlug ? `app.advisoryconnect.pro/${formattedSlug}` : "—"} />
                <Row label="Contact Number" value={contactNumber || "—"} />
                <Row label="Login Email" value={email || "—"} />
                <Row label="Advisor Code" value={advisorCode || "—"} />
                <Row label="FAIS Agreement" value={faisAgreementUrl ? "Uploaded" : "—"} highlight={!!faisAgreementUrl} />
                <Row label="Subscription" value={SUBSCRIPTION_TIERS.find(t => t.value === subscriptionTier)?.label || "—"} />
                <Row label="Terms of Service" value={tosAccepted ? "Accepted" : "—"} highlight={tosAccepted} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium truncate text-right ${highlight ? "text-emerald-600" : ""}`}>{value}</span>
    </div>
  );
}
