import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, UserPlus, Inbox, Settings } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Stat's Tracker", icon: LayoutDashboard },
    { href: "/civ", label: "CIV (Client Info)", icon: Inbox },
    { href: "/manage", label: "Manage Advisors", icon: Users },
    { href: "/create", label: "Create New Advisor", icon: UserPlus },
  ];

  return (
    <div className="min-h-screen bg-background flex text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm tracking-tighter">AC</span>
            </div>
            <h1 className="font-bold text-lg tracking-tight">Control Panel</h1>
          </div>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold border border-border">
                AD
              </div>
              <div className="text-sm font-medium">Admin</div>
            </div>
            <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
        <header className="h-16 flex items-center justify-between px-8 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <h2 className="text-lg font-semibold tracking-tight">
            {navItems.find((item) => item.href === location)?.label || "Dashboard"}
          </h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Server: <strong className="text-emerald-500">Online</strong></span>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}