import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Plus, CreditCard, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

const advisors = [
  { id: 1, name: "Sarah Jenkins", email: "sarah@advisorconnect.com", status: "Active", clients: 124, lastLogin: "2 hours ago" },
  { id: 2, name: "Michael Chang", email: "michael@advisorconnect.com", status: "Active", clients: 89, lastLogin: "1 day ago" },
  { id: 3, name: "Emma Watson", email: "emma@advisorconnect.com", status: "Inactive", clients: 45, lastLogin: "2 weeks ago" },
  { id: 4, name: "David Roberts", email: "david@advisorconnect.com", status: "Active", clients: 210, lastLogin: "5 mins ago" },
];

export default function ManageAdvisors() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manage Advisors</h2>
          <p className="text-muted-foreground text-sm mt-1">View, edit, and control access for all active advisor applications.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Advisor
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary text-primary-foreground border-transparent">
          <CardContent className="p-6">
            <div className="text-sm font-medium opacity-80 mb-1">Total Active Apps</div>
            <div className="text-3xl font-bold">3 <span className="text-lg opacity-60 font-normal">/ 4 Total</span></div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-1">Total Clients Managed</div>
            <div className="text-3xl font-bold">468</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-muted/30">
          <CardContent className="p-6 flex flex-col justify-center h-full relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <CreditCard className="h-16 w-16" />
            </div>
            <div className="text-sm font-medium text-muted-foreground mb-1 z-10">Subscription Service</div>
            <div className="text-sm font-semibold z-10">Coming Soon</div>
            <p className="text-xs text-muted-foreground mt-2 z-10">Monthly fee management will be added here in a future update.</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-2 mt-8">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search advisors by name or email..." className="pl-8 bg-background border-border" />
        </div>
      </div>

      <Card className="border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Advisor Profile</TableHead>
                <TableHead>Custom Email</TableHead>
                <TableHead>Clients</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Active</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advisors.map((advisor) => (
                <TableRow key={advisor.id} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-xs">
                        {advisor.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="font-medium text-sm">{advisor.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{advisor.email}</TableCell>
                  <TableCell className="font-medium">{advisor.clients}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{advisor.lastLogin}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={advisor.status === "Active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted text-muted-foreground"}>
                      {advisor.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch checked={advisor.status === "Active"} className="data-[state=checked]:bg-primary" />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}