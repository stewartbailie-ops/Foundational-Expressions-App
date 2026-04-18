import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronUp, Check, X, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useState, Fragment } from "react";
import { format } from "date-fns";

type EmailRow = {
  id: number;
  advisorId: number;
  senderName: string;
  senderEmail: string;
  type: string;
  grade: string | null;
  leadStatus: string | null;
  subject: string | null;
  body: string | null;
  clientAge: number | null;
  clientIncome: string | null;
  clientIndustry: string | null;
  clientPhone: string | null;
  clientMarried: boolean | null;
  clientChildren: boolean | null;
  clientVehicle: boolean | null;
  clientProperty: boolean | null;
  preferredContactTime: string | null;
  servicesRequested: string | null;
  referrerName: string | null;
  referrerEmail: string | null;
  referrerPhone: string | null;
  referrerRelation: string | null;
  source: string | null;
  receivedAt: string;
  lastOpenedAt: string | null;
  advisorName: string;
};

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
  const [expandedId, setExpandedId] = useState<number | null>(null);

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

  const filtered = emails.filter((e) => {
    const matchSearch = search === "" ||
      e.senderName.toLowerCase().includes(search.toLowerCase()) ||
      e.senderEmail.toLowerCase().includes(search.toLowerCase()) ||
      e.advisorName.toLowerCase().includes(search.toLowerCase()) ||
      (e.clientIndustry || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.referrerName || "").toLowerCase().includes(search.toLowerCase());
    const matchGrade = gradeFilter === "all" || (e.grade || "").toLowerCase() === gradeFilter.toLowerCase();
    const matchType = typeFilter === "all" || e.type === typeFilter;
    const matchStatus = statusFilter === "all" || (e.leadStatus || "Need to Contact") === statusFilter;
    return matchSearch && matchGrade && matchType && matchStatus;
  });

  const gradeCounts = {
    Gold: emails.filter(e => e.grade === "Gold").length,
    Silver: emails.filter(e => e.grade === "Silver").length,
    Bronze: emails.filter(e => e.grade === "Bronze").length,
    Development: emails.filter(e => e.grade === "Development").length,
  };

  const typeCounts = {
    Referral: emails.filter(e => e.type === "Referral").length,
    "Call Back": emails.filter(e => e.type === "Call Back").length,
  };

  const statusCounts = {
    "Need to Contact": emails.filter(e => !e.leadStatus || e.leadStatus === "Need to Contact").length,
    "Contacted": emails.filter(e => e.leadStatus === "Contacted").length,
    "Archive": emails.filter(e => e.leadStatus === "Archive").length,
  };

  const hasActiveFilter = gradeFilter !== "all" || typeFilter !== "all" || statusFilter !== "all";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" data-testid="text-civ-title">Client Information Viewer</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Sort and grade all incoming client referrals, callbacks, and feedback.
          </p>
        </div>
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

      <div className="grid grid-cols-3 gap-3">
        {(["Need to Contact", "Contacted", "Archive"] as const).map((s) => (
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
        </div>
        {hasActiveFilter && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setGradeFilter("all"); setTypeFilter("all"); setStatusFilter("all"); }}
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
                <TableHead className="w-[60px]">ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Advisor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Income</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Status</TableHead>
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
                      className="border-border hover:bg-muted/50 transition-colors cursor-pointer"
                      data-testid={`row-email-${email.id}`}
                      onClick={() => {
                        const opening = expandedId !== email.id;
                        setExpandedId(opening ? email.id : null);
                        if (opening) openMutation.mutate(email.id);
                      }}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">#{email.id}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {format(new Date(email.receivedAt), "MMM d, yyyy")}
                          {email.lastOpenedAt && <Eye className="h-3 w-3 text-muted-foreground/50" />}
                        </div>
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
                            email.type === "Referral" ? "bg-white/10 text-white border-white/20" :
                            email.type === "Call Back" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                            "bg-muted text-muted-foreground"
                          }
                        >
                          {email.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{email.clientAge ?? "—"}</TableCell>
                      <TableCell className="text-sm">{email.clientIncome || "—"}</TableCell>
                      <TableCell>
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
