import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Users, Activity, Mail, MousePointerClick,
  Loader2, LogOut, Plus, Building2, ShieldCheck, Trash2, UserPlus,
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

export default function OrgDashboard() {
  const [tab, setTab] = useState<"overview" | "advisors" | "team" | "subscription">("overview");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

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
        <div className="border-b border-white/10 px-6">
          <div className="flex gap-1">
            {(["overview", "advisors", "team", "subscription"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-4 py-3 text-sm font-medium transition-colors capitalize relative"
                style={{ color: tab === t ? "#fff" : "rgba(255,255,255,0.4)" }}
              >
                {t}
                {tab === t && (
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
                    href="mailto:stewart.bailie@gmail.com"
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
    </OrgAuthGate>
  );
}
