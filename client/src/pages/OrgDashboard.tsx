import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Users, Activity, Mail, MousePointerClick,
  Loader2, LogOut, Plus, Building2, ShieldCheck, Trash2, UserPlus,
  List, Settings, ArrowRightLeft,
} from "lucide-react";
import { motion } from "framer-motion";

type OrgSession = {
  authenticated: boolean;
  orgId: number;
  orgName: string;
  seatLimit: number;
  adminName: string;
  adminRole: string;
};

type OrgStats = {
  totalAdvisors: number;
  activeAdvisors: number;
  totalLeads: number;
  totalProfileViews: number;
};

type OrgAdvisor = {
  id: number;
  name: string;
  email: string;
  profileSlug: string;
  active: boolean;
  createdAt: string;
};

type OrgTeamMember = {
  id: number;
  name: string;
  email: string;
  role: "owner" | "admin" | string;
  createdAt: string | null;
  isSelf: boolean;
};

type OrgLead = {
  id: number;
  type: string;
  senderName: string;
  senderEmail: string | null;
  phone: string | null;
  receivedAt: string;
  grade: string | null;
  status: string | null;
  temperature: string | null;
  servicesRequested: string | null;
  advisorId: number;
  advisorName: string;
};

type OrgSettings = {
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  seatLimit: number;
};

const GLASS_BG = "rgba(255,255,255,0.06)";
const GLASS_BORDER = "rgba(255,255,255,0.10)";

