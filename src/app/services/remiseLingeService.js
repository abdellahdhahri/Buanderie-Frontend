const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

/**
 * Normalise les données d'un agent
 */
export const normalizeAgent = (agentData) => ({
  matricule: agentData.codeBarre || agentData.matricule,
  nom: agentData.nom || "Inconnu",
  prenom: agentData.prenom || "",
  nomPrenom: agentData.nomPrenom || `${agentData.prenom || ''} ${agentData.nom || ''}`.trim() || agentData.nom || "Inconnu",
  codeBarre: agentData.codeBarre || agentData.matricule,
  id: agentData.id,
  poste: agentData.poste || agentData.fonction || "AGENT_REMISE"
});

/**
 * Récupère un agent par son matricule
 */
export const fetchAgentByMatricule = async (matricule) => {
  const response = await fetch(`${API_URL}/api/agents/matricule/${encodeURIComponent(matricule)}`);
  if (!response.ok) {
    throw new Error(`Agent [${matricule}] introuvable`);
  }
  const data = await response.json();
  return normalizeAgent(data);
};

/**
 * Crée une nouvelle remise
 */
export const createRemise = async (matriculeAgentRemise, matriculeAgentCollecte) => {
  const response = await fetch(
    `${API_URL}/api/remises-linge?matriculeAgentRemise=${encodeURIComponent(matriculeAgentRemise)}&matriculeAgentCollecte=${encodeURIComponent(matriculeAgentCollecte)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" }
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
 * Récupère le statut d'une collecte
 */
export const fetchStatutCollecte = async (collecteId) => {
  const response = await fetch(`${API_URL}/api/remises-linge/collecte/${collecteId}/statut`);
  if (!response.ok) {
    throw new Error("Erreur lors de la récupération du statut");
  }
  return response.json();
};

/**
 * Récupère l'historique des remises d'une collecte
 */
export const fetchHistoriqueRemises = async (collecteId) => {
  const response = await fetch(`${API_URL}/api/remises-linge/collecte/${collecteId}`);
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
  const response = await fetch(
    `${API_URL}/api/remises-linge/${remiseId}/scanner?codeBarre=${encodeURIComponent(codeBarre)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" }
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
    COMPLETEE: { bg: "#f0fdf4", text: "#15803d", icon: "✅", label: "Complétée" },
    PARTIELLE: { bg: "#fffbeb", text: "#d97706", icon: "⏳", label: "Partielle" },
    EN_COURS: { bg: "#eff6ff", text: "#1d4ed8", icon: "🔄", label: "En cours" },
    CLOTUREE: { bg: "#f0fdf4", text: "#15803d", icon: "🏁", label: "Clôturée" }
  };
  return configs[etat] || { bg: "#f1f5f9", text: "#64748b", icon: "📦", label: etat || '—' };
};