import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import logoImg from "@assets/Advisory_Connect_1772075164954.png";

type Advisor = {
  id: number;
  name: string;
  email: string;
  bio: string | null;
  themeColor: string | null;
  profileSlug: string;
  active: boolean;
};

const INDUSTRY_OPTIONS = [
  "IT",
  "Finance",
  "Healthcare",
  "Engineering",
  "Education",
  "Legal",
  "Retail",
  "Manufacturing",
  "Agriculture",
  "Construction",
  "Government",
  "Other",
];

const INCOME_OPTIONS = [
  "R0 - R25,000",
  "R25,000 - R65,000",
  "R65,000 - R100,000",
  "R100,000 - R200,000",
  "R200,000 - R500,000",
  "R500,000+",
];

export default function ReferralForm() {
  const [, params] = useRoute("/refer/:slug");
  const slug = params?.slug || "";

  const { data: advisor, isLoading: loadingAdvisor, error } = useQuery<Advisor>({
    queryKey: [`/api/advisors/slug/${slug}`],
    enabled: !!slug,
  });

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAge, setClientAge] = useState("");
  const [clientIncome, setClientIncome] = useState("");
  const [clientIndustry, setClientIndustry] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [assignedGrade, setAssignedGrade] = useState("");

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/referral", {
        advisorId: advisor!.id,
        clientName,
        clientEmail,
        clientAge: clientAge ? parseInt(clientAge) : undefined,
        clientIncome: clientIncome || undefined,
        clientIndustry: clientIndustry || undefined,
        clientPhone: clientPhone || undefined,
        message: message || undefined,
        source: `referral-form-${slug}`,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setAssignedGrade(data.grade);
      setSubmitted(true);
    },
  });

  const themeColor = advisor?.themeColor || "#000000";

  if (loadingAdvisor) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error || !advisor) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold" data-testid="text-not-found">Advisor Not Found</h2>
            <p className="text-muted-foreground text-sm" data-testid="text-not-found-message">
              The advisor profile you're looking for doesn't exist or is no longer available.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!advisor.active) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
            <h2 className="text-xl font-bold" data-testid="text-unavailable">Advisor Unavailable</h2>
            <p className="text-muted-foreground text-sm" data-testid="text-unavailable-message">
              This advisor is not currently accepting new referrals.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 mx-auto" style={{ color: themeColor }} />
            <h2 className="text-2xl font-bold" data-testid="text-success-title">Thank You!</h2>
            <p className="text-muted-foreground" data-testid="text-success-message">
              Your details have been submitted to <strong>{advisor.name}</strong>. They will be in touch with you shortly.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="w-full py-6" style={{ backgroundColor: themeColor }}>
        <div className="max-w-lg mx-auto px-6 flex items-center gap-4">
          <img src={logoImg} alt="Advisory Connect" className="h-10" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-advisor-name">
            Connect with {advisor.name}
          </h1>
          {advisor.bio && (
            <p className="text-muted-foreground text-sm mt-2" data-testid="text-advisor-bio">{advisor.bio}</p>
          )}
          <p className="text-muted-foreground text-sm mt-3">
            Fill in your details below and {advisor.name} will get back to you.
          </p>
        </div>

        <Card className="shadow-sm">
          <CardContent className="pt-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="John Smith"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  data-testid="input-client-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  data-testid="input-client-email"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+27 82 123 4567"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  data-testid="input-client-phone"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="30"
                  min={18}
                  max={120}
                  value={clientAge}
                  onChange={(e) => setClientAge(e.target.value)}
                  data-testid="input-client-age"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Monthly Income</Label>
                <Select value={clientIncome} onValueChange={setClientIncome}>
                  <SelectTrigger data-testid="select-client-income">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Industry</Label>
                <Select value={clientIndustry} onValueChange={setClientIndustry}>
                  <SelectTrigger data-testid="select-client-industry">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRY_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Tell us a bit about what you're looking for..."
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                data-testid="input-client-message"
              />
            </div>

            <Button
              className="w-full h-11 text-sm font-semibold"
              style={{ backgroundColor: themeColor }}
              disabled={!clientName.trim() || !clientEmail.trim() || submitMutation.isPending}
              onClick={() => submitMutation.mutate()}
              data-testid="button-submit-referral"
            >
              {submitMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</>
              ) : (
                "Submit My Details"
              )}
            </Button>

            {submitMutation.isError && (
              <p className="text-red-500 text-sm text-center" data-testid="text-error">
                Something went wrong. Please try again.
              </p>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by Advisory Connect
        </p>
      </div>
    </div>
  );
}