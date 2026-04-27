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
import AdvisorPanel from "@/pages/AdvisorPanel";
import WillForm from "@/pages/WillForm";
import Login from "@/pages/Login";
import LegalPage from "@/pages/LegalPage";
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

function SlugProfile() {
  return <AdvisorProfile />;
}
function SlugCallback() {
  return <CallbackForm />;
}
function SlugReferral() {
  return <ReferralForm />;
}
function SlugWill() {
  return <WillForm />;
}

const RESERVED_PATHS = ["stats", "civ", "manage", "create", "edit", "profile", "api", "uploads", "advisor", "privacy-policy", "terms"];

function Router() {
  return (
    <Switch>
      <Route path="/privacy-policy">{() => <LegalPage section="privacy" />}</Route>
      <Route path="/terms">{() => <LegalPage section="terms" />}</Route>
      <Route path="/advisor/:slug" component={AdvisorPanel} />
      <Route path="/profile/:slug/request-callback" component={CallbackForm} />
      <Route path="/profile/:slug/referrals" component={ReferralForm} />
      <Route path="/profile/:slug/claim-will" component={WillForm} />
      <Route path="/profile/:slug" component={AdvisorProfile} />
      <Route path="/:slug/request-callback" component={SlugCallback} />
      <Route path="/:slug/referrals" component={SlugReferral} />
      <Route path="/:slug/claim-will" component={SlugWill} />
      <Route path="/:slug">
        {(params) => {
          if (RESERVED_PATHS.includes(params.slug)) {
            return (
              <AuthGate>
                <AppLayout>
                  <Switch>
                    <Route path="/stats" component={Dashboard}/>
                    <Route path="/civ" component={CIV}/>
                    <Route path="/manage" component={ManageAdvisors}/>
                    <Route path="/create" component={CreateAdvisor}/>
                    <Route path="/edit/:id" component={EditAdvisor}/>
                    <Route component={NotFound} />
                  </Switch>
                </AppLayout>
              </AuthGate>
            );
          }
          return <AdvisorProfile />;
        }}
      </Route>
      <Route path="/">
        <AuthGate>
          <AppLayout>
            <HomePage />
          </AppLayout>
        </AuthGate>
      </Route>
      <Route>
        <AuthGate>
          <AppLayout>
            <Switch>
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