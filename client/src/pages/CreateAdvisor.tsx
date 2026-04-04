import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Mail, Upload, LayoutDashboard, ChevronDown, Check, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { TITLE_OPTIONS, BIO_OPTIONS, INDIVIDUAL_SERVICES, CORPORATE_SERVICES } from "@shared/schema";
import { THEME_OPTIONS } from "@/lib/themeUtils";

function InitialsPreview({ name, size = 72 }: { name: string; size?: number }) {
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

const SECTION_STYLE = "border border-border rounded-xl overflow-hidden";
const SECTION_HEADER = "px-5 pt-5 pb-3 border-b border-border bg-muted/20";

export default function CreateAdvisor() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState<string>(TITLE_OPTIONS[3]);
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Bio
  const [bioOption, setBioOption] = useState<"a" | "b" | "c" | "custom">("a");
  const [customBio, setCustomBio] = useState("");

  // Services
  const [individualServices, setIndividualServices] = useState<string[]>([]);
  const [corporateServices, setCorporateServices] = useState<string[]>([]);

  // Social
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  // Theme
  const [theme, setTheme] = useState("blue");

  const formattedSlug = name.trim()
    ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    : "new-advisor";

  const panelUrl = `${window.location.origin}/advisor/${formattedSlug}`;
  const profileUrl = `advisoryconnect.pro/${formattedSlug}`;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
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

  const toggleService = (key: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/advisors", {
        name,
        email,
        title,
        profilePicUrl: profilePicUrl || null,
        profileSlug: formattedSlug,
        theme,
        themeColor: "#4a8db5",
        bioOption,
        customBio: bioOption === "custom" ? customBio : null,
        bio: bioOption === "custom" ? customBio : BIO_OPTIONS[bioOption],
        individualServices: individualServices.length > 0 ? individualServices : null,
        corporateServices: corporateServices.length > 0 ? corporateServices : null,
        linkedinUrl: linkedinUrl || null,
        websiteUrl: websiteUrl || null,
        active: true,
        entityType: "individual",
        showCallbackLink: true,
        showReferralsLink: true,
        showQrCode: true,
        showHeader: true,
        showProfilePic: true,
        showIntro: true,
        showIndividualServices: individualServices.length > 0,
        showCorporateServices: corporateServices.length > 0,
        showSocials: !!(linkedinUrl || websiteUrl),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advisors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Advisor Created",
        description: `${name}'s account is ready. Copy their panel link and send it to them.`,
      });
      navigate("/manage");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const isValid = name.trim() !== "" && email.trim() !== "";

  const copyPanelLink = async () => {
    try {
      await navigator.clipboard.writeText(panelUrl);
      toast({ title: "Link Copied", description: "Send this link to the advisor to access their control panel." });
    } catch {
      toast({ title: "Panel URL", description: panelUrl });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
        <Link href="/manage" className="hover:text-foreground flex items-center gap-1 transition-colors" data-testid="link-back-manage">
          <ArrowLeft className="h-4 w-4" />
          Back to Manage Advisors
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create New Advisor</h2>
          <p className="text-muted-foreground mt-1">
            Set up the advisor's full profile. They can fine-tune everything from their own panel.
          </p>
        </div>
        <Button
          onClick={() => createMutation.mutate()}
          disabled={!isValid || createMutation.isPending}
          data-testid="button-deploy"
          className="gap-2"
        >
          {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Create Advisor
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-2">
        <div className="xl:col-span-2 space-y-5">

          {/* 1 — Header Details */}
          <div className={SECTION_STYLE}>
            <div className={SECTION_HEADER}>
              <h3 className="text-sm font-semibold">1. Advisor Details</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-5">
                <div className="flex-shrink-0">
                  <InitialsPreview name={name} />
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
              <div className="space-y-1.5">
                <Label><Mail className="h-3.5 w-3.5 inline mr-1.5 text-muted-foreground" />E-Mail Address <span className="text-red-500">*</span></Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="advisor@example.com" data-testid="input-advisor-email" />
                <p className="text-xs text-muted-foreground">This is the email they'll use to log into their own control panel.</p>
              </div>
            </div>
          </div>

          {/* 2 — Profile Picture */}
          <div className={SECTION_STYLE}>
            <div className={SECTION_HEADER}>
              <h3 className="text-sm font-semibold">2. Profile Picture</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Optional — the advisor can update this from their panel.</p>
            </div>
            <div className="p-5">
              <input type="file" ref={fileInputRef} accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileUpload} />
              {profilePicUrl ? (
                <div className="flex items-center gap-4">
                  <img src={profilePicUrl} alt="Profile" className="h-20 w-20 rounded-full object-cover border-2 border-border" />
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                      Change Photo
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setProfilePicUrl(null)} className="text-muted-foreground flex items-center gap-1">
                      <X className="h-3.5 w-3.5" /> Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl cursor-pointer border-2 border-dashed border-border hover:border-primary/40 transition-colors"
                  data-testid="upload-profile-pic"
                >
                  {uploading ? <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /> : <Upload className="h-7 w-7 text-muted-foreground" />}
                  <span className="text-sm text-muted-foreground">{uploading ? "Uploading..." : "Click to upload photo"}</span>
                  <span className="text-xs text-muted-foreground/60">PNG, JPG or WebP — max 5MB</span>
                </div>
              )}
            </div>
          </div>

          {/* 3 — Bio / Introduction */}
          <div className={SECTION_STYLE}>
            <div className={SECTION_HEADER}>
              <h3 className="text-sm font-semibold">3. Introduction / Bio</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Choose a pre-written bio or write a custom one.</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="relative">
                <select
                  value={bioOption}
                  onChange={(e) => setBioOption(e.target.value as "a" | "b" | "c" | "custom")}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm outline-none appearance-none pr-8"
                  data-testid="select-bio-option"
                >
                  <option value="a">Option A — Brief &amp; Professional</option>
                  <option value="b">Option B — Referral Friendly</option>
                  <option value="c">Option C — Full Overview</option>
                  <option value="custom">Custom — Write My Own</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              {bioOption !== "custom" ? (
                <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {BIO_OPTIONS[bioOption]}
                </div>
              ) : (
                <textarea
                  value={customBio}
                  onChange={(e) => setCustomBio(e.target.value)}
                  placeholder="Write the advisor's custom bio here..."
                  rows={5}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm outline-none resize-none"
                  data-testid="input-custom-bio"
                />
              )}
            </div>
          </div>

          {/* 4 — Individual Services */}
          <div className={SECTION_STYLE}>
            <div className={SECTION_HEADER}>
              <h3 className="text-sm font-semibold">4. Individual Services</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Select the services this advisor offers to individual clients.</p>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {INDIVIDUAL_SERVICES.map((svc) => {
                const checked = individualServices.includes(svc.key);
                return (
                  <label
                    key={svc.key}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${checked ? "border-primary/50 bg-primary/5" : "border-border hover:bg-muted/30"}`}
                    data-testid={`checkbox-individual-${svc.key}`}
                  >
                    <div
                      className={`mt-0.5 flex-shrink-0 h-4 w-4 rounded border flex items-center justify-center transition-colors ${checked ? "bg-primary border-primary" : "border-border bg-background"}`}
                      onClick={() => toggleService(svc.key, individualServices, setIndividualServices)}
                    >
                      {checked && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <div onClick={() => toggleService(svc.key, individualServices, setIndividualServices)}>
                      <p className="text-sm font-medium leading-tight">{svc.name}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="px-5 pb-4 flex gap-2">
              <button
                type="button"
                onClick={() => setIndividualServices(INDIVIDUAL_SERVICES.map((s) => s.key))}
                className="text-xs text-primary hover:underline"
              >Select all</button>
              <span className="text-xs text-muted-foreground">·</span>
              <button
                type="button"
                onClick={() => setIndividualServices([])}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >Clear</button>
            </div>
          </div>

          {/* 5 — Corporate Services */}
          <div className={SECTION_STYLE}>
            <div className={SECTION_HEADER}>
              <h3 className="text-sm font-semibold">5. Corporate Services</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Select the services this advisor offers to corporate clients.</p>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CORPORATE_SERVICES.map((svc) => {
                const checked = corporateServices.includes(svc.key);
                return (
                  <label
                    key={svc.key}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${checked ? "border-primary/50 bg-primary/5" : "border-border hover:bg-muted/30"}`}
                    data-testid={`checkbox-corporate-${svc.key}`}
                  >
                    <div
                      className={`mt-0.5 flex-shrink-0 h-4 w-4 rounded border flex items-center justify-center transition-colors ${checked ? "bg-primary border-primary" : "border-border bg-background"}`}
                      onClick={() => toggleService(svc.key, corporateServices, setCorporateServices)}
                    >
                      {checked && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <div onClick={() => toggleService(svc.key, corporateServices, setCorporateServices)}>
                      <p className="text-sm font-medium leading-tight">{svc.name}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="px-5 pb-4 flex gap-2">
              <button
                type="button"
                onClick={() => setCorporateServices(CORPORATE_SERVICES.map((s) => s.key))}
                className="text-xs text-primary hover:underline"
              >Select all</button>
              <span className="text-xs text-muted-foreground">·</span>
              <button
                type="button"
                onClick={() => setCorporateServices([])}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >Clear</button>
            </div>
          </div>

          {/* 6 — Social Links */}
          <div className={SECTION_STYLE}>
            <div className={SECTION_HEADER}>
              <h3 className="text-sm font-semibold">6. Social Links</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Optional — these appear on the public profile.</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">LinkedIn URL</Label>
                <Input
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/in/johndoe"
                  data-testid="input-linkedin-url"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Website URL</Label>
                <Input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://www.example.com"
                  data-testid="input-website-url"
                />
              </div>
            </div>
          </div>

          {/* 7 — Theme */}
          <div className={SECTION_STYLE}>
            <div className={SECTION_HEADER}>
              <h3 className="text-sm font-semibold">7. Profile Theme</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Choose the initial colour theme for this advisor's public profile.</p>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {THEME_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors text-sm ${theme === opt.value ? "border-primary/60 bg-primary/5 font-semibold" : "border-border hover:bg-muted/30"}`}
                    data-testid={`radio-theme-${opt.value}`}
                  >
                    <input
                      type="radio"
                      name="theme"
                      value={opt.value}
                      checked={theme === opt.value}
                      onChange={() => setTheme(opt.value)}
                      className="sr-only"
                    />
                    <div
                      className="h-4 w-4 rounded-full flex-shrink-0 border border-border"
                      style={{ background: getThemePreviewColor(opt.value) }}
                    />
                    {opt.label}
                    {theme === opt.value && <Check className="h-3.5 w-3.5 ml-auto text-primary" />}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <Card className="border-border bg-muted/30">
            <CardContent className="p-5">
              <h4 className="text-sm font-semibold mb-1">What happens next?</h4>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>Copy the advisor's control panel link below and send it to them</li>
                <li>They set their own password on their first visit</li>
                <li>They can update all settings, upload a cropped photo, and customise their profile from their own panel</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Right panel — preview & links */}
        <div className="space-y-5">
          <div className="sticky top-24 space-y-4">
            <Card className="border-border shadow-md overflow-hidden">
              <CardContent className="p-0">
                <div
                  className="flex flex-col items-center py-8 px-6 space-y-3 text-white"
                  style={{ background: "linear-gradient(135deg, #4a8db5, #1e3a5f)" }}
                >
                  {profilePicUrl ? (
                    <img src={profilePicUrl} alt="Profile" className="h-24 w-24 rounded-full object-cover border-4 border-white/30" />
                  ) : (
                    <InitialsPreview name={name} />
                  )}
                  <div className="text-center">
                    <h3 className="text-lg font-bold" data-testid="preview-name">{name || "Advisor Name"}</h3>
                    <p className="text-sm opacity-80">{title}</p>
                  </div>
                </div>

                <div className="px-5 py-4 space-y-4 border-t border-border">
                  {/* Services summary */}
                  {(individualServices.length > 0 || corporateServices.length > 0) && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Services selected</p>
                      <div className="flex flex-wrap gap-1">
                        {individualServices.length > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {individualServices.length} Individual
                          </span>
                        )}
                        {corporateServices.length > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {corporateServices.length} Corporate
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                      <LayoutDashboard className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="font-medium">Control Panel Link</span>
                    </div>
                    <div className="p-2 bg-muted rounded-md text-xs font-mono break-all border" data-testid="text-panel-url">
                      {panelUrl}
                    </div>
                    <Button variant="outline" className="w-full gap-2 text-xs mt-2" onClick={copyPanelLink} disabled={!name.trim()} data-testid="button-copy-panel-link">
                      Copy &amp; Send to Advisor
                    </Button>
                  </div>

                  {name.trim() && (
                    <div className="flex flex-col items-center space-y-2 pt-1">
                      <div className="p-3 rounded-xl bg-white border border-border">
                        <QRCodeSVG value={`https://${profileUrl}`} size={110} level="M" />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">{profileUrl}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function getThemePreviewColor(theme: string): string {
  const map: Record<string, string> = {
    blue: "linear-gradient(135deg,#4a8db5,#1e3a5f)",
    dark: "linear-gradient(135deg,#2a2a2a,#111)",
    pink: "linear-gradient(135deg,#d63384,#8b1a4a)",
    "light-blue": "linear-gradient(135deg,#7ec8e3,#3a9abf)",
    "dark-royal-purple": "linear-gradient(135deg,#6a0dad,#3b0764)",
    "dark-green": "linear-gradient(135deg,#1a7a3e,#0d3d1f)",
    gold: "linear-gradient(135deg,#c9a84c,#7d5f1f)",
    teal: "linear-gradient(135deg,#0d9488,#065f46)",
    red: "linear-gradient(135deg,#dc2626,#7f1d1d)",
    navy: "linear-gradient(135deg,#1e3a5f,#0a1628)",
    coral: "linear-gradient(135deg,#f97316,#c2410c)",
    silver: "linear-gradient(135deg,#94a3b8,#475569)",
  };
  return map[theme] || "#4a8db5";
}
