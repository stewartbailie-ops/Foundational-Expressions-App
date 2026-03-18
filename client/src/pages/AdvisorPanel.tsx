import { useState, useRef, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, User, BarChart2, Inbox, ChevronDown, ChevronUp, Eye, Upload, X, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { getThemeColors } from "@/lib/themeUtils";
import type { Advisor, Email } from "@shared/schema";
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

function SetPasswordScreen({ slug, onDone }: { slug: string; onDone: () => void }) {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: advisor } = useQuery<Advisor>({
    queryKey: [`/api/advisors/slug/${slug}`],
  });

  const tc = getThemeColors(advisor?.theme);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast({ title: "Password too short", description: "Minimum 6 characters", variant: "destructive" }); return; }
    if (password !== confirm) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
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
          <p className="text-sm" style={{ color: tc.mutedText }}>Create your panel password to get started.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: tc.textColor }}>New Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }}
                data-testid="input-new-password"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: tc.textColor }}>Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat password"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }}
                data-testid="input-confirm-password"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
            style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}
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
  const { data: leads = [], isLoading } = useQuery<EmailRow[]>({
    queryKey: [`/api/advisors/${slug}/emails`],
  });

  if (isLoading) return (
    <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" style={{ color: tc.mutedText }} /></div>
  );

  if (leads.length === 0) return (
    <div className="text-center py-12" style={{ color: tc.mutedText }}>
      <Inbox className="h-10 w-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm">No leads yet. Share your profile link to start receiving callbacks and referrals.</p>
    </div>
  );

  const gradeColors: Record<string, string> = {
    Gold: "#b45309",
    Silver: "#6b7280",
    Bronze: "#c2410c",
    Development: "#2563eb",
  };

  return (
    <div className="space-y-3">
      {leads.map(lead => (
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
              <div className="min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: tc.textColor }}>{lead.senderName}</div>
                <div className="text-xs truncate" style={{ color: tc.mutedText }}>{lead.type} · {format(new Date(lead.receivedAt), "dd MMM yyyy")}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {lead.grade && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: gradeColors[lead.grade] || tc.mutedText, backgroundColor: tc.initialsCircleBg }}>
                  {lead.grade}
                </span>
              )}
              {expandedId === lead.id ? <ChevronUp className="h-4 w-4" style={{ color: tc.mutedText }} /> : <ChevronDown className="h-4 w-4" style={{ color: tc.mutedText }} />}
            </div>
          </button>
          {expandedId === lead.id && (
            <div className="px-4 pb-4 space-y-2 text-sm" style={{ borderTop: `1px solid ${tc.borderColor}`, paddingTop: "12px" }}>
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
              {lead.servicesRequested && <Row label="Services" value={lead.servicesRequested} tc={tc} />}
              {lead.referrerName && <Row label="Referred by" value={`${lead.referrerName}${lead.referrerEmail ? ` (${lead.referrerEmail})` : ""}`} tc={tc} />}
            </div>
          )}
        </div>
      ))}
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

