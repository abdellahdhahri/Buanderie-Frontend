export const CHEMIN_LINGES_BLOQUES = "/linges-bloques";

export const LIBELLES_ETATS = {
  COLLECTE: "En collecte",
  SALE: "Sales non collectés",
  RECEPTION: "En réception",
  RECEPTIONNE: "Réceptionnés",
  EN_TRI: "En tri",
  EN_LAVAGE: "En lavage",
  LAVE: "Lavés",
  EN_SECHAGE: "En séchage",
  EN_SECHAGE_REPASSAGE: "En séchage / repassage",
  SECHE: "Séchés",
  PLIE: "Pliés",
  STOCKE: "Stockés",
  PROPRE: "Propres",
  PROPRE_PRET: "Prêts",
  PRET_LIVRAISON: "Prêts à livrer",
  LIVRE: "Livrés non rangés",
};

export const libelleEtat = (t, etat) => t(`linges_bloques.etats.${etat}`, LIBELLES_ETATS[etat] || etat || "—");

export function formatDuree(heures) {
  const h = Number(heures);
  if (!Number.isFinite(h) || h < 0) return "—";
  if (h > 0 && h < 1) return "< 1 h";
  const total = Math.round(h);
  const jours = Math.floor(total / 24);
  const reste = total % 24;
  if (!jours) return `${reste} h`;
  return reste ? `${jours} j ${reste} h` : `${jours} j`;
}

export const etatsTries = (parEtat) => Object.entries(parEtat || {})
  .filter(([, n]) => Number(n) > 0)
  .sort((a, b) => b[1] - a[1]);
