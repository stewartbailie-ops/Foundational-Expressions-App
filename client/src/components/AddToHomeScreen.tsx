import { useEffect, useState } from "react";
import { X, Share, Plus, Download, ExternalLink, Check, Smartphone } from "lucide-react";

// Chrome's install event. Not in the TS DOM lib, so we type it locally.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "ac-a2hs-dismissed-at";
const DISMISS_DAYS = 14;

function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (window.navigator as any).standalone === true
  );
}

function detectPlatform() {
  const ua = navigator.userAgent || "";
  const isIOS =
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1);
  const isAndroid = /android/i.test(ua);
  // In-app webviews (WhatsApp, Instagram, Facebook, etc.) can't Add to Home Screen.
  const isInApp =
    /FBAN|FBAV|Instagram|Line\/|Twitter|Snapchat|Pinterest|WhatsApp|GSA\//i.test(ua) ||
    (isAndroid && /; wv\)/i.test(ua));
  return { isIOS, isAndroid, isInApp };
}

function recentlyDismissed(): boolean {
  try {
    const ts = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return ts > 0 && Date.now() - ts < DISMISS_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

/**
 * Smart "Add to Home Screen" prompt.
 *  - variant="card": prominent inline block (used on the post-creation success screen)
 *  - variant="banner": subtle fixed bottom bar (used on public profiles)
 */
export function AddToHomeScreen({
  variant = "banner",
  accent = "#2563eb",
}: {
  variant?: "banner" | "card";
  accent?: string;
}) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [plat, setPlat] = useState({ isIOS: false, isAndroid: false, isInApp: false });

  useEffect(() => {
    if (isStandalone()) return; // already installed — nothing to do
    if (variant === "banner" && recentlyDismissed()) return;

    setPlat(detectPlatform());

    const onBIP = (e: Event) => {
      e.preventDefault(); // stash it so we can trigger the prompt on our button
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    // iOS and in-app browsers never fire beforeinstallprompt — show guidance directly.
    // The post-creation card always shows something actionable.
    const p = detectPlatform();
    if (variant === "card" || p.isIOS || p.isInApp) setVisible(true);

    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, [variant]);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => undefined);
    setDeferred(null);
    setVisible(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  // Decide the primary action for the current situation.
  const canInstallNow = !!deferred; // Android/Chrome
  const iosGuide = plat.isIOS && !plat.isInApp && !canInstallNow;
  const inAppBlocked = plat.isInApp && !canInstallNow;

  const primaryBtn = (
    <button
      onClick={canInstallNow ? install : iosGuide ? () => setShowIosHelp(true) : copyLink}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 ${variant === "card" ? "w-full min-[480px]:w-auto" : ""}`}
      style={{ backgroundColor: accent }}
      data-testid="button-a2hs-primary"
    >
      {canInstallNow ? (
        <><Download className="h-4 w-4" /> Add to Home Screen</>
      ) : iosGuide ? (
        <><Share className="h-4 w-4" /> Add to Home Screen</>
      ) : inAppBlocked ? (
        copied ? <><Check className="h-4 w-4" /> Link copied</> : <><ExternalLink className="h-4 w-4" /> Copy link to open in browser</>
      ) : (
        copied ? <><Check className="h-4 w-4" /> Link copied</> : <><Smartphone className="h-4 w-4" /> Save to phone</>
      )}
    </button>
  );

  const helper = inAppBlocked
    ? "Open this link in Safari or Chrome, then tap Add to Home Screen."
    : iosGuide
    ? "One tap to keep this card on your home screen."
    : "Keep this card one tap away on your phone.";

  return (
    <>
      {variant === "card" ? (
        <div
          className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col items-stretch gap-4 min-[480px]:flex-row min-[480px]:items-center"
          data-testid="a2hs-card"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: accent + "22" }}>
              <Smartphone className="h-5 w-5" style={{ color: accent }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Add to your home screen</p>
              <p className="text-xs text-white/50">{helper}</p>
            </div>
          </div>
          {primaryBtn}
        </div>
      ) : (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pointer-events-none"
          data-testid="a2hs-banner"
        >
          <div className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-black/10 bg-white shadow-lg p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: accent + "18" }}>
              <Smartphone className="h-4 w-4" style={{ color: accent }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 leading-tight">Save this card</p>
              <p className="text-xs text-gray-500 leading-tight">{helper}</p>
            </div>
            {primaryBtn}
            <button onClick={dismiss} aria-label="Dismiss" className="p-1 text-gray-400 hover:text-gray-600" data-testid="button-a2hs-dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* iOS instructional overlay */}
      {showIosHelp && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4" onClick={() => setShowIosHelp(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Add to Home Screen</h3>
              <button onClick={() => setShowIosHelp(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">1</span>
                <span>Tap the <Share className="inline h-4 w-4 -mt-0.5" /> <strong>Share</strong> button in your browser's toolbar.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">2</span>
                <span>Scroll down and tap <Plus className="inline h-4 w-4 -mt-0.5" /> <strong>Add to Home Screen</strong>.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">3</span>
                <span>Tap <strong>Add</strong> — the card now lives on your home screen. ✅</span>
              </li>
            </ol>
            <button onClick={() => setShowIosHelp(false)} className="w-full py-2.5 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: accent }}>
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
