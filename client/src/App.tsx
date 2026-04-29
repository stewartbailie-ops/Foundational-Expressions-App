import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout/AppLayout";
import AdvisorProfile from "@/pages/AdvisorProfile";
import CallbackForm from "@/pages/CallbackForm";
import ReferralForm from "@/pages/ReferralForm";
import WillForm from "@/pages/WillForm";
import Login from "@/pages/Login";
import { Loader2 } from "lucide-react";

// Admin / authenticated pages — lazy-loaded so public visitors don't pay for them
const HomePage = lazy(() => import("@/pages/HomePage"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const CIV = lazy(() => import("@/pages/CIV"));
const ManageAdvisors = lazy(() => import("@/pages/ManageAdvisors"));
const CreateAdvisor = lazy(() => import("@/pages/CreateAdvisor"));
const EditAdvisor = lazy(() => import("@/pages/EditAdvisor"));
// Less-trafficked public pages
const AdvisorPanel = lazy(() => import("@/pages/AdvisorPanel"));
const LegalPage = lazy(() => import("@/pages/LegalPage"));

function PageFallback() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-white/30" />
    </div>
  );
}

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
    <Suspense fallback={<PageFallback />}>
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
    </Suspense>
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