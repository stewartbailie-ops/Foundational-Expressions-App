import { useState, useRef, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, User, BarChart2, Inbox, ChevronDown, ChevronUp, Eye, Upload, X, Link as LinkIcon, Layers, Plus, Trash2, ExternalLink, Phone, MapPin, Clock, Mail, Copy, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { getThemeColors, getInitialsBadgeColors } from "@/lib/themeUtils";
import type { Advisor, Email, AdvisorProfile } from "@shared/schema";
import { TITLE_OPTIONS, BIO_OPTIONS, INDIVIDUAL_SERVICES, CORPORATE_SERVICES } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type EmailRow = Email & { advisorName?: string };

const gradeStyles: Record<string, string> = {
  Gold: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30",
  Silver: "bg-gray-300/20 text-gray-600 border-gray-400/30",
  Bronze: "bg-orange-500/15 text-orange-700 border-orange-500/30",
  Development: "bg-blue-500/15 text-blue-700 border-blue-500/30",
};

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function passwordRules(pw: string) {
  return {
    length: pw.length >= 10,
    uppercase: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}

function SetPasswordScreen({ slug, onDone }: { slug: string; onDone: () => void }) {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: advisor } = useQuery<Advisor>({
    queryKey: [`/api/advisors/slug/${slug}`],
  });

  const tc = getThemeColors(advisor?.theme);
  const rules = passwordRules(password);
  const allRulesMet = rules.length && rules.uppercase && rules.number && rules.special;
  const passwordsMatch = confirm.length > 0 && password === confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRulesMet) {
      toast({ title: "Password too weak", description: "Please meet all password requirements.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/advisor-auth/${slug}/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      toast({ title: "Password created!", description: "Welcome to your control panel." });
      onDone();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const RuleRow = ({ met, label }: { met: boolean; label: string }) => (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${met ? "bg-emerald-500 text-white" : "border-2"}`}
        style={!met ? { borderColor: tc.mutedText } : {}}>
        {met ? "✓" : ""}
      </div>
      <span className="text-xs transition-colors" style={{ color: met ? "#10b981" : tc.mutedText }}>{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: tc.bgColor }}>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          {advisor?.profilePicUrl ? (
            <img src={advisor.profilePicUrl} alt={advisor.name} className="w-20 h-20 rounded-full object-cover mx-auto border-2" style={{ borderColor: tc.initialsCircleBorder }} />
          ) : (
            <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: tc.initialsCircleBg, color: tc.accentColor }}>
              {advisor ? getInitials(advisor.name) : "?"}
            </div>
          )}
          <h1 className="text-xl font-bold" style={{ color: tc.textColor }}>{advisor?.name || "Advisor"}</h1>
          <p className="text-sm" style={{ color: tc.mutedText }}>Create a strong password to secure your control panel.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: tc.textColor }}>New Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 10 characters"
                  className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }}
                  data-testid="input-new-password"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
                  style={{ color: tc.mutedText }}>
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {password.length > 0 && (
              <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}` }}>
                <p className="text-xs font-semibold mb-1" style={{ color: tc.mutedText }}>Password requirements:</p>
                <RuleRow met={rules.length} label="At least 10 characters" />
                <RuleRow met={rules.uppercase} label="At least 1 uppercase letter" />
                <RuleRow met={rules.number} label="At least 1 number" />
                <RuleRow met={rules.special} label="At least 1 special character (!@#$...)" />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: tc.textColor }}>Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: tc.inputBg,
                    border: `1px solid ${confirm.length > 0 ? (passwordsMatch ? "#10b981" : "#ef4444") : tc.inputBorder}`,
                    color: tc.textColor
                  }}
                  data-testid="input-confirm-password"
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
                  style={{ color: tc.mutedText }}>
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>
              {confirm.length > 0 && (
                <p className="text-xs" style={{ color: passwordsMatch ? "#10b981" : "#ef4444" }}>
                  {passwordsMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
                </p>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !allRulesMet || !passwordsMatch}
            className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-opacity"
            style={{
              backgroundColor: tc.buttonBg,
              color: tc.buttonText,
              opacity: (!allRulesMet || !passwordsMatch) ? 0.5 : 1,
              cursor: (!allRulesMet || !passwordsMatch) ? "not-allowed" : "pointer"
            }}
            data-testid="button-set-password"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Password & Enter Panel
          </button>
        </form>
      </div>
    </div>
  );
}

function LoginScreen({ slug, onDone }: { slug: string; onDone: () => void }) {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: advisor } = useQuery<Advisor>({
    queryKey: [`/api/advisors/slug/${slug}`],
  });

  const tc = getThemeColors(advisor?.theme);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/advisor-auth/${slug}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Invalid password"); }
      onDone();
    } catch (err: any) {
      toast({ title: "Login Failed", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: tc.bgColor }}>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          {advisor?.profilePicUrl ? (
            <img src={advisor.profilePicUrl} alt={advisor.name} className="w-20 h-20 rounded-full object-cover mx-auto border-2" style={{ borderColor: tc.initialsCircleBorder }} />
          ) : (
            <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: tc.initialsCircleBg, color: tc.accentColor }}>
              {advisor ? getInitials(advisor.name) : "?"}
            </div>
          )}
          <h1 className="text-xl font-bold" style={{ color: tc.textColor }}>{advisor?.name || "Advisor"}</h1>
          <p className="text-sm" style={{ color: tc.mutedText }}>Sign in to your control panel.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: tc.textColor }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your panel password"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }}
                data-testid="input-panel-password"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
            style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}
            data-testid="button-panel-login"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

