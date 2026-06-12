import { useState } from "react";
import { Building2, User } from "lucide-react";
import { useLocation } from "wouter";

export default function LoginPortal() {
  const [slug, setSlug] = useState("");
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">

        {/* Logo */}
        <div className="text-center space-y-2">
          <img src="/logo/icon-192.png" alt="Advisory Connect" className="h-14 w-14 mx-auto" />
          <h1 className="text-xl font-bold text-white">Advisory Connect</h1>
          <p className="text-white/40 text-sm">Select how you'd like to sign in</p>
        </div>

        {/* Org admin card */}
        <a
          href="/org/login"
          className="flex items-center gap-4 p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20 transition-all group"
        >
          <div className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-500/15 border border-blue-500/25 group-hover:bg-blue-500/20 transition-colors">
            <Building2 className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">Organisation Admin</div>
            <div className="text-white/40 text-xs mt-0.5">Manage advisors, team members and your subscription</div>
          </div>
        </a>

        {/* Advisor panel */}
        <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-3">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-500/15 border border-emerald-500/25">
              <User className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-white font-semibold text-sm">Advisor Panel</div>
              <div className="text-white/40 text-xs mt-0.5">Access your profile, leads and tools</div>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Your profile URL (e.g. john-smith)"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && slug) navigate(`/advisor/${slug}`);
              }}
              className="flex-1 px-3 py-2.5 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/25 text-sm focus:outline-none focus:border-white/35 transition-colors"
            />
            <button
              onClick={() => { if (slug) navigate(`/advisor/${slug}`); }}
              disabled={!slug}
              className="px-4 py-2.5 rounded-xl bg-white text-black text-sm font-semibold disabled:opacity-30 hover:bg-white/90 transition-all"
            >
              Go
            </button>
          </div>
          {slug && (
            <p className="text-white/25 text-xs ml-1">advisoryconnect.pro/{slug}</p>
          )}
        </div>

        <p className="text-center text-white/20 text-xs">
          Advisory Connect &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
