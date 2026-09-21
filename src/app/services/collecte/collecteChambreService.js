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

// ─── 1. Récupérer une chambre ──────────────────────────────────────────────
export const fetchChambreByCode = async (code) => {
  if (!code || !code.trim()) {
    throw new Error("Code chambre obligatoire");
  }

  const response = await fetch(
    `${API_URL}/api/sqlserver/chambres/code/${encodeURIComponent(code.trim())}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  return handleResponse(response);
};

// ─── 2. Récupérer un agent ─────────────────────────────────────────────────
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

// ─── 3. Ouvrir une collecte de chambre ─────────────────────────────────────
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

// ─── 4. Scanner un lit ─────────────────────────────────────────────────────
export const scannerLit = async (collecteId, litId) => {
  if (!collecteId) throw new Error("Collecte obligatoire");
  if (!litId) throw new Error("Lit obligatoire");

  const response = await fetch(
    `${API_URL}/api/collecte/chambre/${collecteId}/scanner-lit?litId=${encodeURIComponent(litId)}`,
    {
      method: "POST",
      headers: getHeaders(),
    }
  );
  return handleResponse(response);
};

// ─── 5a. Traiter un lit avec un contenant (BAC ou SAC) ─────────────────────
// ⚠️ Le backend utilise un seul endpoint /lit avec codeContenant
export const traiterLitAvecContenant = async (collecteId, litId, codeContenant) => {
  if (!collecteId) throw new Error("Collecte obligatoire");
  if (!litId) throw new Error("Lit obligatoire");
  if (!codeContenant) throw new Error("Code contenant obligatoire");

  const response = await fetch(
    `${API_URL}/api/collecte/chambre/${collecteId}/lit?litId=${encodeURIComponent(litId)}&codeContenant=${encodeURIComponent(codeContenant)}`,
    {
      method: "POST",
      headers: getHeaders(),
    }
  );
  return handleResponse(response);
};
export async function annulerCollecteVide(collecteId) {
  const res = await api.post(
    `/api/collecte-chambre/${collecteId}/annuler-si-vide`
  );
  return res.data;
}
// ─── 6. Déclarer un linge propre ──────────────────────────────────────────
export const marquerLingePropre = async (collecteId, codeOuTag) => {
  if (!collecteId) throw new Error("Collecte obligatoire");
  if (!codeOuTag) throw new Error("Code linge obligatoire");

  const response = await fetch(
    `${API_URL}/api/collecte/chambre/${collecteId}/propre?codeOuTag=${encodeURIComponent(codeOuTag)}`,
    {
      method: "POST",
      headers: getHeaders(),
    }
  );
  return handleResponse(response);
};

// ─── 7. Déclarer un linge manquant ────────────────────────────────────────
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

// ─── 8. Clôturer la collecte ──────────────────────────────────────────────
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