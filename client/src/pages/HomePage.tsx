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

  const CARD_BG = "rgba(255,255,255,0.05)";
  const CARD_BORDER = "rgba(255,255,255,0.12)";

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center pt-4 pb-2">
        <h1 className="text-4xl font-bold tracking-tight text-white">Control Panel</h1>
        <p className="mt-3 text-base max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.6)" }}>
          Your central hub for managing advisor profiles, tracking referrals, and monitoring activity.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 max-w-3xl mx-auto">
        {[
          { label: "Emails", value: stats?.totalEmails ?? 0, testid: "home-stat-emails" },
          { label: "Accesses", value: stats?.totalAccesses ?? 0, testid: "home-stat-accesses" },
          { label: "Referrals", value: stats?.totalReferrals ?? 0, testid: "home-stat-referrals" },
          { label: "Active Advisors", value: stats?.activeAdvisors ?? 0, testid: "home-stat-advisors" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-5 text-center" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
            <div className="text-3xl font-bold text-white" data-testid={s.testid}>{s.value}</div>
            <div className="text-xs mt-1 font-medium uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.55)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-start gap-4 p-5 rounded-xl text-white transition-all duration-300 cursor-pointer hover:bg-white hover:text-black"
            style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
            data-testid={`home-link-${link.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
          >
            <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
              <link.icon className="h-5 w-5 text-white group-hover:text-black transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm flex items-center gap-2">
                {link.label}
                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs mt-1 leading-relaxed transition-colors" style={{ color: "rgba(255,255,255,0.55)" }}>
                {link.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
