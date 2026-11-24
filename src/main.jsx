import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { applySavedTheme } from "./utils/theme";

import { chargerEstablishment } from "./services/establishmentService";
import { installerSessionGuard } from "./services/sessionGuard";

installerSessionGuard();
applySavedTheme();
chargerEstablishment();
import { NotificationProvider } from "./contextes/NotificationContext.jsx";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
  
  
  
  <NotificationProvider>
  <App />
  
  </NotificationProvider>);
}