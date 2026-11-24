import { lireErreur } from "./integrationService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";
const DELAI_IMPORT_MS = 120000;

export const lingeImportService = {
  getAImporter: async ({ q = "", page = 1, pageSize = 50 } = {}) => {
    const params = new URLSearchParams({ q, page, pageSize });
    const response = await fetch(`${API_URL}/api/linges/lingesAimporter?${params}`);
    if (!response.ok) throw new Error(await lireErreur(response, "Erreur chargement des linges CUBIX"));
    return response.json();
  },

  importer: async (ids) => {
    const controleur = new AbortController();
    const minuteur = setTimeout(() => controleur.abort(), DELAI_IMPORT_MS);
    try {
      const response = await fetch(`${API_URL}/api/linges/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids),
        signal: controleur.signal,
      });
      if (!response.ok) throw new Error(await lireErreur(response, "Erreur import des linges"));
      return await response.json();
    } catch (err) {
      if (err.name === "AbortError") throw new Error("Délai dépassé : l'import a pris plus de 120 secondes.");
      throw err;
    } finally {
      clearTimeout(minuteur);
    }
  },
};
