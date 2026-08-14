import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { useModal } from "./ModalContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';
const API = `${API_BASE_URL}/api`;

export const LavageContext = createContext();
export const useLavage = () => useContext(LavageContext);

export function LavageProvider({ children }) {
  const { showAlert, showConfirm } = useModal();

  const [agent, setAgent] = useState(null);

  const [etapeBlanc, setEtapeBlanc] = useState("MACHINE");
  const [machine, setMachine] = useState(null);
  const [lotsDisponibles, setLotsDisponibles] = useState([]);
  const [lotsSelectionnes, setLotsSelectionnes] = useState([]);
  const [cycleId, setCycleId] = useState(null);
  const [cycleInfo, setCycleInfo] = useState(null);
  const [loadingLots, setLoadingLots] = useState(false);

  const [sacsInfectes, setSacsInfectes] = useState([]);
  const [loadingSacs, setLoadingSacs] = useState(false);

  const [lotDialog, setLotDialog] = useState(null);
  const [scanPropresNumerosac, setScanPropresNumerosac] = useState(null);

  const [loading, setLoading] = useState(false);

  const identifierAgent = useCallback(async (code) => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/api/agents/matricule/${code}`);
      if (r.ok) { setAgent(await r.json()); return true; }
      showAlert("❌ Agent introuvable", code, "error");
      return false;
    } catch {
      showAlert("Erreur réseau", "", "error");
      return false;
    } finally { setLoading(false); }
  }, [showAlert]);

  const scannerMachine = useCallback(async (code) => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/api/machines/code/${code}`);
      if (!r.ok) { showAlert("❌ Machine introuvable", code, "error"); return false; }
      const m = await r.json();
      if (m.etat === "EN_COURS") {
        showAlert("⚠️ Machine occupée", `${code} est déjà en cours.`, "warning");
        return false;
      }
      setMachine(m);
      setEtapeBlanc("LOTS");
      await chargerLots();
      return true;
    } catch {
      showAlert("Erreur réseau", "", "error");
      return false;
    } finally { setLoading(false); }
  }, [showAlert]);

  const chargerLots = useCallback(async () => {
    setLoadingLots(true);
    try {
      const r = await fetch(`${API_BASE_URL}/api/lots`);
      if (r.ok) setLotsDisponibles(await r.json());
    } catch {} finally { setLoadingLots(false); }
  }, []);

  const scannerLot = useCallback(async (code, poidsActuelSelectionnes) => {
    if (!code?.trim()) return;
    setLoading(true);
    try {
      if (lotsSelectionnes.find(ls => ls.lot.codeLot === code)) {
        showAlert("⚠️ Déjà ajouté", `LOT ${code} est déjà dans le chargement.`, "info");
        return;
      }
      const lot = lotsDisponibles.find(l => l.codeLot === code);
      if (!lot) { showAlert("❌ Lot introuvable", code, "error"); return; }

      if (machine && poidsActuelSelectionnes + (lot.poidsActuel || 0) > machine.capaciteKg) {
        showAlert("⚠️ Capacité dépassée", `Machine pleine (${machine.capaciteKg} kg).`, "warning");
        return;
      }
      const [rInfo, rLinges] = await Promise.all([
        fetch(`${API}/lavage/scan-lot/${code}`),
        fetch(`${API_BASE_URL}/api/linges/lot/${code}`)
      ]);
      const lotInfo = rInfo.ok ? await rInfo.json() : null;
      const linges = rLinges.ok ? await rLinges.json() : [];
      setLotDialog({ lotInfo, linges, lot });
    } catch {
      showAlert("Erreur réseau", "", "error");
    } finally { setLoading(false); }
  }, [lotsDisponibles, lotsSelectionnes, machine, showAlert]);

  const confirmerAjoutLot = useCallback((lot, scanInfo) => {
    setLotsSelectionnes(prev => [...prev, { lot, scanInfo }]);
    setLotDialog(null);
  }, []);

  const retirerLot = useCallback((codeLot) => {
    setLotsSelectionnes(prev => prev.filter(ls => ls.lot.codeLot !== codeLot));
  }, []);

  const demarrerLavage = useCallback(async (poidsTotal) => {
    if (!lotsSelectionnes.length) {
      showAlert("⚠️ Aucun lot", "Sélectionnez au moins un lot.", "warning");
      return;
    }
    const ok = await showConfirm(
      "Démarrer le lavage",
      `${lotsSelectionnes.length} lot(s) — ${poidsTotal.toFixed(1)} kg\nMachine : ${machine?.code}`,
      "question"
    );
    if (!ok) return;
    setLoading(true);
    try {
      const p = lotsSelectionnes[0];
      const r = await fetch(
        `${API}/lavage/start?codeMachine=${machine.code}&codeLot=${p.lot.codeLot}&matriculeAgent=${agent.matricule}&poidsCharge=${p.lot.poidsActuel || 0}`,
        { method: "POST" }
      );
      if (!r.ok) throw new Error((await r.json()).message || "Erreur démarrage");
      const cycle = await r.json();
      setCycleId(cycle.id);
      const premiereInfo = lotsSelectionnes[0]?.scanInfo;
      setCycleInfo({
        dateDebut: new Date().toISOString(),
        dureePrevue: premiereInfo?.duree || null,
        programme: premiereInfo?.programmeRecommande || "—",
        temperature: premiereInfo?.temperature || "—",
        vitesse: premiereInfo?.vitesse || "—",
      });
      for (let i = 1; i < lotsSelectionnes.length; i++) {
        const ls = lotsSelectionnes[i];
        await fetch(
          `${API}/lavage/${cycle.id}/add-lot?codeLot=${ls.lot.codeLot}&poidsCharge=${ls.lot.poidsActuel || 0}`,
          { method: "POST" }
        );
      }
      setEtapeBlanc("EN_COURS");
      showAlert("🚀 Lavage démarré", `Cycle #${cycle.id} en cours`, "success");
    } catch (err) {
      showAlert("❌ Erreur", err.message, "error");
    } finally { setLoading(false); }
  }, [lotsSelectionnes, machine, agent, showAlert, showConfirm]);



  
  const terminerLavage = useCallback(async () => {
    const ok = await showConfirm("Fin du lavage", `Terminer le cycle #${cycleId} ?`, "question");
    if (!ok) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/lavage/${cycleId}/finish`, { method: "PUT" });
      if (!r.ok) throw new Error("Erreur fin de cycle");
      setEtapeBlanc("TERMINE");
      setCycleInfo(null);
      showAlert("✅ Lavage terminé", `Cycle #${cycleId} terminé.`, "success");
    } catch (err) {
      showAlert("❌ Erreur", err.message, "error");
    } finally { setLoading(false); }
  }, [cycleId, showAlert, showConfirm]);

  const nouveauCycleBlanc = useCallback(() => {
    setMachine(null);
    setLotsSelectionnes([]);
    setCycleId(null);
    setCycleInfo(null);
    setEtapeBlanc("MACHINE");
  }, []);

  const chargerSacsInfectes = useCallback(async () => {
    setLoadingSacs(true);
    try {
      const r = await fetch(`${API}/sacs-infectes/non-laves`);
      if (r.ok) setSacsInfectes(await r.json());
    } catch {} finally { setLoadingSacs(false); }
  }, []);

  const scannerSacInfecte = useCallback(async (code) => {
    if (!code?.trim()) return;
    try {
      const r = await fetch(`${API}/sacs-infectes/detail?numeroSac=${code}`);
      if (r.ok) {
        const sac = await r.json();
        setSacsInfectes(prev =>
          prev.find(s => s.numeroSac === code) ? prev : [sac, ...prev]
        );
      } else {
        showAlert("❌ Sac introuvable", code, "error");
      }
    } catch { showAlert("Erreur réseau", "", "error"); }
  }, [showAlert]);




  const laverSac = useCallback(async (numeroSac) => {
    setLoading(true);
    try {
      const r = await fetch(
        `${API}/sacs-infectes/laver?numeroSac=${numeroSac}&matricule=${agent.matricule}`,
        { method: "PUT" }
      );
      if (!r.ok) throw new Error((await r.json()).message || "Erreur");
      const sac = await r.json();
      setSacsInfectes(prev => prev.map(s => s.numeroSac === numeroSac ? sac : s));
      showAlert("✅ Sac en lavage", `${numeroSac} vidé dans la machine`, "success");
    } catch (err) {
      showAlert("❌ Erreur", err.message, "error");
    } finally { setLoading(false); }
  }, [agent, showAlert]);

  const verifierSac = useCallback(async (numeroSac, itemsComptes) => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/sacs-infectes/verifier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numeroSac, matriculeAgent: agent.matricule, itemsComptes })
      });
      if (!r.ok) throw new Error((await r.json()).message || "Erreur");
      const sac = await r.json();
      setSacsInfectes(prev => prev.map(s => s.numeroSac === numeroSac ? sac : s));
      if (sac.ecart === 0)
        showAlert("✅ Concordance parfaite", `${numeroSac} — écart : 0`, "success");
      else
        showAlert("⚠️ Écart détecté", `${numeroSac} — écart : ${sac.ecart}`, "warning");
    } catch (err) {
      showAlert("❌ Erreur", err.message, "error");
    } finally { setLoading(false); }
  }, [agent, showAlert]);

  const affecterLingesPropres = useCallback(async (numeroSac, codesLinges) => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/sacs-infectes/affecter-linges-propres`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numeroSac, matriculeAgent: agent.matricule, codesLinges })
      });
      if (!r.ok) throw new Error((await r.json()).message || "Erreur");
      const sac = await r.json();
      setSacsInfectes(prev => prev.map(s => s.numeroSac === numeroSac ? sac : s));
      setScanPropresNumerosac(null);
      showAlert(
        "✅ Linges réintégrés",
        `${sac.nombreLingesAffectes} linge(s) affecté(s) au flux normal`,
        "success"
      );
    } catch (err) {
      showAlert("❌ Erreur", err.message, "error");
    } finally { setLoading(false); }
  }, [agent, showAlert]);

  const resetAll = useCallback(() => {
    setAgent(null);
    setMachine(null);
    setLotsDisponibles([]);
    setLotsSelectionnes([]);
    setCycleId(null);
    setCycleInfo(null);
    setEtapeBlanc("MACHINE");
    setSacsInfectes([]);
    setLotDialog(null);
    setScanPropresNumerosac(null);
  }, []);

  const poidsTotal = lotsSelectionnes.reduce((s, ls) => s + (ls.lot.poidsActuel || 0), 0);
  const pctCharge = machine
    ? Math.min((poidsTotal / machine.capaciteKg) * 100, 100)
    : 0;

  return (
    <LavageContext.Provider value={{
      agent, identifierAgent,
      etapeBlanc, machine, lotsDisponibles, lotsSelectionnes,
      cycleId, cycleInfo, loadingLots, poidsTotal, pctCharge,
      scannerMachine, chargerLots, scannerLot,
      confirmerAjoutLot, retirerLot,
      demarrerLavage, terminerLavage, nouveauCycleBlanc,
      sacsInfectes, loadingSacs,
      chargerSacsInfectes, scannerSacInfecte,
      laverSac, verifierSac, affecterLingesPropres,
      lotDialog, setLotDialog,
      scanPropresNumerosac, setScanPropresNumerosac,
      loading, resetAll,
    }}>
      {children}
    </LavageContext.Provider>
  );
}