import { useCallback, useState } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   Ordre des cartes mémorisé dans le navigateur.
   Les cartes ajoutées plus tard dans le code apparaissent à la fin ;
   celles qui n'existent plus sont ignorées.
   ═══════════════════════════════════════════════════════════════════════════ */
export function usePersistentOrder(storageKey, defaultIds) {
  const merge = useCallback((saved) => {
    const known = (saved || []).filter((id) => defaultIds.includes(id));
    return [...known, ...defaultIds.filter((id) => !known.includes(id))];
  }, [defaultIds]);

  const [order, setOrder] = useState(() => {
    try {
      return merge(JSON.parse(localStorage.getItem(storageKey)));
    } catch {
      return [...defaultIds];
    }
  });

  const save = useCallback((next) => {
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* stockage indisponible */ }
  }, [storageKey]);

  const reset = useCallback(() => {
    try { localStorage.removeItem(storageKey); } catch { /* stockage indisponible */ }
    setOrder([...defaultIds]);
  }, [storageKey, defaultIds]);

  const isCustom = order.join("|") !== defaultIds.join("|");

  return { order, setOrder, save, reset, isCustom };
}
