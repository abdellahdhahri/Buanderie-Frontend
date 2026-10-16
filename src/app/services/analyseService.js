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
