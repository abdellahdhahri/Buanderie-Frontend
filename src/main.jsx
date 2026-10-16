import { createRoot } from "react-dom/client";
import App from "./app/App.jsx";
import "./styles/index.css";
import { applySavedTheme } from "./app/utils/theme";

// Réapplique le thème clair/sombre choisi avant le premier rendu
applySavedTheme();
import { NotificationProvider } from "./app/contextes/NotificationContext.jsx";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
  
  
  
  <NotificationProvider>
  <App />
  
  </NotificationProvider>);
}