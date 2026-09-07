import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useModal } from "./ModalContext";
import {
  getAgentFromStorage,
  fetchAgentByMatricule,
  createRemise,
  fetchStatutCollecte,
  fetchHistoriqueRemises,
  scanLingeForRemise,
  isCollecteCloturee
} from "../services/remiseLingeService";

export const RemiseLingeContext = createContext();
export const useRemiseLinge = () => useContext(RemiseLingeContext);

export function RemiseLingeProvider({ children }) {
  const { showAlert } = useModal();

  // États
  const [agentRemise, setAgentRemise] = useState(null);
  const [agentCollecte, setAgentCollecte] = useState(null);
  const [remise, setRemise] = useState(null);
  const [collecteId, setCollecteId] = useState(null);
  const [statut, setStatut] = useState(null);
  const [remises, setRemises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState(null);
  const [etape, setEtape] = useState("AGENT_REMISE");

  // ✅ Initialisation de l'agent depuis localStorage
  useEffect(() => {
    const agentData = getAgentFromStorage();
    if (agentData) {
      setAgentRemise(agentData);
      setEtape("AGENT_COLLECTE");
    }
  }, []);

  const scanAgentRemise = useCallback(async (code) => {
    setLoading(true);
    try {
      const agent = await fetchAgentByMatricule(code);
      setAgentRemise(agent);
      setEtape("AGENT_COLLECTE");
      return agent;
    } catch (error) {
      throw new Error(`Agent [${code}] introuvable`);
    } finally {
      setLoading(false);
    }
  }, []);

   const scanAgentCollecte = useCallback(async (code, agentRemiseData) => {
    if (!agentRemiseData) {
      throw new Error("Aucun agent de remise sélectionné");
    }

    setLoading(true);
    try {
      // Récupérer l'agent de collecte
      const agent = await fetchAgentByMatricule(code);
      setAgentCollecte(agent);

      console.log("✅ Agent remise:", agentRemiseData);
      console.log("✅ Agent collecte:", agent);

      // L'API attend: matriculeAgentRemise (String) et id (Long)
      const remiseData = await createRemise(
        agentRemiseData.matricule,  // ✅ matriculeAgentRemise (String)
        agent.id                    // ✅ id (Long) - l'ID du personnel de collecte
      );

      console.log("✅ Remise créée:", remiseData);

      setRemise(remiseData);
      setCollecteId(remiseData.collecte?.id);

      // Charger le statut et l'historique
      await chargerStatut(remiseData.collecte?.id);
      await chargerHistorique(remiseData.collecte?.id);

      setEtape("SCAN");
      return { agent, remise: remiseData };
    } catch (error) {
      console.error("❌ Erreur création remise:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Charger le statut
  const chargerStatut = useCallback(async (id) => {
    if (!id) return null;
    try {
      const data = await fetchStatutCollecte(id);
      setStatut(data);
      return data;
    } catch (error) {
      console.error("Erreur chargement statut:", error);
      return null;
    }
  }, []);

  // ✅ Charger l'historique
  const chargerHistorique = useCallback(async (id) => {
    if (!id) return;
    try {
      const data = await fetchHistoriqueRemises(id);
      setRemises(data);
    } catch (error) {
      console.error("Erreur chargement historique:", error);
    }
  }, []);

  // ✅ Scanner un linge
  const scanLinge = useCallback(async (code) => {
    if (!code?.trim() || !remise?.id || !collecteId) {
      throw new Error("Code invalide ou remise non initialisée");
    }

    if (isCollecteCloturee(statut)) {
      throw new Error("Cette collecte est déjà clôturée");
    }

    setScanStatus({ loading: true, code: code.trim() });

    try {
      const data = await scanLingeForRemise(remise.id, code.trim());

      // Mettre à jour la remise
      if (data.remise) {
        setRemise(data.remise);
      }

      // Recharger le statut et l'historique
      const nouveauStatut = await chargerStatut(collecteId);
      await chargerHistorique(collecteId);

      setScanStatus({
        loading: false,
        success: {
          codeBarre: code.trim(),
          categorie: data.categorie,
          quantiteRemise: data.quantiteRemise,
          quantiteRestante: data.quantiteRestante
        },
        error: null
      });

      return {
        data,
        statut: nouveauStatut,
        isComplete: isCollecteCloturee(nouveauStatut)
      };
    } catch (error) {
      setScanStatus({
        loading: false,
        success: null,
        error: error.message
      });
      throw error;
    }
  }, [remise, collecteId, statut, chargerStatut, chargerHistorique]);

  // ✅ Rafraîchir les données
  const rafraichir = useCallback(async () => {
    if (collecteId) {
      await chargerStatut(collecteId);
      await chargerHistorique(collecteId);
    }
  }, [collecteId, chargerStatut, chargerHistorique]);

  // ✅ Réinitialiser
  const resetAll = useCallback(() => {
    setAgentRemise(null);
    setAgentCollecte(null);
    setRemise(null);
    setCollecteId(null);
    setStatut(null);
    setRemises([]);
    setScanStatus(null);
    setEtape("AGENT_REMISE");
  }, []);

  // ✅ Effacer le statut de scan
  const clearScanStatus = useCallback(() => {
    setScanStatus(null);
  }, []);

  const value = {
    // États
    agentRemise,
    agentCollecte,
    remise,
    collecteId,
    statut,
    remises,
    loading,
    scanStatus,
    etape,
    isCloturee: isCollecteCloturee(statut),
    
    // Actions
    scanAgentRemise,
    scanAgentCollecte,
    scanLinge,
    chargerStatut,
    chargerHistorique,
    rafraichir,
    resetAll,
    clearScanStatus,
  };

  return (
    <RemiseLingeContext.Provider value={value}>
      {children}
    </RemiseLingeContext.Provider>
  );
}