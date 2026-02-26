import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Upload, Link as LinkIcon, Download, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CreateAdvisor() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [entityType, setEntityType] = useState("individual");
  const [themeColor, setThemeColor] = useState("#000000");
  const [font, setFont] = useState("inter");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  const formattedSlug = name.trim() ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "new-advisor";
  const profileUrl = `${window.location.origin}/refer/${formattedSlug}`;

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/advisors", {
        name,
        email,
        bio: bio || null,
        entityType,
        themeColor,
        font,
        linkedinUrl: linkedinUrl || null,
        websiteUrl: websiteUrl || null,
        profileSlug: formattedSlug,
        active: true,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advisors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Advisor created", description: `${name} has been deployed successfully.` });
      navigate("/manage");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const colors = [
    { value: "#000000", label: "Black" },
    { value: "#0f172a", label: "Slate" },
    { value: "#2563eb", label: "Blue" },
    { value: "#047857", label: "Emerald" },
  ];

  const isValid = name.trim() !== "" && email.trim() !== "";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <Link href="/manage" className="hover:text-foreground flex items-center gap-1 transition-colors" data-testid="link-back-manage">
          <ArrowLeft className="h-4 w-4" />
          Back to Manage
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create New Advisor</h2>
          <p className="text-muted-foreground mt-1">Configure and generate a new profile based on the master template.</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!isValid || createMutation.isPending}
            data-testid="button-deploy"
          >
            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Deploy Profile
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-4">
        <div className="xl:col-span-2 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
              <h3 className="text-lg font-semibold">Profile Details</h3>
            </div>

            <Card className="border-border">
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="w-full sm:w-1/3 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group">
                    <div className="h-16 w-16 rounded-full bg-background border border-border flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium">Upload Cover</span>
                    <span className="text-xs text-muted-foreground text-center mt-1">PNG, JPG up to 5MB</span>
                  </div>

                  <div className="w-full sm:w-2/3 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name / Practice Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Jane Doe"
                        className="bg-background"
                        data-testid="input-advisor-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Entity Type</Label>
                      <Select value={entityType} onValueChange={setEntityType}>
                        <SelectTrigger className="bg-background" data-testid="select-entity-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual Advisor</SelectItem>
                          <SelectItem value="corporate">Corporate Practice</SelectItem>
                          <SelectItem value="team">Team / Group</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Biography</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Enter professional background, specialties, and experience..."
                    className="min-h-[120px] bg-background resize-none"
                    data-testid="textarea-bio"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
              <h3 className="text-lg font-semibold">Appearance & Settings</h3>
            </div>

            <Card className="border-border">
              <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Theme Color</Label>
                    <div className="flex gap-3">
                      {colors.map((c) => (
                        <div
                          key={c.value}
                          onClick={() => setThemeColor(c.value)}
                          className={`w-10 h-10 rounded-full border cursor-pointer transition-transform hover:scale-110 ${
                            themeColor === c.value ? "ring-2 ring-offset-2 ring-primary" : ""
                          }`}
                          style={{ backgroundColor: c.value }}
                          data-testid={`color-${c.label.toLowerCase()}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label>Typography / Font</Label>
                    <Select value={font} onValueChange={setFont}>
                      <SelectTrigger className="bg-background" data-testid="select-font">
                        <SelectValue placeholder="Select font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inter">Inter (Modern)</SelectItem>
                        <SelectItem value="roboto">Roboto (Corporate)</SelectItem>
                        <SelectItem value="playfair">Playfair Display (Classic)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Custom Routing Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="advisor@example.com"
                      className="bg-background"
                      data-testid="input-advisor-email"
                    />
                    <p className="text-xs text-muted-foreground">Referrals and call-back requests will be sent here.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
              <h3 className="text-lg font-semibold">Integrations</h3>
            </div>

            <Card className="border-border">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="LinkedIn Profile URL"
                    className="bg-background"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    data-testid="input-linkedin"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Personal Website URL"
                    className="bg-background"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    data-testid="input-website"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <div className="sticky top-24 space-y-6">
            <Card className="border-border shadow-md overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/50 to-primary"></div>
              <CardHeader className="bg-muted/30 pb-4 border-b border-border text-center">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Live Barcode</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-8 bg-card">
                <div className="p-4 bg-white rounded-xl shadow-sm border border-border mb-6">
                  <QRCodeSVG
                    value={profileUrl}
                    size={180}
                    level="H"
                    includeMargin={true}
                    fgColor="#000000"
                    bgColor="#ffffff"
                  />
                </div>

                <div className="w-full space-y-3">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Unique Profile Link</div>
                  <div className="p-3 bg-muted rounded-md text-sm font-mono break-all border border-border" data-testid="text-profile-url">
                    {profileUrl}
                  </div>
                  <Button variant="outline" className="w-full gap-2 mt-2 bg-background" data-testid="button-download-qr">
                    <Download className="h-4 w-4" />
                    Download QR Asset
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-muted/30">
              <CardContent className="p-5">
                <h4 className="text-sm font-semibold mb-2">How it works</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  As you type the advisor's name, their unique profile URL is automatically generated. The barcode updates in real-time to match this URL, ensuring it stays 100% unique to them.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}