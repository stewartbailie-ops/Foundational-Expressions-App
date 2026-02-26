import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";
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
  receivedAt: string;
  advisorName: string;
};

export default function CIV() {
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");

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
      e.advisorName.toLowerCase().includes(search.toLowerCase());
    const matchGrade = gradeFilter === "all" || (e.grade || "").toLowerCase() === gradeFilter;
    return matchSearch && matchGrade;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Client Information Viewer</h2>
          <p className="text-muted-foreground text-sm mt-1">Sort, organize, and grade all emails received from advisor apps.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-[280px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients, emails..."
              className="pl-8 bg-background border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-civ"
            />
          </div>
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-[140px] bg-background border-border" data-testid="select-grade-filter">
              <SelectValue placeholder="Grade Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              <SelectItem value="a">Grade A</SelectItem>
              <SelectItem value="b">Grade B</SelectItem>
              <SelectItem value="c">Grade C</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Target Advisor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {emails.length === 0 ? "No emails received yet." : "No emails match your filters."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((email) => (
                  <TableRow key={email.id} className="border-border hover:bg-muted/50 transition-colors" data-testid={`row-email-${email.id}`}>
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
                    <TableCell>
                      <Select
                        value={email.grade || "B"}
                        onValueChange={(grade) => gradeMutation.mutate({ id: email.id, grade })}
                      >
                        <SelectTrigger className="w-[80px] h-8 text-xs border-border bg-background" data-testid={`select-grade-${email.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">Grade A</SelectItem>
                          <SelectItem value="B">Grade B</SelectItem>
                          <SelectItem value="C">Grade C</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}