import React, { createContext, useContext, useState, useCallback } from "react";
import { useModal } from "./ModalContext";

export const LivraisonContext = createContext();
export const useLivraison = () => useContext(LivraisonContext);

export function LivraisonProvider({ children }) {
  const { showAlert, showConfirm } = useModal();

  const [selectedIds, setSelectedIds] = useState([]);
  const [loading,     setLoading]     = useState(false);

  const toggleSelection    = useCallback((id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);
  const selectionnerTout   = useCallback((ids) => setSelectedIds(ids), []);
  const viderSelection     = useCallback(() => setSelectedIds([]), []);

  const scanLivraison = useCallback(async (code, getLingeByCode, updateLinge) => {
    const item = await getLingeByCode(code);
    if (!item) { showAlert("Introuvable", `❌ Code [${code}] inconnu.`, "error"); return; }


    setLoading(true);
    try {
      await updateLinge(item.id, { ...item, etat: "LIVRE" });
      showAlert("✅ Livré", `${code} → LIVRE`, "success");
    } catch (err) {
      showAlert("Erreur", err.message, "error");
    } finally { setLoading(false); }
  }, [showAlert]);

  const livrerSelection = useCallback(async (linges, updateLinge) => {
    if (!selectedIds.length) return;
    const ok = await showConfirm("Livrer la sélection", `Livrer ${selectedIds.length} article(s) ?`, "question");
    if (!ok) return;

    setLoading(true);
    try {
      await Promise.all(
        selectedIds.map(id => {
          const linge = linges.find(l => l.id === id);
          return linge ? updateLinge(id, { ...linge, etat: "LIVRE" }) : Promise.resolve();
        })
      );
      showAlert("✅ Livraison effectuée", `${selectedIds.length} article(s) livrés`, "success");
      setSelectedIds([]);
    } catch (err) {
      showAlert("Erreur", err.message, "error");
    } finally { setLoading(false); }
  }, [selectedIds, showAlert, showConfirm]);

  return (
    <LivraisonContext.Provider value={{
      selectedIds, loading,
      toggleSelection, selectionnerTout, viderSelection,
      scanLivraison, livrerSelection,
    }}>
      {children}
    </LivraisonContext.Provider>
  );
}
