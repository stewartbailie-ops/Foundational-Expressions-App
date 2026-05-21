import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronUp, Check, X, Trash2, Eye, Download, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useState, Fragment } from "react";
import { format } from "date-fns";
import type { Email } from "@shared/schema";

// Mirrors the server `Email` row plus the joined `advisorName` from the
// `/api/emails` registry endpoint. Timestamps arrive as ISO strings over
// the wire, so we override the Date-typed columns here. Keeping this in
// sync with `shared/schema.ts` means TypeScript catches missing fields
// the next time a column is added or renamed.
type EmailRow = Omit<
  Email,
  "receivedAt" | "lastOpenedAt" | "firstViewedAt" | "lastViewedAt" | "archivedAt"
> & {
  receivedAt: string;
  lastOpenedAt: string | null;
  firstViewedAt: string | null;
  lastViewedAt: string | null;
  archivedAt: string | null;
  advisorName: string;
};

const tempStyles: Record<string, string> = {
  Hot: "bg-red-500/15 text-red-700 border-red-500/30",
  Warm: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  Cold: "bg-sky-500/15 text-sky-700 border-sky-500/30",
};

const tempRowGlow: Record<string, string> = {
  Hot: "bg-red-500/[0.04] hover:bg-red-500/[0.09]",
  Warm: "bg-amber-500/[0.04] hover:bg-amber-500/[0.09]",
  Cold: "bg-sky-500/[0.04] hover:bg-sky-500/[0.09]",
};

const tempCellAccent: Record<string, string> = {
  Hot: "border-l-[4px] border-l-red-500 shadow-[inset_10px_0_10px_-8px_rgba(239,68,68,0.55)]",
  Warm: "border-l-[4px] border-l-amber-500 shadow-[inset_10px_0_10px_-8px_rgba(245,158,11,0.55)]",
  Cold: "border-l-[4px] border-l-sky-500 shadow-[inset_10px_0_10px_-8px_rgba(14,165,233,0.5)]",
};

function parseBreakdown(json: string | null): { income: number; age: number; lifestyle: number; services: number; source: number } | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    if (typeof parsed?.income === "number") return parsed;
    return null;
  } catch {
    return null;
  }
}

const gradeStyles: Record<string, string> = {
  Gold: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30",
  Silver: "bg-gray-300/20 text-gray-600 border-gray-400/30",
  Bronze: "bg-orange-500/15 text-orange-700 border-orange-500/30",
  Development: "bg-blue-500/15 text-blue-700 border-blue-500/30",
};

const gradeDot: Record<string, string> = {
  Gold: "bg-yellow-500",
  Silver: "bg-gray-400",
  Bronze: "bg-orange-500",
  Development: "bg-blue-500",
};

const statusStyles: Record<string, string> = {
  "Need to Contact": "bg-amber-500/15 text-amber-700 border-amber-500/30",
  "Contacted": "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  "Archive": "bg-gray-200/60 text-gray-500 border-gray-300/40",
};

const statusDot: Record<string, string> = {
  "Need to Contact": "bg-amber-500",
  "Contacted": "bg-emerald-500",
  "Archive": "bg-gray-400",
};

