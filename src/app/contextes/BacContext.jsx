import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export const BacContext = createContext();
export const useBac = () => useContext(BacContext);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';
const API      = `${API_BASE_URL}/api/bacs`;
const API_SVC  = `${API_BASE_URL}/api/bacs/bac/service`;

export default function BacProvider({ children }) {
  const [bacs,    setBacs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchBacs = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(API);
      const data = await res.json();
      setBacs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Erreur chargement bacs");
      console.error("Erreur fetch bacs :", err);
    } finally { setLoading(false); }
  }, [API]); // Ajout de API comme dépendance

  const addBac = useCallback(async (bac) => {
    try {
      const res  = await fetch(API, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(bac) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur ajout");
      setBacs(prev => [...prev, data]);
      return { success:true, data };
    } catch (err) {
      console.error("Erreur ajout bac :", err);
      return { success:false, error:err.message };
    }
  }, [API]);

  const updateBac = useCallback(async (id, bac) => {
    try {
      const res  = await fetch(`${API}/${id}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(bac) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur update");
      setBacs(prev => prev.map(b => b.id === id ? data : b));
      return { success:true, data };
    } catch (err) {
      console.error("Erreur update bac :", err);
      return { success:false, error:err.message };
    }
  }, [API]);

  const deleteBac = useCallback(async (id) => {
    try {
      const res = await fetch(`${API}/${id}`, { method:"DELETE" });
      if (!res.ok) throw new Error("Erreur suppression");
      setBacs(prev => prev.filter(b => b.id !== id));
      return { success:true };
    } catch (err) {
      console.error("Erreur delete bac :", err);
      return { success:false, error:err.message };
    }
  }, [API]);

  // ── Consultation locale (sans appel API) ──────────────────────────────────
  const getBacById = useCallback((id) =>
    bacs.find(b => b.id === id || b.id === Number(id)) || null
  , [bacs]);

  const getBacByCode = useCallback((code) =>
    bacs.find(b => b.code === code || b.codeBac === code) || null
  , [bacs]);

  const getBacsByService = useCallback((serviceId) =>
    bacs.filter(b => b.service?.id === serviceId || b.service?.id === Number(serviceId))
  , [bacs]);

  const getBacBlancByService = useCallback((serviceId) =>
    bacs.find(b =>
      (b.service?.id === serviceId || b.service?.id === Number(serviceId)) &&
      (b.typebac === "BLANC" || b.typeCollecte === "BLANC")
    ) || null
  , [bacs]);

  const getBacInfecteByService = useCallback((serviceId) =>
    bacs.find(b =>
      (b.service?.id === serviceId || b.service?.id === Number(serviceId)) &&
      (b.typebac === "INFECTE" || b.typeCollecte === "INFECTE")
    ) || null
  , [bacs]);

  // ── Consultation API (données fraîches) ───────────────────────────────────
  const fetchBacsByService = useCallback(async (serviceId) => {
    try {
      const res = await fetch(`${API_SVC}/${serviceId}`);
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error("Erreur fetchBacsByService :", err);
      return [];
    }
  }, [API_SVC]);

  const fetchBacByCode = useCallback(async (code) => {
    try {
      const res = await fetch(`${API}/code/${code}`);
      if (!res.ok) return null;
      const data = await res.json();
      setBacs(prev => {
        const idx = prev.findIndex(b => b.id === data.id);
        if (idx === -1) return [...prev, data];
        const next = [...prev]; next[idx] = data; return next;
      });
      return data;
    } catch (err) {
      console.error("Erreur fetchBacByCode :", err);
      return null;
    }
  }, [API]);

  const updateEtatBac = useCallback(async (id, nouvelEtat) => {
    try {
      const res  = await fetch(`${API}/${id}/etat?etat=${nouvelEtat}`, { method:"PUT" });
      if (!res.ok) throw new Error("Erreur update état");
      const data = await res.json();
      setBacs(prev => prev.map(b => b.id === id ? data : b));
      return { success:true, data };
    } catch (err) {
      console.error("Erreur updateEtatBac :", err);
      return { success:false, error:err.message };
    }
  }, [API]);

  // ── Computed ──────────────────────────────────────────────────────────────
  const bacsBlancs   = bacs.filter(b => b.typebac === "BLANC"   || b.typeCollecte === "BLANC");
  const bacsInfectes = bacs.filter(b => b.typebac === "INFECTE" || b.typeCollecte === "INFECTE");
  const bacsEnTri    = bacs.filter(b => b.etat === "EN_TRI");
  const bacsDispos   = bacs.filter(b => b.etat === "EN_ATTENTE_COLLECTE" || b.etat === "DISPONIBLE");

  useEffect(() => { fetchBacs(); }, [fetchBacs]);

  return (
    <BacContext.Provider value={{
      bacs, loading, error,
      fetchBacs, addBac, updateBac, deleteBac,
      getBacById, getBacByCode, getBacsByService,
      getBacBlancByService, getBacInfecteByService,
      fetchBacsByService, fetchBacByCode, updateEtatBac,
      bacsBlancs, bacsInfectes, bacsEnTri, bacsDispos,
    }}>
      {children}
    </BacContext.Provider>
  );
}