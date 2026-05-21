import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePremium } from "@/hooks/use-premium";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, User, BarChart2, Inbox, ChevronDown, ChevronUp, Eye, Upload, X, Link as LinkIcon, Layers, Plus, Trash2, ExternalLink, Phone, MapPin, Clock, Mail, Copy, Check, Download, RefreshCw, ArrowLeft, ArrowRight, ArrowLeftRight, TrendingUp, Calculator, FileText, Camera, ArrowUp, ArrowDown, Globe, Rss, GripVertical, Settings, KeyRound, Palette, FileCheck, Save, Home, ChevronRight, CalendarDays, Heart, Building2, PenTool, LifeBuoy, AlertCircle, AlertTriangle, Users, Lock, Zap, Cake, Bell, MessageSquare, Briefcase, CreditCard, ShieldCheck, UserPlus, Share2, LineChart, Quote, PiggyBank, RotateCw } from "lucide-react";
import Cropper, { type Area as CropArea } from "react-easy-crop";
import { TradingViewSection, DailyQuoteSection, CompoundCalcSection, RetirementCalcSection, FinancialCalendarSection } from "./AdvisorProfile";
// Brand-mark and badge now live inside <BrandFooter />; importing here is no
// longer needed because the footer pulls assets from /public directly.
import { BrandFooter } from "@/components/BrandFooter";
import { TRADINGVIEW_SYMBOLS as TRADINGVIEW_SYMBOLS_PANEL, SA_FINANCIAL_EVENTS_2026, getCategoryColor } from "@/lib/financialCalendar";
// May 2026: needed so the "Interactive Tools" drop-down in InteractiveToolsTab
// can render the actual widgets as a live preview (was crashing because the
// JSX referenced these components without importing them).
import { RealMoneySqueeze, TaxBite, InflationMillion, CostOfWaiting, RealityCheck, LatteMillionaire } from "@/components/MoneyShowpieces";
import ColourPicker from "@/components/ColourPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { NewsHero } from "@/components/NewsHero";
import { ForexWidget } from "@/components/ForexWidget";
import { FunFactsCarousel } from "@/components/FunFactsCarousel";
import { getThemeColors, getInitialsBadgeColors, getThemeBackground, THEME_OPTIONS, BACKGROUND_STYLE_OPTIONS } from "@/lib/themeUtils";
import { shareOrDownloadCard, canShareCardNatively, type CardVariant } from "@/lib/businessCard";
import { useDuplicateLeadCheck, DuplicateLeadNotice } from "@/lib/useDuplicateLeadCheck";
import type { Advisor, Email, AdvisorProfile } from "@shared/schema";
import { TITLE_OPTIONS, BIO_OPTIONS, INDIVIDUAL_SERVICES, CORPORATE_SERVICES, DEFAULT_PROFILE_SECTION_ORDER, PROFILE_SECTION_LABELS, EMERGENCY_CONTACTS, PLATFORMS_META } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend } from "recharts";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

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

// Shared advisor avatar for auth screens
function AdvisorAvatar({ advisor, tc }: { advisor?: Advisor; tc: ReturnType<typeof getThemeColors> }) {
  return (
    <div className="text-center space-y-2">
      {advisor?.profilePicUrl ? (
        <img src={advisor.profilePicUrl} alt={advisor.name} className="w-20 h-20 rounded-full object-cover mx-auto border-2" style={{ borderColor: tc.initialsCircleBorder }} />
      ) : (
        <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: tc.initialsCircleBg, color: tc.accentColor }}>
          {advisor ? getInitials(advisor.name) : "?"}
        </div>
      )}
      <h1 className="text-xl font-bold" style={{ color: tc.textColor }}>{advisor?.name || "Control Panel"}</h1>
    </div>
  );
}

// ── SCREEN 1: Email + password login ─────────────────────────────────────────
function LoginScreen({ slug, onDone, onSetup }: { slug: string; onDone: () => void; onSetup: () => void }) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: advisor } = useQuery<Advisor>({ queryKey: [`/api/advisors/slug/${slug}`] });
  const tc = getThemeColors(advisor?.theme, advisor?.themeColor);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/advisor-auth/${slug}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needsSetup || data.needsVerification) { onSetup(); return; }
        throw new Error(data.message || "Incorrect email or password.");
      }
      onDone();
    } catch (err: any) {
      toast({ title: "Sign in failed", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: tc.bgColor }}>
      <div className="w-full max-w-sm space-y-6">
        <AdvisorAvatar advisor={advisor} tc={tc} />
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: tc.textColor }}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }}
                data-testid="input-login-email"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: tc.textColor }}>Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className="w-full px-3 py-2.5 pr-16 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }}
                  data-testid="input-login-password"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
                  style={{ color: tc.mutedText }}>
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
            style={{ backgroundColor: tc.buttonBg, color: tc.buttonText, opacity: (!email.trim() || !password) ? 0.6 : 1 }}
            data-testid="button-sign-in"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign In
          </button>
        </form>
        <p className="text-center text-sm" style={{ color: tc.mutedText }}>
          First time here?{" "}
          <button onClick={onSetup} className="font-semibold underline" style={{ color: tc.accentColor }} data-testid="button-go-setup">
            Set up your account
          </button>
        </p>
      </div>
    </div>
  );
}

// ── SCREEN 2: First-time account setup (email + create password) ──────────────
function SetupScreen({ slug, onVerificationSent, onBack }: { slug: string; onVerificationSent: () => void; onBack: () => void }) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: advisor } = useQuery<Advisor>({ queryKey: [`/api/advisors/slug/${slug}`] });
  const tc = getThemeColors(advisor?.theme, advisor?.themeColor);
  const rules = passwordRules(password);
  const allRulesMet = rules.length && rules.uppercase && rules.number && rules.special;
  const passwordsMatch = confirm.length > 0 && password === confirm;

  const RuleRow = ({ met, label }: { met: boolean; label: string }) => (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${met ? "bg-emerald-500 text-white" : "border-2"}`}
        style={!met ? { borderColor: tc.mutedText } : {}}>
        {met && <Check className="h-2.5 w-2.5" strokeWidth={3.5} />}
      </div>
      <span className="text-xs" style={{ color: met ? "#10b981" : tc.mutedText }}>{label}</span>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRulesMet || !passwordsMatch) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/advisor-auth/${slug}/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onVerificationSent();
    } catch (err: any) {
      toast({ title: "Setup failed", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const canSubmit = email.trim() && allRulesMet && passwordsMatch;

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: tc.bgColor }}>
      <div className="w-full max-w-sm space-y-6">
        <AdvisorAvatar advisor={advisor} tc={tc} />
        <div className="text-center">
          <p className="text-sm" style={{ color: tc.mutedText }}>Set up your account to access your control panel.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: tc.textColor }}>Registered Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }}
                data-testid="input-setup-email"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: tc.textColor }}>Create Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 10 characters"
                  autoComplete="new-password"
                  className="w-full px-3 py-2.5 pr-16 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }}
                  data-testid="input-setup-password"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
                  style={{ color: tc.mutedText }}>
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            {password.length > 0 && (
              <div className="rounded-lg p-3 space-y-1.5" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}` }}>
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
                  autoComplete="new-password"
                  className="w-full px-3 py-2.5 pr-16 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: tc.inputBg,
                    border: `1px solid ${confirm.length > 0 ? (passwordsMatch ? "#10b981" : "#ef4444") : tc.inputBorder}`,
                    color: tc.textColor
                  }}
                  data-testid="input-setup-confirm"
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
                  style={{ color: tc.mutedText }}>
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>
              {confirm.length > 0 && (
                <p className="text-xs flex items-center gap-1.5" style={{ color: passwordsMatch ? "#10b981" : "#ef4444" }}>
                  {passwordsMatch ? <Check className="h-3 w-3" strokeWidth={3} /> : <X className="h-3 w-3" strokeWidth={3} />}
                  {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                </p>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-opacity"
            style={{ backgroundColor: tc.buttonBg, color: tc.buttonText, opacity: !canSubmit ? 0.5 : 1 }}
            data-testid="button-setup-submit"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Account & Verify Email
          </button>
        </form>
        <p className="text-center text-sm" style={{ color: tc.mutedText }}>
          Already have an account?{" "}
          <button onClick={onBack} className="font-semibold underline" style={{ color: tc.accentColor }} data-testid="button-back-to-login">
            Sign in
          </button>
        </p>
        <p className="text-center text-xs pt-2" style={{ color: tc.mutedText, opacity: 0.85 }}>
          By creating an account, you agree to our{" "}
          <a
            href="/legal/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80"
            style={{ color: tc.accentColor }}
            data-testid="link-setup-privacy"
          >
            Privacy Policy
          </a>
          {" "}and{" "}
          <a
            href="/legal/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80"
            style={{ color: tc.accentColor }}
            data-testid="link-setup-terms"
          >
            Terms of Service
          </a>
          .
        </p>
      </div>
    </div>
  );
}

// ── SCREEN 3: One-time email verification ─────────────────────────────────────
function VerifyScreen({ slug, onDone, onBack }: { slug: string; onDone: () => void; onBack: () => void }) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const { data: advisor } = useQuery<Advisor>({ queryKey: [`/api/advisors/slug/${slug}`] });
  const tc = getThemeColors(advisor?.theme, advisor?.themeColor);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleVerify = async (codeVal?: string) => {
    const c = codeVal ?? code;
    if (c.length !== 6) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/advisor-auth/${slug}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: c }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid code");
      toast({ title: "Email verified!", description: "Welcome to your control panel." });
      onDone();
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
      setCode("");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch(`/api/advisor-auth/${slug}/resend-otp`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: "Code resent", description: "Check your inbox." });
      setCountdown(60);
      setCode("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setResending(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: tc.bgColor }}>
      <div className="w-full max-w-sm space-y-6">
        <AdvisorAvatar advisor={advisor} tc={tc} />
        <div className="text-center space-y-1">
          <p className="text-sm font-medium" style={{ color: tc.textColor }}>Check your inbox</p>
          <p className="text-sm" style={{ color: tc.mutedText }}>
            We sent a 6-digit verification code to your registered email. Enter it below — this is a one-time step.
          </p>
        </div>
        <div className="rounded-xl p-5 space-y-5" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={v => { setCode(v); if (v.length === 6) handleVerify(v); }} data-testid="input-verify-code">
              <InputOTPGroup>
                {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <button
            onClick={() => handleVerify()}
            disabled={code.length !== 6 || loading}
            className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
            style={{ backgroundColor: tc.buttonBg, color: tc.buttonText, opacity: code.length !== 6 ? 0.5 : 1 }}
            data-testid="button-verify-code"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Verify & Enter Panel
          </button>
        </div>
        <div className="text-center space-y-3">
          {countdown > 0 ? (
            <p className="text-sm" style={{ color: tc.mutedText }}>Resend code in {countdown}s</p>
          ) : (
            <button onClick={handleResend} disabled={resending}
              className="text-sm font-medium underline" style={{ color: tc.accentColor }}
              data-testid="button-resend-verify">
              {resending ? "Sending..." : "Resend code"}
            </button>
          )}
          <div>
            <button onClick={onBack} className="text-sm inline-flex items-center gap-1.5" style={{ color: tc.mutedText }} data-testid="button-verify-back">
              <ArrowLeft className="h-3.5 w-3.5" />
              Go back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const HOME_TYPE_COLORS: Record<string, string> = {
  "Referral":     "#7c3aed",
  "Call Back":    "#0369a1",
  "Will Request": "#b45309",
};
const HOME_GRADE_COLORS: Record<string, string> = {
  "Gold":        "#F59E0B",
  "Silver":      "#94A3B8",
  "Bronze":      "#CD7F32",
  "Development": "#8B5CF6",
};
const HOME_GRADE_ORDER = ["Gold", "Silver", "Bronze", "Development"];

function EmergencyContactsCard({ tc }: { tc: ReturnType<typeof getThemeColors> }) {
  const [open, setOpen] = useState(false);
  return (
    <div data-testid="card-emergency-contacts">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#dc2626", color: "#fff" }}
        aria-expanded={open}
        data-testid="button-emergency-contacts-toggle"
      >
        <AlertCircle className="h-4 w-4" /> Emergency Contacts
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div
          className="mt-2 rounded-xl p-2 space-y-1.5"
          style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}
        >
          <p className="text-[11px] px-1 pt-1 pb-0.5" style={{ color: tc.mutedText }}>
            Tap a service to dial directly from your phone.
          </p>
          {EMERGENCY_CONTACTS.map(c => (
            <a
              key={c.key}
              href={`tel:${c.number}`}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-opacity hover:opacity-90 active:opacity-75"
              style={{ backgroundColor: "rgba(220,38,38,0.10)", border: "1px solid rgba(220,38,38,0.35)" }}
              data-testid={`button-panel-call-${c.key}`}
            >
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#dc2626" }}
              >
                <Phone className="h-4 w-4" style={{ color: "#fff" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold leading-tight truncate" style={{ color: tc.textColor }}>{c.label}</div>
                <div className="text-[11px] mt-0.5" style={{ color: tc.mutedText }}>{c.number}</div>
              </div>
              <span className="text-[11px] font-semibold px-2 py-1 rounded-md flex-shrink-0" style={{ backgroundColor: "#dc2626", color: "#fff" }}>Call</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// M5(b) → May 2026 partner-feedback rebuild: each of the 6 interactive
// showpieces is now its own collapsible drop-down card sitting under the
// master Interactive Tools accordion (matching the public profile contact
// card layout where each tool has its own header). Order is persisted to
// localStorage under INTERACTIVE_ORDER_KEY so each advisor's preferred
// arrangement survives reloads — no schema change. Public profile render
// order is unchanged (driven by AdvisorProfile.tsx); this affects panel
// display only.
const INTERACTIVE_ORDER_KEY = "advisorInteractiveOrder_v1";
const DEFAULT_INTERACTIVE_ORDER: Array<InteractiveToolKey> = [
  "showShowpieceSqueeze",
  "showShowpieceTaxBite",
  "showShowpieceInflation",
  "showShowpieceWaiting",
  "showToolReality",
  "showToolLatte",
];
type InteractiveToolKey =
  | "showShowpieceSqueeze"
  | "showShowpieceTaxBite"
  | "showShowpieceInflation"
  | "showShowpieceWaiting"
  | "showToolReality"
  | "showToolLatte";
type InteractiveVals = Record<InteractiveToolKey, boolean> & { showInteractive: boolean };

function InteractiveToolsTab({ advisor, tc }: { advisor: Advisor; tc: ReturnType<typeof getThemeColors> }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [vals, setVals] = useState<InteractiveVals>({
    showShowpieceSqueeze: (advisor as any).showShowpieceSqueeze !== false,
    showShowpieceTaxBite: (advisor as any).showShowpieceTaxBite !== false,
    showShowpieceInflation: (advisor as any).showShowpieceInflation !== false,
    showShowpieceWaiting: (advisor as any).showShowpieceWaiting !== false,
    showToolReality: (advisor as any).showToolReality !== false,
    showToolLatte: (advisor as any).showToolLatte !== false,
    showInteractive: (advisor as any).showInteractive !== false,
  });
  const [expandedKey, setExpandedKey] = useState<keyof InteractiveVals | null>(null);
  const [order, setOrder] = useState<Array<InteractiveToolKey>>(() => {
    if (typeof window === "undefined") return [...DEFAULT_INTERACTIVE_ORDER];
    try {
      const raw = window.localStorage.getItem(INTERACTIVE_ORDER_KEY);
      if (!raw) return [...DEFAULT_INTERACTIVE_ORDER];
      const allowed = new Set<string>(DEFAULT_INTERACTIVE_ORDER);
      const parsed = JSON.parse(raw) as string[];
      const filtered = parsed.filter(k => allowed.has(k)) as Array<InteractiveToolKey>;
      // Append any keys that weren't in storage (forward-compat if a new tool is added).
      for (const k of DEFAULT_INTERACTIVE_ORDER) if (!filtered.includes(k)) filtered.push(k);
      return filtered.length ? filtered : [...DEFAULT_INTERACTIVE_ORDER];
    } catch {
      return [...DEFAULT_INTERACTIVE_ORDER];
    }
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem(INTERACTIVE_ORDER_KEY, JSON.stringify(order)); } catch {}
  }, [order]);

  const flip = (k: keyof InteractiveVals) => setVals(v => ({ ...v, [k]: !v[k] }));
  const moveUp = (idx: number) => {
    if (idx <= 0) return;
    setOrder(prev => { const a = [...prev]; [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]]; return a; });
  };
  const moveDown = (idx: number) => {
    setOrder(prev => {
      if (idx >= prev.length - 1) return prev;
      const a = [...prev]; [a[idx + 1], a[idx]] = [a[idx], a[idx + 1]]; return a;
    });
  };
  const save = async () => {
    setSaving(true);
    try {
      await apiRequest("PATCH", `/api/advisors/${advisor.id}`, vals);
      queryClient.invalidateQueries();
      toast({ title: "Saved", description: "Interactive tool visibility updated." });
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message || "Please try again.", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const meta: Record<InteractiveToolKey, { label: string; tagline: string; desc: string }> = {
    showShowpieceSqueeze:   { label: "The Real-Money Squeeze",    tagline: "What inflation does to your salary over time", desc: "Shows how a salary's buying power erodes over a 20-year horizon at the chosen inflation rate. Includes monthly salary, years out, assumed inflation and a real-value preview." },
    showShowpieceTaxBite:   { label: "The Tax Bite",              tagline: "What SARS takes vs what you take home",        desc: "Splits a monthly salary into take-home vs SARS based on the SA brackets at a given age. Bar chart + take-home/SARS-gets cards." },
    showShowpieceInflation: { label: "Inflation Eats Your Million", tagline: "What a lump sum is really worth in the future", desc: "Erodes a lump sum (e.g. R1m) year-by-year at a chosen inflation rate to show real value vs buying power lost." },
    showShowpieceWaiting:   { label: "The Cost of Waiting",       tagline: "Why starting sooner changes everything",        desc: "Compares retirement nest eggs from starting at 25 vs 35 vs 45 with the same monthly investment — visualises the compounding cost of delay." },
    showToolReality:        { label: "30-Year Reality Check",     tagline: "A quick reality check on your retirement nest egg", desc: "Models salary, savings rate and years to retirement against an SA long-run average to highlight any shortfall vs target." },
    showToolLatte:          { label: "The Latte Millionaire",     tagline: "The everyday spends that really cost you",      desc: "Toggle daily spends (coffee, takeaways, streaming, etc.) and see what they would compound to if invested instead." },
  };

  // Disabled style helpers — when master switch is off, individual toggles become non-actionable.
  const masterOff = !vals.showInteractive;

  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: tc.mutedText }}>
        Master switch shows the whole "Interactive Financial Tools" section on your public profile. Each tool below has its own drop-down — tap a card to read what it does, use the arrows to reorder the list, and the toggle to show or hide it.
      </p>

      {/* Master switch — sits above all individual cards. */}
      <div className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.borderColor}` }}>
        <div>
          <div className="text-sm font-semibold" style={{ color: tc.textColor }}>Master switch</div>
          <div className="text-[11px]" style={{ color: tc.mutedText }}>Show the Interactive Tools section on profile</div>
        </div>
        <div onClick={() => flip("showInteractive")} className="w-10 h-5 rounded-full relative cursor-pointer flex-shrink-0" style={{ backgroundColor: vals.showInteractive ? tc.checkActive : tc.checkInactive }} data-testid="toggle-master-interactive">
          <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all" style={{ left: vals.showInteractive ? "22px" : "2px", backgroundColor: vals.showInteractive ? tc.checkDotActive : tc.checkDotInactive }} />
        </div>
      </div>

      {/* Individual tool cards — each its own collapsible drop-down with reorder arrows. */}
      <div className="space-y-2" style={{ opacity: masterOff ? 0.55 : 1 }}>
        {order.map((key, idx) => {
          const m = meta[key];
          const isOpen = expandedKey === key;
          const enabled = vals[key];
          return (
            <div key={key} className="rounded-xl overflow-hidden" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }} data-testid={`card-interactive-${key}`}>
              {/* Header row — always visible. Click anywhere except the arrows/toggle to expand. */}
              <div className="flex items-center gap-2 p-3">
                <button
                  type="button"
                  onClick={() => setExpandedKey(isOpen ? null : key)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  aria-expanded={isOpen}
                  data-testid={`toggle-interactive-open-${key}`}
                >
                  {isOpen
                    ? <ChevronUp className="h-4 w-4 flex-shrink-0" style={{ color: tc.mutedText }} />
                    : <ChevronDown className="h-4 w-4 flex-shrink-0" style={{ color: tc.mutedText }} />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: tc.textColor }}>{m.label}</div>
                    <div className="text-[11px] truncate" style={{ color: tc.mutedText }}>{m.tagline}</div>
                  </div>
                </button>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button type="button" onClick={() => moveUp(idx)} disabled={idx === 0} className="p-1 rounded hover:opacity-70 disabled:opacity-25 transition-opacity" style={{ color: tc.accentColor }} data-testid={`button-interactive-up-${key}`} aria-label={`Move ${m.label} up`}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => moveDown(idx)} disabled={idx === order.length - 1} className="p-1 rounded hover:opacity-70 disabled:opacity-25 transition-opacity" style={{ color: tc.accentColor }} data-testid={`button-interactive-down-${key}`} aria-label={`Move ${m.label} down`}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <div onClick={() => flip(key)} className="w-9 h-5 rounded-full relative cursor-pointer ml-1" style={{ backgroundColor: enabled ? tc.checkActive : tc.checkInactive }} data-testid={`toggle-interactive-${key}`}>
                    <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all" style={{ left: enabled ? "18px" : "2px", backgroundColor: enabled ? tc.checkDotActive : tc.checkDotInactive }} />
                  </div>
                </div>
              </div>
              {/* Expanded body — May 2026: render the ACTUAL interactive widget
                  (sliders, toggles, output panels) so the advisor can preview
                  exactly what the public sees, not just a static description.
                  Description sits above the live widget for context. */}
              {isOpen && (
                <div className="px-3 pb-3 pt-1 space-y-2" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
                  <p className="text-xs leading-relaxed" style={{ color: tc.mutedText }}>{m.desc}</p>
                  <div className="pt-1">
                    {key === "showShowpieceSqueeze"   && <RealMoneySqueeze   accentColor={tc.accentColor} borderColor={tc.borderColor} cardBg={tc.cardBg} textColor={tc.textColor} mutedText={tc.mutedText} />}
                    {key === "showShowpieceTaxBite"   && <TaxBite            accentColor={tc.accentColor} borderColor={tc.borderColor} cardBg={tc.cardBg} textColor={tc.textColor} mutedText={tc.mutedText} />}
                    {key === "showShowpieceInflation" && <InflationMillion   accentColor={tc.accentColor} borderColor={tc.borderColor} cardBg={tc.cardBg} textColor={tc.textColor} mutedText={tc.mutedText} />}
                    {key === "showShowpieceWaiting"   && <CostOfWaiting      accentColor={tc.accentColor} borderColor={tc.borderColor} cardBg={tc.cardBg} textColor={tc.textColor} mutedText={tc.mutedText} />}
                    {key === "showToolReality"        && <RealityCheck       accentColor={tc.accentColor} borderColor={tc.borderColor} cardBg={tc.cardBg} textColor={tc.textColor} mutedText={tc.mutedText} />}
                    {key === "showToolLatte"          && <LatteMillionaire   accentColor={tc.accentColor} borderColor={tc.borderColor} cardBg={tc.cardBg} textColor={tc.textColor} mutedText={tc.mutedText} inputBg={tc.inputBg} />}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reset order — only shows when the user has reordered the list. */}
      {order.some((k, i) => k !== DEFAULT_INTERACTIVE_ORDER[i]) && (
        <button
          type="button"
          onClick={() => setOrder([...DEFAULT_INTERACTIVE_ORDER])}
          className="w-full text-[11px] py-1.5 rounded-md font-medium"
          style={{ color: tc.mutedText, border: `1px solid ${tc.borderColor}` }}
          data-testid="button-interactive-reset-order"
        >
          Reset to default order
        </button>
      )}

      <button onClick={save} disabled={saving}
        className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
        style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}
        data-testid="button-save-interactive">
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Save Changes
      </button>
    </div>
  );
}

function HomeTab({ advisor, tc }: { advisor: Advisor; tc: ReturnType<typeof getThemeColors> }) {
  // M5(b): added "interactive" — 4th accordion card on the home tab exposing the
  // 6 interactive showpiece toggles (Squeeze / Tax Bite / Inflation / Waiting /
  // Reality / Latte) so the advisor can flip them without opening Profiles.
  const [expanded, setExpanded] = useState<"profiles" | "toolbox" | "platforms" | "interactive" | null>(null);

  const { data: advisorStats } = useQuery<{
    totalLeads: number; totalReferrals: number; totalCallbacks: number; totalWillRequests: number;
    weeklyActivity: { name: string; leads: number }[];
    gradeBreakdown: { grade: string; count: number }[];
    profileBreakdown: { slug: string; label: string; count: number }[];
    overdueCount: number;
  }>({ queryKey: [`/api/advisors/${advisor.profileSlug}/stats`] });

  const { data: allLeads = [] } = useQuery<Email[]>({
    queryKey: [`/api/advisors/${advisor.profileSlug}/emails`],
  });

  // Profile count for header badge — uses same queryKey as ProfilesTab so React Query dedupes
  const { data: additionalProfiles = [] } = useQuery<AdvisorProfile[]>({
    queryKey: [`/api/advisors/${advisor.id}/profiles`],
  });
  const profileCount = 1 + additionalProfiles.length;

  // F7: pull 7-day Primary/Secondary view series so the headline Lead Activity
  // chart can overlay it as two extra lines (green = Primary, blue = Secondary).
  const { data: viewSeriesData } = useQuery<{ series: { name: string; primary: number; secondary: number }[] }>({
    queryKey: [`/api/advisors/${advisor.profileSlug}/views-series`],
  });
  // Merge views into the leads weekly activity by day-of-week label so a single
  // dataset feeds the chart. Falls back to 0 if either side is missing a day.
  const mergedWeekly = (() => {
    const leads = advisorStats?.weeklyActivity ?? [];
    const views = viewSeriesData?.series ?? [];
    if (leads.length === 0 && views.length === 0) return [];
    const base = leads.length >= views.length ? leads : views.map(v => ({ name: v.name, leads: 0 }));
    return base.map(row => {
      const v = views.find(x => x.name === row.name);
      return { name: row.name, leads: (row as any).leads ?? 0, primary: v?.primary ?? 0, secondary: v?.secondary ?? 0 };
    });
  })();
  const totalViewsWeek = mergedWeekly.reduce((s, d) => s + (d.primary || 0) + (d.secondary || 0), 0);

  const firstName = advisor.name.split(" ")[0];
  const totalLeads = allLeads.length;

  const typeBreakdown = Object.entries(
    allLeads.reduce((acc: Record<string, number>, l) => { acc[l.type] = (acc[l.type] || 0) + 1; return acc; }, {})
  ).map(([type, count]) => ({ type, count }));

  const gradeBreakdown = Object.entries(
    allLeads.reduce((acc: Record<string, number>, l) => { const g = l.grade || "Silver"; acc[g] = (acc[g] || 0) + 1; return acc; }, {})
  )
    .map(([grade, count]) => ({ grade, count }))
    .sort((a, b) => HOME_GRADE_ORDER.indexOf(a.grade) - HOME_GRADE_ORDER.indexOf(b.grade));

  const sections = [
    { key: "profiles" as const,    label: "Profiles",         desc: "Edit your contact card & additional profiles", icon: Layers,     accent: "#3B82F6" },
    { key: "toolbox" as const,     label: "Toolbox",          desc: "Calculators, calendars & quick tools",         icon: Calculator, accent: "#10B981" },
    { key: "platforms" as const,   label: "Platforms",        desc: "Manage your provider platform links",          icon: Globe,      accent: "#8B5CF6" },
    { key: "interactive" as const, label: "Interactive Tools", desc: "Showpieces — Squeeze, Tax Bite, Inflation, Waiting, Reality, Latte", icon: Zap, accent: "#F59E0B" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold" style={{ color: tc.textColor }}>Welcome back, {firstName}</h2>
        <p className="text-xs mt-0.5" style={{ color: tc.mutedText }}>Tap a section to expand it.</p>
      </div>

      {/* Section drop-downs */}
      <div className="space-y-2.5">
        {sections.map(s => {
          const Icon = s.icon;
          const isOpen = expanded === s.key;
          return (
            <div key={s.key} className="rounded-xl overflow-hidden" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
              <button
                onClick={() => setExpanded(isOpen ? null : s.key)}
                className="w-full flex items-center gap-3 p-4 transition-all hover:opacity-90 text-left"
                data-testid={`button-home-${s.key}`}
              >
                <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${s.accent}18`, border: `1px solid ${s.accent}35` }}>
                  <Icon className="h-5 w-5" style={{ color: s.accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold" style={{ color: tc.textColor }}>{s.label}</div>
                    {s.key === "profiles" && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap"
                        style={{ backgroundColor: `${s.accent}22`, color: s.accent, border: `1px solid ${s.accent}55` }}
                        data-testid="badge-profile-count"
                      >
                        {profileCount} / 2
                      </span>
                    )}
                  </div>
                  <div className="text-xs truncate" style={{ color: tc.mutedText }}>{s.desc}</div>
                </div>
                <ChevronDown
                  className="h-4 w-4 shrink-0 transition-transform duration-200"
                  style={{ color: tc.mutedText, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>
              {isOpen && (
                <div className="p-4 pt-2" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
                  {s.key === "profiles" && <ProfilesTab advisor={advisor} tc={tc} />}
                  {s.key === "toolbox" && <ToolboxTab advisor={advisor} tc={tc} />}
                  {s.key === "platforms" && <PlatformsTab tc={tc} />}
                  {s.key === "interactive" && <InteractiveToolsTab advisor={advisor} tc={tc} />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Live News (mirrors the public contact card) ── */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center gap-2">
          <Rss className="h-3.5 w-3.5" style={{ color: tc.mutedText }} />
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: tc.mutedText }}>Live Market News</div>
        </div>
        <NewsHero accentColor={tc.accentColor} borderColor={tc.borderColor} cardBg={tc.cardBg} height={170} />
      </div>

      {/* ── Optional content widgets — only render in the panel when the advisor has
            the matching public-card toggle ON, so what they see here is exactly what
            the client sees. Order mirrors the public contact card:
            secondary news → forex → fun facts (W2.1 / W2.2 / W2.3). ── */}
      {(advisor as any).showSecondNews && (
        <div className="space-y-2 pt-1" data-testid="panel-preview-secondnews">
          <div className="flex items-center gap-2">
            <Rss className="h-3.5 w-3.5" style={{ color: tc.mutedText }} />
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: tc.mutedText }}>More Finance News</div>
          </div>
          <NewsHero
            accentColor={tc.accentColor}
            borderColor={tc.borderColor}
            cardBg={tc.cardBg}
            height={170}
            category={"secondary" as any}
            labelOverride="More Finance News · Live"
            testIdSuffix="secondary"
          />
        </div>
      )}
      {(advisor as any).showForex && (
        <div className="space-y-2 pt-1" data-testid="panel-preview-forex">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5" style={{ color: tc.mutedText }} />
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: tc.mutedText }}>Live Exchange Rates</div>
          </div>
          <ForexWidget
            accentColor={tc.accentColor}
            borderColor={tc.borderColor}
            cardBg={tc.cardBg}
            textColor={tc.textColor}
            mutedText={tc.mutedText}
          />
        </div>
      )}
      {(advisor as any).showFunFacts && (
        <div className="space-y-2 pt-1" data-testid="panel-preview-funfacts">
          <div className="flex items-center gap-2">
            <Heart className="h-3.5 w-3.5" style={{ color: tc.mutedText }} />
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: tc.mutedText }}>Financial Facts of the Day</div>
          </div>
          <FunFactsCarousel
            accentColor={tc.accentColor}
            borderColor={tc.borderColor}
            cardBg={tc.cardBg}
            textColor={tc.textColor}
            mutedText={tc.mutedText}
            advisorName={advisor.name}
          />
        </div>
      )}

      {/* ── Today snapshot — placeholder mini-widgets for the My Clients build.
          UI-only for now; once the clients table lands these will pull live data
          (birthdays today, scheduled client re-views). Two-tile layout — wider
          tiles, smaller value, no truncation on labels. ── */}
      <div className="space-y-2 pt-1">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: tc.mutedText }}>Today</div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "birthdays",  label: "Client Birthdays Today", value: "0", hint: "No clients yet",     icon: Cake, accent: "#ec4899" },
            { key: "reviews",    label: "Client Re-views Today",  value: "0", hint: "Nothing scheduled",  icon: Bell, accent: "#f59e0b" },
          ].map(({ key, label, value, hint, icon: Icon, accent }) => (
            <div
              key={key}
              className="rounded-xl p-3 flex items-center gap-2.5"
              style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}
              data-testid={`widget-home-${key}`}
            >
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: accent + "1f", color: accent }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold leading-tight" style={{ color: tc.textColor }}>{label}</div>
                <div className="text-[10px] mt-0.5" style={{ color: tc.mutedText }}>{hint}</div>
              </div>
              <div className="text-base font-bold shrink-0" style={{ color: accent }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── My Stats ── */}
      <div className="space-y-3 pt-1">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: tc.mutedText }}>My Stats</div>

        {/* Quick stat tiles — 2x2 on mobile, 4-across on tablet+ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Total Leads",   value: advisorStats?.totalLeads        ?? 0, accent: "#3B82F6" },
            { label: "Referrals",     value: advisorStats?.totalReferrals    ?? 0, accent: "#7c3aed" },
            { label: "Callbacks",     value: advisorStats?.totalCallbacks    ?? 0, accent: "#0369a1" },
            { label: "Will Requests", value: advisorStats?.totalWillRequests ?? 0, accent: "#0d9488" },
          ].map(({ label, value, accent }) => (
            <div key={label} className="rounded-xl p-3 text-center" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
              <div className="text-xl font-bold" style={{ color: accent }}>{value}</div>
              <div className="text-[10px] mt-0.5" style={{ color: tc.mutedText }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Inbox Health — only surfaced when there are overdue follow-ups so it
            stays an "action signal" rather than a vanity stat. */}
        {(advisorStats?.overdueCount ?? 0) > 0 && (
          <div
            className="rounded-xl p-3 flex items-center gap-2.5"
            style={{ backgroundColor: "#f59e0b14", border: "1px solid #f59e0b50" }}
            data-testid="alert-overdue-followups"
          >
            <AlertCircle className="h-4 w-4 shrink-0" style={{ color: "#f59e0b" }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold" style={{ color: tc.textColor }}>
                {advisorStats!.overdueCount} {advisorStats!.overdueCount === 1 ? "lead" : "leads"} waiting &gt; 7 days
              </div>
              <div className="text-[10px]" style={{ color: tc.mutedText }}>
                Still flagged "Need to Contact" in your inbox.
              </div>
            </div>
          </div>
        )}

        {/* Weekly activity area chart — F7: now overlays Primary (green) and
            Secondary (blue) profile-view lines on top of the original Leads area
            so the headline chart shows lead momentum + view momentum side-by-side. */}
        <div className="rounded-xl p-4" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold" style={{ color: tc.textColor }}>Lead Activity – Last 7 Days</div>
            <div className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${tc.accentColor}20`, color: tc.accentColor }}>
              {(advisorStats?.weeklyActivity ?? []).reduce((sum, d) => sum + (d.leads || 0), 0)} this week
            </div>
          </div>
          {/* Mini legend dots so users can read which line is which without hovering. */}
          <div className="flex items-center gap-3 mb-2 text-[10px]" style={{ color: tc.mutedText }}>
            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: tc.accentColor }} />Leads</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#22c55e" }} />Primary views</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#3b82f6" }} />Secondary views</span>
            {totalViewsWeek > 0 && (
              <span className="ml-auto" data-testid="text-views-week-total">{totalViewsWeek} views this week</span>
            )}
          </div>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mergedWeekly} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="homeLeadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"  stopColor={tc.accentColor} stopOpacity={0.55} />
                    <stop offset="60%" stopColor={tc.accentColor} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={tc.accentColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={tc.borderColor} />
                <XAxis dataKey="name" tick={{ fill: tc.mutedText, fontSize: 10 }} tickLine={false} axisLine={false} dy={6} />
                <YAxis tick={{ fill: tc.mutedText, fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
                <Tooltip
                  cursor={{ stroke: tc.accentColor, strokeWidth: 1, strokeDasharray: "3 3" }}
                  contentStyle={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}`, color: tc.textColor, borderRadius: 8, fontSize: 12 }}
                />
                <Area
                  type="natural"
                  dataKey="leads"
                  name="Leads"
                  stroke={tc.accentColor}
                  strokeWidth={2.5}
                  fill="url(#homeLeadGrad)"
                  dot={{ r: 3, fill: tc.cardBg, stroke: tc.accentColor, strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: tc.accentColor, stroke: tc.cardBg, strokeWidth: 2 }}
                  isAnimationActive
                  animationDuration={800}
                />
                {/* Primary views — green line, no fill so it sits cleanly over the leads area. */}
                <Area
                  type="natural"
                  dataKey="primary"
                  name="Primary views"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="none"
                  dot={{ r: 2.5, fill: tc.cardBg, stroke: "#22c55e", strokeWidth: 2 }}
                  activeDot={{ r: 4 }}
                  isAnimationActive
                  animationDuration={800}
                />
                {/* Secondary views — blue line, same treatment. */}
                <Area
                  type="natural"
                  dataKey="secondary"
                  name="Secondary views"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="none"
                  dot={{ r: 2.5, fill: tc.cardBg, stroke: "#3b82f6", strokeWidth: 2 }}
                  activeDot={{ r: 4 }}
                  isAnimationActive
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profile Attribution — only shown when there's at least one secondary profile,
            otherwise the breakdown is meaningless (everything came from the primary).
            Sorted by count desc on the server. */}
        {(advisorStats?.profileBreakdown?.length ?? 0) > 1 && (
          <div className="rounded-xl p-4" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }} data-testid="card-profile-attribution">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-3.5 w-3.5" style={{ color: tc.mutedText }} />
              <div className="text-xs font-semibold" style={{ color: tc.textColor }}>Where Leads Came From</div>
            </div>
            <div className="space-y-2.5">
              {advisorStats!.profileBreakdown.map((p, idx) => {
                const max = Math.max(1, ...advisorStats!.profileBreakdown.map(x => x.count));
                const pct = Math.round((p.count / max) * 100);
                const color = idx === 0 ? tc.accentColor : "#8B5CF6";
                return (
                  <div key={p.slug} data-testid={`row-attribution-${p.slug}`}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-medium truncate" style={{ color: tc.textColor }}>{p.label}</span>
                      <span className="font-bold shrink-0 ml-2" style={{ color }}>{p.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ backgroundColor: `${color}20` }}>
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lead types + Grade breakdown side by side */}
        {totalLeads > 0 && (
          <div className="grid grid-cols-2 gap-2.5">

            {/* Type donut */}
            <div className="rounded-xl p-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
              <div className="text-xs font-semibold mb-2" style={{ color: tc.textColor }}>Lead Types</div>
              <div className="h-[90px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={typeBreakdown} cx="50%" cy="50%" innerRadius={24} outerRadius={38} paddingAngle={3} dataKey="count" nameKey="type" strokeWidth={0}>
                      {typeBreakdown.map(e => (
                        <Cell key={e.type} fill={HOME_TYPE_COLORS[e.type] ?? "#6B7280"} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}`, color: tc.textColor, borderRadius: 8, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 mt-1">
                {typeBreakdown.map(e => (
                  <div key={e.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px]" style={{ color: tc.mutedText }}>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: HOME_TYPE_COLORS[e.type] ?? "#6B7280" }} />
                      {e.type}
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: tc.textColor }}>{e.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Grade breakdown */}
            <div className="rounded-xl p-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
              <div className="text-xs font-semibold mb-2" style={{ color: tc.textColor }}>By Grade</div>
              <div className="space-y-2.5">
                {gradeBreakdown.map(e => {
                  const pct = totalLeads > 0 ? Math.round((e.count / totalLeads) * 100) : 0;
                  const color = HOME_GRADE_COLORS[e.grade] ?? "#6B7280";
                  return (
                    <div key={e.grade}>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="font-medium" style={{ color }}>{e.grade}</span>
                        <span className="font-bold" style={{ color: tc.textColor }}>{e.count}</span>
                      </div>
                      <div className="h-1 rounded-full" style={{ backgroundColor: `${color}25` }}>
                        <div className="h-1 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── Emergency Contacts (always available to advisors) ── */}
      <div className="pt-4">
        <EmergencyContactsCard tc={tc} />
      </div>

      {/* F4 — unified BrandFooter. forceStack=true because the panel container
          is narrower than viewport breakpoints can detect; without this the
          centered "Powered by Advisory Connect" text overlaps the pills. */}
      <div className="pt-6 pb-2">
        <BrandFooter
          forceStack
          theme={{
            cardBg: tc.cardBg,
            borderColor: tc.borderColor,
            textColor: tc.textColor,
            mutedText: tc.mutedText,
            accentColor: tc.accentColor,
            buttonSecondaryBg: tc.buttonSecondaryBg,
          }}
        />
      </div>
    </div>
  );
}

function CIVTab({ slug, advisor, tc }: { slug: string; advisor: Advisor; tc: ReturnType<typeof getThemeColors> }) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<"active" | "archived">("active");
  const toggleExpanded = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const [typeFilter, setTypeFilter] = useState("all");
  // Unread-only quick filter (W3.7) — one-click toggle to surface just the leads
  // that still have the new-lead glow on them (no lastViewedAt yet).
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [search, setSearch] = useState("");
  type SortKey = "date" | "name" | "grade" | "status" | "temperature";
  // Temperature sort rank — Hot first, then Warm, then Cold, then leads with
  // no temperature set yet at the bottom (S3).
  const TEMP_RANK: Record<string, number> = { Hot: 0, Warm: 1, Cold: 2 };
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const handleSortClick = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir(key === "date" ? "desc" : "asc");
    }
  };
  const handleSortDoubleClick = (key: SortKey) => {
    setSortBy(key);
    setSortDir(d => (sortBy === key ? (d === "asc" ? "desc" : "asc") : "asc"));
  };

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

  const openMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/emails/${id}/open`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/advisors/${slug}/emails`] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/emails/${id}`);
    },
    onSuccess: (_d, id) => {
      queryClient.invalidateQueries({ queryKey: [`/api/advisors/${slug}/emails`] });
      setExpandedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    },
  });

  // ── Manual "Add Lead" modal — lets the advisor log a lead they captured
  // outside the funnel (phone call, in-person meeting, etc). Same shape as
  // the public callback form so it flows through the same auto-grader; the
  // server tags it with type "Manual Entry" and sourceProfileSlug = primary. ──
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const blankLead = {
    senderName: "",
    senderEmail: "",
    clientPhone: "",
    clientAge: "",
    clientIncome: "",
    clientIndustry: "",
    clientMarried: false,
    clientChildren: false,
    clientVehicle: false,
    clientProperty: false,
    selectedServices: [] as string[],
    body: "",
  };
  const [newLead, setNewLead] = useState(blankLead);
  const updateNewLead = <K extends keyof typeof blankLead>(k: K, v: (typeof blankLead)[K]) =>
    setNewLead(prev => ({ ...prev, [k]: v }));
  const toggleNewService = (key: string) =>
    setNewLead(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(key)
        ? prev.selectedServices.filter(s => s !== key)
        : [...prev.selectedServices, key],
    }));

  const ADD_LEAD_INCOMES = [
    "R0k - R15k", "R15k - R30k", "R30k - R45k", "R45k - R60k",
    "R60k - R75k", "R75k - R100k", "R100k+",
  ];

  // Task #31 — soft-warn duplicate lookup for the Add Lead modal.
  const addLeadDuplicate = useDuplicateLeadCheck(advisor?.id, newLead.clientPhone, newLead.senderEmail);

  const createLeadMutation = useMutation({
    mutationFn: async () => {
      const services = newLead.selectedServices
        .map(k => INDIVIDUAL_SERVICES.find(s => s.key === k)?.name || k)
        .join(", ");
      const payload = {
        senderName: newLead.senderName.trim(),
        senderEmail: newLead.senderEmail.trim() || `manual-${Date.now()}@no-email.local`,
        type: "Manual Entry",
        subject: `Manually added lead — ${newLead.senderName.trim()}`,
        body: newLead.body.trim() || "Lead added manually by the advisor from the registry.",
        clientPhone: newLead.clientPhone.trim() || null,
        clientAge: newLead.clientAge ? Number(newLead.clientAge) : null,
        clientIncome: newLead.clientIncome || null,
        clientIndustry: newLead.clientIndustry.trim() || null,
        clientMarried: newLead.clientMarried,
        clientChildren: newLead.clientChildren,
        clientVehicle: newLead.clientVehicle,
        clientProperty: newLead.clientProperty,
        servicesRequested: services || null,
        source: "Manual Entry",
        sourceProfileSlug: advisor.profileSlug,
        advisorId: advisor.id, // critical: scopes the lead to this advisor's registry
      };
      return apiRequest("POST", "/api/emails", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/advisors/${slug}/emails`] });
      queryClient.invalidateQueries({ queryKey: [`/api/advisors/${slug}/profile-stats`] });
      setNewLead(blankLead);
      setAddLeadOpen(false);
    },
  });

  const GRADE_RANK: Record<string, number> = { "Gold": 0, "Silver": 1, "Bronze": 2, "Development": 3 };
  const STATUS_RANK: Record<string, number> = { "Need to Contact": 0, "Contacted": 1, "Archive": 2 };

  // Split into active vs archived once so the top tabs can show counts and we
  // never mix archived leads into the active list.
  const activeLeads = leads.filter(l => l.leadStatus !== "Archive");
  const archivedLeads = leads.filter(l => l.leadStatus === "Archive");
  const sourceLeads = viewMode === "archived" ? archivedLeads : activeLeads;

  const filtered = sourceLeads
    .filter(l => {
      const matchType = typeFilter === "all" || l.type === typeFilter;
      // Status filter only applies in active view (archived view is, by definition, all "Archive")
      const matchStatus = viewMode === "archived" || statusFilter === "all" || (l.leadStatus || "Need to Contact") === statusFilter;
      const matchGrade = gradeFilter === "all" || (l.grade || "Silver") === gradeFilter;
      const q = search.toLowerCase();
      const matchSearch = q === "" ||
        l.senderName.toLowerCase().includes(q) ||
        l.senderEmail.toLowerCase().includes(q) ||
        (l.clientPhone || "").includes(q) ||
        (l.referrerName || "").toLowerCase().includes(q);
      const matchUnread = !unreadOnly || !l.lastViewedAt;
      return matchType && matchStatus && matchGrade && matchSearch && matchUnread;
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      let cmp = 0;
      if (sortBy === "date") {
        cmp = new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime();
      } else if (sortBy === "name") {
        cmp = a.senderName.localeCompare(b.senderName);
      } else if (sortBy === "grade") {
        cmp = (GRADE_RANK[a.grade || "Silver"] ?? 99) - (GRADE_RANK[b.grade || "Silver"] ?? 99);
      } else if (sortBy === "status") {
        cmp = (STATUS_RANK[a.leadStatus || "Need to Contact"] ?? 99) - (STATUS_RANK[b.leadStatus || "Need to Contact"] ?? 99);
      } else if (sortBy === "temperature") {
        cmp = (TEMP_RANK[a.leadTemperature || ""] ?? 99) - (TEMP_RANK[b.leadTemperature || ""] ?? 99);
      }
      return cmp * dir;
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
    "Referral":     { text: "#7c3aed", bg: "rgba(124,58,237,0.12)" },
    "Call Back":    { text: "#0369a1", bg: "rgba(3,105,161,0.12)"  },
    "Will Request": { text: "#b45309", bg: "rgba(217,119,6,0.12)"  },
  };

  const gradeCount = (g: string) => leads.filter(l => (l.grade || "Silver") === g).length;
  const statusCount = (s: string) => leads.filter(l => (l.leadStatus || "Need to Contact") === s).length;

  const handleExportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Type", "Grade", "Status", "Age", "Income", "Industry", "Referrer", "Date"];
    const rows = filtered.map(l => [
      l.senderName, l.senderEmail, l.clientPhone || "", l.type,
      l.grade || "Silver", l.leadStatus || "Need to Contact",
      l.clientAge || "", l.clientIncome || "", l.clientIndustry || "",
      l.referrerName || "", format(new Date(l.receivedAt), "yyyy-MM-dd"),
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `registry-${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

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
  ];

  // Hot/Warm/Cold colour palette — mirrors the CIV row glow language for consistency.
  const tempBadge: Record<string, { text: string; bg: string; border: string }> = {
    Hot:  { text: "#dc2626", bg: "rgba(220,38,38,0.10)",  border: "rgba(220,38,38,0.35)" },
    Warm: { text: "#d97706", bg: "rgba(217,119,6,0.10)",  border: "rgba(217,119,6,0.35)" },
    Cold: { text: "#0284c7", bg: "rgba(2,132,199,0.10)",  border: "rgba(2,132,199,0.35)" },
  };

  return (
    <div className="space-y-4">
      {/* Sort + Export row — sort chips on the left, Export CSV on the right */}
      {leads.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: tc.mutedText }}>Sort</span>
          {([
            { key: "date", label: "Date" },
            { key: "name", label: "Name" },
            { key: "grade", label: "Grade" },
            { key: "status", label: "Status" },
            { key: "temperature", label: "Temperature" },
          ] as Array<{ key: SortKey; label: string }>).map(opt => {
            const active = sortBy === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => handleSortClick(opt.key)}
                onDoubleClick={() => handleSortDoubleClick(opt.key)}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1"
                style={{
                  backgroundColor: active ? tc.accentColor + "20" : "transparent",
                  color: active ? tc.accentColor : tc.mutedText,
                  border: `1px solid ${active ? tc.accentColor : tc.borderColor}`,
                }}
                title={active ? "Click to flip direction" : `Sort by ${opt.label.toLowerCase()}`}
                data-testid={`button-sort-${opt.key}`}
              >
                {opt.label}
                {active && <span className="text-[10px] leading-none">{sortDir === "asc" ? "▲" : "▼"}</span>}
              </button>
            );
          })}
          <button
            onClick={handleExportCSV}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-75"
            style={{ backgroundColor: tc.inputBg, color: tc.mutedText, border: `1px solid ${tc.borderColor}` }}
            data-testid="button-export-csv"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      )}
      {/* Add Lead — primary action for the advisor to log an off-funnel lead.
          Sits above the Active/Archived strip so it's the first thing the eye
          catches when opening the registry. */}
      <button
        onClick={() => setAddLeadOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 active:scale-[0.99]"
        style={{ backgroundColor: tc.accentColor, color: tc.buttonText }}
        data-testid="button-add-lead"
      >
        <Plus className="h-4 w-4" />
        Add Lead Manually
      </button>

      {/* Active / Archived top tab — Archive becomes a destination, not a status */}
      <div className="flex items-center gap-1 border-b" style={{ borderColor: tc.borderColor }}>
        {(["active", "archived"] as const).map(mode => {
          const isOn = viewMode === mode;
          const count = mode === "active" ? activeLeads.length : archivedLeads.length;
          const label = mode === "active" ? "Active" : "Archived";
          return (
            <button
              key={mode}
              onClick={() => {
                setViewMode(mode);
                setExpandedIds(new Set());
                if (mode === "archived") setStatusFilter("all");
              }}
              className="px-3 py-2 text-xs font-semibold transition-colors border-b-2 -mb-px flex items-center gap-1.5"
              style={{
                borderColor: isOn ? tc.accentColor : "transparent",
                color: isOn ? tc.accentColor : tc.mutedText,
              }}
              data-testid={`tab-leads-${mode}`}
            >
              {label}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{
                backgroundColor: isOn ? tc.accentColor + "20" : tc.inputBg,
                color: isOn ? tc.accentColor : tc.mutedText,
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {gradeCards.map(g => (
          <button key={g.label} onClick={() => setGradeFilter(gradeFilter === g.label ? "all" : g.label)}
            className="rounded-xl p-2.5 text-center transition-all hover:opacity-80"
            style={{
              backgroundColor: g.bg,
              border: `${gradeFilter === g.label ? "2px" : "1px"} solid ${gradeFilter === g.label ? g.text : g.border}`,
              boxShadow: gradeFilter === g.label ? `0 0 0 1px ${g.text}40` : "none",
            }}
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
      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: tc.mutedText }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, phone…"
          className="w-full text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none"
          style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.borderColor}`, color: tc.textColor }}
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: tc.mutedText }} aria-label="Clear search"><X className="h-3.5 w-3.5" /></button>
        )}
      </div>
      {/* Type filter + New (unread-only) quick toggle (W3.7) */}
      <div className="flex gap-2 flex-wrap">
        {/* "New" pill — filters to leads that still have the unread glow.
             Sits at the start so it's the first thing the eye lands on. */}
        {(() => {
          const newCount = sourceLeads.filter(l => !l.lastViewedAt).length;
          return (
            <button
              onClick={() => setUnreadOnly(v => !v)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              style={{
                backgroundColor: unreadOnly ? tc.accentColor : tc.inputBg,
                color: unreadOnly ? tc.buttonText : tc.mutedText,
                border: `1px solid ${unreadOnly ? tc.accentColor : tc.borderColor}`,
              }}
              title={unreadOnly ? "Showing new leads only — click to clear" : "Show only new (unread) leads"}
              data-testid="button-filter-new"
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: unreadOnly ? tc.buttonText : "#ef4444" }}
              />
              New{newCount > 0 ? ` (${newCount})` : ""}
            </button>
          );
        })()}
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
        {(gradeFilter !== "all" || search || unreadOnly) && (
          <button onClick={() => { setGradeFilter("all"); setSearch(""); setUnreadOnly(false); }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ml-auto"
            style={{ backgroundColor: tc.inputBg, color: tc.mutedText, border: `1px solid ${tc.borderColor}` }}
          >
            Clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8" style={{ color: tc.mutedText }}>
          <p className="text-sm">No leads match your filters.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(lead => {
            const tb = typeBadge[lead.type] || { text: tc.mutedText, bg: tc.inputBg };
            const currentStatus = lead.leadStatus || "Need to Contact";
            const gc = gradeColors[lead.grade || "Silver"] || gradeColors["Silver"];
            // Unread now keyed off the advisor-only lastViewedAt — admin views in CIV
            // no longer mark a lead as read on the advisor side.
            const isUnread = !lead.lastViewedAt;
            const temp = lead.leadTemperature || "Cold";
            const tBadge = tempBadge[temp];
            // For the row glow (W2.9) we only want a temperature halo when the lead has
            // an ACTUAL temperature set — not the "Cold" fallback that just makes the
            // badge render. Otherwise the row falls back to the unread/default border.
            const tempGlow = lead.leadTemperature ? tempBadge[lead.leadTemperature] : null;
            const score = typeof lead.leadScore === "number" ? lead.leadScore : null;
            const isExpanded = expandedIds.has(lead.id);
            const phone = lead.clientPhone?.replace(/[^0-9+]/g, "");
            const whatsappHref = phone ? `https://wa.me/${phone.startsWith("+") ? phone.slice(1) : phone}` : null;
            return (
              <div
                key={lead.id}
                className="rounded-xl overflow-hidden transition-shadow"
                style={{
                  backgroundColor: tc.cardBg,
                  // Temperature-keyed full-surround glow (W2.9). When a lead has an ACTUAL
                  // Hot/Warm/Cold temperature it gets a soft outer glow in that colour family
                  // wrapping the whole card. Otherwise (no temperature set yet) it falls back
                  // to the unread-accent border. Single ring + ambient halo, no doubled stroke.
                  border: `1px solid ${tempGlow ? tempGlow.border : (isUnread ? tc.accentColor + "60" : tc.borderColor)}`,
                  boxShadow: tempGlow ? `0 0 14px 2px ${tempGlow.text}33` : "none",
                }}
              >
                {/* Header row — click to expand/collapse.
                    F6: fixed-grid layout — avatar | name+meta (truncates 2 lines) |
                    right-aligned badge column with stable min-width so every row is the
                    same shape. Uniform min-h-[88px] + px-4 py-4 padding across the list. */}
                <button
                  type="button"
                  className="w-full grid items-center px-4 py-4 text-left transition-opacity active:opacity-70 min-h-[88px]"
                  style={{ gridTemplateColumns: "auto minmax(0,1fr) auto" }}
                  onClick={() => {
                    toggleExpanded(lead.id);
                    if (!isExpanded) openMutation.mutate(lead.id);
                  }}
                  data-testid={`button-civ-row-${lead.id}`}
                >
                  {/* Avatar column — fixed width keeps the gutter aligned across all rows. */}
                  <div className="relative pr-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: tc.initialsCircleBg, color: tc.accentColor }}>
                      {getInitials(lead.senderName)}
                    </div>
                    {isUnread && <span className="absolute -top-0.5 right-2.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2" style={{ borderColor: tc.bgColor }} />}
                  </div>
                  {/* Name + meta column — name clamps to 2 lines so very long names stop
                      shoving the right column around. */}
                  <div className="min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className="text-sm font-medium line-clamp-2 break-words" style={{ color: tc.textColor }}>{lead.senderName}</span>
                      <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ color: tb.text, backgroundColor: tb.bg }}>{lead.type}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs" style={{ color: tc.mutedText }}>
                        Received {format(new Date(lead.receivedAt), "dd MMM yyyy, HH:mm")}
                      </span>
                      {lead.lastViewedAt && (
                        <span className="text-xs" style={{ color: tc.mutedText }}>
                          · Last viewed {format(new Date(lead.lastViewedAt), "dd MMM, HH:mm")}
                        </span>
                      )}
                      {viewMode === "archived" && lead.archivedAt && (
                        <span className="text-xs" style={{ color: tc.mutedText }}>
                          · Archived {format(new Date(lead.archivedAt), "dd MMM yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Badge column — fixed min-width + right alignment so Grade/Status pills
                      always sit in the same vertical strip on the card. */}
                  <div className="flex items-center justify-end gap-2 flex-shrink-0 pl-3 min-w-[140px]">
                    {/* Grader 2.0 — temperature pill + score; same colour language as CIV row glow */}
                    {tBadge && (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                        style={{ color: tBadge.text, backgroundColor: tBadge.bg, border: `1px solid ${tBadge.border}` }}
                        data-testid={`badge-temp-${lead.id}`}
                        title={`Lead temperature: ${temp}`}
                      >
                        {temp}
                      </span>
                    )}
                    {score !== null && (
                      <span
                        className="text-[10px] font-semibold tabular-nums"
                        style={{ color: tc.mutedText }}
                        data-testid={`text-score-${lead.id}`}
                        title="Lead score (out of 100)"
                      >
                        {score}
                      </span>
                    )}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: gc.text, backgroundColor: gc.bg }}>{lead.grade || "Silver"}</span>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColors[currentStatus] }} />
                    <ChevronRight
                      className="h-3.5 w-3.5 opacity-40 transition-transform"
                      style={{ color: tc.mutedText, transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
                    />
                  </div>
                </button>

                {/* Inline expanded body */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 space-y-4 border-t" style={{ borderColor: tc.borderColor }}>
                    {/* Quick actions — Call / WhatsApp / Email. Call uses tel:
                        which on mobile opens the dialer pre-filled with the
                        client's number. Greys out (with WhatsApp) when no phone. */}
                    <div className="grid grid-cols-3 gap-2 pt-3">
                      {phone ? (
                        // May 2026 — hard-coded brand blue + white text to guarantee
                        // legibility on every theme. Previously used tc.accentColor /
                        // tc.buttonText which on the silver/coral/gold palettes
                        // produced a near-white button with white text (Stewart
                        // flagged "white bg + white text" in change-notes batch).
                        // Mirrors the WhatsApp button's hard-coded #25D366 pattern.
                        <a href={`tel:${phone}`}
                          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold"
                          style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                          data-testid={`link-call-${lead.id}`}>
                          <Phone className="h-3.5 w-3.5" />
                          Call
                        </a>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold opacity-50"
                          style={{ backgroundColor: tc.inputBg, color: tc.mutedText, border: `1px solid ${tc.borderColor}` }}>
                          <Phone className="h-3.5 w-3.5" />
                          No phone
                        </div>
                      )}
                      {whatsappHref ? (
                        <a href={whatsappHref} target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold"
                          style={{ backgroundColor: "#25D366", color: "#fff" }}
                          data-testid={`link-wa-${lead.id}`}>
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          WhatsApp
                        </a>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold opacity-50"
                          style={{ backgroundColor: tc.inputBg, color: tc.mutedText, border: `1px solid ${tc.borderColor}` }}>
                          No phone
                        </div>
                      )}
                      <a href={`mailto:${lead.senderEmail}`}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold"
                        style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor, border: `1px solid ${tc.borderColor}` }}
                        data-testid={`link-email-${lead.id}`}>
                        <Mail className="h-3.5 w-3.5" />
                        Email
                      </a>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: tc.mutedText }}>Status</div>
                      <div className="flex gap-2 flex-wrap">
                        {["Need to Contact", "Contacted", "Archive"].map(s => (
                          <button key={s}
                            onClick={() => statusMutation.mutate({ id: lead.id, leadStatus: s })}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{
                              backgroundColor: currentStatus === s ? statusBg[s] : tc.inputBg,
                              color: currentStatus === s ? statusColors[s] : tc.mutedText,
                              border: `1.5px solid ${currentStatus === s ? statusColors[s] : tc.borderColor}`,
                            }}
                            data-testid={`button-status-${lead.id}-${s.replace(/ /g, "-").toLowerCase()}`}>
                            {s}
                          </button>
                        ))}
                        <button
                          type="button"
                          title="Donate & Deduct — coming soon"
                          onClick={() => alert("Donate & Deduct — coming soon. A new way to grade, give back and stay tax-smart. Stay tuned.")}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                          style={{
                            backgroundColor: "rgba(236,72,153,0.10)",
                            color: "#db2777",
                            border: "1.5px dashed rgba(236,72,153,0.55)",
                          }}
                          data-testid={`button-status-${lead.id}-donate-deduct`}>
                          <Heart className="h-3 w-3" /> Donate &amp; Deduct
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(236,72,153,0.18)", color: "#be185d" }}>Soon</span>
                        </button>
                      </div>
                    </div>

                    {/* Grade — read-only for advisors, set by admin only */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: tc.mutedText }}>Grade</div>
                        <Lock className="h-3 w-3" style={{ color: tc.mutedText }} />
                      </div>
                      <div className="flex items-center gap-3">
                        {(() => {
                          const g = lead.grade || "Silver";
                          const gc2 = gradeColors[g];
                          return (
                            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: gc2.bg, color: gc2.text, border: `1.5px solid ${gc2.text}` }} data-testid={`badge-grade-${lead.id}`}>
                              {g}
                            </span>
                          );
                        })()}
                        <span className="text-[10px]" style={{ color: tc.mutedText }}>Set by administrator</span>
                      </div>
                    </div>

                    {/* Contact info */}
                    <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.borderColor}` }}>
                      <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: tc.mutedText }}>Contact</div>
                      <Row label="Email" value={lead.senderEmail} tc={tc} />
                      {lead.clientPhone && <Row label="Phone" value={lead.clientPhone} tc={tc} />}
                    </div>

                    {/* Client details */}
                    <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.borderColor}` }}>
                      <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: tc.mutedText }}>Client Details</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {lead.clientAge != null && <Row label="Age" value={String(lead.clientAge)} tc={tc} />}
                        {lead.clientIncome && <Row label="Income" value={lead.clientIncome} tc={tc} />}
                        {lead.clientIndustry && <Row label="Industry" value={lead.clientIndustry} tc={tc} />}
                        {lead.clientMarried != null && <Row label="Married" value={lead.clientMarried ? "Yes" : "No"} tc={tc} />}
                        {lead.clientChildren != null && <Row label="Children" value={lead.clientChildren ? "Yes" : "No"} tc={tc} />}
                        {lead.clientVehicle != null && <Row label="Vehicle" value={lead.clientVehicle ? "Yes" : "No"} tc={tc} />}
                        {lead.clientProperty != null && <Row label="Property" value={lead.clientProperty ? "Yes" : "No"} tc={tc} />}
                      </div>
                      {/* Long-form fields go full-width below the 2-col grid so
                          values like "Mornings (08:00-12:00)" don't bleed into
                          the neighbouring cell. */}
                      {lead.preferredContactTime && <Row label="Contact Time" value={lead.preferredContactTime} tc={tc} full />}
                      {lead.servicesRequested && <Row label="Services" value={lead.servicesRequested} tc={tc} full />}
                      {/* Task #23 — gap fields. Each row only renders when populated. */}
                      {lead.howFound && <Row label="Found Via" value={lead.howFound} tc={tc} />}
                      {lead.netWorthBracket && <Row label="Net Worth" value={lead.netWorthBracket} tc={tc} />}
                      {lead.hasAdvisor != null && (
                        <Row
                          label="Existing Advisor"
                          value={lead.hasAdvisor ? (lead.existingAdvisorName || "Yes") : "No"}
                          tc={tc}
                        />
                      )}
                      {lead.hasWill != null && <Row label="Has Will" value={lead.hasWill ? "Yes" : "No"} tc={tc} />}
                      {lead.estateValueBracket && <Row label="Estate Value" value={lead.estateValueBracket} tc={tc} />}
                      {lead.biggestConcern && <Row label="Biggest Concern" value={lead.biggestConcern} tc={tc} full />}
                      {lead.referralReason && <Row label="Why Referred" value={lead.referralReason} tc={tc} full />}
                    </div>

                    {/* Referrer */}
                    {(lead.referrerName || lead.referrerEmail) && (
                      <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.borderColor}` }}>
                        <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: tc.mutedText }}>Referred By</div>
                        {lead.referrerName && <Row label="Name" value={lead.referrerName} tc={tc} />}
                        {lead.referrerEmail && <Row label="Email" value={lead.referrerEmail} tc={tc} />}
                        {lead.referrerPhone && <Row label="Phone" value={lead.referrerPhone} tc={tc} />}
                        {lead.referrerRelation && <Row label="Relation" value={lead.referrerRelation} tc={tc} />}
                      </div>
                    )}

                    {/* Footer — viewed timestamp + delete */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-xs" style={{ color: tc.mutedText }}>
                        {lead.lastViewedAt
                          ? <>Last viewed {format(new Date(lead.lastViewedAt), "dd MMM yyyy, HH:mm")}</>
                          : <>Opened just now</>}
                      </div>
                      <button
                        onClick={() => { if (window.confirm("Delete this lead? This cannot be undone.")) { deleteMutation.mutate(lead.id); } }}
                        disabled={deleteMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}
                        data-testid={`button-delete-${lead.id}`}>
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>

                    {/* Received / Last viewed timestamps — same format as the
                        master CIV ('PPpp' from date-fns), surfaced here so
                        advisors see the same provenance trail on their own
                        leads. */}
                    <div className="pt-2 mt-2 border-t space-y-1" style={{ borderColor: tc.borderColor }}>
                      {(lead as any).receivedAt && (
                        <div className="text-[11px] flex items-center gap-1" style={{ color: tc.mutedText }} data-testid={`text-received-${lead.id}`}>
                          <CalendarDays className="h-3 w-3" />
                          Received: {format(new Date((lead as any).receivedAt), "PPpp")}
                        </div>
                      )}
                      {(lead as any).lastOpenedAt && (
                        <div className="text-[11px] flex items-center gap-1" style={{ color: tc.mutedText }} data-testid={`text-last-viewed-${lead.id}`}>
                          <Eye className="h-3 w-3" />
                          Last viewed: {format(new Date((lead as any).lastOpenedAt), "PPpp")}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add Lead modal ── */}
      {addLeadOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => !createLeadMutation.isPending && setAddLeadOpen(false)}
          data-testid="modal-add-lead"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl"
            style={{ backgroundColor: tc.popupBg, border: `1px solid ${tc.borderColor}` }}
          >
            <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b" style={{ backgroundColor: tc.popupBg, borderColor: tc.borderColor }}>
              <div>
                <h3 className="text-base font-semibold" style={{ color: tc.textColor }}>Add Lead Manually</h3>
                <p className="text-xs mt-0.5" style={{ color: tc.mutedText }}>Log a prospect from a call, meeting, or referral.</p>
              </div>
              <button
                onClick={() => setAddLeadOpen(false)}
                disabled={createLeadMutation.isPending}
                className="p-2 rounded-lg hover:opacity-75"
                style={{ backgroundColor: tc.buttonSecondaryBg }}
                aria-label="Close"
                data-testid="button-add-lead-close"
              >
                <X className="h-4 w-4" style={{ color: tc.mutedText }} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: tc.mutedText }}>Full name *</label>
                  <input
                    value={newLead.senderName}
                    onChange={e => updateNewLead("senderName", e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full text-sm rounded-lg px-3 py-2 outline-none"
                    style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.borderColor}`, color: tc.textColor }}
                    data-testid="input-add-lead-name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: tc.mutedText }}>Email</label>
                    <input
                      type="email"
                      value={newLead.senderEmail}
                      onChange={e => updateNewLead("senderEmail", e.target.value)}
                      placeholder="jane@example.com"
                      className="w-full text-sm rounded-lg px-3 py-2 outline-none"
                      style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.borderColor}`, color: tc.textColor }}
                      data-testid="input-add-lead-email"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: tc.mutedText }}>Phone</label>
                    <input
                      type="tel"
                      value={newLead.clientPhone}
                      onChange={e => updateNewLead("clientPhone", e.target.value)}
                      placeholder="+27 …"
                      className="w-full text-sm rounded-lg px-3 py-2 outline-none"
                      style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.borderColor}`, color: tc.textColor }}
                      data-testid="input-add-lead-phone"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: tc.mutedText }}>Age</label>
                    <input
                      type="number"
                      value={newLead.clientAge}
                      onChange={e => updateNewLead("clientAge", e.target.value)}
                      placeholder="35"
                      className="w-full text-sm rounded-lg px-3 py-2 outline-none"
                      style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.borderColor}`, color: tc.textColor }}
                      data-testid="input-add-lead-age"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: tc.mutedText }}>Income</label>
                    <select
                      value={newLead.clientIncome}
                      onChange={e => updateNewLead("clientIncome", e.target.value)}
                      className="w-full text-sm rounded-lg px-3 py-2 outline-none"
                      style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.borderColor}`, color: tc.textColor }}
                      data-testid="select-add-lead-income"
                    >
                      <option value="">Not specified</option>
                      {ADD_LEAD_INCOMES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: tc.mutedText }}>Industry</label>
                  <input
                    value={newLead.clientIndustry}
                    onChange={e => updateNewLead("clientIndustry", e.target.value)}
                    placeholder="Optional"
                    className="w-full text-sm rounded-lg px-3 py-2 outline-none"
                    style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.borderColor}`, color: tc.textColor }}
                    data-testid="input-add-lead-industry"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium block mb-2" style={{ color: tc.mutedText }}>Lifestyle</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      ["clientMarried", "Married"],
                      ["clientChildren", "Children"],
                      ["clientVehicle", "Vehicle"],
                      ["clientProperty", "Property"],
                    ] as const).map(([k, label]) => (
                      <label
                        key={k}
                        className="flex items-center gap-2 text-xs rounded-lg px-3 py-2 cursor-pointer"
                        style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.borderColor}`, color: tc.textColor }}
                      >
                        <input
                          type="checkbox"
                          checked={newLead[k]}
                          onChange={e => updateNewLead(k, e.target.checked)}
                          data-testid={`check-add-lead-${k}`}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium block mb-2" style={{ color: tc.mutedText }}>Services of interest</label>
                  <div className="flex flex-wrap gap-1.5">
                    {INDIVIDUAL_SERVICES.map(s => {
                      const on = newLead.selectedServices.includes(s.key);
                      return (
                        <button
                          key={s.key}
                          type="button"
                          onClick={() => toggleNewService(s.key)}
                          className="text-[11px] px-2.5 py-1 rounded-full transition-colors"
                          style={{
                            backgroundColor: on ? tc.accentColor + "22" : tc.inputBg,
                            color: on ? tc.accentColor : tc.mutedText,
                            border: `1px solid ${on ? tc.accentColor : tc.borderColor}`,
                          }}
                          data-testid={`chip-add-lead-svc-${s.key}`}
                        >
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: tc.mutedText }}>Notes</label>
                  <textarea
                    value={newLead.body}
                    onChange={e => updateNewLead("body", e.target.value)}
                    rows={3}
                    placeholder="Anything to remember about this lead…"
                    className="w-full text-sm rounded-lg px-3 py-2 outline-none resize-none"
                    style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.borderColor}`, color: tc.textColor }}
                    data-testid="textarea-add-lead-notes"
                  />
                </div>
              </div>

              <DuplicateLeadNotice duplicate={addLeadDuplicate} testId="notice-duplicate-add-lead" />

              {createLeadMutation.isError && (
                <div className="text-xs flex items-start gap-2 rounded-lg p-2.5" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>Could not save the lead. Check the name field is filled in and try again.</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setAddLeadOpen(false)}
                  disabled={createLeadMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                  style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.textColor, border: `1px solid ${tc.borderColor}` }}
                  data-testid="button-add-lead-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createLeadMutation.mutate()}
                  disabled={!newLead.senderName.trim() || createLeadMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50 hover:opacity-90"
                  style={{ backgroundColor: tc.accentColor, color: tc.buttonText }}
                  data-testid="button-add-lead-save"
                >
                  {createLeadMutation.isPending ? (
                    <span className="inline-flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Save Lead</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, tc, full }: { label: string; value: string; tc: ReturnType<typeof getThemeColors>; full?: boolean }) {
  return (
    <div className={`flex gap-1.5 text-xs ${full ? "col-span-2" : ""}`}>
      <span className="font-medium flex-shrink-0" style={{ color: tc.mutedText }}>{label}:</span>
      <span className="break-words min-w-0" style={{ color: tc.textColor }}>{value}</span>
    </div>
  );
}

function StatsTab({ slug, tc }: { slug: string; tc: ReturnType<typeof getThemeColors> }) {
  const { data, isLoading } = useQuery<{ totalLeads: number; totalReferrals: number; totalCallbacks: number; totalViews: number; weeklyActivity: { name: string; leads: number }[] }>({
    queryKey: [`/api/advisors/${slug}/stats`],
  });
  // S7: split-views totals (Primary vs Secondary).
  const { data: viewSplit } = useQuery<{ totalViews: number; primaryViews: number; secondaryViews: number }>({
    queryKey: [`/api/advisors/${slug}/profile-stats`],
  });
  // S7: 7-day time series of views split P vs S, for the new area chart.
  const { data: viewSeriesData } = useQuery<{ series: { name: string; primary: number; secondary: number }[] }>({
    queryKey: [`/api/advisors/${slug}/views-series`],
  });
  const viewSeries = viewSeriesData?.series ?? [];
  // Theme-friendly fixed colours per Stewart: green for Primary, blue for Secondary.
  const PRIMARY_COLOR = "#22c55e";
  const SECONDARY_COLOR = "#3b82f6";

  if (isLoading) return (
    <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" style={{ color: tc.mutedText }} /></div>
  );

  const stats = [
    { label: "Profile Views", value: viewSplit?.totalViews ?? data?.totalViews ?? 0 },
    { label: "Total Leads", value: data?.totalLeads ?? 0 },
    { label: "Referrals", value: data?.totalReferrals ?? 0 },
    { label: "Call Backs", value: data?.totalCallbacks ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }} data-testid={`stat-card-${s.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <div className="text-2xl font-bold" style={{ color: tc.textColor }}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: tc.mutedText }}>{s.label}</div>
            {/* S7: under the Profile Views card, show the Primary / Secondary split. */}
            {s.label === "Profile Views" && viewSplit && (
              <div className="flex items-center justify-center gap-3 mt-2 text-[11px]">
                <span className="flex items-center gap-1" data-testid="text-views-primary">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: PRIMARY_COLOR }} />
                  <span style={{ color: tc.mutedText }}>P</span>
                  <span className="font-semibold" style={{ color: tc.textColor }}>{viewSplit.primaryViews}</span>
                </span>
                <span className="flex items-center gap-1" data-testid="text-views-secondary">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: SECONDARY_COLOR }} />
                  <span style={{ color: tc.mutedText }}>S</span>
                  <span className="font-semibold" style={{ color: tc.textColor }}>{viewSplit.secondaryViews}</span>
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* S7: views-over-time chart, split Primary (green) vs Secondary (blue). */}
      <div className="rounded-xl p-4" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold" style={{ color: tc.textColor }}>Profile Views – Last 7 Days</h4>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PRIMARY_COLOR }} />
              <span style={{ color: tc.mutedText }}>Primary</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SECONDARY_COLOR }} />
              <span style={{ color: tc.mutedText }}>Secondary</span>
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={viewSeries} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="viewsPrimaryGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor={PRIMARY_COLOR} stopOpacity={0.45} />
                <stop offset="100%" stopColor={PRIMARY_COLOR} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="viewsSecondaryGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor={SECONDARY_COLOR} stopOpacity={0.45} />
                <stop offset="100%" stopColor={SECONDARY_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={tc.borderColor} />
            <XAxis dataKey="name" tick={{ fill: tc.mutedText, fontSize: 11 }} tickLine={false} axisLine={false} dy={4} />
            <YAxis tick={{ fill: tc.mutedText, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
            <Tooltip contentStyle={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}`, color: tc.textColor, borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="primary"   name="Primary"   stroke={PRIMARY_COLOR}   strokeWidth={2.5} fill="url(#viewsPrimaryGrad)"   dot={{ r: 2.5, fill: tc.cardBg, stroke: PRIMARY_COLOR,   strokeWidth: 2 }} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="secondary" name="Secondary" stroke={SECONDARY_COLOR} strokeWidth={2.5} fill="url(#viewsSecondaryGrad)" dot={{ r: 2.5, fill: tc.cardBg, stroke: SECONDARY_COLOR, strokeWidth: 2 }} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl p-4" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
        <h4 className="text-sm font-semibold mb-4" style={{ color: tc.textColor }}>Leads – Last 7 Days</h4>
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
  const shimId = `ibsh-${id}`;
  const l1 = initials[0] || "";
  const l2 = initials[1] || "";
  return (
    <svg id={id} width={size} height={size} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
        <linearGradient id={shimId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="22" fill={`url(#${gradId})`} />
      <rect width="120" height="60" rx="22" fill={`url(#${shimId})`} />
      <rect x="4" y="4" width="112" height="112" rx="19" fill="none" stroke={border} strokeWidth="1.8" />
      <text x="38" y="84" fontFamily="Georgia, 'Times New Roman', serif" fontSize="62" fontWeight="bold" fill="white" textAnchor="middle" opacity="0.92" letterSpacing="-2">{l1}</text>
      <text x="82" y="84" fontFamily="Georgia, 'Times New Roman', serif" fontSize="62" fontWeight="bold" fill="white" textAnchor="middle" opacity="0.78" letterSpacing="-2">{l2}</text>
    </svg>
  );
}

// Task #30 — rebuilt on react-easy-crop. The previous hand-rolled cropper
// shipped touch handlers that React's passive-listener default silently
// blocked, so advisors on mobile (and some desktop browsers) couldn't drag
// to reframe. react-easy-crop attaches non-passive listeners directly to
// the DOM node and handles drag, pinch-zoom and wheel-zoom out of the box.
// Filters (brightness/contrast/saturation/posterize) are retained and
// applied post-crop via canvas so the cropped output still picks them up.
function ImageCropper({ src, onConfirm, onCancel, tc }: {
  src: string; onConfirm: (dataUrl: string) => void; onCancel: () => void; tc: ReturnType<typeof getThemeColors>;
}) {
  const CONTAINER = 280;
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [posterize, setPosterize] = useState(0);
  const [busy, setBusy] = useState(false);

  const onCropComplete = (_area: CropArea, areaPixels: CropArea) => {
    setCroppedAreaPixels(areaPixels);
  };

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setBusy(true);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.crossOrigin = "anonymous";
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = src;
      });
      const rad = (rotation * Math.PI) / 180;
      const sin = Math.abs(Math.sin(rad));
      const cos = Math.abs(Math.cos(rad));
      const bboxW = img.width * cos + img.height * sin;
      const bboxH = img.width * sin + img.height * cos;
      const work = document.createElement("canvas");
      work.width = bboxW; work.height = bboxH;
      const wctx = work.getContext("2d");
      if (!wctx) return;
      wctx.translate(bboxW / 2, bboxH / 2);
      wctx.rotate(rad);
      wctx.drawImage(img, -img.width / 2, -img.height / 2);
      const OUT = 400;
      const canvas = document.createElement("canvas");
      canvas.width = OUT; canvas.height = OUT;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      ctx.drawImage(
        work,
        croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height,
        0, 0, OUT, OUT,
      );
      ctx.filter = "none";
      if (posterize > 0) {
        const levels = posterize;
        const imageData = ctx.getImageData(0, 0, OUT, OUT);
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
          d[i]   = Math.round(d[i]   / 255 * levels) / levels * 255;
          d[i+1] = Math.round(d[i+1] / 255 * levels) / levels * 255;
          d[i+2] = Math.round(d[i+2] / 255 * levels) / levels * 255;
        }
        ctx.putImageData(imageData, 0, 0);
      }
      onConfirm(canvas.toDataURL("image/jpeg", 0.92));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.82)" }}>
      <div className="rounded-2xl p-5 space-y-4 w-full max-w-xs" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
        <h3 className="text-sm font-semibold" style={{ color: tc.textColor }}>Crop Profile Picture</h3>
        <p className="text-xs" style={{ color: tc.mutedText }}>Drag to reposition · pinch or use slider to zoom</p>
        <div
          className="relative mx-auto"
          style={{
            width: CONTAINER, height: CONTAINER,
            borderRadius: "50%",
            overflow: "hidden",
            border: `3px solid ${tc.accentColor}`,
            boxShadow: `0 0 0 4px ${tc.cardBg}, 0 0 0 6px ${tc.accentColor}40`,
            backgroundColor: "#000",
          }}
          data-testid="image-cropper-area"
        >
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={false}
            minZoom={1}
            maxZoom={4}
            zoomSpeed={0.5}
            objectFit="cover"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { width: "100%", height: "100%", position: "absolute", backgroundColor: "#000" },
              mediaStyle: { filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)` },
              cropAreaStyle: { border: "none", boxShadow: "none", color: "rgba(0,0,0,0.4)" },
            }}
          />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-xs" style={{ color: tc.mutedText }}>Zoom</span>
            <span className="text-xs font-medium" style={{ color: tc.accentColor }}>{Math.round(zoom * 100)}%</span>
          </div>
          <input type="range" min={1} max={4} step={0.02} value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
            className="w-full accent-current" style={{ accentColor: tc.accentColor }}
            data-testid="input-cropper-zoom"
          />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: tc.mutedText }}>Rotation</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: tc.accentColor }}>{rotation}°</span>
              <button
                type="button"
                onClick={() => setRotation(r => (r + 90) % 360)}
                className="inline-flex items-center justify-center h-6 w-6 rounded"
                style={{ border: `1px solid ${tc.borderColor}`, color: tc.mutedText, backgroundColor: tc.inputBg }}
                aria-label="Rotate 90 degrees"
                data-testid="button-cropper-rotate-90"
              >
                <RotateCw className="h-3 w-3" />
              </button>
            </div>
          </div>
          <input type="range" min={0} max={360} step={1} value={rotation}
            onChange={e => setRotation(parseInt(e.target.value, 10))}
            className="w-full" style={{ accentColor: tc.accentColor }}
            data-testid="input-cropper-rotation"
          />
        </div>
        <div className="space-y-2" style={{ borderTop: `1px solid ${tc.borderColor}`, paddingTop: 10 }}>
          <p className="text-xs font-medium" style={{ color: tc.sectionTitle }}>Artistic Filters</p>
          {[
            { label: "Brightness", value: brightness, set: setBrightness, min: 30, max: 200 },
            { label: "Contrast", value: contrast, set: setContrast, min: 50, max: 250 },
            { label: "Saturation", value: saturation, set: setSaturation, min: 0, max: 300 },
          ].map(f => (
            <div key={f.label} className="space-y-0.5">
              <div className="flex justify-between">
                <span className="text-xs" style={{ color: tc.mutedText }}>{f.label}</span>
                <span className="text-xs font-medium" style={{ color: tc.accentColor }}>{f.value}%</span>
              </div>
              <input type="range" min={f.min} max={f.max} step={1} value={f.value}
                onChange={e => f.set(Number(e.target.value))}
                className="w-full" style={{ accentColor: tc.accentColor }}
              />
            </div>
          ))}
          <div className="space-y-0.5">
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: tc.mutedText }}>Posterize</span>
              <span className="text-xs font-medium" style={{ color: tc.accentColor }}>{posterize === 0 ? "Off" : `${posterize} levels`}</span>
            </div>
            <input type="range" min={0} max={8} step={1} value={posterize}
              onChange={e => setPosterize(Number(e.target.value))}
              className="w-full" style={{ accentColor: tc.accentColor }}
            />
          </div>
          {(brightness !== 100 || contrast !== 100 || saturation !== 100 || posterize !== 0) && (
            <button onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); setPosterize(0); }}
              className="text-xs underline" style={{ color: tc.mutedText }}>Reset filters</button>
          )}
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onCancel} disabled={busy} className="flex-1 py-2.5 rounded-xl text-xs font-medium"
            style={{ backgroundColor: tc.inputBg, color: tc.mutedText, border: `1px solid ${tc.borderColor}` }}
            data-testid="button-cropper-cancel">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={busy || !croppedAreaPixels} className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
            style={{ backgroundColor: tc.buttonBg, color: tc.buttonText, opacity: busy || !croppedAreaPixels ? 0.6 : 1 }}
            data-testid="button-cropper-apply">
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Apply & Save
          </button>
        </div>
      </div>
    </div>
  );
}

// Module-level helpers extracted so AdditionalProfileForm (secondary editor)
// can reuse the same Header PNG + Profile Image PNG generators as the primary
// ProfileTab without duplicating ~150 lines of canvas/SVG drawing code.
// Kept identical visual output to the original primary handlers (M6 parity).
function makeInitials(n: string): string {
  return n.trim() ? n.trim().split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2) : "NA";
}
function downloadHeaderBadgePng(opts: { name: string; theme: string; themeColor?: string | null }) {
  const { name, theme, themeColor } = opts;
  const initials = makeInitials(name);
  const { from, to, border } = getInitialsBadgeColors(theme, themeColor || undefined);
  const accentColor = getThemeColors(theme, themeColor || undefined).accentColor;
  const l1 = initials[0] || "", l2 = initials[1] || "";
  const displayName = (name || "Your Name").toUpperCase();
  const bSize = 200, pad = 30, gap = 48, fontSize = 120;
  const approxTextW = displayName.length * (fontSize * 0.62);
  const svgW = Math.round(pad + bSize + gap + approxTextW + pad);
  const svgH = bSize + pad * 2;
  const rx = Math.round(bSize * 22 / 120), rxInner = Math.round(bSize * 19 / 120);
  const strokeW = (1.8 * bSize / 120).toFixed(1);
  const textX1 = Math.round(38 * bSize / 120), textX2 = Math.round(82 * bSize / 120);
  const textY = Math.round(84 * bSize / 120), fSize = Math.round(62 * bSize / 120);
  const svgContent = [
    `<svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">`,
    `<defs>`,
    `<linearGradient id="cbg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/></linearGradient>`,
    `<linearGradient id="cshim" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="rgba(255,255,255,0.18)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></linearGradient>`,
    `</defs>`,
    `<rect width="${svgW}" height="${svgH}" fill="white"/>`,
    `<g transform="translate(${pad},${pad})">`,
    `<rect width="${bSize}" height="${bSize}" rx="${rx}" fill="url(#cbg)"/>`,
    `<rect width="${bSize}" height="${bSize / 2}" rx="${rx}" fill="url(#cshim)"/>`,
    `<rect x="4" y="4" width="${bSize - 8}" height="${bSize - 8}" rx="${rxInner}" fill="none" stroke="${border}" stroke-width="${strokeW}"/>`,
    `<text x="${textX1}" y="${textY}" font-family="Georgia,'Times New Roman',serif" font-size="${fSize}" font-weight="bold" fill="white" text-anchor="middle" opacity="0.92" letter-spacing="-${(2 * bSize / 120).toFixed(1)}">${l1}</text>`,
    `<text x="${textX2}" y="${textY}" font-family="Georgia,'Times New Roman',serif" font-size="${fSize}" font-weight="bold" fill="white" text-anchor="middle" opacity="0.78" letter-spacing="-${(2 * bSize / 120).toFixed(1)}">${l2}</text>`,
    `</g>`,
    `<text x="${pad + bSize + gap}" y="${Math.round(svgH / 2 + fontSize * 0.35)}" font-family="Arial,Helvetica,sans-serif" font-size="${fontSize}" font-weight="bold" fill="${accentColor}" letter-spacing="4">${displayName}</text>`,
    `</svg>`,
  ].join("");
  const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = svgW * scale; canvas.height = svgH * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, svgW, svgH);
    URL.revokeObjectURL(url);
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${(name || "advisor").replace(/\s+/g, "-").toLowerCase()}-header.png`;
    link.click();
  };
  img.src = url;
}
function downloadProfileImagePng(opts: { name: string; title: string; theme: string; themeColor?: string | null; profilePicUrl: string | null }) {
  const { name, title, theme, themeColor, profilePicUrl } = opts;
  const initials = makeInitials(name);
  const W = 600, BAR = 140;
  const hasPhoto = !!profilePicUrl;
  const PHOTO_H = hasPhoto ? W : 320;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = PHOTO_H + BAR;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { from, to } = getInitialsBadgeColors(theme, themeColor || undefined);
  const drawBadge = (bx: number, by: number, bs: number) => {
    const r = bs * 0.18;
    const grad = ctx.createLinearGradient(bx, by, bx + bs, by + bs);
    grad.addColorStop(0, from); grad.addColorStop(1, to);
    ctx.beginPath();
    ctx.moveTo(bx + r, by); ctx.lineTo(bx + bs - r, by); ctx.quadraticCurveTo(bx + bs, by, bx + bs, by + r);
    ctx.lineTo(bx + bs, by + bs - r); ctx.quadraticCurveTo(bx + bs, by + bs, bx + bs - r, by + bs);
    ctx.lineTo(bx + r, by + bs); ctx.quadraticCurveTo(bx, by + bs, bx, by + bs - r);
    ctx.lineTo(bx, by + r); ctx.quadraticCurveTo(bx, by, bx + r, by); ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();
    const shimGrad = ctx.createLinearGradient(bx, by, bx, by + bs / 2);
    shimGrad.addColorStop(0, "rgba(255,255,255,0.18)"); shimGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = shimGrad; ctx.fill();
    const fSize = bs * 0.52;
    ctx.font = `bold ${fSize}px Georgia, serif`; ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.92)"; ctx.fillText(initials[0] || "", bx + bs * 0.3, by + bs * 0.54);
    ctx.fillStyle = "rgba(255,255,255,0.78)"; ctx.fillText(initials[1] || "", bx + bs * 0.66, by + bs * 0.54);
  };
  const finalize = () => {
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, PHOTO_H, W, BAR);
    const BS = 80, BX = 24, BY = PHOTO_H + (BAR - BS) / 2;
    drawBadge(BX, BY, BS);
    const TX = BX + BS + 20;
    const nameSize = Math.min(32, Math.max(20, Math.floor(30 - (name || "").length * 0.3)));
    ctx.font = `bold ${nameSize}px Arial, sans-serif`; ctx.fillStyle = "#111111"; ctx.textBaseline = "middle";
    ctx.fillText((name || "Your Name").toUpperCase(), TX, PHOTO_H + BAR * 0.38);
    if (title) { ctx.font = `500 14px Arial, sans-serif`; ctx.fillStyle = "#666666"; ctx.fillText(title.toUpperCase(), TX, PHOTO_H + BAR * 0.68); }
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${(name || "advisor").replace(/\s+/g, "-").toLowerCase()}-profile.png`;
    link.click();
  };
  if (hasPhoto) {
    const img2 = new Image(); img2.crossOrigin = "anonymous";
    img2.onload = () => {
      const srcAspect = img2.naturalWidth / img2.naturalHeight;
      let sx = 0, sy = 0, sw = img2.naturalWidth, sh = img2.naturalHeight;
      if (srcAspect > 1) { sw = img2.naturalHeight; sx = (img2.naturalWidth - sw) / 2; }
      else if (srcAspect < 1) { sh = img2.naturalWidth; sy = (img2.naturalHeight - sh) / 2; }
      ctx.drawImage(img2, sx, sy, sw, sh, 0, 0, W, PHOTO_H); finalize();
    };
    img2.onerror = () => {
      const g = ctx.createLinearGradient(0, 0, W, PHOTO_H); g.addColorStop(0, from); g.addColorStop(1, to);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, PHOTO_H); drawBadge((W - 160) / 2, (PHOTO_H - 160) / 2, 160); finalize();
    };
    img2.src = profilePicUrl!;
  } else {
    const g = ctx.createLinearGradient(0, 0, W, PHOTO_H); g.addColorStop(0, from); g.addColorStop(1, to);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, PHOTO_H); drawBadge((W - 160) / 2, (PHOTO_H - 160) / 2, 160); finalize();
  }
}

function ShareAssetsCard({ advisor, tc }: { advisor: Advisor; tc: ReturnType<typeof getThemeColors> }) {
  const [busy, setBusy] = useState<{ variant: CardVariant; mode: "share" | "download" } | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const canShare = canShareCardNatively();

  const run = async (variant: CardVariant, mode: "share" | "download") => {
    if (busy) return;
    setBusy({ variant, mode });
    setStatus(null);
    try {
      const result = await shareOrDownloadCard({ advisor, variant, mode });
      if (result === "shared") setStatus("Shared.");
      else if (result === "downloaded") setStatus(mode === "share" ? "Sharing unavailable — downloaded instead." : "Downloaded.");
    } catch (e) {
      console.error("[share-assets] render failed", e);
      setStatus("Couldn't generate the card. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const variants: { key: CardVariant; title: string; dims: string; sub: string; aspect: { w: number; h: number } }[] = [
    { key: "portrait", title: "Portrait", dims: "1080 × 1920", sub: "Stories · WhatsApp Status · Reels cover", aspect: { w: 48, h: 84 } },
    { key: "square",   title: "Square",   dims: "1080 × 1080", sub: "Instagram / LinkedIn feed posts",         aspect: { w: 70, h: 70 } },
  ];

  const { from, to } = getInitialsBadgeColors(advisor.theme || "blue", (advisor as any).themeColor);

  return (
    <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }} data-testid="section-share-assets">
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4" style={{ color: tc.accentColor }} />
        <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Share Assets — Digital Business Card</h3>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: tc.mutedText }}>
        Auto-generated PNG with your photo, theme, contact details, QR code and profile link. Use it on WhatsApp, Instagram, LinkedIn or in email signatures. Footer carries <span className="font-medium">advisoryconnect.pro/privacy-policy</span> baked into the image.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {variants.map((v) => {
          const isBusy = busy?.variant === v.key;
          return (
            <div
              key={v.key}
              className="rounded-lg p-3 flex flex-col gap-3"
              style={{ backgroundColor: tc.buttonSecondaryBg, border: `1px solid ${tc.borderColor}` }}
              data-testid={`card-share-asset-${v.key}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="rounded-md shrink-0"
                  style={{
                    width: v.aspect.w,
                    height: v.aspect.h,
                    background: `linear-gradient(160deg, ${from}, ${to})`,
                    border: `1px solid ${tc.borderColor}`,
                  }}
                  aria-hidden
                />
                <div className="min-w-0">
                  <div className="text-sm font-semibold" style={{ color: tc.textColor }}>{v.title}</div>
                  <div className="text-[11px]" style={{ color: tc.mutedText }}>{v.dims}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: tc.mutedText }}>{v.sub}</div>
                </div>
              </div>
              <div className="flex gap-2">
                {canShare && (
                  <button
                    onClick={() => run(v.key, "share")}
                    disabled={!!busy}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: tc.accentColor, color: tc.buttonText }}
                    data-testid={`button-share-asset-share-${v.key}`}
                  >
                    {isBusy && busy?.mode === "share"
                      ? <><Loader2 className="h-3 w-3 animate-spin" />Preparing…</>
                      : <><Share2 className="h-3 w-3" />Share</>}
                  </button>
                )}
                <button
                  onClick={() => run(v.key, "download")}
                  disabled={!!busy}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{
                    backgroundColor: canShare ? "transparent" : tc.accentColor,
                    color: canShare ? tc.accentColor : tc.buttonText,
                    border: canShare ? `1px solid ${tc.borderColor}` : "none",
                  }}
                  data-testid={`button-share-asset-download-${v.key}`}
                >
                  {isBusy && busy?.mode === "download"
                    ? <><Loader2 className="h-3 w-3 animate-spin" />Rendering…</>
                    : <><Download className="h-3 w-3" />Download</>}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {status && (
        <div className="text-[11px]" style={{ color: tc.mutedText }} data-testid="text-share-assets-status">{status}</div>
      )}
      {!canShare && (
        <div className="text-[10px] leading-relaxed" style={{ color: tc.mutedText }}>
          Native share isn't available in this browser. Open the panel on a mobile device for one-tap sharing.
        </div>
      )}
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
  // Auto-migrate: pre-fill colour picker with stored hex, falling back to the
  // legacy theme→hex map for any rows that pre-date the picker.
  const THEME_HEX_MAP: Record<string, string> = { dark:"#1a1a1a", blue:"#4a8db5", pink:"#be185d", "light-blue":"#0ea5e9", "dark-royal-purple":"#a855f7", "dark-green":"#22c55e", gold:"#d4a017", teal:"#0d9488", red:"#dc2626", navy:"#1d4ed8", coral:"#f97316", silver:"#6b7280" };
  const [themeColor, setThemeColor] = useState<string>((advisor as any).themeColor || THEME_HEX_MAP[advisor.theme || "blue"] || "#4a8db5");
  const [backgroundStyle, setBackgroundStyle] = useState<number>((advisor as any).backgroundStyle || 1);
  const [email, setEmail] = useState(advisor.email || "");
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
  const [showTools, setShowTools] = useState(!!(advisor as any).showTools);
  const [showMoneywebFeed, setShowMoneywebFeed] = useState(!!(advisor as any).showMoneywebFeed);
  const [showLiberty, setShowLiberty] = useState(!!(advisor as any).showLiberty);
  const [showStanlib, setShowStanlib] = useState(!!(advisor as any).showStanlib);
  const [showSigninghub, setShowSigninghub] = useState(!!(advisor as any).showSigninghub);
  const [showMyEmail, setShowMyEmail] = useState(!!(advisor as any).showMyEmail);
  // Task #29 — Public Profile Feature Suite toggles
  const [showTradingView, setShowTradingView] = useState(!!(advisor as any).showTradingView);
  const [tradingViewSymbols, setTradingViewSymbols] = useState<string[]>(() => {
    const csv = (advisor as any).tradingViewSymbols as string | null;
    return csv ? csv.split(",").map(s => s.trim()).filter(Boolean) : ["FX_IDC:USDZAR", "JSE:J203", "TVC:GOLD"];
  });
  const [showDailyQuotes, setShowDailyQuotes] = useState(!!(advisor as any).showDailyQuotes);
  const [dailyQuotesSet, setDailyQuotesSet] = useState<string>((advisor as any).dailyQuotesSet || "general");
  const [showCompoundCalc, setShowCompoundCalc] = useState(!!(advisor as any).showCompoundCalc);
  const [showRetirementCalc, setShowRetirementCalc] = useState(!!(advisor as any).showRetirementCalc);
  const [showFinancialCalendar, setShowFinancialCalendar] = useState(!!(advisor as any).showFinancialCalendar);
  const [showFunFacts, setShowFunFacts] = useState(!!(advisor as any).showFunFacts);
  const [showForex, setShowForex] = useState(!!(advisor as any).showForex);
  const [showSecondNews, setShowSecondNews] = useState(!!(advisor as any).showSecondNews);
  const [showToolTax, setShowToolTax] = useState((advisor as any).showToolTax !== false);
  const [showToolExchange, setShowToolExchange] = useState((advisor as any).showToolExchange !== false);
  const [showToolCompound, setShowToolCompound] = useState((advisor as any).showToolCompound !== false);
  const [showToolPension, setShowToolPension] = useState((advisor as any).showToolPension !== false);
  const [showToolCgt, setShowToolCgt] = useState((advisor as any).showToolCgt !== false);
  const [showToolVehicle, setShowToolVehicle] = useState((advisor as any).showToolVehicle !== false);
  const [showToolReality, setShowToolReality] = useState((advisor as any).showToolReality !== false);
  const [showToolLatte, setShowToolLatte] = useState((advisor as any).showToolLatte !== false);
  const [showInteractive, setShowInteractive] = useState((advisor as any).showInteractive !== false);
  const [showShowpieceSqueeze, setShowShowpieceSqueeze] = useState((advisor as any).showShowpieceSqueeze !== false);
  const [showShowpieceTaxBite, setShowShowpieceTaxBite] = useState((advisor as any).showShowpieceTaxBite !== false);
  const [showShowpieceInflation, setShowShowpieceInflation] = useState((advisor as any).showShowpieceInflation !== false);
  const [showShowpieceWaiting, setShowShowpieceWaiting] = useState((advisor as any).showShowpieceWaiting !== false);
  const [showToolBond, setShowToolBond] = useState((advisor as any).showToolBond !== false);
  const [showToolEmergency, setShowToolEmergency] = useState((advisor as any).showToolEmergency !== false);
  const [showToolLifeCover, setShowToolLifeCover] = useState((advisor as any).showToolLifeCover !== false);
  const [showToolDebt, setShowToolDebt] = useState((advisor as any).showToolDebt !== false);
  const [patternOpacity, setPatternOpacity] = useState<number>((advisor as any).patternOpacity ?? 50);
  const [showEmergencyContacts, setShowEmergencyContacts] = useState(!!(advisor as any).showEmergencyContacts);
  const [indServicesOpen, setIndServicesOpen] = useState(false);
  const [corpServicesOpen, setCorpServicesOpen] = useState(false);
  const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    const raw = (advisor as any).profileSectionOrder as string | null;
    const allowed = new Set<string>(DEFAULT_PROFILE_SECTION_ORDER as readonly string[]);
    const stored = raw ? raw.split(",").filter(Boolean).filter(k => allowed.has(k)) : [];
    const merged = [...stored];
    for (const k of DEFAULT_PROFILE_SECTION_ORDER) if (!merged.includes(k)) merged.push(k);
    return merged.length ? merged : [...DEFAULT_PROFILE_SECTION_ORDER];
  });
  const [organizingProfile, setOrganizingProfile] = useState(false);

  const moveSectionUp = (idx: number) => {
    if (idx === 0) return;
    setSectionOrder(o => { const n = [...o]; [n[idx-1], n[idx]] = [n[idx], n[idx-1]]; return n; });
  };
  const moveSectionDown = (idx: number) => {
    setSectionOrder(o => { if (idx >= o.length-1) return o; const n = [...o]; [n[idx], n[idx+1]] = [n[idx+1], n[idx]]; return n; });
  };

  const savedScrollYRef = useRef<number | null>(null);
  const saveMutation = useMutation({
    onMutate: () => {
      savedScrollYRef.current = window.scrollY;
    },
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/advisors/${advisor.id}`, {
        name,
        email: email.trim() || advisor.email,
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
        backgroundStyle,
        themeColor,
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
        showMoneywebFeed,
        showLiberty,
        showStanlib,
        showSigninghub,
        showMyEmail,
        showTradingView,
        tradingViewSymbols: tradingViewSymbols.join(","),
        showDailyQuotes,
        dailyQuotesSet,
        showCompoundCalc,
        showRetirementCalc,
        showFinancialCalendar,
        showFunFacts,
        showForex,
        showSecondNews,
        showTools,
        showToolTax,
        showToolExchange,
        showToolCompound,
        showToolPension,
        showToolCgt,
        showToolVehicle,
        showToolReality,
        showToolLatte,
        showInteractive,
        showShowpieceSqueeze,
        showShowpieceTaxBite,
        showShowpieceInflation,
        showShowpieceWaiting,
        showToolBond,
        showToolEmergency,
        showToolLifeCover,
        showToolDebt,
        patternOpacity,
        showEmergencyContacts,
        profileSectionOrder: sectionOrder.join(","),
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
    onSettled: () => {
      const y = savedScrollYRef.current;
      if (y == null) return;
      const restore = () => window.scrollTo({ top: y, left: 0, behavior: "auto" });
      requestAnimationFrame(() => {
        restore();
        requestAnimationFrame(restore);
        setTimeout(restore, 80);
        setTimeout(restore, 250);
        setTimeout(() => { restore(); savedScrollYRef.current = null; }, 600);
      });
    },
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
      const [header, b64] = dataUrl.split(",");
      const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
      const bytes = atob(b64);
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      const blob = new Blob([arr], { type: mime });
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
    const { from, to, border } = getInitialsBadgeColors(theme, themeColor);
    const accentColor = getThemeColors(theme, themeColor).accentColor;
    const l1 = initials[0] || "";
    const l2 = initials[1] || "";
    const displayName = (name || "Your Name").toUpperCase();

    const bSize = 200;
    const pad = 30;
    const gap = 48;
    const fontSize = 120;
    const approxTextW = displayName.length * (fontSize * 0.62);
    const svgW = Math.round(pad + bSize + gap + approxTextW + pad);
    const svgH = bSize + pad * 2;
    const rx = Math.round(bSize * 22 / 120);
    const rxInner = Math.round(bSize * 19 / 120);
    const strokeW = (1.8 * bSize / 120).toFixed(1);
    const textX1 = Math.round(38 * bSize / 120);
    const textX2 = Math.round(82 * bSize / 120);
    const textY = Math.round(84 * bSize / 120);
    const fSize = Math.round(62 * bSize / 120);

    const svgContent = [
      `<svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">`,
      `<defs>`,
      `<linearGradient id="cbg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/></linearGradient>`,
      `<linearGradient id="cshim" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="rgba(255,255,255,0.18)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></linearGradient>`,
      `</defs>`,
      `<rect width="${svgW}" height="${svgH}" fill="white"/>`,
      `<g transform="translate(${pad},${pad})">`,
      `<rect width="${bSize}" height="${bSize}" rx="${rx}" fill="url(#cbg)"/>`,
      `<rect width="${bSize}" height="${bSize / 2}" rx="${rx}" fill="url(#cshim)"/>`,
      `<rect x="4" y="4" width="${bSize - 8}" height="${bSize - 8}" rx="${rxInner}" fill="none" stroke="${border}" stroke-width="${strokeW}"/>`,
      `<text x="${textX1}" y="${textY}" font-family="Georgia,'Times New Roman',serif" font-size="${fSize}" font-weight="bold" fill="white" text-anchor="middle" opacity="0.92" letter-spacing="-${(2 * bSize / 120).toFixed(1)}">${l1}</text>`,
      `<text x="${textX2}" y="${textY}" font-family="Georgia,'Times New Roman',serif" font-size="${fSize}" font-weight="bold" fill="white" text-anchor="middle" opacity="0.78" letter-spacing="-${(2 * bSize / 120).toFixed(1)}">${l2}</text>`,
      `</g>`,
      `<text x="${pad + bSize + gap}" y="${Math.round(svgH / 2 + fontSize * 0.35)}" font-family="Arial,Helvetica,sans-serif" font-size="${fontSize}" font-weight="bold" fill="${accentColor}" letter-spacing="4">${displayName}</text>`,
      `</svg>`,
    ].join("");

    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = svgW * scale;
      canvas.height = svgH * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, svgW, svgH);
      URL.revokeObjectURL(url);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${(name || "advisor").replace(/\s+/g, "-").toLowerCase()}-header.png`;
      link.click();
    };
    img.src = url;
  };

  const handleDownloadProfileImage = () => {
    const W = 600;
    const BAR = 140;
    const hasPhoto = !!profilePicUrl;
    const PHOTO_H = hasPhoto ? W : 320;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = PHOTO_H + BAR;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { from, to } = getInitialsBadgeColors(theme, themeColor);
    const drawBadge = (bx: number, by: number, bs: number) => {
      const r = bs * 0.18;
      const grad = ctx.createLinearGradient(bx, by, bx + bs, by + bs);
      grad.addColorStop(0, from); grad.addColorStop(1, to);
      ctx.beginPath();
      ctx.moveTo(bx + r, by); ctx.lineTo(bx + bs - r, by); ctx.quadraticCurveTo(bx + bs, by, bx + bs, by + r);
      ctx.lineTo(bx + bs, by + bs - r); ctx.quadraticCurveTo(bx + bs, by + bs, bx + bs - r, by + bs);
      ctx.lineTo(bx + r, by + bs); ctx.quadraticCurveTo(bx, by + bs, bx, by + bs - r);
      ctx.lineTo(bx, by + r); ctx.quadraticCurveTo(bx, by, bx + r, by); ctx.closePath();
      ctx.fillStyle = grad; ctx.fill();
      const shimGrad = ctx.createLinearGradient(bx, by, bx, by + bs / 2);
      shimGrad.addColorStop(0, "rgba(255,255,255,0.18)"); shimGrad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = shimGrad; ctx.fill();
      const fontSize = bs * 0.52;
      ctx.font = `bold ${fontSize}px Georgia, serif`; ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255,255,255,0.92)"; ctx.fillText(initials[0] || "", bx + bs * 0.3, by + bs * 0.54);
      ctx.fillStyle = "rgba(255,255,255,0.78)"; ctx.fillText(initials[1] || "", bx + bs * 0.66, by + bs * 0.54);
    };
    const finalize = () => {
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, PHOTO_H, W, BAR);
      const BS = 80, BX = 24, BY = PHOTO_H + (BAR - BS) / 2;
      drawBadge(BX, BY, BS);
      const TX = BX + BS + 20;
      const nameSize = Math.min(32, Math.max(20, Math.floor(30 - (name || "").length * 0.3)));
      ctx.font = `bold ${nameSize}px Arial, sans-serif`; ctx.fillStyle = "#111111"; ctx.textBaseline = "middle";
      ctx.fillText((name || "Your Name").toUpperCase(), TX, PHOTO_H + BAR * 0.38);
      if (title) { ctx.font = `500 14px Arial, sans-serif`; ctx.fillStyle = "#666666"; ctx.fillText(title.toUpperCase(), TX, PHOTO_H + BAR * 0.68); }
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${(name || "advisor").replace(/\s+/g, "-").toLowerCase()}-profile.png`;
      link.click();
    };
    if (hasPhoto) {
      const img2 = new Image(); img2.crossOrigin = "anonymous";
      img2.onload = () => {
        const srcAspect = img2.naturalWidth / img2.naturalHeight;
        let sx = 0, sy = 0, sw = img2.naturalWidth, sh = img2.naturalHeight;
        if (srcAspect > 1) { sw = img2.naturalHeight; sx = (img2.naturalWidth - sw) / 2; }
        else if (srcAspect < 1) { sh = img2.naturalWidth; sy = (img2.naturalHeight - sh) / 2; }
        ctx.drawImage(img2, sx, sy, sw, sh, 0, 0, W, PHOTO_H); finalize();
      };
      img2.onerror = () => {
        const g = ctx.createLinearGradient(0, 0, W, PHOTO_H); g.addColorStop(0, from); g.addColorStop(1, to);
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, PHOTO_H); drawBadge((W - 160) / 2, (PHOTO_H - 160) / 2, 160); finalize();
      };
      img2.src = profilePicUrl!;
    } else {
      const g = ctx.createLinearGradient(0, 0, W, PHOTO_H); g.addColorStop(0, from); g.addColorStop(1, to);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, PHOTO_H); drawBadge((W - 160) / 2, (PHOTO_H - 160) / 2, 160); finalize();
    }
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
        <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Header Image</h3>
        <p className="text-xs" style={{ color: tc.mutedText }}>Auto-generated from your name and theme. Download as PNG for use on emails, letterheads, or social media.</p>
        <div className="flex items-center gap-4 rounded-xl px-5 py-4" style={{ backgroundColor: "#ffffff" }}>
          <InitialsBadgeSvg initials={initials} theme={theme} size={64} id="panel-badge-svg" />
          <span className="font-bold tracking-widest leading-none truncate" style={{ color: tc.accentColor, fontSize: 28, textTransform: "uppercase", letterSpacing: 4 }}>
            {name || "Your Name"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDownloadBadge}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-70"
            style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor, border: `1px solid ${tc.borderColor}` }}
            data-testid="button-download-badge"
          >
            <Download className="h-3 w-3" /> Download Header PNG
          </button>
          <button
            onClick={handleDownloadProfileImage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-70"
            style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}
            data-testid="button-download-profile-image"
          >
            <Download className="h-3 w-3" /> Download Profile Image
          </button>
        </div>
      </div>

      {/* Task #28 — Share Assets: Digital Business Card (Portrait + Square) */}
      <ShareAssetsCard advisor={advisor} tc={tc} />

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
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setIndServicesOpen(v => !v)}
            className="flex items-center gap-2 flex-1 min-w-0 text-left"
            data-testid="toggle-ind-services-open"
          >
            {indServicesOpen ? <ChevronUp className="h-4 w-4 flex-shrink-0" style={{ color: tc.mutedText }} /> : <ChevronDown className="h-4 w-4 flex-shrink-0" style={{ color: tc.mutedText }} />}
            <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Individual Services</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.mutedText }}>{selectedIndividual.length}/{INDIVIDUAL_SERVICES.length}</span>
          </button>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs" style={{ color: tc.mutedText }}>Show</span>
            <div onClick={() => setShowIndividualServices(v => !v)} className="w-8 h-4 rounded-full relative cursor-pointer" style={{ backgroundColor: showIndividualServices ? tc.checkActive : tc.checkInactive }}>
              <div className="absolute top-0.5 w-3 h-3 rounded-full transition-all" style={{ left: showIndividualServices ? "17px" : "2px", backgroundColor: showIndividualServices ? tc.checkDotActive : tc.checkDotInactive }} />
            </div>
          </div>
        </div>
        {!indServicesOpen && selectedIndividual.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {INDIVIDUAL_SERVICES.filter(s => selectedIndividual.includes(s.key)).map(s => (
              <span key={s.key} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor, border: `1px solid ${tc.borderColor}` }}>{s.name}</span>
            ))}
          </div>
        )}
        {!indServicesOpen && selectedIndividual.length === 0 && (
          <p className="text-xs italic" style={{ color: tc.mutedText }}>No services selected — tap to choose.</p>
        )}
        {indServicesOpen && (
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
            <button type="button" onClick={() => setIndServicesOpen(false)} className="w-full text-[11px] py-1.5 rounded-md font-medium" style={{ color: tc.accentColor, border: `1px solid ${tc.borderColor}` }} data-testid="button-collapse-ind-services">Done — collapse</button>
          </div>
        )}
      </div>

      <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setCorpServicesOpen(v => !v)}
            className="flex items-center gap-2 flex-1 min-w-0 text-left"
            data-testid="toggle-corp-services-open"
          >
            {corpServicesOpen ? <ChevronUp className="h-4 w-4 flex-shrink-0" style={{ color: tc.mutedText }} /> : <ChevronDown className="h-4 w-4 flex-shrink-0" style={{ color: tc.mutedText }} />}
            <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Corporate Services</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.mutedText }}>{selectedCorporate.length}/{CORPORATE_SERVICES.length}</span>
          </button>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs" style={{ color: tc.mutedText }}>Show</span>
            <div onClick={() => setShowCorporateServices(v => !v)} className="w-8 h-4 rounded-full relative cursor-pointer" style={{ backgroundColor: showCorporateServices ? tc.checkActive : tc.checkInactive }}>
              <div className="absolute top-0.5 w-3 h-3 rounded-full transition-all" style={{ left: showCorporateServices ? "17px" : "2px", backgroundColor: showCorporateServices ? tc.checkDotActive : tc.checkDotInactive }} />
            </div>
          </div>
        </div>
        {!corpServicesOpen && selectedCorporate.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {CORPORATE_SERVICES.filter(s => selectedCorporate.includes(s.key)).map(s => (
              <span key={s.key} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor, border: `1px solid ${tc.borderColor}` }}>{s.name}</span>
            ))}
          </div>
        )}
        {!corpServicesOpen && selectedCorporate.length === 0 && (
          <p className="text-xs italic" style={{ color: tc.mutedText }}>No services selected — tap to choose.</p>
        )}
        {corpServicesOpen && (
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
            <button type="button" onClick={() => setCorpServicesOpen(false)} className="w-full text-[11px] py-1.5 rounded-md font-medium" style={{ color: tc.accentColor, border: `1px solid ${tc.borderColor}` }} data-testid="button-collapse-corp-services">Done — collapse</button>
          </div>
        )}
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
            <Mail className="h-4 w-4 flex-shrink-0" style={{ color: tc.mutedText }} />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" className="flex-1 px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }} data-testid="input-notification-email" />
          </div>
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
          { label: "Complimentary Will", value: showComplimentaryWill, set: setShowComplimentaryWill },
          { label: "Live News Feed", value: showMoneywebFeed, set: setShowMoneywebFeed },
          { label: "More Finance News (second feed)", value: showSecondNews, set: setShowSecondNews },
          { label: "Live Exchange Rates", value: showForex, set: setShowForex },
          { label: "Financial Facts of the Day", value: showFunFacts, set: setShowFunFacts },
          { label: "Financial Tools Section", value: showTools, set: setShowTools },
          { label: "Emergency Contacts", value: showEmergencyContacts, set: setShowEmergencyContacts },
          { label: "My Liberty (Platforms)", value: showLiberty, set: setShowLiberty },
          { label: "Stanlib (Platforms)", value: showStanlib, set: setShowStanlib },
          { label: "SigningHub (Platforms)", value: showSigninghub, set: setShowSigninghub },
          { label: "My Email (Platforms)", value: showMyEmail, set: setShowMyEmail },
          { label: "Live Markets (TradingView)", value: showTradingView, set: setShowTradingView },
          { label: "Daily Quote Card", value: showDailyQuotes, set: setShowDailyQuotes },
          { label: "Compound Interest Calculator", value: showCompoundCalc, set: setShowCompoundCalc },
          { label: "Retirement Savings Calculator", value: showRetirementCalc, set: setShowRetirementCalc },
          { label: "Financial Calendar Widget", value: showFinancialCalendar, set: setShowFinancialCalendar },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between py-1.5">
            <span className="text-sm" style={{ color: tc.textColor }}>{item.label}</span>
            <div onClick={() => item.set(v => !v)} className="w-9 h-5 rounded-full relative cursor-pointer" style={{ backgroundColor: item.value ? tc.checkActive : tc.checkInactive }}>
              <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all" style={{ left: item.value ? "18px" : "2px", backgroundColor: item.value ? tc.checkDotActive : tc.checkDotInactive }} />
            </div>
          </div>
        ))}
        {showTradingView && (
          <div className="pt-2 space-y-1.5" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
            <p className="text-xs font-medium" style={{ color: tc.mutedText }}>TradingView instruments (max 8):</p>
            <div className="grid grid-cols-2 gap-1">
              {TRADINGVIEW_SYMBOLS_PANEL.map(sym => {
                const checked = tradingViewSymbols.includes(sym.value);
                return (
                  <label key={sym.value} className="flex items-center gap-2 text-xs cursor-pointer py-1 px-1" style={{ color: tc.textColor }}>
                    <input type="checkbox" checked={checked} onChange={() => {
                      setTradingViewSymbols(prev => {
                        if (checked) return prev.filter(v => v !== sym.value);
                        if (prev.length >= 8) return prev;
                        return [...prev, sym.value];
                      });
                    }} data-testid={`check-tv-${sym.value}`} />
                    <span>{sym.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
        {showDailyQuotes && (
          <div className="pt-2 space-y-1.5" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
            <p className="text-xs font-medium" style={{ color: tc.mutedText }}>Quote set:</p>
            <div className="flex gap-2">
              {[{ k: "general", l: "General Inspiration" }, { k: "investment", l: "Investment / Finance" }].map(opt => (
                <button key={opt.k} type="button" onClick={() => setDailyQuotesSet(opt.k)} className="px-3 py-1.5 rounded-md text-xs font-medium" style={{ backgroundColor: dailyQuotesSet === opt.k ? tc.buttonBg : tc.inputBg, color: dailyQuotesSet === opt.k ? tc.buttonText : tc.textColor, border: `1px solid ${dailyQuotesSet === opt.k ? tc.buttonBg : tc.borderColor}` }} data-testid={`btn-quoteset-${opt.k}`}>{opt.l}</button>
              ))}
            </div>
          </div>
        )}
        {showTools && (
          <div className="pt-2 space-y-1.5" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
            <p className="text-xs font-medium" style={{ color: tc.mutedText }}>Tools visible on profile:</p>
            {[
              { label: "SA Tax Calculator", value: showToolTax, set: setShowToolTax },
              { label: "Exchange Rate Converter", value: showToolExchange, set: setShowToolExchange },
              { label: "Compound Interest Calculator", value: showToolCompound, set: setShowToolCompound },
              { label: "Pension Fund Calculator", value: showToolPension, set: setShowToolPension },
              { label: "Capital Gains Tax Calculator", value: showToolCgt, set: setShowToolCgt },
              { label: "Vehicle & Assets Calculator", value: showToolVehicle, set: setShowToolVehicle },
              { label: "Bond / Home Loan Calculator", value: showToolBond, set: setShowToolBond },
              { label: "Emergency Fund Calculator", value: showToolEmergency, set: setShowToolEmergency },
              { label: "Life Cover Needs Calculator", value: showToolLifeCover, set: setShowToolLifeCover },
              { label: "Debt Payoff Calculator", value: showToolDebt, set: setShowToolDebt },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-1 pl-2">
                <span className="text-xs" style={{ color: tc.textColor }}>{item.label}</span>
                <div onClick={() => item.set(v => !v)} className="w-9 h-5 rounded-full relative cursor-pointer" style={{ backgroundColor: item.value ? tc.checkActive : tc.checkInactive }}>
                  <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all" style={{ left: item.value ? "18px" : "2px", backgroundColor: item.value ? tc.checkDotActive : tc.checkDotInactive }} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between py-1.5" style={{ borderTop: `1px solid ${tc.borderColor}`, paddingTop: "12px" }}>
          <span className="text-sm" style={{ color: tc.textColor }}>Interactive Financial Tools</span>
          <div onClick={() => setShowInteractive(v => !v)} className="w-9 h-5 rounded-full relative cursor-pointer" style={{ backgroundColor: showInteractive ? tc.checkActive : tc.checkInactive }}>
            <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all" style={{ left: showInteractive ? "18px" : "2px", backgroundColor: showInteractive ? tc.checkDotActive : tc.checkDotInactive }} />
          </div>
        </div>
        {showInteractive && (
          <div className="pt-2 space-y-1.5" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
            <p className="text-xs font-medium" style={{ color: tc.mutedText }}>Interactive tools visible on profile:</p>
            {[
              { label: "Real Money Squeeze", value: showShowpieceSqueeze, set: setShowShowpieceSqueeze },
              { label: "Tax Bite", value: showShowpieceTaxBite, set: setShowShowpieceTaxBite },
              { label: "Inflation Eats Your Million", value: showShowpieceInflation, set: setShowShowpieceInflation },
              { label: "The Cost of Waiting", value: showShowpieceWaiting, set: setShowShowpieceWaiting },
              { label: "30-Year Reality Check", value: showToolReality, set: setShowToolReality },
              { label: "The Latte Millionaire", value: showToolLatte, set: setShowToolLatte },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-1 pl-2">
                <span className="text-xs" style={{ color: tc.textColor }}>{item.label}</span>
                <div onClick={() => item.set(v => !v)} className="w-9 h-5 rounded-full relative cursor-pointer" style={{ backgroundColor: item.value ? tc.checkActive : tc.checkInactive }}>
                  <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all" style={{ left: item.value ? "18px" : "2px", backgroundColor: item.value ? tc.checkDotActive : tc.checkDotInactive }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
        <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Theme</h3>
        <p className="text-xs leading-relaxed" style={{ color: tc.mutedText }}>
          Pick one of our themes — your profile background, buttons, and badges all derive from it. Or tap Custom to choose any colour from the wheel.
        </p>
        <ColourPicker
          value={theme}
          themeColor={themeColor}
          onChange={(name, hex) => { setTheme(name); setThemeColor(hex); }}
          tc={tc}
          testIdPrefix="profile-theme"
        />
      </div>

      {/* Section Order — collapsed by default to keep the panel tidy */}
      <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setOrganizingProfile(v => !v)}
            className="flex items-center gap-2 flex-1 min-w-0 text-left"
            data-testid="toggle-section-order-open"
          >
            {organizingProfile ? <ChevronUp className="h-4 w-4 flex-shrink-0" style={{ color: tc.mutedText }} /> : <ChevronDown className="h-4 w-4 flex-shrink-0" style={{ color: tc.mutedText }} />}
            <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Section Order</h3>
            {(() => {
              const isDefault = sectionOrder.length === DEFAULT_PROFILE_SECTION_ORDER.length && sectionOrder.every((k, i) => k === DEFAULT_PROFILE_SECTION_ORDER[i]);
              return (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.mutedText }}>
                  {isDefault ? "Default" : "Custom"}
                </span>
              );
            })()}
          </button>
          {!organizingProfile && (
            <button
              type="button"
              onClick={() => setOrganizingProfile(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0"
              style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor, border: `1px solid ${tc.borderColor}` }}
              data-testid="button-organize-sections"
            >
              <GripVertical className="h-3.5 w-3.5" />
              Reorder
            </button>
          )}
        </div>
        {!organizingProfile ? (
          <p className="text-xs" style={{ color: tc.mutedText }}>
            Sections appear on your public profile in the recommended order. Tap <strong>Reorder</strong> to customise.
          </p>
        ) : (
          <>
            <p className="text-xs" style={{ color: tc.mutedText }}>Use the arrows to move sections up or down. Changes save when you hit <strong>Save Changes</strong> below.</p>
            <div className="space-y-1.5">
              {sectionOrder.map((key, idx) => (
                <div key={key} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.borderColor}` }}>
                  <span className="text-[10px] font-bold w-4 text-center" style={{ color: tc.accentColor }}>{idx + 1}</span>
                  <span className="flex-1 text-xs font-medium" style={{ color: tc.textColor }}>{PROFILE_SECTION_LABELS[key] || key}</span>
                  <div className="flex gap-1">
                    <button onClick={() => moveSectionUp(idx)} disabled={idx === 0} className="p-1 rounded hover:opacity-70 disabled:opacity-25 transition-opacity" style={{ color: tc.accentColor }} data-testid={`button-move-up-${key}`}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => moveSectionDown(idx)} disabled={idx === sectionOrder.length - 1} className="p-1 rounded hover:opacity-70 disabled:opacity-25 transition-opacity" style={{ color: tc.accentColor }} data-testid={`button-move-down-${key}`}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSectionOrder([...DEFAULT_PROFILE_SECTION_ORDER])}
                className="flex-1 text-[11px] py-1.5 rounded-md font-medium"
                style={{ color: tc.mutedText, border: `1px solid ${tc.borderColor}` }}
                data-testid="button-reset-section-order"
              >
                Reset to default
              </button>
              <button
                type="button"
                onClick={() => setOrganizingProfile(false)}
                className="flex-1 text-[11px] py-1.5 rounded-md font-medium"
                style={{ color: tc.accentColor, border: `1px solid ${tc.accentColor}` }}
                data-testid="button-collapse-section-order"
              >
                Done — collapse
              </button>
            </div>
          </>
        )}
      </div>

      <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
        <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Background Pattern</h3>
        <div className="grid grid-cols-3 gap-2">
          {BACKGROUND_STYLE_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setBackgroundStyle(opt.value)}
              className="rounded-lg border-2 py-2 px-1 text-center transition-all text-xs font-medium"
              style={{ borderColor: backgroundStyle === opt.value ? tc.accentColor : tc.borderColor, color: backgroundStyle === opt.value ? tc.accentColor : tc.mutedText, backgroundColor: backgroundStyle === opt.value ? tc.buttonSecondaryBg : "transparent" }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {backgroundStyle > 1 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center">
              <span className="text-xs" style={{ color: tc.mutedText }}>Pattern Intensity</span>
              <span className="text-xs font-medium" style={{ color: tc.accentColor }}>{patternOpacity}%</span>
            </div>
            <input type="range" min={5} max={100} step={5} value={patternOpacity}
              onChange={e => setPatternOpacity(parseInt(e.target.value))}
              className="w-full" style={{ accentColor: tc.accentColor }}
            />
            <div className="flex justify-between text-xs" style={{ color: tc.mutedText }}>
              <span>Barely visible</span><span>Solid</span>
            </div>
          </div>
        )}
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
    dark: "#555", blue: "#3b82f6", pink: "#be185d", "light-blue": "#0ea5e9",
    "dark-royal-purple": "#a855f7", "dark-green": "#22c55e",
    gold: "#d4a017", teal: "#0d9488", red: "#dc2626",
    navy: "#1d4ed8", coral: "#f97316", silver: "#6b7280",
  };
  return dots[theme] || "#3b82f6";
}
function getThemeLabel(theme: string) {
  const labels: Record<string, string> = {
    dark: "Black", silver: "Silver", pink: "Pink", "dark-royal-purple": "Purple",
    "dark-green": "Green", teal: "Teal", "light-blue": "Light Blue", navy: "Dark Blue",
    blue: "Light Blue", gold: "Green", red: "Pink", coral: "Pink",
  };
  return labels[theme] || theme;
}

function ProfileCard({
  profileSlug, title, theme, themeColor, tc, label, isPrimary, onEditClick, onDeleteClick, nickname, profileDesc,
  name, profilePicUrl,
}: {
  profileSlug: string; title: string; theme: string; themeColor?: string | null; tc: ReturnType<typeof getThemeColors>;
  label: string; isPrimary: boolean; onEditClick: () => void; onDeleteClick?: () => void;
  nickname?: string; profileDesc?: string;
  name: string; profilePicUrl?: string | null;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const url = `app.advisoryconnect.pro/${profileSlug}`;
  // M3: pass themeColor through so when the advisor picks a custom hex via the
  // ColourPicker, the dropdown overview card gradient + accent border reflect
  // it immediately (previously stuck on the legacy theme→hex map and ignored).
  const themeAccent = getThemeColors(theme, themeColor).accentColor;
  const badgeColors = getInitialsBadgeColors(theme, themeColor);
  const initials = getInitials(name);
  const hasAdminNotes = !!(nickname || profileDesc);
  // Inner contrast palette — always dark surface + white text inside the card,
  // regardless of the host control-panel theme, so buttons & notes stay legible.
  const innerBg = "rgba(0,0,0,0.55)";
  const innerBorder = "rgba(255,255,255,0.18)";
  const innerText = "#ffffff";
  const innerMuted = "rgba(255,255,255,0.78)";

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${url}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => toast({ title: "Copy failed", variant: "destructive" }));
  };

  return (
    <div
      className="relative rounded-2xl p-3 pt-7 space-y-3"
      style={{
        background: `linear-gradient(135deg, ${badgeColors.from}, ${badgeColors.to})`,
        border: `2px solid ${themeAccent}`,
        boxShadow: `0 6px 24px rgba(0,0,0,0.35)`,
      }}
    >
      <span
        className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap shadow-sm z-10"
        style={{ backgroundColor: "#ffffff", color: badgeColors.from }}
        data-testid={`badge-${isPrimary ? "primary" : "secondary"}-${profileSlug}`}
      >
        {isPrimary ? "Primary" : "Secondary"}
      </span>
      <div className="grid grid-cols-[1fr_1.2fr] gap-3">
        {/* A3 — Profile Picture (large square, left) */}
        <div
          className="aspect-square rounded-xl overflow-hidden flex items-center justify-center"
          style={{ backgroundColor: innerBg, border: `1px solid ${innerBorder}` }}
          data-testid={`pic-profile-${profileSlug}`}
        >
          {profilePicUrl ? (
            <img src={profilePicUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-3xl font-bold" style={{ color: innerText }}>{initials}</div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-2 min-w-0">
          {/* Top row: A2 notes (wide) — badge moved to absolute top-right of card */}
          <div className="rounded-lg p-1.5 min-h-[58px]" style={{ backgroundColor: innerBg, border: `1px solid ${innerBorder}` }}>
            <div className="text-[9px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>Admin Notes</div>
            {hasAdminNotes ? (
              <div className="text-[11px] leading-snug" style={{ color: innerText }} data-testid={`text-notes-${profileSlug}`}>
                {nickname && <div className="font-semibold truncate">"{nickname}"</div>}
                {profileDesc && <div className="italic line-clamp-2 mt-0.5" style={{ color: innerMuted }}>{profileDesc}</div>}
              </div>
            ) : (
              <div className="text-[10px] italic" style={{ color: "rgba(255,255,255,0.6)" }}>
                Add a nickname &amp; description in Edit Profile.
              </div>
            )}
          </div>

          {/* Middle row: A4 Copy/Share + A5 View Profile */}
          <div className="grid grid-cols-2 gap-2 flex-1">
            <button
              onClick={handleCopy}
              className="rounded-lg p-2 flex flex-col items-center justify-center gap-1 transition-opacity hover:opacity-80"
              style={{ backgroundColor: "#ffffff", color: badgeColors.from, border: `1px solid rgba(255,255,255,0.4)` }}
              data-testid={`button-copy-${profileSlug}`}
            >
              {copied ? <Check className="h-4 w-4" style={{ color: "#16a34a" }} /> : <Copy className="h-4 w-4" />}
              <span className="text-[10px] font-bold leading-tight text-center">{copied ? "Copied!" : "Copy / Share"}</span>
            </button>
            <a
              href={`/${profileSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-2 flex flex-col items-center justify-center gap-1 transition-opacity hover:opacity-80"
              style={{ backgroundColor: "#ffffff", color: badgeColors.from, border: `1px solid rgba(255,255,255,0.4)` }}
              data-testid={`button-view-${profileSlug}`}
            >
              <ExternalLink className="h-4 w-4" />
              <span className="text-[10px] font-bold leading-tight text-center">View Profile</span>
            </a>
          </div>
        </div>
      </div>

      {/* Slug under cover */}
      <div className="px-1">
        <div className="text-[10px] truncate font-mono" style={{ color: "rgba(255,255,255,0.85)" }}>
          {url} · {title} · {getThemeLabel(theme)}
        </div>
      </div>

      {/* A6 — Edit Profile (full width) */}
      <div className="flex gap-2">
        <button
          onClick={onEditClick}
          className="flex-1 py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#ffffff", color: badgeColors.from, border: `2px solid rgba(255,255,255,0.5)` }}
          data-testid={`button-edit-${profileSlug}`}
        >
          Edit Profile
        </button>
        {!isPrimary && onDeleteClick && (
          <button
            onClick={onDeleteClick}
            className="px-4 py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: "rgba(239,68,68,0.9)", color: "#fff" }}
            data-testid={`button-delete-${profileSlug}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function AdditionalProfileForm({
  advisorId, baseSlug, tc, existingProfile, label, onDone, advisor,
}: {
  advisorId: number; baseSlug: string; tc: ReturnType<typeof getThemeColors>;
  existingProfile?: AdvisorProfile; label: string; onDone: () => void;
  advisor: Advisor;
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
  // Same auto-migration as the primary editor — secondary owns its own hex.
  const SEC_THEME_HEX_MAP: Record<string, string> = { dark:"#1a1a1a", blue:"#4a8db5", pink:"#be185d", "light-blue":"#0ea5e9", "dark-royal-purple":"#a855f7", "dark-green":"#22c55e", gold:"#d4a017", teal:"#0d9488", red:"#dc2626", navy:"#1d4ed8", coral:"#f97316", silver:"#6b7280" };
  const [themeColor, setThemeColor] = useState<string>((existingProfile as any)?.themeColor || SEC_THEME_HEX_MAP[existingProfile?.theme || "blue"] || "#4a8db5");
  const [backgroundStyle, setBackgroundStyle] = useState<number>((existingProfile as any)?.backgroundStyle || 1);
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
  const [showTools, setShowTools] = useState(!!(existingProfile as any)?.showTools);
  const [showToolTax, setShowToolTax] = useState((existingProfile as any)?.showToolTax !== false);
  const [showToolExchange, setShowToolExchange] = useState((existingProfile as any)?.showToolExchange !== false);
  const [showToolCompound, setShowToolCompound] = useState((existingProfile as any)?.showToolCompound !== false);
  const [showToolPension, setShowToolPension] = useState((existingProfile as any)?.showToolPension !== false);
  const [showToolCgt, setShowToolCgt] = useState((existingProfile as any)?.showToolCgt !== false);
  const [showToolVehicle, setShowToolVehicle] = useState((existingProfile as any)?.showToolVehicle !== false);
  const [showToolReality, setShowToolReality] = useState((existingProfile as any)?.showToolReality !== false);
  const [showToolLatte, setShowToolLatte] = useState((existingProfile as any)?.showToolLatte !== false);
  const [showInteractive, setShowInteractive] = useState((existingProfile as any)?.showInteractive !== false);
  const [showShowpieceSqueeze, setShowShowpieceSqueeze] = useState((existingProfile as any)?.showShowpieceSqueeze !== false);
  const [showShowpieceTaxBite, setShowShowpieceTaxBite] = useState((existingProfile as any)?.showShowpieceTaxBite !== false);
  // M6 parity: 6 toggles that existed on the primary editor but were missing
  // here. Calculator section gained Bond / Emergency / LifeCover / Debt and
  // the Interactive section gained Inflation / Waiting. Mirroring all of them
  // so a secondary's profile-elements list reads identically to its primary.
  const [showShowpieceInflation, setShowShowpieceInflation] = useState((existingProfile as any)?.showShowpieceInflation !== false);
  const [showShowpieceWaiting, setShowShowpieceWaiting] = useState((existingProfile as any)?.showShowpieceWaiting !== false);
  const [showToolBond, setShowToolBond] = useState((existingProfile as any)?.showToolBond !== false);
  const [showToolEmergency, setShowToolEmergency] = useState((existingProfile as any)?.showToolEmergency !== false);
  const [showToolLifeCover, setShowToolLifeCover] = useState((existingProfile as any)?.showToolLifeCover !== false);
  const [showToolDebt, setShowToolDebt] = useState((existingProfile as any)?.showToolDebt !== false);
  const [showMoneywebFeed, setShowMoneywebFeed] = useState(!!(existingProfile as any)?.showMoneywebFeed);
  const [showSecondNews, setShowSecondNews] = useState(!!(existingProfile as any)?.showSecondNews);
  const [showForex, setShowForex] = useState(!!(existingProfile as any)?.showForex);
  const [showFunFacts, setShowFunFacts] = useState(!!(existingProfile as any)?.showFunFacts);
  const [showLiberty, setShowLiberty] = useState(!!(existingProfile as any)?.showLiberty);
  const [showStanlib, setShowStanlib] = useState(!!(existingProfile as any)?.showStanlib);
  const [showSigninghub, setShowSigninghub] = useState(!!(existingProfile as any)?.showSigninghub);
  const [showMyEmail, setShowMyEmail] = useState(!!(existingProfile as any)?.showMyEmail);
  // Task #29 — Public Profile Feature Suite toggles (secondary)
  const [showTradingView, setShowTradingView] = useState(!!(existingProfile as any)?.showTradingView);
  const [tradingViewSymbols, setTradingViewSymbols] = useState<string[]>(() => {
    const csv = (existingProfile as any)?.tradingViewSymbols as string | null;
    return csv ? csv.split(",").map((s: string) => s.trim()).filter(Boolean) : ["FX_IDC:USDZAR", "JSE:J203", "TVC:GOLD"];
  });
  const [showDailyQuotes, setShowDailyQuotes] = useState(!!(existingProfile as any)?.showDailyQuotes);
  const [dailyQuotesSet, setDailyQuotesSet] = useState<string>((existingProfile as any)?.dailyQuotesSet || "general");
  const [showCompoundCalc, setShowCompoundCalc] = useState(!!(existingProfile as any)?.showCompoundCalc);
  const [showRetirementCalc, setShowRetirementCalc] = useState(!!(existingProfile as any)?.showRetirementCalc);
  const [showFinancialCalendar, setShowFinancialCalendar] = useState(!!(existingProfile as any)?.showFinancialCalendar);
  const [patternOpacity, setPatternOpacity] = useState<number>((existingProfile as any)?.patternOpacity ?? 50);
  const [showEmergencyContacts, setShowEmergencyContacts] = useState(!!(existingProfile as any)?.showEmergencyContacts);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [organizingProfile, setOrganizingProfile] = useState(false);
  const [indServicesOpen, setIndServicesOpen] = useState(false);
  const [corpServicesOpen, setCorpServicesOpen] = useState(false);
  const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    const raw = (existingProfile as any)?.profileSectionOrder as string | null;
    const allowed = new Set<string>(DEFAULT_PROFILE_SECTION_ORDER as readonly string[]);
    const stored = raw ? raw.split(",").map(s => s.trim()).filter(Boolean).filter(k => allowed.has(k)) : [];
    const merged = [...stored];
    for (const k of DEFAULT_PROFILE_SECTION_ORDER) if (!merged.includes(k)) merged.push(k);
    return merged.length ? merged : [...DEFAULT_PROFILE_SECTION_ORDER];
  });
  const moveSectionUp = (idx: number) => { if (idx <= 0) return; const a = [...sectionOrder]; [a[idx-1], a[idx]] = [a[idx], a[idx-1]]; setSectionOrder(a); };
  const moveSectionDown = (idx: number) => { if (idx >= sectionOrder.length - 1) return; const a = [...sectionOrder]; [a[idx+1], a[idx]] = [a[idx], a[idx+1]]; setSectionOrder(a); };

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
        backgroundStyle,
        themeColor,
        // Secondary profile owns its OWN copy of every visibility toggle
        // — no inheritance from primary.
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
        showTools,
        showToolTax,
        showToolExchange,
        showToolCompound,
        showToolPension,
        showToolCgt,
        showToolVehicle,
        showToolReality,
        showToolLatte,
        showInteractive,
        showShowpieceSqueeze,
        showShowpieceTaxBite,
        showShowpieceInflation,
        showShowpieceWaiting,
        showToolBond,
        showToolEmergency,
        showToolLifeCover,
        showToolDebt,
        showMoneywebFeed,
        showSecondNews,
        showForex,
        showFunFacts,
        showLiberty,
        showStanlib,
        showSigninghub,
        showMyEmail,
        showTradingView,
        tradingViewSymbols: tradingViewSymbols.join(","),
        showDailyQuotes,
        dailyQuotesSet,
        showCompoundCalc,
        showRetirementCalc,
        showFinancialCalendar,
        showEmergencyContacts,
        patternOpacity,
        nickname: nickname || null,
        profileDescription: profileDescription || null,
        profileSectionOrder: sectionOrder.join(","),
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
      toast({ title: isEditing ? "Profile Updated" : "Profile Created", description: isEditing ? "Changes saved." : `Profile live at app.advisoryconnect.pro/${profileSlug}` });
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
      const [header, b64] = dataUrl.split(",");
      const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
      const bytes = atob(b64);
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      const blob = new Blob([arr], { type: mime });
      const formData = new FormData();
      formData.append("file", blob, "profile.jpg");
      const res = await fetch("/api/upload/profile-pic", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Server error ${res.status}`);
      }
      const data = await res.json();
      setProfilePicUrl(data.url);
    } catch (e: any) {
      toast({ title: "Upload Failed", description: e?.message || "Unknown error", variant: "destructive" });
    }
    finally { setUploading(false); }
  };

  const toggleService = (list: string[], setList: (v: string[]) => void, key: string) =>
    setList(list.includes(key) ? list.filter(s => s !== key) : [...list, key]);

  return (
    <>
    {cropperSrc && createPortal(
      <ImageCropper src={cropperSrc} onConfirm={handleCropConfirm} onCancel={() => setCropperSrc(null)} tc={tc} />,
      document.body
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
            <span className="px-2 py-2 text-xs flex-shrink-0" style={{ color: tc.mutedText, borderRight: `1px solid ${tc.inputBorder}` }}>app.advisoryconnect.pro/</span>
            <input value={profileSlug} onChange={e => setProfileSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder={`${baseSlug}-2`} className="flex-1 px-2 py-2 text-xs bg-transparent outline-none" style={{ color: tc.textColor }} data-testid="input-profile-slug" />
          </div>
          {profileSlug && !slugValid && <p className="text-xs" style={{ color: "#ef4444" }}>Lowercase letters, numbers and hyphens only. Must not start/end with a hyphen.</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium" style={{ color: tc.mutedText }}>Header &amp; Title <span className="font-normal">(Show header)</span></label>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: tc.mutedText }}>Pic</span>
              <div onClick={() => setShowProfilePic(v => !v)} className="w-7 h-3.5 rounded-full relative cursor-pointer" style={{ backgroundColor: showProfilePic ? tc.checkActive : tc.checkInactive }} data-testid="toggle-secondary-show-profile-pic">
                <div className="absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all" style={{ left: showProfilePic ? "14px" : "1px", backgroundColor: showProfilePic ? tc.checkDotActive : tc.checkDotInactive }} />
              </div>
              <div onClick={() => setShowHeader(v => !v)} className="w-7 h-3.5 rounded-full relative cursor-pointer" style={{ backgroundColor: showHeader ? tc.checkActive : tc.checkInactive }} data-testid="toggle-secondary-show-header">
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
          <input id="secondary-profile-pic-input" type="file" ref={fileInputRef} accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileChange} />
          {profilePicUrl ? (
            <div className="flex items-center gap-3">
              <img src={profilePicUrl} alt="Profile" className="h-12 w-12 rounded-full object-cover border" style={{ borderColor: tc.initialsCircleBorder }} />
              <div className="flex gap-2">
                <label htmlFor="secondary-profile-pic-input" className="px-2 py-1 rounded text-xs cursor-pointer" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor }}>Change</label>
                <button onClick={() => setProfilePicUrl(null)} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor }}>Remove</button>
              </div>
            </div>
          ) : (
            <label htmlFor="secondary-profile-pic-input" className="flex items-center justify-center gap-2 py-4 rounded-lg cursor-pointer" style={{ border: `2px dashed ${tc.borderColor}` }}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: tc.mutedText }} /> : <Upload className="h-4 w-4" style={{ color: tc.mutedText }} />}
              <span className="text-xs" style={{ color: tc.mutedText }}>{uploading ? "Uploading..." : "Upload photo"}</span>
            </label>
          )}
        </div>

        {/* M6 parity: Header Image card mirrors the primary editor. The advisor's
            display NAME is inherited (single source of truth on the advisor row,
            edited on the Primary profile), so both downloads use advisor.name +
            this secondary's title / theme / colour / pic. */}
        <div className="space-y-2 p-3 rounded-lg" style={{ border: `1px dashed ${tc.borderColor}` }}>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold" style={{ color: tc.sectionTitle }}>Header Image</label>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor }}>Name inherited</span>
          </div>
          <p className="text-[11px]" style={{ color: tc.mutedText }}>
            Download a name-and-initials header PNG (great for email signatures or social banners) or a portrait card PNG (for sharing). Both use your inherited name plus this profile's title, theme and photo.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => downloadHeaderBadgePng({ name: advisor.name || "", theme, themeColor })}
              className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium"
              style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor, border: `1px solid ${tc.borderColor}` }}
              data-testid="button-secondary-download-header"
            >
              <Download className="h-3.5 w-3.5" />
              Header PNG
            </button>
            <button
              type="button"
              onClick={() => downloadProfileImagePng({ name: advisor.name || "", title, theme, themeColor, profilePicUrl })}
              className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium"
              style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor, border: `1px solid ${tc.borderColor}` }}
              data-testid="button-secondary-download-profile"
            >
              <Download className="h-3.5 w-3.5" />
              Profile Card PNG
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium" style={{ color: tc.mutedText }}>Introduction &amp; Bio</label>
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: tc.mutedText }}>Show</span>
              <div onClick={() => setShowIntro(v => !v)} className="w-7 h-3.5 rounded-full relative cursor-pointer" style={{ backgroundColor: showIntro ? tc.checkActive : tc.checkInactive }} data-testid="toggle-secondary-show-intro">
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

        {/* Individual Services — primary-parity collapsible card with full
            descriptions, count badge and Show toggle. */}
        <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIndServicesOpen(v => !v)}
              className="flex items-center gap-2 flex-1 min-w-0 text-left"
              data-testid="toggle-secondary-ind-services-open"
            >
              {indServicesOpen ? <ChevronUp className="h-4 w-4 flex-shrink-0" style={{ color: tc.mutedText }} /> : <ChevronDown className="h-4 w-4 flex-shrink-0" style={{ color: tc.mutedText }} />}
              <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Individual Services</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.mutedText }}>{selectedIndividual.length}/{INDIVIDUAL_SERVICES.length}</span>
            </button>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs" style={{ color: tc.mutedText }}>Show</span>
              <div onClick={() => setShowIndividualServices(v => !v)} className="w-8 h-4 rounded-full relative cursor-pointer" style={{ backgroundColor: showIndividualServices ? tc.checkActive : tc.checkInactive }} data-testid="toggle-secondary-show-individual">
                <div className="absolute top-0.5 w-3 h-3 rounded-full transition-all" style={{ left: showIndividualServices ? "17px" : "2px", backgroundColor: showIndividualServices ? tc.checkDotActive : tc.checkDotInactive }} />
              </div>
            </div>
          </div>
          {!indServicesOpen && selectedIndividual.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {INDIVIDUAL_SERVICES.filter(s => selectedIndividual.includes(s.key)).map(s => (
                <span key={s.key} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor, border: `1px solid ${tc.borderColor}` }}>{s.name}</span>
              ))}
            </div>
          )}
          {!indServicesOpen && selectedIndividual.length === 0 && (
            <p className="text-xs italic" style={{ color: tc.mutedText }}>No services selected — tap to choose.</p>
          )}
          {indServicesOpen && (
            <div className="space-y-2">
              {INDIVIDUAL_SERVICES.map(s => (
                <label key={s.key} className="flex items-start gap-3 cursor-pointer p-2 rounded-lg" style={{ border: `1px solid ${tc.borderColor}` }}>
                  <input type="checkbox" checked={selectedIndividual.includes(s.key)} onChange={() => toggleService(selectedIndividual, setSelectedIndividual, s.key)} className="mt-0.5 flex-shrink-0" data-testid={`check-secondary-ind-${s.key}`} />
                  <div>
                    <div className="text-xs font-medium" style={{ color: tc.textColor }}>{s.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: tc.mutedText }}>{s.description}</div>
                  </div>
                </label>
              ))}
              <button type="button" onClick={() => setIndServicesOpen(false)} className="w-full text-[11px] py-1.5 rounded-md font-medium" style={{ color: tc.accentColor, border: `1px solid ${tc.borderColor}` }} data-testid="button-secondary-collapse-ind-services">Done — collapse</button>
            </div>
          )}
        </div>

        {/* Corporate Services — primary-parity collapsible card. */}
        <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setCorpServicesOpen(v => !v)}
              className="flex items-center gap-2 flex-1 min-w-0 text-left"
              data-testid="toggle-secondary-corp-services-open"
            >
              {corpServicesOpen ? <ChevronUp className="h-4 w-4 flex-shrink-0" style={{ color: tc.mutedText }} /> : <ChevronDown className="h-4 w-4 flex-shrink-0" style={{ color: tc.mutedText }} />}
              <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Corporate Services</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.mutedText }}>{selectedCorporate.length}/{CORPORATE_SERVICES.length}</span>
            </button>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs" style={{ color: tc.mutedText }}>Show</span>
              <div onClick={() => setShowCorporateServices(v => !v)} className="w-8 h-4 rounded-full relative cursor-pointer" style={{ backgroundColor: showCorporateServices ? tc.checkActive : tc.checkInactive }} data-testid="toggle-secondary-show-corporate">
                <div className="absolute top-0.5 w-3 h-3 rounded-full transition-all" style={{ left: showCorporateServices ? "17px" : "2px", backgroundColor: showCorporateServices ? tc.checkDotActive : tc.checkDotInactive }} />
              </div>
            </div>
          </div>
          {!corpServicesOpen && selectedCorporate.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {CORPORATE_SERVICES.filter(s => selectedCorporate.includes(s.key)).map(s => (
                <span key={s.key} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor, border: `1px solid ${tc.borderColor}` }}>{s.name}</span>
              ))}
            </div>
          )}
          {!corpServicesOpen && selectedCorporate.length === 0 && (
            <p className="text-xs italic" style={{ color: tc.mutedText }}>No services selected — tap to choose.</p>
          )}
          {corpServicesOpen && (
            <div className="space-y-2">
              {CORPORATE_SERVICES.map(s => (
                <label key={s.key} className="flex items-start gap-3 cursor-pointer p-2 rounded-lg" style={{ border: `1px solid ${tc.borderColor}` }}>
                  <input type="checkbox" checked={selectedCorporate.includes(s.key)} onChange={() => toggleService(selectedCorporate, setSelectedCorporate, s.key)} className="mt-0.5 flex-shrink-0" data-testid={`check-secondary-corp-${s.key}`} />
                  <div>
                    <div className="text-xs font-medium" style={{ color: tc.textColor }}>{s.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: tc.mutedText }}>{s.description}</div>
                  </div>
                </label>
              ))}
              <button type="button" onClick={() => setCorpServicesOpen(false)} className="w-full text-[11px] py-1.5 rounded-md font-medium" style={{ color: tc.accentColor, border: `1px solid ${tc.borderColor}` }} data-testid="button-secondary-collapse-corp-services">Done — collapse</button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium" style={{ color: tc.mutedText }}>Social Links (optional)</label>
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: tc.mutedText }}>Show</span>
              <div onClick={() => setShowSocials(v => !v)} className="w-7 h-3.5 rounded-full relative cursor-pointer" style={{ backgroundColor: showSocials ? tc.checkActive : tc.checkInactive }} data-testid="toggle-secondary-show-socials">
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

        {/* M6: Contact Details — read-only inherited section so the secondary
            editor mirrors the primary's section list. Contact number, location
            and working hours are advisor-level (single source of truth) and are
            edited on the Primary profile; shown here so advisors can see what
            their secondary will display. */}
        <div className="space-y-2 p-3 rounded-lg" style={{ border: `1px dashed ${tc.borderColor}`, backgroundColor: tc.inputBg + "40" }}>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold" style={{ color: tc.sectionTitle }}>Contact Details</label>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor }}>Inherited from Primary</span>
          </div>
          <p className="text-[11px]" style={{ color: tc.mutedText }}>
            Contact number, location and working hours are shared across all your profiles. Edit them on your Primary profile.
          </p>
          <div className="grid grid-cols-1 gap-1.5 pt-1">
            <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.borderColor}` }}>
              <span style={{ color: tc.mutedText }}>Phone</span>
              <span className="font-medium" style={{ color: tc.textColor }}>{(advisor as any).contactNumber || "—"}</span>
            </div>
            <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.borderColor}` }}>
              <span style={{ color: tc.mutedText }}>Location</span>
              <span className="font-medium truncate ml-2" style={{ color: tc.textColor }}>{(advisor as any).location || "—"}</span>
            </div>
            <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.borderColor}` }}>
              <span style={{ color: tc.mutedText }}>Hours</span>
              <span className="font-medium truncate ml-2" style={{ color: tc.textColor }}>{(advisor as any).workingHours || "—"}</span>
            </div>
            <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.borderColor}` }}>
              <span style={{ color: tc.mutedText }}>Email</span>
              <span className="font-medium truncate ml-2" style={{ color: tc.textColor }}>{advisor.email || "—"}</span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5 p-3 rounded-lg" style={{ border: `1px dashed ${tc.borderColor}` }}>
          <label className="text-xs font-medium" style={{ color: tc.mutedText }}>Admin Notes (not shown to clients)</label>
          <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder='Nickname (e.g. "Corporate Clients")' className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }} />
          <textarea value={profileDescription} onChange={e => setProfileDescription(e.target.value)} placeholder="Short description..." rows={2} className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor }} />
        </div>

        {/* M6 parity reorder: Profile Page Elements → Theme Colour → Section
            Order → Background Pattern, matching the Primary editor exactly. */}
        <div className="space-y-2">
          <label className="text-xs font-medium" style={{ color: tc.mutedText }}>Profile Page Elements</label>
          {[
            { label: "QR Code", value: showQrCode, set: setShowQrCode },
            { label: "Call Back Button", value: showCallbackLink, set: setShowCallbackLink },
            { label: "Refer Friends Button", value: showReferralsLink, set: setShowReferralsLink },
            { label: "Complimentary Will", value: showComplimentaryWill, set: setShowComplimentaryWill },
            { label: "Live News Feed", value: showMoneywebFeed, set: setShowMoneywebFeed },
            { label: "More Finance News (second feed)", value: showSecondNews, set: setShowSecondNews },
            { label: "Live Exchange Rates", value: showForex, set: setShowForex },
            { label: "Financial Facts of the Day", value: showFunFacts, set: setShowFunFacts },
            { label: "Financial Tools Section", value: showTools, set: setShowTools },
            { label: "Emergency Contacts", value: showEmergencyContacts, set: setShowEmergencyContacts },
            { label: "My Liberty (Platforms)", value: showLiberty, set: setShowLiberty },
            { label: "Stanlib (Platforms)", value: showStanlib, set: setShowStanlib },
            { label: "SigningHub (Platforms)", value: showSigninghub, set: setShowSigninghub },
            { label: "My Email (Platforms)", value: showMyEmail, set: setShowMyEmail },
            { label: "Live Markets (TradingView)", value: showTradingView, set: setShowTradingView },
            { label: "Daily Quote Card", value: showDailyQuotes, set: setShowDailyQuotes },
            { label: "Compound Interest Calculator", value: showCompoundCalc, set: setShowCompoundCalc },
            { label: "Retirement Savings Calculator", value: showRetirementCalc, set: setShowRetirementCalc },
            { label: "Financial Calendar Widget", value: showFinancialCalendar, set: setShowFinancialCalendar },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between px-2 py-2 rounded-lg" style={{ border: `1px solid ${tc.borderColor}` }}>
              <span className="text-xs" style={{ color: tc.textColor }}>{item.label}</span>
              <div onClick={() => item.set(v => !v)} className="w-8 h-4 rounded-full relative cursor-pointer" style={{ backgroundColor: item.value ? tc.checkActive : tc.checkInactive }} data-testid={`toggle-secondary-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                <div className="absolute top-0.5 w-3 h-3 rounded-full transition-all" style={{ left: item.value ? "17px" : "2px", backgroundColor: item.value ? tc.checkDotActive : tc.checkDotInactive }} />
              </div>
            </div>
          ))}
          {showTradingView && (
            <div className="rounded-lg px-2 py-2 space-y-1" style={{ border: `1px solid ${tc.borderColor}`, backgroundColor: tc.inputBg + "55" }}>
              <p className="text-xs font-medium" style={{ color: tc.mutedText }}>TradingView instruments (max 8):</p>
              <div className="grid grid-cols-2 gap-0.5">
                {TRADINGVIEW_SYMBOLS_PANEL.map(sym => {
                  const checked = tradingViewSymbols.includes(sym.value);
                  return (
                    <label key={sym.value} className="flex items-center gap-1.5 text-[11px] cursor-pointer py-0.5" style={{ color: tc.textColor }}>
                      <input type="checkbox" checked={checked} onChange={() => {
                        setTradingViewSymbols(prev => {
                          if (checked) return prev.filter(v => v !== sym.value);
                          if (prev.length >= 8) return prev;
                          return [...prev, sym.value];
                        });
                      }} data-testid={`check-secondary-tv-${sym.value}`} />
                      <span className="truncate">{sym.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          {showDailyQuotes && (
            <div className="rounded-lg px-2 py-2 space-y-1.5" style={{ border: `1px solid ${tc.borderColor}`, backgroundColor: tc.inputBg + "55" }}>
              <p className="text-xs font-medium" style={{ color: tc.mutedText }}>Quote set:</p>
              <div className="flex gap-2">
                {[{ k: "general", l: "General" }, { k: "investment", l: "Investment" }].map(opt => (
                  <button key={opt.k} type="button" onClick={() => setDailyQuotesSet(opt.k)} className="px-2 py-1 rounded-md text-[11px] font-medium" style={{ backgroundColor: dailyQuotesSet === opt.k ? tc.buttonBg : tc.inputBg, color: dailyQuotesSet === opt.k ? tc.buttonText : tc.textColor, border: `1px solid ${dailyQuotesSet === opt.k ? tc.buttonBg : tc.borderColor}` }} data-testid={`btn-secondary-quoteset-${opt.k}`}>{opt.l}</button>
                ))}
              </div>
            </div>
          )}
          {showTools && (
            <div className="rounded-lg px-2 py-2 space-y-2" style={{ border: `1px solid ${tc.borderColor}`, backgroundColor: tc.inputBg + "55" }}>
              <p className="text-xs font-medium" style={{ color: tc.mutedText }}>Tools visible on profile:</p>
              {[
                { label: "SA Tax Calculator", value: showToolTax, set: setShowToolTax },
                { label: "Exchange Rate Converter", value: showToolExchange, set: setShowToolExchange },
                { label: "Compound Interest Calc", value: showToolCompound, set: setShowToolCompound },
                { label: "Pension Fund Calculator", value: showToolPension, set: setShowToolPension },
                { label: "Capital Gains Tax Calculator", value: showToolCgt, set: setShowToolCgt },
                { label: "Vehicle & Assets Calc", value: showToolVehicle, set: setShowToolVehicle },
                { label: "Bond / Home Loan Calculator", value: showToolBond, set: setShowToolBond },
                { label: "Emergency Fund Calculator", value: showToolEmergency, set: setShowToolEmergency },
                { label: "Life Cover Needs Calculator", value: showToolLifeCover, set: setShowToolLifeCover },
                { label: "Debt Payoff Calculator", value: showToolDebt, set: setShowToolDebt },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between pl-2">
                  <span className="text-xs" style={{ color: tc.textColor }}>{item.label}</span>
                  <div onClick={() => item.set(v => !v)} className="w-8 h-4 rounded-full relative cursor-pointer" style={{ backgroundColor: item.value ? tc.checkActive : tc.checkInactive }} data-testid={`toggle-secondary-tool-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                    <div className="absolute top-0.5 w-3 h-3 rounded-full transition-all" style={{ left: item.value ? "17px" : "2px", backgroundColor: item.value ? tc.checkDotActive : tc.checkDotInactive }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between px-2 py-2 rounded-lg" style={{ border: `1px solid ${tc.borderColor}` }}>
            <span className="text-xs" style={{ color: tc.textColor }}>Interactive Financial Tools</span>
            <div onClick={() => setShowInteractive(v => !v)} className="w-8 h-4 rounded-full relative cursor-pointer" style={{ backgroundColor: showInteractive ? tc.checkActive : tc.checkInactive }} data-testid="toggle-secondary-show-interactive">
              <div className="absolute top-0.5 w-3 h-3 rounded-full transition-all" style={{ left: showInteractive ? "17px" : "2px", backgroundColor: showInteractive ? tc.checkDotActive : tc.checkDotInactive }} />
            </div>
          </div>
          {showInteractive && (
            <div className="rounded-lg px-2 py-2 space-y-2" style={{ border: `1px solid ${tc.borderColor}`, backgroundColor: tc.inputBg + "55" }}>
              <p className="text-xs font-medium" style={{ color: tc.mutedText }}>Interactive tools visible on profile:</p>
              {[
                { label: "Real Money Squeeze", value: showShowpieceSqueeze, set: setShowShowpieceSqueeze },
                { label: "Tax Bite", value: showShowpieceTaxBite, set: setShowShowpieceTaxBite },
                { label: "Inflation Eats Your Million", value: showShowpieceInflation, set: setShowShowpieceInflation },
                { label: "The Cost of Waiting", value: showShowpieceWaiting, set: setShowShowpieceWaiting },
                { label: "30-Year Reality Check", value: showToolReality, set: setShowToolReality },
                { label: "The Latte Millionaire", value: showToolLatte, set: setShowToolLatte },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between pl-2">
                  <span className="text-xs" style={{ color: tc.textColor }}>{item.label}</span>
                  <div onClick={() => item.set(v => !v)} className="w-8 h-4 rounded-full relative cursor-pointer" style={{ backgroundColor: item.value ? tc.checkActive : tc.checkInactive }} data-testid={`toggle-secondary-showpiece-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                    <div className="absolute top-0.5 w-3 h-3 rounded-full transition-all" style={{ left: item.value ? "17px" : "2px", backgroundColor: item.value ? tc.checkDotActive : tc.checkDotInactive }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium" style={{ color: tc.mutedText }}>Theme</label>
          <p className="text-[11px]" style={{ color: tc.mutedText }}>
            Pick the theme used across this profile — buttons, badges, header gradient and the contact card all inherit from it.
          </p>
          <ColourPicker
            value={theme}
            themeColor={themeColor}
            onChange={(name, hex) => { setTheme(name); setThemeColor(hex); }}
            tc={tc}
            testIdPrefix="secondary-theme"
          />
        </div>

        {/* Section Order — primary-parity collapsible card with numbered rows
            and per-row up/down arrows. Replaces the previous inline pill grid. */}
        <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setOrganizingProfile(v => !v)}
              className="flex items-center gap-2 flex-1 min-w-0 text-left"
              data-testid="toggle-secondary-section-order-open"
            >
              {organizingProfile ? <ChevronUp className="h-4 w-4 flex-shrink-0" style={{ color: tc.mutedText }} /> : <ChevronDown className="h-4 w-4 flex-shrink-0" style={{ color: tc.mutedText }} />}
              <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Section Order</h3>
              {(() => {
                const isDefault = sectionOrder.length === DEFAULT_PROFILE_SECTION_ORDER.length && sectionOrder.every((k, i) => k === DEFAULT_PROFILE_SECTION_ORDER[i]);
                return (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.mutedText }}>
                    {isDefault ? "Default" : "Custom"}
                  </span>
                );
              })()}
            </button>
            {!organizingProfile && (
              <button
                type="button"
                onClick={() => setOrganizingProfile(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0"
                style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor, border: `1px solid ${tc.borderColor}` }}
                data-testid="button-secondary-organize-sections"
              >
                <GripVertical className="h-3.5 w-3.5" />
                Reorder
              </button>
            )}
          </div>
          {!organizingProfile ? (
            <p className="text-xs" style={{ color: tc.mutedText }}>
              Sections appear on this profile in the recommended order. Tap <strong>Reorder</strong> to customise.
            </p>
          ) : (
            <>
              <p className="text-xs" style={{ color: tc.mutedText }}>Use the arrows to move sections up or down. Changes save when you hit <strong>Save Changes</strong> below.</p>
              <div className="space-y-1.5">
                {sectionOrder.map((key, idx) => (
                  <div key={key} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.borderColor}` }}>
                    <span className="text-[10px] font-bold w-4 text-center" style={{ color: tc.accentColor }}>{idx + 1}</span>
                    <span className="flex-1 text-xs font-medium" style={{ color: tc.textColor }}>{PROFILE_SECTION_LABELS[key] || key}</span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => moveSectionUp(idx)} disabled={idx === 0} className="p-1 rounded hover:opacity-70 disabled:opacity-25 transition-opacity" style={{ color: tc.accentColor }} data-testid={`button-secondary-move-up-${key}`}>
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => moveSectionDown(idx)} disabled={idx === sectionOrder.length - 1} className="p-1 rounded hover:opacity-70 disabled:opacity-25 transition-opacity" style={{ color: tc.accentColor }} data-testid={`button-secondary-move-down-${key}`}>
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSectionOrder([...DEFAULT_PROFILE_SECTION_ORDER])}
                  className="flex-1 text-[11px] py-1.5 rounded-md font-medium"
                  style={{ color: tc.mutedText, border: `1px solid ${tc.borderColor}` }}
                  data-testid="button-secondary-reset-section-order"
                >
                  Reset to default
                </button>
                <button
                  type="button"
                  onClick={() => setOrganizingProfile(false)}
                  className="flex-1 text-[11px] py-1.5 rounded-md font-medium"
                  style={{ color: tc.accentColor, border: `1px solid ${tc.accentColor}` }}
                  data-testid="button-secondary-collapse-section-order"
                >
                  Done — collapse
                </button>
              </div>
            </>
          )}
        </div>

        {/* M6 parity: Background Pattern is the LAST section (matching primary). */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium" style={{ color: tc.mutedText }}>Background Pattern</label>
          <div className="grid grid-cols-3 gap-2">
            {BACKGROUND_STYLE_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setBackgroundStyle(opt.value)}
                className="rounded-lg border-2 py-2 px-1 text-center transition-all text-xs font-medium"
                style={{ borderColor: backgroundStyle === opt.value ? tc.accentColor : tc.borderColor, color: backgroundStyle === opt.value ? tc.accentColor : tc.mutedText, backgroundColor: backgroundStyle === opt.value ? tc.buttonSecondaryBg : "transparent" }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {backgroundStyle > 1 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: tc.mutedText }}>Pattern Intensity</span>
                <span className="text-xs font-medium" style={{ color: tc.accentColor }}>{patternOpacity}%</span>
              </div>
              <input type="range" min={5} max={100} step={5} value={patternOpacity}
                onChange={e => setPatternOpacity(parseInt(e.target.value))}
                className="w-full" style={{ accentColor: tc.accentColor }} />
              <div className="flex justify-between text-xs" style={{ color: tc.mutedText }}>
                <span>Barely visible</span><span>Solid</span>
              </div>
            </div>
          )}
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

function TSelect({ value, onChange, options, className = "", colors, codeOnly = false }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  colors: ReturnType<typeof getThemeColors>;
  codeOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [dropRect, setDropRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", onScroll, true);
    return () => { document.removeEventListener("mousedown", close); window.removeEventListener("scroll", onScroll, true); };
  }, []);

  const handleOpen = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setDropRect({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setOpen(p => !p);
  };

  const fullLabel = options.find(o => o.value === value)?.label || value;
  const triggerLabel = codeOnly ? (fullLabel.split(" — ")[0] || fullLabel) : fullLabel;

  return (
    <div className={`relative ${className}`} ref={wrapRef}>
      <button ref={triggerRef} type="button" onClick={handleOpen} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textColor }}>
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown className={`h-3.5 w-3.5 flex-shrink-0 ml-1 transition-transform duration-150 ${open ? "rotate-180" : ""}`} style={{ color: colors.mutedText }} />
      </button>
      {open && dropRect && (
        <div
          style={{
            position: "fixed",
            top: dropRect.top,
            left: dropRect.left,
            minWidth: dropRect.width,
            zIndex: 9999,
            backgroundColor: colors.popupBg,
            border: `2px solid ${colors.accentColor}`,
            borderRadius: "10px",
            boxShadow: `0 18px 48px rgba(0,0,0,0.75), 0 0 0 4px ${colors.bgColor}`,
            maxHeight: "240px",
            overflowY: "auto",
          }}
        >
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm whitespace-nowrap"
              style={{
                color: o.value === value ? colors.accentColor : colors.textColor,
                backgroundColor: o.value === value ? colors.solidInputBg : colors.popupBg,
                fontWeight: o.value === value ? 600 : 400,
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function fmt(n: number) { return "R " + Math.round(n).toLocaleString("en-ZA"); }
function calcSarsOnAmount(n: number): number {
  if (n <= 0) return 0;
  if (n <= 500000) return 0;
  if (n <= 700000) return (n - 500000) * 0.18;
  if (n <= 1050000) return 36000 + (n - 700000) * 0.27;
  return 130500 + (n - 1050000) * 0.36;
}

function calcSAIncomeTax(income: number): number {
  if (income <= 0) return 0;
  const brackets = [
    { limit: 237100, rate: 0.18, base: 0 },
    { limit: 370500, rate: 0.26, base: 42678 },
    { limit: 512800, rate: 0.31, base: 77362 },
    { limit: 673000, rate: 0.36, base: 121475 },
    { limit: 857900, rate: 0.39, base: 179147 },
    { limit: 1817000, rate: 0.41, base: 251258 },
    { limit: Infinity, rate: 0.45, base: 644489 },
  ];
  const prev = [0, 237100, 370500, 512800, 673000, 857900, 1817000];
  for (let i = 0; i < brackets.length; i++) {
    if (income <= brackets[i].limit) {
      return brackets[i].base + (income - prev[i]) * brackets[i].rate - 17235;
    }
  }
  return 0;
}

function ForexCalcPanel({ tc }: { tc: ReturnType<typeof getThemeColors> }) {
  const [currencyPair, setCurrencyPair] = useState("USD/ZAR");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [lotSizeType, setLotSizeType] = useState<"standard" | "mini" | "micro" | "custom">("standard");
  const [customLots, setCustomLots] = useState("1");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [accountCurrency, setAccountCurrency] = useState("ZAR");
  const [leverage, setLeverage] = useState("100");
  const [spread, setSpread] = useState("2");
  const [commission, setCommission] = useState("0");
  const [swap, setSwap] = useState("0");
  const [accountBalance, setAccountBalance] = useState("");
  const [riskPct, setRiskPct] = useState("2");

  const LOT_SIZES: Record<string, number> = { standard: 1, mini: 0.1, micro: 0.01, custom: parseFloat(customLots) || 0 };
  const CONTRACT_SIZE = 100000;
  const lots = LOT_SIZES[lotSizeType];
  const positionSize = lots * CONTRACT_SIZE;
  const entry = parseFloat(entryPrice) || 0;
  const exit = parseFloat(exitPrice) || 0;
  const lev = parseFloat(leverage) || 100;
  const spr = parseFloat(spread) || 0;
  const comm = parseFloat(commission) || 0;
  const swapCost = parseFloat(swap) || 0;
  const hasInput = entry > 0 && exit > 0;

  const diff = tradeType === "buy" ? exit - entry : entry - exit;
  const profit = diff * positionSize;
  const pipValue = entry > 0 ? (lots * 0.0001) / entry : 0;
  const spreadCost = pipValue * spr * CONTRACT_SIZE;
  const margin = entry > 0 ? (positionSize * entry) / lev : 0;
  const totalCost = spreadCost + comm + swapCost;
  const netProfit = profit - totalCost;
  const returnPct = margin > 0 ? (netProfit / margin) * 100 : 0;
  const balance = parseFloat(accountBalance) || 0;
  const riskAmount = balance > 0 ? balance * (parseFloat(riskPct) / 100) : 0;
  const exceedsRisk = balance > 0 && Math.abs(netProfit) > riskAmount && netProfit < 0;

  const fmt = (v: number, ccy = accountCurrency) =>
    `${ccy} ${Math.abs(v).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const is: React.CSSProperties = {
    backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`,
    color: tc.textColor, borderRadius: "8px", padding: "8px 10px",
    fontSize: "13px", outline: "none", width: "100%",
  };
  const ls: React.CSSProperties = { color: tc.mutedText };

  const LOT_OPTIONS = [
    { key: "standard", label: "Standard (1.0)" },
    { key: "mini",     label: "Mini (0.1)" },
    { key: "micro",    label: "Micro (0.01)" },
    { key: "custom",   label: "Custom" },
  ] as const;

  const resultRows = !hasInput ? [] : [
    { label: "Gross Profit / Loss",  val: fmt(profit),    color: profit >= 0 ? "#22c55e" : "#ef4444" },
    { label: "Total Cost",           val: fmt(totalCost), color: tc.mutedText },
    { label: "Net Profit / Loss",    val: fmt(netProfit), color: netProfit >= 0 ? "#22c55e" : "#ef4444" },
    { label: "Margin Required",      val: fmt(margin),    color: tc.textColor },
    { label: "Return %",             val: `${returnPct >= 0 ? "+" : ""}${returnPct.toFixed(2)}%`, color: returnPct >= 0 ? "#22c55e" : "#ef4444" },
  ];

  const chartData = hasInput && margin > 0 ? [
    { name: "Gross P/L", value: Math.abs(profit),     fill: profit >= 0 ? "#22c55e" : "#ef4444" },
    { name: "Total Cost", value: Math.abs(totalCost), fill: tc.accentColor },
    { name: "Net P/L",    value: Math.abs(netProfit), fill: netProfit >= 0 ? "#22c55e" : "#ef4444" },
    { name: "Margin",     value: Math.abs(margin),    fill: tc.mutedText },
  ] : [];

  return (
    <div className="pt-4 space-y-5">
      {/* 1. Trade Setup */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: tc.sectionTitle }}>Trade Setup</p>
        <div className="space-y-1">
          <label className="text-xs" style={ls}>Currency Pair</label>
          <input value={currencyPair} onChange={e => setCurrencyPair(e.target.value.toUpperCase())} placeholder="e.g. USD/ZAR" style={is} data-testid="input-forex-pair" />
        </div>
        <div className="space-y-1">
          <label className="text-xs" style={ls}>Trade Type</label>
          <div className="grid grid-cols-2 gap-2">
            {(["buy", "sell"] as const).map(t => (
              <button key={t} onClick={() => setTradeType(t)}
                className="py-2 rounded-lg text-sm font-semibold transition-all"
                style={{ backgroundColor: tradeType === t ? (t === "buy" ? "#22c55e" : "#ef4444") : tc.inputBg, color: tradeType === t ? "#fff" : tc.mutedText, border: `1px solid ${tradeType === t ? (t === "buy" ? "#22c55e" : "#ef4444") : tc.inputBorder}` }}
                data-testid={`button-forex-${t}`}>
                {t === "buy" ? "▲ Buy" : "▼ Sell"}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs" style={ls}>Lot Size</label>
          <div className="grid grid-cols-2 gap-2">
            {LOT_OPTIONS.map(({ key, label }) => (
              <button key={key} onClick={() => setLotSizeType(key)}
                className="py-2 px-2 rounded-lg text-xs font-medium transition-all text-left"
                style={{ backgroundColor: lotSizeType === key ? tc.buttonSecondaryBg : tc.inputBg, color: lotSizeType === key ? tc.accentColor : tc.mutedText, border: `1px solid ${lotSizeType === key ? tc.accentColor : tc.inputBorder}` }}
                data-testid={`button-forex-lot-${key}`}>
                {label}
              </button>
            ))}
          </div>
          {lotSizeType === "custom" && (
            <input type="number" value={customLots} onChange={e => setCustomLots(e.target.value)} placeholder="e.g. 0.5" style={{ ...is, marginTop: "6px" }} data-testid="input-forex-custom-lots" />
          )}
        </div>
      </div>

      {/* 2. Trade Prices */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: tc.sectionTitle }}>Trade Prices</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs" style={ls}>Entry Price</label>
            <input type="number" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} placeholder="e.g. 18.45" style={is} data-testid="input-forex-entry" />
          </div>
          <div className="space-y-1">
            <label className="text-xs" style={ls}>Exit Price</label>
            <input type="number" value={exitPrice} onChange={e => setExitPrice(e.target.value)} placeholder="e.g. 18.60" style={is} data-testid="input-forex-exit" />
          </div>
        </div>
      </div>

      {/* 3. Account Settings */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: tc.sectionTitle }}>Account Settings</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs" style={ls}>Account Currency</label>
            <select value={accountCurrency} onChange={e => setAccountCurrency(e.target.value)} style={is} data-testid="select-forex-currency">
              {["ZAR","USD","EUR","GBP","AUD","JPY","CHF","CAD"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs" style={ls}>Leverage (e.g. 1:100)</label>
            <select value={leverage} onChange={e => setLeverage(e.target.value)} style={is} data-testid="select-forex-leverage">
              {["10","20","30","50","100","200","500"].map(l => <option key={l} value={l}>1:{l}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Costs */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: tc.sectionTitle }}>Costs</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-xs" style={ls}>Spread (pips)</label>
            <input type="number" value={spread} onChange={e => setSpread(e.target.value)} placeholder="2" style={is} data-testid="input-forex-spread" />
          </div>
          <div className="space-y-1">
            <label className="text-xs" style={ls}>Commission</label>
            <input type="number" value={commission} onChange={e => setCommission(e.target.value)} placeholder="0" style={is} data-testid="input-forex-commission" />
          </div>
          <div className="space-y-1">
            <label className="text-xs" style={ls}>Swap</label>
            <input type="number" value={swap} onChange={e => setSwap(e.target.value)} placeholder="0" style={is} data-testid="input-forex-swap" />
          </div>
        </div>
      </div>

      {/* 5. Risk (optional) */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: tc.sectionTitle }}>Risk (optional)</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs" style={ls}>Account Balance</label>
            <input type="number" value={accountBalance} onChange={e => setAccountBalance(e.target.value)} placeholder="e.g. 50000" style={is} data-testid="input-forex-balance" />
          </div>
          <div className="space-y-1">
            <label className="text-xs" style={ls}>Risk %</label>
            <input type="number" value={riskPct} onChange={e => setRiskPct(e.target.value)} placeholder="2" style={is} data-testid="input-forex-risk" />
          </div>
        </div>
      </div>

      {/* Results */}
      {hasInput && (
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${tc.borderColor}` }}>
          <div className="px-3 py-2.5" style={{ backgroundColor: tc.inputBg + "99" }}>
            <p className="text-xs font-semibold" style={{ color: tc.sectionTitle }}>
              {currencyPair} · {tradeType === "buy" ? "▲ Buy" : "▼ Sell"} · {lots} lot{lots !== 1 ? "s" : ""} · 1:{leverage}
            </p>
          </div>
          <div className="px-3 py-3 space-y-2.5" style={{ backgroundColor: tc.cardBg }}>
            {resultRows.map(({ label, val, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs" style={ls}>{label}</span>
                <span className="text-xs font-bold" style={{ color }}>{val}</span>
              </div>
            ))}
            {exceedsRisk && (
              <div className="rounded-lg px-3 py-2 flex items-start gap-2 mt-1" style={{ backgroundColor: "#ef444422", border: "1px solid #ef4444" }}>
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-px" style={{ color: "#ef4444" }} />
                <span className="text-xs font-semibold" style={{ color: "#ef4444" }}>Risk Warning — This trade's loss exceeds your {riskPct}% risk limit ({fmt(riskAmount)}).</span>
              </div>
            )}
          </div>
          {chartData.length > 0 && (
            <div className="px-3 pb-4 pt-2" style={{ backgroundColor: tc.cardBg, borderTop: `1px solid ${tc.borderColor}` }}>
              <p className="text-xs font-semibold mb-2" style={{ color: tc.sectionTitle }}>Profit Chart</p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={tc.borderColor} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: tc.mutedText }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: tc.mutedText }} axisLine={false} tickLine={false} width={45}
                    tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v.toFixed(0)} />
                  <Tooltip
                    contentStyle={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}`, borderRadius: "8px", fontSize: "11px" }}
                    labelStyle={{ color: tc.sectionTitle }} itemStyle={{ color: tc.textColor }}
                    formatter={(v: number) => [fmt(v), ""]}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {!hasInput && (
        <p className="text-xs text-center py-2" style={{ color: tc.mutedText }}>Enter entry and exit prices to see results.</p>
      )}

      <div className="rounded-lg px-3 py-2 space-y-0.5" style={{ backgroundColor: tc.inputBg + "66", border: `1px solid ${tc.borderColor}` }}>
        <p className="text-xs font-medium" style={{ color: tc.sectionTitle }}>Formula Reference</p>
        {[
          ["Position Size", `${lots} lots × 100,000 = ${positionSize.toLocaleString("en-ZA")} units`],
          ["Pip Value", entry > 0 ? `(${lots} × 0.0001) ÷ ${entry} = ${pipValue.toFixed(6)}` : "Enter entry price"],
          ["Spread Cost", entry > 0 ? fmt(spreadCost) : "—"],
          ["Margin", entry > 0 ? fmt(margin) : "—"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between text-xs py-0.5">
            <span style={ls}>{k}</span>
            <span style={{ color: tc.textColor }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VehicleCalcPanel({ tc }: { tc: ReturnType<typeof getThemeColors> }) {
  const [assetType, setAssetType] = useState("Vehicle");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseYear, setPurchaseYear] = useState(String(new Date().getFullYear() - 3));
  const [deprRate, setDeprRate] = useState("15");
  const [manualValue, setManualValue] = useState("");
  const [financed, setFinanced] = useState(false);
  const [loanAmount, setLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState("11.25");
  const [loanTermMonths, setLoanTermMonths] = useState("72");
  const [insurance, setInsurance] = useState("");
  const [fuel, setFuel] = useState("");
  const [maintenance, setMaintenance] = useState("");
  const [otherCost, setOtherCost] = useState("");

  const is = { backgroundColor: tc.inputBg, color: tc.textColor, border: `1px solid ${tc.borderColor}` };
  const ls = { color: tc.mutedText };
  const ac = { color: tc.accentColor };
  const inpCls = "w-full px-3 py-2 rounded-lg text-sm outline-none";
  const labelCls = "text-xs font-medium";

  const num = (s: string) => parseFloat(s.replace(/\D/g, "")) || 0;
  const numF = (s: string) => parseFloat(s) || 0;

  const purchase = num(purchasePrice);
  const pYear = parseInt(purchaseYear) || new Date().getFullYear();
  const yearsOwned = Math.max(0, new Date().getFullYear() - pYear);
  const dr = numF(deprRate) / 100;
  const calcValue = purchase > 0 ? purchase * Math.pow(1 - dr, yearsOwned) : 0;
  const currentValue = manualValue ? num(manualValue) : calcValue;
  const deprLoss = Math.max(0, purchase - currentValue);

  const loanP = num(loanAmount);
  const monthlyR = (numF(interestRate) / 100) / 12;
  const nMonths = parseInt(loanTermMonths) || 72;
  const monthsElapsed = Math.min(yearsOwned * 12, nMonths);
  let monthlyPayment = 0;
  let remainingBalance = 0;
  if (financed && loanP > 0 && monthlyR > 0 && nMonths > 0) {
    const factor = Math.pow(1 + monthlyR, nMonths);
    monthlyPayment = loanP * monthlyR * factor / (factor - 1);
    const elapsedFactor = Math.pow(1 + monthlyR, monthsElapsed);
    remainingBalance = Math.max(0, loanP * elapsedFactor - monthlyPayment * (elapsedFactor - 1) / monthlyR);
  }

  const netPosition = currentValue - remainingBalance;
  const ins = num(insurance);
  const fl = num(fuel);
  const maint = num(maintenance);
  const oth = num(otherCost);
  const totalMonthly = monthlyPayment + ins + fl + maint + oth;
  const annualCost = totalMonthly * 12;

  const maxYears = Math.min(Math.max(yearsOwned + 5, 10), 20);
  const declineData = purchase > 0 ? Array.from({ length: maxYears + 1 }, (_, i) => ({
    year: pYear + i,
    value: Math.round(purchase * Math.pow(1 - dr, i)),
    balance: financed && loanP > 0 && monthlyR > 0 ? (() => {
      const elFactor = Math.pow(1 + monthlyR, Math.min(i * 12, nMonths));
      return Math.max(0, Math.round(loanP * elFactor - monthlyPayment * (elFactor - 1) / monthlyR));
    })() : 0,
  })) : [];

  const hasResult = purchase > 0 || currentValue > 0;

  return (
    <div className="px-4 pb-4 space-y-4" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
      <p className="text-xs pt-3 leading-relaxed rounded-lg p-3" style={{ backgroundColor: tc.inputBg, color: tc.mutedText, border: `1px solid ${tc.borderColor}` }}>
        Estimate current asset value, depreciation, loan equity position, and total monthly cost of ownership.
      </p>

      {/* Asset type */}
      <div className="space-y-2">
        <p className="text-xs font-semibold" style={{ color: tc.sectionTitle }}>1. Asset Info</p>
        <div className="flex gap-1.5">
          {["Vehicle", "Equipment", "Other"].map(t => (
            <button key={t} onClick={() => setAssetType(t)}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ backgroundColor: assetType === t ? tc.buttonBg : tc.buttonSecondaryBg, color: assetType === t ? tc.buttonText : tc.accentColor, border: `1px solid ${tc.borderColor}` }}>
              {t}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={labelCls} style={ls}>Purchase Price (ZAR)</label>
            <input className={inpCls} style={is} placeholder="R 0" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} data-testid="vehicle-purchase-price" />
          </div>
          <div className="space-y-1">
            <label className={labelCls} style={ls}>Purchase Year</label>
            <input className={inpCls} style={is} placeholder={String(new Date().getFullYear())} type="number" value={purchaseYear} onChange={e => setPurchaseYear(e.target.value)} data-testid="vehicle-purchase-year" />
          </div>
        </div>
        {yearsOwned > 0 && <p className="text-xs" style={ls}>Years owned: <span className="font-semibold" style={ac}>{yearsOwned}</span></p>}
      </div>

      {/* Depreciation */}
      <div className="space-y-2">
        <p className="text-xs font-semibold" style={{ color: tc.sectionTitle }}>2. Depreciation</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={labelCls} style={ls}>Annual Depreciation Rate (%)</label>
            <input className={inpCls} style={is} placeholder="15" type="number" value={deprRate} onChange={e => setDeprRate(e.target.value)} data-testid="vehicle-depr-rate" />
          </div>
          <div className="space-y-1">
            <label className={labelCls} style={ls}>Manual Current Value (optional)</label>
            <input className={inpCls} style={is} placeholder="Override value" value={manualValue} onChange={e => setManualValue(e.target.value)} data-testid="vehicle-manual-value" />
          </div>
        </div>
        {purchase > 0 && <p className="text-xs" style={ls}>Calculated value: <span className="font-semibold" style={{ color: manualValue ? tc.mutedText : tc.accentColor }}>{fmt(calcValue)}</span>{manualValue ? <span style={ac} className="inline-flex items-center gap-1 ml-1"><ArrowRight className="h-3 w-3 inline" /> Manual: {fmt(num(manualValue))}</span> : ""}</p>}
      </div>

      {/* Financing */}
      <div className="space-y-2">
        <p className="text-xs font-semibold" style={{ color: tc.sectionTitle }}>3. Financing</p>
        <button onClick={() => setFinanced(p => !p)}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-all"
          style={{ backgroundColor: financed ? "rgba(74,141,181,0.15)" : tc.buttonSecondaryBg, border: `1px solid ${financed ? tc.accentColor : tc.borderColor}` }}
          data-testid="vehicle-financed">
          <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: financed ? tc.accentColor : tc.inputBg, border: `1px solid ${tc.borderColor}` }}>
            {financed && <Check className="h-2.5 w-2.5 text-white" />}
          </div>
          <p className="text-xs font-medium" style={{ color: tc.textColor }}>This asset is financed (on loan)</p>
        </button>
        {financed && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Loan Amount", val: loanAmount, set: setLoanAmount, id: "vehicle-loan-amount", placeholder: "R 0" },
              { label: "Interest Rate (%)", val: interestRate, set: setInterestRate, id: "vehicle-interest", placeholder: "11.25", isNum: true },
              { label: "Term (months)", val: loanTermMonths, set: setLoanTermMonths, id: "vehicle-term", placeholder: "72", isNum: true },
            ].map(({ label, val, set, id, placeholder, isNum }) => (
              <div key={id} className="space-y-1">
                <label className={labelCls} style={ls}>{label}</label>
                <input className={inpCls} style={is} placeholder={placeholder} type={isNum ? "number" : "text"} value={val} onChange={e => set(e.target.value)} data-testid={id} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly costs */}
      <div className="space-y-2">
        <p className="text-xs font-semibold" style={{ color: tc.sectionTitle }}>4. Monthly Costs</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Insurance", val: insurance, set: setInsurance, id: "vehicle-insurance" },
            { label: "Fuel", val: fuel, set: setFuel, id: "vehicle-fuel" },
            { label: "Maintenance", val: maintenance, set: setMaintenance, id: "vehicle-maintenance" },
            { label: "Other", val: otherCost, set: setOtherCost, id: "vehicle-other" },
          ].map(({ label, val, set, id }) => (
            <div key={id} className="space-y-1">
              <label className={labelCls} style={ls}>{label}</label>
              <input className={inpCls} style={is} placeholder="R 0" value={val} onChange={e => set(e.target.value)} data-testid={id} />
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      {hasResult && (
        <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.borderColor}` }}>
          <p className="text-xs font-semibold" style={{ color: tc.sectionTitle }}>Results</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs"><span style={ls}>Current value</span><span className="font-semibold" style={ac}>{fmt(currentValue)}</span></div>
            <div className="flex justify-between text-xs"><span style={ls}>Depreciation loss</span><span className="font-semibold" style={{ color: "#f59e0b" }}>{fmt(deprLoss)}</span></div>
            {financed && (<>
              <div className="flex justify-between text-xs"><span style={ls}>Monthly loan payment</span><span className="font-semibold" style={{ color: tc.textColor }}>{fmt(monthlyPayment)}</span></div>
              <div className="flex justify-between text-xs"><span style={ls}>Remaining loan balance</span><span className="font-semibold" style={{ color: "#ef4444" }}>{fmt(remainingBalance)}</span></div>
              <div className="flex justify-between text-xs items-center">
                <span style={ls}>Net position (equity)</span>
                <span className="font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: netPosition >= 0 ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: netPosition >= 0 ? "#22c55e" : "#ef4444" }}>
                  {netPosition >= 0 ? "+" : ""}{fmt(netPosition)}
                </span>
              </div>
            </>)}
            <div style={{ borderTop: `1px solid ${tc.borderColor}`, paddingTop: 8, marginTop: 4 }}>
              <div className="flex justify-between text-xs"><span style={ls}>Total monthly cost</span><span className="font-semibold" style={{ color: tc.textColor }}>{fmt(totalMonthly)}</span></div>
              <div className="flex justify-between text-xs mt-1"><span style={ls}>Total annual cost</span><span className="font-semibold" style={{ color: tc.textColor }}>{fmt(annualCost)}</span></div>
            </div>
          </div>
          {/* Monthly cost breakdown */}
          {totalMonthly > 0 && (
            <div className="mt-2 pt-2 space-y-1" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
              <p className="text-xs font-medium" style={ls}>Monthly breakdown</p>
              {[
                { label: "Loan payment", val: monthlyPayment, show: financed },
                { label: "Insurance", val: ins, show: ins > 0 },
                { label: "Fuel", val: fl, show: fl > 0 },
                { label: "Maintenance", val: maint, show: maint > 0 },
                { label: "Other", val: oth, show: oth > 0 },
              ].filter(x => x.show).map(({ label, val }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-0.5">
                      <span style={ls}>{label}</span><span style={{ color: tc.textColor }}>{fmt(val)}</span>
                    </div>
                    <div className="w-full rounded-full h-1" style={{ backgroundColor: tc.borderColor }}>
                      <div className="h-1 rounded-full" style={{ width: `${totalMonthly > 0 ? (val / totalMonthly) * 100 : 0}%`, backgroundColor: tc.accentColor }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Value decline graph */}
      {declineData.length > 1 && purchase > 0 && (
        <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.borderColor}` }}>
          <p className="text-xs font-semibold" style={{ color: tc.sectionTitle }}>Value Decline Over Time</p>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={declineData}>
              <defs>
                <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={tc.accentColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={tc.accentColor} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={tc.borderColor} />
              <XAxis dataKey="year" tick={{ fontSize: 9, fill: tc.mutedText }} />
              <YAxis tick={{ fontSize: 9, fill: tc.mutedText }} tickFormatter={v => `R${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}`, borderRadius: 8, fontSize: 11 }} />
              <Area type="monotone" dataKey="value" name="Asset Value" stroke={tc.accentColor} strokeWidth={2} fill="url(#valueGrad)" />
              {financed && <Area type="monotone" dataKey="balance" name="Loan Balance" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 2" fill="url(#balGrad)" />}
              <Legend wrapperStyle={{ fontSize: 10, color: tc.mutedText }} />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-xs" style={ls}>Where the lines cross = break-even point (equity turns positive)</p>
        </div>
      )}
    </div>
  );
}


function ToolboxTab({ advisor, tc }: { advisor: Advisor; tc: ReturnType<typeof getThemeColors> }) {
  const { toast } = useToast();

  const [openSections, setOpenSections] = useState({ std: false, tax: false, ci: false, pension: false, cgt: false, er: false, forex: false, scan: false, cal: false, media: false, vehicle: false, bond: false, emergency: false, lifecover: false, debt: false, myemail: false, pubtv: false, pubdq: false, pubcc: false, pubret: false, pubcal: false });
  const toggleSection = (key: keyof typeof openSections) => setOpenSections(p => ({ ...p, [key]: !p[key] }));

  // Toolbox ordering — M5(a): aligned with public profile financial tools order
  // (tax, exchange, compound, vehicle …) so when an advisor toggles
  // a tool in the panel the matching section appears in the same place on their
  // public profile. Storage key bumped to _v3 (T#43) so existing advisors pick
  // up the new pension/cgt/bond/emergency/lifecover/debt/myemail entries
  // (T#43) plus pubtv/pubdq/pubcc/pubret/pubcal (T#42 — Live Markets, Daily
  // Quotes, Compound, Retirement, Financial Calendar) rather than having them
  // silently filtered out of their saved order.
  const DEFAULT_TOOL_ORDER = ["pubtv", "pubdq", "pubcc", "pubret", "pubcal", "tax", "er", "ci", "pension", "cgt", "vehicle", "bond", "emergency", "lifecover", "debt", "std", "forex", "scan", "myemail", "cal", "media"];
  const [organizing, setOrganizing] = useState(false);
  const [toolOrder, setToolOrder] = useState<string[]>(() => {
    try {
      // Prefer the new key. If absent, perform a one-time, lossless migration
      // from the legacy key: keep any items the advisor reordered, drop any
      // unknown IDs, then append any defaults they don't have so new tools
      // don't get hidden. Only the migration writes the new key — keeps the
      // legacy key untouched until next reorder, in case of rollback.
      const v3 = localStorage.getItem("advisorToolboxOrder_v3");
      if (v3) {
        const allowed = new Set(DEFAULT_TOOL_ORDER);
        const parsed: string[] = JSON.parse(v3);
        const cleaned = parsed.filter(k => allowed.has(k));
        const merged = [...cleaned];
        for (const k of DEFAULT_TOOL_ORDER) if (!merged.includes(k)) merged.push(k);
        return merged;
      }
      const v2 = localStorage.getItem("advisorToolboxOrder_v2");
      const v1 = localStorage.getItem("advisorToolboxOrder");
      const source = v2 || v1;
      if (source) {
        const allowed = new Set(DEFAULT_TOOL_ORDER);
        const legacy: string[] = JSON.parse(source);
        const cleaned = legacy.filter(k => allowed.has(k));
        const merged = [...cleaned];
        for (const k of DEFAULT_TOOL_ORDER) if (!merged.includes(k)) merged.push(k);
        localStorage.setItem("advisorToolboxOrder_v3", JSON.stringify(merged));
        return merged;
      }
      return DEFAULT_TOOL_ORDER;
    } catch { return DEFAULT_TOOL_ORDER; }
  });
  const moveSection = (key: string, dir: -1 | 1) => {
    setToolOrder(prev => {
      const idx = prev.indexOf(key);
      if (idx < 0) return prev;
      const next = [...prev];
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      localStorage.setItem("advisorToolboxOrder_v3", JSON.stringify(next));
      return next;
    });
  };

  // Camera scan state
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanCanvasRef = useRef<HTMLCanvasElement>(null);
  const [scanStream, setScanStream] = useState<MediaStream | null>(null);
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [scanPhase, setScanPhase] = useState<"idle" | "streaming" | "captured">("idle");

  useEffect(() => {
    if (!openSections.scan && scanStream) {
      scanStream.getTracks().forEach(t => t.stop());
      setScanStream(null);
      setScanPhase("idle");
    }
  }, [openSections.scan]);

  const startScan = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setScanStream(stream);
      setScanPhase("streaming");
      setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); } }, 50);
    } catch { }
  };
  const captureScan = () => {
    if (!videoRef.current || !scanCanvasRef.current) return;
    const v = videoRef.current;
    const c = scanCanvasRef.current;
    c.width = v.videoWidth || 1280; c.height = v.videoHeight || 720;
    const ctx = c.getContext("2d");
    if (ctx) { ctx.drawImage(v, 0, 0); setScanImage(c.toDataURL("image/png")); }
    scanStream?.getTracks().forEach(t => t.stop());
    setScanStream(null);
    setScanPhase("captured");
  };
  const downloadScan = () => {
    if (!scanImage) return;
    const a = document.createElement("a"); a.href = scanImage; a.download = `scan-${Date.now()}.png`; a.click();
  };
  const shareScan = async () => {
    if (!scanImage) return;
    if (navigator.share && navigator.canShare?.({ files: [] })) {
      const res = await fetch(scanImage); const blob = await res.blob();
      const file = new File([blob], `scan-${Date.now()}.png`, { type: "image/png" });
      try { await navigator.share({ files: [file], title: "Scanned Document" }); return; } catch { }
    }
    downloadScan();
  };

  // Standard calculator state
  const [stdDisplay, setStdDisplay] = useState("0");
  const [stdPrev, setStdPrev] = useState<string | null>(null);
  const [stdOp, setStdOp] = useState<string | null>(null);
  const [stdFresh, setStdFresh] = useState(false);

  const stdPress = (val: string) => {
    if (val === "C") { setStdDisplay("0"); setStdPrev(null); setStdOp(null); setStdFresh(false); return; }
    if (val === "±") { setStdDisplay(d => d.startsWith("-") ? d.slice(1) : d === "0" ? "0" : "-" + d); return; }
    if (val === "%") { setStdDisplay(d => String(parseFloat(d) / 100)); return; }
    if (["+", "−", "×", "÷"].includes(val)) {
      setStdPrev(stdDisplay); setStdOp(val); setStdFresh(true); return;
    }
    if (val === "=") {
      if (!stdOp || !stdPrev) return;
      const a = parseFloat(stdPrev), b = parseFloat(stdDisplay);
      let r = a;
      if (stdOp === "+") r = a + b;
      else if (stdOp === "−") r = a - b;
      else if (stdOp === "×") r = a * b;
      else if (stdOp === "÷") r = b !== 0 ? a / b : 0;
      setStdDisplay(String(parseFloat(r.toFixed(10))));
      setStdPrev(null); setStdOp(null); setStdFresh(false); return;
    }
    if (val === ".") {
      setStdDisplay(d => (stdFresh ? "0." : d.includes(".") ? d : d + ".")); setStdFresh(false); return;
    }
    setStdDisplay(d => stdFresh || d === "0" ? val : d + val); setStdFresh(false);
  };

  const [newsUrl, setNewsUrl] = useState((advisor as any).financialsNewsUrl || "");
  const [factsUrl, setFactsUrl] = useState((advisor as any).financialsFunFactsUrl || "");
  const [videosUrl, setVideosUrl] = useState((advisor as any).financialsVideosUrl || "");
  const [selectedMedia, setSelectedMedia] = useState("news");
  const [mediaCopied, setMediaCopied] = useState(false);
  const [savingMedia, setSavingMedia] = useState(false);

  const [taxAmount, setTaxAmount] = useState("");
  const [taxAge, setTaxAge] = useState("35");
  const [medMembers, setMedMembers] = useState("0");
  const [retirementAge, setRetirementAge] = useState("65");
  const [incomeGrowth, setIncomeGrowth] = useState("6");
  const [inflationRate, setInflationRate] = useState("5.5");

  const [mwCategory, setMwCategory] = useState("all");
  const [mwArticles, setMwArticles] = useState<Array<{ title: string; link: string; description: string; pubDate: string; category: string }>>([]);
  const [mwLoading, setMwLoading] = useState(false);
  const [mwCopied, setMwCopied] = useState<string | null>(null);

  const [erAmount, setErAmount] = useState("1000");
  const [erFrom, setErFrom] = useState("ZAR");
  const [erTo, setErTo] = useState("USD");
  const [erRates, setErRates] = useState<Record<string, number> | null>(null);
  const [erLoading, setErLoading] = useState(false);
  const [erUpdated, setErUpdated] = useState("");

  const [ciPrincipal, setCiPrincipal] = useState("10000");
  const [ciRate, setCiRate] = useState("8");
  const [ciYears, setCiYears] = useState("10");
  const [ciMonthly, setCiMonthly] = useState("500");
  const [ciFreq, setCiFreq] = useState("12");

  // T#43: Pension Fund Calculator (advisor-side parity). T#45: polish.
  const [penBalance, setPenBalance] = useState("250000");
  const [penMonthly, setPenMonthly] = useState("3000");
  const [penRate, setPenRate] = useState("9");
  const [penYears, setPenYears] = useState("25");
  const [penInflation, setPenInflation] = useState("6");
  const [penAnnualIncome, setPenAnnualIncome] = useState("600000");
  const [penShowReal, setPenShowReal] = useState(false);
  // T#43: Capital Gains Tax Calculator (advisor-side parity). T#45: polish.
  const [cgtSalePrice, setCgtSalePrice] = useState("3000000");
  const [cgtCostBase, setCgtCostBase] = useState("1500000");
  const [cgtImprovements, setCgtImprovements] = useState("0");
  const [cgtIncome, setCgtIncome] = useState("450000");
  const [cgtAssetType, setCgtAssetType] = useState<"individual" | "special-trust" | "other-trust" | "company">("individual");
  const [cgtPrimaryResidence, setCgtPrimaryResidence] = useState(false);
  // T#43: Bond / Home Loan
  const [bondAmount, setBondAmount] = useState("1500000");
  const [bondRate, setBondRate] = useState("11.75");
  const [bondTerm, setBondTerm] = useState("20");
  // T#43: Emergency Fund
  const [efMonthly, setEfMonthly] = useState("25000");
  const [efMonths, setEfMonths] = useState("6");
  // T#43: Life Cover Needs
  const [lcIncome, setLcIncome] = useState("25000");
  const [lcYears, setLcYears] = useState("10");
  const [lcExisting, setLcExisting] = useState("0");
  // T#43: Debt Payoff
  const [dpDebt, setDpDebt] = useState("150000");
  const [dpRate, setDpRate] = useState("20");
  const [dpPayment, setDpPayment] = useState("3000");

  const _today = new Date();
  const [calYear, setCalYear] = useState(_today.getFullYear());
  const [calMonth, setCalMonth] = useState(_today.getMonth());

  // W1 T1: route through shared 60s cache + in-flight dedupe. Eliminates the
  // duplicate hit when AdvisorPanel renders inside the advisor preview pane
  // (ForexWidget separately hits its own endpoint) and stops the manual
  // refresh button from re-firing if pressed within the cache window.
  const fetchRates = async (base: string) => {
    setErLoading(true);
    const { getForexRates } = await import("@/lib/forexCache");
    const rates = await getForexRates(base);
    if (Object.keys(rates).length) {
      setErRates(rates);
      setErUpdated(new Date().toLocaleTimeString());
    }
    setErLoading(false);
  };

  const fetchMwArticles = async (cat: string) => {
    setMwLoading(true);
    try {
      const res = await fetch(`/api/moneyweb/feed?category=${cat}`);
      const data = await res.json();
      setMwArticles(data.items || []);
    } catch { setMwArticles([]); }
    setMwLoading(false);
  };

  useEffect(() => { fetchRates(erFrom); }, [erFrom]);
  useEffect(() => { fetchMwArticles(mwCategory); }, [mwCategory]);

  const mediaMap: Record<string, { label: string; url: string; setUrl: (v: string) => void }> = {
    news: { label: "Latest Financial News", url: newsUrl, setUrl: setNewsUrl },
    facts: { label: "Daily Financial Facts", url: factsUrl, setUrl: setFactsUrl },
    videos: { label: "Financial Tutorial Videos", url: videosUrl, setUrl: setVideosUrl },
  };
  const activeMedia = mediaMap[selectedMedia];

  const handleCopyMedia = () => {
    if (!activeMedia.url) return;
    navigator.clipboard.writeText(activeMedia.url).then(() => { setMediaCopied(true); setTimeout(() => setMediaCopied(false), 2000); });
  };
  const handleShareMedia = () => {
    if (!activeMedia.url) return;
    if (navigator.share) navigator.share({ url: activeMedia.url, title: activeMedia.label });
    else handleCopyMedia();
  };
  const handleSaveMedia = async () => {
    setSavingMedia(true);
    try {
      await apiRequest("PATCH", `/api/advisors/${advisor.id}`, { financialsNewsUrl: newsUrl || null, financialsFunFactsUrl: factsUrl || null, financialsVideosUrl: videosUrl || null });
      queryClient.invalidateQueries();
      toast({ title: "Saved", description: "Financial media links updated on your profile." });
    } catch { toast({ title: "Error", variant: "destructive" }); }
    setSavingMedia(false);
  };

  const TAX_BRACKETS = [
    { min: 0, max: 237100, rate: 0.18, base: 0 },
    { min: 237101, max: 370500, rate: 0.26, base: 42678 },
    { min: 370501, max: 512800, rate: 0.31, base: 77362 },
    { min: 512801, max: 673000, rate: 0.36, base: 121475 },
    { min: 673001, max: 857900, rate: 0.39, base: 179147 },
    { min: 857901, max: 1817000, rate: 0.41, base: 251258 },
    { min: 1817001, max: Infinity, rate: 0.45, base: 644489 },
  ];

  const taxForIncome = (annualIncome: number, age: number, members: number) => {
    let grossTax = 0;
    for (const b of TAX_BRACKETS) { if (annualIncome >= b.min) grossTax = b.base + (Math.min(annualIncome, b.max) - b.min) * b.rate; }
    let rebate = 17235;
    if (age >= 65) rebate += 9444;
    if (age >= 75) rebate += 3145;
    const medCredit = members === 0 ? 0 : members === 1 ? 347 * 12 : members === 2 ? 694 * 12 : (694 + (members - 2) * 234) * 12;
    const tax = Math.max(0, grossTax - rebate - medCredit);
    const uif = Math.min(annualIncome * 0.01, 177.12 * 12);
    const net = annualIncome - tax - uif;
    return { tax, uif, net, effective: annualIncome > 0 ? (tax / annualIncome) * 100 : 0 };
  };

  const calcTax = () => {
    const monthly = parseFloat(taxAmount) || 0;
    if (monthly === 0) return null;
    const annual = monthly * 12;
    const age = parseInt(taxAge) || 35;
    const members = parseInt(medMembers) || 0;
    const { tax, uif, net, effective } = taxForIncome(annual, age, members);
    return { monthly, annual, tax, uif, net, effective };
  };
  const taxResult = calcTax();

  const calcRetirement = () => {
    const monthly = parseFloat(taxAmount) || 0;
    const curAge = parseInt(taxAge) || 35;
    const retAge = parseInt(retirementAge) || 65;
    const growth = parseFloat(incomeGrowth) / 100 || 0.06;
    const inflation = parseFloat(inflationRate) / 100 || 0.055;
    const members = parseInt(medMembers) || 0;
    if (monthly === 0 || retAge <= curAge) return null;
    const years = retAge - curAge;
    let totalNominalTax = 0, totalRealTax = 0, totalNominalIncome = 0;
    for (let y = 0; y < years; y++) {
      const yearIncome = monthly * 12 * Math.pow(1 + growth, y);
      const { tax } = taxForIncome(yearIncome, curAge + y, members);
      totalNominalTax += tax;
      totalNominalIncome += yearIncome;
      totalRealTax += tax / Math.pow(1 + inflation, y);
    }
    const finalMonthlyNominal = monthly * Math.pow(1 + growth, years - 1);
    const finalMonthlyReal = finalMonthlyNominal / Math.pow(1 + inflation, years - 1);
    const { tax: finalTax, net: finalNet } = taxForIncome(finalMonthlyNominal * 12, retAge - 1, members);
    return { years, totalNominalTax, totalRealTax, totalNominalIncome, finalMonthlyNominal, finalMonthlyReal, finalTax: finalTax / 12, finalNet: finalNet / 12, lifetimeRate: totalNominalTax / totalNominalIncome * 100 };
  };
  const retirementResult = calcRetirement();

  const ZAR = (n: number) => `R\u00a0${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const erCurrencies = [
    { code: "ZAR", name: "South African Rand" },
    { code: "USD", name: "US Dollar" },
    { code: "EUR", name: "Euro" },
    { code: "GBP", name: "British Pound" },
    { code: "AUD", name: "Australian Dollar" },
    { code: "CAD", name: "Canadian Dollar" },
    { code: "CHF", name: "Swiss Franc" },
    { code: "NZD", name: "New Zealand Dollar" },
    { code: "JPY", name: "Japanese Yen" },
    { code: "CNY", name: "Chinese Yuan" },
    { code: "HKD", name: "Hong Kong Dollar" },
    { code: "SGD", name: "Singapore Dollar" },
    { code: "TWD", name: "Taiwan Dollar" },
    { code: "KRW", name: "South Korean Won" },
    { code: "INR", name: "Indian Rupee" },
    { code: "PKR", name: "Pakistani Rupee" },
    { code: "BDT", name: "Bangladeshi Taka" },
    { code: "LKR", name: "Sri Lankan Rupee" },
    { code: "THB", name: "Thai Baht" },
    { code: "MYR", name: "Malaysian Ringgit" },
    { code: "IDR", name: "Indonesian Rupiah" },
    { code: "PHP", name: "Philippine Peso" },
    { code: "VND", name: "Vietnamese Dong" },
    { code: "AED", name: "UAE Dirham" },
    { code: "SAR", name: "Saudi Riyal" },
    { code: "QAR", name: "Qatari Riyal" },
    { code: "KWD", name: "Kuwaiti Dinar" },
    { code: "BHD", name: "Bahraini Dinar" },
    { code: "OMR", name: "Omani Rial" },
    { code: "JOD", name: "Jordanian Dinar" },
    { code: "ILS", name: "Israeli Shekel" },
    { code: "TRY", name: "Turkish Lira" },
    { code: "SEK", name: "Swedish Krona" },
    { code: "NOK", name: "Norwegian Krone" },
    { code: "DKK", name: "Danish Krone" },
    { code: "PLN", name: "Polish Zloty" },
    { code: "CZK", name: "Czech Koruna" },
    { code: "HUF", name: "Hungarian Forint" },
    { code: "RON", name: "Romanian Leu" },
    { code: "RUB", name: "Russian Ruble" },
    { code: "MXN", name: "Mexican Peso" },
    { code: "BRL", name: "Brazilian Real" },
    { code: "ARS", name: "Argentine Peso" },
    { code: "CLP", name: "Chilean Peso" },
    { code: "COP", name: "Colombian Peso" },
    { code: "PEN", name: "Peruvian Sol" },
    { code: "NGN", name: "Nigerian Naira" },
    { code: "KES", name: "Kenyan Shilling" },
    { code: "GHS", name: "Ghanaian Cedi" },
    { code: "UGX", name: "Ugandan Shilling" },
    { code: "TZS", name: "Tanzanian Shilling" },
    { code: "ETB", name: "Ethiopian Birr" },
    { code: "EGP", name: "Egyptian Pound" },
    { code: "MAD", name: "Moroccan Dirham" },
    { code: "DZD", name: "Algerian Dinar" },
    { code: "TND", name: "Tunisian Dinar" },
    { code: "XOF", name: "West African CFA Franc" },
    { code: "XAF", name: "Central African CFA Franc" },
    { code: "BWP", name: "Botswana Pula" },
    { code: "ZMW", name: "Zambian Kwacha" },
    { code: "NAD", name: "Namibian Dollar" },
    { code: "MZN", name: "Mozambican Metical" },
    { code: "MUR", name: "Mauritian Rupee" },
    { code: "SZL", name: "Swazi Lilangeni" },
    { code: "LSL", name: "Lesotho Loti" },
    { code: "AOA", name: "Angolan Kwanza" },
    { code: "RWF", name: "Rwandan Franc" },
    { code: "MWK", name: "Malawian Kwacha" },
  ];
  const erConverted = erRates && erRates[erTo] ? parseFloat(erAmount) * erRates[erTo] : null;
  const erRate = erRates && erRates[erTo] ? erRates[erTo] : null;

  const calcCI = () => {
    const P = parseFloat(ciPrincipal) || 0;
    const r = parseFloat(ciRate) / 100;
    const t = parseFloat(ciYears) || 1;
    const n = parseFloat(ciFreq) || 12;
    const PMT = parseFloat(ciMonthly) || 0;
    if (r === 0) { const total = P + PMT * 12 * t; return { total, contributions: total, interest: 0 }; }
    const Ap = P * Math.pow(1 + r / n, n * t);
    const Apmt = PMT * ((Math.pow(1 + r / n, n * t) - 1) / (r / n));
    const total = Ap + Apmt;
    const contributions = P + PMT * 12 * t;
    return { total, contributions, interest: total - contributions };
  };
  const ci = calcCI();

  const getEaster = (year: number) => {
    const a = year % 19, b = Math.floor(year / 100), c = year % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    return new Date(year, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1);
  };
  const getSAHolidays = (year: number): Record<string, string> => {
    const easter = getEaster(year);
    const gf = new Date(easter); gf.setDate(easter.getDate() - 2);
    const fd = new Date(easter); fd.setDate(easter.getDate() + 1);
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return {
      [`${year}-01-01`]: "New Year's Day",
      [`${year}-03-21`]: "Human Rights Day",
      [fmt(gf)]: "Good Friday",
      [fmt(fd)]: "Family Day",
      [`${year}-04-27`]: "Freedom Day",
      [`${year}-05-01`]: "Workers' Day",
      [`${year}-06-16`]: "Youth Day",
      [`${year}-08-09`]: "National Women's Day",
      [`${year}-09-24`]: "Heritage Day",
      [`${year}-12-16`]: "Day of Reconciliation",
      [`${year}-12-25`]: "Christmas Day",
      [`${year}-12-26`]: "Day of Goodwill",
    };
  };
  const saHolidays = getSAHolidays(calYear);
  const calFirstDay = new Date(calYear, calMonth, 1).getDay();
  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const todayKey = `${_today.getFullYear()}-${String(_today.getMonth()+1).padStart(2,'0')}-${String(_today.getDate()).padStart(2,'0')}`;
  const calPrevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); };
  const calNextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); };
  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  const holidaysThisMonth = Object.entries(saHolidays).filter(([k]) => k.startsWith(`${calYear}-${String(calMonth+1).padStart(2,'0')}`));

  const is = { backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}`, color: tc.textColor };
  const cs = { backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` };
  const ls = { color: tc.mutedText };

  const ResultRow = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
    <div className="flex justify-between items-center py-1.5" style={{ borderBottom: `1px solid ${tc.borderColor}` }}>
      <span className="text-xs" style={ls}>{label}</span>
      <span className="text-sm font-semibold" style={{ color: accent ? tc.accentColor : tc.textColor }}>{value}</span>
    </div>
  );

  const sectionStyle = (key: string) => ({
    ...cs, order: toolOrder.includes(key) ? toolOrder.indexOf(key) : 999
  });

  const SectionHeader = ({ sectionKey, title, subtitle }: { sectionKey: keyof typeof openSections; icon?: React.ReactNode; title: string; subtitle: string }) => (
    <div className="flex items-center gap-2">
      {organizing && (
        <div className="flex flex-col gap-0 flex-shrink-0">
          <button type="button" onClick={() => moveSection(sectionKey, -1)} className="p-1 rounded hover:opacity-70" style={{ color: tc.mutedText }}>
            <ArrowUp className="h-3 w-3" />
          </button>
          <button type="button" onClick={() => moveSection(sectionKey, 1)} className="p-1 rounded hover:opacity-70" style={{ color: tc.mutedText }}>
            <ArrowDown className="h-3 w-3" />
          </button>
        </div>
      )}
      <button type="button" onClick={() => !organizing && toggleSection(sectionKey)} className="flex-1 flex items-center justify-between text-left" style={{ color: tc.textColor }}>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>{title}</h3>
          <p className="text-xs mt-0.5" style={ls}>{subtitle}</p>
        </div>
        {organizing
          ? <GripVertical className="h-4 w-4 flex-shrink-0 ml-3" style={{ color: tc.mutedText }} />
          : <ChevronDown className={`h-4 w-4 flex-shrink-0 ml-3 transition-transform duration-200 ${openSections[sectionKey] ? "rotate-180" : ""}`} style={ls} />
        }
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-3 pb-6">
      {/* Organize bar */}
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: tc.mutedText }}>Drag tools into your preferred order</p>
        <button
          type="button"
          onClick={() => setOrganizing(o => !o)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{ backgroundColor: organizing ? tc.accentColor : tc.buttonSecondaryBg, color: organizing ? (tc.isDark ? "#000" : "#fff") : tc.accentColor, border: `1px solid ${tc.accentColor}` }}
          data-testid="button-organize-toolbox"
        >
          <GripVertical className="h-3 w-3" />
          {organizing ? "Done" : "Organise"}
        </button>
      </div>

      {/* ─── Public-Profile Widgets (Task #42) ─── */}

      {/* Live Markets (TradingView) */}
      <div className="rounded-xl overflow-hidden" style={sectionStyle("pubtv")}>
        <div className="p-4">
          <SectionHeader sectionKey="pubtv" icon={<LineChart className="h-4 w-4" style={{ color: tc.accentColor }} />} title="Live Markets" subtitle="Same TradingView chart that appears on your public profile." />
        </div>
        {openSections.pubtv && (
          <div className="px-4 pb-4 pt-3" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
            <TradingViewSection tc={tc} advisor={advisor} />
          </div>
        )}
      </div>

      {/* Daily Quote */}
      <div className="rounded-xl overflow-hidden" style={sectionStyle("pubdq")}>
        <div className="p-4">
          <SectionHeader sectionKey="pubdq" icon={<Quote className="h-4 w-4" style={{ color: tc.accentColor }} />} title="Daily Quote" subtitle="Today's quote — tap Share to send as a branded PNG." />
        </div>
        {openSections.pubdq && (
          <div className="px-4 pb-4 pt-3" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
            <DailyQuoteSection tc={tc} advisor={advisor} />
          </div>
        )}
      </div>

      {/* Compound Interest (public widget) */}
      <div className="rounded-xl overflow-hidden" style={sectionStyle("pubcc")}>
        <div className="p-4">
          <SectionHeader sectionKey="pubcc" icon={<Calculator className="h-4 w-4" style={{ color: tc.accentColor }} />} title="Compound Interest (Profile Widget)" subtitle="Quick compound calc with growth chart — mirrors the public profile." />
        </div>
        {openSections.pubcc && (
          <div className="px-4 pb-4 pt-3" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
            <CompoundCalcSection tc={tc} />
          </div>
        )}
      </div>

      {/* Retirement Savings */}
      <div className="rounded-xl overflow-hidden" style={sectionStyle("pubret")}>
        <div className="p-4">
          <SectionHeader sectionKey="pubret" icon={<PiggyBank className="h-4 w-4" style={{ color: tc.accentColor }} />} title="Retirement Savings" subtitle="Project a retirement pot and check against a target income." />
        </div>
        {openSections.pubret && (
          <div className="px-4 pb-4 pt-3" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
            <RetirementCalcSection tc={tc} />
          </div>
        )}
      </div>

      {/* Financial Calendar (public widget) */}
      <div className="rounded-xl overflow-hidden" style={sectionStyle("pubcal")}>
        <div className="p-4">
          <SectionHeader sectionKey="pubcal" icon={<CalendarDays className="h-4 w-4" style={{ color: tc.accentColor }} />} title="What's Coming Up" subtitle="Next 6 SA financial events — SARB, SARS, Budget, JSE & FAIS." />
        </div>
        {openSections.pubcal && (
          <div className="px-4 pb-4 pt-3" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
            <FinancialCalendarSection tc={tc} />
          </div>
        )}
      </div>

      {/* Standard Calculator */}
      <div className="rounded-xl overflow-hidden" style={sectionStyle("std")}>
        <div className="p-4">
          <SectionHeader sectionKey="std" icon={<Calculator className="h-4 w-4" style={{ color: tc.accentColor }} />} title="Standard Calculator" subtitle="Basic arithmetic — add, subtract, multiply, divide." />
        </div>
        {openSections.std && (
          <div className="px-4 pb-4" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
            <div className="pt-3">
              {/* Display */}
              <div className="rounded-lg px-4 py-3 mb-3 text-right" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.inputBorder}` }}>
                {stdOp && stdPrev && <p className="text-xs mb-0.5" style={{ color: tc.mutedText }}>{stdPrev} {stdOp}</p>}
                <p className="text-2xl font-bold tracking-tight truncate" style={{ color: tc.textColor }}>{stdDisplay}</p>
              </div>
              {/* Buttons */}
              {[
                ["C", "±", "%", "÷"],
                ["7", "8", "9", "×"],
                ["4", "5", "6", "−"],
                ["1", "2", "3", "+"],
                ["0", ".", "="],
              ].map((row, ri) => (
                <div key={ri} className={`grid gap-2 mb-2 ${row.length === 3 ? "grid-cols-3" : "grid-cols-4"}`}>
                  {row.map(key => {
                    const isOp = ["÷", "×", "−", "+", "="].includes(key);
                    const isFn = ["C", "±", "%"].includes(key);
                    const isZero = key === "0" && row.length === 3;
                    return (
                      <button
                        key={key}
                        onClick={() => stdPress(key)}
                        className={`py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80 active:scale-95 ${isZero ? "col-span-2" : ""}`}
                        style={{
                          backgroundColor: isOp ? tc.accentColor : isFn ? tc.buttonSecondaryBg : tc.inputBg,
                          color: isOp ? (tc.isDark ? "#000" : "#fff") : isFn ? tc.accentColor : tc.textColor,
                          border: `1px solid ${isOp ? tc.accentColor : tc.borderColor}`,
                        }}
                        data-testid={`calc-btn-${key}`}
                      >
                        {key}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SA Tax Calculator */}
      <div className="rounded-xl overflow-hidden" style={sectionStyle("tax")}>
        <div className="p-4">
          <SectionHeader sectionKey="tax" icon={<TrendingUp className="h-4 w-4" style={{ color: tc.accentColor }} />} title="SA Tax Calculator" subtitle="2024/2025 — monthly PAYE with lifetime retirement projection." />
        </div>
        {openSections.tax && (
          <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${tc.borderColor}` }}>

            {/* Inputs */}
            <div className="pt-3 space-y-1">
              <label className="text-xs" style={ls}>Monthly Gross Income (R)</label>
              <input type="number" value={taxAmount} onChange={e => setTaxAmount(e.target.value)} placeholder="e.g. 25 000" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs" style={ls}>Current Age</label>
                <input type="number" value={taxAge} onChange={e => setTaxAge(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} />
              </div>
              <div className="space-y-1">
                <label className="text-xs" style={ls}>Retirement Age</label>
                <input type="number" value={retirementAge} onChange={e => setRetirementAge(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} />
              </div>
              <div className="space-y-1">
                <label className="text-xs" style={ls}>Annual Income Growth (%)</label>
                <input type="number" value={incomeGrowth} onChange={e => setIncomeGrowth(e.target.value)} step="0.5" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} />
              </div>
              <div className="space-y-1">
                <label className="text-xs" style={ls}>Inflation Rate (%)</label>
                <input type="number" value={inflationRate} onChange={e => setInflationRate(e.target.value)} step="0.5" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs" style={ls}>Medical Aid Members</label>
                <TSelect value={medMembers} onChange={setMedMembers} colors={tc} options={[0,1,2,3,4,5,6].map(n => ({ value: String(n), label: n === 0 ? "None" : `${n} member${n > 1 ? "s" : ""}` }))} />
              </div>
            </div>

            {taxResult ? (
              <>
                {/* Current month breakdown */}
                <div className="rounded-lg p-3" style={{ backgroundColor: tc.inputBg }}>
                  <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: tc.accentColor }}>This Month</p>
                  <ResultRow label="Gross Monthly Income" value={ZAR(taxResult.monthly)} />
                  <ResultRow label="PAYE Tax" value={ZAR(taxResult.tax / 12)} accent />
                  <ResultRow label="UIF" value={ZAR(taxResult.uif / 12)} />
                  <ResultRow label="Effective Tax Rate" value={`${taxResult.effective.toFixed(2)}%`} accent />
                  <ResultRow label="Monthly Take-home" value={ZAR(taxResult.net / 12)} accent />
                </div>

                {/* Retirement projection */}
                {retirementResult && (
                  <div className="rounded-lg p-3" style={{ backgroundColor: tc.inputBg }}>
                    <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: tc.accentColor }}>
                      Retirement Projection — {retirementResult.years} years
                    </p>
                    <ResultRow label="Total Tax Paid (nominal)" value={ZAR(retirementResult.totalNominalTax)} accent />
                    <ResultRow label="Total Tax Paid (today's money)" value={ZAR(retirementResult.totalRealTax)} />
                    <ResultRow label="Total Income Earned" value={ZAR(retirementResult.totalNominalIncome)} />
                    <ResultRow label="Lifetime Effective Tax Rate" value={`${retirementResult.lifetimeRate.toFixed(2)}%`} accent />
                    <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
                      <p className="text-xs font-medium mb-1" style={ls}>At Retirement (age {retirementAge})</p>
                      <ResultRow label="Final Monthly Income (nominal)" value={ZAR(retirementResult.finalMonthlyNominal)} />
                      <ResultRow label="Final Monthly Income (today's money)" value={ZAR(retirementResult.finalMonthlyReal)} />
                      <ResultRow label="Final Month's Tax" value={ZAR(retirementResult.finalTax)} accent />
                      <ResultRow label="Final Month's Take-home" value={ZAR(retirementResult.finalNet)} accent />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-center py-3" style={ls}>Enter a monthly gross income to calculate</p>
            )}
          </div>
        )}
      </div>

      {/* Compound Interest Calculator */}
      <div className="rounded-xl overflow-hidden" style={sectionStyle("ci")}>
        <div className="p-4">
          <SectionHeader sectionKey="ci" icon={<TrendingUp className="h-4 w-4" style={{ color: tc.accentColor }} />} title="Compound Interest Calculator" subtitle="Future value with regular monthly contributions." />
        </div>
        {openSections.ci && (
          <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
            <div className="pt-3 grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs" style={ls}>Principal (R)</label>
                <input type="number" value={ciPrincipal} onChange={e => setCiPrincipal(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} />
              </div>
              <div className="space-y-1">
                <label className="text-xs" style={ls}>Annual Rate (%)</label>
                <input type="number" value={ciRate} onChange={e => setCiRate(e.target.value)} step="0.1" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} />
              </div>
              <div className="space-y-1">
                <label className="text-xs" style={ls}>Years</label>
                <input type="number" value={ciYears} onChange={e => setCiYears(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} />
              </div>
              <div className="space-y-1">
                <label className="text-xs" style={ls}>Monthly Contribution (R)</label>
                <input type="number" value={ciMonthly} onChange={e => setCiMonthly(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs" style={ls}>Compounding Frequency</label>
                <TSelect value={ciFreq} onChange={setCiFreq} colors={tc} options={[
                  { value: "1", label: "Annually" },
                  { value: "2", label: "Semi-annually" },
                  { value: "4", label: "Quarterly" },
                  { value: "12", label: "Monthly" },
                  { value: "365", label: "Daily" },
                ]} />
              </div>
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: tc.inputBg }}>
              <ResultRow label="Total Contributions" value={ZAR(ci.contributions)} />
              <ResultRow label="Interest Earned" value={ZAR(ci.interest)} accent />
              <ResultRow label={`Final Balance after ${ciYears} years`} value={ZAR(ci.total)} accent />
            </div>
          </div>
        )}
      </div>

      {/* Exchange Rate Calculator */}
      <div className="rounded-xl overflow-hidden" style={sectionStyle("er")}>
        <div className="p-4 flex items-center justify-between gap-3">
          <div className="flex-1">
            <SectionHeader sectionKey="er" icon={<ArrowLeftRight className="h-4 w-4" style={{ color: tc.accentColor }} />} title="Exchange Rate Calculator" subtitle={`Live rates via ExchangeRate-API${erUpdated ? ` · ${erUpdated}` : ""}`} />
          </div>
          <button type="button" onClick={e => { e.stopPropagation(); fetchRates(erFrom); }} className="p-1.5 rounded-lg hover:opacity-70 flex-shrink-0" style={{ backgroundColor: tc.buttonSecondaryBg }}>
            <RefreshCw className={`h-3.5 w-3.5 ${erLoading ? "animate-spin" : ""}`} style={{ color: tc.accentColor }} />
          </button>
        </div>
        {openSections.er && (
          <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
            <div className="pt-3 flex gap-2">
              <input type="number" value={erAmount} onChange={e => setErAmount(e.target.value)} className="flex-1 px-3 py-2 rounded-lg text-sm outline-none" style={is} />
              <TSelect value={erFrom} onChange={setErFrom} colors={tc} className="w-24" codeOnly options={erCurrencies.map(c => ({ value: c.code, label: `${c.code} — ${c.name}` }))} />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ backgroundColor: tc.borderColor }} />
              <ArrowLeftRight className="h-3.5 w-3.5 flex-shrink-0" style={ls} />
              <div className="flex-1 h-px" style={{ backgroundColor: tc.borderColor }} />
            </div>
            <TSelect value={erTo} onChange={setErTo} colors={tc} options={erCurrencies.filter(c => c.code !== erFrom).map(c => ({ value: c.code, label: `${c.code} — ${c.name}` }))} />
            {erLoading ? (
              <div className="flex items-center justify-center gap-2 py-3">
                <Loader2 className="h-4 w-4 animate-spin" style={ls} />
                <span className="text-xs" style={ls}>Fetching rates…</span>
              </div>
            ) : erConverted !== null ? (
              <div className="rounded-lg p-4 text-center" style={{ backgroundColor: tc.inputBg }}>
                <p className="text-2xl font-bold" style={{ color: tc.accentColor }}>
                  {erConverted.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {erTo}
                </p>
                <p className="text-xs mt-1" style={ls}>1 {erFrom} = {erRate?.toFixed(5)} {erTo}</p>
              </div>
            ) : (
              <p className="text-xs text-center py-3" style={ls}>Could not fetch rates. Check connection and try refreshing.</p>
            )}

            {/* ZAR Top 10 Rate Table */}
            {erRates && (
              <div className="pt-1" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
                <p className="text-xs font-semibold pt-2 pb-2" style={{ color: tc.sectionTitle }}>ZAR vs Top 10 Currencies</p>
                <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${tc.borderColor}` }}>
                  <div className="grid grid-cols-3 px-3 py-1.5" style={{ backgroundColor: tc.inputBg, borderBottom: `1px solid ${tc.borderColor}` }}>
                    <span className="text-xs font-medium" style={{ color: tc.mutedText }}>Currency</span>
                    <span className="text-xs font-medium text-right" style={{ color: tc.mutedText }}>1 ZAR =</span>
                    <span className="text-xs font-medium text-right" style={{ color: tc.mutedText }}>1 unit = ZAR</span>
                  </div>
                  {[
                    { code: "USD", name: "US Dollar" },
                    { code: "EUR", name: "Euro" },
                    { code: "GBP", name: "British Pound" },
                    { code: "AUD", name: "Aus Dollar" },
                    { code: "CAD", name: "Can Dollar" },
                    { code: "CHF", name: "Swiss Franc" },
                    { code: "JPY", name: "Japanese Yen" },
                    { code: "CNY", name: "Chinese Yuan" },
                    { code: "HKD", name: "HK Dollar" },
                    { code: "NZD", name: "NZ Dollar" },
                  ].map(({ code, name }, i) => {
                    const zarBase = erFrom === "ZAR" ? erRates[code] : null;
                    const invertedBase = erFrom === "ZAR" && erRates[code] ? 1 / erRates[code] : null;
                    const fromZar = zarBase ? zarBase.toFixed(code === "JPY" ? 2 : 4) : "—";
                    const toZar = invertedBase ? invertedBase.toFixed(4) : "—";
                    return (
                      <div key={code} className="grid grid-cols-3 px-3 py-2" style={{ borderBottom: i < 9 ? `1px solid ${tc.borderColor}` : "none", backgroundColor: i % 2 === 0 ? "transparent" : tc.inputBg + "55" }}>
                        <div>
                          <span className="text-xs font-semibold" style={{ color: tc.accentColor }}>{code}</span>
                          <span className="text-xs ml-1.5 hidden sm:inline" style={{ color: tc.mutedText }}>{name}</span>
                        </div>
                        <span className="text-xs text-right font-medium" style={{ color: tc.textColor }}>{fromZar}</span>
                        <span className="text-xs text-right" style={{ color: tc.mutedText }}>{toZar}</span>
                      </div>
                    );
                  })}
                </div>
                {erFrom !== "ZAR" && (
                  <p className="text-xs mt-2 text-center" style={{ color: tc.mutedText }}>
                    Switch base currency to <button onClick={() => setErFrom("ZAR")} className="underline" style={{ color: tc.accentColor }}>ZAR</button> to see live ZAR rates
                  </p>
                )}
                {erUpdated && <p className="text-xs mt-1 text-center" style={{ color: tc.mutedText }}>Updated: {erUpdated}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Forex Calculator */}
      <div className="rounded-xl overflow-hidden" style={sectionStyle("forex")}>
        <div className="p-4">
          <SectionHeader sectionKey="forex" icon={<TrendingUp className="h-4 w-4" style={{ color: tc.accentColor }} />} title="Forex Calculator" subtitle="Pip value, lot sizing, margin, spread cost & net profit/loss." />
        </div>
        {openSections.forex && (
          <div className="px-4 pb-4" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
            <ForexCalcPanel tc={tc} />
          </div>
        )}
      </div>

      {/* Scan Documents */}
      <div className="rounded-xl overflow-hidden" style={sectionStyle("scan")}>
        <div className="p-4">
          <SectionHeader sectionKey="scan" icon={<Camera className="h-4 w-4" style={{ color: tc.accentColor }} />} title="Scan Documents" subtitle="Use your camera to capture, save, share or download documents." />
        </div>
        {openSections.scan && (
          <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
            <canvas ref={scanCanvasRef} style={{ display: "none" }} />
            {scanPhase === "idle" && (
              <div className="pt-4 flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: tc.buttonSecondaryBg }}>
                  <Camera className="h-8 w-8" style={{ color: tc.accentColor }} />
                </div>
                <p className="text-xs text-center leading-relaxed" style={{ color: tc.mutedText }}>Point your camera at a document to capture it — works best in good lighting.</p>
                <button
                  type="button"
                  onClick={startScan}
                  className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}
                  data-testid="button-start-scan"
                >
                  <Camera className="h-4 w-4" /> Open Camera
                </button>
              </div>
            )}
            {scanPhase === "streaming" && (
              <div className="pt-3 space-y-3">
                <div className="rounded-xl overflow-hidden" style={{ border: `2px solid ${tc.accentColor}` }}>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full" style={{ display: "block", maxHeight: "300px", objectFit: "cover", background: "#000" }} />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { scanStream?.getTracks().forEach(t => t.stop()); setScanStream(null); setScanPhase("idle"); }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-medium" style={{ backgroundColor: tc.inputBg, color: tc.mutedText, border: `1px solid ${tc.borderColor}` }}>
                    Cancel
                  </button>
                  <button type="button" onClick={captureScan}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                    style={{ backgroundColor: tc.accentColor, color: tc.isDark ? "#000" : "#fff" }}
                    data-testid="button-capture-scan">
                    <Camera className="h-4 w-4" /> Capture
                  </button>
                </div>
              </div>
            )}
            {scanPhase === "captured" && scanImage && (
              <div className="pt-3 space-y-3">
                <div className="rounded-xl overflow-hidden" style={{ border: `2px solid ${tc.accentColor}` }}>
                  <img src={scanImage} alt="Captured document" className="w-full" style={{ display: "block", maxHeight: "300px", objectFit: "contain", background: "#000" }} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={downloadScan}
                    className="py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor, border: `1px solid ${tc.accentColor}` }}
                    data-testid="button-download-scan">
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                  <button type="button" onClick={shareScan}
                    className="py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor, border: `1px solid ${tc.accentColor}` }}
                    data-testid="button-share-scan">
                    <ExternalLink className="h-3.5 w-3.5" /> Share
                  </button>
                </div>
                <button type="button" onClick={() => { setScanImage(null); setScanPhase("idle"); }}
                  className="w-full py-2.5 rounded-xl text-xs font-medium"
                  style={{ backgroundColor: tc.inputBg, color: tc.mutedText, border: `1px solid ${tc.borderColor}` }}>
                  Scan Another
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SA Calendar */}
      <div className="rounded-xl overflow-hidden" style={sectionStyle("cal")}>
        <div className="p-4">
          <SectionHeader sectionKey="cal" icon={<CalendarDays className="h-4 w-4" style={{ color: tc.accentColor }} />} title="Financial Calendar" subtitle="SA public holidays, SARB MPC, SARS deadlines, JSE results, Budget & FAIS dates." />
        </div>
        {openSections.cal && (
          <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${tc.borderColor}` }}>

            {/* Month nav */}
            <div className="flex items-center justify-between pt-3">
              <button type="button" onClick={calPrevMonth} className="p-1.5 rounded-lg hover:opacity-70" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor }}>
                <ChevronDown className="h-4 w-4 rotate-90" />
              </button>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: tc.textColor }}>{MONTH_NAMES[calMonth]} {calYear}</p>
              </div>
              <button type="button" onClick={calNextMonth} className="p-1.5 rounded-lg hover:opacity-70" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor }}>
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-0.5">
              {DAY_NAMES.map(d => (
                <div key={d} className="text-center text-xs font-medium py-1" style={{ color: d === "Su" || d === "Sa" ? tc.accentColor : tc.mutedText }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: calFirstDay }, (_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: calDaysInMonth }, (_, i) => {
                const day = i + 1;
                const dateKey = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                const isToday = dateKey === todayKey;
                const holiday = saHolidays[dateKey];
                const dow = (calFirstDay + i) % 7;
                const isWeekend = dow === 0 || dow === 6;
                return (
                  <div key={day} title={holiday || ""} className="relative text-center text-xs py-1.5 rounded-md cursor-default" style={{
                    backgroundColor: isToday ? tc.accentColor : holiday ? tc.buttonSecondaryBg : "transparent",
                    color: isToday ? tc.buttonText : holiday ? tc.accentColor : isWeekend ? tc.accentColor : tc.textColor,
                    fontWeight: isToday || holiday ? 700 : isWeekend ? 500 : 400,
                    opacity: 1,
                  }}>
                    {day}
                    {holiday && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ backgroundColor: tc.accentColor }} />}
                  </div>
                );
              })}
            </div>

            {/* Holidays this month */}
            {holidaysThisMonth.length > 0 && (
              <div className="rounded-lg p-3 space-y-1.5" style={{ backgroundColor: tc.inputBg }}>
                <p className="text-xs font-semibold mb-1" style={{ color: tc.accentColor }}>Public Holidays This Month</p>
                {holidaysThisMonth.sort(([a],[b]) => a.localeCompare(b)).map(([dateKey, name]) => {
                  const day = parseInt(dateKey.split("-")[2]);
                  return (
                    <div key={dateKey} className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: tc.textColor }}>{name}</span>
                      <span className="text-xs font-medium" style={{ color: tc.mutedText }}>{day} {MONTH_NAMES[calMonth].slice(0,3)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* SA Financial events (SARB MPC, SARS, Budget, JSE, FAIS) — Task #29 */}
            <div className="rounded-lg p-3 space-y-1.5" style={{ backgroundColor: tc.inputBg }}>
              <p className="text-xs font-semibold mb-1" style={{ color: tc.accentColor }}>SA Financial Events 2026</p>
              {SA_FINANCIAL_EVENTS_2026.slice().sort((a, b) => a.date.localeCompare(b.date)).map((ev, idx) => {
                const d = new Date(ev.date);
                const isPast = d < new Date(_today.getFullYear(), _today.getMonth(), _today.getDate());
                const colour = getCategoryColor(ev.category);
                return (
                  <div key={`${ev.date}-${idx}`} className="flex items-start gap-2 py-1" style={{ opacity: isPast ? 0.45 : 1 }} data-testid={`fin-event-${idx}`}>
                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-full mt-0.5" style={{ backgroundColor: `${colour}22`, color: colour, minWidth: 44, textAlign: "center" }}>{ev.category}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs" style={{ color: tc.textColor }}>{ev.title}</p>
                      {ev.detail && <p className="text-[10px]" style={{ color: tc.mutedText }}>{ev.detail}</p>}
                    </div>
                    <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: tc.mutedText }}>{d.getDate()} {MONTH_NAMES[d.getMonth()].slice(0,3)}</span>
                  </div>
                );
              })}
            </div>

            {/* Full year upcoming holidays */}
            <div className="rounded-lg p-3 space-y-1.5" style={{ backgroundColor: tc.inputBg }}>
              <p className="text-xs font-semibold mb-1" style={{ color: tc.accentColor }}>All SA Public Holidays {calYear}</p>
              {Object.entries(saHolidays).sort(([a],[b]) => a.localeCompare(b)).map(([dateKey, name]) => {
                const [y, m, d] = dateKey.split("-").map(Number);
                const isPast = new Date(y, m-1, d) < new Date(_today.getFullYear(), _today.getMonth(), _today.getDate());
                return (
                  <div key={dateKey} className="flex items-center justify-between" style={{ opacity: isPast ? 0.45 : 1 }}>
                    <span className="text-xs" style={{ color: tc.textColor }}>{name}</span>
                    <span className="text-xs font-medium" style={{ color: tc.mutedText }}>{d} {MONTH_NAMES[m-1].slice(0,3)}</span>
                  </div>
                );
              })}
            </div>

          </div>
        )}
      </div>

      {/* Financial Media */}
      <div className="rounded-xl overflow-hidden" style={sectionStyle("media")}>
        <div className="p-4">
          <SectionHeader sectionKey="media" icon={<ExternalLink className="h-4 w-4" style={{ color: tc.accentColor }} />} title="Financial Media" subtitle="Set media links — copy & share to socials, and they populate your profile." />
        </div>
        {openSections.media && (
          <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
            <div className="pt-3">
              <TSelect value={selectedMedia} onChange={setSelectedMedia} colors={tc} options={[
                { value: "news", label: "Latest Financial News" },
                { value: "facts", label: "Daily Financial Facts" },
                { value: "videos", label: "Financial Tutorial Videos" },
              ]} />
            </div>
            <div className="flex gap-2">
              <input type="url" value={activeMedia.url} onChange={e => activeMedia.setUrl(e.target.value)} placeholder="https://www.moneyweb.co.za/..." className="flex-1 px-3 py-2 rounded-lg text-sm outline-none" style={is} />
              <button onClick={handleCopyMedia} disabled={!activeMedia.url} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium hover:opacity-70 disabled:opacity-30" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor, border: `1px solid ${tc.borderColor}` }}>
                {mediaCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {mediaCopied ? "Copied!" : "Copy"}
              </button>
              <button onClick={handleShareMedia} disabled={!activeMedia.url} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium hover:opacity-70 disabled:opacity-30" style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}>
                <ExternalLink className="h-3.5 w-3.5" /> Share
              </button>
            </div>
            <div className="space-y-2 pt-1" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
              <p className="text-xs font-medium pt-2" style={ls}>All 3 links (saved to profile)</p>
              {[
                { label: "News", val: newsUrl, set: setNewsUrl },
                { label: "Fun Facts", val: factsUrl, set: setFactsUrl },
                { label: "Videos", val: videosUrl, set: setVideosUrl },
              ].map(({ label, val, set }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-xs w-20 flex-shrink-0" style={ls}>{label}</span>
                  <input type="url" value={val} onChange={e => set(e.target.value)} placeholder="https://..." className="flex-1 px-2 py-1.5 rounded-lg text-xs outline-none" style={is} />
                </div>
              ))}
              <button onClick={handleSaveMedia} disabled={savingMedia} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-70" style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}>
                {savingMedia ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Save Links to Profile
              </button>
            </div>

            {/* Live MoneyWeb Articles */}
            <div className="pt-1" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
              <div className="flex items-center justify-between pt-2 mb-2">
                <p className="text-xs font-semibold" style={{ color: tc.sectionTitle }}>Live MoneyWeb Articles</p>
                <div className="flex items-center gap-2">
                  <TSelect value={mwCategory} onChange={setMwCategory} colors={tc} className="w-36" options={[
                    { value: "all", label: "All Finance" },
                    { value: "news", label: "News" },
                    { value: "markets", label: "Markets" },
                    { value: "investing", label: "Investing" },
                    { value: "personal-finance", label: "Personal Finance" },
                  ]} />
                  <button type="button" onClick={() => fetchMwArticles(mwCategory)} className="p-1.5 rounded-lg hover:opacity-70 flex-shrink-0" style={{ backgroundColor: tc.buttonSecondaryBg }}>
                    <RefreshCw className={`h-3.5 w-3.5 ${mwLoading ? "animate-spin" : ""}`} style={{ color: tc.accentColor }} />
                  </button>
                </div>
              </div>
              {mwLoading ? (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2 className="h-4 w-4 animate-spin" style={ls} />
                  <span className="text-xs" style={ls}>Loading articles…</span>
                </div>
              ) : mwArticles.length === 0 ? (
                <p className="text-xs text-center py-4" style={ls}>No articles loaded. Try refreshing.</p>
              ) : (
                <div className="space-y-2">
                  {mwArticles.map((article, i) => (
                    <div key={i} className="rounded-lg p-3 space-y-1" style={{ backgroundColor: tc.inputBg }}>
                      <div className="flex items-start justify-between gap-2">
                        <a href={article.link} target="_blank" rel="noopener noreferrer" className="text-xs font-medium leading-snug hover:underline flex-1" style={{ color: tc.textColor }}>{article.title}</a>
                        <button type="button" onClick={() => { navigator.clipboard.writeText(article.link); setMwCopied(article.link); setTimeout(() => setMwCopied(null), 2000); }} className="flex-shrink-0 p-1 rounded hover:opacity-70" style={{ color: mwCopied === article.link ? tc.accentColor : tc.mutedText }}>
                          {mwCopied === article.link ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        {article.category && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor }}>{article.category}</span>}
                        {article.pubDate && <span className="text-xs" style={ls}>{new Date(article.pubDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}</span>}
                      </div>
                      {article.description && <p className="text-xs leading-relaxed line-clamp-2" style={ls}>{article.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Vehicle & Assets Calculator */}
      <div className="rounded-xl overflow-hidden" style={sectionStyle("vehicle")}>
        <div className="p-4">
          <SectionHeader sectionKey="vehicle" icon={<ArrowLeftRight className="h-4 w-4" style={{ color: tc.accentColor }} />} title="Vehicle & Assets Calculator" subtitle="Depreciation, loan equity, net position & total cost of ownership." />
        </div>
        {openSections.vehicle && (
          <div className="px-4 pb-4" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
            <VehicleCalcPanel tc={tc} />
          </div>
        )}
      </div>

      {/* Pension Fund Calculator — T#43 restore, T#45 polish */}
      {(() => {
        const P = parseFloat(penBalance) || 0;
        const PMT = parseFloat(penMonthly) || 0;
        const r = (parseFloat(penRate) || 0) / 100;
        const t = parseFloat(penYears) || 0;
        const i = (parseFloat(penInflation) || 0) / 100;
        const n = 12;
        const finalNominal = r > 0
          ? P * Math.pow(1 + r / n, n * t) + PMT * ((Math.pow(1 + r / n, n * t) - 1) / (r / n))
          : P + PMT * 12 * t;
        const contrib = P + PMT * 12 * t;
        const finalReal = i > 0 && t > 0 ? finalNominal / Math.pow(1 + i, t) : finalNominal;
        const finalVal = penShowReal ? finalReal : finalNominal;
        const incomeForCap = parseFloat(penAnnualIncome) || 0;
        const annualContrib = PMT * 12;
        const s11fCap = Math.min(350000, 0.275 * incomeForCap);
        const overCap = annualContrib > s11fCap && s11fCap > 0;
        return (
          <div className="rounded-xl overflow-hidden" style={sectionStyle("pension")}>
            <div className="p-4">
              <SectionHeader sectionKey="pension" title="Pension Fund Calculator" subtitle="Project retirement balance from current pot plus monthly contributions." />
            </div>
            {openSections.pension && (
              <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
                <div className="pt-3 grid grid-cols-2 gap-2">
                  <div className="space-y-1"><label className="text-xs" style={ls}>Current Balance (R)</label><input type="number" value={penBalance} onChange={e => setPenBalance(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} /></div>
                  <div className="space-y-1"><label className="text-xs" style={ls}>Monthly Contribution (R)</label><input type="number" value={penMonthly} onChange={e => setPenMonthly(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} /></div>
                  <div className="space-y-1"><label className="text-xs" style={ls}>Annual Growth (%)</label><input type="number" value={penRate} onChange={e => setPenRate(e.target.value)} step="0.1" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} /></div>
                  <div className="space-y-1"><label className="text-xs" style={ls}>Years to Retirement</label><input type="number" value={penYears} onChange={e => setPenYears(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} /></div>
                  <div className="space-y-1"><label className="text-xs" style={ls}>Inflation (%)</label><input type="number" value={penInflation} onChange={e => setPenInflation(e.target.value)} step="0.1" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} /></div>
                  <div className="space-y-1"><label className="text-xs" style={ls}>Annual Taxable Income (R)</label><input type="number" value={penAnnualIncome} onChange={e => setPenAnnualIncome(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} /></div>
                </div>
                <label className="flex items-center gap-2 text-xs cursor-pointer" style={ls}>
                  <input type="checkbox" checked={penShowReal} onChange={e => setPenShowReal(e.target.checked)} />
                  <span>Show in today's money (inflation-adjusted)</span>
                </label>
                <div className="rounded-lg p-3" style={{ backgroundColor: tc.inputBg }}>
                  <ResultRow label="Total Contributions" value={ZAR(contrib)} />
                  <ResultRow label="Growth Earned" value={ZAR(finalVal - contrib)} accent />
                  <ResultRow label={`Projected Balance in ${penYears} yrs${penShowReal ? " (real)" : " (nominal)"}`} value={ZAR(finalVal)} accent />
                  <ResultRow label={penShowReal ? "Nominal equivalent" : "Today's-money equivalent"} value={ZAR(penShowReal ? finalNominal : finalReal)} />
                  <ResultRow label="Annual Contribution vs s11F cap" value={`${ZAR(annualContrib)} / ${ZAR(s11fCap)}`} />
                </div>
                {overCap && (
                  <p className="text-xs flex items-start gap-1.5" style={{ color: tc.accentColor }}>
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>Contributions exceed the s11F deductible cap (27.5% of taxable income, max R350 000/yr). Excess carries forward but isn't deductible this year.</span>
                  </p>
                )}
                <p className="text-xs" style={ls}>Illustrative projection only. Excludes fees, fund-specific charges, Reg 28 asset-class limits and pre/post-retirement tax. Not financial advice — discuss with your advisor for a regulated plan.</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Capital Gains Tax Calculator — T#43 restore, T#45 polish */}
      {(() => {
        const base = (parseFloat(cgtCostBase) || 0) + (parseFloat(cgtImprovements) || 0);
        const grossGain = Math.max(0, (parseFloat(cgtSalePrice) || 0) - base);
        const isPerson = cgtAssetType === "individual" || cgtAssetType === "special-trust";
        const primaryEligible = cgtPrimaryResidence && isPerson;
        const primaryExclusion = primaryEligible ? Math.min(grossGain, 2000000) : 0;
        const gain = Math.max(0, grossGain - primaryExclusion);
        const annualExclusion = isPerson ? 40000 : 0;
        const inclusionRate = isPerson ? 0.40 : 0.80;
        const taxableAdd = Math.max(0, gain - annualExclusion) * inclusionRate;
        const annual = parseFloat(cgtIncome) || 0;
        const taxFor = (a: number) => {
          let g = 0;
          for (const b of TAX_BRACKETS) { if (a >= b.min) g = b.base + (Math.min(a, b.max) - b.min) * b.rate; }
          return Math.max(0, g - 17235);
        };
        let liability = 0;
        if (cgtAssetType === "company") liability = taxableAdd * 0.27;
        else if (cgtAssetType === "other-trust") liability = taxableAdd * 0.45;
        else liability = Math.max(0, taxFor(annual + taxableAdd) - taxFor(annual));
        const netProceeds = (parseFloat(cgtSalePrice) || 0) - base - liability;
        return (
          <div className="rounded-xl overflow-hidden" style={sectionStyle("cgt")}>
            <div className="p-4">
              <SectionHeader sectionKey="cgt" title="Capital Gains Tax Calculator" subtitle="SA CGT estimate on an asset disposal (2024/25 rules)." />
            </div>
            {openSections.cgt && (
              <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
                <div className="pt-3 grid grid-cols-2 gap-2">
                  <div className="space-y-1"><label className="text-xs" style={ls}>Sale Price (R)</label><input type="number" value={cgtSalePrice} onChange={e => setCgtSalePrice(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} /></div>
                  <div className="space-y-1"><label className="text-xs" style={ls}>Cost Base (R)</label><input type="number" value={cgtCostBase} onChange={e => setCgtCostBase(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} /></div>
                  <div className="space-y-1"><label className="text-xs" style={ls}>Improvements (R)</label><input type="number" value={cgtImprovements} onChange={e => setCgtImprovements(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} /></div>
                  <div className="space-y-1"><label className="text-xs" style={ls}>Other Annual Taxable Income (R)</label><input type="number" value={cgtIncome} onChange={e => setCgtIncome(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} /></div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs" style={ls}>Taxpayer Type</label>
                    <select
                      value={cgtAssetType}
                      onChange={e => {
                        const v = e.target.value;
                        if (v === "individual" || v === "special-trust" || v === "other-trust" || v === "company") setCgtAssetType(v);
                      }}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={is}
                    >
                      <option value="individual">Individual (40% inclusion)</option>
                      <option value="special-trust">Special Trust (40% inclusion)</option>
                      <option value="other-trust">Other Trust (80% inclusion, flat 45%)</option>
                      <option value="company">Company (80% inclusion, flat 27%)</option>
                    </select>
                  </div>
                </div>
                <label className={`flex items-center gap-2 text-xs ${isPerson ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}`} style={ls}>
                  <input type="checkbox" checked={cgtPrimaryResidence} disabled={!isPerson} onChange={e => setCgtPrimaryResidence(e.target.checked)} />
                  <span>Primary residence — apply R2 000 000 exclusion{!isPerson && " (natural persons / special trusts only)"}</span>
                </label>
                <div className="rounded-lg p-3" style={{ backgroundColor: tc.inputBg }}>
                  <ResultRow label="Gross Capital Gain" value={ZAR(grossGain)} />
                  {primaryEligible && <ResultRow label="Primary-Residence Exclusion" value={`− ${ZAR(primaryExclusion)}`} />}
                  {isPerson && <ResultRow label="Annual Exclusion" value={`− ${ZAR(annualExclusion)}`} />}
                  <ResultRow label={`Taxable Gain (${Math.round(inclusionRate * 100)}% inclusion)`} value={ZAR(taxableAdd)} />
                  <ResultRow label="Est. CGT Liability" value={ZAR(liability)} accent />
                  <ResultRow label="Net Proceeds After CGT" value={ZAR(netProceeds)} accent />
                </div>
                <p className="text-xs" style={ls}>Illustrative estimate only. Excludes foreign-currency base-cost rules, time-apportionment for pre-Oct 2001 assets, retirement-fund interactions and roll-over relief. Not tax advice — confirm with a registered tax practitioner.</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Bond / Home Loan — T#43 parity */}
      {(() => {
        const P = parseFloat(bondAmount) || 0;
        const r = parseFloat(bondRate) / 100 / 12;
        const N = (parseFloat(bondTerm) || 20) * 12;
        const pmt = r > 0 ? P * (r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1) : (N > 0 ? P / N : 0);
        const total = pmt * N;
        return (
          <div className="rounded-xl overflow-hidden" style={sectionStyle("bond")}>
            <div className="p-4">
              <SectionHeader sectionKey="bond" title="Bond / Home Loan Calculator" subtitle="Monthly repayment, total interest, total paid over term." />
            </div>
            {openSections.bond && (
              <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
                <div className="pt-3 grid grid-cols-2 gap-2">
                  <div className="space-y-1"><label className="text-xs" style={ls}>Loan Amount (R)</label><input type="number" value={bondAmount} onChange={e => setBondAmount(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} /></div>
                  <div className="space-y-1"><label className="text-xs" style={ls}>Interest Rate (%)</label><input type="number" value={bondRate} onChange={e => setBondRate(e.target.value)} step="0.1" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} /></div>
                  <div className="space-y-1"><label className="text-xs" style={ls}>Term (years)</label><input type="number" value={bondTerm} onChange={e => setBondTerm(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} /></div>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: tc.inputBg }}>
                  <ResultRow label="Monthly Repayment" value={ZAR(pmt)} accent />
                  <ResultRow label="Total Paid" value={ZAR(total)} />
                  <ResultRow label="Total Interest" value={ZAR(total - P)} accent />
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Emergency Fund — T#43 parity */}
      {(() => {
        const target = (parseFloat(efMonthly) || 0) * (parseFloat(efMonths) || 6);
        return (
          <div className="rounded-xl overflow-hidden" style={sectionStyle("emergency")}>
            <div className="p-4">
              <SectionHeader sectionKey="emergency" title="Emergency Fund Calculator" subtitle="How much cash buffer is enough for life's curveballs." />
            </div>
            {openSections.emergency && (
              <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
                <div className="pt-3 grid grid-cols-2 gap-2">
                  <div className="space-y-1"><label className="text-xs" style={ls}>Monthly Expenses (R)</label><input type="number" value={efMonthly} onChange={e => setEfMonthly(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} /></div>
                  <div className="space-y-1"><label className="text-xs" style={ls}>Months of Cover</label><input type="number" value={efMonths} onChange={e => setEfMonths(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} /></div>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: tc.inputBg }}>
                  <ResultRow label={`Target Fund (${efMonths} months)`} value={ZAR(target)} accent />
                </div>
                <p className="text-xs" style={ls}>Most advisors recommend 3–6 months of essential expenses in an accessible savings account.</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Life Cover Needs — T#43 parity */}
      {(() => {
        const monthly = parseFloat(lcIncome) || 0;
        const years = parseFloat(lcYears) || 10;
        const existing = parseFloat(lcExisting) || 0;
        const needed = monthly * 12 * years;
        const shortfall = Math.max(0, needed - existing);
        const surplus = Math.max(0, existing - needed);
        return (
          <div className="rounded-xl overflow-hidden" style={sectionStyle("lifecover")}>
            <div className="p-4">
              <SectionHeader sectionKey="lifecover" title="Life Cover Needs Calculator" subtitle="Income-replacement estimate for your dependants." />
            </div>
            {openSections.lifecover && (
              <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
                <div className="pt-3 grid grid-cols-2 gap-2">
                  <div className="space-y-1"><label className="text-xs" style={ls}>Monthly Income (R)</label><input type="number" value={lcIncome} onChange={e => setLcIncome(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} /></div>
                  <div className="space-y-1"><label className="text-xs" style={ls}>Years to Cover</label><input type="number" value={lcYears} onChange={e => setLcYears(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} /></div>
                  <div className="col-span-2 space-y-1"><label className="text-xs" style={ls}>Existing Cover (R)</label><input type="number" value={lcExisting} onChange={e => setLcExisting(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} /></div>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: tc.inputBg }}>
                  <ResultRow label={`Cover Needed (${years} yrs)`} value={ZAR(needed)} />
                  <ResultRow label="Existing Cover" value={ZAR(existing)} />
                  <ResultRow label={shortfall > 0 ? "Additional Cover Needed" : "Cover Surplus"} value={ZAR(shortfall > 0 ? shortfall : surplus)} accent />
                </div>
                <p className="text-xs" style={ls}>Simple income-replacement method. Doesn't include debt settlement or estate costs — speak to your advisor.</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Debt Payoff — T#43 parity */}
      {(() => {
        const P = parseFloat(dpDebt) || 0;
        const r = parseFloat(dpRate) / 100 / 12;
        const pmt = parseFloat(dpPayment) || 0;
        const minPayment = r > 0 ? P * r : 0;
        const cantPayOff = pmt <= minPayment && r > 0;
        const months = cantPayOff || pmt <= 0 || P <= 0 ? 0
          : r > 0 ? Math.ceil(-Math.log(1 - (P * r) / pmt) / Math.log(1 + r)) : Math.ceil(P / pmt);
        const totalPaid = months > 0 ? pmt * months : 0;
        return (
          <div className="rounded-xl overflow-hidden" style={sectionStyle("debt")}>
            <div className="p-4">
              <SectionHeader sectionKey="debt" title="Debt Payoff Calculator" subtitle="Months to clear a debt at a fixed monthly payment." />
            </div>
            {openSections.debt && (
              <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
                <div className="pt-3 grid grid-cols-2 gap-2">
                  <div className="space-y-1"><label className="text-xs" style={ls}>Debt Balance (R)</label><input type="number" value={dpDebt} onChange={e => setDpDebt(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} /></div>
                  <div className="space-y-1"><label className="text-xs" style={ls}>Interest Rate (%)</label><input type="number" value={dpRate} onChange={e => setDpRate(e.target.value)} step="0.1" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} /></div>
                  <div className="col-span-2 space-y-1"><label className="text-xs" style={ls}>Monthly Payment (R)</label><input type="number" value={dpPayment} onChange={e => setDpPayment(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} /></div>
                </div>
                {cantPayOff ? (
                  <div className="rounded-lg p-3 text-xs text-center" style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
                    Payment doesn't cover interest. Pay more than {ZAR(minPayment)}/month to start reducing the balance.
                  </div>
                ) : (
                  <div className="rounded-lg p-3" style={{ backgroundColor: tc.inputBg }}>
                    <ResultRow label="Months to Pay Off" value={months > 0 ? `${months} months (${(months / 12).toFixed(1)} yrs)` : "—"} accent />
                    <ResultRow label="Total Paid" value={months > 0 ? ZAR(totalPaid) : "—"} />
                    <ResultRow label="Total Interest" value={months > 0 ? ZAR(totalPaid - P) : "—"} accent />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* My Email — T#43 advisor-only tile, mailto: to the advisor's own primary email */}
      <div className="rounded-xl overflow-hidden" style={sectionStyle("myemail")}>
        <div className="p-4">
          <SectionHeader sectionKey="myemail" title="My Email" subtitle={`Open a new message to ${advisor.email || "your inbox"}.`} />
        </div>
        {openSections.myemail && (
          <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${tc.borderColor}` }}>
            <p className="text-xs pt-3" style={ls}>One-tap shortcut to compose to your own primary email — handy when you need to forward something to yourself.</p>
            <a
              href={advisor.email ? `mailto:${advisor.email}` : "#"}
              className="w-full block text-center py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: tc.accentColor, color: tc.isDark ? "#000" : "#fff" }}
              data-testid="link-toolbox-myemail"
            >
              <Mail className="h-4 w-4 inline mr-1.5" /> Open Email to {advisor.email || "—"}
            </a>
          </div>
        )}
      </div>

    </div>
  );
}

const PLATFORM_ICON_MAP: Record<string, any> = {
  liberty: Building2,
  stanlib: TrendingUp,
  signinghub: FileCheck,
};

function PlatformsTab({ tc }: { tc: ReturnType<typeof getThemeColors> }) {
  const platforms = PLATFORMS_META.map(p => ({
    key: p.key,
    name: p.name,
    description: p.description,
    url: p.url,
    color: p.colorHex,
    Icon: PLATFORM_ICON_MAP[p.key],
  }));

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
        <p className="text-xs leading-relaxed" style={{ color: tc.mutedText }}>
          Quick-access links to your key financial platforms. These open in a new browser tab.
        </p>
      </div>
      {platforms.map(p => (
        <a
          key={p.key}
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl p-5 transition-opacity hover:opacity-90 active:scale-95"
          style={{ backgroundColor: tc.cardBg, border: `2px solid ${tc.borderColor}` }}
          data-testid={`link-platform-${p.key}`}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: p.color + "22", border: `2px solid ${p.color}44` }}>
              <p.Icon className="h-6 w-6" style={{ color: p.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold" style={{ color: tc.textColor }}>{p.name}</h3>
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" style={{ color: tc.mutedText }} />
              </div>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: tc.mutedText }}>{p.description}</p>
            </div>
          </div>
          <div className="mt-4 py-2.5 rounded-lg text-center text-xs font-semibold inline-flex items-center justify-center gap-1.5 w-full"
            style={{ backgroundColor: p.color, color: "#fff" }}>
            Open {p.name}
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </a>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MyClientsTab — UI-only placeholder skeleton (no DB, no API calls).
   Mirrors the Donate & Deduct pattern: layout is real, controls are clickable,
   nothing persists. Wired up so Stewart can demo to his partner. The real
   schema, encryption, audit log, document storage, and per-advisor isolation
   land in a future build session (see notes in chat / partner meeting).
   ───────────────────────────────────────────────────────────────────────────── */
type StubClient = {
  id: string;
  name: string;
  initials: string;
  status: "active" | "lead" | "lapsed";
  email: string;
  phone: string;
  lastContact: string;
  age: number;
  city: string;
};

const STUB_CLIENTS: StubClient[] = [
  { id: "c-001", name: "John Doe",       initials: "JD", status: "active", email: "john@example.com",       phone: "+27 82 123 4567", lastContact: "2 days ago",   age: 42, city: "Cape Town"    },
  { id: "c-002", name: "Sarah Mthembu",  initials: "SM", status: "active", email: "sarah.m@example.com",    phone: "+27 71 555 0102", lastContact: "1 week ago",   age: 35, city: "Johannesburg" },
  { id: "c-003", name: "Pieter van Wyk", initials: "PV", status: "lead",   email: "pieter.vw@example.com",  phone: "+27 84 207 9911", lastContact: "Yesterday",    age: 51, city: "Stellenbosch" },
];

const BOOK_OF_LIFE_CATEGORIES = [
  { key: "will",        label: "Latest Will & Testament", hint: "Signed will, executor, beneficiaries"        },
  { key: "medical",     label: "Medical Aid Details",     hint: "Scheme, plan, dependants"                    },
  { key: "short-term",  label: "Short Term Insurance",    hint: "Vehicle, household, all-risk policies"       },
  { key: "long-term",   label: "Long Term Insurance",     hint: "Endowments, tax-free savings"                },
  { key: "life",        label: "Life Cover",              hint: "Beneficiaries, sum assured, premiums"        },
  { key: "risk",        label: "Risk Cover",              hint: "Disability, dread disease, income protection"},
  { key: "corporate",   label: "Corporate Benefits",      hint: "Group risk, pension/provident, GMA"          },
  { key: "investments", label: "Investments",             hint: "Unit trusts, RAs, share portfolios"          },
  { key: "savings",     label: "Savings Accounts",        hint: "Cash, money market, fixed deposits"          },
];

function MyClientsTab({ advisor, tc }: { advisor: Advisor; tc: ReturnType<typeof getThemeColors> }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState<"personal" | "financial" | "book" | "astute" | "history">("personal");
  // Local-only field state — placeholder, nothing persists.
  const [draft, setDraft] = useState<Record<string, string>>({});
  const setField = (k: string, v: string) => setDraft(prev => ({ ...prev, [k]: v }));

  const filtered = STUB_CLIENTS.filter(c =>
    !search.trim() || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );
  const selected = STUB_CLIENTS.find(c => c.id === selectedId) || null;

  const showPlaceholder = () => alert("Demo only — saving will be wired in the next build session.");

  if (selected) {
    return (
      <div className="space-y-4" data-testid="view-client-detail">
        {/* Top bar — back + name + status */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelectedId(null); setActiveSection("personal"); setDraft({}); }}
            className="p-2 rounded-lg"
            style={{ backgroundColor: tc.buttonSecondaryBg }}
            aria-label="Back to client list"
            data-testid="button-client-back"
          >
            <ArrowLeft className="h-4 w-4" style={{ color: tc.accentColor }} />
          </button>
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ backgroundColor: tc.initialsCircleBg, color: tc.accentColor, border: `1px solid ${tc.initialsCircleBorder}` }}
          >
            {selected.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate" style={{ color: tc.textColor }}>{selected.name}</div>
            <div className="text-[11px]" style={{ color: tc.mutedText }}>Client since — / {selected.city}</div>
          </div>
          <span
            className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-semibold"
            style={{ backgroundColor: selected.status === "active" ? "#22c55e22" : "#f59e0b22", color: selected.status === "active" ? "#16a34a" : "#d97706" }}
          >
            {selected.status}
          </span>
        </div>

        {/* Section nav */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {[
            { key: "personal"  as const, label: "Personal",     icon: User       },
            { key: "financial" as const, label: "Financial",    icon: CreditCard },
            { key: "book"      as const, label: "Book of Life", icon: Briefcase  },
            { key: "astute"    as const, label: "Draw Astute",  icon: Download   },
            { key: "history"   as const, label: "History",      icon: Clock      },
          ].map(s => {
            const Icon = s.icon;
            const isActive = activeSection === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap"
                style={{
                  backgroundColor: isActive ? tc.accentColor + "22" : tc.buttonSecondaryBg,
                  color: isActive ? tc.accentColor : tc.mutedText,
                  border: isActive ? `1px solid ${tc.accentColor}55` : "1px solid transparent",
                }}
                data-testid={`tab-client-section-${s.key}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* PERSONAL ─────────────────────────── */}
        {activeSection === "personal" && (
          <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
            <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: tc.borderColor }}>
              <ShieldCheck className="h-4 w-4" style={{ color: tc.accentColor }} />
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: tc.textColor }}>Personal Details</div>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#f59e0b22", color: "#d97706" }}>Sensitive</span>
            </div>
            {[
              { k: "id_number",       label: "SA ID Number",        placeholder: "13-digit ID number" },
              { k: "marital",         label: "Marital Status",      placeholder: "Single / Married / Divorced / Widowed" },
              { k: "spouse",          label: "Spouse Full Name",    placeholder: "—" },
              { k: "address",         label: "Residential Address", placeholder: "Street, suburb, city, postal code" },
              { k: "tax_number",      label: "SARS Tax Number",     placeholder: "10-digit tax reference" },
              { k: "next_of_kin",     label: "Next of Kin",         placeholder: "Name + relationship" },
              { k: "next_of_kin_tel", label: "Next of Kin Phone",   placeholder: "+27 …" },
            ].map(f => (
              <div key={f.k}>
                <label className="text-[11px] font-medium block mb-1" style={{ color: tc.mutedText }}>{f.label}</label>
                <input
                  type="text"
                  value={draft[f.k] ?? ""}
                  onChange={e => setField(f.k, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                  style={{ backgroundColor: tc.inputBg, color: tc.textColor, border: `1px solid ${tc.borderColor}` }}
                  data-testid={`input-personal-${f.k}`}
                />
              </div>
            ))}
            <button
              onClick={showPlaceholder}
              className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
              style={{ backgroundColor: tc.accentColor, color: tc.buttonText }}
              data-testid="button-save-personal"
            >
              <Save className="h-3.5 w-3.5 inline mr-1" /> Save Personal Details
            </button>
          </div>
        )}

        {/* FINANCIAL ─────────────────────────── */}
        {activeSection === "financial" && (
          <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
            <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: tc.borderColor }}>
              <CreditCard className="h-4 w-4" style={{ color: tc.accentColor }} />
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: tc.textColor }}>Financial Profile</div>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#f59e0b22", color: "#d97706" }}>Sensitive</span>
            </div>
            {[
              { k: "employer",       label: "Employer",            placeholder: "Company name" },
              { k: "occupation",     label: "Occupation",          placeholder: "Job title" },
              { k: "monthly_income", label: "Monthly Income (R)",  placeholder: "e.g. 45 000" },
              { k: "bank_name",      label: "Bank",                placeholder: "Standard Bank / FNB / etc." },
              { k: "bank_account",   label: "Account Number",      placeholder: "—" },
              { k: "bank_branch",    label: "Branch Code",         placeholder: "—" },
            ].map(f => (
              <div key={f.k}>
                <label className="text-[11px] font-medium block mb-1" style={{ color: tc.mutedText }}>{f.label}</label>
                <input
                  type="text"
                  value={draft[f.k] ?? ""}
                  onChange={e => setField(f.k, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                  style={{ backgroundColor: tc.inputBg, color: tc.textColor, border: `1px solid ${tc.borderColor}` }}
                  data-testid={`input-financial-${f.k}`}
                />
              </div>
            ))}
            {/* Stub upload zones for payslip + proof of address */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              {[
                { k: "payslip", label: "Latest Payslip" },
                { k: "poa",     label: "Proof of Address" },
              ].map(d => (
                <button
                  key={d.k}
                  onClick={showPlaceholder}
                  className="flex flex-col items-center justify-center gap-1.5 py-4 rounded-lg border-2 border-dashed text-[11px]"
                  style={{ borderColor: tc.borderColor, color: tc.mutedText, backgroundColor: tc.inputBg }}
                  data-testid={`upload-financial-${d.k}`}
                >
                  <Upload className="h-4 w-4" />
                  {d.label}
                </button>
              ))}
            </div>
            <button
              onClick={showPlaceholder}
              className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
              style={{ backgroundColor: tc.accentColor, color: tc.buttonText }}
              data-testid="button-save-financial"
            >
              <Save className="h-3.5 w-3.5" /> Save Financial Profile
            </button>
          </div>
        )}

        {/* BOOK OF LIFE ─────────────────────────── */}
        {activeSection === "book" && (
          <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
            <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: tc.borderColor }}>
              <Briefcase className="h-4 w-4" style={{ color: tc.accentColor }} />
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: tc.textColor }}>Book of Life</div>
              <span className="ml-auto text-[10px]" style={{ color: tc.mutedText }}>Policy documents per category</span>
            </div>
            <div className="space-y-2">
              {BOOK_OF_LIFE_CATEGORIES.map(cat => (
                <div
                  key={cat.key}
                  className="rounded-lg p-3 flex items-center gap-3"
                  style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.borderColor}` }}
                  data-testid={`book-category-${cat.key}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold" style={{ color: tc.textColor }}>{cat.label}</div>
                    <div className="text-[10px]" style={{ color: tc.mutedText }}>{cat.hint}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.mutedText }}>0 docs</span>
                  <button
                    onClick={showPlaceholder}
                    className="p-2 rounded-lg shrink-0"
                    style={{ backgroundColor: tc.accentColor + "22", color: tc.accentColor }}
                    aria-label={`Upload ${cat.label} document`}
                    data-testid={`button-book-upload-${cat.key}`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DRAW ASTUTE ─────────────────────────── */}
        {activeSection === "astute" && (
          <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
            <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: tc.borderColor }}>
              <Download className="h-4 w-4" style={{ color: tc.accentColor }} />
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: tc.textColor }}>Draw from Astute</div>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#3B82F622", color: "#2563eb" }}>Integration</span>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: tc.mutedText }}>
              Pull the latest policy, investment and contract data straight from Astute. Once your Astute credentials are linked, you'll be able to refresh a client's full record in one click.
            </p>
            <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: tc.inputBg, border: `1px solid ${tc.borderColor}` }}>
              <div className="text-[11px] font-semibold" style={{ color: tc.textColor }}>Last drawn</div>
              <div className="text-[11px]" style={{ color: tc.mutedText }}>Never — connect your Astute account to begin.</div>
            </div>
            <button
              onClick={showPlaceholder}
              className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
              style={{ backgroundColor: tc.accentColor, color: tc.buttonText }}
              data-testid="button-draw-astute"
            >
              <Download className="h-3.5 w-3.5" /> Draw Latest from Astute
            </button>
            <button
              onClick={showPlaceholder}
              className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
              style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor, border: `1px solid ${tc.borderColor}` }}
              data-testid="button-link-astute"
            >
              <KeyRound className="h-3.5 w-3.5" /> Link Astute Account
            </button>
          </div>
        )}

        {/* HISTORY ─────────────────────────── */}
        {activeSection === "history" && (
          <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
            <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: tc.borderColor }}>
              <Clock className="h-4 w-4" style={{ color: tc.accentColor }} />
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: tc.textColor }}>Notes &amp; History</div>
            </div>
            <textarea
              value={draft["note"] ?? ""}
              onChange={e => setField("note", e.target.value)}
              placeholder="Add a note — call summary, meeting outcome, follow-up reminder…"
              rows={4}
              className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none"
              style={{ backgroundColor: tc.inputBg, color: tc.textColor, border: `1px solid ${tc.borderColor}` }}
              data-testid="input-history-note"
            />
            <button
              onClick={showPlaceholder}
              className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
              style={{ backgroundColor: tc.accentColor, color: tc.buttonText }}
              data-testid="button-add-note"
            >
              <Plus className="h-3.5 w-3.5" /> Add Note
            </button>
            <div className="pt-2 text-center text-[11px]" style={{ color: tc.mutedText }}>
              Timeline of past notes will appear here.
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── List view ──
  return (
    <div className="space-y-4" data-testid="view-client-list">
      {/* Header + actions */}
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold" style={{ color: tc.textColor }}>My Clients</div>
          <div className="text-[11px]" style={{ color: tc.mutedText }}>Personal book — promote a lead once they sign on.</div>
        </div>
        <button
          onClick={showPlaceholder}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shrink-0"
          style={{ backgroundColor: tc.accentColor, color: tc.buttonText }}
          data-testid="button-promote-lead"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Promote Lead
        </button>
      </div>

      {/* Snapshot tiles */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Active",  value: STUB_CLIENTS.filter(c => c.status === "active").length, accent: "#16a34a" },
          { label: "Leads",   value: STUB_CLIENTS.filter(c => c.status === "lead").length,   accent: "#3B82F6" },
          { label: "Lapsed",  value: STUB_CLIENTS.filter(c => c.status === "lapsed").length, accent: "#94a3b8" },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
            <div className="text-xl font-bold" style={{ color: s.accent }}>{s.value}</div>
            <div className="text-[10px] mt-0.5" style={{ color: tc.mutedText }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search clients by name or email…"
          className="w-full px-3 py-2 rounded-lg text-xs outline-none"
          style={{ backgroundColor: tc.inputBg, color: tc.textColor, border: `1px solid ${tc.borderColor}` }}
          data-testid="input-client-search"
        />
      </div>

      {/* List or empty state */}
      {filtered.length === 0 ? (
        <div
          className="rounded-xl p-6 text-center space-y-2"
          style={{ backgroundColor: tc.cardBg, border: `1px dashed ${tc.borderColor}` }}
          data-testid="empty-clients"
        >
          <Users className="h-8 w-8 mx-auto" style={{ color: tc.mutedText }} />
          <div className="text-sm font-semibold" style={{ color: tc.textColor }}>No clients yet</div>
          <div className="text-[11px]" style={{ color: tc.mutedText }}>Promote a lead from your Registry to start your book.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className="w-full rounded-xl p-3 flex items-center gap-3 text-left transition-opacity hover:opacity-90"
              style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}
              data-testid={`button-client-${c.id}`}
            >
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ backgroundColor: tc.initialsCircleBg, color: tc.accentColor, border: `1px solid ${tc.initialsCircleBorder}` }}
              >
                {c.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate" style={{ color: tc.textColor }}>{c.name}</div>
                <div className="text-[11px] truncate" style={{ color: tc.mutedText }}>{c.email} · {c.city}</div>
              </div>
              <div className="text-right shrink-0">
                <span
                  className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    backgroundColor: c.status === "active" ? "#22c55e22" : c.status === "lead" ? "#3B82F622" : "#94a3b822",
                    color: c.status === "active" ? "#16a34a" : c.status === "lead" ? "#2563eb" : "#64748b",
                  }}
                >
                  {c.status}
                </span>
                <div className="text-[10px] mt-1" style={{ color: tc.mutedText }}>{c.lastContact}</div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0" style={{ color: tc.mutedText }} />
            </button>
          ))}
        </div>
      )}

      {/* Footer note — make it loud that this is a placeholder */}
      <div
        className="rounded-xl p-3 flex items-start gap-2"
        style={{ backgroundColor: "#f59e0b14", border: "1px solid #f59e0b50" }}
        data-testid="placeholder-banner"
      >
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
        <div className="text-[11px]" style={{ color: tc.textColor }}>
          <strong>Demo layout.</strong> Sample clients and uploads do not save yet — wiring the database, encrypted storage and audit log is the next build session.
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ advisor, slug, tc }: { advisor: Advisor; slug: string; tc: ReturnType<typeof getThemeColors> }) {
  const { toast } = useToast();
  const picInputRef = useRef<HTMLInputElement>(null);
  const faisInputRef = useRef<HTMLInputElement>(null);

  // Personal details
  const [name, setName] = useState(advisor.name || "");
  const [title, setTitle] = useState(advisor.title || "");
  const [contactNumber, setContactNumber] = useState((advisor as any).contactNumber || "");
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(advisor.profilePicUrl || null);
  const [picUploading, setPicUploading] = useState(false);

  // FA details
  const [advisorCode, setAdvisorCode] = useState((advisor as any).advisorCode || "");
  const [faisAgreementUrl, setFaisAgreementUrl] = useState<string | null>((advisor as any).faisAgreementUrl || null);
  const [faisUploading, setFaisUploading] = useState(false);


  // Panel theme (separate from Contact Card)
  const [panelTheme, setPanelTheme] = useState<string>((advisor as any).panelTheme || "blue");
  const [panelBackgroundStyle, setPanelBackgroundStyle] = useState<number>((advisor as any).panelBackgroundStyle || 1);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwOtpStep, setPwOtpStep] = useState(false);
  const [pwOtp, setPwOtp] = useState("");

  const saveMutation = useMutation({
    mutationFn: async (patch: Partial<Advisor>) => {
      const res = await apiRequest("PATCH", `/api/advisors/${advisor.id}`, patch);
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Save failed"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/advisors/slug/${slug}`] });
      toast({ title: "Saved", description: "Your changes have been saved." });
    },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const handlePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPicUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/profile-pic", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProfilePicUrl(data.url);
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally { setPicUploading(false); }
  };

  const handleFaisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ title: "PDF only", variant: "destructive" });
      return;
    }
    setFaisUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/fais", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFaisAgreementUrl(data.url);
      toast({ title: "FAIS uploaded", description: "Don't forget to save changes." });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally { setFaisUploading(false); }
  };

  const requestPwChange = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/advisor-auth/${slug}/request-password-change`, { currentPassword, newPassword });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Request failed"); }
      return res.json();
    },
    onSuccess: () => {
      setPwOtpStep(true);
      toast({ title: "Code sent", description: `We've sent a confirmation code to ${advisor.email}.` });
    },
    onError: (e: Error) => toast({ title: "Couldn't send code", description: e.message, variant: "destructive" }),
  });

  const confirmPwChange = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/advisor-auth/${slug}/confirm-password-change`, { code: pwOtp });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Confirm failed"); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Password updated", description: "Use your new password from now on." });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setPwOtp(""); setPwOtpStep(false);
    },
    onError: (e: Error) => toast({ title: "Code rejected", description: e.message, variant: "destructive" }),
  });

  const pwStrong = newPassword.length >= 10 && /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) && /\d/.test(newPassword);
  const pwMatch = newPassword !== "" && newPassword === confirmPassword;

  const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${tc.borderColor}` }}>
        <Icon className="h-4 w-4" style={{ color: tc.accentColor }} />
        <span className="text-sm font-semibold" style={{ color: tc.textColor }}>{title}</span>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );

  const fieldLabel = { color: tc.mutedText, fontSize: "11px", fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: "0.05em" };
  const inputStyle = { backgroundColor: tc.bgColor, border: `1px solid ${tc.borderColor}`, color: tc.textColor };

  return (
    <div className="space-y-4">
      {/* Add to Home Screen tip */}
      <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }} data-testid="card-add-to-homescreen-panel">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: tc.accentColor + "22", border: `1px solid ${tc.accentColor}55` }}>
            <Home className="h-5 w-5" style={{ color: tc.accentColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold" style={{ color: tc.textColor }}>Add to your home screen</div>
            <p className="text-xs mt-0.5" style={{ color: tc.mutedText }}>
              One tap from your phone — no app store, no install. Open this panel like any other app.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="rounded-lg p-3" style={{ backgroundColor: tc.bgColor, border: `1px solid ${tc.borderColor}` }}>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: tc.accentColor }}>iPhone (Safari)</div>
            <ol className="text-xs space-y-1 list-decimal list-inside" style={{ color: tc.textColor }}>
              <li>Tap the <span className="font-semibold">Share</span> icon at the bottom</li>
              <li>Scroll down, tap <span className="font-semibold">Add to Home Screen</span></li>
              <li>Tap <span className="font-semibold">Add</span> in the top right</li>
            </ol>
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: tc.bgColor, border: `1px solid ${tc.borderColor}` }}>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: tc.accentColor }}>Android (Chrome)</div>
            <ol className="text-xs space-y-1 list-decimal list-inside" style={{ color: tc.textColor }}>
              <li>Tap the <span className="font-semibold">three-dot</span> menu</li>
              <li>Tap <span className="font-semibold">Add to Home screen</span></li>
              <li>Tap <span className="font-semibold">Add</span> to confirm</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Personal Details */}
      <Section icon={User} title="Personal Details">
        <div className="flex items-center gap-3">
          {profilePicUrl ? (
            <img src={profilePicUrl} alt="" className="h-16 w-16 rounded-full object-cover" style={{ border: `2px solid ${tc.borderColor}` }} />
          ) : (
            <div className="h-16 w-16 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: tc.initialsCircleBg, color: tc.accentColor }}>
              {getInitials(name || advisor.name)}
            </div>
          )}
          <input type="file" ref={picInputRef} accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handlePicUpload} />
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => picInputRef.current?.click()}
              disabled={picUploading}
              className="text-xs px-3 py-1.5 rounded-md font-medium transition-opacity hover:opacity-80 flex items-center gap-1.5"
              style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor }}
              data-testid="button-settings-upload-pic"
            >
              {picUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
              {profilePicUrl ? "Change Photo" : "Upload Photo"}
            </button>
            {profilePicUrl && (
              <button onClick={() => setProfilePicUrl(null)} className="text-xs px-3 py-1 rounded-md flex items-center gap-1" style={{ color: tc.mutedText }}>
                <X className="h-3 w-3" /> Remove
              </button>
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          <div style={fieldLabel}>Full Name</div>
          <Input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} data-testid="input-settings-name" />
        </div>
        <div className="space-y-1.5">
          <div style={fieldLabel}>Title</div>
          <select
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-md text-sm outline-none appearance-none"
            style={inputStyle}
            data-testid="select-settings-title"
          >
            {TITLE_OPTIONS.map(t => <option key={t} value={t} style={{ color: "#000" }}>{t}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <div style={fieldLabel}>Contact Number</div>
          <Input type="tel" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="+27 82 123 4567" style={inputStyle} data-testid="input-settings-contact" />
        </div>
        <Button
          size="sm"
          onClick={() => saveMutation.mutate({ name, title, contactNumber: contactNumber || null, profilePicUrl } as any)}
          disabled={saveMutation.isPending || !name.trim()}
          style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}
          className="gap-1.5 w-full"
          data-testid="button-save-personal"
        >
          {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Personal Details
        </Button>
      </Section>

      {/* FA Details */}
      <Section icon={FileText} title="Financial Advisor Details">
        <div className="space-y-1.5">
          <div style={fieldLabel}>Advisor Code</div>
          <Input value={advisorCode} onChange={(e) => setAdvisorCode(e.target.value)} placeholder="e.g. FA-12345" style={inputStyle} data-testid="input-settings-advisor-code" />
        </div>
        <div className="space-y-1.5">
          <div style={fieldLabel}>FAIS Agreement (PDF)</div>
          <input type="file" ref={faisInputRef} accept="application/pdf" className="hidden" onChange={handleFaisUpload} />
          {faisAgreementUrl ? (
            <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: tc.buttonSecondaryBg, border: `1px solid ${tc.borderColor}` }}>
              <FileCheck className="h-4 w-4 flex-shrink-0" style={{ color: tc.accentColor }} />
              <a href={faisAgreementUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-xs font-medium underline" style={{ color: tc.textColor }} data-testid="link-fais-view">
                View current FAIS agreement
              </a>
              <button
                onClick={() => faisInputRef.current?.click()}
                disabled={faisUploading}
                className="text-xs px-2 py-1 rounded-md font-medium"
                style={{ backgroundColor: tc.bgColor, color: tc.accentColor }}
                data-testid="button-replace-fais"
              >
                {faisUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Replace"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => faisInputRef.current?.click()}
              disabled={faisUploading}
              className="w-full flex flex-col items-center gap-1 py-5 rounded-lg border-2 border-dashed transition-colors"
              style={{ borderColor: tc.borderColor, color: tc.mutedText }}
              data-testid="button-upload-fais-settings"
            >
              {faisUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
              <span className="text-xs">{faisUploading ? "Uploading..." : "Upload FAIS PDF (max 10MB)"}</span>
            </button>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => saveMutation.mutate({ advisorCode: advisorCode || null, faisAgreementUrl } as any)}
          disabled={saveMutation.isPending}
          style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}
          className="gap-1.5 w-full"
          data-testid="button-save-fa-details"
        >
          {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save FA Details
        </Button>
      </Section>

      {/* Profile Completion Score */}
      {(() => {
        // Services + social links live on the per-profile sub-pages now, so
        // the master Profile Completion only counts the four core advisor
        // fields. Stops the score sitting at 4/7 forever for advisors who
        // legitimately have no socials or service ticks at this level.
        const checks = [
          { label: "Profile photo", done: !!advisor.profilePicUrl },
          { label: "Title", done: !!advisor.title },
          { label: "Contact number", done: !!(advisor as any).contactNumber },
          { label: "Bio / Intro", done: !!advisor.bio || !!advisor.customBio },
        ];
        const done = checks.filter(c => c.done).length;
        const pct = Math.round((done / checks.length) * 100);
        const r = 28, circ = 2 * Math.PI * r;
        const color = pct >= 80 ? "#10B981" : pct >= 50 ? tc.accentColor : "#F59E0B";
        const missing = checks.filter(c => !c.done);
        return (
          <div className="rounded-xl p-4" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
            <div className="flex items-center gap-4">
              <svg width="72" height="72" viewBox="0 0 72 72" className="flex-shrink-0">
                <circle cx="36" cy="36" r={r} fill="none" stroke={`${color}22`} strokeWidth="6" />
                <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
                  strokeDasharray={circ}
                  strokeDashoffset={circ - (circ * pct) / 100}
                  strokeLinecap="round"
                  transform="rotate(-90 36 36)"
                  style={{ transition: "stroke-dashoffset 0.6s ease" }}
                />
                <text x="36" y="41" textAnchor="middle" fontSize="14" fontWeight="700" fill={color}>{pct}%</text>
              </svg>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold mb-0.5" style={{ color: tc.textColor }}>Profile Completion</div>
                <div className="text-xs mb-2" style={{ color: tc.mutedText }}>{done} of {checks.length} sections filled in</div>
                {missing.length > 0 && (
                  <div className="text-xs" style={{ color: tc.mutedText }}>
                    Add: {missing.slice(0, 3).map(m => m.label).join(" · ")}
                    {missing.length > 3 && ` +${missing.length - 3} more`}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Panel Theme */}
      <Section icon={Palette} title="Sub-Control Panel Theme">
        <p className="text-xs leading-relaxed" style={{ color: tc.mutedText }}>
          Choose the look of <strong>your control panel</strong>. This is independent of your public Contact Card theme.
        </p>
        <div className="space-y-1.5">
          <div style={fieldLabel}>Theme</div>
          <div className="grid grid-cols-2 gap-1.5">
            {THEME_OPTIONS.map(opt => {
              const selected = panelTheme === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    const y = window.scrollY;
                    setPanelTheme(opt.value);
                    requestAnimationFrame(() => window.scrollTo({ top: y, left: 0, behavior: "auto" }));
                  }}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-medium transition-all"
                  style={{
                    backgroundColor: selected ? tc.buttonSecondaryBg : "transparent",
                    border: `1px solid ${selected ? tc.accentColor : tc.borderColor}`,
                    color: selected ? tc.accentColor : tc.mutedText,
                  }}
                  data-testid={`button-panel-theme-${opt.value}`}
                >
                  <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: getThemeColors(opt.value).accentColor }} />
                  {opt.label}
                  {selected && <Check className="h-3 w-3 ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => {
            const y = window.scrollY;
            saveMutation.mutate(
              { panelTheme, panelThemeColor: getThemeColors(panelTheme).accentColor } as any,
              { onSettled: () => requestAnimationFrame(() => window.scrollTo({ top: y, left: 0, behavior: "auto" })) }
            );
          }}
          disabled={saveMutation.isPending}
          style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}
          className="gap-1.5 w-full"
          data-testid="button-save-panel-theme"
        >
          {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Panel Theme
        </Button>
      </Section>

      {/* Change Password */}
      <Section icon={KeyRound} title="Change Password">
        {!pwOtpStep ? (
          <>
            <div className="space-y-1.5">
              <div style={fieldLabel}>Current Password</div>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={inputStyle} data-testid="input-current-password" />
            </div>
            <div className="space-y-1.5">
              <div style={fieldLabel}>New Password</div>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} data-testid="input-new-password" />
              {newPassword.length > 0 && (() => {
                const PwChip = ({ met, label }: { met: boolean; label: string }) => (
                  <span className="inline-flex items-center gap-1" style={{ color: met ? "#10b981" : tc.mutedText }}>
                    <span className="inline-flex items-center justify-center w-3 h-3 rounded-full" style={met ? { backgroundColor: "#10b981" } : { border: `1px solid ${tc.mutedText}` }}>
                      {met && <Check className="h-2 w-2 text-white" strokeWidth={4} />}
                    </span>
                    {label}
                  </span>
                );
                return (
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <PwChip met={newPassword.length >= 10} label="10+ chars" />
                    <PwChip met={/[A-Z]/.test(newPassword)} label="Uppercase" />
                    <PwChip met={/[a-z]/.test(newPassword)} label="Lowercase" />
                    <PwChip met={/\d/.test(newPassword)} label="Number" />
                  </div>
                );
              })()}
            </div>
            <div className="space-y-1.5">
              <div style={fieldLabel}>Confirm New Password</div>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} data-testid="input-confirm-password" />
              {confirmPassword.length > 0 && !pwMatch && <p className="text-[11px]" style={{ color: "#ef4444" }}>Passwords don't match</p>}
            </div>
            <Button
              size="sm"
              onClick={() => requestPwChange.mutate()}
              disabled={requestPwChange.isPending || !currentPassword || !pwStrong || !pwMatch}
              style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}
              className="gap-1.5 w-full"
              data-testid="button-request-pw-change"
            >
              {requestPwChange.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
              Send Confirmation Code
            </Button>
            <p className="text-[11px] leading-relaxed" style={{ color: tc.mutedText }}>
              We'll email a one-time code to <strong>{advisor.email}</strong> to confirm the change.
            </p>
          </>
        ) : (
          <>
            <div className="p-3 rounded-lg" style={{ backgroundColor: tc.buttonSecondaryBg }}>
              <p className="text-xs" style={{ color: tc.textColor }}>
                We sent a 6-digit code to <strong>{advisor.email}</strong>. Enter it below to confirm your new password.
              </p>
            </div>
            <div className="space-y-1.5">
              <div style={fieldLabel}>Confirmation Code</div>
              <Input
                value={pwOtp}
                onChange={(e) => setPwOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="text-center tracking-widest text-lg font-mono"
                style={inputStyle}
                data-testid="input-pw-otp"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setPwOtpStep(false); setPwOtp(""); }}
                style={{ borderColor: tc.borderColor, color: tc.mutedText }}
                data-testid="button-cancel-pw-otp"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => confirmPwChange.mutate()}
                disabled={confirmPwChange.isPending || pwOtp.length !== 6}
                style={{ backgroundColor: tc.buttonBg, color: tc.buttonText }}
                className="gap-1.5"
                data-testid="button-confirm-pw-change"
              >
                {confirmPwChange.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Confirm
              </Button>
            </div>
          </>
        )}
      </Section>
    </div>
  );
}

function ProfilesTab({ advisor, tc }: { advisor: Advisor; tc: ReturnType<typeof getThemeColors> }) {
  // Premium gate (Task #26): secondary profiles are Premium-only per the
  // agreed tier-split. Trial advisors get full access until trialEndsAt.
  const { isPremium: isPremiumActive } = usePremium();
  const { toast } = useToast();
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<number | null>(null);
  const [editingPrimary, setEditingPrimary] = useState(false);

  const { data: additionalProfiles = [] } = useQuery<AdvisorProfile[]>({
    queryKey: [`/api/advisors/${advisor.id}/profiles`],
  });
  // S7(b): pull split totals so the panel preview can show "Primary: N · Secondary: M"
  // right next to the "My Profiles" heading. Re-uses the same endpoint StatsTab uses.
  const { data: viewSplit } = useQuery<{ totalViews: number; primaryViews: number; secondaryViews: number }>({
    queryKey: [`/api/advisors/${advisor.profileSlug}/profile-stats`],
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
  const canAddMore = totalProfiles < 2 && !showNewForm && isPremiumActive;

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold" style={{ color: tc.textColor }}>My Profiles</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: tc.buttonSecondaryBg, color: tc.accentColor }}>{totalProfiles} / 2</span>
        </div>
        <p className="text-xs" style={{ color: tc.mutedText }}>Each profile has its own unique link, theme, bio and services — ideal for targeting different audiences. Maximum 2 profiles per advisor.</p>
        {/* S7(b): inline split-views badge near the heading. Green dot = Primary, blue = Secondary. */}
        {viewSplit && (
          <div className="flex items-center gap-3 mt-2 text-[11px]" data-testid="badge-views-split">
            <span style={{ color: tc.mutedText }}>Views:</span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: "#22c55e" }} />
              <span style={{ color: tc.mutedText }}>Primary</span>
              <span className="font-semibold" style={{ color: tc.textColor }}>{viewSplit.primaryViews}</span>
            </span>
            <span style={{ color: tc.mutedText }}>·</span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: "#3b82f6" }} />
              <span style={{ color: tc.mutedText }}>Secondary</span>
              <span className="font-semibold" style={{ color: tc.textColor }}>{viewSplit.secondaryViews}</span>
            </span>
          </div>
        )}
      </div>

      <ProfileCard
        profileSlug={advisor.profileSlug}
        title={advisor.title || "Financial Advisor"}
        theme={advisor.theme || "dark"}
        themeColor={(advisor as any).themeColor}
        tc={tc}
        label="Primary"
        isPrimary={true}
        name={advisor.name}
        profilePicUrl={advisor.profilePicUrl}
        nickname={(advisor as any).nickname}
        profileDesc={(advisor as any).profileDescription}
        onEditClick={() => setEditingPrimary(v => !v)}
      />

      {editingPrimary && (
        <div className="rounded-xl overflow-hidden" style={{ border: `2px solid ${tc.accentColor}` }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: tc.cardBg, borderBottom: `1px solid ${tc.borderColor}` }}>
            <span className="text-sm font-semibold" style={{ color: tc.sectionTitle }}>Editing Primary Profile</span>
            <button onClick={() => setEditingPrimary(false)} className="text-xs px-2 py-1 rounded" style={{ color: tc.mutedText, backgroundColor: tc.inputBg }}>Done</button>
          </div>
          <div style={{ backgroundColor: tc.bgColor }}>
            <ProfileTab slug={advisor.profileSlug} advisor={advisor} tc={tc} />
          </div>
        </div>
      )}

      {additionalProfiles.map((profile) =>
        editingProfileId === profile.id ? (
          <AdditionalProfileForm
            key={profile.id}
            advisorId={advisor.id}
            baseSlug={advisor.profileSlug}
            tc={tc}
            existingProfile={profile}
            label="Secondary"
            advisor={advisor}
            onDone={() => setEditingProfileId(null)}
          />
        ) : (
          <ProfileCard
            key={profile.id}
            profileSlug={profile.profileSlug}
            title={profile.title || "Financial Advisor"}
            theme={profile.theme || "dark"}
            themeColor={(profile as any).themeColor}
            tc={tc}
            label="Secondary"
            isPrimary={false}
            nickname={(profile as any).nickname}
            profileDesc={(profile as any).profileDescription}
            name={advisor.name}
            profilePicUrl={profile.profilePicUrl}
            onEditClick={() => setEditingProfileId(profile.id)}
            /* W1 T8: secondary profiles are no longer independently deletable.
               They cascade away when the parent advisor is removed. The API
               also rejects non-admin DELETEs as defence in depth. */
          />
        )
      )}

      {showNewForm && (
        <AdditionalProfileForm
          advisorId={advisor.id}
          baseSlug={advisor.profileSlug}
          tc={tc}
          label="Secondary"
          advisor={advisor}
          onDone={() => setShowNewForm(false)}
        />
      )}

      {canAddMore && (
        <button onClick={() => setShowNewForm(true)}
          className="w-full py-3.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
          style={{ border: `2px dashed ${tc.borderColor}`, color: tc.mutedText, backgroundColor: "transparent" }}
          data-testid="button-add-profile">
          <Plus className="h-4 w-4" />
          Add Secondary Profile
        </button>
      )}

      {!canAddMore && !showNewForm && totalProfiles >= 2 && (
        <div className="text-center py-3 text-xs rounded-xl" style={{ color: tc.mutedText, backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
          Maximum 2 profiles reached. Delete one to add a new profile.
        </div>
      )}

      {!isPremiumActive && totalProfiles < 2 && !showNewForm && (
        <div className="rounded-xl p-4 flex items-start gap-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }} data-testid="card-secondary-profile-premium-gate">
          <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: tc.mutedText }} />
          <div className="flex-1">
            <div className="text-sm font-semibold mb-1" style={{ color: tc.textColor }}>Secondary profile is a Premium feature</div>
            <p className="text-xs mb-3" style={{ color: tc.mutedText }}>
              Run a second branded profile for a different audience — corporate vs personal, English vs Afrikaans, your choice. Upgrade to unlock.
            </p>
            <a href="?tab=billing" className="inline-flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: tc.accentColor }} data-testid="link-upgrade-from-profiles">
              View plans <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// Task #26 — Billing tab. Shows current tier, trial countdown, and Basic /
// Premium cards with Paystack hosted-checkout CTAs. Cancel + Manage flows
// surface only when there's an active Paystack subscription. Themed via tc.*
// so it matches the advisor's panel theme.
type BillingStatus = {
  tier: "trial" | "basic" | "premium";
  status: "trialing" | "active" | "cancelled" | "past_due";
  trialEndsAt: string | null;
  hasSubscription: boolean;
  premiumActive: boolean;
  basicOrBetter: boolean;
  paystackConfigured: boolean;
};

function BillingTab({ advisor, tc }: { advisor: Advisor; tc: ReturnType<typeof getThemeColors> }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: status, isLoading } = useQuery<BillingStatus>({
    queryKey: ["/api/billing/status"],
  });

  const [busyTier, setBusyTier] = useState<"basic" | "premium" | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("billing") === "success") {
      toast({ title: "Welcome to Advisory Connect", description: "Your subscription is being activated — this usually takes a few seconds." });
      // Strip the query param so a refresh doesn't re-fire the toast.
      const url = new URL(window.location.href);
      url.searchParams.delete("billing");
      window.history.replaceState({}, "", url.toString());
      // Refetch a few times to catch the webhook landing.
      setTimeout(() => qc.invalidateQueries({ queryKey: ["/api/billing/status"] }), 2000);
      setTimeout(() => qc.invalidateQueries({ queryKey: ["/api/billing/status"] }), 8000);
    }
  }, [toast, qc]);

  const startCheckout = async (tier: "basic" | "premium") => {
    setBusyTier(tier);
    try {
      const res = await apiRequest("POST", "/api/billing/checkout", { tier });
      const json = await res.json();
      if (json.authorizationUrl) {
        window.location.href = json.authorizationUrl;
      } else {
        toast({ title: "Could not start checkout", description: json.message || "Please try again.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Could not start checkout", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setBusyTier(null);
    }
  };

  const cancelSubscription = async () => {
    if (!confirm("Cancel your subscription? You'll keep access until the end of the current billing period.")) return;
    setCancelling(true);
    try {
      await apiRequest("POST", "/api/billing/cancel", {});
      toast({ title: "Cancellation submitted", description: "Your subscription will not renew." });
      setTimeout(() => qc.invalidateQueries({ queryKey: ["/api/billing/status"] }), 1500);
    } catch (err: any) {
      toast({ title: "Could not cancel", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  };

  const openManageLink = async () => {
    try {
      const res = await apiRequest("GET", "/api/billing/manage-link");
      const json = await res.json();
      if (json.link) window.open(json.link, "_blank", "noopener");
    } catch (err: any) {
      toast({ title: "Could not open management link", description: err?.message || "Please try again.", variant: "destructive" });
    }
  };

  if (isLoading || !status) {
    return <div className="py-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" style={{ color: tc.accentColor }} /></div>;
  }

  const daysLeftInTrial = status.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(status.trialEndsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

  const tierLabel = status.tier === "premium" ? "Premium" : status.tier === "basic" ? "Basic" : "Free Trial";
  const statusLabel = status.status === "active" ? "Active"
    : status.status === "trialing" ? "Trial"
    : status.status === "past_due" ? "Payment failed"
    : status.status === "cancelled" ? "Cancelled" : status.status;

  const PlanCard = ({ tier, price, blurb, features }: { tier: "basic" | "premium"; price: string; blurb: string; features: string[] }) => {
    const current = status.tier === tier && (status.status === "active" || status.status === "trialing");
    const label = tier === "premium" ? "Premium" : "Basic";
    return (
      <div className="rounded-2xl p-5 border" style={{ backgroundColor: tc.cardBg, borderColor: current ? tc.accentColor + "88" : tc.borderColor }}>
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-lg font-semibold" style={{ color: tc.textColor }}>{label}</div>
          <div className="text-xl font-bold" style={{ color: tc.accentColor }}>{price}</div>
        </div>
        <div className="text-xs mb-3" style={{ color: tc.mutedText }}>{blurb}</div>
        <ul className="text-xs space-y-1.5 mb-4" style={{ color: tc.textColor }}>
          {features.map((f, i) => (
            <li key={i} className="flex gap-2"><Check className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: tc.accentColor }} /><span>{f}</span></li>
          ))}
        </ul>
        <button
          onClick={() => startCheckout(tier)}
          disabled={busyTier !== null || current || !status.paystackConfigured}
          className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50"
          style={{ backgroundColor: tc.accentColor, color: tc.bgColor }}
          data-testid={`button-billing-upgrade-${tier}`}
        >
          {busyTier === tier ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : current ? "Current plan" : status.hasSubscription ? `Switch to ${label}` : `Choose ${label}`}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-5" data-testid="tab-billing">
      <div className="rounded-2xl p-5" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-wider" style={{ color: tc.mutedText }}>Current plan</div>
          <div className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: tc.accentColor + "22", color: tc.accentColor }}>{statusLabel}</div>
        </div>
        <div className="text-2xl font-bold" style={{ color: tc.textColor }}>{tierLabel}</div>
        {status.tier === "trial" && daysLeftInTrial !== null && (
          <div className="mt-2 text-sm" style={{ color: tc.mutedText }}>
            {daysLeftInTrial > 0
              ? <>You have <span style={{ color: tc.accentColor, fontWeight: 600 }}>{daysLeftInTrial} day{daysLeftInTrial === 1 ? "" : "s"}</span> left on your free trial.</>
              : <>Your trial has ended — pick a plan below to keep your profile live.</>}
          </div>
        )}
        {status.status === "past_due" && (
          <div className="mt-2 text-sm flex gap-2 items-start" style={{ color: "#dc2626" }}>
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Your last payment failed. Update your card via Manage subscription to keep your access.</span>
          </div>
        )}
      </div>

      {!status.paystackConfigured && (
        <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: tc.cardBg, border: `1px dashed ${tc.borderColor}`, color: tc.mutedText }}>
          <div className="flex gap-2 items-start"><AlertCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: tc.accentColor }} /><span>Billing isn't fully configured yet. You can browse the plans below; checkout will go live once payment keys are in place.</span></div>
        </div>
      )}

      <div className="grid gap-4">
        <PlanCard
          tier="basic"
          price="R299/mo"
          blurb="Everything you need to capture and grade leads."
          features={[
            "One public profile",
            "All 4 lead capture forms with rich grader fields",
            "Lead registry with grade + temperature on every row",
            "All themes, patterns, QR + share link",
            "Standard digital business card",
            "Basic analytics (lead count + profile views)",
            "14-day free trial",
          ]}
        />
        <PlanCard
          tier="premium"
          price="R499/mo"
          blurb="Everything in Basic, plus practice management + white-label feel."
          features={[
            "Secondary profile (un-deletable)",
            "Full grader breakdown + advanced analytics dashboard",
            "Compound Interest + Retirement calculators",
            "Image pattern presets, Editor's article, Smartie Box",
            "Risk Profile Quiz + TradingView multi-instrument",
            "Multi-format business cards with optional footer removal",
            "My Clients (POPIA-encrypted vault, Book of Life, birthdays)",
            "Priority support (24hr Mon–Fri)",
          ]}
        />
      </div>

      {status.hasSubscription && (
        <div className="rounded-2xl p-5 space-y-3" style={{ backgroundColor: tc.cardBg, border: `1px solid ${tc.borderColor}` }}>
          <div className="text-sm font-semibold" style={{ color: tc.textColor }}>Manage your subscription</div>
          <div className="flex gap-2">
            <button
              onClick={openManageLink}
              className="flex-1 py-2 rounded-lg text-sm font-medium border transition-opacity hover:opacity-80"
              style={{ borderColor: tc.borderColor, color: tc.textColor }}
              data-testid="button-billing-manage"
            >
              <ExternalLink className="h-3.5 w-3.5 inline mr-1.5" />
              Manage on Paystack
            </button>
            <button
              onClick={cancelSubscription}
              disabled={cancelling || status.status === "cancelled"}
              className="flex-1 py-2 rounded-lg text-sm font-medium border transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ borderColor: tc.borderColor, color: tc.textColor }}
              data-testid="button-billing-cancel"
            >
              {cancelling ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : status.status === "cancelled" ? "Cancelled" : "Cancel subscription"}
            </button>
          </div>
          <div className="text-xs" style={{ color: tc.mutedText }}>Card updates and invoice history live on Paystack. Cancelling keeps your access through the end of the current billing period.</div>
        </div>
      )}
    </div>
  );
}

export default function AdvisorPanel() {
  const [, params] = useRoute("/advisor/:slug");
  const [, navigate] = useLocation();
  const slug = params?.slug || "";

  const [authState, setAuthState] = useState<"loading" | "login" | "setup" | "verify" | "authenticated">("loading");
  const [activeTab, setActiveTab] = useState<"home" | "registry" | "clients" | "billing" | "settings">(() => {
    // Task #26 — deep-link from trial-expiry email and Paystack post-checkout redirect.
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "billing") return "billing";
    }
    return "home";
  });

  const { data: advisor, isLoading: advisorLoading } = useQuery<Advisor>({
    queryKey: [`/api/advisors/slug/${slug}`],
    enabled: !!slug,
  });

  // Shares cache with CIVTab — no extra network request.
  // Must be called before any early returns to satisfy the rules of hooks.
  const { data: panelLeads = [] } = useQuery<Email[]>({
    queryKey: [`/api/advisors/${slug}/emails`],
    enabled: !!slug && authState === "authenticated",
  });
  // Use the advisor-only lastViewedAt for the unread badge — admin views in CIV
  // no longer mark a lead as read on the advisor side.
  const unreadCount = panelLeads.filter(l => !l.lastViewedAt).length;

  useEffect(() => {
    if (!slug) return;
    const checkAuth = async () => {
      try {
        const [sessionRes, statusRes] = await Promise.all([
          fetch(`/api/advisor-auth/${slug}/session`),
          fetch(`/api/advisor-auth/${slug}/status`),
        ]);
        const session = await sessionRes.json();
        const status = await statusRes.json();
        if (session.authenticated) { setAuthState("authenticated"); return; }
        // First-time advisor: no password set yet — go straight to setup
        if (!status.passwordSet) { setAuthState("setup"); return; }
        setAuthState("login");
      } catch { setAuthState("login"); }
    };
    checkAuth();
  }, [slug]);

  const handleLogout = async () => {
    await fetch(`/api/advisor-auth/${slug}/logout`, { method: "POST" });
    setAuthState("login");
  };

  // Per-advisor PWA manifest (S4). When an advisor uses Add to Home Screen
  // from inside their panel, the saved icon should reopen THEIR panel — not
  // the master landing page that the static /manifest.json's start_url="/"
  // points to. We swap the <link rel="manifest"> href and the iOS title meta
  // tag while the panel is mounted, then restore on unmount.
  useEffect(() => {
    if (!slug) return;
    const link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    const titleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement | null;
    const origLinkHref = link?.getAttribute("href") ?? null;
    const origTitle = titleMeta?.getAttribute("content") ?? null;
    const displayName = advisor?.name ? `${advisor.name} Panel` : "Advisor Panel";
    if (link) {
      const params = new URLSearchParams({
        start: `/advisor/${slug}`,
        name: displayName,
        short: "Panel",
      });
      link.href = `/api/manifest?${params.toString()}`;
    }
    if (titleMeta) titleMeta.setAttribute("content", displayName);
    return () => {
      if (link && origLinkHref) link.href = origLinkHref;
      if (titleMeta && origTitle) titleMeta.setAttribute("content", origTitle);
    };
  }, [slug, advisor?.name]);

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

  // Sub-Control Panel uses panelTheme (separate from public Contact Card theme)
  const panelThemeKey = (advisor as any).panelTheme || advisor.theme;
  const panelThemeColorKey = (advisor as any).panelThemeColor || advisor.themeColor;
  const tc = getThemeColors(panelThemeKey, panelThemeColorKey);

  if (authState === "login") {
    return <LoginScreen slug={slug} onDone={() => setAuthState("authenticated")} onSetup={() => setAuthState("setup")} />;
  }
  if (authState === "setup") {
    return <SetupScreen slug={slug} onVerificationSent={() => setAuthState("verify")} onBack={() => setAuthState("login")} />;
  }
  if (authState === "verify") {
    return <VerifyScreen slug={slug} onDone={() => setAuthState("authenticated")} onBack={() => setAuthState("setup")} />;
  }

  const initials = getInitials(advisor.name);
  const profileUrl = `app.advisoryconnect.pro/${advisor.profileSlug}`;

  // Settings moved out of the bottom tab strip — now a cog in the top-right
  // header next to Sign-out. Only Home + Registry remain as primary tabs.
  const tabs = [
    { key: "home" as const, label: "Home", icon: Home },
    { key: "registry" as const, label: "Registry", icon: Inbox },
    { key: "clients" as const, label: "My Clients", icon: Users },
    { key: "billing" as const, label: "Billing", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: tc.bgColor }}>
      <div className="max-w-lg mx-auto">
        <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between" style={{ backgroundColor: tc.bgColor, borderBottom: `1px solid ${tc.borderColor}`, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
          <div className="flex items-center gap-3">
            <img src="/logo/icon-64.png" alt="Advisory Connect" className="h-9 w-9 shrink-0" />
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
            <button
              onClick={() => setActiveTab("settings")}
              className="p-2 rounded-lg transition-opacity hover:opacity-80"
              style={{
                backgroundColor: activeTab === "settings" ? tc.accentColor + "22" : tc.buttonSecondaryBg,
                border: activeTab === "settings" ? `1px solid ${tc.accentColor}55` : "1px solid transparent",
              }}
              title="Settings"
              aria-label="Settings"
              data-testid="button-panel-settings"
            >
              <Settings className="h-4 w-4" style={{ color: tc.accentColor }} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg transition-opacity hover:opacity-80"
              style={{ backgroundColor: tc.buttonSecondaryBg }}
              title="Sign out"
              aria-label="Sign out"
              data-testid="button-panel-logout"
            >
              <LogOut className="h-4 w-4" style={{ color: tc.accentColor }} />
            </button>
          </div>
        </div>

        <div className="flex border-b relative" style={{ borderColor: tc.borderColor }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors relative"
                style={{ color: isActive ? tc.accentColor : tc.mutedText }}
                data-testid={`tab-panel-${tab.key}`}
              >
                <span className="relative">
                  <Icon className="h-4 w-4" />
                  {tab.key === "registry" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
                  )}
                </span>
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="panel-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: tc.accentColor }}
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-5 pb-12">
          {activeTab === "home" && <HomeTab advisor={advisor} tc={tc} />}
          {activeTab === "registry" && <CIVTab slug={slug} advisor={advisor} tc={tc} />}
          {activeTab === "clients" && <MyClientsTab advisor={advisor} tc={tc} />}
          {activeTab === "billing" && <BillingTab advisor={advisor} tc={tc} />}
          {activeTab === "settings" && <SettingsTab advisor={advisor} slug={slug} tc={tc} />}
        </div>
      </div>
    </div>
  );
}
