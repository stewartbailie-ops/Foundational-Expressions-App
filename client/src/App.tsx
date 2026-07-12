import { Route, Switch } from "wouter";
import FoundationalCallback from "@/pages/FoundationalCallback";
import FoundationalProfile from "@/pages/FoundationalProfile";

function App() {
  return (
    <Switch>
      <Route path="/request-callback" component={FoundationalCallback} />
      <Route path="/erica/request-callback" component={FoundationalCallback} />
      <Route path="/erica" component={FoundationalProfile} />
      <Route path="/" component={FoundationalProfile} />
      <Route component={FoundationalProfile} />
    </Switch>
  );
}

export default App;
