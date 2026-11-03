import { Navigate } from "react-router-dom";
import { useCircuitInfecte } from "../../hooks/useEstablishment";

// Écran réservé aux établissements avec circuit infecté (redirige un hôtel vers l'accueil)
export function SiCircuitInfecte({ children }) {
  return useCircuitInfecte() ? children : <Navigate to="/" replace />;
}
