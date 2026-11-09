import { useMemo, useState } from "react";

// Comparaison selon le type : nombres, dates ISO, texte (ordre naturel : BAC2 < BAC10)
const collator = new Intl.Collator("fr", { numeric: true, sensitivity: "base" });
const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

function compare(a, b) {
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "string" && typeof b === "string" && ISO_DATE.test(a) && ISO_DATE.test(b)) {
    return new Date(a) - new Date(b);
  }
  return collator.compare(String(a), String(b));
}

const isEmpty = (v) => v === null || v === undefined || v === "";

/**
 * Tri de tableau côté client.
 *   items     : lignes à trier
 *   accessors : { cle: (ligne) => valeur } pour les colonnes calculées (optionnel)
 * Un clic sur une colonne : croissant → décroissant → ordre d'origine.
 * Les valeurs vides restent toujours en fin de liste.
 */
export function useSortableData(items, accessors = {}, initial = null) {
  const [sortConfig, setSortConfig] = useState(initial); // { key, direction: "asc" | "desc" }

  const sortedItems = useMemo(() => {
    if (!sortConfig) return items;
    const get = accessors[sortConfig.key] ?? ((row) => row?.[sortConfig.key]);
    const factor = sortConfig.direction === "asc" ? 1 : -1;
    return [...items].sort((ra, rb) => {
      const a = get(ra);
      const b = get(rb);
      if (isEmpty(a) && isEmpty(b)) return 0;
      if (isEmpty(a)) return 1;
      if (isEmpty(b)) return -1;
      return compare(a, b) * factor;
    });
    // accessors est un objet littéral recréé à chaque rendu : on ne dépend que de la clé
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, sortConfig]);

  const requestSort = (key) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  };

  const directionFor = (key) => (sortConfig?.key === key ? sortConfig.direction : null);

  return { sortedItems, sortConfig, requestSort, directionFor };
}
