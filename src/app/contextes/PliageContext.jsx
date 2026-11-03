import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useModal } from "./ModalContext";
import { getAgent, isAgentConnected } from "../services/agentService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export const PliageContext = createContext();
export const usePliage = () => useContext(PliageContext);

export function PliageProvider({ children }) {
  const { showAlert } = useModal();

  const [agent,        setAgent]        = useState(null);
  const [dialogueItem, setDialogueItem] = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [rangementItem, setRangementItem] = useState(null); // linge conforme à poser sur l'étagère du service
  const [isConfirming, setIsConfirming] = useState(false);
  // Le contrôle qualité peut se valider seul (compte à rebours) : on évite un double envoi
  const confirmingRef = useRef(false);

  // ✅ Initialiser l'agent depuis localStorage
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
        poste: agentData.poste || "AGENT_PLIAGE"
      };
      setAgent(ag);
    }
  }, []);

  // ✅ scanAgent - conservé pour le fallback (si on veut scanner un badge)
  const scanAgent = useCallback(async (code) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/personnel/code/${encodeURIComponent(code)}`);
      if (res.ok) {
        const personnel = await res.json();
        const ag = {
          matricule: personnel.codeBarre || code,
          nom: personnel.nom || "Inconnu",
          prenom: personnel.prenom || "",
          nomPrenom: personnel.nomPrenom || personnel.nom || "Inconnu",
          codeBarre: personnel.codeBarre || code,
          id: personnel.id,
          poste: personnel.fonction || "AGENT_PLIAGE"
        };
        setAgent(ag);
        showAlert("Agent identifié", `✅ ${ag.nomPrenom || ag.nom} (${ag.codeBarre || ag.matricule})`, "success");
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
    setRangementItem(null);
  }, []);

  const scanPliage = useCallback(async (code, getLingeByCode) => {
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
          poste: agentData.poste || "AGENT_PLIAGE"
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
      if (item.etat !== "SECHE") {
        showAlert("Attention", `⚠️ Linge [${code}] est en état [${item.etat}]. Attendu: SECHE.`, "warning");
        return;
      }

      const res = await fetch(`${API_URL}/api/pliage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          matriculeAgent: currentAgent.codeBarre || currentAgent.matricule, 
          codeOuTag: code 
        })
      });
      
      if (!res.ok) {
        const txt = await res.text();
        let msg = txt;
        try { msg = JSON.parse(txt).message || txt; } catch {}
        throw new Error(msg);
      }
      // Linge plié → contrôle qualité (ancienne étape Stockage)
      setRangementItem(null);
      setDialogueItem(item);
    } catch (err) {
      showAlert("Erreur pliage", `❌ ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, [agent, showAlert]);

  /**
   * Résultat du contrôle qualité :
   * - défaut sélectionné → réclamation, le linge ne part pas en étagère
   * - conforme → consigne de rangement sur l'étagère de son service (buanderie)
   */
  const confirmerControle = useCallback(async (typeReclamation, description) => {
    const currentItem = dialogueItem;
    if (!currentItem || confirmingRef.current) return;
    confirmingRef.current = true;
    setIsConfirming(true);

    try {
      if (typeReclamation) {
        const res = await fetch(`${API_URL}/api/reclamations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            codeOuTag: currentItem.codeBarre || currentItem.codeSuivi,
            description: description || `Défaut détecté: ${typeReclamation.label}`,
            type: typeReclamation.id,
            matriculeAgent: agent?.codeBarre || agent?.matricule,
          }),
        });
        if (!res.ok) {
          const txt = await res.text();
          let msg = txt;
          try { msg = JSON.parse(txt).message || txt; } catch { /* réponse texte brute */ }
          throw new Error(msg);
        }
        showAlert("⚠️ Réclamation créée", `${typeReclamation.label} signalé pour ${currentItem.codeBarre}`, "warning");
      } else {
        setRangementItem(currentItem);
      }
      setDialogueItem(null);
    } catch (err) {
      showAlert("Erreur", `❌ ${err.message}`, "error");
      setDialogueItem(null);
    } finally {
      confirmingRef.current = false;
      setIsConfirming(false);
    }
  }, [agent, dialogueItem, showAlert]);

  const fermerDialogue = useCallback(() => setDialogueItem(null), []);
  const fermerRangement = useCallback(() => setRangementItem(null), []);

  return (
    <PliageContext.Provider value={{
      agent, dialogueItem, rangementItem, loading, isConfirming,
      scanAgent, deconnecterAgent, scanPliage, confirmerControle, fermerDialogue, fermerRangement,
    }}>
      {children}
    </PliageContext.Provider>
  );
}