function CIVTab({ slug, advisor, tc }: { slug: string; advisor: Advisor; tc: ReturnType<typeof getThemeColors> }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: leads = [], isLoading } = useQuery<EmailRow[]>({
    queryKey: [`/api/advisors/${slug}/emails`],
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, leadStatus }: { id: number; leadStatus: string }) => {
      await apiRequest("PATCH", `/api/emails/${id}/status`, { leadStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/advisors/${slug}/emails`] });
    },
  });

  const gradeMutation = useMutation({
    mutationFn: async ({ id, grade }: { id: number; grade: string }) => {
      await apiRequest("PATCH", `/api/emails/${id}/grade`, { grade });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/advisors/${slug}/emails`] });
    },
  });

  const filtered = leads.filter(l => {
    const matchType = typeFilter === "all" || l.type === typeFilter;
    const matchStatus = statusFilter === "all" || (l.leadStatus || "Need to Contact") === statusFilter;
    return matchType && matchStatus;
  });

  const statusColors: Record<string, string> = {
    "Need to Contact": "#d97706",
    "Contacted": "#059669",
    "Archive": "#9ca3af",
  };
  const statusBg: Record<string, string> = {
    "Need to Contact": "rgba(217,119,6,0.12)",
    "Contacted": "rgba(5,150,105,0.12)",
    "Archive": "rgba(156,163,175,0.15)",
  };
  const gradeColors: Record<string, { text: string; bg: string }> = {
    "Gold": { text: "#b45309", bg: "rgba(245,158,11,0.15)" },
    "Silver": { text: "#6b7280", bg: "rgba(156,163,175,0.15)" },
    "Bronze": { text: "#92400e", bg: "rgba(180,83,9,0.12)" },
    "Development": { text: "#6d28d9", bg: "rgba(109,40,217,0.12)" },
  };
  const typeBadge: Record<string, { text: string; bg: string }> = {
    "Referral": { text: "#7c3aed", bg: "rgba(124,58,237,0.12)" },
    "Call Back": { text: "#0369a1", bg: "rgba(3,105,161,0.12)" },
  };

  const gradeCount = (g: string) => leads.filter(l => (l.grade || "Silver") === g).length;
  const statusCount = (s: string) => leads.filter(l => (l.leadStatus || "Need to Contact") === s).length;

  if (isLoading) return (
    <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" style={{ color: tc.mutedText }} /></div>
  );

  if (leads.length === 0) return (
    <div className="text-center py-12" style={{ color: tc.mutedText }}>
      <Inbox className="h-10 w-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm">No leads yet. Share your profile link to start receiving callbacks and referrals.</p>
    </div>
  );

  const gradeCards = [
    { label: "Gold", text: "#b45309", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.4)" },
    { label: "Silver", text: "#6b7280", bg: "rgba(156,163,175,0.15)", border: "rgba(156,163,175,0.4)" },
    { label: "Bronze", text: "#92400e", bg: "rgba(180,83,9,0.12)", border: "rgba(180,83,9,0.3)" },
    { label: "Development", text: "#6d28d9", bg: "rgba(109,40,217,0.12)", border: "rgba(109,40,217,0.3)" },
  ];
  const statusCards = [
    { label: "Need to Contact", short: "To Contact", text: "#d97706", bg: "rgba(217,119,6,0.12)", border: "rgba(217,119,6,0.35)" },
    { label: "Contacted", short: "Contacted", text: "#059669", bg: "rgba(5,150,105,0.12)", border: "rgba(5,150,105,0.35)" },
    { label: "Archive", short: "Archive", text: "#9ca3af", bg: "rgba(156,163,175,0.12)", border: "rgba(156,163,175,0.3)" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {gradeCards.map(g => (
          <button key={g.label} onClick={() => setStatusFilter("all") || setTypeFilter("all")}
            className="rounded-xl p-2.5 text-center transition-all hover:opacity-80"
            style={{ backgroundColor: g.bg, border: `1px solid ${g.border}` }}
            data-testid={`civ-grade-${g.label.toLowerCase()}`}
          >
            <div className="text-lg font-bold" style={{ color: g.text }}>{gradeCount(g.label)}</div>
            <div className="text-xs font-medium truncate" style={{ color: g.text }}>{g.label}</div>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {statusCards.map(s => (
          <button key={s.label} onClick={() => setStatusFilter(statusFilter === s.label ? "all" : s.label)}
            className="rounded-xl p-2.5 text-center transition-all hover:opacity-80"
            style={{
              backgroundColor: statusFilter === s.label ? s.bg : tc.cardBg,
              border: `1.5px solid ${statusFilter === s.label ? s.border : tc.borderColor}`,
            }}
            data-testid={`civ-status-${s.label.replace(/ /g, "-").toLowerCase()}`}
          >
            <div className="text-lg font-bold" style={{ color: s.text }}>{statusCount(s.label)}</div>
            <div className="text-xs font-medium" style={{ color: statusFilter === s.label ? s.text : tc.mutedText }}>{s.short}</div>
          </button>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap">
        {["all", "Referral", "Call Back", "Will Request"].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: typeFilter === t ? tc.accentColor : tc.inputBg,
              color: typeFilter === t ? tc.buttonText : tc.mutedText,
              border: `1px solid ${typeFilter === t ? tc.accentColor : tc.borderColor}`
            }}
          >
            {t === "all" ? "All Types" : t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8" style={{ color: tc.mutedText }}>
          <p className="text-sm">No leads match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(lead => {
            const tb = typeBadge[lead.type] || { text: tc.mutedText, bg: tc.inputBg };
            const currentStatus = lead.leadStatus || "Need to Contact";
            const gc = gradeColors[lead.grade || "Silver"] || gradeColors["Silver"];
            return (
              <div key={lead.id} className="rounded-xl overflow-hidden" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
                <button
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                  onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: tc.initialsCircleBg, color: tc.accentColor }}>
                      {getInitials(lead.senderName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium" style={{ color: tc.textColor }}>{lead.senderName}</span>
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ color: tb.text, backgroundColor: tb.bg }}>{lead.type}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <span className="text-xs" style={{ color: tc.mutedText }}>{format(new Date(lead.receivedAt), "dd MMM yyyy")}</span>
                        {lead.clientAge && <span className="text-xs" style={{ color: tc.mutedText }}>· Age {lead.clientAge}</span>}
                        {lead.clientIncome && <span className="text-xs" style={{ color: tc.mutedText }}>· {lead.clientIncome}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {lead.grade && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full hidden sm:inline" style={{ color: gc.text, backgroundColor: gc.bg }}>
                        {lead.grade}
                      </span>
                    )}
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColors[currentStatus] }} />
                    {expandedId === lead.id ? <ChevronUp className="h-4 w-4" style={{ color: tc.mutedText }} /> : <ChevronDown className="h-4 w-4" style={{ color: tc.mutedText }} />}
                  </div>
                </button>
                {expandedId === lead.id && (
                  <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${tc.borderColor}`, paddingTop: "12px" }}>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-xs font-medium" style={{ color: tc.mutedText }}>Status:</span>
                      {["Need to Contact", "Contacted", "Archive"].map(s => (
                        <button
                          key={s}
                          onClick={() => statusMutation.mutate({ id: lead.id, leadStatus: s })}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            backgroundColor: currentStatus === s ? statusBg[s] : tc.inputBg,
                            color: currentStatus === s ? statusColors[s] : tc.mutedText,
                            border: `1.5px solid ${currentStatus === s ? statusColors[s] : tc.borderColor}`,
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-xs font-medium" style={{ color: tc.mutedText }}>Grade:</span>
                      {["Gold", "Silver", "Bronze", "Development"].map(g => {
                        const gc2 = gradeColors[g];
                        return (
                          <button
                            key={g}
                            onClick={() => gradeMutation.mutate({ id: lead.id, grade: g })}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                            style={{
                              backgroundColor: (lead.grade || "Silver") === g ? gc2.bg : tc.inputBg,
                              color: (lead.grade || "Silver") === g ? gc2.text : tc.mutedText,
                              border: `1.5px solid ${(lead.grade || "Silver") === g ? gc2.text : tc.borderColor}`,
                            }}
                          >
                            {g}
                          </button>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs pt-1">
                      {lead.senderEmail && <Row label="Email" value={lead.senderEmail} tc={tc} />}
                      {lead.clientPhone && <Row label="Phone" value={lead.clientPhone} tc={tc} />}
                      {lead.clientAge && <Row label="Age" value={String(lead.clientAge)} tc={tc} />}
                      {lead.clientIncome && <Row label="Income" value={lead.clientIncome} tc={tc} />}
                      {lead.clientIndustry && <Row label="Industry" value={lead.clientIndustry} tc={tc} />}
                      {lead.clientMarried !== null && lead.clientMarried !== undefined && <Row label="Married" value={lead.clientMarried ? "Yes" : "No"} tc={tc} />}
                      {lead.clientChildren !== null && lead.clientChildren !== undefined && <Row label="Children" value={lead.clientChildren ? "Yes" : "No"} tc={tc} />}
                      {lead.clientVehicle !== null && lead.clientVehicle !== undefined && <Row label="Vehicle" value={lead.clientVehicle ? "Yes" : "No"} tc={tc} />}
                      {lead.clientProperty !== null && lead.clientProperty !== undefined && <Row label="Property" value={lead.clientProperty ? "Yes" : "No"} tc={tc} />}
                      {lead.preferredContactTime && <Row label="Contact Time" value={lead.preferredContactTime} tc={tc} />}
                    </div>
                    {lead.servicesRequested && <Row label="Services" value={lead.servicesRequested} tc={tc} />}
                    {lead.referrerName && <Row label="Referred by" value={`${lead.referrerName}${lead.referrerEmail ? ` (${lead.referrerEmail})` : ""}`} tc={tc} />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, tc }: { label: string; value: string; tc: ReturnType<typeof getThemeColors> }) {
  return (
    <div className="flex gap-2">
      <span className="font-medium flex-shrink-0" style={{ color: tc.mutedText }}>{label}:</span>
      <span style={{ color: tc.textColor }}>{value}</span>
    </div>
  );
}

function StatsTab({ slug, tc }: { slug: string; tc: ReturnType<typeof getThemeColors> }) {
  const { data, isLoading } = useQuery<{ totalLeads: number; totalReferrals: number; totalCallbacks: number; weeklyActivity: { name: string; leads: number }[] }>({
    queryKey: [`/api/advisors/${slug}/stats`],
  });

  if (isLoading) return (
    <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" style={{ color: tc.mutedText }} /></div>
  );

  const stats = [
    { label: "Total Leads", value: data?.totalLeads ?? 0 },
    { label: "Referrals", value: data?.totalReferrals ?? 0 },
    { label: "Call Backs", value: data?.totalCallbacks ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
            <div className="text-2xl font-bold" style={{ color: tc.textColor }}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: tc.mutedText }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl p-4" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
        <h4 className="text-sm font-semibold mb-4" style={{ color: tc.textColor }}>Last 7 Days</h4>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data?.weeklyActivity || []}>
            <CartesianGrid strokeDasharray="3 3" stroke={tc.borderColor} />
            <XAxis dataKey="name" tick={{ fill: tc.mutedText, fontSize: 11 }} />
            <YAxis tick={{ fill: tc.mutedText, fontSize: 11 }} allowDecimals={false} />
            <Tooltip contentStyle={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}`, color: tc.textColor, borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="leads" fill={tc.accentColor} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function InitialsBadgeSvg({ initials, theme, size, id }: { initials: string; theme: string; size: number; id: string }) {
  const { from, to, border } = getInitialsBadgeColors(theme);
  const gradId = `ibg-${id}`;
  return (
    <svg id={id} width={size} height={size} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="26" fill={`url(#${gradId})`} />
      <rect x="3" y="3" width="114" height="114" rx="24" fill="none" stroke={border} strokeWidth="1.5" />
      <text x="60" y="81" fontFamily="Georgia, 'Times New Roman', serif" fontSize="52" fontWeight="bold" fill="white" textAnchor="middle" letterSpacing="-1" opacity="0.95">
        {initials}
      </text>
    </svg>
  );
}

function ImageCropper({ src, onConfirm, onCancel, tc }: {
  src: string; onConfirm: (dataUrl: string) => void; onCancel: () => void; tc: ReturnType<typeof getThemeColors>;
}) {
  const CONTAINER = 260;
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ w: 1, h: 1 });
  const imgRef = useRef<HTMLImageElement>(null);

  const initScale = naturalSize.w > 0 ? Math.max(CONTAINER / naturalSize.w, CONTAINER / naturalSize.h) : 1;
  const displayW = naturalSize.w * initScale * zoom;
  const displayH = naturalSize.h * initScale * zoom;

  const clampOffset = (ox: number, oy: number, z: number) => {
    const dw = naturalSize.w * initScale * z;
    const dh = naturalSize.h * initScale * z;
    const maxX = Math.max(0, dw / 2 - CONTAINER / 2);
    const maxY = Math.max(0, dh / 2 - CONTAINER / 2);
    return { x: Math.max(-maxX, Math.min(maxX, ox)), y: Math.max(-maxY, Math.min(maxY, oy)) };
  };

  const startDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };
  const moveDrag = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const raw = { x: clientX - dragStart.x, y: clientY - dragStart.y };
    setOffset(clampOffset(raw.x, raw.y, zoom));
  };
  const endDrag = () => setIsDragging(false);

  const handleConfirm = () => {
    if (!imgRef.current) return;
    const canvas = document.createElement("canvas");
    const OUT = 400;
    canvas.width = OUT; canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(OUT / 2, OUT / 2, OUT / 2, 0, Math.PI * 2);
    ctx.clip();
    const scale = initScale * zoom;
    const imgLeft = CONTAINER / 2 - displayW / 2 + offset.x;
    const imgTop = CONTAINER / 2 - displayH / 2 + offset.y;
    const sx = (0 - imgLeft) / scale;
    const sy = (0 - imgTop) / scale;
    const sw = CONTAINER / scale;
    const sh = CONTAINER / scale;
    ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, OUT, OUT);
    onConfirm(canvas.toDataURL("image/jpeg", 0.92));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.75)" }}>
      <div className="rounded-2xl p-5 space-y-4 w-full max-w-xs" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
        <h3 className="text-sm font-semibold" style={{ color: tc.textColor }}>Crop Profile Picture</h3>
        <p className="text-xs" style={{ color: tc.mutedText }}>Drag to reposition · Use slider to zoom</p>
        <div
          className="relative overflow-hidden mx-auto cursor-grab active:cursor-grabbing select-none"
          style={{ width: CONTAINER, height: CONTAINER, borderRadius: "50%", border: `3px solid ${tc.accentColor}`, touchAction: "none" }}
          onMouseDown={e => { e.preventDefault(); startDrag(e.clientX, e.clientY); }}
          onMouseMove={e => moveDrag(e.clientX, e.clientY)}
          onMouseUp={endDrag} onMouseLeave={endDrag}
          onTouchStart={e => { e.preventDefault(); startDrag(e.touches[0].clientX, e.touches[0].clientY); }}
          onTouchMove={e => { e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY); }}
          onTouchEnd={endDrag}
        >
          <img
            ref={imgRef}
            src={src}
            onLoad={() => { if (imgRef.current) setNaturalSize({ w: imgRef.current.naturalWidth, h: imgRef.current.naturalHeight }); }}
            style={{
              position: "absolute", width: displayW, height: displayH,
              left: CONTAINER / 2 - displayW / 2 + offset.x,
              top: CONTAINER / 2 - displayH / 2 + offset.y,
              userSelect: "none", pointerEvents: "none",
            }}
            alt="crop"
            draggable={false}
          />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-xs" style={{ color: tc.mutedText }}>Zoom</span>
            <span className="text-xs font-medium" style={{ color: tc.accentColor }}>{Math.round(zoom * 100)}%</span>
          </div>
          <input type="range" min={1} max={3} step={0.02} value={zoom}
            onChange={e => {
              const z = parseFloat(e.target.value);
              setZoom(z);
              setOffset(prev => clampOffset(prev.x, prev.y, z));
            }}
            className="w-full accent-current" style={{ accentColor: tc.accentColor }}
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-xs font-medium"
            style={{ backgroundColor: tc.inputBg, color: tc.mutedText, border: `1px solid ${tc.borderColor}` }}>
            Cancel
          </button>
          <button onClick={handleConfirm} className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
            style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}>
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ slug, advisor, tc }: { slug: string; advisor: Advisor; tc: ReturnType<typeof getThemeColors> }) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);

  const [name, setName] = useState(advisor.name);
  const [title, setTitle] = useState(advisor.title || "Financial Advisor");
  const [bioOption, setBioOption] = useState(advisor.bioOption || "a");
  const [customBio, setCustomBio] = useState(advisor.customBio || "");
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(advisor.profilePicUrl || null);
  const [linkedinUrl, setLinkedinUrl] = useState(advisor.linkedinUrl || "");
  const [websiteUrl, setWebsiteUrl] = useState(advisor.websiteUrl || "");
  const [facebookUrl, setFacebookUrl] = useState((advisor as any).facebookUrl || "");
  const [instagramUrl, setInstagramUrl] = useState((advisor as any).instagramUrl || "");
  const [youtubeUrl, setYoutubeUrl] = useState((advisor as any).youtubeUrl || "");
  const [astuteUrl, setAstuteUrl] = useState((advisor as any).astuteUrl || "");
  const [documentsUrl, setDocumentsUrl] = useState((advisor as any).documentsUrl || "");
  const [qaUrl, setQaUrl] = useState((advisor as any).qaUrl || "");
  const [financialsNewsUrl, setFinancialsNewsUrl] = useState((advisor as any).financialsNewsUrl || "");
  const [financialsFunFactsUrl, setFinancialsFunFactsUrl] = useState((advisor as any).financialsFunFactsUrl || "");
  const [financialsVideosUrl, setFinancialsVideosUrl] = useState((advisor as any).financialsVideosUrl || "");
  const [selectedIndividual, setSelectedIndividual] = useState<string[]>(advisor.individualServices || []);
  const [selectedCorporate, setSelectedCorporate] = useState<string[]>(advisor.corporateServices || []);
  const [theme, setTheme] = useState(advisor.theme || "blue");
  const [contactNumber, setContactNumber] = useState((advisor as any).contactNumber || "");
  const [location, setLocation] = useState((advisor as any).location || "");
  const [workingHours, setWorkingHours] = useState((advisor as any).workingHours || "");
  const [showContactDetails, setShowContactDetails] = useState((advisor as any).showContactDetails !== false);
  const [showHeader, setShowHeader] = useState((advisor as any).showHeader !== false);
  const [showProfilePic, setShowProfilePic] = useState((advisor as any).showProfilePic !== false);
  const [showIntro, setShowIntro] = useState((advisor as any).showIntro !== false);
  const [showIndividualServices, setShowIndividualServices] = useState((advisor as any).showIndividualServices !== false);
  const [showCorporateServices, setShowCorporateServices] = useState((advisor as any).showCorporateServices !== false);
  const [showSocials, setShowSocials] = useState((advisor as any).showSocials !== false);
  const [showQrCode, setShowQrCode] = useState((advisor as any).showQrCode !== false);
  const [nickname, setNickname] = useState((advisor as any).nickname || "");
  const [profileDescription, setProfileDescription] = useState((advisor as any).profileDescription || "");
  const [showCallbackLink, setShowCallbackLink] = useState((advisor as any).showCallbackLink !== false);
  const [showReferralsLink, setShowReferralsLink] = useState((advisor as any).showReferralsLink !== false);
  const [showAstute, setShowAstute] = useState(!!(advisor as any).showAstute);
  const [showDocuments, setShowDocuments] = useState(!!(advisor as any).showDocuments);
  const [showComplimentaryWill, setShowComplimentaryWill] = useState(!!(advisor as any).showComplimentaryWill);
  const [showFinancialMedia, setShowFinancialMedia] = useState(!!(advisor as any).showFinancialMedia);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/advisors/${advisor.id}`, {
        name,
        title,
        bioOption,
        bio: bioOption === "custom" ? customBio : BIO_OPTIONS[bioOption] || "",
        customBio: bioOption === "custom" ? customBio : null,
        profilePicUrl: profilePicUrl || null,
        linkedinUrl: linkedinUrl || null,
        websiteUrl: websiteUrl || null,
        facebookUrl: facebookUrl || null,
        instagramUrl: instagramUrl || null,
        youtubeUrl: youtubeUrl || null,
        astuteUrl: astuteUrl || null,
        documentsUrl: documentsUrl || null,
        qaUrl: qaUrl || null,
        financialsNewsUrl: financialsNewsUrl || null,
        financialsFunFactsUrl: financialsFunFactsUrl || null,
        financialsVideosUrl: financialsVideosUrl || null,
        individualServices: selectedIndividual,
        corporateServices: selectedCorporate,
        theme,
        themeColor: theme === "dark" ? "#1a1a1a" : theme === "blue" ? "#4a8db5" : theme === "pink" ? "#d4738a" : theme === "light-blue" ? "#0ea5e9" : theme === "dark-royal-purple" ? "#a855f7" : theme === "dark-green" ? "#22c55e" : "#4a8db5",
        contactNumber: contactNumber || null,
        location: location || null,
        workingHours: workingHours || null,
        showContactDetails,
        showHeader,
        showProfilePic,
        showIntro,
        showIndividualServices,
        showCorporateServices,
        showSocials,
        showQrCode,
        showCallbackLink,
        showReferralsLink,
        showAstute,
        showDocuments,
        showComplimentaryWill,
        showFinancialMedia,
        nickname: nickname || null,
        profileDescription: profileDescription || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/advisors/slug/${slug}`] });
      toast({ title: "Profile Updated", description: "Your changes have been saved." });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") setCropperSrc(reader.result); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropConfirm = async (dataUrl: string) => {
    setCropperSrc(null);
    setUploading(true);
    try {
      const res2 = await fetch(dataUrl);
      const blob = await res2.blob();
      const formData = new FormData();
      formData.append("file", blob, "profile.jpg");
      const res = await fetch("/api/upload/profile-pic", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setProfilePicUrl(data.url);
    } catch {
      toast({ title: "Upload Failed", variant: "destructive" });
    } finally { setUploading(false); }
  };

  const toggleService = (list: string[], setList: (v: string[]) => void, key: string) => {
    setList(list.includes(key) ? list.filter(s => s !== key) : [...list, key]);
  };

  const initials = name.trim() ? name.trim().split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "NA";

  const handleDownloadBadge = () => {
    const svgEl = document.getElementById("panel-badge-svg");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>${svgData}`], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 600; canvas.height = 600;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 600, 600);
      URL.revokeObjectURL(url);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${name.replace(/\s+/g, "-").toLowerCase() || "advisor"}-badge.png`;
      link.click();
    };
    img.src = url;
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Header</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: tc.mutedText }}>Pic</span>
            <div onClick={() => setShowProfilePic(v => !v)} className="w-8 h-4 rounded-full relative cursor-pointer" style={{ backgroundColor: showProfilePic ? tc.checkActive : tc.checkInactive }}>
              <div className="absolute top-0.5 w-3 h-3 rounded-full transition-all" style={{ left: showProfilePic ? "17px" : "2px", backgroundColor: showProfilePic ? tc.checkDotActive : tc.checkDotInactive }} />
            </div>
            <span className="text-xs ml-1" style={{ color: tc.mutedText }}>Show</span>
            <div onClick={() => setShowHeader(v => !v)} className="w-8 h-4 rounded-full relative cursor-pointer" style={{ backgroundColor: showHeader ? tc.checkActive : tc.checkInactive }}>
              <div className="absolute top-0.5 w-3 h-3 rounded-full transition-all" style={{ left: showHeader ? "17px" : "2px", backgroundColor: showHeader ? tc.checkDotActive : tc.checkDotInactive }} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {profilePicUrl ? (
            <img src={profilePicUrl} alt="Profile" className="h-16 w-16 rounded-full object-cover border-2 flex-shrink-0" style={{ borderColor: tc.initialsCircleBorder }} />
          ) : (
            <div className="flex-shrink-0">
              <InitialsBadgeSvg initials={initials} theme={theme} size={64} id="panel-badge-svg-header" />
            </div>
          )}
          <div className="flex-1 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: tc.mutedText }}>Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }} data-testid="input-profile-name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: tc.mutedText }}>Title</label>
              <select value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }} data-testid="select-profile-title">
                {TITLE_OPTIONS.map(t => <option key={t} value={t} style={{ backgroundColor: tc.isDark ? "#1a1a1a" : "#ffffff", color: tc.textColor }}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {cropperSrc && (
        <ImageCropper src={cropperSrc} onConfirm={handleCropConfirm} onCancel={() => setCropperSrc(null)} tc={tc} />
      )}

      <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
        <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Profile Picture</h3>
        <input type="file" ref={fileInputRef} accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileChange} />
        {profilePicUrl ? (
          <div className="flex flex-col items-center gap-3">
            <img src={profilePicUrl} alt="Preview" className="h-28 w-28 rounded-full object-cover border-2" style={{ borderColor: tc.initialsCircleBorder }} />
            <div className="flex gap-2">
              <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor, border: `1px solid ${tc.borderColor}` }}>Change</button>
              <button onClick={() => setProfilePicUrl(null)} className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor, border: `1px solid ${tc.borderColor}` }}><X className="h-3 w-3" /> Remove</button>
            </div>
          </div>
        ) : (
          <div onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center py-8 rounded-xl cursor-pointer transition-colors hover:opacity-80" style={{ border: `2px dashed ${tc.borderColor}` }}>
            {uploading ? <Loader2 className="h-6 w-6 animate-spin mb-2" style={{ color: tc.mutedText }} /> : <Upload className="h-7 w-7 mb-2" style={{ color: tc.mutedText }} />}
            <span className="text-xs font-medium" style={{ color: tc.mutedText }}>{uploading ? "Uploading..." : "Click to upload photo"}</span>
            <span className="text-xs mt-0.5" style={{ color: tc.mutedText, opacity: 0.7 }}>Crop tool included</span>
          </div>
        )}
      </div>

      <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
        <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Initials Badge</h3>
        <p className="text-xs" style={{ color: tc.mutedText }}>Your auto-generated logo — shown on your profile when no photo is uploaded. Download as PNG to use elsewhere.</p>
        <div className="flex items-center gap-4">
          <InitialsBadgeSvg initials={initials} theme={theme} size={80} id="panel-badge-svg" />
          <div className="flex-1 space-y-2">
            <p className="text-xs font-medium" style={{ color: tc.textColor }}>{name || "Your Name"}</p>
            <p className="text-xs" style={{ color: tc.mutedText }}>Updates live as you type your name</p>
            <button
              onClick={handleDownloadBadge}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-70"
              style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor, border: `1px solid ${tc.borderColor}` }}
              data-testid="button-download-badge"
            >
              <Download className="h-3 w-3" /> Download PNG
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Introduction & Bio</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: tc.mutedText }}>Show</span>
            <div onClick={() => setShowIntro(v => !v)} className="w-8 h-4 rounded-full relative cursor-pointer" style={{ backgroundColor: showIntro ? tc.checkActive : tc.checkInactive }}>
              <div className="absolute top-0.5 w-3 h-3 rounded-full transition-all" style={{ left: showIntro ? "17px" : "2px", backgroundColor: showIntro ? tc.checkDotActive : tc.checkDotInactive }} />
            </div>
          </div>
        </div>
        <select value={bioOption} onChange={e => setBioOption(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }} data-testid="select-bio-option-panel">
          <option value="a" style={{ backgroundColor: tc.isDark ? "#1a1a1a" : "#fff", color: tc.textColor }}>Option A - Core focus overview</option>
          <option value="b" style={{ backgroundColor: tc.isDark ? "#1a1a1a" : "#fff", color: tc.textColor }}>Option B - Integrated strategic approach</option>
          <option value="c" style={{ backgroundColor: tc.isDark ? "#1a1a1a" : "#fff", color: tc.textColor }}>Option C - Clarity & structure focus</option>
          <option value="custom" style={{ backgroundColor: tc.isDark ? "#1a1a1a" : "#fff", color: tc.textColor }}>Custom Biography</option>
        </select>
        {bioOption === "custom" ? (
          <textarea value={customBio} onChange={e => setCustomBio(e.target.value)} rows={5} className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }} data-testid="textarea-custom-bio-panel" />
        ) : (
          <div className="p-3 rounded-lg text-xs leading-relaxed whitespace-pre-line" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.mutedText }}>
            {BIO_OPTIONS[bioOption]}
          </div>
        )}
      </div>

      <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Individual Services</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: tc.mutedText }}>Show</span>
            <div onClick={() => setShowIndividualServices(v => !v)} className="w-8 h-4 rounded-full relative cursor-pointer" style={{ backgroundColor: showIndividualServices ? tc.checkActive : tc.checkInactive }}>
              <div className="absolute top-0.5 w-3 h-3 rounded-full transition-all" style={{ left: showIndividualServices ? "17px" : "2px", backgroundColor: showIndividualServices ? tc.checkDotActive : tc.checkDotInactive }} />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {INDIVIDUAL_SERVICES.map(s => (
            <label key={s.key} className="flex items-start gap-3 cursor-pointer p-2 rounded-lg" style={{ border: `1px solid ${tc.borderColor}` }}>
              <input type="checkbox" checked={selectedIndividual.includes(s.key)} onChange={() => toggleService(selectedIndividual, setSelectedIndividual, s.key)} className="mt-0.5 flex-shrink-0" data-testid={`check-panel-ind-${s.key}`} />
              <div>
                <div className="text-xs font-medium" style={{ color: tc.textColor }}>{s.name}</div>
                <div className="text-xs mt-0.5" style={{ color: tc.mutedText }}>{s.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Corporate Services</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: tc.mutedText }}>Show</span>
            <div onClick={() => setShowCorporateServices(v => !v)} className="w-8 h-4 rounded-full relative cursor-pointer" style={{ backgroundColor: showCorporateServices ? tc.checkActive : tc.checkInactive }}>
              <div className="absolute top-0.5 w-3 h-3 rounded-full transition-all" style={{ left: showCorporateServices ? "17px" : "2px", backgroundColor: showCorporateServices ? tc.checkDotActive : tc.checkDotInactive }} />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {CORPORATE_SERVICES.map(s => (
            <label key={s.key} className="flex items-start gap-3 cursor-pointer p-2 rounded-lg" style={{ border: `1px solid ${tc.borderColor}` }}>
              <input type="checkbox" checked={selectedCorporate.includes(s.key)} onChange={() => toggleService(selectedCorporate, setSelectedCorporate, s.key)} className="mt-0.5 flex-shrink-0" data-testid={`check-panel-corp-${s.key}`} />
              <div>
                <div className="text-xs font-medium" style={{ color: tc.textColor }}>{s.name}</div>
                <div className="text-xs mt-0.5" style={{ color: tc.mutedText }}>{s.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Social Links</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: tc.mutedText }}>Show</span>
            <div onClick={() => setShowSocials(v => !v)} className="w-8 h-4 rounded-full relative cursor-pointer" style={{ backgroundColor: showSocials ? tc.checkActive : tc.checkInactive }}>
              <div className="absolute top-0.5 w-3 h-3 rounded-full transition-all" style={{ left: showSocials ? "17px" : "2px", backgroundColor: showSocials ? tc.checkDotActive : tc.checkDotInactive }} />
            </div>
          </div>
        </div>
        <div className="space-y-2.5">
          {[
            { val: linkedinUrl, set: setLinkedinUrl, placeholder: "LinkedIn Profile URL", testId: "input-panel-linkedin" },
            { val: facebookUrl, set: setFacebookUrl, placeholder: "Facebook Profile URL", testId: "input-panel-facebook" },
            { val: instagramUrl, set: setInstagramUrl, placeholder: "Instagram Profile URL", testId: "input-panel-instagram" },
            { val: youtubeUrl, set: setYoutubeUrl, placeholder: "YouTube Channel URL", testId: "input-panel-youtube" },
            { val: websiteUrl, set: setWebsiteUrl, placeholder: "Personal Website URL", testId: "input-panel-website" },
          ].map(f => (
            <div key={f.testId} className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 flex-shrink-0" style={{ color: tc.mutedText }} />
              <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} className="flex-1 px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }} data-testid={f.testId} />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Contact Details</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs" style={{ color: tc.mutedText }}>Show on profile</span>
            <div
              onClick={() => setShowContactDetails(!showContactDetails)}
              className="w-9 h-5 rounded-full relative cursor-pointer transition-colors"
              style={{ backgroundColor: showContactDetails ? tc.checkActive : tc.checkInactive }}
              data-testid="toggle-show-contact"
            >
              <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all" style={{ left: showContactDetails ? "18px" : "2px", backgroundColor: showContactDetails ? tc.checkDotActive : tc.checkDotInactive }} />
            </div>
          </label>
        </div>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 flex-shrink-0" style={{ color: tc.mutedText }} />
            <input value={contactNumber} onChange={e => setContactNumber(e.target.value)} placeholder="Contact Number" className="flex-1 px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }} data-testid="input-panel-contact-number" />
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: tc.mutedText }} />
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location / Office Address" className="flex-1 px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }} data-testid="input-panel-location" />
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 flex-shrink-0" style={{ color: tc.mutedText }} />
            <input value={workingHours} onChange={e => setWorkingHours(e.target.value)} placeholder="Working Hours (e.g. Mon–Fri 8:00–17:00)" className="flex-1 px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }} data-testid="input-panel-working-hours" />
          </div>
        </div>
      </div>

      <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}`, borderStyle: "dashed" }}>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Admin Notes</h3>
          <p className="text-xs mt-0.5" style={{ color: tc.mutedText }}>Nickname &amp; description are for your reference only — never shown to clients.</p>
        </div>
        <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder='Profile nickname (e.g. "Corporate Clients")' className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }} data-testid="input-profile-nickname" />
        <textarea value={profileDescription} onChange={e => setProfileDescription(e.target.value)} placeholder="Short description to help you identify this profile..." rows={2} className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }} data-testid="input-profile-description" />
      </div>

      <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
        <h3 className="text-sm font-semibold mb-1" style={{ color: tc.sectionTitle }}>Profile Page Elements</h3>
        {[
          { label: "QR Code", value: showQrCode, set: setShowQrCode },
          { label: "Call Back Button", value: showCallbackLink, set: setShowCallbackLink },
          { label: "Refer Friends Button", value: showReferralsLink, set: setShowReferralsLink },
          { label: "Astute Online", value: showAstute, set: setShowAstute },
          { label: "Documents Upload", value: showDocuments, set: setShowDocuments },
          { label: "Complimentary Will", value: showComplimentaryWill, set: setShowComplimentaryWill },
          { label: "General Financial Media", value: showFinancialMedia, set: setShowFinancialMedia },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between py-1.5">
            <span className="text-sm" style={{ color: tc.textColor }}>{item.label}</span>
            <div onClick={() => item.set(v => !v)} className="w-9 h-5 rounded-full relative cursor-pointer" style={{ backgroundColor: item.value ? tc.checkActive : tc.checkInactive }}>
              <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all" style={{ left: item.value ? "18px" : "2px", backgroundColor: item.value ? tc.checkDotActive : tc.checkDotInactive }} />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
        <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Theme</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: "dark", label: "Black & White", bg: "#1a1a1a" },
            { key: "blue", label: "Blue", bg: "linear-gradient(135deg, #4a8db5, #1e3a5f)" },
            { key: "pink", label: "Pink", bg: "linear-gradient(135deg, #f472b6, #be185d)" },
            { key: "light-blue", label: "Light Blue", bg: "linear-gradient(135deg, #bae6fd, #0ea5e9)" },
            { key: "dark-royal-purple", label: "Royal Purple", bg: "linear-gradient(135deg, #3b0764, #a855f7)" },
            { key: "dark-green", label: "Dark Green", bg: "linear-gradient(135deg, #052e16, #22c55e)" },
          ].map(t => (
            <button key={t.key} onClick={() => setTheme(t.key)}
              className="rounded-xl border-2 p-3 text-center transition-all"
              style={{ borderColor: theme === t.key ? tc.accentColor : tc.borderColor }}
              data-testid={`theme-panel-${t.key}`}
            >
              <div className="w-full h-10 rounded-lg mb-2" style={{ background: t.bg }} />
              <span className="text-xs font-medium" style={{ color: tc.textColor }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
        style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}
        data-testid="button-save-profile"
      >
        {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save Changes
      </button>
    </div>
  );
}

function getThemeDot(theme: string) {
  const dots: Record<string, string> = {
    dark: "#555", blue: "#3b82f6", pink: "#be185d",
    "light-blue": "#0ea5e9", "dark-royal-purple": "#a855f7", "dark-green": "#22c55e",
  };
  return dots[theme] || "#3b82f6";
}
function getThemeLabel(theme: string) {
  const labels: Record<string, string> = {
    dark: "Black & White", blue: "Blue", pink: "Pink",
    "light-blue": "Light Blue", "dark-royal-purple": "Dark Royal Purple", "dark-green": "Dark Green",
  };
  return labels[theme] || theme;
}

function ProfileCard({
  profileSlug, title, theme, tc, label, isPrimary, onEditClick, onDeleteClick, nickname, profileDesc,
}: {
  profileSlug: string; title: string; theme: string; tc: ReturnType<typeof getThemeColors>;
  label: string; isPrimary: boolean; onEditClick: () => void; onDeleteClick?: () => void;
  nickname?: string; profileDesc?: string;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const url = `advisoryconnect.pro/${profileSlug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${url}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => toast({ title: "Copy failed", variant: "destructive" }));
  };

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold" style={{ color: tc.sectionTitle }}>{label}</span>
          {nickname && <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor }}>"{nickname}"</span>}
        </div>
        {isPrimary && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor }}>Primary</span>
        )}
      </div>
      {profileDesc && <p className="text-xs italic" style={{ color: tc.mutedText }}>{profileDesc}</p>}
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: getThemeDot(theme) }} />
        <span className="text-xs" style={{ color: tc.mutedText }}>{title} · {getThemeLabel(theme)}</span>
      </div>
      <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}` }}>
        <span className="text-xs flex-1 truncate font-mono" style={{ color: tc.textColor }}>{url}</span>
        <button onClick={handleCopy} title="Copy profile link" className="transition-opacity hover:opacity-70" data-testid={`button-copy-${profileSlug}`}>
          {copied ? <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#22c55e" }} /> : <Copy className="h-3.5 w-3.5 flex-shrink-0" style={{ color: tc.accentColor }} />}
        </button>
        <a href={`/${profileSlug}`} target="_blank" rel="noopener noreferrer" title="View profile">
          <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" style={{ color: tc.accentColor }} />
        </a>
      </div>
      <div className="flex gap-2">
        <button onClick={onEditClick} className="flex-1 py-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
          style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor, border: `1px solid ${tc.borderColor}` }}>
          {isPrimary ? "Edit in Profile tab" : "Edit"}
        </button>
        {!isPrimary && onDeleteClick && (
          <button onClick={onDeleteClick} className="px-3 py-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function AdditionalProfileForm({
  advisorId, baseSlug, tc, existingProfile, label, onDone,
}: {
  advisorId: number; baseSlug: string; tc: ReturnType<typeof getThemeColors>;
  existingProfile?: AdvisorProfile; label: string; onDone: () => void;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [profileSlug, setProfileSlug] = useState(existingProfile?.profileSlug || "");
  const [title, setTitle] = useState(existingProfile?.title || "Financial Advisor");
  const [bioOption, setBioOption] = useState(existingProfile?.bioOption || "a");
  const [customBio, setCustomBio] = useState(existingProfile?.customBio || "");
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(existingProfile?.profilePicUrl || null);
  const [linkedinUrl, setLinkedinUrl] = useState(existingProfile?.linkedinUrl || "");
  const [websiteUrl, setWebsiteUrl] = useState(existingProfile?.websiteUrl || "");
  const [facebookUrl, setFacebookUrl] = useState((existingProfile as any)?.facebookUrl || "");
  const [instagramUrl, setInstagramUrl] = useState((existingProfile as any)?.instagramUrl || "");
  const [youtubeUrl, setYoutubeUrl] = useState((existingProfile as any)?.youtubeUrl || "");
  const [astuteUrl, setAstuteUrl] = useState((existingProfile as any)?.astuteUrl || "");
  const [documentsUrl, setDocumentsUrl] = useState((existingProfile as any)?.documentsUrl || "");
  const [qaUrl, setQaUrl] = useState((existingProfile as any)?.qaUrl || "");
  const [financialsNewsUrl, setFinancialsNewsUrl] = useState((existingProfile as any)?.financialsNewsUrl || "");
  const [financialsFunFactsUrl, setFinancialsFunFactsUrl] = useState((existingProfile as any)?.financialsFunFactsUrl || "");
  const [financialsVideosUrl, setFinancialsVideosUrl] = useState((existingProfile as any)?.financialsVideosUrl || "");
  const [selectedIndividual, setSelectedIndividual] = useState<string[]>(existingProfile?.individualServices || []);
  const [selectedCorporate, setSelectedCorporate] = useState<string[]>(existingProfile?.corporateServices || []);
  const [theme, setTheme] = useState(existingProfile?.theme || "blue");
  const [showHeader, setShowHeader] = useState((existingProfile as any)?.showHeader !== false);
  const [showProfilePic, setShowProfilePic] = useState((existingProfile as any)?.showProfilePic !== false);
  const [showIntro, setShowIntro] = useState((existingProfile as any)?.showIntro !== false);
  const [showIndividualServices, setShowIndividualServices] = useState((existingProfile as any)?.showIndividualServices !== false);
  const [showCorporateServices, setShowCorporateServices] = useState((existingProfile as any)?.showCorporateServices !== false);
  const [showSocials, setShowSocials] = useState((existingProfile as any)?.showSocials !== false);
  const [showQrCode, setShowQrCode] = useState((existingProfile as any)?.showQrCode !== false);
  const [nickname, setNickname] = useState((existingProfile as any)?.nickname || "");
  const [profileDescription, setProfileDescription] = useState((existingProfile as any)?.profileDescription || "");
  const [showCallbackLink, setShowCallbackLink] = useState((existingProfile as any)?.showCallbackLink !== false);
  const [showReferralsLink, setShowReferralsLink] = useState((existingProfile as any)?.showReferralsLink !== false);
  const [showAstute, setShowAstute] = useState(!!(existingProfile as any)?.showAstute);
  const [showDocuments, setShowDocuments] = useState(!!(existingProfile as any)?.showDocuments);
  const [showComplimentaryWill, setShowComplimentaryWill] = useState(!!(existingProfile as any)?.showComplimentaryWill);
  const [showFinancialMedia, setShowFinancialMedia] = useState(!!(existingProfile as any)?.showFinancialMedia);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);

  const isEditing = !!existingProfile;
  const slugValid = profileSlug.length > 0 && /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(profileSlug);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        profileSlug: profileSlug.trim(),
        title, bioOption,
        bio: bioOption === "custom" ? customBio : BIO_OPTIONS[bioOption] || "",
        customBio: bioOption === "custom" ? customBio : null,
        profilePicUrl: profilePicUrl || null,
        linkedinUrl: linkedinUrl || null,
        websiteUrl: websiteUrl || null,
        facebookUrl: facebookUrl || null,
        instagramUrl: instagramUrl || null,
        youtubeUrl: youtubeUrl || null,
        astuteUrl: astuteUrl || null,
        documentsUrl: documentsUrl || null,
        qaUrl: qaUrl || null,
        financialsNewsUrl: financialsNewsUrl || null,
        financialsFunFactsUrl: financialsFunFactsUrl || null,
        financialsVideosUrl: financialsVideosUrl || null,
        individualServices: selectedIndividual,
        corporateServices: selectedCorporate,
        theme,
        themeColor: theme === "dark" ? "#1a1a1a" : theme === "blue" ? "#4a8db5" : theme === "pink" ? "#d4738a" : theme === "light-blue" ? "#0ea5e9" : theme === "dark-royal-purple" ? "#a855f7" : theme === "dark-green" ? "#22c55e" : "#4a8db5",
        showHeader,
        showProfilePic,
        showIntro,
        showIndividualServices,
        showCorporateServices,
        showSocials,
        showQrCode,
        showCallbackLink,
        showReferralsLink,
        showAstute,
        showDocuments,
        showComplimentaryWill,
        showFinancialMedia,
        nickname: nickname || null,
        profileDescription: profileDescription || null,
        active: true,
      };
      if (isEditing) {
        const res = await apiRequest("PATCH", `/api/advisors/${advisorId}/profiles/${existingProfile!.id}`, data);
        if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Failed to update"); }
        return res.json();
      } else {
        const res = await apiRequest("POST", `/api/advisors/${advisorId}/profiles`, data);
        if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Failed to create"); }
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/advisors/${advisorId}/profiles`] });
      toast({ title: isEditing ? "Profile Updated" : "Profile Created", description: isEditing ? "Changes saved." : `Profile live at advisoryconnect.pro/${profileSlug}` });
      onDone();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") setCropperSrc(reader.result); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropConfirm = async (dataUrl: string) => {
    setCropperSrc(null);
    setUploading(true);
    try {
      const r = await fetch(dataUrl);
      const blob = await r.blob();
      const formData = new FormData();
      formData.append("file", blob, "profile.jpg");
      const res = await fetch("/api/upload/profile-pic", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setProfilePicUrl(data.url);
    } catch { toast({ title: "Upload Failed", variant: "destructive" }); }
    finally { setUploading(false); }
  };

  const toggleService = (list: string[], setList: (v: string[]) => void, key: string) =>
    setList(list.includes(key) ? list.filter(s => s !== key) : [...list, key]);

  return (
    <>
    {cropperSrc && (
      <ImageCropper src={cropperSrc} onConfirm={handleCropConfirm} onCancel={() => setCropperSrc(null)} tc={tc} />
    )}
    <div className="rounded-xl overflow-hidden" style={{ border: `2px solid ${tc.accentColor}` }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: tc.cardBg, borderBottom: `1px solid ${tc.borderColor}` }}>
        <span className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>
          {isEditing ? `Editing ${label}` : `Create ${label}`}
        </span>
        <button onClick={onDone} className="text-xs px-2 py-1 rounded" style={{ color: tc.mutedText, backgroundColor: tc.inputBg }}>Cancel</button>
      </div>
      <div className="p-4 space-y-4" style={{ backgroundColor: tc.bgColor }}>
        <div className="space-y-1.5">
          <label className="text-xs font-medium" style={{ color: tc.mutedText }}>Profile URL</label>
          <div className="flex items-center rounded-lg overflow-hidden" style={{ border: `1px solid ${profileSlug && !slugValid ? "#ef4444" : tc.inputBorder}`, backgroundColor: tc.inputBg }}>
            <span className="px-2 py-2 text-xs flex-shrink-0" style={{ color: tc.mutedText, borderRight: `1px solid ${tc.inputBorder}` }}>advisoryconnect.pro/</span>
            <input value={profileSlug} onChange={e => setProfileSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder={`${baseSlug}-2`} className="flex-1 px-2 py-2 text-xs bg-transparent outline-none" style={{ color: tc.textColor }} data-testid="input-profile-slug" />
          </div>
          {profileSlug && !slugValid && <p className="text-xs" style={{ color: "#ef4444" }}>Lowercase letters, numbers and hyphens only. Must not start/end with a hyphen.</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium" style={{ color: tc.mutedText }}>Header & Title <span className="font-normal">(Show header)</span></label>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: tc.mutedText }}>Pic</span>
              <div onClick={() => setShowProfilePic(v => !v)} className="w-7 h-3.5 rounded-full relative cursor-pointer" style={{ backgroundColor: showProfilePic ? tc.checkActive : tc.checkInactive }}>
                <div className="absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all" style={{ left: showProfilePic ? "14px" : "1px", backgroundColor: showProfilePic ? tc.checkDotActive : tc.checkDotInactive }} />
              </div>
              <div onClick={() => setShowHeader(v => !v)} className="w-7 h-3.5 rounded-full relative cursor-pointer" style={{ backgroundColor: showHeader ? tc.checkActive : tc.checkInactive }}>
                <div className="absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all" style={{ left: showHeader ? "14px" : "1px", backgroundColor: showHeader ? tc.checkDotActive : tc.checkDotInactive }} />
              </div>
            </div>
          </div>
          <select value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }}>
            {TITLE_OPTIONS.map(t => <option key={t} value={t} style={{ backgroundColor: "#fff", color: "#1a2942" }}>{t}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium" style={{ color: tc.mutedText }}>Profile Picture</label>
          <input type="file" ref={fileInputRef} accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileChange} />
          {profilePicUrl ? (
            <div className="flex items-center gap-3">
              <img src={profilePicUrl} alt="Profile" className="h-12 w-12 rounded-full object-cover border" style={{ borderColor: tc.initialsCircleBorder }} />
              <div className="flex gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor }}>Change</button>
                <button onClick={() => setProfilePicUrl(null)} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor }}>Remove</button>
              </div>
            </div>
          ) : (
            <div onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 py-4 rounded-lg cursor-pointer" style={{ border: `2px dashed ${tc.borderColor}` }}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: tc.mutedText }} /> : <Upload className="h-4 w-4" style={{ color: tc.mutedText }} />}
              <span className="text-xs" style={{ color: tc.mutedText }}>{uploading ? "Uploading..." : "Upload photo"}</span>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium" style={{ color: tc.mutedText }}>Introduction & Bio</label>
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: tc.mutedText }}>Show</span>
              <div onClick={() => setShowIntro(v => !v)} className="w-7 h-3.5 rounded-full relative cursor-pointer" style={{ backgroundColor: showIntro ? tc.checkActive : tc.checkInactive }}>
                <div className="absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all" style={{ left: showIntro ? "14px" : "1px", backgroundColor: showIntro ? tc.checkDotActive : tc.checkDotInactive }} />
              </div>
            </div>
          </div>
          <select value={bioOption} onChange={e => setBioOption(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }}>
            <option value="a">Option A – Core focus overview</option>
            <option value="b">Option B – Integrated strategic approach</option>
            <option value="c">Option C – Clarity & structure focus</option>
            <option value="custom">Custom Biography</option>
          </select>
          {bioOption === "custom" ? (
            <textarea value={customBio} onChange={e => setCustomBio(e.target.value)} rows={4} className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }} />
          ) : (
            <div className="p-2 rounded-lg text-xs leading-relaxed whitespace-pre-line" style={{ backgroundColor: tc.inputBg, color: tc.mutedText }}>{BIO_OPTIONS[bioOption]}</div>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium" style={{ color: tc.mutedText }}>Individual Services</label>
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: tc.mutedText }}>Show</span>
              <div onClick={() => setShowIndividualServices(v => !v)} className="w-7 h-3.5 rounded-full relative cursor-pointer" style={{ backgroundColor: showIndividualServices ? tc.checkActive : tc.checkInactive }}>
                <div className="absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all" style={{ left: showIndividualServices ? "14px" : "1px", backgroundColor: showIndividualServices ? tc.checkDotActive : tc.checkDotInactive }} />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            {INDIVIDUAL_SERVICES.map(s => (
              <label key={s.key} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg" style={{ border: `1px solid ${tc.borderColor}` }}>
                <input type="checkbox" checked={selectedIndividual.includes(s.key)} onChange={() => toggleService(selectedIndividual, setSelectedIndividual, s.key)} className="flex-shrink-0" />
                <span className="text-xs" style={{ color: tc.textColor }}>{s.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium" style={{ color: tc.mutedText }}>Corporate Services</label>
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: tc.mutedText }}>Show</span>
              <div onClick={() => setShowCorporateServices(v => !v)} className="w-7 h-3.5 rounded-full relative cursor-pointer" style={{ backgroundColor: showCorporateServices ? tc.checkActive : tc.checkInactive }}>
                <div className="absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all" style={{ left: showCorporateServices ? "14px" : "1px", backgroundColor: showCorporateServices ? tc.checkDotActive : tc.checkDotInactive }} />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            {CORPORATE_SERVICES.map(s => (
              <label key={s.key} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg" style={{ border: `1px solid ${tc.borderColor}` }}>
                <input type="checkbox" checked={selectedCorporate.includes(s.key)} onChange={() => toggleService(selectedCorporate, setSelectedCorporate, s.key)} className="flex-shrink-0" />
                <span className="text-xs" style={{ color: tc.textColor }}>{s.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium" style={{ color: tc.mutedText }}>Social Links (optional)</label>
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: tc.mutedText }}>Show</span>
              <div onClick={() => setShowSocials(v => !v)} className="w-7 h-3.5 rounded-full relative cursor-pointer" style={{ backgroundColor: showSocials ? tc.checkActive : tc.checkInactive }}>
                <div className="absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all" style={{ left: showSocials ? "14px" : "1px", backgroundColor: showSocials ? tc.checkDotActive : tc.checkDotInactive }} />
              </div>
            </div>
          </div>
          {[
            { val: linkedinUrl, set: setLinkedinUrl, placeholder: "LinkedIn URL" },
            { val: facebookUrl, set: setFacebookUrl, placeholder: "Facebook URL" },
            { val: instagramUrl, set: setInstagramUrl, placeholder: "Instagram URL" },
            { val: youtubeUrl, set: setYoutubeUrl, placeholder: "YouTube URL" },
            { val: websiteUrl, set: setWebsiteUrl, placeholder: "Website URL" },
          ].map(f => (
            <input key={f.placeholder} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }} />
          ))}
        </div>

        <div className="space-y-1.5 p-3 rounded-lg" style={{ border: `1px dashed ${tc.borderColor}` }}>
          <label className="text-xs font-medium" style={{ color: tc.mutedText }}>Admin Notes (not shown to clients)</label>
          <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder='Nickname (e.g. "Corporate Clients")' className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }} />
          <textarea value={profileDescription} onChange={e => setProfileDescription(e.target.value)} placeholder="Short description..." rows={2} className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }} />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium" style={{ color: tc.mutedText }}>Theme</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "dark", label: "Black & White", bg: "#1a1a1a" },
              { key: "blue", label: "Blue", bg: "linear-gradient(135deg, #4a8db5, #1e3a5f)" },
              { key: "pink", label: "Pink", bg: "linear-gradient(135deg, #f472b6, #be185d)" },
              { key: "light-blue", label: "Light Blue", bg: "linear-gradient(135deg, #bae6fd, #0ea5e9)" },
              { key: "dark-royal-purple", label: "Royal Purple", bg: "linear-gradient(135deg, #3b0764, #a855f7)" },
              { key: "dark-green", label: "Dark Green", bg: "linear-gradient(135deg, #052e16, #22c55e)" },
            ].map(t => (
              <button key={t.key} onClick={() => setTheme(t.key)} className="rounded-lg border-2 p-2 text-center transition-all"
                style={{ borderColor: theme === t.key ? tc.accentColor : tc.borderColor }}>
                <div className="w-full h-8 rounded mb-1" style={{ background: t.bg }} />
                <span className="text-xs font-medium" style={{ color: tc.textColor }}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium" style={{ color: tc.mutedText }}>Profile Page Elements</label>
          {[
            { label: "QR Code", value: showQrCode, set: setShowQrCode },
            { label: "Call Back Button", value: showCallbackLink, set: setShowCallbackLink },
            { label: "Refer Friends Button", value: showReferralsLink, set: setShowReferralsLink },
            { label: "Astute Online", value: showAstute, set: setShowAstute },
            { label: "Documents Upload", value: showDocuments, set: setShowDocuments },
            { label: "Complimentary Will", value: showComplimentaryWill, set: setShowComplimentaryWill },
            { label: "General Financial Media", value: showFinancialMedia, set: setShowFinancialMedia },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between px-2 py-2 rounded-lg" style={{ border: `1px solid ${tc.borderColor}` }}>
              <span className="text-xs" style={{ color: tc.textColor }}>{item.label}</span>
              <div onClick={() => item.set(v => !v)} className="w-8 h-4 rounded-full relative cursor-pointer" style={{ backgroundColor: item.value ? tc.checkActive : tc.checkInactive }}>
                <div className="absolute top-0.5 w-3 h-3 rounded-full transition-all" style={{ left: item.value ? "17px" : "2px", backgroundColor: item.value ? tc.checkDotActive : tc.checkDotInactive }} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onDone} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ backgroundColor: tc.inputBg, color: tc.mutedText, border: `1px solid ${tc.borderColor}` }}>Cancel</button>
          <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !slugValid}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity"
            style={{ backgroundColor: tc.buttonBg, color: tc.buttonText, opacity: !slugValid ? 0.5 : 1 }}>
            {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Profile"}
          </button>
        </div>
      </div>
    </div>
    </>
  );
}

