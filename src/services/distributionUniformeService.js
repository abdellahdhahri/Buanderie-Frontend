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
 * Récupère l'agent depuis localStorage (clé 'auth')
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
  return !!getAgentFromStorage();
};

/**
 * Récupère un agent par son code
 */
export const fetchAgentByCode = async (code) => {
  const token = getTokenFromStorage();
  const response = await fetch(
    `${API_URL}/api/personnel/code/${encodeURIComponent(code)}`,
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
 * Récupère les uniformes d'un personnel
 */
export const fetchUniformesPersonnel = async (codeBadge, matriculeAgent) => {
  const token = getTokenFromStorage();
  const url = `${API_URL}/api/distribution/uniforme?codeBadge=${encodeURIComponent(codeBadge)}&matriculeAgent=${encodeURIComponent(matriculeAgent)}`;
  console.log("📡 Appel API personnel:", url);

  const response = await fetch(url, {
    method: "GET",
    headers: {
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
 * Distribue un uniforme à un personnel
 */
export const distribuerUniforme = async (porteurId, porteurNom, codeOuTag, matriculeAgent) => {
  const token = getTokenFromStorage();
  const url = `${API_URL}/api/distribution/uniforme?porteurId=${porteurId}&porteurNom=${encodeURIComponent(porteurNom)}&codeOuTag=${encodeURIComponent(codeOuTag)}&matriculeAgent=${encodeURIComponent(matriculeAgent)}`;
  console.log("📡 Appel API distribution:", url);

  const response = await fetch(url, {
    method: "POST",
    headers: {
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