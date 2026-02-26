import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronUp, User } from "lucide-react";
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
  subject: string | null;
  body: string | null;
  clientAge: number | null;
  clientIncome: string | null;
  clientIndustry: string | null;
  clientPhone: string | null;
  source: string | null;
  receivedAt: string;
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

export default function CIV() {
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
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

  const filtered = emails.filter((e) => {
    const matchSearch = search === "" ||
      e.senderName.toLowerCase().includes(search.toLowerCase()) ||
      e.senderEmail.toLowerCase().includes(search.toLowerCase()) ||
      e.advisorName.toLowerCase().includes(search.toLowerCase()) ||
      (e.clientIndustry || "").toLowerCase().includes(search.toLowerCase());
    const matchGrade = gradeFilter === "all" || (e.grade || "").toLowerCase() === gradeFilter.toLowerCase();
    return matchSearch && matchGrade;
  });

  const gradeCounts = {
    Gold: emails.filter(e => e.grade === "Gold").length,
    Silver: emails.filter(e => e.grade === "Silver").length,
    Bronze: emails.filter(e => e.grade === "Bronze").length,
    Development: emails.filter(e => e.grade === "Development").length,
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" data-testid="text-civ-title">Client Information Viewer</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Sort and grade all incoming client referrals and feedback.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(["Gold", "Silver", "Bronze", "Development"] as const).map((g) => (
          <button
            key={g}
            onClick={() => setGradeFilter(gradeFilter === g ? "all" : g)}
            className={`rounded-xl p-4 text-left border transition-all ${
              gradeFilter === g ? "ring-2 ring-black shadow-md" : "hover:shadow-sm"
            }`}
            data-testid={`filter-grade-${g.toLowerCase()}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2.5 h-2.5 rounded-full ${gradeDot[g]}`} />
              <span className="text-sm font-semibold">{g}</span>
            </div>
            <div className="text-2xl font-bold">{gradeCounts[g]}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {g === "Gold" && "Age 35-55+, R100k+, IT"}
              {g === "Silver" && "Age 27-35, R65k+"}
              {g === "Bronze" && "Age 18-27, R25k & below"}
              {g === "Development" && "Age 60+, Call backs"}
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients, advisors, industry..."
            className="pl-8 bg-background border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-civ"
          />
        </div>
        {gradeFilter !== "all" && (
          <Button variant="outline" size="sm" onClick={() => setGradeFilter("all")} data-testid="button-clear-filter">
            Clear filter
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
                <TableHead>Industry</TableHead>
                <TableHead>Grade</TableHead>
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
                      onClick={() => setExpandedId(expandedId === email.id ? null : email.id)}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">#{email.id}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {format(new Date(email.receivedAt), "MMM d, yyyy")}
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
                            email.type === "Referral" ? "bg-primary/10 text-primary border-primary/20" :
                            email.type === "Call Back" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                            "bg-muted text-muted-foreground"
                          }
                        >
                          {email.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{email.clientAge ?? "—"}</TableCell>
                      <TableCell className="text-sm">{email.clientIncome || "—"}</TableCell>
                      <TableCell className="text-sm">{email.clientIndustry || "—"}</TableCell>
                      <TableCell>
                        <Select
                          value={email.grade || "Silver"}
                          onValueChange={(grade) => {
                            gradeMutation.mutate({ id: email.id, grade });
                          }}
                        >
                          <SelectTrigger
                            className={`w-[120px] h-8 text-xs border ${gradeStyles[email.grade || "Silver"] || ""}`}
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
                          <div className="py-3 px-2 space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground text-xs block mb-0.5">Phone</span>
                                <span className="font-medium">{email.clientPhone || "Not provided"}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground text-xs block mb-0.5">Source</span>
                                <span className="font-medium">{email.source || "Not specified"}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground text-xs block mb-0.5">Subject</span>
                                <span className="font-medium">{email.subject || "No subject"}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground text-xs block mb-0.5">Received</span>
                                <span className="font-medium">{format(new Date(email.receivedAt), "PPpp")}</span>
                              </div>
                            </div>
                            {email.body && (
                              <div>
                                <span className="text-muted-foreground text-xs block mb-1">Message</span>
                                <p className="text-sm bg-background rounded-lg p-3 border">{email.body}</p>
                              </div>
                            )}
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