function ProfilesTab({ advisor, tc }: { advisor: Advisor; tc: ReturnType<typeof getThemeColors> }) {
  const { toast } = useToast();
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<number | null>(null);

  const { data: additionalProfiles = [] } = useQuery<AdvisorProfile[]>({
    queryKey: [`/api/advisors/${advisor.id}/profiles`],
  });

  const deleteProfileMutation = useMutation({
    mutationFn: async (profileId: number) => {
      const res = await apiRequest("DELETE", `/api/advisors/${advisor.id}/profiles/${profileId}`);
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Failed to delete"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/advisors/${advisor.id}/profiles`] });
      toast({ title: "Profile Deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const totalProfiles = 1 + additionalProfiles.length;
  const canAddMore = totalProfiles < 3 && !showNewForm;

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold" style={{ color: tc.textColor }}>My Profiles</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor }}>{totalProfiles} / 3</span>
        </div>
        <p className="text-xs" style={{ color: tc.mutedText }}>Each profile has its own unique link, theme, bio and services — ideal for targeting different audiences. Maximum 3 profiles per advisor.</p>
      </div>

      <ProfileCard
        profileSlug={advisor.profileSlug}
        title={advisor.title || "Financial Advisor"}
        theme={advisor.theme || "dark"}
        tc={tc}
        label="Profile 1 (Primary)"
        isPrimary={true}
        onEditClick={() => {}}
      />

      {additionalProfiles.map((profile, index) =>
        editingProfileId === profile.id ? (
          <AdditionalProfileForm
            key={profile.id}
            advisorId={advisor.id}
            baseSlug={advisor.profileSlug}
            tc={tc}
            existingProfile={profile}
            label={`Profile ${index + 2}`}
            onDone={() => setEditingProfileId(null)}
          />
        ) : (
          <ProfileCard
            key={profile.id}
            profileSlug={profile.profileSlug}
            title={profile.title || "Financial Advisor"}
            theme={profile.theme || "dark"}
            tc={tc}
            label={`Profile ${index + 2}`}
            isPrimary={false}
            nickname={(profile as any).nickname}
            profileDesc={(profile as any).profileDescription}
            onEditClick={() => setEditingProfileId(profile.id)}
            onDeleteClick={() => {
              if (window.confirm(`Delete Profile ${index + 2}? This cannot be undone.`)) {
                deleteProfileMutation.mutate(profile.id);
              }
            }}
          />
        )
      )}

      {showNewForm && (
        <AdditionalProfileForm
          advisorId={advisor.id}
          baseSlug={advisor.profileSlug}
          tc={tc}
          label={`Profile ${totalProfiles + 1}`}
          onDone={() => setShowNewForm(false)}
        />
      )}

      {canAddMore && (
        <button onClick={() => setShowNewForm(true)}
          className="w-full py-3.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
          style={{ border: `2px dashed ${tc.borderColor}`, color: tc.mutedText, backgroundColor: "transparent" }}
          data-testid="button-add-profile">
          <Plus className="h-4 w-4" />
          Add Profile {totalProfiles + 1} of 3
        </button>
      )}

      {!canAddMore && !showNewForm && totalProfiles >= 3 && (
        <div className="text-center py-3 text-xs rounded-xl" style={{ color: tc.mutedText, backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
          Maximum 3 profiles reached. Delete one to add a new profile.
        </div>
      )}
    </div>
  );
}

export default function AdvisorPanel() {
  const [, params] = useRoute("/advisor/:slug");
  const [, navigate] = useLocation();
  const slug = params?.slug || "";

  const [authState, setAuthState] = useState<"loading" | "set-password" | "login" | "authenticated">("loading");
  const [activeTab, setActiveTab] = useState<"leads" | "stats" | "profiles" | "profile">("leads");

  const { data: advisor, isLoading: advisorLoading } = useQuery<Advisor>({
    queryKey: [`/api/advisors/slug/${slug}`],
    enabled: !!slug,
  });

  useEffect(() => {
    if (!slug) return;
    const checkAuth = async () => {
      try {
        const [statusRes, sessionRes] = await Promise.all([
          fetch(`/api/advisor-auth/${slug}/status`),
          fetch(`/api/advisor-auth/${slug}/session`),
        ]);
        const status = await statusRes.json();
        const session = await sessionRes.json();
        if (session.authenticated) { setAuthState("authenticated"); return; }
        if (!status.passwordSet) { setAuthState("set-password"); return; }
        setAuthState("login");
      } catch { setAuthState("login"); }
    };
    checkAuth();
  }, [slug]);

  const handleLogout = async () => {
    await fetch(`/api/advisor-auth/${slug}/logout`, { method: "POST" });
    setAuthState("login");
  };

  if (!slug || advisorLoading || authState === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-white/30" />
      </div>
    );
  }

  if (!advisor) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
        <div className="text-center text-white">
          <h2 className="text-xl font-bold">Advisor Not Found</h2>
          <p className="text-white/50 text-sm mt-2">No advisor exists at this URL.</p>
        </div>
      </div>
    );
  }

  const tc = getThemeColors(advisor.theme);

  if (authState === "set-password") {
    return <SetPasswordScreen slug={slug} onDone={() => setAuthState("authenticated")} />;
  }
  if (authState === "login") {
    return <LoginScreen slug={slug} onDone={() => setAuthState("authenticated")} />;
  }

  const initials = getInitials(advisor.name);
  const profileUrl = `advisoryconnect.pro/${advisor.profileSlug}`;

  const tabs = [
    { key: "leads" as const, label: "Leads", icon: Inbox },
    { key: "stats" as const, label: "Stats", icon: BarChart2 },
    { key: "profiles" as const, label: "Profiles", icon: Layers },
    { key: "profile" as const, label: "Edit", icon: User },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: tc.bgColor }}>
      <div className="max-w-lg mx-auto">
        <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between" style={{ backgroundColor: tc.bgColor, borderBottom: `1px solid ${tc.borderColor}` }}>
          <div className="flex items-center gap-3">
            {advisor.profilePicUrl ? (
              <img src={advisor.profilePicUrl} alt={advisor.name} className="h-9 w-9 rounded-full object-cover border" style={{ borderColor: tc.initialsCircleBorder }} />
            ) : (
              <div className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: tc.initialsCircleBg, color: tc.accentColor }}>
                {initials}
              </div>
            )}
            <div>
              <div className="text-sm font-semibold leading-tight" style={{ color: tc.textColor }}>{advisor.name}</div>
              <div className="text-xs" style={{ color: tc.mutedText }}>Control Panel</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/${advisor.profileSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg transition-opacity hover:opacity-80"
              style={{ backgroundColor: tc.buttonSecondaryBg }}
              title="View public profile"
              data-testid="link-view-profile"
            >
              <Eye className="h-4 w-4" style={{ color: tc.accentColor }} />
            </a>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg transition-opacity hover:opacity-80"
              style={{ backgroundColor: tc.buttonSecondaryBg }}
              title="Sign out"
              data-testid="button-panel-logout"
            >
              <LogOut className="h-4 w-4" style={{ color: tc.accentColor }} />
            </button>
          </div>
        </div>

        <div className="flex border-b" style={{ borderColor: tc.borderColor }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors"
                style={{ color: isActive ? tc.accentColor : tc.mutedText, borderBottom: isActive ? `2px solid ${tc.accentColor}` : "2px solid transparent" }}
                data-testid={`tab-panel-${tab.key}`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-5 pb-12">
          {activeTab === "leads" && <CIVTab slug={slug} advisor={advisor} tc={tc} />}
          {activeTab === "stats" && <StatsTab slug={slug} tc={tc} />}
          {activeTab === "profiles" && <ProfilesTab advisor={advisor} tc={tc} />}
          {activeTab === "profile" && <ProfileTab slug={slug} advisor={advisor} tc={tc} />}
        </div>
      </div>
    </div>
  );
}
