import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  FaSoap, FaFilter, FaCheckCircle, FaBiohazard,
  FaCalendarAlt, FaBoxes, FaSpinner, FaPlay, FaStop,
  FaUser, FaExclamationTriangle, FaTshirt, FaRedo,
  FaCheckDouble, FaClock, FaHistory
} from "react-icons/fa";
import { LavageProvider, useLavage } from "../../contextes/LavageContext";
import { getAgent, isAgentConnected } from "../../services/agentService";
import Swal from "sweetalert2";
import { Badge } from "../../components/ui/badge";

import ScanInput              from "../../components/utils/ScanInput";
import CarteLot               from "../../components/utils/CarteLot";
import LotInfoDialog          from "../../components/utils/LotInfoDialog";
import ScanLingesPropresModal from "../../components/utils/ScanLingesPropresModal";
import RecapChargement        from "../../components/utils/RecapChargement";

import "../Linge/WorkflowList.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

// ─── StatutCard ──────────────────────────────────────────────────────────────
function StatutCard({ label, value, icon, color, bg, subValue }) {
  return (
    <div style={{
      padding: "16px 18px",
      borderRadius: "14px",
      background: bg,
      border: `1px solid ${color}25`,
      flex: 1,
      minWidth: "100px",
      transition: "all 0.2s ease"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "12px",
          background: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px"
        }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize: "10px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>
            {label}
          </p>
          <p style={{ fontSize: "24px", fontWeight: 700, color: color, margin: 0, lineHeight: 1.2 }}>
            {value}
          </p>
          {subValue && (
            <p style={{ fontSize: "10px", color: "#94a3b8", margin: 0 }}>{subValue}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── RecapChargementInfecte ──────────────────────────────────────────────
function RecapChargementInfecte({ 
  sacsSelectionnes, 
  poidsTotal, 
  onRetirer, 
  onTerminer,
  onArreter,
  onNouveauCycle,
  estTermine,
  estEnLavage,
  tempsEcoule 
}) {
  return (
    <div style={{
      background: "#f8fafc",
      borderRadius: "14px",
      padding: "16px",
      border: "1px solid #e2e8f0",
      position: "sticky",
      top: "20px",
      alignSelf: "start"
    }}>
      <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
        <FaBoxes color="#dc2626" />
        Sacs en lavage
        <Badge style={{ background: "#fee2e2", color: "#dc2626", marginLeft: "auto" }}>
          {sacsSelectionnes.length}
        </Badge>
      </div>

      {sacsSelectionnes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "13px" }}>
          <FaBiohazard size={28} style={{ opacity: 0.2, marginBottom: "8px" }} />
          <div>Aucun sac sélectionné</div>
          <div style={{ fontSize: "11px", marginTop: "4px" }}>Scannez des sacs infectés</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "300px", overflowY: "auto" }}>
          {sacsSelectionnes.map((sac, index) => (
            <div
              key={sac.id || index}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                borderRadius: "8px",
                background: "white",
                border: "1px solid #fca5a5"
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: "13px", color: "#dc2626" }}>
                  {sac.numeroSac}
                </div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  {sac.quantiteDeclaree || 0} articles
                </div>
              </div>
              {!estTermine && !estEnLavage && (
                <button
                  onClick={() => onRetirer(sac)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid #fca5a5",
                    background: "#fff5f5",
                    color: "#dc2626",
                    cursor: "pointer",
                    fontSize: "11px"
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{
        marginTop: "12px",
        paddingTop: "12px",
        borderTop: "1px solid #e2e8f0"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
          <span style={{ color: "#64748b" }}>Total articles</span>
          <span style={{ fontWeight: 700, color: "#0f172a" }}>{poidsTotal}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
          <span style={{ color: "#64748b" }}>Sacs</span>
          <span style={{ fontWeight: 700, color: "#0f172a" }}>{sacsSelectionnes.length}</span>
        </div>
        {tempsEcoule > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginTop: "4px", paddingTop: "4px", borderTop: "1px solid #e2e8f0" }}>
            <span style={{ color: "#64748b" }}>
              <FaClock size={12} style={{ display: "inline", marginRight: "4px" }} />
              Temps
            </span>
            <span style={{ fontWeight: 600, color: "#0f172a" }}>
              {Math.floor(tempsEcoule / 60)}m {tempsEcoule % 60}s
            </span>
          </div>
        )}
      </div>

      {/* Boutons */}
      {!estTermine && !estEnLavage && (
        <button
          onClick={onTerminer}
          disabled={sacsSelectionnes.length === 0}
          style={{
            marginTop: "12px",
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border: "none",
            background: sacsSelectionnes.length === 0 ? "#e2e8f0" : "linear-gradient(135deg, #10b981, #059669)",
            color: sacsSelectionnes.length === 0 ? "#94a3b8" : "white",
            fontWeight: 700,
            cursor: sacsSelectionnes.length === 0 ? "not-allowed" : "pointer",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}
        >
          <FaPlay size={14} /> 
          {sacsSelectionnes.length === 0 ? "Aucun sac sélectionné" : "Lancer le cycle infecté"}
        </button>
      )}

      {estEnLavage && !estTermine && (
        <>
          <button
            onClick={onTerminer}
            style={{
              marginTop: "12px",
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "none",
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            <FaCheckDouble size={14} /> Terminer le cycle infecté
          </button>
          <button
            onClick={onArreter}
            style={{
              marginTop: "8px",
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "none",
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            <FaStop size={14} /> Arrêter le cycle
          </button>
        </>
      )}

      {estTermine && (
        <button
          onClick={onNouveauCycle}
          style={{
            marginTop: "12px",
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border: "none",
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}
        >
          <FaRedo size={14} /> Nouveau cycle
        </button>
      )}
    </div>
  );
}

function LavageInner() {
  const {
    agent: agentFromContext,
    identifierAgent,
    etapeBlanc, machine, lotsDisponibles, lotsSelectionnes,
    loadingLots, poidsTotal,
    scannerMachine, chargerLots, scannerLot,
    confirmerAjoutLot, retirerLot, nouveauCycleBlanc,
    sacsInfectes, loadingSacs,
    chargerSacsInfectes,
    loading, resetAll, finishCycle,
  } = useLavage();

  const [scanVal, setScanVal] = useState("");
  const [searchLot, setSearchLot] = useState("");
  const [agent, setAgent] = useState(null);
  
  // ─── États pour les infectés ──────────────────────────────────────────────
  const [machineInfecte, setMachineInfecte] = useState(null);
  const [sacsSelectionnes, setSacsSelectionnes] = useState([]);
  const [etapeInfecte, setEtapeInfecte] = useState("MACHINE");
  const [modeLavage, setModeLavage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cycleTermineInfecte, setCycleTermineInfecte] = useState(false);
  const [cycleEnCours, setCycleEnCours] = useState(false);
  const [tempsEcoule, setTempsEcoule] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);

  const scanInputRef = useRef(null);

  //  Récupérer l'agent depuis localStorage
  useEffect(() => {
    const agentData = getAgent();
    if (agentData && isAgentConnected()) {
      setAgent(agentData);
      if (identifierAgent) {
        identifierAgent(agentData.matricule).catch(() => {});
      }
    }
  }, []);

  //  Si l'agent du contexte change
  useEffect(() => {
    if (agentFromContext) {
      setAgent(agentFromContext);
    }
  }, [agentFromContext]);

  // Charger les lots et sacs selon le mode
  useEffect(() => {
    if (!agent) return;
    
    if (modeLavage === "NORMAL" && etapeBlanc === "LOTS") {
      chargerLots();
    }
    
    if (modeLavage === "INFECTE") {
      chargerSacsInfectes();
    }
  }, [modeLavage, agent, etapeBlanc, chargerLots, chargerSacsInfectes]);

  // Timer pour le lavage infecté
  useEffect(() => {
    if (cycleEnCours && !cycleTermineInfecte) {
      const interval = setInterval(() => {
        setTempsEcoule(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    }
  }, [cycleEnCours, cycleTermineInfecte]);

  // ─── Scanner Machine ──────────────────────────────────────────────────────
  const scannerMachineUnifie = useCallback(async (code) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/machines/code/${encodeURIComponent(code)}`);
      if (!res.ok) {
        await Swal.fire({
          icon: 'error',
          title: 'Machine introuvable',
          text: code,
          timer: 1500,
          showConfirmButton: false
        });
        return;
      }
      const mach = await res.json();
      
      if (mach.categorie === "LINGES_INFECTE") {
        setModeLavage("INFECTE");
        setMachineInfecte(mach);
        setEtapeInfecte("SACS");
        setSacsSelectionnes([]);
        setCycleTermineInfecte(false);
        setCycleEnCours(false);
        setTempsEcoule(0);
        await chargerSacsInfectes();
        
        await Swal.fire({
          icon: 'success',
          title: '🔴 Machine linges infectés',
          text: `${mach.code} - ${mach.marque}`,
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        setModeLavage("NORMAL");
        await scannerMachine(code);
        setEtapeInfecte(null);
        setMachineInfecte(null);
        setSacsSelectionnes([]);
        setCycleTermineInfecte(false);
        setCycleEnCours(false);
        setTempsEcoule(0);
        
        await Swal.fire({
          icon: 'success',
          title: '✅ Machine linges normaux',
          text: `${mach.code} - ${mach.marque}`,
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [scannerMachine, chargerSacsInfectes]);

  // ─── Scanner Sac Infecté (comme scanner un lot) ──────────────────────
  const scannerSacInfecte = useCallback(async (code) => {
    if (!machineInfecte) {
      await Swal.fire({
        icon: 'warning',
        title: 'Scannez d\'abord la machine',
        text: 'Veuillez scanner une machine infectée avant de scanner des sacs.',
        timer: 2000,
        showConfirmButton: false
      });
      return;
    }

    if (cycleTermineInfecte || cycleEnCours) {
      await Swal.fire({
        icon: 'warning',
        title: 'Cycle en cours ou terminé',
        text: 'Vous ne pouvez plus ajouter de sacs.',
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }

    const sac = sacsInfectes?.find(s => s.numeroSac === code || s.code === code);
    if (!sac) {
      await Swal.fire({
        icon: 'error',
        title: 'Sac introuvable',
        text: code,
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }

    if (sacsSelectionnes.find(s => s.numeroSac === sac.numeroSac)) {
      await Swal.fire({
        icon: 'warning',
        title: 'Sac déjà ajouté',
        text: sac.numeroSac,
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }

    if (sac.etat === "EN_LAVAGE") {
      await Swal.fire({
        icon: 'warning',
        title: 'Sac déjà en lavage',
        text: sac.numeroSac,
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }

    setSacsSelectionnes(prev => [...prev, sac]);
    
    await Swal.fire({
      icon: 'success',
      title: '✅ Sac ajouté',
      text: `${sac.numeroSac} - ${sac.quantiteDeclaree || 0} articles`,
      timer: 1000,
      showConfirmButton: false
    });
  }, [machineInfecte, sacsInfectes, sacsSelectionnes, cycleTermineInfecte, cycleEnCours]);

  // ─── Retirer un sac ──────────────────────────────────────────────────────
  const retirerSac = useCallback((sac) => {
    setSacsSelectionnes(prev => prev.filter(s => s.numeroSac !== sac.numeroSac));
  }, []);

  // ─── Lancer le cycle infecté ──────────────────────────────────────────────
  const lancerCycleInfecte = useCallback(async () => {
    if (sacsSelectionnes.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Aucun sac sélectionné',
        text: 'Scannez au moins un sac avant de continuer.',
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }

    setIsLoading(true);
    try {
      for (const sac of sacsSelectionnes) {
        const res = await fetch(
          `${API_URL}/api/sacs-infectes/laver?numeroSac=${encodeURIComponent(sac.numeroSac)}&matricule=${agent.matricule}&codeMachine=${machineInfecte.code}`,
          { method: "PUT" }
        );

        if (!res.ok) {
          const txt = await res.text();
          let msg = txt;
          try { msg = JSON.parse(txt).message || txt; } catch {}
          throw new Error(`Erreur pour ${sac.numeroSac}: ${msg}`);
        }
      }

      setEtapeInfecte("LAVAGE");
      setCycleEnCours(true);
      setTempsEcoule(0);
      await chargerSacsInfectes();

      await Swal.fire({
        icon: 'success',
        title: '🔴 Cycle infecté lancé !',
        text: `${sacsSelectionnes.length} sac(s) en lavage`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [sacsSelectionnes, machineInfecte, agent, chargerSacsInfectes]);

  // ─── Terminer le cycle infecté ──────────────────────────────────────────
  const terminerCycleInfecte = useCallback(async () => {
    if (sacsSelectionnes.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Aucun sac à terminer',
        text: 'Scannez au moins un sac avant de terminer.',
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }

    const result = await Swal.fire({
      icon: 'question',
      title: 'Terminer le cycle infecté ?',
      text: `${sacsSelectionnes.length} sac(s) seront terminés.`,
      showCancelButton: true,
      confirmButtonColor: '#7c3aed',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Oui, terminer',
      cancelButtonText: 'Annuler'
    });

    if (!result.isConfirmed) return;

    setIsLoading(true);
    try {
      for (const sac of sacsSelectionnes) {
        await fetch(
          `${API_URL}/api/sacs-infectes/terminer-lavage?numeroSac=${sac.numeroSac}&matricule=${agent.matricule}`,
          { method: "PUT" }
        );
      }

      setEtapeInfecte("TERMINE");
      setCycleTermineInfecte(true);
      setCycleEnCours(false);
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      await chargerSacsInfectes();

      await Swal.fire({
        icon: 'success',
        title: '✅ Cycle infecté terminé !',
        text: `${sacsSelectionnes.length} sac(s) lavés avec succès`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [sacsSelectionnes, agent, chargerSacsInfectes, timerInterval]);

  const arreterCycleInfecte = useCallback(async () => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Arrêter le cycle infecté ?',
      text: `${sacsSelectionnes.length} sac(s) seront arrêtés.`,
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Oui, arrêter',
      cancelButtonText: 'Annuler'
    });

    if (!result.isConfirmed) return;

    setIsLoading(true);
    try {
      for (const sac of sacsSelectionnes) {
        await fetch(
          `${API_URL}/api/sacs-infectes/arreter-lavage?numeroSac=${sac.numeroSac}&matricule=${agent.matricule}`,
          { method: "PUT" }
        );
      }

      setEtapeInfecte("SACS");
      setCycleEnCours(false);
      setCycleTermineInfecte(false);
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      setTempsEcoule(0);
      await chargerSacsInfectes();

      await Swal.fire({
        icon: 'info',
        title: '⏹️ Cycle infecté arrêté',
        text: `${sacsSelectionnes.length} sac(s) ont été arrêtés`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [sacsSelectionnes, agent, chargerSacsInfectes, timerInterval]);

  // ─── Nouveau cycle infecté ─────────────────────────────────────────────
  const nouveauCycleInfecte = useCallback(() => {
    setMachineInfecte(null);
    setSacsSelectionnes([]);
    setEtapeInfecte("MACHINE");
    setCycleTermineInfecte(false);
    setCycleEnCours(false);
    setModeLavage(null);
    setTempsEcoule(0);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setScanVal("");
    setTimeout(() => scanInputRef.current?.focus(), 200);
  }, [timerInterval]);

  // ─── Reset tout ─────────────────────────────────────────────────────────
  const handleResetAll = useCallback(() => {
    resetAll();
    setModeLavage(null);
    setMachineInfecte(null);
    setSacsSelectionnes([]);
    setEtapeInfecte("MACHINE");
    setCycleTermineInfecte(false);
    setCycleEnCours(false);
    setTempsEcoule(0);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setScanVal("");
  }, [resetAll, timerInterval]);

  // ─── Scan général ──────────────────────────────────────────────────────
  const handleScan = useCallback(async (code) => {
    setScanVal("");
    if (!agent) {
      if (identifierAgent) {
        await identifierAgent(code);
      }
      return;
    }

    if (!modeLavage) {
      await scannerMachineUnifie(code);
      return;
    }

    if (modeLavage === "NORMAL") {
      if (etapeBlanc === "MACHINE") {
        await scannerMachineUnifie(code);
        return;
      }
      if (etapeBlanc === "LOTS") {
        await scannerLot(code, poidsTotal);
        return;
      }
    }

    if (modeLavage === "INFECTE") {
      if (etapeInfecte === "MACHINE") {
        await scannerMachineUnifie(code);
        return;
      }
      if (etapeInfecte === "SACS" || etapeInfecte === "LAVAGE") {
        await scannerSacInfecte(code);
        return;
      }
    }
  }, [agent, identifierAgent, modeLavage, etapeBlanc, etapeInfecte, scannerMachineUnifie, scannerLot, scannerSacInfecte, poidsTotal]);

  const lotsFiltres = useMemo(() => {
    const ids = new Set(lotsSelectionnes.map(ls => ls.lot.id));
    return lotsDisponibles.filter(l =>
      l.etat === "EN_TRI" &&
      !ids.has(l.id) &&
      (!searchLot ||
        l.codeLot.toLowerCase().includes(searchLot.toLowerCase()) ||
        l.categorie?.toLowerCase().includes(searchLot.toLowerCase()))
    );
  }, [lotsDisponibles, lotsSelectionnes, searchLot]);

  const getPlaceholder = () => {
    if (!agent) return "👤 Agent non connecté — veuillez vous reconnecter";
    
    if (!modeLavage) return "🔧 Scanner le code de la machine...";
    
    if (modeLavage === "NORMAL") {
      if (etapeBlanc === "MACHINE") return "🔧 Scanner le code de la machine...";
      if (etapeBlanc === "LOTS") return "📦 Scanner un lot...";
    }
    
    if (modeLavage === "INFECTE") {
      if (etapeInfecte === "MACHINE") return "🔧 Scanner le code de la machine...";
      if (etapeInfecte === "SACS") return "🔴 Scanner un sac infecté...";
      if (etapeInfecte === "LAVAGE") return "🔴 Scanner un autre sac...";
      if (etapeInfecte === "TERMINE") return "✅ Cycle terminé";
    }
    return "Scanner...";
  };

  const getBorderColor = () => {
    if (!agent) return "#dc2626";
    if (modeLavage === "INFECTE") return "#dc2626";
    if (modeLavage === "NORMAL") return "#0ea5e9";
    return "#0ea5e9";
  };

  const getModeLabel = () => {
    if (!modeLavage) return "En attente";
    if (modeLavage === "NORMAL") return "⬜ Linge Normal";
    return "🔴 Linge Infecté";
  };

  const getModeColor = () => {
    if (!modeLavage) return "#64748b";
    if (modeLavage === "NORMAL") return "#0ea5e9";
    return "#dc2626";
  };

  // Filtrer les sacs disponibles
  const sacsDisponibles = sacsInfectes?.filter(s => s.etat === "RECEPTIONNE" || s.etat === "RECEPTION") || [];
  const totalArticles = sacsSelectionnes.reduce((sum, s) => sum + (s.quantiteDeclaree || 0), 0);

  return (
    <div className="collecte-container">

      <LotInfoDialog />
      <ScanLingesPropresModal />

      {/* ─── EN-TeTE ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "8px"
        }}>
          <div style={{
            width: "52px",
            height: "52px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #06b6d4, #0891b2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            boxShadow: "0 4px 16px rgba(6, 182, 212, 0.25)"
          }}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8" />
              <path d="M8 12h8" />
              <path d="M8 8l8 8" />
              <path d="M8 16l8-8" />
            </svg>
          </div>
          <div>
            <h1 style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#0f172a",
              margin: 0
            }}>
              Station de Lavage
            </h1>
            <p style={{
              fontSize: "14px",
              color: "#64748b",
              margin: "2px 0 0 0"
            }}>
              {agent ? `Agent: ${agent.nom || agent.matricule}` : "Aucun agent connecté"}
            </p>
          </div>
        </div>
      </div>

      <div className="collecte-panel-grand" style={{
        background: "white", borderRadius: "20px", padding: "32px",
        border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.06)"
      }}>

        {/* Barre agent + info mode */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: "20px", flexWrap: "wrap", gap: "12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              background: "#dbeafe", width: "48px", height: "48px",
              borderRadius: "12px", display: "flex",
              alignItems: "center", justifyContent: "center"
            }}>
              {agent ? <FaSoap size={22} color="#0ea5e9" /> : <FaUser size={22} color="#94a3b8" />}
            </div>
            <div>
              <span style={{ fontWeight: 700, color: "#1e3a8a", fontSize: "18px" }}>
                {agent ? `${agent.nom} (${agent.matricule})` : "Station de Lavage"}
              </span>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <FaCalendarAlt size={10} />
                {new Date().toLocaleDateString("fr-FR")}{" "}
                {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                {machine && modeLavage === "NORMAL" && (
                  <span style={{ fontWeight: 600, color: "#0ea5e9", marginLeft: "6px" }}>
                    · Machine : {machine.code} ({machine.capaciteKg} kg)
                  </span>
                )}
                {machineInfecte && modeLavage === "INFECTE" && (
                  <span style={{ fontWeight: 600, color: "#dc2626", marginLeft: "6px" }}>
                    · Machine infectée : {machineInfecte.code}
                  </span>
                )}
                {!agent && (
                  <span style={{ fontWeight: 600, color: "#dc2626", marginLeft: "6px" }}>
                    ⚠️ Agent non connecté
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{
              padding: "4px 14px",
              borderRadius: "10px",
              background: modeLavage ? (modeLavage === "NORMAL" ? "#dbeafe" : "#fee2e2") : "#f1f5f9",
              color: getModeColor(),
              fontSize: "12px",
              fontWeight: 600
            }}>
              {getModeLabel()}
            </span>
            <button onClick={handleResetAll} style={{
              padding: "8px 16px", border: "1px solid #e2e8f0",
              borderRadius: "10px", background: "white", color: "#64748b",
              cursor: "pointer", fontSize: "13px", fontWeight: 500,
              display: "flex", alignItems: "center", gap: "6px"
            }}>
              <FaFilter size={12} /> Réinitialiser
            </button>
          </div>
        </div>

        {!agent && (
          <div style={{
            padding: "12px 16px",
            borderRadius: "10px",
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13px",
            color: "#dc2626"
          }}>
            <FaExclamationTriangle size={16} />
            <span style={{ fontWeight: 600 }}>Aucun agent connecté</span>
            <span style={{ color: "#64748b" }}>Veuillez vous connecter pour utiliser la station de lavage</span>
          </div>
        )}

        {/* ── Zone de scan ── */}
        <div style={{
          marginBottom: "20px", padding: "18px 20px",
          background: "#f8fafc", borderRadius: "14px",
          border: `2px dashed ${getBorderColor()}`
        }}>
          <ScanInput
            ref={scanInputRef}
            placeholder={getPlaceholder()}
            value={scanVal}
            onChange={setScanVal}
            onSubmit={handleScan}
            borderColor={getBorderColor()}
            keepFocus={true}
            autoDebounce={true}
            disabled={!agent || isLoading || etapeInfecte === "TERMINE"}
          />
          {modeLavage && (
            <div style={{ marginTop: "8px", fontSize: "11px", color: "#94a3b8" }}>
              {modeLavage === "NORMAL" && etapeBlanc === "LOTS" && (
                <span>📦 {lotsDisponibles.length} lots disponibles · {lotsSelectionnes.length} sélectionnés</span>
              )}
              {modeLavage === "INFECTE" && etapeInfecte === "SACS" && (
                <span>🔴 {sacsDisponibles.length} sacs disponibles · {sacsSelectionnes.length} sélectionnés</span>
              )}
              {modeLavage === "INFECTE" && etapeInfecte === "LAVAGE" && (
                <span>🔄 {sacsSelectionnes.length} sac(s) en lavage · {Math.floor(tempsEcoule / 60)}m {tempsEcoule % 60}s</span>
              )}
              {modeLavage === "INFECTE" && etapeInfecte === "TERMINE" && (
                <span>✅ Cycle terminé - {sacsSelectionnes.length} sac(s) lavés</span>
              )}
            </div>
          )}
        </div>

        {/* ─── Contenu selon le mode ──────────────────────────────────────── */}
        {agent && (
          <>
            {/* ─── MODE NORMAL──────────────────────────── */}
            {modeLavage === "NORMAL" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>
                <div>
                  {etapeBlanc === "MACHINE" && (
                    <div style={{
                      textAlign: "center", padding: "40px",
                      background: "#f8fafc", borderRadius: "14px",
                      border: "2px dashed #e2e8f0", color: "#94a3b8"
                    }}>
                      <FaSoap size={36} style={{ opacity: 0.3, marginBottom: "12px" }} />
                      <div style={{ fontSize: "14px", fontWeight: 500 }}>
                        En attente du scan de la machine
                      </div>
                      <div style={{ fontSize: "12px", marginTop: "4px" }}>
                        Scannez le code de la machine dans le champ ci-dessus
                      </div>
                    </div>
                  )}

                  {(etapeBlanc === "LOTS" || etapeBlanc === "EN_COURS") && (
                    <div style={{
                      background: "#f8fafc", borderRadius: "14px",
                      padding: "16px", border: "1px solid #e2e8f0"
                    }}>
                      <div style={{
                        display: "flex", justifyContent: "space-between",
                        alignItems: "center", marginBottom: "14px"
                      }}>
                        <div style={{
                          fontWeight: 700, fontSize: "14px",
                          display: "flex", alignItems: "center", gap: "8px"
                        }}>
                          <FaBoxes color="#64748b" /> Lots prêts
                          <span style={{
                            background: "#e2e8f0", padding: "2px 8px",
                            borderRadius: "10px", fontSize: "11px", fontWeight: 500
                          }}>
                            {lotsFiltres.length}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchLot}
                            onChange={e => setSearchLot(e.target.value)}
                            onFocus={e => e.stopPropagation()}
                            style={{
                              padding: "6px 10px", borderRadius: "8px",
                              border: "1px solid #e2e8f0", fontSize: "12px",
                              outline: "none", width: "140px"
                            }}
                          />
                          <button onClick={chargerLots} style={{
                            padding: "6px 12px", borderRadius: "8px",
                            border: "1px solid #e2e8f0", background: "white",
                            color: "#64748b", cursor: "pointer", fontSize: "12px"
                          }}>
                            ↻
                          </button>
                        </div>
                      </div>

                      {loadingLots ? (
                        <div style={{ textAlign: "center", padding: "24px", color: "#94a3b8" }}>
                          <FaSpinner style={{ animation: "spin 1s linear infinite" }} /> Chargement...
                        </div>
                      ) : lotsFiltres.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8", fontSize: "13px" }}>
                          <FaBoxes size={30} style={{ opacity: 0.2, marginBottom: "8px" }} />
                          <div>Aucun lot disponible</div>
                        </div>
                      ) : (
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(210px,1fr))",
                          gap: "10px", maxHeight: "380px", overflowY: "auto"
                        }}>
                          {lotsFiltres.map(lot => (
                            <CarteLot
                              key={lot.id}
                              lot={lot}
                              selectionne={!!lotsSelectionnes.find(ls => ls.lot.id === lot.id)}
                              onClick={(l) => {
                                const dejaSelectionne = !!lotsSelectionnes.find(ls => ls.lot.id === l.id);
                                if (dejaSelectionne) retirerLot(l.codeLot);
                                else scannerLot(l.codeLot, poidsTotal);
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {etapeBlanc === "TERMINE" && (
                    <div style={{
                      textAlign: "center", padding: "48px 20px",
                      background: "#f0fdf4", borderRadius: "16px",
                      border: "2px solid #22c55e"
                    }}>
                      <div style={{ fontSize: "56px", marginBottom: "12px" }}>✅</div>
                      <div style={{ fontWeight: 800, fontSize: "20px", marginBottom: "8px", color: "#15803d" }}>
                        Lavage terminé !
                      </div>
                      <div style={{ color: "#64748b", marginBottom: "24px", fontSize: "14px" }}>
                        {lotsSelectionnes.length} lot(s) lavés avec succès
                      </div>
                      <button onClick={nouveauCycleBlanc} style={{
                        padding: "12px 28px", borderRadius: "10px", border: "none",
                        background: "linear-gradient(135deg,#10b981,#059669)",
                        color: "white", fontWeight: 700, cursor: "pointer", fontSize: "15px"
                      }}>
                        Nouveau cycle →
                      </button>
                    </div>
                  )}
                </div>
                <RecapChargement />
              </div>
            )}

            {/* ─── MODE INFECTE──────────────────── */}
            {modeLavage === "INFECTE" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>

                {/* Colonne gauche */}
                <div>
                  {etapeInfecte === "MACHINE" && (
                    <div style={{
                      textAlign: "center", padding: "40px",
                      background: "#f8fafc", borderRadius: "14px",
                      border: "2px dashed #e2e8f0", color: "#94a3b8"
                    }}>
                      <FaSoap size={36} style={{ opacity: 0.3, marginBottom: "12px" }} />
                      <div style={{ fontSize: "14px", fontWeight: 500 }}>
                        En attente du scan de la machine
                      </div>
                      <div style={{ fontSize: "12px", marginTop: "4px" }}>
                        Scannez le code de la machine dans le champ ci-dessus
                      </div>
                    </div>
                  )}

                  {(etapeInfecte === "SACS" || etapeInfecte === "LAVAGE") && (
                    <div style={{
                      background: "#f8fafc", borderRadius: "14px",
                      padding: "16px", border: "1px solid #e2e8f0"
                    }}>
                      <div style={{
                        display: "flex", justifyContent: "space-between",
                        alignItems: "center", marginBottom: "14px"
                      }}>
                        <div style={{
                          fontWeight: 700, fontSize: "14px",
                          display: "flex", alignItems: "center", gap: "8px",
                          color: "#dc2626"
                        }}>
                          <FaBiohazard size={14} /> Sacs disponibles
                          <span style={{
                            background: "#fee2e2", padding: "2px 8px",
                            borderRadius: "10px", fontSize: "11px", fontWeight: 500,
                            color: "#dc2626"
                          }}>
                            {sacsDisponibles.length}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          {machineInfecte && (
                            <span style={{
                              fontSize: "11px",
                              color: "#64748b",
                              background: "#f1f5f9",
                              padding: "2px 10px",
                              borderRadius: "10px"
                            }}>
                              {machineInfecte.code}
                            </span>
                          )}
                        </div>
                      </div>

                      {loadingSacs ? (
                        <div style={{ textAlign: "center", padding: "24px", color: "#94a3b8" }}>
                          <FaSpinner style={{ animation: "spin 1s linear infinite" }} /> Chargement...
                        </div>
                      ) : sacsDisponibles.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8", fontSize: "13px" }}>
                          <FaBoxes size={30} style={{ opacity: 0.2, marginBottom: "8px" }} />
                          <div>Aucun sac disponible</div>
                        </div>
                      ) : (
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(210px,1fr))",
                          gap: "10px", maxHeight: "380px", overflowY: "auto"
                        }}>
                          {sacsDisponibles.map(sac => {
                            const estSelectionne = sacsSelectionnes.find(s => s.numeroSac === sac.numeroSac);
                            return (
                              <div
                                key={sac.id}
                                onClick={() => {
                                  if (!estSelectionne && (etapeInfecte === "SACS" || etapeInfecte === "LAVAGE") && !cycleTermineInfecte && !cycleEnCours) {
                                    scannerSacInfecte(sac.numeroSac);
                                  }
                                }}
                                style={{
                                  padding: "12px 14px",
                                  borderRadius: "10px",
                                  border: `2px solid ${estSelectionne ? "#dc2626" : "#e2e8f0"}`,
                                  background: estSelectionne ? "#fef2f2" : "white",
                                  cursor: (etapeInfecte === "SACS" || etapeInfecte === "LAVAGE") && !estSelectionne && !cycleTermineInfecte && !cycleEnCours ? "pointer" : "not-allowed",
                                  transition: "all 0.15s",
                                  opacity: estSelectionne ? 0.7 : 1,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "4px"
                                }}
                                onMouseEnter={e => {
                                  if (!estSelectionne && (etapeInfecte === "SACS" || etapeInfecte === "LAVAGE") && !cycleTermineInfecte && !cycleEnCours) {
                                    e.currentTarget.style.borderColor = "#dc2626";
                                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(220,38,38,0.15)";
                                  }
                                }}
                                onMouseLeave={e => {
                                  if (!estSelectionne) {
                                    e.currentTarget.style.borderColor = "#e2e8f0";
                                    e.currentTarget.style.boxShadow = "none";
                                  }
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontWeight: 700, fontSize: "13px", color: "#dc2626" }}>
                                    {sac.numeroSac}
                                  </span>
                                  {estSelectionne && (
                                    <Badge style={{ background: "#dc2626", color: "white", fontSize: "9px" }}>
                                      ✓ Sélectionné
                                    </Badge>
                                  )}
                                </div>
                                <div style={{ fontSize: "11px", color: "#64748b" }}>
                                  {sac.quantiteDeclaree || 0} articles
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Écran terminé infecté */}
                  {etapeInfecte === "TERMINE" && cycleTermineInfecte && (
                    <div style={{
                      textAlign: "center", padding: "48px 20px",
                      background: "#f0fdf4", borderRadius: "16px",
                      border: "2px solid #22c55e"
                    }}>
                      <div style={{ fontSize: "56px", marginBottom: "12px" }}>✅</div>
                      <div style={{ fontWeight: 800, fontSize: "20px", marginBottom: "8px", color: "#15803d" }}>
                        Cycle infecté terminé !
                      </div>
                      <div style={{ color: "#64748b", marginBottom: "24px", fontSize: "14px" }}>
                        {sacsSelectionnes.length} sac(s) lavés avec succès
                      </div>
                      <button onClick={nouveauCycleInfecte} style={{
                        padding: "12px 28px", borderRadius: "10px", border: "none",
                        background: "linear-gradient(135deg,#10b981,#059669)",
                        color: "white", fontWeight: 700, cursor: "pointer", fontSize: "15px"
                      }}>
                        Nouveau cycle →
                      </button>
                    </div>
                  )}
                </div>

                {/* Colonne droite - Recap avec timer et boutons */}
                <RecapChargementInfecte
                  sacsSelectionnes={sacsSelectionnes}
                  poidsTotal={totalArticles}
                  onRetirer={retirerSac}
                  onTerminer={etapeInfecte === "SACS" ? lancerCycleInfecte : terminerCycleInfecte}
                  onArreter={arreterCycleInfecte}
                  onNouveauCycle={nouveauCycleInfecte}
                  estTermine={cycleTermineInfecte}
                  estEnLavage={cycleEnCours}
                  tempsEcoule={tempsEcoule}
                />
              </div>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function LavageList() {
  return (
    <LavageProvider>
      <LavageInner />
    </LavageProvider>
  );
}