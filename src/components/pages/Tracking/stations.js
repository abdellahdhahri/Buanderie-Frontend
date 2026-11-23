import { FoldVertical, Inbox, Layers, Package, Truck, WashingMachine, Warehouse, Wind } from "lucide-react";

export const TEAL = "#0794a4";

const HAUT = 110;
const BAS = 310;
const RAYON = 100;
const X0 = 100;
const PAS = 240;
const X_VIRAGE = X0 + PAS * 3;
const L_HAUT = X_VIRAGE - X0;
const L_ARC = Math.PI * RAYON;

export const CARTE = { largeur: 1000, hauteur: 420, haut: HAUT, bas: BAS };
export const TRACE = `M${X0} ${HAUT} H${X_VIRAGE} A${RAYON} ${RAYON} 0 0 1 ${X_VIRAGE} ${BAS} H${X0}`;
export const LONGUEUR_TOTALE = L_HAUT + L_ARC + L_HAUT;

export const STATIONS = [
  { id: "COLLECTE", label: { fr: "Collecte", ar: "الجمع", en: "Collection" }, Icon: Truck, zone: "SALE", l: 0 },
  { id: "RECEPTION", label: { fr: "Réception", ar: "الاستلام", en: "Reception" }, Icon: Inbox, zone: "SALE", l: PAS },
  { id: "TRI", label: { fr: "Tri", ar: "الفرز", en: "Sorting" }, Icon: Layers, zone: "SALE", l: PAS * 2 },
  { id: "LAVAGE", label: { fr: "Lavage", ar: "الغسيل", en: "Washing" }, Icon: WashingMachine, zone: "SALE", l: L_HAUT },
  { id: "SECHAGE", label: { fr: "Séchage", ar: "التجفيف", en: "Drying" }, Icon: Wind, zone: "PROPRE", l: L_HAUT + L_ARC },
  { id: "PLIAGE", label: { fr: "Pliage", ar: "الطي", en: "Folding" }, Icon: FoldVertical, zone: "PROPRE", l: L_HAUT + L_ARC + PAS },
  { id: "STOCKAGE", label: { fr: "Stockage", ar: "التخزين", en: "Storage" }, Icon: Warehouse, zone: "PROPRE", l: L_HAUT + L_ARC + PAS * 2 },
  { id: "LIVRAISON", label: { fr: "Livraison", ar: "التسليم", en: "Delivery" }, Icon: Package, zone: "PROPRE", l: L_HAUT + L_ARC + L_HAUT },
];

export const STATION_PAR_ID = Object.fromEntries(STATIONS.map((s) => [s.id, s]));

export function pointA(l) {
  if (l <= L_HAUT) return { x: X0 + l, y: HAUT };
  if (l <= L_HAUT + L_ARC) {
    const a = (l - L_HAUT) / RAYON;
    return { x: X_VIRAGE + RAYON * Math.sin(a), y: HAUT + RAYON - RAYON * Math.cos(a) };
  }
  return { x: X_VIRAGE - (l - L_HAUT - L_ARC), y: BAS };
}

export const ETAT_TO_STATION = {
  COLLECTE: "COLLECTE", RECEPTION: "RECEPTION", RECEPTIONNE: "RECEPTION",
  EN_TRI: "TRI", EN_LAVAGE: "LAVAGE", LAVE: "LAVAGE",
  EN_SECHAGE: "SECHAGE", EN_SECHAGE_REPASSAGE: "SECHAGE", SECHE: "SECHAGE",
  PLIE: "PLIAGE", STOCKE: "STOCKAGE", PROPRE_PRET: "STOCKAGE",
  PRET_LIVRAISON: "LIVRAISON", LIVRE: "LIVRAISON",
  SALE: "COLLECTE", PROPRE: "STOCKAGE", MANQUANT: null,
};

export const ETAT_COULEURS = {
  COLLECTE: "#b45309", RECEPTION: "#b45309", RECEPTIONNE: "#b45309", EN_TRI: "#b45309", SALE: "#b45309",
  EN_LAVAGE: TEAL, LAVE: TEAL, EN_SECHAGE: TEAL, EN_SECHAGE_REPASSAGE: TEAL, SECHE: TEAL, PLIE: TEAL,
  STOCKE: "#047857", PROPRE_PRET: "#047857", PRET_LIVRAISON: "#047857", LIVRE: "#047857", PROPRE: "#047857",
  MANQUANT: "#b91c1c",
};
