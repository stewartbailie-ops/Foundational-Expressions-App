import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import FoundationalCallback from "@/pages/FoundationalCallback";
import FoundationalControl from "@/pages/FoundationalControl";
import FoundationalProfile from "@/pages/FoundationalProfile";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/control/:section?" component={FoundationalControl} />
        <Route path="/request-callback" component={FoundationalCallback} />
        <Route path="/erika/request-callback" component={FoundationalCallback} />
        <Route path="/erika" component={FoundationalProfile} />
        <Route path="/" component={FoundationalProfile} />
        <Route component={FoundationalProfile} />
      </Switch>
    </QueryClientProvider>
  );
}

export default App;
