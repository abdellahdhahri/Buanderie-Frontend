import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { useModal } from "./ModalContext";


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';

export const StockageContext = createContext();
export const useStockage = () => useContext(StockageContext);

export function StockageProvider({ children }) {
  const { showAlert } = useModal();

  const [agent,             setAgent]             = useState(null);
  const [dialogueItem,      setDialogueItem]      = useState(null);
  const [reclamationCreee,  setReclamationCreee]  = useState(false);
  const [messageStatut,     setMessageStatut]     = useState("");
  const [loading,           setLoading]           = useState(false);
  const [isConfirming,      setIsConfirming]      = useState(false);

  const agentRef       = useRef(null);
  const dialogueItemRef = useRef(null);   

  const scanAgent = useCallback(async (code) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/agents/matricule/${code}`);
      if (res.ok) {
        const ag = await res.json();
        setAgent(ag);
        agentRef.current = ag;
        setMessageStatut(`Agent ${ag.nom} connecté`);
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
    setAgent(null); agentRef.current = null;
    setDialogueItem(null); dialogueItemRef.current = null;
    setMessageStatut("");
  }, []);

  const scanStockage = useCallback(async (code, getLingeByCode) => {
    setLoading(true);
    try {
      const item = await getLingeByCode(code);
      if (!item) { showAlert("Erreur", `❌ Code [${code}] inconnu.`, "error"); return; }
      if (item.etat !== "PLIE") {
        showAlert("Attention", `⚠️ Linge [${code}] est en état [${item.etat}]. Attendu: LAVE.`, "warning");
        return;
      }
      setDialogueItem(item);
      dialogueItemRef.current = item;
      setReclamationCreee(false);
      setMessageStatut(`Contrôle qualité pour ${item.codeBarre}`);
    } catch (err) {
      showAlert("Erreur", `❌ ${err.message}`, "error");
    } finally { setLoading(false); }
  }, [showAlert]);

  const confirmerControle = useCallback(async (typeReclamation, description) => {
    if (isConfirming) return;
    setIsConfirming(true);

    const currentAgent = agentRef.current;
    const currentItem  = dialogueItemRef.current;

    if (!currentItem) {
      showAlert("Erreur", "❌ Aucun linge sélectionné.", "error");
      setIsConfirming(false); setDialogueItem(null); dialogueItemRef.current = null;
      return;
    }
    if (!currentAgent?.matricule) {
      showAlert("Erreur", "❌ Veuillez scanner votre badge agent.", "error");
      setIsConfirming(false); setDialogueItem(null); dialogueItemRef.current = null;
      return;
    }

    setLoading(true);
    try {
      if (typeReclamation) {
        const payload = {
          codeOuTag:      currentItem.codeBarre || currentItem.codeSuivi,
          description:    description || `Défaut détecté: ${typeReclamation.label}`,
          type:           typeReclamation.id,
          matriculeAgent: currentAgent.matricule,
        };
        const res = await fetch(`${API_URL}/api/reclamations`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const txt = await res.text();
          let msg = txt; try { msg = JSON.parse(txt).message || txt; } catch {}
          throw new Error(msg);
        }
        showAlert("⚠️ Réclamation créée", `${typeReclamation.label} signalé pour ${currentItem.codeBarre}`, "warning");
        setReclamationCreee(true);
        setMessageStatut(`⚠️ Réclamation créée: ${typeReclamation.label}`);
        setDialogueItem(null); dialogueItemRef.current = null;
        setIsConfirming(false); setLoading(false);
        return; // ← Ne pas stocker si réclamation
      }

      const payload = {
        matriculeAgent: currentAgent.matricule,
        codeOuTag:      currentItem.codeBarre || currentItem.codeSuivi,
      };
      const res = await fetch(`${API_URL}/api/Arsenals/stock`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const txt = await res.text();
        let msg = txt; try { msg = JSON.parse(txt).message || txt; } catch {}
        throw new Error(msg);
      }
      showAlert("✅ Stockage réussi", `Linge ${currentItem.codeBarre} stocké avec succès`, "success");
      setMessageStatut(`✅ Linge ${currentItem.codeBarre} stocké`);
      setDialogueItem(null); dialogueItemRef.current = null;

    } catch (err) {
      showAlert("Erreur", `❌ ${err.message}`, "error");
      setDialogueItem(null); dialogueItemRef.current = null;
    } finally {
      setLoading(false); setIsConfirming(false);
    }
  }, [isConfirming, showAlert]);

  const fermerDialogue = useCallback(() => {
    setDialogueItem(null); dialogueItemRef.current = null; setMessageStatut("");
  }, []);

  return (
    <StockageContext.Provider value={{
      agent, dialogueItem, reclamationCreee,
      messageStatut, loading, isConfirming,
      scanAgent, deconnecterAgent,
      scanStockage, confirmerControle, fermerDialogue,
    }}>
      {children}
    </StockageContext.Provider>
  );
}