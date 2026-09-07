import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useModal } from "./ModalContext";
import {
  fetchEtapes,
  fetchEtapeById,
  createEtape,
  updateEtape,
  deleteEtape,
  fetchPersonnelsByEtape,
  fetchAllAssociations,
  createAssociation,
  deleteAssociation,
  fetchPersonnelByCode,
  checkAssociationExists
} from "../services/etape/etapeService";

export const EtapeContext = createContext();
export const useEtape = () => useContext(EtapeContext);

export function EtapeProvider({ children }) {
  const { showAlert } = useModal();

  const [etapes, setEtapes] = useState([]);
  const [etapeSelected, setEtapeSelected] = useState(null);
  const [personnels, setPersonnels] = useState([]);
  const [associations, setAssociations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});

  // Charger toutes les étapes
  const loadEtapes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchEtapes();
      setEtapes(data);
    } catch (error) {
      showAlert("Erreur", error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  // Charger les personnels d'une étape
  const loadPersonnels = useCallback(async (lingeEtapeId) => {
    setLoading(true);
    try {
      const data = await fetchPersonnelsByEtape(lingeEtapeId);
      setPersonnels(data);
      return data;
    } catch (error) {
      showAlert("Erreur", error.message, "error");
      return [];
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  // Charger toutes les associations
  const loadAssociations = useCallback(async () => {
    try {
      const data = await fetchAllAssociations();
      setAssociations(data);
      return data;
    } catch (error) {
      showAlert("Erreur", error.message, "error");
      return [];
    }
  }, [showAlert]);

  // Ajouter un personnel à une étape
  const addPersonnelToEtape = useCallback(async (lingeEtapeId, codeBarre) => {
    setLoading(true);
    try {
      // Récupérer le personnel par son code
      const personnel = await fetchPersonnelByCode(codeBarre);
      
      if (!personnel || !personnel.id) {
        throw new Error("Personnel introuvable");
      }

      // Vérifier si l'association existe déjà
      const exists = await checkAssociationExists(personnel.id, lingeEtapeId);
      if (exists) {
        showAlert("Info", "Ce personnel est déjà associé à cette étape", "info");
        return null;
      }

      // Créer l'association
      const association = await createAssociation({
        personnelId: personnel.id,
        lingeEtapeId: lingeEtapeId
      });

      // Recharger les personnels pour l'étape
      await loadPersonnels(lingeEtapeId);
      
      showAlert("Succès", `Personnel ${personnel.nom} ajouté à l'étape`, "success");
      return association;
    } catch (error) {
      showAlert("Erreur", error.message, "error");
      return null;
    } finally {
      setLoading(false);
    }
  }, [showAlert, loadPersonnels]);

  // Retirer un personnel d'une étape
  const removePersonnelFromEtape = useCallback(async (associationId, lingeEtapeId) => {
    setLoading(true);
    try {
      await deleteAssociation(associationId);
      await loadPersonnels(lingeEtapeId);
      showAlert("Succès", "Personnel retiré de l'étape", "success");
    } catch (error) {
      showAlert("Erreur", error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showAlert, loadPersonnels]);

  // Créer une nouvelle étape
  const createNewEtape = useCallback(async (data) => {
    setLoading(true);
    try {
      const newEtape = await createEtape(data);
      await loadEtapes();
      showAlert("Succès", `Étape ${data.nom} créée`, "success");
      return newEtape;
    } catch (error) {
      showAlert("Erreur", error.message, "error");
      return null;
    } finally {
      setLoading(false);
    }
  }, [showAlert, loadEtapes]);

  // Mettre à jour une étape
  const updateExistingEtape = useCallback(async (id, data) => {
    setLoading(true);
    try {
      const updated = await updateEtape(id, data);
      await loadEtapes();
      showAlert("Succès", `Étape ${data.nom} mise à jour`, "success");
      return updated;
    } catch (error) {
      showAlert("Erreur", error.message, "error");
      return null;
    } finally {
      setLoading(false);
    }
  }, [showAlert, loadEtapes]);

  // Supprimer une étape
  const deleteExistingEtape = useCallback(async (id) => {
    setLoading(true);
    try {
      await deleteEtape(id);
      await loadEtapes();
      showAlert("Succès", "Étape supprimée", "success");
      return true;
    } catch (error) {
      showAlert("Erreur", error.message, "error");
      return false;
    } finally {
      setLoading(false);
    }
  }, [showAlert, loadEtapes]);

  // Toggle expansion d'une ligne
  const toggleRow = useCallback(async (id) => {
    const isExpanded = expandedRows[id];
    
    // Si on ouvre, charger les personnels
    if (!isExpanded) {
      await loadPersonnels(id);
      setEtapeSelected(id);
    }
    
    setExpandedRows(prev => ({
      ...prev,
      [id]: !isExpanded
    }));
  }, [expandedRows, loadPersonnels]);

  // Rechercher un personnel
  const searchPersonnel = useCallback(async (code) => {
    try {
      return await fetchPersonnelByCode(code);
    } catch (error) {
      showAlert("Erreur", error.message, "error");
      return null;
    }
  }, [showAlert]);

  // Initialisation
  useEffect(() => {
    loadEtapes();
    loadAssociations();
  }, [loadEtapes, loadAssociations]);

  const value = {
    etapes,
    personnels,
    associations,
    loading,
    expandedRows,
    etapeSelected,
    loadEtapes,
    loadPersonnels,
    loadAssociations,
    addPersonnelToEtape,
    removePersonnelFromEtape,
    createNewEtape,
    updateExistingEtape,
    deleteExistingEtape,
    toggleRow,
    searchPersonnel,
    setEtapeSelected
  };

  return (
    <EtapeContext.Provider value={value}>
      {children}
    </EtapeContext.Provider>
  );
}