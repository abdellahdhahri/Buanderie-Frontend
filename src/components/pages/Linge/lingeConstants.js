
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

export const ETAT_BADGE_VARIANTS = {
  SALE: "danger",
  EN_LAVAGE: "info",
  LAVE: "success",
  EN_SECHAGE: "info",
  SECHE: "success",
  PLIE: "secondary",
  COLLE: "secondary",
  STOCKE: "secondary",
  COLLECTE: "warning",
  LIVRE: "success",
  HORS_SERVICE: "danger",
  EN_TRI: "info",
  RECEPTION: "info",
  INFECTE_COLLECTE: "danger",
  INFECTE_EN_LAVAGE: "danger",
  INFECTE_LAVE: "danger",
  INFECTE_ECART: "danger",
  PROPRE: "success",
  MANQUANT: "danger",
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
  groupeLavage: "",
};

export const EMPTY_FILTERS = {
  categorie: "",
  etat: "",
  serviceId: "",
  search: "",
};
