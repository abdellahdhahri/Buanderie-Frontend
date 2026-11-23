import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { useModal } from "./ModalContext";
import { useAuth } from "../constants/AuthContext";
import { getAgent, isAgentConnected } from "../services/agentService";
import { bacsPourLavage } from "../services/parcoursService";
import { scannerBacPourCycle, lingesDuBac, demarrerCycleBac, ajouterBacAuCycle, versBacTri } from "../services/bacTriService";
import { estCycleInfecte, terminerCycleLavage } from "../services/lavageInfecteService";
import Swal from "../components/kit/dialogueApi";

async function demanderPoids(codeLot, suggestion) {
  const { value, isConfirmed } = await Swal.fire({
    title: `Poids du bac ${codeLot}`,
    text: "Aucune pesée enregistrée pour ce bac : saisissez le poids de la charge (kg).",
    input: "number",
    inputValue: suggestion ? Number(suggestion).toFixed(2) : "",
    inputAttributes: { min: "0", step: "0.01" },
    showCancelButton: true,
    confirmButtonText: "Valider",
    cancelButtonText: "Annuler",
    confirmButtonColor: "#0794a4",
    inputValidator: (v) => (!v || Number(v) <= 0 ? "Poids obligatoire" : undefined),
  });
  return isConfirmed ? Number(value) : null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';
const API = `${API_BASE_URL}/api`;

const versCycleActif = (c) => ({
  id: c.id,
  numeroCycle: c.numeroCycle,
  machine: c.machine || null,
  dateDebut: c.dateDebut || null,
  programme: c.programmeLavage?.nom || null,
  temperature: c.programmeLavage?.temperatureCelsius ?? null,
  vitesse: c.programmeLavage?.vitesseEssorageRpm ?? null,
  dureePrevue: c.programmeLavage?.dureeMinutes ?? null,
  nbArticles: c.items?.length ?? null,
  infecte: estCycleInfecte(c),
  lots: [],
});

export const LavageContext = createContext();
export const useLavage = () => useContext(LavageContext);

export function LavageProvider({ children }) {
  const { showAlert, showConfirm } = useModal();
  const { verifierHabilitation } = useAuth();

  const [agent, setAgent] = useState(null);

  const [etapeBlanc, setEtapeBlanc] = useState("MACHINE");
  const [machine, setMachine] = useState(null);
  const [lotsDisponibles, setLotsDisponibles] = useState([]);
  const [lotsSelectionnes, setLotsSelectionnes] = useState([]);
  const [cycleId, setCycleId] = useState(null);
  const [cycleInfo, setCycleInfo] = useState(null);
  const [loadingLots, setLoadingLots] = useState(false);

  const [lotDialog, setLotDialog] = useState(null);

  const [loading, setLoading] = useState(false);
  const [produitsUtilises, setProduitsUtilises] = useState([]);

  const [cyclesActifs, setCyclesActifs] = useState([]);
  const [chargementCycles, setChargementCycles] = useState(false);
  const [cycleEnFin, setCycleEnFin] = useState(null);
  const infosLocales = useRef({});



  const setAgentDirect = useCallback((agentData) => {
  if (!agentData) { setAgent(null); return; }

  const matricule =
    agentData.matricule ||
    agentData.codeBarre  ||
    agentData.login      ||
    null;

  if (!matricule) { setAgent(null); return; }

  setAgent({
    ...agentData,
    matricule,
    codeBarre: agentData.codeBarre || matricule,
    nomPrenom: agentData.nomPrenom || agentData.nom || matricule,
  });
}, []);


  //  Récupérer l'agent depuis localStorage 
  const identifierAgent = useCallback(async () => {
    const agentData = getAgent();
    if (agentData && isAgentConnected()) {
      const ag = {
        matricule: agentData.codeBarre || agentData.matricule,
        nom: agentData.nom || "Inconnu",
        prenom: agentData.prenom || "",
        nomPrenom: agentData.nomPrenom || agentData.nom || "Inconnu",
        codeBarre: agentData.codeBarre || agentData.matricule,
        id: agentData.id,
        poste: agentData.poste || "AGENT_LAVAGE"
      };
      setAgent(ag);
      return ag;
    }
    showAlert("❌ Agent non connecté", "Veuillez vous connecter.", "error");
    return null;
  }, [showAlert]);

  // ✅ Initialiser l'agent au chargement du contexte
  const initAgent = useCallback(() => {
    const agentData = getAgent();
    if (agentData && isAgentConnected()) {
      const ag = {
        matricule: agentData.codeBarre || agentData.matricule,
        nom: agentData.nom || "Inconnu",
        prenom: agentData.prenom || "",
        nomPrenom: agentData.nomPrenom || agentData.nom || "Inconnu",
        codeBarre: agentData.codeBarre || agentData.matricule,
        id: agentData.id,
        poste: agentData.poste || "AGENT_LAVAGE"
      };
      setAgent(ag);
      return ag;
    }
    return null;
  }, []);

  // Appeler initAgent au chargement
  React.useEffect(() => {
    initAgent();
  }, []);

  const fusionnerCycle = (c) => {
    const local = infosLocales.current[c.id];
    if (!local) return c;
    return {
      ...c,
      machine: c.machine || local.machine,
      dateDebut: c.dateDebut || local.dateDebut,
      programme: c.programme || local.programme,
      temperature: c.temperature ?? local.temperature,
      vitesse: c.vitesse ?? local.vitesse,
      dureePrevue: c.dureePrevue ?? local.dureePrevue,
      lots: local.lots || [],
      infecte: c.infecte || Boolean(local.infecte),
      bac: local.bac || null,
    };
  };

  const chargerCyclesActifs = useCallback(async () => {
    setChargementCycles(true);
    try {
      const r = await fetch(`${API}/lavage/cycles`);
      if (!r.ok) return;
      const data = await r.json();
      const liste = (Array.isArray(data) ? data : data?.content || [])
        .filter((c) => c.statut === "EN_COURS")
        .map(versCycleActif)
        .map(fusionnerCycle)
        .sort((a, b) => new Date(b.dateDebut || 0) - new Date(a.dateDebut || 0));
      setCyclesActifs((prev) => {
        const ids = new Set(liste.map((c) => c.id));
        const locauxManquants = prev.filter((c) => !ids.has(c.id) && c.local);
        return [...locauxManquants, ...liste];
      });
    } catch {
      return;
    } finally {
      setChargementCycles(false);
    }
  }, []);

  React.useEffect(() => { chargerCyclesActifs(); }, [chargerCyclesActifs]);

  const finirCycle = useCallback(async (cycle, codeBac) => {
    const resultat = await terminerCycleLavage(cycle.id, codeBac);
    delete infosLocales.current[cycle.id];
    setCyclesActifs((prev) => prev.filter((c) => c.id !== cycle.id));
    return resultat;
  }, []);

  const ajouterCycleLocal = useCallback((cycle, infos = {}) => {
    infosLocales.current[cycle.id] = { ...infos, dateDebut: cycle.dateDebut || new Date().toISOString() };
    setCyclesActifs((prev) => [
      { ...versCycleActif(cycle), ...infosLocales.current[cycle.id], id: cycle.id, numeroCycle: cycle.numeroCycle, local: true },
      ...prev.filter((c) => c.id !== cycle.id),
    ]);
  }, []);

  const terminerCycle = useCallback(async (cycle) => {
    if (!cycle?.id) return;
    const ok = await showConfirm(
      "Fin du lavage",
      `Terminer le cycle #${cycle.numeroCycle || cycle.id}${cycle.machine?.code ? ` (machine ${cycle.machine.code})` : ""} ?`,
      "question"
    );
    if (!ok) return;
    setCycleEnFin(cycle.id);
    try {
      await finirCycle(cycle);
      showAlert("✅ Lavage terminé", `Cycle #${cycle.numeroCycle || cycle.id} terminé.`, "success");
    } catch (err) {
      showAlert("❌ Erreur", err.message, "error");
    } finally {
      setCycleEnFin(null);
    }
  }, [showAlert, showConfirm, finirCycle]);

  const scannerMachine = useCallback(async (code) => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/api/machines/code/${code}`);
      if (!r.ok) { showAlert("❌ Machine introuvable", code, "error"); return false; }
      const m = await r.json();
      const occupee = cyclesActifs.find((c) => c.machine?.code === m.code);
      if (occupee) {
        showAlert("⚠️ Machine occupée", `${m.code} lave déjà le cycle #${occupee.numeroCycle || occupee.id}. Terminez-le ou scannez une autre machine.`, "warning");
        return false;
      }
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
  }, [showAlert, cyclesActifs]);

  const chargerLots = useCallback(async () => {
    setLoadingLots(true);
    try {
      setLotsDisponibles(await bacsPourLavage());
    } catch (err) {
      showAlert("Erreur", err.message, "error");
    } finally { setLoadingLots(false); }
  }, []);

  const scannerLot = useCallback(async (code) => {
    if (!code?.trim()) return;
    setLoading(true);
    try {
      const codeBac = code.trim();
      if (lotsSelectionnes.find(ls => ls.lot.codeLot === codeBac)) {
        showAlert("⚠️ Déjà ajouté", `Le bac ${codeBac} est déjà dans le chargement.`, "info");
        return;
      }
      let lotInfo;
      try {
        lotInfo = await scannerBacPourCycle("lavage", codeBac);
      } catch (err) {
        if (/aucun programme/i.test(err.message || "")) showAlert("Aucun programme de lavage disponible", err.message, "warning");
        else showAlert(`Bac ${codeBac}`, err.message, "error");
        return;
      }
      const connu = lotsDisponibles.find(l => l.codeLot === codeBac);
      const lot = connu || versBacTri({
        codeBac: lotInfo?.codeBac || codeBac,
        categorie: lotInfo?.categorie,
        poids: lotInfo?.poids,
        poidsBalance: lotInfo?.poidsBalance,
        nbLinges: lotInfo?.nbLinges,
      });
      const linges = await lingesDuBac(codeBac);
      setLotDialog({ lotInfo: lotInfo ? { ...lotInfo, codeLot: lotInfo.codeBac || codeBac } : null, linges, lot });
    } catch (err) {
      showAlert("Erreur réseau", err?.message || "", "error");
    } finally { setLoading(false); }
  }, [lotsDisponibles, lotsSelectionnes, showAlert]);

  const confirmerAjoutLot = useCallback((lot, scanInfo) => {
    setLotsSelectionnes(prev => [...prev, { lot, scanInfo }]);
    setLotDialog(null);
  }, []);

  const retirerLot = useCallback((codeLot) => {
    setLotsSelectionnes(prev => prev.filter(ls => ls.lot.codeLot !== codeLot));
  }, []);

  const demarrerLavage = useCallback(async (poidsTotal) => {
    // ✅ Vérifier que l'agent existe
    if (!agent) {
      showAlert("❌ Agent non connecté", "Veuillez vous reconnecter.", "error");
      return;
    }

    if (!lotsSelectionnes.length) {
      showAlert("⚠️ Aucun bac", "Sélectionnez au moins un bac.", "warning");
      return;
    }

    if (!machine) {
      showAlert("⚠️ Aucune machine", "Scannez une machine d'abord.", "warning");
      return;
    }

    const programmeChoisi = lotsSelectionnes[0]?.scanInfo?.programmeRecommande;
    const ok = await showConfirm(
      "Démarrer le lavage",
      `${lotsSelectionnes.length} bac(s) — ${poidsTotal.toFixed(1)} kg\nMachine : ${machine?.code}${programmeChoisi ? `\nProgramme : ${programmeChoisi}` : ""}`,
      "question"
    );
    if (!ok) return;

    const poidsLots = [];
    for (const ls of lotsSelectionnes) {
      let poids = ls.lot.poidsCharge ?? ls.lot.poidsBalance;
      if (poids == null) poids = await demanderPoids(ls.lot.codeLot, ls.lot.poidsActuel);
      if (poids == null) return;
      poidsLots.push(poids);
    }

    verifierHabilitation("lavage");
    setLoading(true);
    try {
      const p = lotsSelectionnes[0];
      const matricule = agent.codeBarre || agent.matricule;
      
      // ✅ Vérifier que le matricule existe
      if (!matricule) {
        throw new Error("Matricule de l'agent introuvable");
      }

      const cycle = await demarrerCycleBac("lavage", {
        codeMachine: machine.code,
        codeBac: p.lot.codeLot,
        matriculeAgent: matricule,
        poidsCharge: poidsLots[0],
        programmeId: p.scanInfo?.programmeId,
        produitIds: produitsUtilises.map((x) => x.id),
      });
      setCycleId(cycle.id);
      
      const premiereInfo = lotsSelectionnes[0]?.scanInfo;
      const infoCycle = {
        dateDebut: cycle.dateDebut || new Date().toISOString(),
        dureePrevue: premiereInfo?.duree || null,
        programme: cycle.programmeLavage?.nom || premiereInfo?.programmeRecommande || "—",
        temperature: premiereInfo?.temperature || "—",
        vitesse: premiereInfo?.vitesse || "—",
      };
      setCycleInfo(infoCycle);
      infosLocales.current[cycle.id] = {
        ...infoCycle,
        machine,
        lots: lotsSelectionnes.map((ls, i) => ({ codeLot: ls.lot.codeLot, codeBac: ls.lot.codeLot, categorie: ls.lot.categorie, poids: poidsLots[i] })),
      };
      
      for (let i = 1; i < lotsSelectionnes.length; i++) {
        const ls = lotsSelectionnes[i];
        try {
          await ajouterBacAuCycle("lavage", cycle.id, ls.lot.codeLot, poidsLots[i]);
        } catch (errAjout) {
          showAlert(`Bac ${ls.lot.codeLot}`, errAjout.message, "warning");
        }
      }
      
      setCyclesActifs((prev) => [
        { ...versCycleActif(cycle), ...infosLocales.current[cycle.id], id: cycle.id, numeroCycle: cycle.numeroCycle, local: true },
        ...prev.filter((c) => c.id !== cycle.id),
      ]);
      setMachine(null);
      setLotsSelectionnes([]);
      setProduitsUtilises([]);
      setCycleId(null);
      setCycleInfo(null);
      setEtapeBlanc("MACHINE");
      chargerCyclesActifs();
      chargerLots();
      showAlert("🚀 Lavage démarré", `Cycle #${cycle.numeroCycle || cycle.id} en cours sur ${machine.code}. Vous pouvez lancer un autre lavage.`, "success");
    } catch (err) {
      if (/aucun programme/i.test(err.message || "")) showAlert("Aucun programme de lavage disponible", err.message, "warning");
      else showAlert("❌ Erreur", err.message || "Erreur lors du démarrage", "error");
    } finally {
      setLoading(false);
    }
  }, [lotsSelectionnes, machine, agent, showAlert, showConfirm, chargerCyclesActifs, chargerLots, verifierHabilitation, produitsUtilises]);

  const terminerLavage = useCallback(async () => {
    if (!cycleId) {
      showAlert("⚠️ Aucun cycle", "Aucun cycle en cours.", "warning");
      return;
    }
    
    const ok = await showConfirm("Fin du lavage", `Terminer le cycle #${cycleId} ?`, "question");
    if (!ok) return;
    
    setLoading(true);
    try {
      const r = await fetch(`${API}/lavage/${cycleId}/finish`, { method: "PUT" });
      if (!r.ok) {
        const errorText = await r.text();
        let msg = errorText;
        try { msg = JSON.parse(errorText).message || errorText; } catch {}
        throw new Error(msg || "Erreur fin de cycle");
      }
      setEtapeBlanc("TERMINE");
      setCycleInfo(null);
      showAlert("✅ Lavage terminé", `Cycle #${cycleId} terminé.`, "success");
    } catch (err) {
      showAlert("❌ Erreur", err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [cycleId, showAlert, showConfirm]);

  const ajouterProduit = useCallback((produit) => {
    setProduitsUtilises((prev) => (prev.some((p) => p.id === produit.id) ? prev : [...prev, produit]));
  }, []);

  const retirerProduit = useCallback((id) => {
    setProduitsUtilises((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const viderProduits = useCallback(() => setProduitsUtilises([]), []);

  const nouveauCycleBlanc = useCallback(() => {
    setProduitsUtilises([]);
    setMachine(null);
    setLotsSelectionnes([]);
    setCycleId(null);
    setCycleInfo(null);
    setEtapeBlanc("MACHINE");
  }, []);

  const resetAll = useCallback(() => {
    setAgent(null);
    setMachine(null);
    setLotsDisponibles([]);
    setLotsSelectionnes([]);
    setCycleId(null);
    setCycleInfo(null);
    setEtapeBlanc("MACHINE");
    setLotDialog(null);
    setProduitsUtilises([]);
  }, []);

  const poidsTotal = lotsSelectionnes.reduce((s, ls) => s + (Number(ls.lot.poidsCharge ?? ls.lot.poidsActuel) || 0), 0);
  const pctCharge = machine
    ? Math.min((poidsTotal / machine.capaciteKg) * 100, 100)
    : 0;

  return (
    <LavageContext.Provider value={{
      agent, identifierAgent,setAgentDirect,
      etapeBlanc, machine, lotsDisponibles, lotsSelectionnes,
      cycleId, cycleInfo, loadingLots, poidsTotal, pctCharge,
      scannerMachine, chargerLots, scannerLot,
      confirmerAjoutLot, retirerLot,
      demarrerLavage, terminerLavage, nouveauCycleBlanc,
      cyclesActifs, chargementCycles, chargerCyclesActifs, terminerCycle, cycleEnFin,
      finirCycle, ajouterCycleLocal,
      lotDialog, setLotDialog,
      loading, resetAll,
      produitsUtilises, ajouterProduit, retirerProduit, viderProduits,
    }}>
      {children}
    </LavageContext.Provider>
  );
}