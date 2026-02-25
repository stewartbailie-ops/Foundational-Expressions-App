import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Filter, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

const emails: any[] = [];

export default function CIV() {
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
            <Input placeholder="Search clients, emails..." className="pl-8 bg-background border-border" />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-[140px] bg-background border-border">
              <SelectValue placeholder="Grade Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              <SelectItem value="a">Grade A</SelectItem>
              <SelectItem value="b">Grade B</SelectItem>
              <SelectItem value="c">Grade C</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="border-border">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Target Advisor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No emails received yet.
                  </TableCell>
                </TableRow>
              ) : (
                emails.map((email) => (
                  <TableRow key={email.id} className="border-border cursor-pointer hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground">#{email.id}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{email.date}</TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{email.name}</div>
                      <div className="text-xs text-muted-foreground">{email.from}</div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{email.advisor}</TableCell>
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
                      <Select defaultValue={email.grade}>
                        <SelectTrigger className="w-[80px] h-8 text-xs border-border bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">Grade A</SelectItem>
                          <SelectItem value="B">Grade B</SelectItem>
                          <SelectItem value="C">Grade C</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
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