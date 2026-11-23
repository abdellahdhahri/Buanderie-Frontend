import { apiFetch } from "./api";
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';

export const lingeService = {
  // Récupérer tous les services
  async getServices() {
    const response = await fetch(`${API_URL}/api/services`);
    if (!response.ok) throw new Error('Erreur lors du chargement des services');
    return response.json();
  },

  // Récupérer tout le personnel
  async getPersonnel() {
    const response = await fetch(`${API_URL}/api/personnel?actifs=true`);
    if (!response.ok) throw new Error('Erreur lors du chargement du personnel');
    return response.json();
  }
};

async function lireReponse(res, fallback) {
  const texte = await res.text();
  let data;
  try { data = texte ? JSON.parse(texte) : null; } catch { data = texte; }
  if (!res.ok) {
    const message = (data && typeof data === "object" && (data.message || data.erreur || data.error))
      || (typeof data === "string" && data)
      || `${fallback} (${res.status})`;
    throw new Error(message);
  }
  return data;
}

async function chargerLinge(linge) {
  const code = linge.codeBarre ?? linge.codebarre;
  if (!code) return linge;
  const res = await apiFetch(`/api/linges/barcode/${encodeURIComponent(code)}`);
  if (!res.ok) return linge;
  return { ...linge, ...(await res.json()) };
}

function fusionnerObservations(actuelles, remarques) {
  const a = actuelles?.trim();
  const r = remarques?.trim();
  if (!r) return a || null;
  return a ? `${a}
${r}` : r;
}

export async function declarerLingeManquant(linge, { remarques } = {}) {
  const complet = await chargerLinge(linge);
  const payload = {
    categorie: complet.categorie,
    poids: Number(complet.poids) || 0,
    serviceId: complet.serviceId ?? complet.service?.id ?? null,
    etat: "MANQUANT",
    durevie: complet.dureVie ?? complet.durevie ?? null,
    porteurId: complet.porteurId ?? complet.porteur?.id ?? null,
    rfidTag: complet.rfidTag || null,
    observations: fusionnerObservations(complet.observations, remarques),
  };
  const res = await apiFetch(`/api/linges/${complet.id ?? linge.id}`, { method: "PUT", body: JSON.stringify(payload) });
  return lireReponse(res, "Changement d'état impossible");
}

export async function declarerLingesManquants(linges, options, parallele = 4) {
  const echecs = [];
  const file = [...linges];
  const travailleur = async () => {
    while (file.length) {
      const l = file.shift();
      try { await declarerLingeManquant(l, options); }
      catch (e) { echecs.push({ linge: l, message: e.message }); }
    }
  };
  await Promise.all(Array.from({ length: Math.min(parallele, linges.length) }, travailleur));
  if (echecs.length) {
    const codes = echecs.map((e) => e.linge.codeBarre ?? e.linge.id).join(", ");
    const err = new Error(`${echecs.length}/${linges.length} échec(s) : ${codes} — ${echecs[0].message}`);
    err.echecs = echecs;
    throw err;
  }
  return linges.length;
}
