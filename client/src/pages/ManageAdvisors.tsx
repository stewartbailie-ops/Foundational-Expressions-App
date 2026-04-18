import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Plus, CreditCard, ExternalLink, Pencil, Copy, Check, Trash2, LayoutDashboard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Advisor } from "@shared/schema";

export default function ManageAdvisors() {
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: advisors = [], isLoading } = useQuery<Advisor[]>({
    queryKey: ["/api/advisors"],
  });

  const { data: profileCounts = {} } = useQuery<Record<number, number>>({
    queryKey: ["/api/advisors/profile-counts"],
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      await apiRequest("PATCH", `/api/advisors/${id}/toggle`, { active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advisors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/advisors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advisors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Advisor Deleted", description: "The advisor profile has been permanently removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleDelete = (advisor: Advisor) => {
    if (window.confirm(`Are you sure you want to permanently delete ${advisor.name}'s profile? This action cannot be undone.`)) {
      deleteMutation.mutate(advisor.id);
    }
  };

  const activeCount = advisors.filter((a) => a.active).length;
  const filtered = advisors.filter(
    (a) =>
      search === "" ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase())
  );

  const copyLink = async (advisor: Advisor) => {
    const url = `${window.location.origin}/advisor/${advisor.profileSlug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(advisor.id);
      toast({ title: "Control Panel Link Copied", description: `Panel link for ${advisor.name} copied. Send this to the advisor.` });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({ title: "Copy Failed", description: url, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manage Advisors</h2>
          <p className="text-muted-foreground text-sm mt-1">View, edit, and control access for all active advisor applications.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/create">
            <Button
              className="gap-2 bg-white text-black hover:bg-white/90"
              data-testid="button-new-advisor"
            >
              <Plus className="h-4 w-4" />
              New Advisor
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-transparent" style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "#ffffff" }}>
          <CardContent className="p-6">
            <div className="text-sm font-medium opacity-80 mb-1">Total Active Apps</div>
            <div className="text-3xl font-bold" data-testid="text-active-count">
              {activeCount} <span className="text-lg opacity-60 font-normal">/ {advisors.length} Total</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-transparent" style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "#ffffff" }}>
          <CardContent className="p-6">
            <div className="text-sm font-medium opacity-80 mb-1">Total Advisors</div>
            <div className="text-3xl font-bold" data-testid="text-total-advisors">{advisors.length}</div>
          </CardContent>
        </Card>
        <Card className="border-transparent" style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#ffffff" }}>
          <CardContent className="p-6 flex flex-col justify-center h-full relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity">
              <CreditCard className="h-16 w-16" />
            </div>
            <div className="text-sm font-medium opacity-80 mb-1 z-10">Subscription Service</div>
            <div className="text-base font-bold z-10">Coming Soon</div>
            <p className="text-xs opacity-70 mt-2 z-10">Monthly fee management will be added here in a future update.</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-2 mt-8">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search advisors by name or email..."
            className="pl-8 border-0 placeholder:text-white/40 text-white"
            style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-advisors"
          />
        </div>
      </div>

      <Card className="border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Advisor Profile</TableHead>
                <TableHead>Custom Email</TableHead>
                <TableHead>Entity Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions <span className="text-xs font-normal text-muted-foreground ml-1">(Edit · Panel · Profile · Copy · Delete)</span></TableHead>
                <TableHead className="text-right">Active</TableHead>
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
                    {advisors.length === 0 ? "No advisors configured yet." : "No advisors match your search."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((advisor) => (
                  <TableRow key={advisor.id} className="border-border" data-testid={`row-advisor-${advisor.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-xs shrink-0">
                          {advisor.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{advisor.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {1 + (profileCounts[advisor.id] || 0)} profile{(1 + (profileCounts[advisor.id] || 0)) !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{advisor.email}</TableCell>
                    <TableCell className="text-sm capitalize">{advisor.entityType}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          advisor.active
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {advisor.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link href={`/edit/${advisor.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit Profile" data-testid={`button-edit-${advisor.id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <a href={`/advisor/${advisor.profileSlug}`} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/10" title="Advisor Control Panel" data-testid={`button-panel-${advisor.id}`}>
                            <LayoutDashboard className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                        <a href={`/${advisor.profileSlug}`} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Public Profile" data-testid={`button-view-${advisor.id}`}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Copy Profile Link"
                          onClick={() => copyLink(advisor)}
                          data-testid={`button-copy-${advisor.id}`}
                        >
                          {copiedId === advisor.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                          title="Delete Advisor"
                          onClick={() => handleDelete(advisor)}
                          data-testid={`button-delete-${advisor.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Switch
                        checked={advisor.active}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: advisor.id, active: checked })}
                        className="data-[state=checked]:bg-white data-[state=checked]:[&>span]:bg-black"
                        data-testid={`switch-advisor-${advisor.id}`}
                      />
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