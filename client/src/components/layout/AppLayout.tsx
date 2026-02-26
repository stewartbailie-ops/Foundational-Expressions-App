import { Link, useLocation } from "wouter";
import { Home, LayoutDashboard, Users, UserPlus, Inbox, Settings } from "lucide-react";
import logoImg from "@assets/Advisory_Connect_1772075164954.png";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/stats", label: "Stat's Tracker", icon: LayoutDashboard },
    { href: "/civ", label: "CIV (Client Info)", icon: Inbox },
    { href: "/manage", label: "Manage Advisors", icon: Users },
    { href: "/create", label: "Create New Advisor", icon: UserPlus },
  ];

  return (
    <div className="min-h-screen bg-black flex text-white">
      <aside className="w-72 bg-black flex flex-col hidden md:flex border-r border-white/10">
        <div className="flex flex-col items-center py-8 px-6">
          <img src={logoImg} alt="Advisory Connect" className="w-44 mb-2" />
          <p className="text-xs text-white/50 tracking-wide uppercase">Control Panel</p>
        </div>

        <nav className="flex-1 py-4 px-5 space-y-2 flex flex-col items-center">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-center gap-3 w-full px-5 py-3.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-white text-black"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-5 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 text-xs font-bold border border-white/20">
                AD
              </div>
              <div className="text-sm font-medium text-white/80">Admin</div>
            </div>
            <button className="text-white/40 hover:text-white transition-colors p-1">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-white text-black">
        <header className="h-14 flex items-center justify-between px-8 border-b border-black/10 bg-white sticky top-0 z-10">
          <h2 className="text-base font-semibold tracking-tight text-black">
            {navItems.find((item) => item.href === location)?.label || "Home"}
          </h2>
          <div className="flex items-center gap-4 text-sm text-black/50">
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