import React, { createContext, useContext, useState, useCallback } from "react";
import { useModal } from "./ModalContext";


const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082/api";

export const PliageContext = createContext();
export const usePliage = () => useContext(PliageContext);

export function PliageProvider({ children }) {
  const { showAlert } = useModal();

  const [agent,        setAgent]        = useState(null);
  const [dialogueItem, setDialogueItem] = useState(null);
  const [loading,      setLoading]      = useState(false);

  const scanAgent = useCallback(async (code) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/agents/matricule/${code}`);
      if (res.ok) {
        const ag = await res.json();
        setAgent(ag);
        showAlert("Agent identifié", `✅ ${ag.nom} (${ag.matricule})`, "success");
        return true;
      }
      showAlert("Agent introuvable", `❌ L'agent [${code}] n'existe pas.`, "error");
      return false;
    } catch {
      showAlert("Erreur réseau", "", "error");
      return false;
    } finally { setLoading(false); }
  }, [showAlert]);

  const deconnecterAgent = useCallback(() => {
    setAgent(null); setDialogueItem(null);
  }, []);

  const scanPliage = useCallback(async (code, getLingeByCode) => {
    if (!agent) { showAlert("Agent requis", "Scannez votre badge d'abord.", "warning"); return; }
    setLoading(true);
    try {
      const item = await getLingeByCode(code);
      if (!item) { showAlert("Erreur", `❌ Code [${code}] inconnu.`, "error"); return; }
      if (item.etat !== "LAVE") {
        showAlert("Attention", `⚠️ Linge [${code}] est en état [${item.etat}]. Attendu: LAVE.`, "warning");
        return;
      }

      const res = await fetch(`${API_URL}/api/pliage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matriculeAgent: agent.matricule, codeOuTag: code })
      });
      if (!res.ok) {
        const txt = await res.text();
        let msg = txt; try { msg = JSON.parse(txt).message || txt; } catch {}
        throw new Error(msg);
      }
      setDialogueItem(item);
    } catch (err) {
      showAlert("Erreur pliage", `❌ ${err.message}`, "error");
    } finally { setLoading(false); }
  }, [agent, showAlert]);

  const fermerDialogue = useCallback(() => setDialogueItem(null), []);

  return (
    <PliageContext.Provider value={{
      agent, dialogueItem, loading,
      scanAgent, deconnecterAgent, scanPliage, fermerDialogue,
    }}>
      {children}
    </PliageContext.Provider>
  );
}