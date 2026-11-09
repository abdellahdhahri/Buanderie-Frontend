import { lireErreur } from "../integrationService";
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
 * Récupère la liste de toutes les étapes
 */
export const fetchEtapes = async () => {
  const token = getTokenFromStorage();
  const response = await fetch(`${API_URL}/api/linge-etapes`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!response.ok) {
    throw new Error(await lireErreur(response, "Erreur lors de la récupération des étapes"));
  }
  return response.json();
};

/**
 * Récupère une étape par son ID
 */
export const fetchEtapeById = async (id) => {
  const token = getTokenFromStorage();
  const response = await fetch(`${API_URL}/api/linge-etapes/${id}`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!response.ok) {
    throw new Error(await lireErreur(response, `Erreur lors de la récupération de l'étape ${id}`));
  }
  return response.json();
};

/**
 * Récupère une étape par son code barre
 */
export const fetchEtapeByCodeBarre = async (codeBarre) => {
  const token = getTokenFromStorage();
  const response = await fetch(`${API_URL}/api/linge-etapes/code/${encodeURIComponent(codeBarre)}`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!response.ok) {
    throw new Error(await lireErreur(response, `Étape [${codeBarre}] introuvable`));
  }
  return response.json();
};

/**
 * Crée une nouvelle étape
 */
export const createEtape = async (data) => {
  const token = getTokenFromStorage();
  const response = await fetch(`${API_URL}/api/linge-etapes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const text = await response.text();
    let msg = text;
    try { msg = JSON.parse(text).message || text; } catch {}
    throw new Error(msg);
  }
  return response.json();
};

/**
 * Met à jour une étape
 */
export const updateEtape = async (id, data) => {
  const token = getTokenFromStorage();
  const response = await fetch(`${API_URL}/api/linge-etapes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const text = await response.text();
    let msg = text;
    try { msg = JSON.parse(text).message || text; } catch {}
    throw new Error(msg);
  }
  return response.json();
};

/**
 * Supprime une étape
 */
export const deleteEtape = async (id) => {
  const token = getTokenFromStorage();
  const response = await fetch(`${API_URL}/api/linge-etapes/${id}`, {
    method: "DELETE",
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!response.ok) {
    const text = await response.text();
    let msg = text;
    try { msg = JSON.parse(text).message || text; } catch {}
    throw new Error(msg);
  }
  return response;
};

/**
 * Récupère les personnels associés à une étape
 */
export const fetchPersonnelsByEtape = async (lingeEtapeId) => {
  const token = getTokenFromStorage();
  const response = await fetch(
    `${API_URL}/api/personnel-linge-etapes/linge-etape/${lingeEtapeId}/personnels`,
    {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }
  );
  if (!response.ok) {
    throw new Error(await lireErreur(response, `Erreur lors de la récupération des personnels pour l'étape ${lingeEtapeId}`));
  }
  return response.json();
};

/**
 * Récupère toutes les associations Personnel-LingeEtape
 */
export const fetchAllAssociations = async () => {
  const token = getTokenFromStorage();
  const response = await fetch(`${API_URL}/api/personnel-linge-etapes`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!response.ok) {
    throw new Error(await lireErreur(response, "Erreur lors de la récupération des associations"));
  }
  return response.json();
};

/**
 * Crée une association Personnel-LingeEtape
 */
export const createAssociation = async (data) => {
  const token = getTokenFromStorage();
  const response = await fetch(`${API_URL}/api/personnel-linge-etapes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const text = await response.text();
    let msg = text;
    try { msg = JSON.parse(text).message || text; } catch {}
    throw new Error(msg);
  }
  return response.json();
};

/**
 * Supprime une association Personnel-LingeEtape
 */
export const deleteAssociation = async (id) => {
  const token = getTokenFromStorage();
  const response = await fetch(`${API_URL}/api/personnel-linge-etapes/${id}`, {
    method: "DELETE",
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!response.ok) {
    const text = await response.text();
    let msg = text;
    try { msg = JSON.parse(text).message || text; } catch {}
    throw new Error(msg);
  }
  return response;
};

/**
 * Vérifie si une association existe
 */
export const checkAssociationExists = async (personnelId, lingeEtapeId) => {
  const token = getTokenFromStorage();
  const response = await fetch(
    `${API_URL}/api/personnel-linge-etapes/exists?personnelId=${personnelId}&lingeEtapeId=${lingeEtapeId}`,
    {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }
  );
  if (!response.ok) {
    throw new Error(await lireErreur(response, "Erreur lors de la vérification de l'association"));
  }
  return response.json();
};

/**
 * Récupère un personnel par son code
 */
export const fetchPersonnelByCode = async (code) => {
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
    throw new Error(await lireErreur(response, `Personnel [${code}] introuvable`));
  }
  return response.json();
};