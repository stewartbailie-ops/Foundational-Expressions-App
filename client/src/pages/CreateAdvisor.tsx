import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, MapPin, Clock, Phone, Mail, Upload, LayoutDashboard, ChevronDown } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import {
  TITLE_OPTIONS,
  BIO_OPTIONS,
  INDIVIDUAL_SERVICES,
  CORPORATE_SERVICES,
} from "@shared/schema";

const THEME_OPTIONS = [
  { key: "blue", label: "Blue", bg: "linear-gradient(135deg, #4a8db5, #1e3a5f)", accent: "#4a8db5" },
  { key: "dark", label: "Black & White", bg: "#1a1a1a", accent: "#ffffff" },
  { key: "pink", label: "Pink", bg: "linear-gradient(135deg, #f472b6, #be185d)", accent: "#d4738a" },
];

export default function CreateAdvisor() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [location, setLocation] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [title, setTitle] = useState<string>(TITLE_OPTIONS[3]);
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [bioOption, setBioOption] = useState("a");
  const [customBio, setCustomBio] = useState("");
  const [selectedIndividual, setSelectedIndividual] = useState<string[]>([]);
  const [selectedCorporate, setSelectedCorporate] = useState<string[]>([]);
  const [theme, setTheme] = useState("blue");
  const [uploading, setUploading] = useState(false);

  const formattedSlug = name.trim()
    ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    : "new-advisor";

  const panelUrl = `${window.location.origin}/advisor/${formattedSlug}`;
  const profileUrl = `advisoryconnect.pro/${formattedSlug}`;
  const initials = name.trim()
    ? name.trim().split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "NA";

  const toggleService = (list: string[], setList: (v: string[]) => void, key: string) => {
    setList(list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);
  };

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

  const createMutation = useMutation({
    mutationFn: async () => {
      const themeColor = theme === "dark" ? "#1a1a1a" : theme === "pink" ? "#d4738a" : "#4a8db5";
      const res = await apiRequest("POST", "/api/advisors", {
        name,
        email,
        contactNumber: contactNumber || null,
        location: location || null,
        workingHours: workingHours || null,
        showContactDetails: true,
        title,
        profilePicUrl: profilePicUrl || null,
        bioOption,
        customBio: bioOption === "custom" ? customBio : null,
        bio: bioOption === "custom" ? customBio : BIO_OPTIONS[bioOption] || null,
        individualServices: selectedIndividual,
        corporateServices: selectedCorporate,
        profileSlug: formattedSlug,
        theme,
        themeColor,
        active: true,
        entityType: "individual",
        showCallbackLink: true,
        showReferralsLink: true,
        showQrCode: true,
        showHeader: true,
        showProfilePic: true,
        showIntro: true,
        showIndividualServices: true,
        showCorporateServices: true,
        showSocials: true,
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

  const selectedTheme = THEME_OPTIONS.find((t) => t.key === theme)!;
  const bioPreview = bioOption === "custom" ? customBio : BIO_OPTIONS[bioOption] || "";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <Link href="/manage" className="hover:text-foreground flex items-center gap-1 transition-colors" data-testid="link-back-manage">
          <ArrowLeft className="h-4 w-4" />
          Back to Manage Advisors
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create New Advisor</h2>
          <p className="text-muted-foreground mt-1">
            Set up the advisor's full profile. They can also adjust everything later from their own panel.
          </p>
        </div>
        <Button
          onClick={() => createMutation.mutate()}
          disabled={!isValid || createMutation.isPending}
          data-testid="button-deploy"
        >
          {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Create Advisor
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-4">
        <div className="xl:col-span-2 space-y-6">

          <Card className="border-border">
            <CardContent className="p-6 space-y-5">
              <h3 className="text-lg font-semibold border-b pb-2">Contact Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="space-y-1.5">
                <Label><Mail className="h-3.5 w-3.5 inline mr-1.5 text-muted-foreground" />E-Mail Address <span className="text-red-500">*</span></Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="advisor@example.com" data-testid="input-advisor-email" />
                <p className="text-xs text-muted-foreground">Used for referral summaries and displayed on their profile.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label><Phone className="h-3.5 w-3.5 inline mr-1.5 text-muted-foreground" />Contact Number</Label>
                  <Input type="tel" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="+27 12 345 6789" data-testid="input-contact-number" />
                </div>
                <div className="space-y-1.5">
                  <Label><Clock className="h-3.5 w-3.5 inline mr-1.5 text-muted-foreground" />Working Hours</Label>
                  <Input value={workingHours} onChange={(e) => setWorkingHours(e.target.value)} placeholder="Mon–Fri: 8:00–17:00" data-testid="input-working-hours" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label><MapPin className="h-3.5 w-3.5 inline mr-1.5 text-muted-foreground" />Location / Office Address</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Pretoria, Gauteng" data-testid="input-location" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6 space-y-5">
              <h3 className="text-lg font-semibold border-b pb-2">Profile Picture</h3>
              <input type="file" ref={fileInputRef} accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileUpload} />
              {profilePicUrl ? (
                <div className="flex items-center gap-4">
                  <img src={profilePicUrl} alt="Profile" className="h-20 w-20 rounded-full object-cover border-2 border-border" />
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Change Photo
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setProfilePicUrl(null)} className="text-muted-foreground block">
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 py-10 rounded-xl cursor-pointer border-2 border-dashed border-border hover:border-primary/40 transition-colors"
                  data-testid="upload-profile-pic"
                >
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">{uploading ? "Uploading..." : "Click to upload photo"}</span>
                  <span className="text-xs text-muted-foreground/60">PNG, JPG or WebP — max 5MB</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Introduction & Bio</h3>
              <div className="space-y-1.5">
                <Label>Bio Style</Label>
                <div className="relative">
                  <select
                    value={bioOption}
                    onChange={(e) => setBioOption(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm outline-none appearance-none pr-8"
                    data-testid="select-bio-option"
                  >
                    <option value="a">Option A — Single point of contact (concise)</option>
                    <option value="b">Option B — Referral-focused</option>
                    <option value="c">Option C — Full professional intro</option>
                    <option value="custom">Custom — Write your own</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              {bioOption === "custom" ? (
                <div className="space-y-1.5">
                  <Label>Custom Bio</Label>
                  <textarea
                    value={customBio}
                    onChange={(e) => setCustomBio(e.target.value)}
                    rows={5}
                    placeholder="Write a custom bio..."
                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm outline-none resize-none"
                    data-testid="textarea-custom-bio"
                  />
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-muted/40 border border-border">
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{bioPreview}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6 space-y-5">
              <h3 className="text-lg font-semibold border-b pb-2">Services</h3>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Individual Services</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {INDIVIDUAL_SERVICES.map((s) => (
                    <label key={s.key} className="flex items-center gap-2.5 cursor-pointer px-3 py-2.5 rounded-lg border border-border hover:bg-muted/30 transition-colors" data-testid={`checkbox-individual-${s.key}`}>
                      <input
                        type="checkbox"
                        checked={selectedIndividual.includes(s.key)}
                        onChange={() => toggleService(selectedIndividual, setSelectedIndividual, s.key)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm">{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Corporate Services</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {CORPORATE_SERVICES.map((s) => (
                    <label key={s.key} className="flex items-center gap-2.5 cursor-pointer px-3 py-2.5 rounded-lg border border-border hover:bg-muted/30 transition-colors" data-testid={`checkbox-corporate-${s.key}`}>
                      <input
                        type="checkbox"
                        checked={selectedCorporate.includes(s.key)}
                        onChange={() => toggleService(selectedCorporate, setSelectedCorporate, s.key)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm">{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Profile Theme</h3>
              <div className="grid grid-cols-3 gap-3">
                {THEME_OPTIONS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTheme(t.key)}
                    className="rounded-xl border-2 p-3 text-center transition-all hover:scale-[1.02]"
                    style={{ borderColor: theme === t.key ? "#4a8db5" : "#e5e7eb" }}
                    data-testid={`theme-${t.key}`}
                  >
                    <div className="w-full h-12 rounded-lg mb-2" style={{ background: t.bg }} />
                    <span className="text-xs font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted/30">
            <CardContent className="p-5">
              <h4 className="text-sm font-semibold mb-1">What happens next?</h4>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>Copy the advisor's control panel link and send it to them</li>
                <li>The advisor sets their own password on first visit</li>
                <li>They can refine their profile, create sub-profiles, and view their leads</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="sticky top-24 space-y-4">
            <Card className="border-border shadow-md overflow-hidden">
              <CardContent className="p-0">
                <div
                  className="flex flex-col items-center py-8 px-6 space-y-3 text-white"
                  style={{ background: selectedTheme.bg }}
                >
                  {profilePicUrl ? (
                    <img src={profilePicUrl} alt="Profile" className="h-24 w-24 rounded-full object-cover border-4 border-white/30" />
                  ) : (
                    <div
                      className="h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold border-2 border-white/30"
                      style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff" }}
                      data-testid="preview-initials"
                    >
                      {initials}
                    </div>
                  )}
                  <div className="text-center">
                    <h3 className="text-lg font-bold" data-testid="preview-name">{name || "Advisor Name"}</h3>
                    <p className="text-sm opacity-80">{title}</p>
                  </div>
                </div>

                {(selectedIndividual.length > 0 || selectedCorporate.length > 0) && (
                  <div className="px-5 py-3 border-t border-border">
                    <p className="text-xs text-muted-foreground font-medium mb-1.5">Selected Services</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[...selectedIndividual, ...selectedCorporate].map((key) => {
                        const all = [...INDIVIDUAL_SERVICES, ...CORPORATE_SERVICES];
                        const svc = all.find((s) => s.key === key);
                        return svc ? (
                          <span key={key} className="text-xs px-2 py-0.5 rounded-full bg-muted border border-border">{svc.name}</span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                <div className="px-5 py-4 space-y-3 border-t border-border">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                      <LayoutDashboard className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="font-medium">Control Panel Link</span>
                    </div>
                    <div className="p-2 bg-muted rounded-md text-xs font-mono break-all border" data-testid="text-panel-url">
                      {panelUrl}
                    </div>
                    <Button variant="outline" className="w-full gap-2 text-xs mt-2" onClick={copyPanelLink} disabled={!name.trim()} data-testid="button-copy-panel-link">
                      Copy & Send to Advisor
                    </Button>
                  </div>

                  {name.trim() && (
                    <div className="flex flex-col items-center pt-2 space-y-2">
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
