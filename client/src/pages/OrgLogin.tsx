import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function OrgLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/org/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminEmail: email.trim(), password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }
      navigate("/org/dashboard");
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  const canSubmit = email.trim() !== "" && password !== "";

  return (
    <main className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#0a0a0a" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img
            src="/logo/icon-192.png"
            alt="Advisory Connect"
            width={64}
            height={64}
            className="mx-auto h-16 w-16 mb-5"
          />
          <h1 className="text-2xl font-bold text-white tracking-tight">Organisation Login</h1>
          <p className="text-white/50 text-sm mt-2">Sign in to your organisation dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Admin email address"
            autoComplete="email"
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-colors"
          />

          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full px-4 py-3 pr-16 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] px-2 inline-flex items-center justify-center text-xs font-medium text-white/40 hover:text-white/70 transition-colors"
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>

          {error && <p className="text-red-300 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-1"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-white/30 mt-6">
          <a href="/" className="hover:text-white/60 transition-colors">← Back to main login</a>
        </p>
      </div>
    </main>
  );
}
