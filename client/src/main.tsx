import "@fontsource-variable/inter";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Register the (non-caching) service worker so the app is installable on
// Android/Chrome. Registered after load so it never blocks first paint, and
// swallows errors so an unsupported browser is a no-op.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
