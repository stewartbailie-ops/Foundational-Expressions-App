import { Mail, MousePointerClick, Send, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";

const TILE_BG = "rgba(255,255,255,0.06)";
const TILE_BORDER = "rgba(255,255,255,0.10)";

function StatTile({ label, value, icon: Icon, testId }: { label: string; value: number | string; icon: any; testId: string }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: TILE_BG, border: `1px solid ${TILE_BORDER}`, color: "#ffffff" }}
      data-testid={testId.replace("text-", "card-")}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium opacity-80">{label}</span>
        <Icon className="h-4 w-4 opacity-60" />
      </div>
      <div className="text-3xl font-bold" data-testid={testId}>{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats } = useQuery<{
    totalEmails: number;
    totalAccesses: number;
    totalReferrals: number;
    activeAdvisors: number;
  }>({ queryKey: ["/api/dashboard/stats"] });

  const { data: activity } = useQuery<{ name: string; emails: number; accesses: number }[]>({
    queryKey: ["/api/dashboard/activity"],
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Total Emails Received" value={stats?.totalEmails ?? 0} icon={Mail} testId="text-total-emails" />
        <StatTile label="App Accesses" value={stats?.totalAccesses ?? 0} icon={MousePointerClick} testId="text-app-accesses" />
        <StatTile label="Total Referrals Sent" value={stats?.totalReferrals ?? 0} icon={Send} testId="text-total-referrals" />
        <StatTile label="Active Advisors" value={stats?.activeAdvisors ?? 0} icon={Users} testId="text-active-advisors" />
      </div>

      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: TILE_BG, border: `1px solid ${TILE_BORDER}`, color: "#ffffff" }}
      >
        <div className="text-lg font-semibold mb-4">Activity Overview (Last 7 Days)</div>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activity || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.10)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.60)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="rgba(255,255,255,0.60)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.06)" }}
                contentStyle={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#fff" }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar dataKey="emails" name="Emails" fill="#ffffff" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="accesses" name="Accesses" fill="rgba(255,255,255,0.35)" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
