import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Upload, Link as LinkIcon, Download, Loader2, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TITLE_OPTIONS, BIO_OPTIONS, INDIVIDUAL_SERVICES, CORPORATE_SERVICES } from "@shared/schema";

export default function CreateAdvisor() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [uploading, setUploading] = useState(false);

  const formattedSlug = name.trim() ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "new-advisor";
  const profileUrl = `https://advisoryconnect.pro/${formattedSlug}`;
  const initials = name.trim() ? name.trim().split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "NA";

  const bioText = bioOption === "custom" ? customBio : BIO_OPTIONS[bioOption] || "";

  const themeInitialsBg = theme === "pink" ? "bg-pink-800 text-pink-100" : theme === "blue" ? "bg-blue-800 text-blue-100" : "bg-neutral-800 text-white";

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/profile-pic", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setProfilePicUrl(data.url);
    } catch {
      toast({ title: "Upload Failed", description: "Could not upload the image. Try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/advisors", {
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
        profileSlug: formattedSlug,
        profilePicUrl: profilePicUrl || null,
        individualServices: selectedIndividual,
        corporateServices: selectedCorporate,
        active: true,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advisors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Profile Created", description: `${name}'s profile has been deployed successfully.` });
      navigate("/manage");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleService = (list: string[], setList: (v: string[]) => void, key: string) => {
    setList(list.includes(key) ? list.filter(s => s !== key) : [...list, key]);
  };

  const isValid = name.trim() !== "" && email.trim() !== "";

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
          <p className="text-muted-foreground mt-1">Configure all profile details below. The profile will be live at advisoryconnect.pro/{formattedSlug}</p>
        </div>
        <Button
          onClick={() => createMutation.mutate()}
          disabled={!isValid || createMutation.isPending}
          data-testid="button-deploy"
        >
          {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Deploy Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-4">
        <div className="xl:col-span-2 space-y-6">

          <Card className="border-border">
            <CardContent className="p-6 space-y-5">
              <h3 className="text-lg font-semibold border-b pb-2">Header</h3>

              <div className="flex items-center gap-6">
                {profilePicUrl ? (
                  <img src={profilePicUrl} alt="Profile" className="h-20 w-20 rounded-full object-cover shrink-0 border-2 border-border" />
                ) : (
                  <div className={`h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold shrink-0 ${themeInitialsBg}`} data-testid="preview-initials">
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
                      <SelectTrigger data-testid="select-title">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TITLE_OPTIONS.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
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
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileUpload}
                data-testid="input-profile-pic"
              />
              {profilePicUrl ? (
                <div className="flex flex-col items-center gap-3">
                  <img src={profilePicUrl} alt="Preview" className="h-32 w-32 rounded-full object-cover border-2 border-border" />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} data-testid="button-change-pic">
                      Change
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setProfilePicUrl(null)} data-testid="button-remove-pic">
                      <X className="h-3 w-3 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-background border border-border flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-sm font-medium">{uploading ? "Uploading..." : "Click to Upload Profile Picture"}</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">PNG, JPG, WebP up to 5MB. Image will be rounded.</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Introduction, Overview & Bio</h3>
              <div className="space-y-1.5">
                <Label>Pre-scripted Introduction</Label>
                <Select value={bioOption} onValueChange={setBioOption}>
                  <SelectTrigger data-testid="select-bio-option">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a">Option A - Core focus overview</SelectItem>
                    <SelectItem value="b">Option B - Integrated strategic approach</SelectItem>
                    <SelectItem value="c">Option C - Clarity & structure focus</SelectItem>
                    <SelectItem value="custom">Custom Biography</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {bioOption === "custom" ? (
                <div className="space-y-1.5">
                  <Label>Custom Biography</Label>
                  <Textarea
                    value={customBio}
                    onChange={(e) => setCustomBio(e.target.value)}
                    placeholder="Write a personalized biography..."
                    className="min-h-[150px] resize-none"
                    data-testid="textarea-custom-bio"
                  />
                </div>
              ) : (
                <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground leading-relaxed border whitespace-pre-line" data-testid="text-bio-preview">
                  {BIO_OPTIONS[bioOption]}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Individual Services & Descriptions</h3>
              <p className="text-sm text-muted-foreground">Select which services to show on this advisor's profile.</p>
              <div className="space-y-3">
                {INDIVIDUAL_SERVICES.map(service => (
                  <label key={service.key} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer">
                    <Checkbox
                      checked={selectedIndividual.includes(service.key)}
                      onCheckedChange={() => toggleService(selectedIndividual, setSelectedIndividual, service.key)}
                      data-testid={`check-individual-${service.key}`}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{service.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{service.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Corporate Services & Descriptions</h3>
              <p className="text-sm text-muted-foreground">Select which corporate services to show on this advisor's profile.</p>
              <div className="space-y-3">
                {CORPORATE_SERVICES.map(service => (
                  <label key={service.key} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer">
                    <Checkbox
                      checked={selectedCorporate.includes(service.key)}
                      onCheckedChange={() => toggleService(selectedCorporate, setSelectedCorporate, service.key)}
                      data-testid={`check-corporate-${service.key}`}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{service.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{service.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Links to Socials</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input placeholder="LinkedIn Profile URL" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} data-testid="input-linkedin" />
                </div>
                <div className="flex items-center gap-3">
                  <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input placeholder="Personal Website URL" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} data-testid="input-website" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6 space-y-5">
              <h3 className="text-lg font-semibold border-b pb-2">Settings</h3>

              <div className="space-y-1.5">
                <Label>Email Address</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="advisor@example.com" data-testid="input-advisor-email" />
                <p className="text-xs text-muted-foreground">This is the advisor's preferred email. Referral summaries will be sent here daily.</p>
              </div>

              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex-1 rounded-xl border-2 p-4 text-center transition-all ${theme === "dark" ? "border-black ring-2 ring-black/20" : "border-border hover:border-black/30"}`}
                    data-testid="theme-dark"
                  >
                    <div className="w-full h-16 rounded-lg bg-neutral-900 mb-2 flex items-center justify-center">
                      <span className="text-white text-xs font-medium">Dark</span>
                    </div>
                    <span className="text-sm font-medium">Black & White</span>
                  </button>
                  <button
                    onClick={() => setTheme("blue")}
                    className={`flex-1 rounded-xl border-2 p-4 text-center transition-all ${theme === "blue" ? "border-blue-500 ring-2 ring-blue-500/20" : "border-border hover:border-blue-300"}`}
                    data-testid="theme-blue"
                  >
                    <div className="w-full h-16 rounded-lg bg-gradient-to-br from-blue-500 to-blue-800 mb-2 flex items-center justify-center">
                      <span className="text-white text-xs font-medium">Blue</span>
                    </div>
                    <span className="text-sm font-medium">Blue</span>
                  </button>
                  <button
                    onClick={() => setTheme("pink")}
                    className={`flex-1 rounded-xl border-2 p-4 text-center transition-all ${theme === "pink" ? "border-pink-500 ring-2 ring-pink-500/20" : "border-border hover:border-pink-300"}`}
                    data-testid="theme-pink"
                  >
                    <div className="w-full h-16 rounded-lg bg-gradient-to-br from-pink-400 to-pink-700 mb-2 flex items-center justify-center">
                      <span className="text-white text-xs font-medium">Pink</span>
                    </div>
                    <span className="text-sm font-medium">Pink</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Entity Type</Label>
                <Select value={entityType} onValueChange={setEntityType}>
                  <SelectTrigger data-testid="select-entity-type">
                    <SelectValue />
                  </SelectTrigger>
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
                  <div className={`h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold mb-4 ${themeInitialsBg}`}>
                    {initials}
                  </div>
                )}
                <h3 className="text-lg font-bold text-center" data-testid="preview-name">{name || "Advisor Name"}</h3>
                <p className="text-sm text-muted-foreground">{title}</p>

                <div className="mt-6 p-4 bg-white rounded-xl shadow-sm border border-border">
                  <QRCodeSVG
                    value={profileUrl}
                    size={200}
                    level="H"
                    includeMargin={true}
                    fgColor="#000000"
                    bgColor="#ffffff"
                  />
                </div>

                <div className="w-full mt-4 space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Profile URL</div>
                  <div className="p-2 bg-muted rounded-md text-xs font-mono break-all border" data-testid="text-profile-url">
                    {profileUrl}
                  </div>
                  <Button variant="outline" className="w-full gap-2 text-xs" data-testid="button-download-qr">
                    <Download className="h-3 w-3" />
                    Download QR Code
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-muted/30">
              <CardContent className="p-5">
                <h4 className="text-sm font-semibold mb-2">Profile Preview</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Individual Services: {selectedIndividual.length} selected</p>
                  <p>Corporate Services: {selectedCorporate.length} selected</p>
                  <p>Theme: {theme === "dark" ? "Black & White" : theme === "blue" ? "Blue" : "Pink"}</p>
                  <p>Bio: Option {bioOption.toUpperCase()}</p>
                  <p>Profile Pic: {profilePicUrl ? "Uploaded" : "Not set"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}