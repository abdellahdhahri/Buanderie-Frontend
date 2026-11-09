const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

// Message d'erreur renvoyé par le backend ({ message } ou texte brut)
export async function lireErreur(response, fallback) {
  const texte = await response.text().catch(() => "");
  try {
    const data = JSON.parse(texte);
    return data?.message || data?.error || fallback;
  } catch {
    return texte || fallback;
  }
}

async function requete(chemin, options, fallback) {
  const response = await fetch(`${API_URL}/api/integration${chemin}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) throw new Error(await lireErreur(response, fallback));
  return response.json();
}

export const integrationService = {
  get: () => requete("", {}, "Erreur chargement de l'intégration"),

  modifier: (payload) =>
    requete("", { method: "PUT", body: JSON.stringify(payload) }, "Erreur enregistrement de l'intégration"),

  appliquerModele: (type) =>
    requete(`/modele/${type}`, { method: "POST" }, "Erreur application du modèle"),

  getChamps: (referentiel) =>
    requete(`/champs/${referentiel}`, {}, `Erreur chargement des champs ${referentiel}`),

  tester: (referentiel) =>
    requete(`/tester/${referentiel}`, { method: "POST" }, `Test ${referentiel} impossible`),

  synchroniser: (referentiel) =>
    requete(`/synchroniser/${referentiel}`, { method: "POST" }, `Synchronisation ${referentiel} impossible`),

  getJournal: (referentiel) =>
    requete(referentiel ? `/journal?referentiel=${referentiel}` : "/journal", {}, "Erreur chargement du journal"),
};

// Référentiel alimenté par le système externe : mode EXTERNE et endpoint actif
export function estImporte(integration, referentiel) {
  if (integration?.configuration?.mode !== "EXTERNE") return false;
  const endpoint = (integration.endpoints || []).find((e) => e.referentiel === referentiel);
  return endpoint?.actif === true;
}

// ─── Partage de l'état entre écrans ──────────────────────────────────────
let integrationCourante = null;
let chargement = null;
const abonnes = new Set();
const synchrosEnCours = new Map();

const notifier = () => abonnes.forEach((fn) => fn());

export function onIntegrationChange(fn) {
  abonnes.add(fn);
  return () => abonnes.delete(fn);
}

export const getIntegrationCourante = () => integrationCourante;

export function setIntegrationCourante(valeur) {
  integrationCourante = valeur;
  notifier();
}

export function chargerIntegration({ forcer = false } = {}) {
  if (!forcer && integrationCourante) return Promise.resolve(integrationCourante);
  if (!forcer && chargement) return chargement;
  chargement = integrationService
    .get()
    .then((data) => {
      setIntegrationCourante(data);
      return data;
    })
    .finally(() => {
      chargement = null;
    });
  return chargement;
}

export const synchronisationEnCours = (referentiel) => synchrosEnCours.has(referentiel);

// Une seule synchronisation par référentiel, sans timeout : elle peut durer plusieurs minutes
export function lancerSynchronisation(referentiel) {
  if (synchrosEnCours.has(referentiel)) return synchrosEnCours.get(referentiel);
  const promesse = integrationService
    .synchroniser(referentiel)
    .finally(() => {
      synchrosEnCours.delete(referentiel);
      notifier();
      chargerIntegration({ forcer: true }).catch(() => {});
    });
  synchrosEnCours.set(referentiel, promesse);
  notifier();
  return promesse;
}

const CAUSES_HTTP = {
  400: "requête refusée par le système externe",
  401: "authentification refusée : vérifiez les identifiants",
  403: "accès interdit : vérifiez les droits du compte utilisé",
  404: "l'adresse appelée n'existe pas : vérifiez l'URL de base et le chemin",
  405: "méthode non autorisée sur cette adresse",
  500: "erreur interne du système externe",
  502: "passerelle injoignable",
  503: "système externe indisponible",
  504: "délai dépassé côté système externe",
};

export function messageLisible(message, url) {
  const texte = String(message ?? "");
  if (!/<!doctype|<html|<body|<EOL>/i.test(texte)) return texte;
  const propre = texte.replace(/<EOL>/gi, " ");
  const entete = propre.match(/^\s*(\d{3})\s+([^:"<]+)/);
  const code = Number(entete?.[1] || propre.match(/Error code:\s*(\d{3})/i)?.[1] || 0) || null;
  const raison = (entete?.[2] || propre.match(/Message:\s*([^<]+)</i)?.[1] || propre.match(/<title>([^<]+)<\/title>/i)?.[1] || "").trim().replace(/\.$/, "");
  const cause = code && CAUSES_HTTP[code];
  return [
    `Le système externe a répondu ${code || "par une erreur"}${raison ? ` (${raison})` : ""}`,
    cause ? ` : ${cause}.` : ".",
    url ? ` Adresse appelée : ${url}` : "",
  ].join("");
}

export const urlAppelee = (urlBase, chemin) => {
  const c = String(chemin || "").trim();
  if (!c) return "";
  if (/^https?:\/\//i.test(c)) return c;
  return `${String(urlBase || "").replace(/\/+$/, "")}/${c.replace(/^\/+/, "")}`;
};
