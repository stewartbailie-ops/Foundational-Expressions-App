import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Users, UserCog, Loader2, Calendar, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

type Org = {
  id: number;
  name: string;
  slug: string;
  seatLimit: number;
  adminCount: number;
  advisorCount: number;
  createdAt: string;
  // raw snake_case from DB
  seat_limit: number;
  admin_count: number;
  advisor_count: number;
  created_at: string;
};

const GLASS_BG = "rgba(255,255,255,0.05)";
const GLASS_BORDER = "rgba(255,255,255,0.10)";

function CreateOrgModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [orgName, setOrgName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [seatLimit, setSeatLimit] = useState("50");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
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
      const res = await fetch("/api/admin/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgName, slug, seatLimit: Number(seatLimit), adminName, adminEmail, adminPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to create organisation");
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

  const canSubmit = orgName && slug && seatLimit && adminName && adminEmail && adminPassword;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="w-full max-w-lg rounded-2xl p-6 space-y-5"
        style={{ backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.12)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Create Organisation</h2>
            <p className="text-white/40 text-sm mt-0.5">Sets up the org and its first admin login</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Org details */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Organisation</p>
            <input
              type="text"
              placeholder="Organisation name (e.g. InvestPro)"
              value={orgName}
              onChange={(e) => { setOrgName(e.target.value); if (!slugEdited) setSlug(suggestSlug(e.target.value)); }}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40 transition-colors"
            />
            <div>
              <input
                type="text"
                placeholder="URL slug (e.g. investpro)"
                value={slug}
                onChange={(e) => { setSlugEdited(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); }}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40 transition-colors"
              />
              {slug && <p className="text-white/30 text-xs mt-1 ml-1">Login: /org/login → dashboard shows "{slug}"</p>}
            </div>
            <input
              type="number"
              placeholder="Seat limit (number of advisors)"
              value={seatLimit}
              onChange={(e) => setSeatLimit(e.target.value)}
              min={1}
              max={10000}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40 transition-colors"
            />
          </div>

          {/* First admin */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">First Admin Login</p>
            <p className="text-white/30 text-xs -mt-1">This person will log in at /org/login with their own private credentials</p>
            <input
              type="text"
              placeholder="Admin full name (e.g. Andrew van der Merwe)"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40 transition-colors"
            />
            <input
              type="email"
              placeholder="Admin email address (private)"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40 transition-colors"
            />
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                placeholder="Temporary password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                minLength={6}
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
              disabled={loading || !canSubmit}
              className="flex-1 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Organisation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManageOrgs() {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: orgs = [], isLoading } = useQuery<Org[]>({
    queryKey: ["/api/admin/orgs"],
  });

  const deleteOrg = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/orgs/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete organisation");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/orgs"] }),
  });

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Organisations</h1>
          <p className="text-white/50 text-sm mt-1">
            {orgs.length} organisation{orgs.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all"
        >
          <Plus className="h-4 w-4" />
          Create Organisation
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-white/30" />
        </div>
      ) : orgs.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center space-y-3"
          style={{ backgroundColor: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}
        >
          <Building2 className="h-10 w-10 text-white/20 mx-auto" />
          <p className="text-white/40 text-sm">No organisations yet — create your first one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orgs.map((org, i) => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
              className="rounded-xl p-5 flex items-center gap-5"
              style={{ backgroundColor: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}
            >
              {/* Icon */}
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)" }}
              >
                <Building2 className="h-5 w-5 text-blue-400" />
              </div>

              {/* Name + slug */}
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm">{org.name}</div>
                <div className="text-white/40 text-xs mt-0.5">/{org.slug}</div>
              </div>

              {/* Stats */}
              <div className="hidden sm:flex items-center gap-6 text-center">
                <div>
                  <div className="flex items-center gap-1.5 text-white/50 text-xs mb-0.5">
                    <UserCog className="h-3 w-3" /> Admins
                  </div>
                  <div className="text-white font-semibold text-sm">{org.admin_count ?? 0}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-white/50 text-xs mb-0.5">
                    <Users className="h-3 w-3" /> Advisors
                  </div>
                  <div className="text-white font-semibold text-sm">
                    {org.advisor_count ?? 0}
                    <span className="text-white/30 font-normal"> / {org.seat_limit}</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-white/50 text-xs mb-0.5">
                    <Calendar className="h-3 w-3" /> Created
                  </div>
                  <div className="text-white font-semibold text-sm">
                    {org.created_at ? fmt(org.created_at) : "—"}
                  </div>
                </div>
              </div>

              {/* Seat bar */}
              <div className="hidden lg:block w-28">
                {(() => {
                  const pct = org.seat_limit > 0 ? Math.round(((org.advisor_count ?? 0) / org.seat_limit) * 100) : 0;
                  const color = pct >= 90 ? "#EF4444" : pct >= 70 ? "#F59E0B" : "#10B981";
                  return (
                    <div className="space-y-1">
                      <div className="text-white/30 text-xs text-right">{pct}% full</div>
                      <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Delete */}
              <button
                onClick={() => {
                  if (window.confirm(`Delete "${org.name}"? This will remove all org admins and unlink their advisors. This cannot be undone.`)) {
                    deleteOrg.mutate(org.id);
                  }
                }}
                disabled={deleteOrg.isPending}
                className="p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 transition-all flex-shrink-0"
                title="Delete organisation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateOrgModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/orgs"] })}
        />
      )}
    </div>
  );
}
