
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

/**
 * Normalise les données d'un agent
 */
export const normalizeAgent = (agentData) => ({
  matricule: agentData.codeBarre || agentData.matricule,
  nom: agentData.nom || "Inconnu",
  prenom: agentData.prenom || "",
  nomPrenom: agentData.nomPrenom || agentData.nom || "Inconnu",
  codeBarre: agentData.codeBarre || agentData.matricule,
  id: agentData.id,
  poste: agentData.poste || agentData.fonction || "AGENT_REMISE"
});

/**
 * Récupère l'agent depuis localStorage (clé 'auth')
 */
export const getAgentFromStorage = () => {
  try {
    const authData = localStorage.getItem('auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed.agent && (parsed.agent.codeBarre || parsed.agent.matricule || parsed.agent.id)) {
          console.log("  Agent trouvé dans localStorage sous la clé 'auth'");
          return normalizeAgent(parsed.agent);
        }
      } catch {}
    }

    const directAgent = localStorage.getItem('agent');
    if (directAgent) {
      try {
        const parsed = JSON.parse(directAgent);
        if (parsed.codeBarre || parsed.matricule || parsed.id) {
          console.log("  Agent trouvé dans localStorage sous la clé 'agent'");
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
  return !!getAgentFromStorage();
};

/**
 * Récupère un agent par son code (API SQL Server)
 */
export const fetchAgentByMatricule = async (code) => {
  const token = getTokenFromStorage();
  const response = await fetch(
    `${API_URL}/api/sqlserver/personnel/code/${encodeURIComponent(code)}?code=${encodeURIComponent(code)}`,
    {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }
  );
  if (!response.ok) {
    throw new Error(`Agent [${code}] introuvable`);
  }
  const data = await response.json();
  return normalizeAgent(data);
};

/**
 *   Crée une nouvelle remise - Correction
 */
export const createRemise = async (matriculeAgentRemise, id) => {
  const token = getTokenFromStorage();
  
  const url = `${API_URL}/api/remises-linge?matriculeAgentRemise=${encodeURIComponent(matriculeAgentRemise)}&id=${id}`;
  console.log("📡 Appel API création remise:", url);
  
  const response = await fetch(url, {
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
 * Récupère le statut d'une collecte
 */
export const fetchStatutCollecte = async (collecteId) => {
  const token = getTokenFromStorage();
  const response = await fetch(`${API_URL}/api/remises-linge/collecte/${collecteId}/statut`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!response.ok) {
    throw new Error("Erreur lors de la récupération du statut");
  }
  return response.json();
};

/**
 * Récupère l'historique des remises d'une collecte
 */
export const fetchHistoriqueRemises = async (collecteId) => {
  const token = getTokenFromStorage();
  const response = await fetch(`${API_URL}/api/remises-linge/collecte/${collecteId}`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!response.ok) {
    throw new Error("Erreur lors de la récupération de l'historique");
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

/**
 * Scanne un linge pour une remise
 */
export const scanLingeForRemise = async (remiseId, codeBarre) => {
  const token = getTokenFromStorage();
  const response = await fetch(
    `${API_URL}/api/remises-linge/${remiseId}/scanner?codeBarre=${encodeURIComponent(codeBarre)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }
  );

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
 * Vérifie si une collecte est clôturée
 */
export const isCollecteCloturee = (statut) => {
  return statut?.statut === "CLOTUREE" || statut?.totalRestant === 0;
};

/**
 * Formate les catégories avec leurs emojis
 */
export const getCategorieInfo = (categorie) => {
  const emojis = {
    'DRAP': '🛏️',
    'BLOUSE': '👔',
    'PANTALON': '👖',
    'SERVIETTE': '🧻',
    'TAIE': '🛌',
    'CHEMISE': '👔',
    'DRESSING': '🧥'
  };
  return {
    label: categorie,
    emoji: emojis[categorie] || '👕'
  };
};

/**
 * Formate la date pour l'affichage
 */
export const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
};

/**
 * Récupère la configuration de statut pour une remise
 */
export const getRemiseStatutConfig = (etat) => {
  const configs = {
    COMPLETEE: { bg: "#f0fdf4", text: "#15803d", icon: " ", label: "Complétée" },
    PARTIELLE: { bg: "#fffbeb", text: "#d97706", icon: "⏳", label: "Partielle" },
    EN_COURS: { bg: "#eff6ff", text: "#1d4ed8", icon: "🔄", label: "En cours" },
    CLOTUREE: { bg: "#f0fdf4", text: "#15803d", icon: "🏁", label: "Clôturée" }
  };
  return configs[etat] || { bg: "#f1f5f9", text: "#64748b", icon: "📦", label: etat || '—' };
};