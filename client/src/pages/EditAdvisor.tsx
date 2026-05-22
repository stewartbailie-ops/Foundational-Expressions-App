import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Upload, Link as LinkIcon, Download, Loader2, X, ExternalLink, Copy, Check } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TITLE_OPTIONS, BIO_OPTIONS, INDIVIDUAL_SERVICES, CORPORATE_SERVICES } from "@shared/schema";
import { BackgroundPatternPicker } from "@/components/BackgroundPatternPicker";
import type { Advisor } from "@shared/schema";
import { AdminImageCropper } from "@/components/AdminImageCropper";

export default function EditAdvisor() {
  const [, params] = useRoute("/edit/:id");
  const advisorId = Number(params?.id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const { data: advisor, isLoading } = useQuery<Advisor>({
    queryKey: [`/api/advisors/${advisorId}`],
    enabled: !!advisorId,
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("Financial Advisor");
  const [bioOption, setBioOption] = useState("a");
  const [customBio, setCustomBio] = useState("");
  const [entityType, setEntityType] = useState("individual");
  const [theme, setTheme] = useState("dark");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [selectedIndividual, setSelectedIndividual] = useState<string[]>([]);
  const [selectedCorporate, setSelectedCorporate] = useState<string[]>([]);
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [backgroundStyle, setBackgroundStyle] = useState<number>(1);
  const [patternOpacity, setPatternOpacity] = useState<number>(50);
  const [imagePatternKey, setImagePatternKey] = useState<string | null>(null);

  useEffect(() => {
    if (advisor && !loaded) {
      setName(advisor.name);
      setEmail(advisor.email);
      setTitle(advisor.title || "Financial Advisor");
      setBioOption(advisor.bioOption || "a");
      setCustomBio(advisor.customBio || "");
      setEntityType(advisor.entityType);
      setTheme(advisor.theme || "dark");
      setLinkedinUrl(advisor.linkedinUrl || "");
      setWebsiteUrl(advisor.websiteUrl || "");
      setSelectedIndividual(advisor.individualServices || []);
      setSelectedCorporate(advisor.corporateServices || []);
      setProfilePicUrl(advisor.profilePicUrl || null);
      setIsDemo(!!(advisor as any).isDemo);
      setBackgroundStyle(((advisor as any).backgroundStyle as number) || 1);
      setPatternOpacity(((advisor as any).patternOpacity as number) ?? 50);
      setImagePatternKey(((advisor as any).imagePatternKey as string | null) ?? null);
      setLoaded(true);
    }
  }, [advisor, loaded]);

  const slug = advisor?.profileSlug || "";
  const profileUrl = `https://app.advisoryconnect.pro/${slug}`;
  const initials = name.trim() ? name.trim().split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "NA";
  const bioText = bioOption === "custom" ? customBio : BIO_OPTIONS[bioOption] || "";
  const themeInitialsBg = theme === "pink" ? "bg-pink-800 text-pink-100" : theme === "blue" ? "bg-blue-800 text-blue-100" : "bg-neutral-800 text-white";

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const formData = new FormData();
      formData.append("file", blob, "profile.jpg");
      const res = await fetch("/api/upload/profile-pic", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setProfilePicUrl(data.url);
    } catch {
      toast({ title: "Upload Failed", description: "Could not upload the image.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/advisors/${advisorId}`, {
        name,
        email,
        title,
        bio: bioText,
        bioOption,
        customBio: bioOption === "custom" ? customBio : null,
        entityType,
        themeColor: theme === "dark" ? "#1a1a1a" : theme === "blue" ? "#1e3a5f" : "#d4738a",
        theme,
        linkedinUrl: linkedinUrl || null,
        websiteUrl: websiteUrl || null,
        profilePicUrl: profilePicUrl || null,
        individualServices: selectedIndividual,
        corporateServices: selectedCorporate,
        isDemo,
        backgroundStyle,
        patternOpacity,
        imagePatternKey,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advisors"] });
      queryClient.invalidateQueries({ queryKey: [`/api/advisors/${advisorId}`] });
      toast({ title: "Profile Updated", description: `${name}'s profile has been saved.` });
      navigate("/manage");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleService = (list: string[], setList: (v: string[]) => void, key: string) => {
    setList(list.includes(key) ? list.filter(s => s !== key) : [...list, key]);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading || !loaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isValid = name.trim() !== "" && email.trim() !== "";

  return (
    <>
    {cropperSrc && (
      <AdminImageCropper
        src={cropperSrc}
        onConfirm={handleCropConfirm}
        onCancel={() => setCropperSrc(null)}
      />
    )}
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <Link href="/manage" className="hover:text-foreground flex items-center gap-1 transition-colors" data-testid="link-back-manage">
          <ArrowLeft className="h-4 w-4" />
          Back to Manage Advisors
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Profile</h2>
          <p className="text-muted-foreground mt-1">Update {name}'s profile settings</p>
        </div>
        <div className="flex gap-2">
          <a href={`/profile/${slug}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2" data-testid="button-view-profile">
              <ExternalLink className="h-4 w-4" />
              View Profile
            </Button>
          </a>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!isValid || saveMutation.isPending}
            data-testid="button-save"
          >
            {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-4">
        <div className="xl:col-span-2 space-y-6">

          <Card className={isDemo ? "border-amber-500/60 bg-amber-50 dark:bg-amber-950/20" : "border-border"}>
            <CardContent className="p-5 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox checked={isDemo} onCheckedChange={(v) => setIsDemo(!!v)} data-testid="checkbox-is-demo" className="mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-sm flex items-center gap-2">
                    Demo / Test Profile
                    {isDemo && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white uppercase tracking-wide">Public Demo</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    When enabled, anyone with the control panel link can view and play with this advisor's panel — <strong>no email/password required</strong>. Perfect for sharing demos via WhatsApp to prospective advisors. Leave OFF for real, paying advisors.
                  </p>
                </div>
              </label>
              {isDemo && <DemoLeadTopUp />}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6 space-y-5">
              <h3 className="text-lg font-semibold border-b pb-2">Header</h3>
              <div className="flex items-center gap-6">
                {profilePicUrl ? (
                  <img src={profilePicUrl} alt="Profile" className="h-20 w-20 rounded-full object-cover shrink-0 border-2 border-border" />
                ) : (
                  <div className={`h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold shrink-0 ${themeInitialsBg}`}>
                    {initials}
                  </div>
                )}
                <div className="flex-1 space-y-3">
                  <div className="space-y-1.5">
                    <Label>Full Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" data-testid="input-advisor-name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Title</Label>
                    <Select value={title} onValueChange={setTitle}>
                      <SelectTrigger data-testid="select-title"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TITLE_OPTIONS.map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Profile Picture</h3>
              <input type="file" ref={fileInputRef} accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileUpload} />
              {profilePicUrl ? (
                <div className="flex flex-col items-center gap-3">
                  <img src={profilePicUrl} alt="Preview" className="h-32 w-32 rounded-full object-cover border-2 border-border" />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Change</Button>
                    <Button variant="outline" size="sm" onClick={() => setProfilePicUrl(null)}><X className="h-3 w-3 mr-1" /> Remove</Button>
                  </div>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group">
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-background border border-border flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-sm font-medium">{uploading ? "Uploading..." : "Click to Upload Profile Picture"}</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">PNG, JPG, WebP up to 5MB</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Introduction/Bio, Individual Services, Corporate Services, and
              Links to Socials cards removed from the master Edit Advisor form
              — these are now managed by each advisor inside their own sub-
              control panel (Settings + Profile pages), so the master form
              stays focused on the core record. State (bioOption, customBio,
              selectedIndividual/Corporate, linkedinUrl, websiteUrl) is kept
              in scope so existing values still post-back unchanged. */}

          <Card className="border-border">
            <CardContent className="p-6 space-y-5">
              <h3 className="text-lg font-semibold border-b pb-2">Settings</h3>
              <div className="space-y-1.5">
                <Label>Email Address</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="advisor@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex gap-4">
                  <button onClick={() => setTheme("dark")} className={`flex-1 rounded-xl border-2 p-4 text-center transition-all ${theme === "dark" ? "border-black ring-2 ring-black/20" : "border-border hover:border-black/30"}`}>
                    <div className="w-full h-16 rounded-lg bg-neutral-900 mb-2 flex items-center justify-center"><span className="text-white text-xs font-medium">Dark</span></div>
                    <span className="text-sm font-medium">Black & White</span>
                  </button>
                  <button onClick={() => setTheme("blue")} className={`flex-1 rounded-xl border-2 p-4 text-center transition-all ${theme === "blue" ? "border-blue-500 ring-2 ring-blue-500/20" : "border-border hover:border-blue-300"}`}>
                    <div className="w-full h-16 rounded-lg bg-gradient-to-br from-blue-500 to-blue-800 mb-2 flex items-center justify-center"><span className="text-white text-xs font-medium">Blue</span></div>
                    <span className="text-sm font-medium">Blue</span>
                  </button>
                  <button onClick={() => setTheme("pink")} className={`flex-1 rounded-xl border-2 p-4 text-center transition-all ${theme === "pink" ? "border-pink-500 ring-2 ring-pink-500/20" : "border-border hover:border-pink-300"}`}>
                    <div className="w-full h-16 rounded-lg bg-gradient-to-br from-pink-400 to-pink-700 mb-2 flex items-center justify-center"><span className="text-white text-xs font-medium">Pink</span></div>
                    <span className="text-sm font-medium">Pink</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Advisors can pick from 12 themes inside their own panel — this only sets the starting theme.</p>
              </div>
              <BackgroundPatternPicker
                value={backgroundStyle}
                opacity={patternOpacity}
                onChange={setBackgroundStyle}
                onOpacityChange={setPatternOpacity}
                imagePatternKey={imagePatternKey}
                onImagePatternKeyChange={setImagePatternKey}
                premium={true}
              />
              <div className="space-y-1.5">
                <Label>Entity Type</Label>
                <Select value={entityType} onValueChange={setEntityType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual Advisor</SelectItem>
                    <SelectItem value="corporate">Corporate Practice</SelectItem>
                    <SelectItem value="team">Team / Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="sticky top-24 space-y-6">
            <Card className="border-border shadow-md overflow-hidden">
              <CardContent className="flex flex-col items-center justify-center p-8">
                {profilePicUrl ? (
                  <img src={profilePicUrl} alt="Profile" className="h-24 w-24 rounded-full object-cover mb-4 border-2 border-border" />
                ) : (
                  <div className={`h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold mb-4 ${themeInitialsBg}`}>{initials}</div>
                )}
                <h3 className="text-lg font-bold text-center">{name || "Advisor Name"}</h3>
                <p className="text-sm text-muted-foreground">{title}</p>

                <div className="mt-6 p-4 bg-white rounded-xl shadow-sm border border-border">
                  <QRCodeSVG value={profileUrl} size={200} level="H" includeMargin={true} fgColor="#000000" bgColor="#ffffff" />
                </div>

                <div className="w-full mt-4 space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Profile URL</div>
                  <div className="p-2 bg-muted rounded-md text-xs font-mono break-all border">{profileUrl}</div>
                  <Button variant="outline" className="w-full gap-2 text-xs" onClick={copyLink} data-testid="button-copy-link">
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied!" : "Copy Profile Link"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-muted/30">
              <CardContent className="p-5">
                <h4 className="text-sm font-semibold mb-2">Profile Summary</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Theme: {theme === "dark" ? "Black & White" : theme === "blue" ? "Blue" : "Pink"}</p>
                  <p>Profile Pic: {profilePicUrl ? "Set" : "Not set"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

function DemoLeadTopUp() {
  const { toast } = useToast();
  const [count, setCount] = useState(5);
  const topUp = useMutation({
    mutationFn: async (perAdvisor: number) => {
      const res = await apiRequest("POST", "/api/demo-emails/topup", { perAdvisor });
      return res.json() as Promise<{ advisors: number; leadsAdded: number; perAdvisor: number }>;
    },
    onSuccess: (r) => {
      toast({
        title: "Demo leads topped up",
        description: r.advisors === 0
          ? "No demo profiles found to top up."
          : `Added ${r.leadsAdded} fresh leads across ${r.advisors} demo profile${r.advisors === 1 ? "" : "s"}.`,
      });
      queryClient.invalidateQueries({ predicate: (q) => {
        const k = q.queryKey?.[0];
        return typeof k === "string" && (k.includes("/emails") || k.includes("/stats"));
      }});
    },
    onError: (e: any) => {
      toast({ variant: "destructive", title: "Top-up failed", description: e?.message || "Please try again." });
    },
  });

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-100/60 dark:bg-amber-900/20 p-3 space-y-2">
      <div className="text-xs font-semibold text-amber-900 dark:text-amber-200">Top up demo leads</div>
      <p className="text-[11px] text-amber-800/80 dark:text-amber-200/70 leading-relaxed">
        Adds fresh synthetic leads to <strong>every</strong> demo profile (not just this one). Leads are realistic SA names, ages, incomes and grades — spread across Call Backs, Referrals and Will Requests over the last 30 days. Manual top-up only; nothing seeds automatically on restart or republish.
      </p>
      <div className="flex items-center gap-2">
        <Label htmlFor="demo-topup-count" className="text-[11px] text-amber-900 dark:text-amber-200">Per profile</Label>
        <Input
          id="demo-topup-count"
          type="number"
          min={1}
          max={50}
          value={count}
          onChange={(e) => setCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
          className="h-8 w-20 text-xs"
          data-testid="input-demo-topup-count"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 text-xs border-amber-500 text-amber-900 hover:bg-amber-200 dark:text-amber-200 dark:hover:bg-amber-900/40"
          disabled={topUp.isPending}
          onClick={() => topUp.mutate(count)}
          data-testid="button-demo-topup"
        >
          {topUp.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          Top up
        </Button>
      </div>
    </div>
  );
}