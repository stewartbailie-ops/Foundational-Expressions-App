import { Link, useLocation } from "wouter";
import { Home, LayoutDashboard, Users, Inbox, LogOut } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { BrandFooter, MASTER_FOOTER_THEME } from "@/components/BrandFooter";

const SIDEBAR_BG = "#0a0a0a";
const CONTENT_BG = "#171717";
const HEADER_BG = "#0a0a0a";
const BORDER = "rgba(255,255,255,0.12)";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/manage", label: "Manage Advisors", icon: Users },
    { href: "/civ", label: "Client Information Viewer", icon: Inbox },
    { href: "/stats", label: "Stats Tracker", icon: LayoutDashboard },
  ];

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
  };

  return (
    <div className="min-h-screen flex text-white" style={{ backgroundColor: CONTENT_BG }}>
      <aside className="w-72 flex flex-col hidden md:flex" style={{ backgroundColor: SIDEBAR_BG, borderRight: `1px solid ${BORDER}` }}>
        {/* Sidebar header — neon icon + wordmark sit on the dark sidebar so the
            transparent PNGs do all the heavy lifting (no plate behind them). */}
        <div className="flex items-center gap-3 px-5 pt-6 pb-4">
          <img src="/logo/icon-64.png" alt="" className="h-9 w-9 shrink-0" data-testid="img-sidebar-logo" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-white tracking-tight">Advisory Connect</span>
            <span className="text-[10px] text-white/50 uppercase tracking-wider">Control Panel</span>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1.5 flex flex-col items-start">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-white text-black"
                    : "text-white hover:bg-white/10"
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold border" style={{ backgroundColor: "rgba(255,255,255,0.1)", borderColor: BORDER, color: "#fff" }}>
                AD
              </div>
              <div className="text-sm font-medium text-white">Admin</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Sign Out"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 text-white/70" />
            </button>
          </div>
          <p className="text-xs text-white/50 text-center">Powered by Advisory Connect</p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden text-white" style={{ backgroundColor: CONTENT_BG }}>
        <header className="h-14 flex items-center justify-between px-8 sticky top-0 z-10" style={{ backgroundColor: HEADER_BG, borderBottom: `1px solid ${BORDER}` }}>
          <h2 className="text-base font-semibold tracking-tight text-white">
            {navItems.find((item) => item.href === location)?.label || "Control Panel"}
          </h2>
          <div className="flex items-center gap-4 text-sm text-white/70">
            <span>Server: <strong className="text-emerald-400">Online</strong></span>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8" style={{ backgroundColor: CONTENT_BG }}>
          <div className="max-w-6xl mx-auto space-y-8">
            {children}
            {/* F4 — same brand footer as the sub-control panel and public profile. */}
            <BrandFooter theme={MASTER_FOOTER_THEME} />
          </div>
        </div>
      </main>
    </div>
  );
}
