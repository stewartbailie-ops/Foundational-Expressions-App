import { useState } from "react";
import { Mail, MousePointerClick, Send, Users, Award } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

const GLASS_BG = "rgba(255,255,255,0.06)";
const GLASS_BORDER = "rgba(255,255,255,0.10)";

const TYPE_COLORS: Record<string, string> = {
  "Referral": "#3B82F6",
  "Call Back": "#10B981",
  "Will Request": "#F59E0B",
};

const GRADE_COLORS: Record<string, string> = {
  "Gold": "#F59E0B",
  "Silver": "#94A3B8",
  "Bronze": "#CD7F32",
  "Development": "#8B5CF6",
};

const GRADE_ORDER = ["Gold", "Silver", "Bronze", "Development"];

function StatTile({
  label, value, icon: Icon, accent, index, testId,
}: {
  label: string; value: number; icon: any; accent: string; index: number; testId: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35, ease: "easeOut" }}
      className="rounded-xl p-5"
      style={{ backgroundColor: GLASS_BG, border: `1px solid ${GLASS_BORDER}`, color: "#fff" }}
      data-testid={testId.replace("text-", "card-")}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium opacity-70">{label}</span>
        <div className="rounded-lg p-1.5" style={{ backgroundColor: `${accent}22` }}>
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </div>
      </div>
      <div className="text-3xl font-bold" data-testid={testId}>{value}</div>
    </motion.div>
  );
}

function RangeBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
      style={{
        backgroundColor: active ? "rgba(255,255,255,0.15)" : "transparent",
        color: active ? "#fff" : "rgba(255,255,255,0.45)",
        border: `1px solid ${active ? "rgba(255,255,255,0.20)" : "transparent"}`,
      }}
    >
      {label}
    </button>
  );
}

function ActivityTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}>
      <div className="text-xs opacity-50 mb-2">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="opacity-60">{p.name}:</span>
          <span className="font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="rounded-lg px-3 py-2" style={{ backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}>
      <span className="text-xs opacity-60">{name}: </span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

export default function Dashboard() {
  const [days, setDays] = useState(7);

  const { data: stats } = useQuery<{
    totalEmails: number;
    totalAccesses: number;
    totalReferrals: number;
    activeAdvisors: number;
  }>({ queryKey: ["/api/dashboard/stats"] });

  const { data: activity } = useQuery<{ name: string; emails: number; accesses: number }[]>({
    queryKey: ["/api/dashboard/activity", days],
    queryFn: () => fetch(`/api/dashboard/activity?days=${days}`).then(r => r.json()),
  });

  const { data: breakdown } = useQuery<{
    typeBreakdown: { type: string; count: number }[];
    gradeBreakdown: { grade: string; count: number }[];
  }>({ queryKey: ["/api/dashboard/breakdown"] });

  const totalLeads = breakdown?.typeBreakdown.reduce((s, r) => s + r.count, 0) ?? 0;

  const sortedGrades = (breakdown?.gradeBreakdown ?? []).slice().sort(
    (a, b) => GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade)
  );

  const xAxisInterval = days === 30 ? 4 : days === 90 ? 1 : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Stat tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Total Leads" value={stats?.totalEmails ?? 0} icon={Mail} accent="#3B82F6" index={0} testId="text-total-emails" />
        <StatTile label="Profile Views" value={stats?.totalAccesses ?? 0} icon={MousePointerClick} accent="#10B981" index={1} testId="text-app-accesses" />
        <StatTile label="Referrals Sent" value={stats?.totalReferrals ?? 0} icon={Send} accent="#F59E0B" index={2} testId="text-total-referrals" />
        <StatTile label="Active Advisors" value={stats?.activeAdvisors ?? 0} icon={Users} accent="#8B5CF6" index={3} testId="text-active-advisors" />
      </div>

      {/* Area chart + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Activity area chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="lg:col-span-2 rounded-xl p-5"
          style={{ backgroundColor: GLASS_BG, border: `1px solid ${GLASS_BORDER}`, color: "#fff" }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-base font-semibold">Lead Activity</div>
              <div className="text-xs opacity-50 mt-0.5">Leads &amp; profile views over time</div>
            </div>
            <div className="flex gap-1">
              <RangeBtn label="7d" active={days === 7} onClick={() => setDays(7)} />
              <RangeBtn label="30d" active={days === 30} onClick={() => setDays(30)} />
              <RangeBtn label="90d" active={days === 90} onClick={() => setDays(90)} />
            </div>
          </div>

          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity ?? []} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="viewGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.07)" />
                <XAxis
                  dataKey="name"
                  stroke="rgba(255,255,255,0.35)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                  interval={xAxisInterval}
                />
                <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<ActivityTooltip />} />
                <Area
                  type="monotone"
                  dataKey="emails"
                  name="Leads"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#leadGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#3B82F6" }}
                />
                <Area
                  type="monotone"
                  dataKey="accesses"
                  name="Views"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#viewGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#10B981" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex gap-5 mt-3">
            <div className="flex items-center gap-1.5 text-xs opacity-55">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#3B82F6" }} />
              Leads
            </div>
            <div className="flex items-center gap-1.5 text-xs opacity-55">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#10B981" }} />
              Profile Views
            </div>
          </div>
        </motion.div>

        {/* Lead type donut */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.4 }}
          className="rounded-xl p-5"
          style={{ backgroundColor: GLASS_BG, border: `1px solid ${GLASS_BORDER}`, color: "#fff" }}
        >
          <div className="text-base font-semibold">Lead Types</div>
          <div className="text-xs opacity-50 mt-0.5 mb-3">{totalLeads} total leads</div>

          <div className="h-[170px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdown?.typeBreakdown ?? []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="type"
                  strokeWidth={0}
                >
                  {(breakdown?.typeBreakdown ?? []).map((entry) => (
                    <Cell key={entry.type} fill={TYPE_COLORS[entry.type] ?? "#6B7280"} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2.5 mt-1">
            {(breakdown?.typeBreakdown ?? []).map((entry) => (
              <div key={entry.type} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs opacity-70">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[entry.type] ?? "#6B7280" }} />
                  {entry.type}
                </div>
                <span className="text-xs font-semibold">{entry.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Grade breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.46, duration: 0.4 }}
        className="rounded-xl p-5"
        style={{ backgroundColor: GLASS_BG, border: `1px solid ${GLASS_BORDER}`, color: "#fff" }}
      >
        <div className="text-base font-semibold mb-4">Lead Grade Breakdown</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {sortedGrades.map((entry) => {
            const pct = totalLeads > 0 ? Math.round((entry.count / totalLeads) * 100) : 0;
            const color = GRADE_COLORS[entry.grade] ?? "#6B7280";
            return (
              <div
                key={entry.grade}
                className="rounded-lg p-4"
                style={{ backgroundColor: `${color}14`, border: `1px solid ${color}30` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold" style={{ color }}>{entry.grade}</span>
                  <Award className="h-3.5 w-3.5 opacity-70" style={{ color }} />
                </div>
                <div className="text-2xl font-bold">{entry.count}</div>
                <div className="mt-2 h-1 rounded-full" style={{ backgroundColor: `${color}25` }}>
                  <div
                    className="h-1 rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: color, transition: "width 0.7s ease" }}
                  />
                </div>
                <div className="text-[10px] opacity-45 mt-1">{pct}% of leads</div>
              </div>
            );
          })}
        </div>
      </motion.div>

    </div>
  );
}
