const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

/**
 * Normalise les données d'un agent
 */
export const normalizeAgent = (agentData) => {
  // On tente plusieurs noms de clés possibles pour l'ID numérique
  const resolvedId =
    agentData.idPersonnel ??
    agentData.personnelId ??
    agentData.codePersonnel ??
    agentData.id ??
    null;

  if (resolvedId === null || resolvedId === undefined) {
    console.warn(
      "⚠️ Aucun champ ID reconnu dans la réponse agent. Clés disponibles :",
      Object.keys(agentData)
    );
  }

  const nom = agentData.nom ?? "";
  const prenom = agentData.prenom ?? "";
  const codeBarre = agentData.codeBarre;
  const matricule = agentData.matricule;
  const nomPrenom = agentData.nomPrenom ?? [prenom, nom].filter(Boolean).join(" ");

  return {
    matricule: codeBarre || matricule,
    nom: nom || nomPrenom || "Inconnu",
    prenom,
    nomPrenom: nomPrenom || nom || "Inconnu",
    codeBarre: codeBarre || matricule,
    id: resolvedId,
    poste: agentData.poste || agentData.fonction || "AGENT_REMISE"
  };
};

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
 * Récupère un agent par son code
 */
export const fetchAgentByMatricule = async (code) => {
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
  console.log("🔍 Réponse brute personnel:", data);
  return normalizeAgent(data);
};

/**
 * Message d'erreur du backend tel quel (JSON message/error/erreur, ou texte brut)
 */
const lireErreur = async (response) => {
  const errorText = await response.text();
  try {
    const json = JSON.parse(errorText);
    return json.message || json.error || json.erreur || errorText || `Erreur ${response.status}`;
  } catch {
    return errorText || `Erreur ${response.status}`;
  }
};

/**
 * Aperçu avant création : collectes non clôturées de l'agent de collecte,
 * reste à remettre par service et par collecte (de la plus ancienne à la plus récente)
 */
export const fetchCollectesNonCloturees = async (personnelId) => {
  const token = getTokenFromStorage();
  const response = await fetch(
    `${API_URL}/api/remises-linge/agent/${personnelId}/collectes-non-cloturees`,
    { headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) } }
  );
  if (!response.ok) {
    throw new Error(await lireErreur(response));
  }
  const data = await response.json();
  return {
    personnelId: data?.personnelId ?? personnelId,
    nbCollectes: data?.nbCollectes ?? (data?.collectes || []).length,
    services: Array.isArray(data?.services) ? data.services : [],
    collectes: Array.isArray(data?.collectes) ? data.collectes : [],
  };
};

/**
 * Détail d'une remise (items par catégorie, état)
 */
export const fetchRemiseById = async (remiseId) => {
  const token = getTokenFromStorage();
  const response = await fetch(`${API_URL}/api/remises-linge/${remiseId}`, {
    headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
  });
  if (!response.ok) {
    throw new Error(await lireErreur(response));
  }
  return response.json();
};

/**
 * Crée une nouvelle remise
 * serviceId : uniquement si l'agent a des collectes ouvertes sur plusieurs services
 */
export const createRemise = async (matriculeAgentRemise, id, serviceId = null) => {
  if (id === undefined || id === null) {
    throw new Error(
      "Impossible de créer la remise : l'ID de l'agent collecte est manquant. " +
      "Vérifie le champ ID renvoyé par /api/personnel/code/{code}."
    );
  }

  const token = getTokenFromStorage();

  const url = `${API_URL}/api/remises-linge?matriculeAgentRemise=${encodeURIComponent(matriculeAgentRemise)}&id=${id}`
    + (serviceId != null ? `&serviceId=${serviceId}` : "");
  console.log("📡 Appel API création remise:", url);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) {
    throw new Error(await lireErreur(response));
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
    throw new Error(await lireErreur(response));
  }

  return response.json();
};

/**
 * Annule la remise d'un linge scanné par erreur (réponse = item de sa catégorie)
 */
export const annulerLingeRemise = async (remiseId, codeBarre) => {
  const token = getTokenFromStorage();
  const response = await fetch(
    `${API_URL}/api/remises-linge/${remiseId}/annuler-linge?codeBarre=${encodeURIComponent(codeBarre)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }
  );

  if (!response.ok) {
    throw new Error(await lireErreur(response));
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