function BoolBadge({ value, label }: { value: boolean | null; label: string }) {
  if (value === null || value === undefined) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${value ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
      {value ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {label}
    </span>
  );
}

export default function CIV() {
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"active" | "archived">("active");

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const { data: emails = [], isLoading } = useQuery<EmailRow[]>({
    queryKey: ["/api/emails"],
  });

  const gradeMutation = useMutation({
    mutationFn: async ({ id, grade }: { id: number; grade: string }) => {
      await apiRequest("PATCH", `/api/emails/${id}/grade`, { grade });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, leadStatus }: { id: number; leadStatus: string }) => {
      await apiRequest("PATCH", `/api/emails/${id}/status`, { leadStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/emails/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      setExpandedId(null);
    },
  });

  const openMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/emails/${id}/open`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
    },
  });

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Delete entry #${id} (${name})? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  // Split active vs archived once so we can show counts on the top tabs and
  // hide archived leads from every other view.
  const activeEmails = emails.filter(e => e.leadStatus !== "Archive");
  const archivedEmails = emails.filter(e => e.leadStatus === "Archive");
  const sourceEmails = viewMode === "archived" ? archivedEmails : activeEmails;

  const filteredBase = sourceEmails.filter((e) => {
    const matchSearch = search === "" ||
      e.senderName.toLowerCase().includes(search.toLowerCase()) ||
      e.senderEmail.toLowerCase().includes(search.toLowerCase()) ||
      e.advisorName.toLowerCase().includes(search.toLowerCase()) ||
      (e.clientIndustry || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.referrerName || "").toLowerCase().includes(search.toLowerCase());
    const matchGrade = gradeFilter === "all" || (e.grade || "").toLowerCase() === gradeFilter.toLowerCase();
    const matchType = typeFilter === "all" || e.type === typeFilter;
    // Status filter only applies in active view (archived view is, by definition, all "Archive")
    const matchStatus = viewMode === "archived" || statusFilter === "all" || (e.leadStatus || "Need to Contact") === statusFilter;
    const received = new Date(e.receivedAt).getTime();
    const matchDateFrom = !dateFrom || received >= new Date(dateFrom + "T00:00:00").getTime();
    const matchDateTo = !dateTo || received <= new Date(dateTo + "T23:59:59").getTime();
    return matchSearch && matchGrade && matchType && matchStatus && matchDateFrom && matchDateTo;
  });

  const sortGetters: Record<string, (e: EmailRow) => string | number> = {
    id: (e) => e.id,
    date: (e) => new Date(e.receivedAt).getTime(),
    client: (e) => (e.senderName || "").toLowerCase(),
    advisor: (e) => (e.advisorName || "").toLowerCase(),
    type: (e) => e.type || "",
    age: (e) => e.clientAge ?? -Infinity,
    income: (e) => (e.clientIncome || "").toLowerCase(),
    grade: (e) => e.grade || "",
    status: (e) => e.leadStatus || "",
  };

  const filtered = sortKey && sortGetters[sortKey]
    ? [...filteredBase].sort((a, b) => {
        const ga = sortGetters[sortKey](a);
        const gb = sortGetters[sortKey](b);
        const cmp = ga < gb ? -1 : ga > gb ? 1 : 0;
        return sortDir === "asc" ? cmp : -cmp;
      })
    : filteredBase;

  const gradeCounts = {
    Gold: emails.filter(e => e.grade === "Gold").length,
    Silver: emails.filter(e => e.grade === "Silver").length,
    Bronze: emails.filter(e => e.grade === "Bronze").length,
    Development: emails.filter(e => e.grade === "Development").length,
  };

  const typeCounts = {
    Referral: emails.filter(e => e.type === "Referral").length,
    "Call Back": emails.filter(e => e.type === "Call Back").length,
    "Will Request": emails.filter(e => e.type === "Will Request").length,
  };

  // Status counts are scoped to active leads — Archive becomes a top-level tab, not a status card.
  const statusCounts = {
    "Need to Contact": activeEmails.filter(e => !e.leadStatus || e.leadStatus === "Need to Contact").length,
    "Contacted": activeEmails.filter(e => e.leadStatus === "Contacted").length,
  };

  const hasActiveFilter = gradeFilter !== "all" || typeFilter !== "all" || statusFilter !== "all" || dateFrom !== "" || dateTo !== "";
  // Unread badge is scoped to whatever view the admin is currently looking at.
  const unreadCount = sourceEmails.filter(e => !e.lastOpenedAt).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" data-testid="text-civ-title">Registry</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Sort and grade all incoming client referrals, callbacks, and will requests.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            window.location.href = "/api/emails/export.csv";
          }}
          data-testid="button-export-csv"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Active / Archived top-level view tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        {(["active", "archived"] as const).map((mode) => {
          const isActive = viewMode === mode;
          const count = mode === "active" ? activeEmails.length : archivedEmails.length;
          const label = mode === "active" ? "Active" : "Archived";
          return (
            <button
              key={mode}
              onClick={() => {
                setViewMode(mode);
                setExpandedId(null);
                if (mode === "archived") setStatusFilter("all");
              }}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                isActive
                  ? "border-white text-white"
                  : "border-transparent text-muted-foreground hover:text-white/80"
              }`}
              data-testid={`tab-view-${mode}`}
            >
              {label}
              <span
                className={`ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs ${
                  isActive ? "bg-white/15 text-white" : "bg-white/5 text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(["Gold", "Silver", "Bronze", "Development"] as const).map((g) => (
          <button
            key={g}
            onClick={() => setGradeFilter(gradeFilter === g ? "all" : g)}
            className={`rounded-xl p-4 text-left border transition-all ${
              gradeFilter === g ? "ring-2 ring-white shadow-md" : "hover:shadow-sm"
            }`}
            data-testid={`filter-grade-${g.toLowerCase()}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2.5 h-2.5 rounded-full ${gradeDot[g]}`} />
              <span className="text-sm font-semibold">{g}</span>
            </div>
            <div className="text-2xl font-bold">{gradeCounts[g]}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {g === "Gold" && "R75k+ income"}
              {g === "Silver" && "R45k – R74k income"}
              {g === "Bronze" && "R15k – R44k income"}
              {g === "Development" && "Under R15k / Age 60+"}
            </div>
          </button>
        ))}
      </div>

      {viewMode === "active" && (
        <div className="grid grid-cols-2 gap-3">
          {(["Need to Contact", "Contacted"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
              className={`rounded-xl p-3 text-left border transition-all ${
                statusFilter === s ? "ring-2 ring-white shadow-md" : "hover:shadow-sm"
              }`}
              data-testid={`filter-status-${s.toLowerCase().replace(/ /g, "-")}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${statusDot[s]}`} />
                <span className="text-xs font-semibold">{s}</span>
              </div>
              <div className="text-xl font-bold">{statusCounts[s]}</div>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients, advisors, referrers..."
            className="pl-8 border-0 placeholder:text-white/40 text-white"
            style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-civ"
          />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Received</span>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 w-[140px] border-0 text-white"
            style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
            data-testid="input-date-from"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 w-[140px] border-0 text-white"
            style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
            data-testid="input-date-to"
          />
        </div>
        {unreadCount > 0 && (
          <span
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30"
            data-testid="text-unread-count"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400" />
            {unreadCount} unread
          </span>
        )}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setTypeFilter(typeFilter === "Referral" ? "all" : "Referral")}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={
              typeFilter === "Referral"
                ? { backgroundColor: "#ffffff", color: "#000000", border: "1px solid #ffffff" }
                : { backgroundColor: "rgba(255,255,255,0.06)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.10)" }
            }
            data-testid="filter-type-referral"
          >
            Referrals ({typeCounts.Referral})
          </button>
          <button
            onClick={() => setTypeFilter(typeFilter === "Call Back" ? "all" : "Call Back")}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={
              typeFilter === "Call Back"
                ? { backgroundColor: "#ffffff", color: "#000000", border: "1px solid #ffffff" }
                : { backgroundColor: "rgba(255,255,255,0.06)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.10)" }
            }
            data-testid="filter-type-callback"
          >
            Call Backs ({typeCounts["Call Back"]})
          </button>
          <button
            onClick={() => setTypeFilter(typeFilter === "Will Request" ? "all" : "Will Request")}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={
              typeFilter === "Will Request"
                ? { backgroundColor: "#f59e0b", color: "#000000", border: "1px solid #f59e0b" }
                : { backgroundColor: "rgba(245,158,11,0.10)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }
            }
            data-testid="filter-type-will"
          >
            Will Requests ({typeCounts["Will Request"]})
          </button>
        </div>
        {hasActiveFilter && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setGradeFilter("all"); setTypeFilter("all"); setStatusFilter("all"); setDateFrom(""); setDateTo(""); }}
            data-testid="button-clear-filter"
          >
            Clear all filters
          </Button>
        )}
      </div>

      <Card className="border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                {([
                  { key: "id", label: "ID", className: "w-[60px]" },
                  { key: "date", label: "Date", className: "" },
                  { key: "client", label: "Client", className: "" },
                  { key: "advisor", label: "Advisor", className: "" },
                  { key: "type", label: "Type", className: "" },
                  { key: "age", label: "Age", className: "" },
                  { key: "income", label: "Income", className: "" },
                  { key: "grade", label: "Grade", className: "" },
                  { key: "status", label: "Status", className: "" },
                ]).map((h) => (
                  <TableHead
                    key={h.key}
                    className={`cursor-pointer select-none ${h.className || ""}`}
                    onDoubleClick={() => toggleSort(h.key)}
                    title="Double-click to sort"
                    data-testid={`header-sort-${h.key}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {h.label}
                      {sortKey === h.key && (
                        sortDir === "asc"
                          ? <ChevronUp className="h-3 w-3" />
                          : <ChevronDown className="h-3 w-3" />
                      )}
                    </span>
                  </TableHead>
                ))}
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                    {emails.length === 0 ? "No client submissions received yet." : "No entries match your filters."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((email) => (
                  <Fragment key={email.id}>
                    <TableRow
                      className={`border-border transition-colors cursor-pointer ${
                        email.leadTemperature && tempRowGlow[email.leadTemperature]
                          ? tempRowGlow[email.leadTemperature]
                          : "hover:bg-muted/50"
                      }`}
                      data-testid={`row-email-${email.id}`}
                      onClick={() => {
                        const opening = expandedId !== email.id;
                        setExpandedId(opening ? email.id : null);
                        if (opening) openMutation.mutate(email.id);
                      }}
                    >
                      <TableCell
                        className={`font-mono text-xs text-muted-foreground ${
                          email.leadTemperature && tempCellAccent[email.leadTemperature]
                            ? tempCellAccent[email.leadTemperature]
                            : ""
                        }`}
                        data-testid={`cell-temp-trim-${email.id}`}
                      >
                        #{email.id}
                      </TableCell>
                      <TableCell className={`text-sm whitespace-nowrap ${!email.lastOpenedAt ? "font-semibold" : ""}`}>
                        <div className="flex items-center gap-1.5">
                          {!email.lastOpenedAt && (
                            <span
                              className="inline-block w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.7)] flex-shrink-0"
                              title="Unread"
                              data-testid={`dot-unread-${email.id}`}
                            />
                          )}
                          {format(new Date(email.receivedAt), "MMM d, yyyy")}
                          {email.lastOpenedAt && <Eye className="h-3 w-3 text-muted-foreground/50" />}
                        </div>
                        {viewMode === "archived" && email.archivedAt && (
                          <div className="text-xs text-muted-foreground/80 mt-0.5" data-testid={`text-archived-${email.id}`}>
                            Archived {format(new Date(email.archivedAt), "MMM d, yyyy")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{email.senderName}</div>
                        <div className="text-xs text-muted-foreground">{email.senderEmail}</div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{email.advisorName}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            email.type === "Referral" ? "bg-violet-500/10 text-violet-400 border-violet-500/20" :
                            email.type === "Call Back" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                            email.type === "Will Request" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                            "bg-muted text-muted-foreground"
                          }
                        >
                          {email.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{email.clientAge ?? "—"}</TableCell>
                      <TableCell className="text-sm">{email.clientIncome || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Select
                            value={email.grade || "Silver"}
                            onValueChange={(grade) => gradeMutation.mutate({ id: email.id, grade })}
                          >
                            <SelectTrigger
                              className={`w-[110px] h-8 text-xs border ${gradeStyles[email.grade || "Silver"] || ""}`}
                              data-testid={`select-grade-${email.id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${gradeDot[email.grade || "Silver"] || "bg-gray-400"}`} />
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Gold">Gold</SelectItem>
                              <SelectItem value="Silver">Silver</SelectItem>
                              <SelectItem value="Bronze">Bronze</SelectItem>
                              <SelectItem value="Development">Development</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-1.5 px-1">
                            {email.leadTemperature && (
                              <span
                                className={`text-[10px] leading-none px-1.5 py-0.5 rounded border ${tempStyles[email.leadTemperature] || tempStyles.Cold}`}
                                data-testid={`badge-temperature-${email.id}`}
                              >
                                {email.leadTemperature}
                              </span>
                            )}
                            {typeof email.leadScore === "number" && email.leadScore > 0 && (
                              <span
                                className="text-[10px] text-muted-foreground font-mono"
                                data-testid={`text-score-${email.id}`}
                              >
                                {email.leadScore}/100
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={email.leadStatus || "Need to Contact"}
                          onValueChange={(leadStatus) => statusMutation.mutate({ id: email.id, leadStatus })}
                        >
                          <SelectTrigger
                            className={`w-[140px] h-8 text-xs border ${statusStyles[email.leadStatus || "Need to Contact"] || ""}`}
                            data-testid={`select-status-${email.id}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[email.leadStatus || "Need to Contact"] || "bg-amber-500"}`} />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Need to Contact">Need to Contact</SelectItem>
                            <SelectItem value="Contacted">Contacted</SelectItem>
                            <SelectItem value="Archive">Archive</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {expandedId === email.id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedId === email.id && (
                      <TableRow key={`detail-${email.id}`} className="bg-muted/30 border-border">
                        <TableCell colSpan={10}>
                          <div className="py-4 px-2 space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground text-xs block mb-0.5">Phone</span>
                                <span className="font-medium" data-testid={`text-phone-${email.id}`}>{email.clientPhone || "Not provided"}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground text-xs block mb-0.5">Industry</span>
                                <span className="font-medium" data-testid={`text-industry-${email.id}`}>{email.clientIndustry || "Not specified"}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground text-xs block mb-0.5">Preferred Contact Time</span>
                                <span className="font-medium" data-testid={`text-contact-time-${email.id}`}>{email.preferredContactTime || "Not specified"}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground text-xs block mb-0.5">Source</span>
                                <span className="font-medium" data-testid={`text-source-${email.id}`}>{email.source || "Not specified"}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2" data-testid={`badges-profile-${email.id}`}>
                              <BoolBadge value={email.clientMarried} label="Married" />
                              <BoolBadge value={email.clientChildren} label="Children" />
                              <BoolBadge value={email.clientVehicle} label="Vehicle" />
                              <BoolBadge value={email.clientProperty} label="Property" />
                            </div>

                            {email.servicesRequested && (
                              <div>
                                <span className="text-muted-foreground text-xs block mb-1">Services Requested</span>
                                <p className="text-sm font-medium" data-testid={`text-services-${email.id}`}>{email.servicesRequested}</p>
                              </div>
                            )}

                            {/* Task #23 — gap fields. Compact grid for the
                                short ones, separate blocks for the open-text
                                fields so they don't get truncated. Each block
                                only renders when populated, so legacy leads
                                still show their lean shape. */}
                            {(
                              email.howFound ||
                              email.netWorthBracket ||
                              email.hasAdvisor != null ||
                              email.hasWill != null ||
                              email.estateValueBracket
                            ) && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm" data-testid={`gap-fields-${email.id}`}>
                                {email.howFound && (
                                  <div>
                                    <span className="text-muted-foreground text-xs block mb-0.5">How They Found You</span>
                                    <span className="font-medium" data-testid={`text-how-found-${email.id}`}>{email.howFound}</span>
                                  </div>
                                )}
                                {email.netWorthBracket && (
                                  <div>
                                    <span className="text-muted-foreground text-xs block mb-0.5">Net Worth / Savings</span>
                                    <span className="font-medium" data-testid={`text-net-worth-${email.id}`}>{email.netWorthBracket}</span>
                                  </div>
                                )}
                                {email.hasAdvisor != null && (
                                  <div>
                                    <span className="text-muted-foreground text-xs block mb-0.5">Existing Advisor</span>
                                    <span className="font-medium" data-testid={`text-has-advisor-${email.id}`}>
                                      {email.hasAdvisor ? (email.existingAdvisorName || "Yes") : "No"}
                                    </span>
                                  </div>
                                )}
                                {email.hasWill != null && (
                                  <div>
                                    <span className="text-muted-foreground text-xs block mb-0.5">Has Will</span>
                                    <span className="font-medium" data-testid={`text-has-will-${email.id}`}>{email.hasWill ? "Yes" : "No"}</span>
                                  </div>
                                )}
                                {email.estateValueBracket && (
                                  <div>
                                    <span className="text-muted-foreground text-xs block mb-0.5">Estate Value</span>
                                    <span className="font-medium" data-testid={`text-estate-value-${email.id}`}>{email.estateValueBracket}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {email.biggestConcern && (
                              <div>
                                <span className="text-muted-foreground text-xs block mb-1">Biggest Financial Concern</span>
                                <p className="text-sm bg-background rounded-lg p-3 border" data-testid={`text-biggest-concern-${email.id}`}>{email.biggestConcern}</p>
                              </div>
                            )}

                            {email.referralReason && (
                              <div>
                                <span className="text-muted-foreground text-xs block mb-1">Why Referred</span>
                                <p className="text-sm bg-background rounded-lg p-3 border" data-testid={`text-referral-reason-${email.id}`}>{email.referralReason}</p>
                              </div>
                            )}

                            {(email.referrerName || email.referrerEmail) && (
                              <div className="bg-background rounded-lg p-3 border">
                                <span className="text-muted-foreground text-xs block mb-1.5">Referred By</span>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                  <div>
                                    <span className="text-muted-foreground text-xs">Name</span>
                                    <div className="font-medium" data-testid={`text-referrer-name-${email.id}`}>{email.referrerName || "—"}</div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground text-xs">Email</span>
                                    <div className="font-medium" data-testid={`text-referrer-email-${email.id}`}>{email.referrerEmail || "—"}</div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground text-xs">Phone</span>
                                    <div className="font-medium" data-testid={`text-referrer-phone-${email.id}`}>{email.referrerPhone || "—"}</div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground text-xs">Relationship</span>
                                    <div className="font-medium" data-testid={`text-referrer-relation-${email.id}`}>{email.referrerRelation || "—"}</div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {email.body && (
                              <div>
                                <span className="text-muted-foreground text-xs block mb-1">Message</span>
                                <p className="text-sm bg-background rounded-lg p-3 border" data-testid={`text-message-${email.id}`}>{email.body}</p>
                              </div>
                            )}

                            {/* W1 T9: soft-warn duplicate flag. Non-blocking — just surfaces
                                that this lead's phone/email matches a prior lead for the same
                                advisor. Advisor decides merge vs treat as new. */}
                            {email.duplicateOfId && (
                              <div className="rounded-lg p-2.5 border border-amber-300/50 bg-amber-50/60 dark:bg-amber-950/20 flex items-start gap-2" data-testid={`dup-flag-${email.id}`}>
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-amber-900 dark:text-amber-200">
                                  <span className="font-semibold">Possible duplicate.</span>{" "}
                                  Matches an earlier lead (#{email.duplicateOfId}) for this advisor on phone or email.
                                </div>
                              </div>
                            )}

                            {(typeof email.leadScore === "number" && email.leadScore > 0) && (() => {
                              const bd = parseBreakdown(email.gradeBreakdown);
                              return (
                                <div className="bg-background rounded-lg p-3 border" data-testid={`breakdown-${email.id}`}>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-muted-foreground">Lead Score Breakdown</span>
                                    <div className="flex items-center gap-2">
                                      {email.leadTemperature && (
                                        <span className={`text-[11px] px-2 py-0.5 rounded border ${tempStyles[email.leadTemperature] || tempStyles.Cold}`}>
                                          {email.leadTemperature}
                                        </span>
                                      )}
                                      <span className="text-sm font-semibold font-mono">
                                        {email.grade} — {email.leadScore}/100
                                      </span>
                                    </div>
                                  </div>
                                  {bd ? (
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                                      <div className="bg-muted/40 rounded px-2 py-1.5">
                                        <div className="text-muted-foreground text-[10px] uppercase tracking-wide">Income</div>
                                        <div className="font-mono font-semibold">+{bd.income} <span className="text-muted-foreground font-normal">/35</span></div>
                                      </div>
                                      <div className="bg-muted/40 rounded px-2 py-1.5">
                                        <div className="text-muted-foreground text-[10px] uppercase tracking-wide">Age</div>
                                        <div className="font-mono font-semibold">+{bd.age} <span className="text-muted-foreground font-normal">/20</span></div>
                                      </div>
                                      <div className="bg-muted/40 rounded px-2 py-1.5">
                                        <div className="text-muted-foreground text-[10px] uppercase tracking-wide">Lifestyle</div>
                                        <div className="font-mono font-semibold">+{bd.lifestyle} <span className="text-muted-foreground font-normal">/20</span></div>
                                      </div>
                                      <div className="bg-muted/40 rounded px-2 py-1.5">
                                        <div className="text-muted-foreground text-[10px] uppercase tracking-wide">Services</div>
                                        <div className="font-mono font-semibold">+{bd.services} <span className="text-muted-foreground font-normal">/15</span></div>
                                      </div>
                                      <div className="bg-muted/40 rounded px-2 py-1.5">
                                        <div className="text-muted-foreground text-[10px] uppercase tracking-wide">Source</div>
                                        <div className="font-mono font-semibold">+{bd.source} <span className="text-muted-foreground font-normal">/10</span></div>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground italic">Detailed breakdown unavailable for this lead.</p>
                                  )}
                                </div>
                              );
                            })()}

                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <div className="text-xs text-muted-foreground">
                                  Received: {format(new Date(email.receivedAt), "PPpp")}
                                </div>
                                {email.lastOpenedAt && (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    Last viewed: {format(new Date(email.lastOpenedAt), "PPpp")}
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                onClick={(e) => { e.stopPropagation(); handleDelete(email.id, email.senderName); }}
                                disabled={deleteMutation.isPending}
                                data-testid={`button-delete-${email.id}`}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
