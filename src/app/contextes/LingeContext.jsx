
import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import { useModal } from "./ModalContext";
import { lireErreur } from "../services/integrationService";
import { CATEGORIES_LINGE } from "../constants/categoriesLinge";

export const LingeContext = createContext();

export const LingeProvider = ({ children }) => {
  const [linges, setLinges] = useState([]);
  const [pagedData, setPagedData] = useState({
    content: [],
    totalPages: 0,
    totalElements: 0,
    number: 0,
    size: 10,
  });
  const { showAlert } = useModal() || {};

  const [isRfidMode, setIsRfidMode] = useState(() => {
    const saved = localStorage.getItem("rfidMode");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [categories, setCategories] = useState(CATEGORIES_LINGE);

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

    fetch(`${API_BASE_URL}/api/linges/categories`)
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then(data => Array.isArray(data) && data.length && setCategories(data))
      .catch(err => console.error("Erreur chargement catégories:", err));
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
      if (!res.ok) {
        throw new Error(await lireErreur(res, "Erreur lors de l'ajout du linge"));
      }
      const data = await res.json();
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
        throw new Error(await lireErreur(res, "Erreur lors de la modification"));
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


  const getHistorique = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/linges/historique/code/${id}`);
      return await res.json();
    } catch (err) {
      console.error("Erreur fetch historique :", err);
      return [];
    }
  };

const fetchGlobalHistory = async (
  { page = 0, size = 10, sortBy = "dateOperation", direction = "desc" } = {},
  signal
) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      direction,
    });

    const res = await fetch(
      `${API_BASE_URL}/api/linges/historique/historique-global?${params}`,
      { signal }
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    // Compatibilité : si le backend renvoie un tableau simple (ancien format)
    if (Array.isArray(data)) {
      return {
        data,
        currentPage: 0,
        totalItems: data.length,
        totalPages: 1,
        pageSize: data.length,
        isFirst: true,
        isLast: true,
      };
    }

    return {
      data: data.content ?? [],
      currentPage: data.number ?? 0,
      totalItems: data.totalElements ?? 0,
      totalPages: data.totalPages ?? 0,
      pageSize: data.size ?? size,
      isFirst: data.first ?? true,
      isLast: data.last ?? true,
    };
  } catch (err) {
    if (err.name === "AbortError") return null;
    console.error("Erreur fetch historique global :", err);
    return {
      data: [],
      currentPage: 0,
      totalItems: 0,
      totalPages: 0,
      pageSize: size,
      isFirst: true,
      isLast: true,
    };
  }
};
const fetchPersonnel = async (personnelId) => {
  if (!personnelId) return null;
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/personnel/${personnelId}`,
      { headers: { accept: "*/*" } }
    );
    if (!res.ok) {
      console.warn(`Personnel ${personnelId} introuvable (${res.status})`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`Erreur fetch personnel ${personnelId} :`, err);
    return null;
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


  const formatEPC = (epc) => {
    if (!epc || epc.length !== 24) return epc;
    return epc.match(/.{1,4}/g).join(" ");
  };

  const checkCodeExists = async (code) => {
    if (!code) return false;
    const cleanCode = code.trim();
    const existsInState = linges.some(l => l.codeBarre && l.codeBarre.toLowerCase() === cleanCode.toLowerCase());
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
    
    fetchPersonnel,

    categories,
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