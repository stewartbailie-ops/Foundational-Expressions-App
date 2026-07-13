import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import FoundationalCallback from "@/pages/FoundationalCallback";
import FoundationalProfile from "@/pages/FoundationalProfile";
import AdvisorPanel from "@/pages/AdvisorPanel";
import AdvisorProfile from "@/pages/AdvisorProfile";
import CallbackForm from "@/pages/CallbackForm";
import ReferralForm from "@/pages/ReferralForm";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Switch>
          <Route path="/control">{() => <AdvisorPanel forcedSlug="erika" />}</Route>
          <Route path="/advisor/:slug">{() => <AdvisorPanel />}</Route>
          <Route path="/request-callback" component={FoundationalCallback} />
          <Route path="/erika/request-callback" component={FoundationalCallback} />
          <Route path="/erika" component={FoundationalProfile} />
          <Route path="/:slug/request-callback" component={CallbackForm} />
          <Route path="/:slug/referrals" component={ReferralForm} />
          <Route path="/:slug" component={AdvisorProfile} />
          <Route path="/" component={FoundationalProfile} />
          <Route component={FoundationalProfile} />
        </Switch>
    </QueryClientProvider>
  );
}

export default App;
