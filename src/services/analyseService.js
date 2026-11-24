import { apiFetch } from "./api";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

// Attributs contrôlés par l'analyse des linges incomplets (AnalyseLingesIncompletsService)
export const ATTRIBUTS_INCOMPLETS = ["POIDS", "DUREE_VIE", "CATEGORIE", "SERVICE", "DESIGNATION"];

/**
 * Linges dont au moins un attribut est manquant.
 * GET /api/analyse/linges-incomplets?attribut=POIDS&page=0&size=50
 * Réponse : { dateAnalyse, total, parAttribut, page, size, totalPages, linges: [...] }
 */
export async function fetchLingesIncomplets({ attribut, page = 0, size = 50 } = {}) {
  const params = new URLSearchParams({ page, size });
  if (attribut) params.append("attribut", attribut);
  const res = await fetch(`${API_URL}/api/analyse/linges-incomplets?${params.toString()}`);
  if (!res.ok) throw new Error(`Analyse des linges incomplets indisponible (${res.status})`);
  return res.json();
}

const BLOQUES = "/api/analyse/linges-bloques";

async function requeteBloques(endpoint, options = {}) {
  const res = await apiFetch(`${BLOQUES}${endpoint}`, options);
  const texte = await res.text();
  let data;
  try { data = texte ? JSON.parse(texte) : null; } catch { data = texte; }
  if (!res.ok) {
    const message = (data && typeof data === "object" && (data.message || data.erreur || data.error))
      || (typeof data === "string" && data)
      || `Analyse des linges bloqués indisponible (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export function fetchLingesBloques({ etat, serviceId, page = 0, size = 50 } = {}) {
  const params = new URLSearchParams({ page, size });
  if (etat) params.append("etat", etat);
  if (serviceId != null && serviceId !== "") params.append("serviceId", serviceId);
  return requeteBloques(`?${params.toString()}`);
}

export function analyserLingesBloques() {
  return requeteBloques("/analyser", { method: "POST" });
}

export async function fetchSeuilsBlocage() {
  const data = await requeteBloques("/seuils");
  return Array.isArray(data) ? data : [];
}

export function majSeuilBlocage(etat, { dureeMaxHeures, actif } = {}) {
  const corps = {};
  if (dureeMaxHeures != null) corps.dureeMaxHeures = dureeMaxHeures;
  if (actif != null) corps.actif = actif;
  return requeteBloques(`/seuils/${encodeURIComponent(etat)}`, { method: "PUT", body: JSON.stringify(corps) });
}
