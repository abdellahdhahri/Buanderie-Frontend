// Zones du suivi de stock — miroir des clés renvoyées par /api/suivi-stock.
// Ordre d'affichage, libellé et couleur fixes : seul endroit à modifier.
export const ZONES_STOCK = [
  { id: "OFFICE",            label: "Office",            color: "#12b886" },
  { id: "STOCK_NON_RANGE",   label: "Stock non rangé",   color: "#f59f00" },
  { id: "CHAMBRES",          label: "Chambres",          color: "#4c6ef5" },
  { id: "PORTEURS",          label: "Porteurs",          color: "#be4bdb" },
  { id: "A_RANGER",          label: "À ranger",          color: "#15aabf" },
  { id: "SALE",              label: "Sale",              color: "#fd7e14" },
  { id: "CIRCUIT_BUANDERIE", label: "Circuit buanderie", color: "#868e96" },
  { id: "PERTES",            label: "Pertes",            color: "#fa5252" },
];

export const ZONE_IDS = ZONES_STOCK.map((z) => z.id);

const BY_ID = Object.fromEntries(ZONES_STOCK.map((z) => [z.id, z]));

export const zoneMeta = (id) => BY_ID[id] || { id, label: id, color: "#94a3b8" };

/** Libellé traduit si une traduction existe, sinon libellé fixe ci-dessus. */
export const zoneLabel = (t, id) => t(`suiviStock.zones.${id}`, zoneMeta(id).label);
