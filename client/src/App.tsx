import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout/AppLayout";
import HomePage from "@/pages/HomePage";
import Dashboard from "@/pages/Dashboard";
import CIV from "@/pages/CIV";
import ManageAdvisors from "@/pages/ManageAdvisors";
import CreateAdvisor from "@/pages/CreateAdvisor";
import EditAdvisor from "@/pages/EditAdvisor";
import AdvisorProfile from "@/pages/AdvisorProfile";
import CallbackForm from "@/pages/CallbackForm";
import ReferralForm from "@/pages/ReferralForm";
import Login from "@/pages/Login";
import { Loader2 } from "lucide-react";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { data, isLoading, refetch } = useQuery<{ authenticated: boolean }>({
    queryKey: ["/api/auth/session"],
    staleTime: Infinity,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-white/30" />
      </div>
    );
  }

  if (!data?.authenticated) {
    return <Login onLogin={() => refetch()} />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/profile/:slug/request-callback" component={CallbackForm} />
      <Route path="/profile/:slug/referrals" component={ReferralForm} />
      <Route path="/profile/:slug" component={AdvisorProfile} />
      <Route>
        <AuthGate>
          <AppLayout>
            <Switch>
              <Route path="/" component={HomePage}/>
              <Route path="/stats" component={Dashboard}/>
              <Route path="/civ" component={CIV}/>
              <Route path="/manage" component={ManageAdvisors}/>
              <Route path="/create" component={CreateAdvisor}/>
            <Route path="/edit/:id" component={EditAdvisor}/>
              <Route component={NotFound} />
            </Switch>
          </AppLayout>
        </AuthGate>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;