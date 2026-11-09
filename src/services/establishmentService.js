import logoProduit from "../assets/logo_SoftSys.png";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";
const BASE = `${API_URL}/api/parametres`;

// Valeurs du produit, utilisées tant que l'identité n'est pas chargée (ou si l'appel échoue)
export const DEFAULT_APP_NAME = "Buanderie";
export const DEFAULT_LOGO = logoProduit;
const DEFAULT_FAVICON = "/CubixLogo.png";

export const TYPES_ETABLISSEMENT = ["HOPITAL", "CLINIQUE", "HOTEL", "AUTRE"];
export const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const LOGO_MAX_OCTETS = 500 * 1024;

export const DEFAULT_IDENTITE = {
  raisonSociale: null,
  nomApplication: DEFAULT_APP_NAME,
  typeEtablissement: null,
  couleurPrimaire: null,
  adresse: null,
  telephone: null,
  email: null,
  piedDePage: null,
  logoUrl: null,
  logoVersion: null,
  dateModification: null,
  circuitInfecteActif: true,
  niveauRattachement: "LIT",
};

// ─── Appels HTTP ─────────────────────────────────────────────────────────
function enTeteAuth() {
  try {
    const token = JSON.parse(localStorage.getItem("auth") || "null")?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function requete(chemin, options = {}, fallback) {
  const response = await fetch(`${BASE}${chemin}`, {
    ...options,
    headers: { ...enTeteAuth(), ...(options.headers || {}) },
  });
  if (!response.ok) {
    const texte = await response.text().catch(() => "");
    let message;
    try { message = JSON.parse(texte)?.message || fallback; } catch { message = texte || fallback; }
    throw new Error(message);
  }
  return response.json();
}

export const identiteService = {
  get: () => requete("/identite", {}, "Erreur chargement de l'identité"),

  modifier: (payload) =>
    requete("/identite", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }, "Erreur enregistrement de l'identité"),

  envoyerLogo: (fichier) => {
    const form = new FormData();
    form.append("fichier", fichier);
    return requete("/logo", { method: "PUT", body: form }, "Erreur envoi du logo");
  },

  supprimerLogo: () => requete("/logo", { method: "DELETE" }, "Erreur suppression du logo"),
};

// ─── Dérivés ─────────────────────────────────────────────────────────────
// URL complète du logo serveur (le paramètre ?v= est conservé), ou null
export function urlLogo(identite) {
  const chemin = identite?.logoUrl;
  if (!chemin) return null;
  if (/^https?:\/\//i.test(chemin)) return chemin;
  return `${API_URL}${chemin.startsWith("/") ? "" : "/"}${chemin}`;
}

export const aCircuitInfecte = (identite) => identite?.circuitInfecteActif !== false;

export const NIVEAUX_RATTACHEMENT = ["LIT", "CHAMBRE"];
export const niveauRattachementDe = (identite) => (identite?.niveauRattachement === "CHAMBRE" ? "CHAMBRE" : "LIT");

// ─── Partage de l'état entre écrans ──────────────────────────────────────
let identiteCourante = { ...DEFAULT_IDENTITE };
let chargement = null;
const abonnes = new Set();

export const getEstablishment = () => identiteCourante;

export function onEstablishmentChange(fn) {
  abonnes.add(fn);
  return () => abonnes.delete(fn);
}

export function setEstablishment(valeur) {
  identiteCourante = {
    ...DEFAULT_IDENTITE,
    ...(valeur || {}),
    nomApplication: valeur?.nomApplication || DEFAULT_APP_NAME,
    circuitInfecteActif: valeur?.circuitInfecteActif !== false,
    niveauRattachement: niveauRattachementDe(valeur),
  };
  appliquerIdentite(identiteCourante);
  abonnes.forEach((fn) => fn(identiteCourante));
  return identiteCourante;
}

// Chargement au démarrage ; en cas d'échec, l'application garde les valeurs par défaut
export function chargerEstablishment({ forcer = false } = {}) {
  if (!forcer && chargement) return chargement;
  chargement = identiteService
    .get()
    .then(setEstablishment)
    .catch((err) => {
      console.warn("Identité de l'établissement indisponible :", err.message);
      chargement = null;
      return identiteCourante;
    });
  return chargement;
}

// ─── Application au document : titre, favicon, couleur du thème ─────────
// Nuances Tailwind « teal » recalculées depuis la couleur principale
const NUANCES = {
  50: "color-mix(in oklab, var(--primary) 8%, white)",
  100: "color-mix(in oklab, var(--primary) 16%, white)",
  200: "color-mix(in oklab, var(--primary) 32%, white)",
  300: "color-mix(in oklab, var(--primary) 52%, white)",
  400: "color-mix(in oklab, var(--primary) 74%, white)",
  500: "color-mix(in oklab, var(--primary) 88%, white)",
  600: "var(--primary)",
  700: "color-mix(in oklab, var(--primary) 82%, black)",
  800: "color-mix(in oklab, var(--primary) 66%, black)",
  900: "color-mix(in oklab, var(--primary) 52%, black)",
};
const VARIABLES_COULEUR = ["--primary", "--sidebar-primary", "--ring", "--sidebar-ring", "--chart-1"];

function appliquerCouleur(couleur) {
  const style = document.documentElement.style;
  const valide = /^#[0-9a-f]{6}$/i.test(couleur || "");
  VARIABLES_COULEUR.forEach((v) => (valide ? style.setProperty(v, couleur) : style.removeProperty(v)));
  Object.entries(NUANCES).forEach(([n, valeur]) =>
    valide ? style.setProperty(`--color-teal-${n}`, valeur) : style.removeProperty(`--color-teal-${n}`)
  );
}

function appliquerFavicon(href) {
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.removeAttribute("type");
  link.href = href;
}

function appliquerIdentite(identite) {
  if (typeof document === "undefined") return;
  document.title = identite.nomApplication;
  appliquerFavicon(urlLogo(identite) || DEFAULT_FAVICON);
  appliquerCouleur(identite.couleurPrimaire);
}
