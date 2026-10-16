// contextes/StockageContext.js
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useModal } from "./ModalContext";
import { getAgent, isAgentConnected } from "../services/agentService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export const StockageContext = createContext();
export const useStockage = () => useContext(StockageContext);

export function StockageProvider({ children }) {
  const { showAlert } = useModal();

  const [agent, setAgent] = useState(null);
  const [dialogueItem, setDialogueItem] = useState(null);
  const [reclamationCreee, setReclamationCreee] = useState(false);
  const [messageStatut, setMessageStatut] = useState("");
  const [loading, setLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // ✅ Récupérer l'agent depuis localStorage au montage
  useEffect(() => {
    const agentData = getAgent();
    if (agentData && isAgentConnected()) {
      const ag = {
        matricule: agentData.codeBarre || agentData.matricule,
        nom: agentData.nom || "Inconnu",
        prenom: agentData.prenom || "",
        nomPrenom: agentData.nomPrenom || agentData.nom || "Inconnu",
        codeBarre: agentData.codeBarre || agentData.matricule,
        id: agentData.id,
        poste: agentData.poste || "AGENT_STOCKAGE"
      };
      setAgent(ag);
      setMessageStatut(`Agent ${ag.nomPrenom} connecté`);
    }
  }, []);

  // ✅ scanAgent - conservé pour le fallback
  const scanAgent = useCallback(async (code) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/sqlserver/personnel/code?code=${encodeURIComponent(code)}`);
      if (res.ok) {
        const personnel = await res.json();
        const ag = {
          matricule: personnel.codeBarre || code,
          nom: personnel.nom || "Inconnu",
          prenom: personnel.prenom || "",
          nomPrenom: personnel.nomPrenom || personnel.nom || "Inconnu",
          codeBarre: personnel.codeBarre || code,
          id: personnel.id,
          poste: personnel.fonction || "AGENT_STOCKAGE"
        };
        setAgent(ag);
        setMessageStatut(`Agent ${ag.nomPrenom} connecté`);
        showAlert("Agent identifié", `✅ ${ag.nomPrenom} (${ag.codeBarre})`, "success");
        return true;
      }
      showAlert("Agent introuvable", `❌ L'agent [${code}] n'existe pas.`, "error");
      return false;
    } catch {
      showAlert("Erreur réseau", "", "error");
      return false;
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  const deconnecterAgent = useCallback(() => {
    setAgent(null);
    setDialogueItem(null);
    setMessageStatut("");
    setReclamationCreee(false);
  }, []);

  const scanStockage = useCallback(async (code, getLingeByCode) => {
    // ✅ Vérifier si l'agent existe, sinon essayer de le récupérer depuis localStorage
    let currentAgent = agent;
    if (!currentAgent) {
      const agentData = getAgent();
      if (agentData && isAgentConnected()) {
        const ag = {
          matricule: agentData.codeBarre || agentData.matricule,
          nom: agentData.nom || "Inconnu",
          prenom: agentData.prenom || "",
          nomPrenom: agentData.nomPrenom || agentData.nom || "Inconnu",
          codeBarre: agentData.codeBarre || agentData.matricule,
          id: agentData.id,
          poste: agentData.poste || "AGENT_STOCKAGE"
        };
        setAgent(ag);
        currentAgent = ag;
      }
    }

    if (!currentAgent) {
      showAlert("Agent requis", "Scannez votre badge d'abord.", "warning");
      return;
    }

    setLoading(true);
    try {
      const item = await getLingeByCode(code);
      if (!item) {
        showAlert("Erreur", `❌ Code [${code}] inconnu.`, "error");
        return;
      }
      if (item.etat !== "PLIE") {
        showAlert("Attention", `⚠️ Linge [${code}] est en état [${item.etat}]. Attendu: PLIE.`, "warning");
        return;
      }
      setDialogueItem(item);
      setReclamationCreee(false);
      setMessageStatut(`Contrôle qualité pour ${item.codeBarre}`);
    } catch (err) {
      showAlert("Erreur", `❌ ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, [agent, showAlert]);

  const confirmerControle = useCallback(async (typeReclamation, description) => {
    if (isConfirming) return;
    setIsConfirming(true);

    let currentAgent = agent;
    if (!currentAgent) {
      const agentData = getAgent();
      if (agentData && isAgentConnected()) {
        const ag = {
          matricule: agentData.codeBarre || agentData.matricule,
          nom: agentData.nom || "Inconnu",
          prenom: agentData.prenom || "",
          nomPrenom: agentData.nomPrenom || agentData.nom || "Inconnu",
          codeBarre: agentData.codeBarre || agentData.matricule,
          id: agentData.id,
          poste: agentData.poste || "AGENT_STOCKAGE"
        };
        setAgent(ag);
        currentAgent = ag;
      }
    }

    const currentItem = dialogueItem;

    if (!currentItem) {
      showAlert("Erreur", "❌ Aucun linge sélectionné.", "error");
      setIsConfirming(false);
      setDialogueItem(null);
      return;
    }
    if (!currentAgent?.matricule) {
      showAlert("Erreur", "❌ Veuillez scanner votre badge agent.", "error");
      setIsConfirming(false);
      setDialogueItem(null);
      return;
    }

    setLoading(true);
    try {
      if (typeReclamation) {
        const payload = {
          codeOuTag: currentItem.codeBarre || currentItem.codeSuivi,
          description: description || `Défaut détecté: ${typeReclamation.label}`,
          type: typeReclamation.id,
          matriculeAgent: currentAgent.codeBarre,
        };
        const res = await fetch(`${API_URL}/api/reclamations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const txt = await res.text();
          let msg = txt;
          try { msg = JSON.parse(txt).message || txt; } catch {}
          throw new Error(msg);
        }
        showAlert("⚠️ Réclamation créée", `${typeReclamation.label} signalé pour ${currentItem.codeBarre}`, "warning");
        setReclamationCreee(true);
        setMessageStatut(`⚠️ Réclamation créée: ${typeReclamation.label}`);
        setDialogueItem(null);
        setIsConfirming(false);
        setLoading(false);
        return;
      }

      const payload = {
        matriculeAgent: currentAgent.codeBarre,
        codeOuTag: currentItem.codeBarre || currentItem.codeSuivi,
      };
      const res = await fetch(`${API_URL}/api/Arsenals/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const txt = await res.text();
        let msg = txt;
        try { msg = JSON.parse(txt).message || txt; } catch {}
        throw new Error(msg);
      }
      showAlert("✅ Stockage réussi", `Linge ${currentItem.codeBarre} stocké avec succès`, "success");
      setMessageStatut(`✅ Linge ${currentItem.codeBarre} stocké`);
      setDialogueItem(null);

    } catch (err) {
      showAlert("Erreur", `❌ ${err.message}`, "error");
      setDialogueItem(null);
    } finally {
      setLoading(false);
      setIsConfirming(false);
    }
  }, [agent, dialogueItem, isConfirming, showAlert]);

  const fermerDialogue = useCallback(() => {
    setDialogueItem(null);
    setMessageStatut("");
  }, []);

  return (
    <StockageContext.Provider value={{
      agent,
      dialogueItem,
      reclamationCreee,
      messageStatut,
      loading,
      isConfirming,
      scanAgent,
      deconnecterAgent,
      scanStockage,
      confirmerControle,
      fermerDialogue,
    }}>
      {children}
    </StockageContext.Provider>
  );
}