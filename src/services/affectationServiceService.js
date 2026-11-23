import { lireErreur } from "./integrationService";
import { getTokenFromStorage } from "./etape/etapeService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

const entetes = () => {
  const token = getTokenFromStorage();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const requete = async (chemin, options, fallback) => {
  const response = await fetch(`${API_URL}${chemin}`, { ...options, headers: { ...entetes(), ...(options?.headers || {}) } });
  if (!response.ok) throw new Error(await lireErreur(response, fallback));
  return response.status === 204 ? null : response.json().catch(() => null);
};

export const fetchAssociationsEtapes = () =>
  requete("/api/personnel-linge-etapes", {}, "Erreur chargement des affectations aux étapes");

export const fetchPersonnelFiche = (id) =>
  requete(`/api/personnel/${id}`, {}, `Erreur chargement du personnel ${id}`);

export const affecterService = (personnelId, serviceId) => {
  const query = serviceId ? `?serviceId=${encodeURIComponent(serviceId)}` : "";
  return requete(`/api/personnel/${personnelId}/service-affectation${query}`, { method: "PUT" }, "Erreur d'affectation du service");
};
