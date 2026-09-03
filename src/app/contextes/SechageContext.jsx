import React, { createContext, useContext, useState, useCallback } from "react";
import { useModal } from "./ModalContext";


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';
const API_BASE = `${API_URL}/api`;

export const SechageContext = createContext();
export const useSechage = () => useContext(SechageContext);

export function SechageProvider({ children }) {
  const { showAlert, showConfirm } = useModal();

  const [agent,            setAgent]            = useState(null);
  const [etape,            setEtape]            = useState("MACHINE"); 
  const [machine,          setMachine]          = useState(null);
  const [lotsDisponibles,  setLotsDisponibles]  = useState([]);
  const [lotsSelectionnes, setLotsSelectionnes] = useState([]);
  const [cycleId,          setCycleId]          = useState(null);
  const [cycleInfo,        setCycleInfo]        = useState(null);
  const [loadingLots,      setLoadingLots]      = useState(false);
  const [lotDialog,        setLotDialog]        = useState(null);
  const [loading,          setLoading]          = useState(false);

 const identifierAgent = useCallback(async (code) => {
  setLoading(true);

  try {
    const r = await fetch(
      `${API_URL}/api/sqlserver/personnel/code/${code}?code=${encodeURIComponent(code)}`
    );

    if (r.ok) {
      setAgent(await r.json());
      return true;
    }

    showAlert("❌ Agent introuvable", code, "error");
    return false;

  } catch {
    showAlert("Erreur réseau", "", "error");
    return false;

  } finally {
    setLoading(false);
  }
}, [showAlert]);

  const scannerMachine = useCallback(async (code) => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/machines/code/${code}`);
      if (!r.ok) { showAlert("❌ Machine introuvable", code, "error"); return false; }
      const m = await r.json();
      if (m.type !== "SECHEUR" && m.type !== "LAVEUR_SECHEUR") {
        showAlert("⚠️ Machine incompatible",
          `[${code}] est de type ${m.type}. Utilisez un SECHEUR.`, "warning");
        return false;
      }
      if (m.etat === "EN_COURS") {
        showAlert("⚠️ Machine occupée", `${code} est déjà en cours.`, "warning");
        return false;
      }
      setMachine(m); setEtape("LOTS"); await chargerLots(); return true;
    } catch { showAlert("Erreur réseau", "", "error"); return false; }
    finally { setLoading(false); }
  }, [showAlert]);

  const chargerLots = useCallback(async () => {
    setLoadingLots(true);
    try {
      const r = await fetch(`${API_URL}/api/lots`);
      if (r.ok) {
        const tous = await r.json();
        setLotsDisponibles(tous.filter(l => l.etat === "LAVE" || l.etat === "EN_TRI" || l.etat === "PRET_SECHAGE"));
      console.log("la liste de slots disponible est ================= ",tous)
      }
    } catch {} finally { setLoadingLots(false); }
  }, []);

  const scannerLot = useCallback(async (code, poidsActuel) => {
    if (!code?.trim()) return;
    setLoading(true);
    try {
      if (lotsSelectionnes.find(ls => ls.lot.codeLot === code)) {
        showAlert("⚠️ Déjà ajouté", `LOT ${code} est déjà dans le chargement.`, "info"); return;
      }
      const lot = lotsDisponibles.find(l => l.codeLot === code);
      if (!lot) { showAlert("❌ Lot introuvable", code, "error"); return; }
      if (machine && poidsActuel + (lot.poidsActuel||0) > machine.capaciteKg) {
        showAlert("⚠️ Capacité dépassée", `Machine pleine (${machine.capaciteKg} kg).`, "warning"); return;
      }
      const rInfo = await fetch(`${API_BASE}/sechage/scan-lot/${code}`);
      const lotInfo = rInfo.ok ? await rInfo.json() : null;
      setLotDialog({ lotInfo, lot });
    } catch { showAlert("Erreur réseau", "", "error"); }
    finally { setLoading(false); }
  }, [lotsDisponibles, lotsSelectionnes, machine, showAlert]);

  const confirmerAjoutLot = useCallback((lot, scanInfo) => {
    setLotsSelectionnes(prev => [...prev, { lot, scanInfo }]);
    setLotDialog(null);
  }, []);

  const retirerLot = useCallback((codeLot) => {
    setLotsSelectionnes(prev => prev.filter(ls => ls.lot.codeLot !== codeLot));
  }, []);

  const demarrerSechage = useCallback(async (poidsTotal) => {
    if (!lotsSelectionnes.length) {
      showAlert("⚠️ Aucun lot", "Sélectionnez au moins un lot.", "warning"); return;
    }
    const ok = await showConfirm("Démarrer le séchage",
      `${lotsSelectionnes.length} lot(s) — ${poidsTotal.toFixed(1)} kg\nMachine : ${machine?.code}`, "question");
    if (!ok) return;
    setLoading(true);
    try {
      const premier = lotsSelectionnes[0];
      const r = await fetch(
        `${API_BASE}/sechage/start?codeMachine=${machine.code}&codeLot=${premier.lot.codeLot}&matriculeAgent=${agent.matricule}&poidsCharge=${premier.lot.poidsActuel||0}`,
        { method: "POST" }
      );
      if (!r.ok) { const e = await r.json(); throw new Error(e.message||"Erreur démarrage"); }
      const cycle = await r.json();
      setCycleId(cycle.id);
      const info = lotsSelectionnes[0]?.scanInfo;
      setCycleInfo({
        dateDebut: new Date().toISOString(),
        dureePrevue: info?.duree||null,
        programme: info?.programmeRecommande||"—",
        temperature: info?.temperature||"—",
        niveauHumidite: info?.niveauHumidite||"—",
      });
      for (let i=1; i<lotsSelectionnes.length; i++) {
        const ls = lotsSelectionnes[i];
        await fetch(`${API_BASE}/sechage/${cycle.id}/add-lot?codeLot=${ls.lot.codeLot}&poidsCharge=${ls.lot.poidsActuel||0}`,
          { method: "POST" });
      }
      setEtape("EN_COURS");
      showAlert("🌬️ Séchage démarré", `Cycle #${cycle.id} en cours`, "success");
    } catch(err) { showAlert("❌ Erreur", err.message, "error"); }
    finally { setLoading(false); }
  }, [lotsSelectionnes, machine, agent, showAlert, showConfirm]);

  const terminerSechage = useCallback(async () => {
    const ok = await showConfirm("Fin du séchage", `Terminer le cycle #${cycleId} ?`, "question");
    if (!ok) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/sechage/${cycleId}/finish`, { method: "PUT" });
      if (!r.ok) throw new Error("Erreur fin de cycle");
      setEtape("TERMINE"); setCycleInfo(null);
      showAlert("✅ Séchage terminé", `Cycle #${cycleId} — linges SECHE`, "success");
    } catch(err) { showAlert("❌ Erreur", err.message, "error"); }
    finally { setLoading(false); }
  }, [cycleId, showAlert, showConfirm]);

  const nouveauCycle = useCallback(() => {
    setMachine(null); setLotsSelectionnes([]); setCycleId(null); setCycleInfo(null); setEtape("MACHINE");
  }, []);

  const resetAll = useCallback(() => {
    setAgent(null); setMachine(null); setLotsDisponibles([]); setLotsSelectionnes([]);
    setCycleId(null); setCycleInfo(null); setEtape("MACHINE"); setLotDialog(null);
  }, []);

  const poidsTotal = lotsSelectionnes.reduce((s,ls)=>s+(ls.lot.poidsActuel||0),0);
  const pctCharge  = machine ? Math.min((poidsTotal/machine.capaciteKg)*100,100) : 0;

  return (
    <SechageContext.Provider value={{
      agent, identifierAgent,
      etape, machine, lotsDisponibles, lotsSelectionnes,
      cycleId, cycleInfo, loadingLots, poidsTotal, pctCharge,
      scannerMachine, chargerLots, scannerLot,
      confirmerAjoutLot, retirerLot, demarrerSechage, terminerSechage, nouveauCycle,
      lotDialog, setLotDialog,
      loading, resetAll,
    }}>
      {children}
    </SechageContext.Provider>
  );
}