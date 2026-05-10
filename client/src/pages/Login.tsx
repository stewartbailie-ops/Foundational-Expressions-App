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
    <main className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#0a0a0a" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {/* Brand logo replaces the generic lock chip — straight visual identity hit on the login.
              Uses the 192px source so retina mobile renders sharp; explicit width/height locks the
              aspect ratio so Lighthouse stops flagging "Displays images with incorrect aspect ratio". */}
          <img
            src="/logo/icon-192.png"
            alt="Advisory Connect"
            width={64}
            height={64}
            className="mx-auto h-16 w-16 mb-5"
            data-testid="img-login-logo"
          />
          <h1 className="text-2xl font-bold text-white tracking-tight">Advisory Connect</h1>
          <p className="text-white/50 text-sm mt-2">Control Panel — sign in to continue</p>
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
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] px-2 inline-flex items-center justify-center text-xs font-medium text-white/40 hover:text-white/70 transition-colors"
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

        <p className="flex items-center justify-center gap-3 text-xs text-white/40 mt-6">
          <a
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center min-h-[44px] px-2 underline hover:text-white/70 transition-colors"
            data-testid="link-privacy-policy-admin-login"
          >
            Privacy Policy
          </a>
          <span aria-hidden="true">·</span>
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center min-h-[44px] px-2 underline hover:text-white/70 transition-colors"
            data-testid="link-terms-admin-login"
          >
            Terms of Service
          </a>
        </p>
      </div>
    </main>
  );
}
