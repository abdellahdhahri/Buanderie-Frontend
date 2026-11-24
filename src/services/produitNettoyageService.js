import { lireMessageServeur } from "./lavageInfecteService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";
const BASE = `${API_URL}/api/produits-nettoyage`;

export const TYPES_PRODUIT = ["LIQUIDE", "POUDRE", "GEL", "TABLETTE", "AUTRE"];

async function appel(url, options = {}, fallback = "Erreur serveur") {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (!res.ok) {
    const err = new Error(await lireMessageServeur(res, fallback));
    err.status = res.status;
    throw err;
  }
  const texte = await res.text();
  if (!texte) return null;
  try { return JSON.parse(texte); } catch { return texte; }
}

const liste = (data) => (Array.isArray(data) ? data : data?.content || []);

export const listerProduits = async (tous = false) =>
  liste(await appel(`${BASE}${tous ? "?tous=true" : ""}`, {}, "Lecture des produits impossible"));

export const chercherProduitParCode = (codeBarre) =>
  appel(`${BASE}/code/${encodeURIComponent(codeBarre)}`, {}, `Produit ${codeBarre} introuvable`);

export const creerProduit = (produit) =>
  appel(BASE, { method: "POST", body: JSON.stringify(produit) }, "Création du produit impossible");

export const modifierProduit = (id, produit) =>
  appel(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(produit) }, "Modification du produit impossible");

export const supprimerProduit = (id) =>
  appel(`${BASE}/${id}`, { method: "DELETE" }, "Suppression du produit impossible");

export const produitsDuCycle = async (cycleId) =>
  liste(await appel(`${API_URL}/api/lavage/cycles/${cycleId}/produits`, {}, "Lecture des produits du cycle impossible"));
