import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import { useModal } from "./ModalContext";

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
  const [linges, setLinges] = useState([]);
  const [pagedData, setPagedData] = useState({
    content: [],
    totalPages: 0,
    totalElements: 0,
    number: 0,
  });
  const { showAlert } = useModal() || {};

  const [isRfidMode, setIsRfidMode] = useState(() => {
    const saved = localStorage.getItem("rfidMode");
    return saved !== null ? JSON.parse(saved) : true;
  });


  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';

  useEffect(() => {
    localStorage.setItem("rfidMode", JSON.stringify(isRfidMode));
  }, [isRfidMode]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/linges`)
      .then(res => res.json())
      .then(data => setLinges(Array.isArray(data) ? data : []))
      .catch(err => console.error("Erreur chargement linges:", err));
  }, [API_BASE_URL]);

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
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (showAlert) showAlert("Erreur Suppression", errorData.message || "Le serveur a renvoyé une erreur", "error");
        else alert("Erreur lors de la suppression : " + (errorData.message || "Le serveur a renvoyé une erreur"));
      }
    } catch (err) {
      console.error("Erreur suppression linge :", err);
      if (showAlert) showAlert("Erreur Réseau", "Erreur réseau lors de la suppression", "error");
      else alert("Erreur réseau lors de la suppression");
    }
  };

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
    } catch (err) {
      console.error("Erreur modification linge :", err);
      if (showAlert) showAlert("Erreur Modification", err.message, "error");
      else alert("Erreur lors de la modification : " + err.message);
    }
  };

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
      } else {
        console.warn("La réponse du serveur n'est pas un tableau :", data);
      }

      return data;
    } catch (err) {
      console.error("Erreur mise à jour bulk :", err);
      if (showAlert) showAlert("Erreur Bulk", err.message, "error");
      else alert("Erreur lors de la mise à jour groupée : " + err.message);
      return null;
    }
  };

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
    } catch (err) {
      console.error("Erreur mise à jour état :", err);
      if (showAlert) showAlert("Erreur État", err.message, "error");
      else alert("Erreur lors du changement d'état : " + err.message);
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

  const fetchGlobalHistory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/linges/historique/historique-global`);
      return await res.json();
    } catch (err) {
      console.error("Erreur fetch historique global :", err);
      return [];
    }
  };

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

  // ─── Associer un tag RFID à un linge existant ──────────────────────────────
  const associerTagRfid = useCallback(async (codeBarre, rfidTag) => {
    try {
      const response = await fetch(`${API_BASE_URL}/linges/associer-rfid`, {
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

      // Mettre à jour pagedData
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
      const emptyData = { content: [], totalPages: 0, totalElements: 0, number: 0 };
      setPagedData(emptyData);
      return emptyData;
    }
  }, [API_BASE_URL]);

  return (
    <LingeContext.Provider value={{
      linges,
      setLinges,
      pagedData,
      setPagedData,
      addLinge,
      deleteLinge,
      updateLinge,
      updateEtat,
      updateEtatsBulk,
      getHistorique,
      getLingeByCode,
      fetchGlobalHistory,
      formatEPC,
      isRfidMode,
      setIsRfidMode,
      fetchLingesPaged,
      checkCodeExists,
      associerTagRfid,
      checkRfidExists,
      getLingeByRfid,
      updateLingeRfidStatus,
    }}>
      {children}
    </LingeContext.Provider>
  );
};