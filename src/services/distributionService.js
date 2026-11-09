// services/distributionService.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

/**
 * Normalise les données d'un agent
 */
export const normalizeAgent = (agentData) => ({
  matricule: agentData.codeBarre || agentData.matricule,
  nom: agentData.nom || agentData.nomPrenom || "Inconnu",
  prenom: agentData.prenom || "",
  nomPrenom: agentData.nomPrenom || agentData.nom || "Inconnu",
  codeBarre: agentData.codeBarre || agentData.matricule,
  id: agentData.id,
  login: agentData.login,
  poste: agentData.poste || agentData.fonction || "AGENT_DISTRIBUTION"
});

/**
 * Récupère l'agent depuis localStorage
 * Structure: auth = { agent: { ... } }
 */
export const getAgentFromStorage = () => {
  try {
    const authData = localStorage.getItem('auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed.agent && (parsed.agent.codeBarre || parsed.agent.matricule || parsed.agent.id)) {
          console.log("✅ Agent trouvé dans localStorage sous la clé 'auth'");
          return normalizeAgent(parsed.agent);
        }
      } catch {}
    }

    const directAgent = localStorage.getItem('agent');
    if (directAgent) {
      try {
        const parsed = JSON.parse(directAgent);
        if (parsed.codeBarre || parsed.matricule || parsed.id) {
          console.log("✅ Agent trouvé dans localStorage sous la clé 'agent'");
          return normalizeAgent(parsed);
        }
      } catch {}
    }

    console.warn("⚠️ Aucun agent trouvé dans le stockage");
    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'agent:", error);
    return null;
  }
};

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
 * Vérifie si un agent est connecté
 */
export const isAgentConnected = () => {
  const agent = getAgentFromStorage();
  return !!agent;
};

/**
 * Récupère un agent par son matricule
 */
export const fetchAgentByMatricule = async (matricule) => {
  const token = getTokenFromStorage();
  const response = await fetch(`${API_URL}/api/agents/matricule/${encodeURIComponent(matricule)}`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!response.ok) {
    throw new Error(`Agent [${matricule}] introuvable`);
  }
  const data = await response.json();
  return normalizeAgent(data);
};

/**
 * Récupère un service par sa référence
 */
export const fetchServiceByReference = async (reference) => {
  const token = getTokenFromStorage();
  const response = await fetch(`${API_URL}/api/services/ref/${encodeURIComponent(reference)}`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!response.ok) {
    throw new Error(`Service [${reference}] introuvable`);
  }
  return response.json();
};

/**
 * Crée une nouvelle distribution
 */
export const createDistribution = async (serviceId, matriculeAgent) => {
  const token = getTokenFromStorage();
  const response = await fetch(`${API_URL}/api/distributions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({
      serviceId: serviceId,
      matriculeAgent: matriculeAgent
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = errorText;
    try {
      const json = JSON.parse(errorText);
      errorMessage = json.message || json.error || errorText;
    } catch {}
    throw new Error(errorMessage);
  }

  return response.json();
};

/**
 * Récupère le comparatif d'une distribution
 */
export const fetchComparatifDistribution = async (distributionId) => {
  const token = getTokenFromStorage();
  const response = await fetch(`${API_URL}/api/distributions/${distributionId}/comparatif`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!response.ok) {
    throw new Error("Erreur lors de la récupération du comparatif");
  }
  return response.json();
};

/**
 * Scanne un article pour une distribution
 * ✅ Gère les réponses qui ne sont pas du JSON
 */
export const scanArticleForDistribution = async (distributionId, codeOuTag) => {
  const token = getTokenFromStorage();
  
  try {
    const response = await fetch(
      `${API_URL}/api/distributions/${distributionId}/scan?codeOuTag=${encodeURIComponent(codeOuTag)}`,
      {
        method: "POST",
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      }
    );

    // Lire la réponse comme texte d'abord
    const responseText = await response.text();
    console.log("📥 Réponse brute du scan:", responseText);

    // Si la réponse n'est pas OK, essayer d'extraire le message d'erreur
    if (!response.ok) {
      let errorMessage = responseText;
      try {
        // Essayer de parser comme JSON
        const json = JSON.parse(responseText);
        errorMessage = json.message || json.error || responseText;
      } catch {
        // Si ce n'est pas du JSON, utiliser le texte brut
        errorMessage = responseText || `Erreur ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    // Essayer de parser la réponse comme JSON
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      // Si la réponse n'est pas du JSON mais que le statut est OK, 
      // c'est peut-être un message de succès simple
      console.warn("⚠️ La réponse n'est pas du JSON valide:", responseText);
      
      // Retourner un objet avec le message
      return {
        success: true,
        message: responseText || "Article scanné avec succès",
        codeBarre: codeOuTag
      };
    }
  } catch (error) {
    console.error("❌ Erreur scan:", error);
    throw error;
  }
};

/**
 * Clôture une distribution
 */
export const cloturerDistribution = async (distributionId) => {
  const token = getTokenFromStorage();
  const response = await fetch(`${API_URL}/api/distributions/${distributionId}/cloturer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = errorText;
    try {
      const json = JSON.parse(errorText);
      errorMessage = json.message || json.error || errorText;
    } catch {}
    throw new Error(errorMessage);
  }

  return response.json();
};

/**
 * Calcule les statistiques d'une distribution
 */
export const calculerStats = (comparatif) => {
  const demande = comparatif.reduce((s, c) => s + Number(c.quantiteDemandee || 0), 0);
  const livree = comparatif.reduce((s, c) => s + Number(c.quantiteLivree || 0), 0);
  const reste = Math.max(0, demande - livree);
  const pct = demande > 0 ? Math.round((livree / demande) * 100) : 0;
  return { demande, livree, reste, pct };
};

/**
 * Vérifie si la distribution est terminée
 */
export const isDistributionComplete = (comparatif) => {
  const stats = calculerStats(comparatif);
  return stats.demande > 0 && stats.livree >= stats.demande;
};

/**
 * Catégories avec leurs emojis et couleurs
 */
export const CATEGORIES = {
  DRAP: { label: "Drap", emoji: "🛏️", color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
  TAIE_OREILLER: { label: "Taie Oreiller", emoji: "💤", color: "#ea580c", bg: "#ffedd5", border: "#fdba74" },
  SERVIETTE_BAIN: { label: "Serv. Bain", emoji: "🛁", color: "#d97706", bg: "#fef3c7", border: "#fcd34d" },
  SERVIETTE_VISAGE: { label: "Serv. Visage", emoji: "🧻", color: "#65a30d", bg: "#ecfccb", border: "#a3e635" },
  PEIGNOIR: { label: "Peignoir", emoji: "🥼", color: "#0891b2", bg: "#cffafe", border: "#67e8f9" },
  NAPPE: { label: "Nappe", emoji: "🍽️", color: "#7c3aed", bg: "#ede9fe", border: "#c4b5fd" },
  SERVIETTE_TABLE: { label: "Serv. Table", emoji: "🍴", color: "#be185d", bg: "#fce7f3", border: "#f9a8d4" },
  UNIFORME: { label: "Uniforme", emoji: "👔", color: "#0f766e", bg: "#ccfbf1", border: "#5eead4" },
  AUTRE: { label: "Autre", emoji: "📦", color: "#475569", bg: "#f1f5f9", border: "#cbd5e1" },
};

export const getCategorie = (id) => {
  return CATEGORIES[id] || { label: id, emoji: "📦", color: "#64748b", bg: "#f1f5f9", border: "#e2e8f0" };
};