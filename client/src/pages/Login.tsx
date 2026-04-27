import { useState } from "react";
import { Loader2, Lock } from "lucide-react";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }

      onLogin();
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  const canSubmit = email.trim() !== "" && password !== "";

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#0a0a0a" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 border border-white/20 mb-5">
            <Lock className="h-7 w-7 text-white/70" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Control Panel</h1>
          <p className="text-white/50 text-sm mt-2">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            autoComplete="email"
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-colors"
            data-testid="input-admin-email"
          />

          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full px-4 py-3 pr-16 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-colors"
              data-testid="input-password"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-white/40 hover:text-white/70 transition-colors"
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>

          {error && (
            <p className="text-red-300 text-sm text-center" data-testid="text-login-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-1"
            data-testid="button-login"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-white/40 mt-6">
          <a
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/70 transition-colors"
            data-testid="link-privacy-policy-admin-login"
          >
            Privacy Policy
          </a>
          <span className="mx-1.5">·</span>
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/70 transition-colors"
            data-testid="link-terms-admin-login"
          >
            Terms of Service
          </a>
        </p>
      </div>
    </div>
  );
}
