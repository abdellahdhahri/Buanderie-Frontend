import { lireErreur } from "./integrationService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export const CODES_ETAPES = ["COLLECTE", "RECEPTION", "TRI", "LAVAGE", "SECHAGE", "PLIAGE", "STOCKAGE", "DISTRIBUTION"];
export const ETAPES_OBLIGATOIRES = ["COLLECTE", "RECEPTION", "LAVAGE", "DISTRIBUTION"];

const enTetes = () => {
  try {
    const token = JSON.parse(localStorage.getItem("auth") || "null")?.token;
    return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  } catch {
    return { "Content-Type": "application/json" };
  }
};

async function requete(chemin, options = {}, fallback = "Erreur serveur") {
  const response = await fetch(`${API_URL}/api${chemin}`, { ...options, headers: { ...enTetes(), ...(options.headers || {}) } });
  if (!response.ok) throw new Error(await lireErreur(response, fallback));
  const texte = await response.text();
  return texte ? JSON.parse(texte) : null;
}

export const parcoursService = {
  getEtapes: () => requete("/linge-etapes", {}, "Erreur chargement des étapes"),
  getParcours: () => requete("/linge-etapes/parcours", {}, "Erreur chargement du parcours"),
  getOperations: () => requete("/linge-etapes/operations", {}, "Erreur chargement des opérations"),
  activer: (id, actif) =>
    requete(`/linge-etapes/${id}/activation`, { method: "PUT", body: JSON.stringify({ actif }) }, "Modification refusée"),
  setSuivantes: (id, suivantes) =>
    requete(`/linge-etapes/${id}/suivantes`, { method: "PUT", body: JSON.stringify({ suivantes }) }, "Modification refusée"),
};

export const chargementService = {
  getBac: (codeBac) => requete(`/chargements/${encodeURIComponent(codeBac)}`, {}, "Bac introuvable"),
  enAttente: () => requete("/chargements/en-attente", {}, "Erreur chargement des bacs en attente"),
  scan: (codeBac, codeOuTag, matriculeAgent) =>
    requete("/chargements/scan", { method: "POST", body: JSON.stringify({ codeBac, codeOuTag, matriculeAgent }) }, "Scan refusé"),
  pesee: (codeBac, poids) =>
    requete(`/chargements/${encodeURIComponent(codeBac)}/pesee`, { method: "POST", body: JSON.stringify({ poids }) }, "Pesée refusée"),
  valider: (codeBac, matriculeAgent, poids) =>
    requete(
      `/chargements/${encodeURIComponent(codeBac)}/validation`,
      { method: "POST", body: JSON.stringify({ matriculeAgent, ...(poids != null && poids !== "" ? { poids: Number(poids) } : {}) }) },
      "Validation refusée"
    ),
  retirer: (codeBac, codeOuTag, matriculeAgent) =>
    requete(
      `/chargements/${encodeURIComponent(codeBac)}/linges/${encodeURIComponent(codeOuTag)}?matriculeAgent=${encodeURIComponent(matriculeAgent || "")}`,
      { method: "DELETE" },
      "Retrait refusé"
    ),
};

export const versBacLavage = (d) => ({
  id: d.codeBac,
  codeBac: d.codeBac,
  codeLot: d.codeBac,
  categorie: d.categorie,
  typeCollecte: d.typeCollecte,
  etat: d.etatBac,
  poidsActuel: d.poidsBalance ?? d.poidsDeclare ?? 0,
  poidsDeclare: d.poidsDeclare,
  poidsBalance: d.poidsBalance ?? null,
  nbPieces: d.nbLinges,
  estBac: true,
});

export async function bacsPourLavage() {
  const data = await chargementService.enAttente();
  return (Array.isArray(data) ? data : []).map(versBacLavage);
}

let etapesCourantes = null;
let chargement = null;
const abonnes = new Set();

const notifier = () => abonnes.forEach((fn) => fn());

export function onEtapesChange(fn) {
  abonnes.add(fn);
  return () => abonnes.delete(fn);
}

export const getEtapesCourantes = () => etapesCourantes;

export function chargerEtapes({ forcer = false } = {}) {
  if (!forcer && etapesCourantes) return Promise.resolve(etapesCourantes);
  if (!forcer && chargement) return chargement;
  chargement = parcoursService
    .getEtapes()
    .then((data) => {
      etapesCourantes = Array.isArray(data) ? data : [];
      notifier();
      return etapesCourantes;
    })
    .finally(() => {
      chargement = null;
    });
  return chargement;
}

export const rafraichirEtapes = () => chargerEtapes({ forcer: true }).catch(() => etapesCourantes);

const trouver = (etapes, code) => (etapes || []).find((e) => e.code === code);

export function estActive(code, etapes = etapesCourantes) {
  if (!code) return true;
  const etape = trouver(etapes, code);
  return etape ? etape.actif !== false : true;
}

export function estObligatoire(code, etapes = etapesCourantes) {
  const etape = trouver(etapes, code);
  if (etape && typeof etape.obligatoire === "boolean") return etape.obligatoire;
  return ETAPES_OBLIGATOIRES.includes(code);
}

export function nomEtape(code, etapes = etapesCourantes) {
  return trouver(etapes, code)?.nom || code;
}

let operationsCourantes = null;
let chargementOperations = null;

export function chargerOperations() {
  if (operationsCourantes) return Promise.resolve(operationsCourantes);
  if (chargementOperations) return chargementOperations;
  chargementOperations = parcoursService
    .getOperations()
    .then((data) => {
      operationsCourantes = Array.isArray(data) ? data : [];
      return operationsCourantes;
    })
    .finally(() => {
      chargementOperations = null;
    });
  return chargementOperations;
}

export const getOperationsCourantes = () => operationsCourantes;
