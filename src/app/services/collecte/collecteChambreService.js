const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

const getToken = () => {
  try {
    const authData = localStorage.getItem("auth");
    if (!authData) return null;
    const parsed = JSON.parse(authData);
    return parsed.token || null;
  } catch (error) {
    console.error("Erreur récupération token :", error);
    return null;
  }
};

const getHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (response) => {
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      (typeof data === "string" && data) ||
      `Erreur HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
};

export const fetchChambreByCode = async (code) => {
  if (!code) throw new Error("Code chambre obligatoire");
  const response = await fetch(
    `${API_URL}/api/sqlserver/chambres/code/${encodeURIComponent(code)}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );
  return handleResponse(response);
};

export const fetchAgentByCode = async (code) => {
  if (!code) throw new Error("Code agent obligatoire");
  const response = await fetch(
    `${API_URL}/api/sqlserver/personnel/code/${encodeURIComponent(code)}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );
  return handleResponse(response);
};

export const ouvrirCollecteChambre = async (codeBarre, matriculeAgent) => {
  const response = await fetch(
    `${API_URL}/api/collecte/chambre/ouvrir?codeBarre=${encodeURIComponent(codeBarre)}&matriculeAgent=${encodeURIComponent(matriculeAgent)}`,
    {
      method: "POST",
      headers: getHeaders(),
    }
  );
  return handleResponse(response);
};

export const traiterLitAvecBac = async (collecteId, litId, codeBac) => {
  if (!collecteId) throw new Error("Collecte obligatoire");
  if (!litId) throw new Error("Lit obligatoire");
  if (!codeBac) throw new Error("Code bac obligatoire");

  const response = await fetch(
    `${API_URL}/api/collecte/chambre/${collecteId}/lit?litId=${encodeURIComponent(litId)}&codeBac=${encodeURIComponent(codeBac)}`,
    {
      method: "POST",
      headers: getHeaders(),
    }
  );
  return handleResponse(response);
};

export const marquerLingePropre = async (collecteId, codeOuTag) => {
  if (!collecteId) throw new Error("Collecte obligatoire");
  if (!codeOuTag) throw new Error("Code linge obligatoire");

  const response = await fetch(
    `${API_URL}/api/collecte/chambre/${collecteId}/propre?codeOuTag=${encodeURIComponent(codeOuTag)}`,
    {
      method: "POST",
      headers: getHeaders(),
      // ✅ PAS DE BODY, tout est dans l'URL
    }
  );
  return handleResponse(response);
};

export const marquerLingeManquant = async (collecteId, lingeId) => {
  if (!collecteId) throw new Error("Collecte obligatoire");
  if (!lingeId) throw new Error("Linge obligatoire");

  const response = await fetch(
    `${API_URL}/api/collecte/chambre/${collecteId}/manquant?lingeId=${encodeURIComponent(lingeId)}`,
    {
      method: "POST",
      headers: getHeaders(),
    }
  );
  return handleResponse(response);
};

export const cloturerCollecte = async (collecteId) => {
  if (!collecteId) throw new Error("Collecte obligatoire");
  const response = await fetch(
    `${API_URL}/api/collecte/chambre/${collecteId}/cloturer`,
    {
      method: "POST",
      headers: getHeaders(),
    }
  );
  return handleResponse(response);
};