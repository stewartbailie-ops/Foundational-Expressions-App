import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Inbox, Users, ArrowRight } from "lucide-react";

export default function HomePage() {
  const { data: stats } = useQuery<{
    totalEmails: number;
    totalAccesses: number;
    totalReferrals: number;
    activeAdvisors: number;
  }>({ queryKey: ["/api/dashboard/stats"] });

  const quickLinks = [
    {
      href: "/stats",
      label: "Stat's Tracker",
      description: "View email analytics, app accesses, and referral metrics.",
      icon: LayoutDashboard,
    },
    {
      href: "/civ",
      label: "Client Information Viewer",
      description: "Sort, organize, and grade all incoming client submissions.",
      icon: Inbox,
    },
    {
      href: "/manage",
      label: "Manage Advisors",
      description: "View, create, activate, and deactivate advisor profiles.",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center pt-4 pb-2">
        <h1 className="text-4xl font-bold tracking-tight text-black">Advisory Connect</h1>
        <p className="text-lg text-black/40 font-medium mt-1">Control Panel</p>
        <p className="text-black/50 mt-3 text-base max-w-xl mx-auto">
          Your central hub for managing advisor profiles, tracking referrals, and monitoring activity.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 max-w-3xl mx-auto">
        <div className="bg-black rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-white" data-testid="home-stat-emails">{stats?.totalEmails ?? 0}</div>
          <div className="text-xs text-white/60 mt-1 font-medium uppercase tracking-wide">Emails</div>
        </div>
        <div className="bg-black rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-white" data-testid="home-stat-accesses">{stats?.totalAccesses ?? 0}</div>
          <div className="text-xs text-white/60 mt-1 font-medium uppercase tracking-wide">Accesses</div>
        </div>
        <div className="bg-black rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-white" data-testid="home-stat-referrals">{stats?.totalReferrals ?? 0}</div>
          <div className="text-xs text-white/60 mt-1 font-medium uppercase tracking-wide">Referrals</div>
        </div>
        <div className="bg-black rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-white" data-testid="home-stat-advisors">{stats?.activeAdvisors ?? 0}</div>
          <div className="text-xs text-white/60 mt-1 font-medium uppercase tracking-wide">Active Advisors</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-start gap-4 p-5 rounded-xl border border-black/10 bg-white hover:bg-black hover:text-white transition-all duration-300 cursor-pointer"
            data-testid={`home-link-${link.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
          >
            <div className="shrink-0 w-10 h-10 rounded-lg bg-black/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
              <link.icon className="h-5 w-5 text-black group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm flex items-center gap-2">
                {link.label}
                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs mt-1 text-black/50 group-hover:text-white/60 transition-colors leading-relaxed">
                {link.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}