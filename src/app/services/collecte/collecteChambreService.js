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

// ─── 1b. Tous les lits d'une chambre (y compris ceux sans linge) ───────────
export const fetchLitsChambre = async (chambreId) => {
  if (chambreId == null) return [];
  const response = await fetch(
    `${API_URL}/api/sqlserver/lits/chambre/${encodeURIComponent(chambreId)}`,
    { method: "GET", headers: getHeaders() }
  );
  const data = await handleResponse(response);
  return (Array.isArray(data) ? data : []).map((l) => ({
    id: l.Id ?? l.id,
    code: l.Code ?? l.code ?? l.CodeBarre ?? l.codeBarre,
  }));
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
// ─── 5b. Annuler une collecte sans aucun linge traité ──────────────────────
export const annulerCollecteVide = async (collecteId) => {
  if (!collecteId) return null;
  const response = await fetch(
    `${API_URL}/api/collecte-chambre/${encodeURIComponent(collecteId)}/annuler-si-vide`,
    {
      method: "POST",
      headers: getHeaders(),
    }
  );
  return handleResponse(response);
};


export const declarerLingeInfecte = async (
  collecteId,
  lingeId,
  codeSacInfecte
) => {
  const response = await fetch(
    `${API_URL}/api/collecte/chambre/declarer-linge-infecte` +
    `?collecteId=${encodeURIComponent(collecteId)}` +
    `&lingeId=${encodeURIComponent(lingeId)}` +
    `&codeSacInfecte=${encodeURIComponent(codeSacInfecte)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  if (!response.ok) {
    let message = "Erreur lors de la déclaration du linge infecté.";

    try {
      const error = await response.json();
      message = error.message || message;
    } catch {}

    throw new Error(message);
  }

  return response.json();
};


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