import { lireMessageServeur } from "./lavageInfecteService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

async function appel(chemin, fallback) {
  const res = await fetch(`${API_URL}/api/historique/remises${chemin}`);
  if (!res.ok) {
    const err = new Error(await lireMessageServeur(res, fallback));
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const ETATS_REMISE = {
  EN_COURS: { label: "En cours", variant: "info" },
  PARTIELLE: { label: "Partielle", variant: "warning" },
  COMPLETEE: { label: "Clôturée", variant: "success" },
  EN_ATTENTE: { label: "En attente", variant: "secondary" },
  ANNULEE: { label: "Annulée", variant: "danger" },
};

export function listerRemises({ page = 0, size = 20, service, agent, etat, dateDebut, dateFin, numero } = {}) {
  const q = new URLSearchParams({ page, size });
  Object.entries({ service, agent, etat, dateDebut, dateFin, numero }).forEach(([k, v]) => {
    if (v != null && String(v).trim() !== "" && v !== "all") q.set(k, String(v).trim());
  });
  return appel(`?${q}`, "Lecture de l'historique des livraisons impossible");
}

export const detailRemise = (id) => appel(`/${id}`, "Lecture de la livraison impossible");

export const quantites = (r) => ({
  collectee: Number(r?.totalCollecte ?? r?.quantiteCollectee ?? r?.collecte ?? 0) || 0,
  remise: Number(r?.totalRemis ?? r?.totalRemise ?? r?.quantiteRemise ?? r?.remise ?? 0) || 0,
  restante: Number(r?.totalRestant ?? r?.quantiteRestante ?? r?.restante ?? 0) || 0,
});

export const dateRemise = (r) => r?.dateRemise ?? r?.date ?? r?.dateLivraison ?? null;
