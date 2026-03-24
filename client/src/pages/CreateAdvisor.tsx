import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, MapPin, Clock, Phone, Mail, LayoutDashboard } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CreateAdvisor() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [location, setLocation] = useState("");
  const [workingHours, setWorkingHours] = useState("");

  const formattedSlug = name.trim()
    ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    : "new-advisor";

  const panelUrl = `${window.location.origin}/advisor/${formattedSlug}`;
  const initials = name.trim()
    ? name.trim().split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "NA";

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/advisors", {
        name,
        email,
        contactNumber: contactNumber || null,
        location: location || null,
        workingHours: workingHours || null,
        showContactDetails: true,
        profileSlug: formattedSlug,
        theme: "blue",
        themeColor: "#4a8db5",
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
            Enter the advisor's basic details. They can configure their full profile in their own control panel.
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
              <h3 className="text-lg font-semibold border-b pb-2">Advisor Details</h3>
              <p className="text-sm text-muted-foreground -mt-2">
                These details will appear on the advisor's public profile. All fields except name and email are optional.
              </p>

              <div className="space-y-1.5">
                <Label>Full Name <span className="text-red-500">*</span></Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  data-testid="input-advisor-name"
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  <Mail className="h-3.5 w-3.5 inline mr-1.5 text-muted-foreground" />
                  E-Mail Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="advisor@example.com"
                  data-testid="input-advisor-email"
                />
                <p className="text-xs text-muted-foreground">Used for referral summaries. This email will also be displayed on their profile if they choose.</p>
              </div>

              <div className="space-y-1.5">
                <Label>
                  <Phone className="h-3.5 w-3.5 inline mr-1.5 text-muted-foreground" />
                  Contact Number
                </Label>
                <Input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+27 12 345 6789"
                  data-testid="input-contact-number"
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  <MapPin className="h-3.5 w-3.5 inline mr-1.5 text-muted-foreground" />
                  Location / Office Address
                </Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Pretoria, Gauteng or full office address"
                  data-testid="input-location"
                />
                <p className="text-xs text-muted-foreground">
                  Enter an address or area. You can paste a Google Maps link here too.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>
                  <Clock className="h-3.5 w-3.5 inline mr-1.5 text-muted-foreground" />
                  Working Hours
                </Label>
                <Input
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  placeholder="e.g. Mon–Fri: 8:00–17:00"
                  data-testid="input-working-hours"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted/30">
            <CardContent className="p-5">
              <h4 className="text-sm font-semibold mb-1">What happens next?</h4>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>Copy the advisor's control panel link from the right panel and send it to them</li>
                <li>The advisor sets their own password on first visit</li>
                <li>They can then customise their profile: bio, services, profile picture, theme, social links</li>
                <li>They can also create up to 3 different profile cards from their control panel</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="sticky top-24 space-y-6">
            <Card className="border-border shadow-md overflow-hidden">
              <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                <div
                  className="h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold"
                  style={{ backgroundColor: "rgba(74,141,181,0.15)", color: "#4a8db5" }}
                  data-testid="preview-initials"
                >
                  {initials}
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold" data-testid="preview-name">{name || "Advisor Name"}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Financial Advisor</p>
                </div>

                <div className="w-full space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <LayoutDashboard className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="font-medium">Control Panel Link</span>
                  </div>
                  <div className="p-2 bg-muted rounded-md text-xs font-mono break-all border" data-testid="text-panel-url">
                    {panelUrl}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-xs"
                    onClick={copyPanelLink}
                    disabled={!name.trim()}
                    data-testid="button-copy-panel-link"
                  >
                    Copy & Send to Advisor
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Send this link to the advisor — they will set their own password on first visit.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
