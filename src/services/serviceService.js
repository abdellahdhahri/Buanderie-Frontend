import { lireErreur } from "./integrationService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

async function requete(chemin, options, fallback) {
  const response = await fetch(`${API_URL}${chemin}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) throw new Error(await lireErreur(response, fallback));
  return response.status === 204 ? null : response.json().catch(() => null);
}

const json = (method, body) => ({ method, body: JSON.stringify(body) });
const liste = (data) => (Array.isArray(data) ? data : data?.content || []);

// Services hospitaliers ; un service importé (source EXTERNE) est alimenté par l'intégration
export const serviceService = {
  getAll: (tous = false) =>
    requete(`/api/services${tous ? "?tous=true" : ""}`, {}, "Erreur chargement des services").then(liste),

  create: (data) => requete("/api/services", json("POST", data), "Erreur création du service"),

  update: (id, data) => requete(`/api/services/${id}`, json("PUT", data), `Erreur mise à jour du service ${id}`),

  desactiver: (id) => requete(`/api/services/${id}`, { method: "DELETE" }, `Erreur désactivation du service ${id}`),

  getChambres: () => requete("/api/chambres", {}, "Erreur chargement des chambres").then(liste),
};
