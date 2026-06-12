import React, { lazy, Suspense } from "react";
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
const BookOfLifePage = lazy(() => import("@/pages/BookOfLifePage"));
const BookOfLifeCard = lazy(() => import("@/pages/BookOfLifeCard"));
// Org admin
const OrgLogin = lazy(() => import("@/pages/OrgLogin"));
const OrgDashboard = lazy(() => import("@/pages/OrgDashboard"));

function PageFallback() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-white/30" />
    </div>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const [confirmed, setConfirmed] = React.useState(false);
  const { data, isLoading, refetch } = useQuery<{ authenticated: boolean; adminEmail: string | null }>({
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
    return <Login onLogin={() => { setConfirmed(true); refetch(); }} />;
  }

  if (!confirmed) {
    const handleSignOut = async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      refetch();
    };
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <img src="/logo/icon-192.png" alt="Advisory Connect" width={56} height={56} className="mx-auto h-14 w-14" />
          <div>
            <h1 className="text-xl font-bold text-white">Welcome back</h1>
            {data.adminEmail && (
              <p className="text-white/50 text-sm mt-1">{data.adminEmail}</p>
            )}
          </div>
          <div className="space-y-3">
            <button
              onClick={() => setConfirmed(true)}
              className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all"
            >
              Continue to Dashboard
            </button>
            <button
              onClick={handleSignOut}
              className="w-full py-3 rounded-xl text-white/50 text-sm hover:text-white/80 transition-colors"
            >
              Sign in as a different user
            </button>
          </div>
        </div>
      </div>
    );
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

const RESERVED_PATHS = ["stats", "civ", "manage", "create", "edit", "profile", "api", "uploads", "advisor", "privacy-policy", "terms", "org"];

function Router() {
  return (
    <Suspense fallback={<PageFallback />}>
    <Switch>
      <Route path="/org/login" component={OrgLogin} />
      <Route path="/org/dashboard" component={OrgDashboard} />
      <Route path="/bol/:token/card" component={BookOfLifeCard} />
      <Route path="/bol/:token" component={BookOfLifePage} />
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