import { lireMessageServeur } from "./lavageInfecteService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export const USAGES_BAC = {
  COLLECTE: "Collecte",
  TRI: "Tri",
  TRANSPORT: "Transport",
};

export const ETATS_BAC_TRI = {
  VIDE: "Vide",
  EN_TRI: "En tri",
  PRET_LAVAGE: "Prêt pour le lavage",
  EN_LAVAGE: "En lavage",
  EN_ATTENTE_SECHAGE: "En attente de séchage",
  EN_SECHAGE: "En séchage",
};

export const TONS_ETAT_BAC = {
  VIDE: "secondary",
  EN_TRI: "warning",
  PRET_LAVAGE: "success",
  EN_LAVAGE: "info",
  EN_ATTENTE_SECHAGE: "warning",
  EN_SECHAGE: "info",
};

export const ETATS_BAC_OUVERTS = ["VIDE", "EN_TRI"];

export const libelleEtatBac = (t, etat) =>
  etat ? t(`bac_status.${etat}`, ETATS_BAC_TRI[etat] || etat) : "—";

export const libelleUsageBac = (t, usage) =>
  t(`bacs.usage_${usage || "COLLECTE"}`, USAGES_BAC[usage] || usage || USAGES_BAC.COLLECTE);

export const estBacDechargement = (b) => Boolean(b?.source) && String(b.source).toUpperCase() !== "TRI";

export const libelleSourceBac = (t, b) =>
  estBacDechargement(b)
    ? t(`bacs.source_${b.source}`, { defaultValue: t("bacs.source_dechargement", "Déchargement (désinfection)") })
    : t("bacs.source_tri", "Tri (linge blanc)");

export const codeDuBac = (b) => b?.codeBac || b?.code || b?.reference || "";

export const estBacOuvert = (b) => ETATS_BAC_OUVERTS.includes(b?.etat ?? b?.etatBac);

export const versBacTri = (b) => {
  const code = codeDuBac(b);
  const etat = b.etatBac || b.etat || null;
  const poids = Number(b.poids ?? b.poidsDeclare ?? 0) || 0;
  return {
    ...b,
    id: b.id ?? code,
    codeBac: code,
    codeLot: code,
    reference: b.reference || code,
    etat,
    categorie: b.categorie || null,
    typeCollecte: b.typeCollecte || null,
    poidsDeclare: poids,
    poidsActuel: b.poidsBalance ?? poids,
    poidsBalance: b.poidsBalance ?? null,
    nbPieces: b.nombreLinges ?? b.nbLinges ?? null,
    estBac: true,
    enTri: etat === "EN_TRI",
  };
};

async function appel(chemin, options = {}, fallback = "Erreur serveur") {
  const res = await fetch(`${API_URL}/api${chemin}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (!res.ok) {
    const err = new Error(await lireMessageServeur(res, fallback));
    err.status = res.status;
    throw err;
  }
  const texte = await res.text();
  return texte ? JSON.parse(texte) : null;
}

const liste = (data) => (Array.isArray(data) ? data : data?.content || []);

const requeteParams = (params) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "" && v !== "all") q.set(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : "";
};

export const listerBacsTri = async ({ etat, categorie, typeCollecte } = {}) =>
  liste(await appel(`/bacs/tri${requeteParams({ etat, categorie, typeCollecte })}`, {}, "Erreur chargement des bacs de tri"));

export const suggererBacs = async (codeOuTag) =>
  liste(await appel(`/tri/bacs/suggestion?codeOuTag=${encodeURIComponent(codeOuTag)}`, {}, "Erreur suggestion des bacs"));

export const trierDansBac = (codeOuTag, codeBac, matriculeAgent) =>
  appel("/tri", { method: "POST", body: JSON.stringify({ codeOuTag, codeBac, matriculeAgent }) }, "Tri refusé");

export const chercherBacParCode = (code) =>
  appel(`/bacs/code/${encodeURIComponent(code)}`, {}, `Bac ${code} introuvable`);

export async function lingesDuBac(code) {
  try {
    const bac = await chercherBacParCode(code);
    if (!bac?.id) return [];
    return liste(await appel(`/bacs/bacs/${bac.id}/linges`, {}, "Erreur chargement des linges du bac"));
  } catch {
    return [];
  }
}

export const scannerBacPourCycle = (atelier, codeBac) =>
  appel(`/${atelier}/scan-bac/${encodeURIComponent(codeBac)}`, {}, `Bac ${codeBac} illisible`);

const poidsParam = (poids) => (poids != null && poids !== "" && Number(poids) > 0 ? Number(poids) : null);

const produitIdsParam = (ids) => (Array.isArray(ids) && ids.length ? ids.join(",") : null);

export const demarrerCycleBac = (atelier, { codeMachine, codeBac, matriculeAgent, poidsCharge, programmeId, produitIds }) =>
  appel(
    `/${atelier}/start-bac${requeteParams({ codeMachine, codeBac, matriculeAgent, poidsCharge: poidsParam(poidsCharge), programmeId, produitIds: produitIdsParam(produitIds) })}`,
    { method: "POST" },
    "Erreur démarrage du cycle"
  );

export const ajouterBacAuCycle = (atelier, cycleId, codeBac, poidsCharge) =>
  appel(
    `/${atelier}/${cycleId}/add-bac${requeteParams({ codeBac, poidsCharge: poidsParam(poidsCharge) })}`,
    { method: "POST" },
    `Ajout du bac ${codeBac} refusé`
  );
