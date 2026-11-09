import { lireErreur } from "./integrationService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

/**
 * Récupère le token depuis localStorage
 */
export const getTokenFromStorage = () => {
  try {
    const authData = localStorage.getItem('auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      return parsed.token || null;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Récupère la liste de toutes les collectes
 */
export const fetchCollectes = async () => {
  const token = getTokenFromStorage();
  const response = await fetch(`${API_URL}/api/collecte`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!response.ok) {
    throw new Error("Erreur lors du chargement des collectes");
  }
  return response.json();
};

/**
 * Récupère les détails d'une collecte
 */
export const fetchCollecteDetails = async (collecteId) => {
  const token = getTokenFromStorage();
  const response = await fetch(`${API_URL}/api/collecte/${collecteId}/resume`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!response.ok) {
    throw new Error("Erreur lors du chargement des détails");
  }
  return response.json();
};

export const ajouterLingesCollecte = async (collecteId, codesLinges) => {
  const token = getTokenFromStorage();
  const response = await fetch(`${API_URL}/api/collecte/${collecteId}/ajouter-linges`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ codesLinges }),
  });
  if (!response.ok) {
    throw new Error(await lireErreur(response, "Erreur lors de l'ajout des linges"));
  }
  const texte = await response.text();
  try { return texte ? JSON.parse(texte) : {}; } catch { return { message: texte }; }
};

/**
 * ✅ Récupère un personnel par son ID
 * GET /api/personnel/{id}
 */
export const fetchPersonnelById = async (personnelId) => {
  const token = getTokenFromStorage();
  const response = await fetch(`${API_URL}/api/personnel/${personnelId}`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!response.ok) {
    throw new Error(`Personnel [${personnelId}] introuvable`);
  }
  return response.json();
};

/**
 * ✅ Récupère plusieurs personnels par leurs IDs (appels parallèles)
 */
export const fetchPersonnelsByIds = async (personnelIds) => {
  const uniqueIds = [...new Set(personnelIds)].filter(id => id != null);
  if (uniqueIds.length === 0) return {};
  
  try {
    // Faire des appels parallèles pour chaque ID
    const promises = uniqueIds.map(id => 
      fetchPersonnelById(id).catch(() => null)
    );
    const results = await Promise.all(promises);
    
    // Construire l'objet cache { id: personnel }
    const personnelsMap = {};
    uniqueIds.forEach((id, index) => {
      if (results[index]) {
        personnelsMap[id] = results[index];
      }
    });
    return personnelsMap;
  } catch (error) {
    console.error("Erreur chargement personnels:", error);
    return {};
  }
};

/**
 * Récupère un service par son ID
 */
export const fetchServiceById = async (serviceId) => {
  const token = getTokenFromStorage();
  const response = await fetch(`${API_URL}/api/services/${serviceId}`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!response.ok) {
    return null;
  }
  return response.json();
};

/**
 * Formate une date
 */
export const formatDate = (dateString) => {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

/**
 * Récupère le badge de type de collecte
 */
export const getTypeBadgeConfig = (type) => {
  const typeColors = {
    BLANC: { variant: "success", label: " Blanc", emoji: "⬜" },
    INFECTE: { variant: "danger", label: " Infecté", emoji: "🔴" },
    MIXTE: { variant: "warning", label: " Mixte", emoji: "🟡" },
  };
  return typeColors[type] || { variant: "secondary", label: type || "N/A", emoji: "📦" };
};

/**
 * Récupère le badge d'état de collecte
 */
export const getEtatBadgeConfig = (etat) => {
  const etatColors = {
    EN_TRAITEMENT: { variant: "warning", label: "En traitement" },
    TERMINEE: { variant: "success", label: "Terminée" },
    CLOTUREE: { variant: "info", label: "Clôturée" },
    ANNULEE: { variant: "danger", label: "Annulée" },
  };
  return etatColors[etat] || { variant: "secondary", label: etat || "N/A" };
};