function ProfileTab({ slug, advisor, tc }: { slug: string; advisor: Advisor; tc: ReturnType<typeof getThemeColors> }) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState(advisor.name);
  const [title, setTitle] = useState(advisor.title || "Financial Advisor");
  const [bioOption, setBioOption] = useState(advisor.bioOption || "a");
  const [customBio, setCustomBio] = useState(advisor.customBio || "");
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(advisor.profilePicUrl || null);
  const [linkedinUrl, setLinkedinUrl] = useState(advisor.linkedinUrl || "");
  const [websiteUrl, setWebsiteUrl] = useState(advisor.websiteUrl || "");
  const [selectedIndividual, setSelectedIndividual] = useState<string[]>(advisor.individualServices || []);
  const [selectedCorporate, setSelectedCorporate] = useState<string[]>(advisor.corporateServices || []);
  const [theme, setTheme] = useState(advisor.theme || "dark");

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
        individualServices: selectedIndividual,
        corporateServices: selectedCorporate,
        theme,
        themeColor: theme === "dark" ? "#1a1a1a" : theme === "blue" ? "#1e3a5f" : "#d4738a",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/advisors/slug/${slug}`] });
      toast({ title: "Profile Updated", description: "Your changes have been saved." });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

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
      toast({ title: "Upload Failed", variant: "destructive" });
    } finally { setUploading(false); }
  };

  const toggleService = (list: string[], setList: (v: string[]) => void, key: string) => {
    setList(list.includes(key) ? list.filter(s => s !== key) : [...list, key]);
  };

  const initials = name.trim() ? name.trim().split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "NA";

  return (
    <div className="space-y-5">
      <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
        <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Header</h3>
        <div className="flex items-center gap-4">
          {profilePicUrl ? (
            <img src={profilePicUrl} alt="Profile" className="h-16 w-16 rounded-full object-cover border-2 flex-shrink-0" style={{ borderColor: tc.initialsCircleBorder }} />
          ) : (
            <div className="h-16 w-16 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0" style={{ backgroundColor: tc.initialsCircleBg, color: tc.accentColor }}>
              {initials}
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

      <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
        <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Profile Picture</h3>
        <input type="file" ref={fileInputRef} accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileUpload} />
        {profilePicUrl ? (
          <div className="flex flex-col items-center gap-3">
            <img src={profilePicUrl} alt="Preview" className="h-24 w-24 rounded-full object-cover border-2" style={{ borderColor: tc.initialsCircleBorder }} />
            <div className="flex gap-2">
              <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor, border: `1px solid ${tc.borderColor}` }}>Change</button>
              <button onClick={() => setProfilePicUrl(null)} className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor, border: `1px solid ${tc.borderColor}` }}><X className="h-3 w-3" /> Remove</button>
            </div>
          </div>
        ) : (
          <div onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center py-6 rounded-lg cursor-pointer" style={{ border: `2px dashed ${tc.borderColor}` }}>
            {uploading ? <Loader2 className="h-6 w-6 animate-spin mb-2" style={{ color: tc.mutedText }} /> : <Upload className="h-6 w-6 mb-2" style={{ color: tc.mutedText }} />}
            <span className="text-xs" style={{ color: tc.mutedText }}>{uploading ? "Uploading..." : "Click to upload profile picture"}</span>
          </div>
        )}
      </div>

      <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
        <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Introduction & Bio</h3>
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
        <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Individual Services</h3>
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
        <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Corporate Services</h3>
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
        <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Social Links</h3>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4 flex-shrink-0" style={{ color: tc.mutedText }} />
            <input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="LinkedIn Profile URL" className="flex-1 px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }} data-testid="input-panel-linkedin" />
          </div>
          <div className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4 flex-shrink-0" style={{ color: tc.mutedText }} />
            <input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="Personal Website URL" className="flex-1 px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }} data-testid="input-panel-website" />
          </div>
        </div>
      </div>

      <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
        <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Theme</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: "dark", label: "Black & White", bg: "#1a1a1a" },
            { key: "blue", label: "Blue", bg: "linear-gradient(135deg, #3b82f6, #1e3a5f)" },
            { key: "pink", label: "Pink", bg: "linear-gradient(135deg, #f472b6, #be185d)" },
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

export default function AdvisorPanel() {
  const [, params] = useRoute("/advisor/:slug");
  const [, navigate] = useLocation();
  const slug = params?.slug || "";

  const [authState, setAuthState] = useState<"loading" | "set-password" | "login" | "authenticated">("loading");
  const [activeTab, setActiveTab] = useState<"profile" | "leads" | "stats">("leads");

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
    { key: "profile" as const, label: "Profile", icon: User },
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
          {activeTab === "profile" && <ProfileTab slug={slug} advisor={advisor} tc={tc} />}
        </div>
      </div>
    </div>
  );
}
