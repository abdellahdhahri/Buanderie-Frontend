// ═══════════════════════════════════════════════════════════════════════════
// 📋 CONSTANTES — Page Linges
// ═══════════════════════════════════════════════════════════════════════════

// États sélectionnables dans les filtres et le formulaire
export const ETAT_OPTIONS = [
  "SALE",
  "EN_LAVAGE",
  "LAVE",
  "EN_SECHAGE",
  "SECHE",
  "PLIE",
  "COLLE",
  "STOCKE",
  "COLLECTE",
  "LIVRE",
  "HORS_SERVICE",
  "EN_TRI",
  "RECEPTION",
  "PROPRE",
  "MANQUANT",
];

// Variante du badge selon l'état
export const ETAT_BADGE_VARIANTS = {
  SALE: "destructive",
  EN_LAVAGE: "info",
  LAVE: "success",
  EN_SECHAGE: "info",
  SECHE: "success",
  PLIE: "secondary",
  COLLE: "secondary",
  STOCKE: "secondary",
  COLLECTE: "warning",
  LIVRE: "success",
  HORS_SERVICE: "destructive",
  EN_TRI: "info",
  RECEPTION: "info",
  INFECTE_COLLECTE: "destructive",
  INFECTE_EN_LAVAGE: "destructive",
  INFECTE_LAVE: "destructive",
  INFECTE_ECART: "destructive",
  PROPRE: "success",
  MANQUANT: "destructive",
};

export const EMPTY_LINGE_FORM = {
  categorie: "",
  poids: 0,
  serviceId: "",
  codebarre: "",
  rfidTag: "",
  dureVie: "",
  porteurId: "",
  etat: "SALE",
  observations: "",
};

export const EMPTY_FILTERS = {
  categorie: "",
  etat: "",
  serviceId: "",
  search: "",
};
