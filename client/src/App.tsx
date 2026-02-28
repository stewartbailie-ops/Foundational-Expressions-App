import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout/AppLayout";
import HomePage from "@/pages/HomePage";
import Dashboard from "@/pages/Dashboard";
import CIV from "@/pages/CIV";
import ManageAdvisors from "@/pages/ManageAdvisors";
import CreateAdvisor from "@/pages/CreateAdvisor";
import AdvisorProfile from "@/pages/AdvisorProfile";
import CallbackForm from "@/pages/CallbackForm";
import ReferralForm from "@/pages/ReferralForm";

function Router() {
  return (
    <Switch>
      <Route path="/profile/:slug/request-callback" component={CallbackForm} />
      <Route path="/profile/:slug/referrals" component={ReferralForm} />
      <Route path="/profile/:slug" component={AdvisorProfile} />
      <Route>
        <AppLayout>
          <Switch>
            <Route path="/" component={HomePage}/>
            <Route path="/stats" component={Dashboard}/>
            <Route path="/civ" component={CIV}/>
            <Route path="/manage" component={ManageAdvisors}/>
            <Route path="/create" component={CreateAdvisor}/>
            <Route component={NotFound} />
          </Switch>
        </AppLayout>
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