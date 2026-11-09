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

export const arsenalService = {
  getAll: (tous = false) =>
    requete(`/api/Arsenals${tous ? "?tous=true" : ""}`, {}, "Erreur chargement des arsenaux"),

  create: (data) => requete("/api/Arsenals", json("POST", data), "Erreur création arsenal"),

  update: (id, data) => requete(`/api/Arsenals/${id}`, json("PUT", data), `Erreur mise à jour arsenal ${id}`),

  desactiver: (id) => requete(`/api/Arsenals/${id}`, { method: "DELETE" }, `Erreur désactivation arsenal ${id}`),

  getEmplacements: (arsenalId, tous = false) => emplacementService.getByArsenal(arsenalId, tous),

  getLinges: (arsenalId) =>
    requete(`/api/Arsenals/arsenals/${arsenalId}/linges`, {}, "Erreur chargement des linges de l'arsenal"),
};

export const emplacementService = {
  getByArsenal: (arsenalId, tous = false) =>
    requete(`/api/emplacements?arsenalId=${encodeURIComponent(arsenalId)}${tous ? "&tous=true" : ""}`, {}, "Erreur chargement des emplacements"),

  get: (id) => requete(`/api/emplacements/${id}`, {}, `Erreur chargement emplacement ${id}`),

  getByCode: (codeBarre) =>
    requete(`/api/emplacements/code/${encodeURIComponent(codeBarre)}`, {}, "Emplacement introuvable"),

  getByCle: (cle) =>
    requete(`/api/emplacements/cle/${encodeURIComponent(cle)}`, {}, "Emplacement introuvable"),

  create: ({ arsenalId, nom, numero, codeBarre }) =>
    requete("/api/emplacements", json("POST", { arsenalId, nom, numero, codeBarre }), "Erreur création emplacement"),

  update: (id, data) => requete(`/api/emplacements/${id}`, json("PUT", data), `Erreur mise à jour emplacement ${id}`),

  desactiver: (id) => requete(`/api/emplacements/${id}`, { method: "DELETE" }, `Erreur désactivation emplacement ${id}`),
};

export async function getServices() {
  const response = await fetch(`${API_URL}/api/services`);
  if (!response.ok) throw new Error(await lireErreur(response, "Erreur chargement des services"));
  const data = await response.json();
  return Array.isArray(data) ? data : data?.content || [];
}
