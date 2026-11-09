import { getTokenFromStorage } from "./remiseLingeService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

/**
 */
export const fetchStatistiquesPersonnel = async (debut, fin) => {
  const token = getTokenFromStorage();
  const params = new URLSearchParams();
  if (debut) params.append("debut", debut);
  if (fin) params.append("fin", fin);

  const response = await fetch(
    `${API_URL}/api/statistiques/personnel?${params.toString()}`,
    {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }
  );

  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des statistiques");
  }
  return response.json();
};

/**
 * Formate un intervalle de dates JS en LocalDateTime ISO pour l'API
 */
export const toApiDateTime = (date) => {
  if (!date) return null;
  return `${date}T00:00:00`;
};

/**
 * Emojis / labels pour les types d'opération (adapte selon ton enum TypeOperation)
 */
export const getTypeOperationInfo = (type) => {
  const infos = {
    COLLECTE: { label: "Collecte", emoji: "📦", color: "#0ea5e9" },
    LIVRAISON: { label: "Livraison", emoji: "🚚", color: "#059669" },
    LAVAGE: { label: "Lavage", emoji: "🧺", color: "#8b5cf6" },
    SECHAGE: { label: "Séchage", emoji: "☀️", color: "#f59e0b" },
    STOCKAGE: { label: "Stockage", emoji: "🗄️", color: "#64748b" },
    RECEPTION: { label: "Réception", emoji: "📥", color: "#0d9488" },
  };
  return infos[type] || { label: type, emoji: "🔄", color: "#94a3b8" };
};