function OrgAuthGate({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const { data, isLoading } = useQuery<OrgSession>({
    queryKey: ["/api/org/session"],
    staleTime: Infinity,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-white/30" />
      </div>
    );
  }

  if (!data?.authenticated) {
    navigate("/org/login");
    return null;
  }

  return <>{children}</>;
}

function StatTile({
  label, value, icon: Icon, accent, index,
}: {
  label: string; value: number; icon: React.ElementType; accent: string; index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35, ease: "easeOut" }}
      className="rounded-xl p-5"
      style={{ backgroundColor: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-white/70">{label}</span>
        <div className="rounded-lg p-1.5" style={{ backgroundColor: `${accent}22` }}>
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </div>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </motion.div>
  );
}

function AddAdvisorModal({
  onClose, onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const suggestSlug = (n: string) =>
    n.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/org/advisors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          profileSlug: slug.trim(),
          advisorPassword: password,
          advisorPasswordSet: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to create advisor");
        setLoading(false);
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="w-full max-w-md rounded-2xl p-6 space-y-4"
        style={{ backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.12)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Add New Advisor</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugEdited) setSlug(suggestSlug(e.target.value));
            }}
            required
            className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40 transition-colors"
          />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40 transition-colors"
          />
          <div>
            <input
              type="text"
              placeholder="Profile URL slug (e.g. john-smith)"
              value={slug}
              onChange={(e) => { setSlugEdited(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); }}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40 transition-colors"
            />
            {slug && (
              <p className="text-white/30 text-xs mt-1 ml-1">advisoryconnect.pro/{slug}</p>
            )}
          </div>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              placeholder="Temporary password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 pr-16 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[44px] px-2 text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>

          {error && <p className="text-red-300 text-sm">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-white/15 text-white/60 text-sm hover:text-white/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Advisor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddTeamMemberModal({
  onClose, onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"owner" | "admin">("admin");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/org/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to add team member");
        setLoading(false);
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="w-full max-w-md rounded-2xl p-6 space-y-4"
        style={{ backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.12)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Add Team Member</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40 transition-colors"
          />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40 transition-colors"
          />
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              placeholder="Temporary password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 pr-16 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[44px] px-2 text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "owner" | "admin")}
            className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white text-sm focus:outline-none focus:border-white/40 transition-colors"
          >
            <option value="admin" className="bg-black">Admin</option>
            <option value="owner" className="bg-black">Owner</option>
          </select>

          {error && <p className="text-red-300 text-sm">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-white/15 text-white/60 text-sm hover:text-white/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReassignModal({
  advisor,
  allAdvisors,
  onClose,
  onSuccess,
}: {
  advisor: OrgAdvisor;
  allAdvisors: OrgAdvisor[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [toId, setToId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const candidates = allAdvisors.filter((a) => a.id !== advisor.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toId) { setError("Please select a destination advisor"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/org/advisors/${advisor.id}/reassign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toAdvisorId: Number(toId) }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.message || "Reassignment failed");
        setLoading(false);
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.12)" }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Reassign Leads & Clients</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 text-2xl leading-none">&times;</button>
        </div>
        <p className="text-white/50 text-sm">
          Move all leads and clients from <strong className="text-white">{advisor.name}</strong> to another advisor.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <select
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white text-sm focus:outline-none focus:border-white/40 transition-colors"
          >
            <option value="" className="bg-black">Select destination advisor…</option>
            {candidates.map((a) => (
              <option key={a.id} value={a.id} className="bg-black">{a.name}</option>
            ))}
          </select>
          {error && <p className="text-red-300 text-sm">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/15 text-white/60 text-sm hover:text-white/80 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reassign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OrgDashboard() {
  const [tab, setTab] = useState<"overview" | "advisors" | "registry" | "team" | "settings" | "subscription">("overview");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [reassignAdvisor, setReassignAdvisor] = useState<OrgAdvisor | null>(null);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Branding settings local state
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#4a8db5");
  const [settingsSaved, setSettingsSaved] = useState(false);

  const { data: session } = useQuery<OrgSession>({
    queryKey: ["/api/org/session"],
    staleTime: Infinity,
  });

  const { data: stats } = useQuery<OrgStats>({
    queryKey: ["/api/org/stats"],
    enabled: !!session?.authenticated,
  });

  const { data: advisors = [] } = useQuery<OrgAdvisor[]>({
    queryKey: ["/api/org/advisors"],
    enabled: !!session?.authenticated,
  });

  const { data: team = [] } = useQuery<OrgTeamMember[]>({
    queryKey: ["/api/org/team"],
    enabled: !!session?.authenticated,
  });

  const { data: registry = [] } = useQuery<OrgLead[]>({
    queryKey: ["/api/org/registry"],
    enabled: !!session?.authenticated && tab === "registry",
  });

  const { data: orgSettings } = useQuery<OrgSettings>({
    queryKey: ["/api/org/settings"],
    enabled: !!session?.authenticated,
  });

  // Sync branding fields when org settings load
  React.useEffect(() => {
    if (orgSettings?.logoUrl) setLogoUrl(orgSettings.logoUrl);
    if (orgSettings?.primaryColor) setPrimaryColor(orgSettings.primaryColor);
  }, [orgSettings]);

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const res = await fetch(`/api/org/advisors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org/advisors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/org/stats"] });
    },
  });

  const deleteAdvisor = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/org/advisors/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete advisor");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org/advisors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/org/stats"] });
    },
  });

  const deleteTeamMember = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/org/team/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to remove team member");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org/team"] });
    },
  });

  const saveBranding = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/org/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: logoUrl.trim() || null, primaryColor }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org/settings"] });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    },
  });

  const handleLogout = async () => {
    await fetch("/api/org/logout", { method: "POST" });
    navigate("/org/login");
  };

  const seatsUsed = advisors.length;
  const seatLimit = session?.seatLimit ?? 50;
  const seatPct = seatLimit > 0 ? Math.round((seatsUsed / seatLimit) * 100) : 0;
  const seatColor = seatPct >= 90 ? "#EF4444" : seatPct >= 70 ? "#F59E0B" : "#10B981";
  const ownerCount = team.filter((member) => member.role === "owner").length;

  return (
    <OrgAuthGate>
      <div className="min-h-screen" style={{ backgroundColor: "#0a0a0a" }}>

        {/* Header */}
        <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo/icon-192.png" alt="Advisory Connect" className="h-7 w-7" />
            <div>
              <h1 className="text-white font-semibold text-sm leading-tight">
                {session?.orgName ?? "Organisation"}
              </h1>
              <p className="text-white/40 text-xs">
                {session?.adminName ? `${session.adminName} - ${session.adminRole}` : "Organisation Dashboard"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors px-3 py-2 rounded-lg"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/10 px-6 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {([
              { key: "overview", label: "Overview" },
              { key: "advisors", label: "Advisors" },
              { key: "registry", label: "Registry" },
              { key: "team", label: "Team" },
              { key: "settings", label: "Settings" },
              { key: "subscription", label: "Subscription" },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap"
                style={{ color: tab === key ? "#fff" : "rgba(255,255,255,0.4)" }}
              >
                {label}
                {tab === key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-w-5xl mx-auto">

          {/* ── Overview ── */}
          {tab === "overview" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-white text-xl font-bold">Overview</h2>
                <p className="text-white/50 text-sm mt-1">Your organisation at a glance</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatTile label="Total Advisors"   value={stats?.totalAdvisors ?? 0}     icon={Users}             accent="#3B82F6" index={0} />
                <StatTile label="Active Advisors"  value={stats?.activeAdvisors ?? 0}    icon={Activity}          accent="#10B981" index={1} />
                <StatTile label="Total Leads"      value={stats?.totalLeads ?? 0}         icon={Mail}              accent="#F59E0B" index={2} />
                <StatTile label="Profile Views"    value={stats?.totalProfileViews ?? 0} icon={MousePointerClick} accent="#8B5CF6" index={3} />
              </div>

              {/* Seat usage bar */}
              <div
                className="rounded-xl p-5 space-y-3"
                style={{ backgroundColor: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium text-sm">Seat Usage</span>
                  <span className="text-white/50 text-sm">{seatsUsed} / {seatLimit} seats</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(seatPct, 100)}%`, backgroundColor: seatColor }}
                  />
                </div>
                <p className="text-white/40 text-xs">
                  {seatLimit - seatsUsed} seats remaining —{" "}
                  <button
                    onClick={() => setTab("subscription")}
                    className="text-white/60 hover:text-white underline"
                  >
                    manage subscription
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ── Advisors ── */}
          {tab === "advisors" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-white text-xl font-bold">Advisors</h2>
                  <p className="text-white/50 text-sm mt-1">{seatsUsed} of {seatLimit} seats used</p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  disabled={seatsUsed >= seatLimit}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Add Advisor
                </button>
              </div>

              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${GLASS_BORDER}` }}>
                {advisors.length === 0 ? (
                  <div className="p-10 text-center text-white/40 text-sm">
                    No advisors yet — add your first one above.
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr style={{ backgroundColor: "rgba(255,255,255,0.04)", borderBottom: `1px solid ${GLASS_BORDER}` }}>
                        <th className="text-left px-4 py-3 text-xs font-medium text-white/50">Name</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-white/50 hidden md:table-cell">Email</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-white/50 hidden lg:table-cell">Profile URL</th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-white/50">Status</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-white/50">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {advisors.map((advisor, i) => (
                        <tr
                          key={advisor.id}
                          className="hover:bg-white/[0.02] transition-colors"
                          style={{ borderBottom: i < advisors.length - 1 ? `1px solid ${GLASS_BORDER}` : "none" }}
                        >
                          <td className="px-4 py-3.5">
                            <span className="text-white text-sm font-medium">{advisor.name}</span>
                          </td>
                          <td className="px-4 py-3.5 hidden md:table-cell">
                            <span className="text-white/50 text-sm">{advisor.email}</span>
                          </td>
                          <td className="px-4 py-3.5 hidden lg:table-cell">
                            <a
                              href={`/${advisor.profileSlug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400/70 hover:text-blue-400 text-sm transition-colors"
                            >
                              /{advisor.profileSlug}
                            </a>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <button
                              onClick={() => toggleActive.mutate({ id: advisor.id, active: !advisor.active })}
                              disabled={toggleActive.isPending}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all disabled:opacity-50"
                              style={{
                                backgroundColor: advisor.active ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)",
                                color: advisor.active ? "#10B981" : "rgba(255,255,255,0.35)",
                                border: `1px solid ${advisor.active ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.10)"}`,
                              }}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${advisor.active ? "bg-emerald-400" : "bg-white/30"}`} />
                              {advisor.active ? "Active" : "Suspended"}
                            </button>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setReassignAdvisor(advisor)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-all"
                                title="Reassign all leads and clients to another advisor"
                              >
                                <ArrowRightLeft className="h-3.5 w-3.5" />
                                Reassign
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Remove ${advisor.name} from this organisation? This cannot be undone.`)) {
                                    deleteAdvisor.mutate(advisor.id);
                                  }
                                }}
                                disabled={deleteAdvisor.isPending}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-red-300 bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 disabled:opacity-35 disabled:cursor-not-allowed transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {tab === "team" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-white text-xl font-bold">Team</h2>
                  <p className="text-white/50 text-sm mt-1">Manage organisation admins and owners</p>
                </div>
                <button
                  onClick={() => setShowAddTeamModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Team Member
                </button>
              </div>

              <div
                className="rounded-xl p-4 flex items-start gap-3"
                style={{ backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}
              >
                <ShieldCheck className="h-5 w-5 text-amber-300 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-white font-medium text-sm">Owner access controls the organisation.</div>
                  <div className="text-white/50 text-sm mt-1">
                    You cannot remove yourself, and the final owner is protected so the organisation never loses admin control.
                  </div>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${GLASS_BORDER}` }}>
                {team.length === 0 ? (
                  <div className="p-10 text-center text-white/40 text-sm">
                    No team members yet.
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr style={{ backgroundColor: "rgba(255,255,255,0.04)", borderBottom: `1px solid ${GLASS_BORDER}` }}>
                        <th className="text-left px-4 py-3 text-xs font-medium text-white/50">Name</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-white/50 hidden md:table-cell">Email</th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-white/50">Role</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-white/50">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {team.map((member, i) => {
                        const isLastOwner = member.role === "owner" && ownerCount <= 1;
                        const deleteDisabled = member.isSelf || isLastOwner || deleteTeamMember.isPending;
                        return (
                          <tr
                            key={member.id}
                            className="hover:bg-white/[0.02] transition-colors"
                            style={{ borderBottom: i < team.length - 1 ? `1px solid ${GLASS_BORDER}` : "none" }}
                          >
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className="text-white text-sm font-medium">{member.name}</span>
                                {member.isSelf && (
                                  <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 text-[10px] font-semibold border border-blue-500/25">
                                    You
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 hidden md:table-cell">
                              <span className="text-white/50 text-sm">{member.email}</span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span
                                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium capitalize"
                                style={{
                                  backgroundColor: member.role === "owner" ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.06)",
                                  color: member.role === "owner" ? "#F59E0B" : "rgba(255,255,255,0.65)",
                                  border: `1px solid ${member.role === "owner" ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.10)"}`,
                                }}
                              >
                                {member.role}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <button
                                onClick={() => deleteTeamMember.mutate(member.id)}
                                disabled={deleteDisabled}
                                title={member.isSelf ? "You cannot remove yourself" : isLastOwner ? "Cannot remove the last owner" : "Remove team member"}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-red-300 bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 disabled:opacity-35 disabled:cursor-not-allowed transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── Registry ── */}
          {tab === "registry" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-white text-xl font-bold">Lead Registry</h2>
                <p className="text-white/50 text-sm mt-1">All leads across your organisation's advisors</p>
              </div>

              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${GLASS_BORDER}` }}>
                {registry.length === 0 ? (
                  <div className="p-10 text-center text-white/40 text-sm">
                    No leads yet across your advisors.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                      <thead>
                        <tr style={{ backgroundColor: "rgba(255,255,255,0.04)", borderBottom: `1px solid ${GLASS_BORDER}` }}>
                          <th className="text-left px-4 py-3 text-xs font-medium text-white/50">Name</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-white/50">Type</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-white/50">Advisor</th>
                          <th className="text-center px-4 py-3 text-xs font-medium text-white/50">Grade</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-white/50 hidden md:table-cell">Status</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-white/50">Received</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registry.map((lead, i) => {
                          const gradeColor: Record<string, string> = { Gold: "#F59E0B", Silver: "#94A3B8", Bronze: "#B45309" };
                          const typeLabel: Record<string, string> = { callback: "Callback", referral: "Referral", will: "Will", contact: "Enquiry" };
                          const date = lead.receivedAt ? new Date(lead.receivedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short" }) : "—";
                          return (
                            <tr
                              key={lead.id}
                              className="hover:bg-white/[0.02] transition-colors"
                              style={{ borderBottom: i < registry.length - 1 ? `1px solid ${GLASS_BORDER}` : "none" }}
                            >
                              <td className="px-4 py-3.5">
                                <div className="text-white text-sm font-medium">{lead.senderName || "—"}</div>
                                {lead.senderEmail && <div className="text-white/40 text-xs mt-0.5">{lead.senderEmail}</div>}
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="text-white/60 text-sm">{typeLabel[lead.type] ?? lead.type}</span>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="text-white/70 text-sm">{lead.advisorName}</span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                {lead.grade ? (
                                  <span
                                    className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold"
                                    style={{
                                      backgroundColor: `${gradeColor[lead.grade] ?? "#6B7280"}22`,
                                      color: gradeColor[lead.grade] ?? "#9CA3AF",
                                      border: `1px solid ${gradeColor[lead.grade] ?? "#6B7280"}44`,
                                    }}
                                  >
                                    {lead.grade}
                                  </span>
                                ) : <span className="text-white/20 text-xs">—</span>}
                              </td>
                              <td className="px-4 py-3.5 hidden md:table-cell">
                                <span className="text-white/50 text-sm capitalize">{lead.status ?? "new"}</span>
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <span className="text-white/40 text-sm">{date}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {registry.length > 0 && (
                <p className="text-white/30 text-xs text-right">{registry.length} lead{registry.length !== 1 ? "s" : ""} — showing latest 500</p>
              )}
            </div>
          )}

          {/* ── Settings (Branding) ── */}
          {tab === "settings" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-white text-xl font-bold">Organisation Settings</h2>
                <p className="text-white/50 text-sm mt-1">Branding that cascades to your advisors' profiles</p>
              </div>

              <div className="rounded-xl p-6 space-y-5" style={{ backgroundColor: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}>
                <h3 className="text-white font-semibold text-sm">Branding</h3>

                <div className="space-y-1">
                  <label className="text-white/60 text-xs font-medium">Logo URL</label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://your-domain.com/logo.png"
                    className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40 transition-colors"
                  />
                  <p className="text-white/30 text-xs mt-1">A publicly accessible URL to your organisation logo (PNG or SVG recommended)</p>
                </div>

                {logoUrl && (
                  <div className="flex items-center gap-3">
                    <img src={logoUrl} alt="Logo preview" className="h-10 w-10 object-contain rounded-lg bg-white/5 p-1" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <span className="text-white/40 text-xs">Logo preview</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-white/60 text-xs font-medium">Primary Colour</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-16 rounded-lg cursor-pointer border border-white/15 bg-transparent"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setPrimaryColor(e.target.value); }}
                      placeholder="#4a8db5"
                      className="w-32 px-3 py-2 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 text-sm font-mono focus:outline-none focus:border-white/40 transition-colors"
                    />
                    <div className="h-8 w-8 rounded-lg border border-white/15" style={{ backgroundColor: primaryColor }} />
                  </div>
                  <p className="text-white/30 text-xs mt-1">This colour will cascade to your advisors' profile themes</p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => saveBranding.mutate()}
                    disabled={saveBranding.isPending}
                    className="px-6 py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 disabled:opacity-40 transition-all flex items-center gap-2"
                  >
                    {saveBranding.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
                    Save Branding
                  </button>
                  {settingsSaved && <span className="text-emerald-400 text-sm">Saved!</span>}
                  {saveBranding.isError && <span className="text-red-400 text-sm">Save failed — please try again.</span>}
                </div>
              </div>

              <div className="rounded-xl p-4 flex items-start gap-3" style={{ backgroundColor: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
                <Settings className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-white/50 text-sm">
                  More branding controls (custom themes, advisor profile defaults, email footers) are coming. Contact Advisory Connect to discuss your organisation's requirements.
                </p>
              </div>
            </div>
          )}

          {/* ── Subscription ── */}
          {tab === "subscription" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-white text-xl font-bold">Subscription</h2>
                <p className="text-white/50 text-sm mt-1">Your plan and seat allocation</p>
              </div>

              {/* Plan card */}
              <div
                className="rounded-xl p-6 space-y-5"
                style={{ backgroundColor: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">Current Plan</div>
                    <div className="text-2xl font-bold text-white">Organisation</div>
                    <div className="text-white/50 text-sm mt-1">{seatLimit} advisor seats included</div>
                  </div>
                  <div
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: "rgba(16,185,129,0.15)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }}
                  >
                    Active
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Seats used</span>
                    <span className="text-white font-medium">{seatsUsed} / {seatLimit}</span>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${Math.min(seatPct, 100)}%`, backgroundColor: seatColor }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Seats remaining</span>
                    <span className="text-white font-medium">{seatLimit - seatsUsed}</span>
                  </div>
                </div>
              </div>

              {/* Per-seat breakdown */}
              <div
                className="rounded-xl p-6 space-y-4"
                style={{ backgroundColor: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}
              >
                <h3 className="text-white font-semibold text-sm">Advisor Breakdown</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">{seatsUsed}</div>
                    <div className="text-white/40 text-xs mt-1">Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-400">{stats?.activeAdvisors ?? 0}</div>
                    <div className="text-white/40 text-xs mt-1">Active</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white/40">
                      {seatsUsed - (stats?.activeAdvisors ?? 0)}
                    </div>
                    <div className="text-white/40 text-xs mt-1">Suspended</div>
                  </div>
                </div>
              </div>

              {/* Contact card */}
              <div
                className="rounded-xl p-5 flex items-start gap-4"
                style={{ backgroundColor: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}
              >
                <Building2 className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-white font-medium text-sm">Need more seats or a custom plan?</div>
                  <div className="text-white/50 text-sm mt-1">
                    Contact Advisory Connect to adjust your seat limit, discuss volume pricing, or arrange an enterprise agreement.
                  </div>
                  <a
                    href="mailto:info@advisoryconnect.pro"
                    className="inline-block mt-3 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 text-sm font-medium hover:bg-blue-500/30 transition-colors"
                  >
                    Contact Us
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddAdvisorModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/org/advisors"] });
            queryClient.invalidateQueries({ queryKey: ["/api/org/stats"] });
            setTab("advisors");
          }}
        />
      )}
      {showAddTeamModal && (
        <AddTeamMemberModal
          onClose={() => setShowAddTeamModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/org/team"] });
            setTab("team");
          }}
        />
      )}
      {reassignAdvisor && (
        <ReassignModal
          advisor={reassignAdvisor}
          allAdvisors={advisors}
          onClose={() => setReassignAdvisor(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/org/registry"] });
            queryClient.invalidateQueries({ queryKey: ["/api/org/stats"] });
          }}
        />
      )}
    </OrgAuthGate>
  );
}
