import { Link, useLocation } from "wouter";
import { Home, LayoutDashboard, Users, Inbox, LogOut } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

const BRAND_BLUE = "#4a8db5";
const BRAND_BLUE_DARK = "#3a7095";
const BRAND_BLUE_LIGHT = "rgba(255,255,255,0.15)";

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
    <div className="min-h-screen flex text-white" style={{ backgroundColor: "#f5f7fa" }}>
      <aside className="w-72 flex flex-col hidden md:flex" style={{ backgroundColor: BRAND_BLUE }}>
        <div className="flex flex-col items-start px-5 pt-6 pb-4">
          <img
            src="/advisory-connect-logo.png"
            alt="Advisory Connect"
            className="w-full max-w-[200px] rounded-xl mb-4 object-contain"
          />
          <p className="text-base text-white/90 tracking-wide uppercase font-semibold">Control Panel</p>
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
                    ? "bg-white text-[#4a8db5]"
                    : "text-white/90 hover:bg-white/15"
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.2)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold border" style={{ backgroundColor: "rgba(255,255,255,0.2)", borderColor: "rgba(255,255,255,0.3)", color: "#fff" }}>
                AD
              </div>
              <div className="text-sm font-medium text-white/85">Admin</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
              title="Sign Out"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 text-white/70" />
            </button>
          </div>
          <p className="text-xs text-white/50 text-center">Powered by Advisory Connect</p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-white text-foreground">
        <header className="h-14 flex items-center justify-between px-8 border-b border-primary/15 bg-white sticky top-0 z-10">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {navItems.find((item) => item.href === location)?.label || "Control Panel"}
          </h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Server: <strong className="text-emerald-600">Online</strong></span>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8 bg-neutral-50">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
