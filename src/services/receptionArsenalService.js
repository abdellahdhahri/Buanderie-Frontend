import { apiFetch } from "./api";

const BASE = "/api/receptions-arsenal";

const enc = encodeURIComponent;

const query = (params) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${enc(v)}`)
    .join("&");

/**
 * Appel API : renvoie le JSON ou lève une Error portant le message métier
 * du backend (clé "erreur" pour les IllegalArgumentException → HTTP 400).
 */
async function request(endpoint, options) {
  const response = await apiFetch(`${BASE}${endpoint}`, options);
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && (data.erreur || data.message || data.error)) ||
      (typeof data === "string" && data) ||
      `Erreur ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}

/* ── Normalisation des DTO Cubix (clés PascalCase ou camelCase) ─────────── */

export const normalizeArsenal = (a) => ({
  id: a.arsenalID ?? a.ArsenalID ?? a.id ?? a.Id,
  designation: a.designation ?? a.Designation ?? `Arsenal ${a.arsenalID ?? a.ArsenalID ?? ""}`,
  raw: a,
});

export const normalizeEmplacement = (e) => ({
  id: e.EmplacementID ?? e.emplacementID ?? e.id,
  nom: e.Nom ?? e.nom ?? `Emplacement ${e.EmplacementID ?? e.emplacementID ?? ""}`,
  numero: e.N ?? e.n ?? e.numero ?? null,
  codeBarre: e.CodeBarre ?? e.codeBarre ?? null,
});

/** Valeur envoyée au backend pour désigner une étagère (CodeBarre ou ID). */
export const emplacementParam = (emp) => emp.codeBarre || String(emp.id);

/** Retrouve l'étagère correspondant à un code scanné. */
export function findEmplacementByCode(emplacements, code) {
  const valeur = String(code).trim();
  return (
    emplacements.find((e) => e.codeBarre && e.codeBarre === valeur) ||
    emplacements.find((e) => e.codeBarre && e.codeBarre.toUpperCase() === valeur.toUpperCase()) ||
    null
  );
}

export const isNonConforme = (error) => /non conforme/i.test(error?.message || "");

/* ── Endpoints ──────────────────────────────────────────────────────────── */

export async function fetchArsenaux() {
  const data = await request("/arsenaux");
  return (Array.isArray(data) ? data : []).map(normalizeArsenal);
}

export async function fetchEmplacements(arsenalID) {
  const data = await request(`/arsenaux/${arsenalID}/emplacements`);
  return (Array.isArray(data) ? data : []).map(normalizeEmplacement);
}

export const fetchRemisesAgent = (badge) =>
  request(`/agent/${enc(badge)}/remises`);

export const fetchLingesARanger = (remiseId) =>
  request(`/remise/${remiseId}/linges-a-ranger`);

export const rangerTout = (remiseId, { arsenalID, emplacement, quantiteComptee, badgeAgent }) =>
  request(
    `/remise/${remiseId}/ranger-tout?${query({ arsenalID, emplacement, quantiteComptee, badgeAgent })}`,
    { method: "POST" }
  );

export const rangerLinge = (remiseId, { arsenalID, emplacement, codeLinge, badgeAgent }) =>
  request(
    `/remise/${remiseId}/ranger-linge?${query({ arsenalID, emplacement, codeLinge, badgeAgent })}`,
    { method: "POST" }
  );

export const fetchStockArsenal = (arsenalID) =>
  request(`/arsenaux/${arsenalID}/stock`);

export const fetchLingesEmplacement = (arsenalEmplacementID) =>
  request(`/emplacements/${arsenalEmplacementID}/linges`);

export const localiserLinge = (code) =>
  request(`/linge/${enc(code)}/localisation`);

/** Annule le rangement en arsenal d'un linge (il redevient « à ranger »). */
export const annulerRangement = (code, badgeAgent) =>
  request(`/linge/${enc(code)}/annuler-rangement?${query({ badgeAgent })}`, { method: "POST" });

/* ── Personnel : choixde l'agent sans scanner son badge ──────── */

const normalizePersonnel = (p) => {
  const nom = p.nom ?? "";
  const prenom = p.prenom ?? "";
  const codeBarre = p.codeBarre ?? "";
  const matricule = p.matricule ?? "";
  return {
    id: p.id,
    nomPrenom: p.nomPrenom ?? ([prenom, nom].filter(Boolean).join(" ") || nom),
    matricule,
    codeBarre,
    fonction: p.fonction ?? null,
    // Valeur envoyée à /agent/{badge}/remises, comme un scan de badge
    badge: codeBarre || matricule,
  };
};

export async function fetchPersonnel() {
  const response = await apiFetch("/api/personnel?actifs=true");
  if (!response.ok) throw new Error(`Erreur ${response.status}`);
  const data = await response.json();
  const list = Array.isArray(data) ? data : data?.content || data?.data || [];
  return list
    .map(normalizePersonnel)
    .filter((p) => p.badge)
    .sort((a, b) => a.nomPrenom.localeCompare(b.nomPrenom, "fr"));
}
