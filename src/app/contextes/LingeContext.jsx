
import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import { useModal } from "./ModalContext";
import Swal from 'sweetalert2';

export const CATEGORIES = [
  "DRAP",
  "TAIE_OREILLER",
  "SERVIETTE_BAIN",
  "SERVIETTE_VISAGE",
  "PEIGNOIR",
  "NAPPE",
  "SERVIETTE_TABLE",
  "UNIFORME",
  "AUTRE"
];

export const LingeContext = createContext();

export const LingeProvider = ({ children }) => {
  // ─── ÉTATS PRINCIPAUX ────────────────────────────────────────────────────
  const [linges, setLinges] = useState([]);
  const [pagedData, setPagedData] = useState({
    content: [],
    totalPages: 0,
    totalElements: 0,
    number: 0,
    size: 10,
  });
  const { showAlert } = useModal() || {};

  // ─── MODE RFID ──────────────────────────────────────────────────────────
  const [isRfidMode, setIsRfidMode] = useState(() => {
    const saved = localStorage.getItem("rfidMode");
    return saved !== null ? JSON.parse(saved) : true;
  });

  // ─── ÉTATS D'IMPORT ─────────────────────────────────────────────────────
  const [lingesToImport, setLingesToImport] = useState([]);
  const [selectedImportLinges, setSelectedImportLinges] = useState([]);
  const [isImportLoading, setIsImportLoading] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importType, setImportType] = useState('LINGE');
  const [importPagination, setImportPagination] = useState({
    currentPage: 0,
    itemsPerPage: 50,
    totalPages: 0,
    totalElements: 0,
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';

  // ─── PERSISTANCE RFID ────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("rfidMode", JSON.stringify(isRfidMode));
  }, [isRfidMode]);

  // ─── CHARGEMENT INITIAL ─────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/linges`)
      .then(res => res.json())
      .then(data => setLinges(Array.isArray(data) ? data : []))
      .catch(err => console.error("Erreur chargement linges:", err));
  }, [API_BASE_URL]);

  // ════════════════════════════════════════════════════════════════════════
  // ─── CRUD LINGES ──────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════

  // ─── Ajouter un linge ──────────────────────────────────────────────────
  const addLinge = async (linge) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/linges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linge),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erreur lors de l'ajout du linge");
      }
      setLinges(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error("Erreur ajout linge :", err);
      if (showAlert) showAlert("Erreur", "Erreur lors de l'ajout du linge : " + err.message, "error");
      else alert("Erreur lors de l'ajout du linge : " + err.message);
      return null;
    }
  };

  // ─── Supprimer un linge ────────────────────────────────────────────────
  const deleteLinge = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/linges/${id}`, { method: "DELETE" });
      if (res.ok) {
        setLinges(prev => prev.filter(l => l.id !== id));
        setPagedData(prev => ({
          ...prev,
          content: prev.content.filter(l => l.id !== id),
          totalElements: prev.totalElements - 1,
        }));
        return true;
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (showAlert) showAlert("Erreur Suppression", errorData.message || "Le serveur a renvoyé une erreur", "error");
        else alert("Erreur lors de la suppression : " + (errorData.message || "Le serveur a renvoyé une erreur"));
        return false;
      }
    } catch (err) {
      console.error("Erreur suppression linge :", err);
      if (showAlert) showAlert("Erreur Réseau", "Erreur réseau lors de la suppression", "error");
      else alert("Erreur réseau lors de la suppression");
      return false;
    }
  };

  // ─── Mettre à jour un linge ────────────────────────────────────────────
  const updateLinge = async (id, updatedLinge) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/linges/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedLinge),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erreur lors de la modification");
      }
      const data = await res.json();
      setLinges(prev => prev.map(l => (l.id === id ? data : l)));
      setPagedData(prev => ({
        ...prev,
        content: prev.content.map(l => (l.id === id ? data : l)),
      }));
      return data;
    } catch (err) {
      console.error("Erreur modification linge :", err);
      if (showAlert) showAlert("Erreur Modification", err.message, "error");
      else alert("Erreur lors de la modification : " + err.message);
      throw err;
    }
  };

  // ════════════════════════════════════════════════════════════════════════
  // ─── GESTION DES ÉTATS ──────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════

  // ─── Mise à jour groupée des états ────────────────────────────────────
  const updateEtatsBulk = async (ids, nouvelEtat, utilisateurId = null, remarques = "", programmeLavage = "", bacId = null, programmeSechage = "") => {
    try {
      let url = `${API_BASE_URL}/api/linges/bulk-etat?nouvelEtat=${nouvelEtat}`;
      if (utilisateurId) url += `&utilisateurId=${utilisateurId}`;
      if (remarques) url += `&remarques=${encodeURIComponent(remarques)}`;
      if (programmeLavage) url += `&programmeLavage=${encodeURIComponent(programmeLavage)}`;
      if (programmeSechage) url += `&programmeSechage=${encodeURIComponent(programmeSechage)}`;
      if (bacId) url += `&bacId=${bacId}`;

      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erreur lors de la mise à jour groupée");
      }

      if (Array.isArray(data)) {
        setLinges(prev => prev.map(l => {
          const updated = data.find(u => u.id === l.id);
          return updated ? updated : l;
        }));
        setPagedData(prev => ({
          ...prev,
          content: prev.content.map(l => {
            const updated = data.find(u => u.id === l.id);
            return updated ? updated : l;
          }),
        }));
      }

      return data;
    } catch (err) {
      console.error("Erreur mise à jour bulk :", err);
      if (showAlert) showAlert("Erreur Bulk", err.message, "error");
      else alert("Erreur lors de la mise à jour groupée : " + err.message);
      return null;
    }
  };

  // ─── Mise à jour d'un état individuel ──────────────────────────────────
  const updateEtat = async (id, newEtat, utilisateurId = null, remarques = "", programmeLavage = "", bacId = null, programmeSechage = "") => {
    const linge = linges.find(l => l.id === id);
    if (!linge) return;

    try {
      let url = `${API_BASE_URL}/api/linges/${id}/changer-etat?nouvelEtat=${newEtat}`;
      if (utilisateurId) url += `&utilisateurId=${utilisateurId}`;
      if (remarques) url += `&remarques=${encodeURIComponent(remarques)}`;
      if (programmeLavage) url += `&programmeLavage=${encodeURIComponent(programmeLavage)}`;
      if (programmeSechage) url += `&programmeSechage=${encodeURIComponent(programmeSechage)}`;
      if (bacId) url += `&bacId=${bacId}`;

      const res = await fetch(url, { method: "PUT" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erreur lors du changement d'état");
      }

      setLinges(prev => prev.map(l => (l.id === id ? data : l)));
      setPagedData(prev => ({
        ...prev,
        content: prev.content.map(l => (l.id === id ? data : l)),
      }));
      return data;
    } catch (err) {
      console.error("Erreur mise à jour état :", err);
      if (showAlert) showAlert("Erreur État", err.message, "error");
      else alert("Erreur lors du changement d'état : " + err.message);
      throw err;
    }
  };

  // ════════════════════════════════════════════════════════════════════════
  // ─── RECHERCHE ET HISTORIQUE ────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════

  // ─── Obtenir l'historique d'un linge ──────────────────────────────────
  const getHistorique = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/linges/historique/code/${id}`);
      return await res.json();
    } catch (err) {
      console.error("Erreur fetch historique :", err);
      return [];
    }
  };

  // ─── Historique global ──────────────────────────────────────────────────
  const fetchGlobalHistory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/linges/historique/historique-global`);
      return await res.json();
    } catch (err) {
      console.error("Erreur fetch historique global :", err);
      return [];
    }
  };

  // ─── Récupérer un linge par son code ──────────────────────────────────
  const getLingeByCode = async (code) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/linges/barcode/${encodeURIComponent(code)}`);
      if (!res.ok) { return null; }
      return await res.json();
    } catch (err) {
      console.error("Erreur fetch par code :", err);
      return null;
    }
  };

  // ════════════════════════════════════════════════════════════════════════
  // ─── RFID ─────────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════

  // ─── Formater un EPC RFID ──────────────────────────────────────────────
  const formatEPC = (epc) => {
    if (!epc || epc.length !== 24) return epc;
    return epc.match(/.{1,4}/g).join(" ");
  };

  // ─── Vérifier si un code existe déjà ──────────────────────────────────
  const checkCodeExists = async (code) => {
    if (!code) return false;
    const cleanCode = code.trim();
    const existsInState = linges.some(l => l.codeSuivi && l.codeSuivi.toLowerCase() === cleanCode.toLowerCase());
    if (existsInState) return true;

    try {
      const res = await fetch(`${API_BASE_URL}/api/linges/exists/${encodeURIComponent(cleanCode)}`);
      if (res.ok) {
        const exists = await res.json();
        return exists === true;
      }
    } catch (err) {
      console.error("Erreur vérification code:", err);
    }
    return false;
  };

  // ─── Associer un tag RFID à un linge ──────────────────────────────────
  const associerTagRfid = useCallback(async (codeBarre, rfidTag) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/linges/associer-rfid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codeBarre: codeBarre,
          codeRfid: rfidTag
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l'association RFID");
      }

      const data = await response.json();

      // Mettre à jour le linge dans la liste locale
      setLinges(prevLinges =>
        prevLinges.map(l =>
          l.codeBarre === codeBarre ? { ...l, rfidTag: rfidTag } : l
        )
      );

      setPagedData(prev => ({
        ...prev,
        content: prev.content.map(l =>
          l.codeBarre === codeBarre ? { ...l, rfidTag: rfidTag } : l
        )
      }));

      return data;
    } catch (error) {
      console.error("Erreur lors de l'association RFID:", error);
      throw error;
    }
  }, [API_BASE_URL]);

  // ─── Vérifier si un tag RFID existe ────────────────────────────────────
  const checkRfidExists = useCallback(async (rfidTag) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/linges/check-rfid?rfidTag=${encodeURIComponent(rfidTag)}`);
      if (!response.ok) {
        return false;
      }
      const data = await response.json();
      return data.exists || false;
    } catch (error) {
      console.error("Erreur lors de la vérification RFID:", error);
      return false;
    }
  }, [API_BASE_URL]);

  // ─── Récupérer un linge par son tag RFID ──────────────────────────────
  const getLingeByRfid = useCallback(async (rfidTag) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/linges/rfid/${encodeURIComponent(rfidTag)}`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erreur lors de la recherche par RFID:", error);
      return null;
    }
  }, [API_BASE_URL]);

  // ─── Mettre à jour le statut RFID d'un linge ──────────────────────────
  const updateLingeRfidStatus = useCallback((codeBarre, rfidTag) => {
    setLinges(prevLinges =>
      prevLinges.map(l =>
        l.codeBarre === codeBarre ? { ...l, rfidTag: rfidTag } : l
      )
    );
    setPagedData(prev => ({
      ...prev,
      content: prev.content.map(l =>
        l.codeBarre === codeBarre ? { ...l, rfidTag: rfidTag } : l
      )
    }));
  }, []);

  // ════════════════════════════════════════════════════════════════════════
  // ─── PAGINATION ──────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════

  // ─── Récupérer les linges paginés ──────────────────────────────────────
  const fetchLingesPaged = useCallback(async (page = 0, size = 10, filters = {}) => {
    try {
      const params = new URLSearchParams({ page, size });
      if (filters.categorie) params.append("categorie", filters.categorie);
      if (filters.etat) params.append("etat", filters.etat);
      if (filters.serviceId) params.append("serviceId", filters.serviceId);
      if (filters.search) params.append("search", filters.search);

      const res = await fetch(`${API_BASE_URL}/api/linges/paged?${params.toString()}`);

      if (!res.ok) throw new Error("Erreur lors de la récupération paginée");
      const data = await res.json();
      setPagedData(data);
      return data;
    } catch (err) {
      console.error("Erreur fetchLingesPaged :", err);
      const emptyData = { content: [], totalPages: 0, totalElements: 0, number: 0, size: size };
      setPagedData(emptyData);
      return emptyData;
    }
  }, [API_BASE_URL]);

  // ════════════════════════════════════════════════════════════════════════
  // ─── IMPORT ──────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════

  // ─── Charger les linges à importer ─────────────────────────────────────
  const loadLingesToImport = useCallback(async (page = 0, size = 50) => {
    setIsImportLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/linges/a-importer?page=${page}&size=${size}`);
      if (!response.ok) throw new Error('Erreur lors du chargement des linges à importer');
      const data = await response.json();
      
      setLingesToImport(data.content || []);
      setImportPagination({
        currentPage: data.number || 0,
        itemsPerPage: data.size || 50,
        totalPages: data.totalPages || 0,
        totalElements: data.totalElements || 0,
      });
      return data;
    } catch (error) {
      console.error('❌ Erreur chargement linges à importer:', error);
      Swal.fire({
        title: '❌ Erreur',
        text: error.message || 'Impossible de charger les linges à importer',
        icon: 'error',
      });
      return null;
    } finally {
      setIsImportLoading(false);
    }
  }, [API_BASE_URL]);

  // ─── Importer les linges sélectionnés ──────────────────────────────────
  const importLinges = useCallback(async (payload) => {
    if (!payload || payload.length === 0) {
      Swal.fire({
        title: '⚠️ Aucune sélection',
        text: 'Veuillez sélectionner au moins un linge à importer',
        icon: 'warning',
      });
      return null;
    }

    setIsImportLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/linges/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Erreur lors de l\'import');
      }

      const result = await response.json();
      
      Swal.fire({
        title: '✅ Import réussi',
        text: `${result.length || payload.length} linge(s) importé(s) avec succès`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });

      // Fermer le modal et recharger la liste
      setIsImportModalOpen(false);
      setSelectedImportLinges([]);
      await fetchLingesPaged(0, 10, {});
      
      return result;
    } catch (error) {
      console.error('❌ Erreur import:', error);
      Swal.fire({
        title: '❌ Erreur d\'import',
        text: error.message || 'Une erreur est survenue lors de l\'import',
        icon: 'error',
      });
      throw error;
    } finally {
      setIsImportLoading(false);
    }
  }, [API_BASE_URL, fetchLingesPaged]);

  // ─── Sélectionner/désélectionner un linge pour l'import ──────────────
  const toggleImportSelection = useCallback((id) => {
    setSelectedImportLinges(prev => {
      const exists = prev.some(item => item.id === id);
      if (exists) {
        return prev.filter(item => item.id !== id);
      } else {
        // Récupérer les infos du linge depuis la liste
        const linge = lingesToImport.find(l => l.id === id);
        return [...prev, { 
          id: id, 
          categorie: linge?.categorie || 'AUTRE' 
        }];
      }
    });
  }, [lingesToImport]);

  // ─── Sélectionner tous les linges pour l'import ───────────────────────
  const selectAllImportLinges = useCallback(() => {
    if (selectedImportLinges.length === lingesToImport.length) {
      setSelectedImportLinges([]);
    } else {
      const all = lingesToImport.map(l => ({
        id: l.id,
        categorie: l.categorie || 'AUTRE',
      }));
      setSelectedImportLinges(all);
    }
  }, [lingesToImport, selectedImportLinges]);

  // ─── Réinitialiser la sélection d'import ──────────────────────────────
  const resetImportSelection = useCallback(() => {
    setSelectedImportLinges([]);
  }, []);

  // ─── Réinitialiser tout l'état d'import ───────────────────────────────
  const resetImportState = useCallback(() => {
    setLingesToImport([]);
    setSelectedImportLinges([]);
    setIsImportLoading(false);
    setIsImportModalOpen(false);
    setImportPagination({
      currentPage: 0,
      itemsPerPage: 50,
      totalPages: 0,
      totalElements: 0,
    });
  }, []);

  // ════════════════════════════════════════════════════════════════════════
  // ─── VALEUR DU CONTEXTE ─────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════

  const value = {
    // États principaux
    linges,
    setLinges,
    pagedData,
    setPagedData,
    
    // Mode RFID
    isRfidMode,
    setIsRfidMode,
    
    // CRUD
    addLinge,
    deleteLinge,
    updateLinge,
    
    // Gestion des états
    updateEtat,
    updateEtatsBulk,
    
    // Recherche et historique
    getHistorique,
    getLingeByCode,
    fetchGlobalHistory,
    
    // RFID
    formatEPC,
    checkCodeExists,
    associerTagRfid,
    checkRfidExists,
    getLingeByRfid,
    updateLingeRfidStatus,
    
    // Pagination
    fetchLingesPaged,
    
    // IMPORT
    lingesToImport,
    selectedImportLinges,
    isImportLoading,
    isImportModalOpen,
    setIsImportModalOpen,
    importType,
    setImportType,
    importPagination,
    loadLingesToImport,
    importLinges,
    toggleImportSelection,
    selectAllImportLinges,
    resetImportSelection,
    resetImportState,
  };

  return (
    <LingeContext.Provider value={value}>
      {children}
    </LingeContext.Provider>
  );
};

export const useLingeContext = () => {
  const context = useContext(LingeContext);
  if (!context) {
    throw new Error('useLingeContext must be used within a LingeProvider');
  }
  return context;
};