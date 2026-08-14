import React, { useState, useContext, useRef, useEffect, useCallback } from "react";
import { LingeContext } from "../../contextes/LingeContext";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../contextes/ModalContext";
import {
  FaBarcode, FaFilter, FaCheck, FaTimes, FaUser,
  FaTags, FaHistory, FaCheckCircle, FaBox, FaRss,
  FaExclamationTriangle, FaPlus, FaMinus, FaArrowRight,
  FaWarehouse
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import "../Linge/WorkflowList.css";
import { STATS_INITIALES, STYLES_ETAPE as STYLES, MODE_RFID, MODE_CODEBARRE, COULEURS_LOTS } from "../../constants/tri";
import StatCard from "../../components/utils/tri/StatCard";
import LotField from "../../components/utils/tri/LotField";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { TriProvider, useTri } from "../../contextes/TriContext";
import EtapesStepper from "../../components/utils/shared/EtapesStepper";
import ScanInput from "../../components/utils/shared/ScanInput";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

function TriInner() {
  const { getLingeByCode } = useContext(LingeContext);
  const navigate           = useNavigate();
  const { showAlert, showConfirm } = useModal();

  const [scanValue,     setScanValue]     = useState("");
  const [isFocused,     setIsFocused]     = useState(true);
  const [isLoading,     setIsLoading]     = useState(false);
  const [agentScanne,   setAgentScanne]   = useState(null);
  const [lingeScanne,   setLingeScanne]   = useState(null);
  const [lotSuggere,    setLotSuggere]    = useState(null);
  const [historiqueTri, setHistoriqueTri] = useState([]);
  const [statistiques,  setStatistiques]  = useState(STATS_INITIALES);
  const [modeScan,      setModeScan]      = useState(MODE_CODEBARRE);
  const [lotsSuggere,   setLotsSuggere]   = useState([]);
  const [showDialog,    setShowDialog]    = useState(false);
  const [lingeEnCours,  setLingeEnCours]  = useState(null);

  // Refs
  const scanInputRef    = useRef(null);
  const isMounted       = useRef(true);
  const resetTimeoutRef = useRef(null);
  const scanTimeoutRef  = useRef(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      clearTimeout(resetTimeoutRef.current);
      clearTimeout(scanTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (isMounted.current && scanInputRef.current) {
        scanInputRef.current.focus();
        setIsFocused(true);
      }
    }, 100);
    return () => clearTimeout(t);
  }, []);

  // Statistiques quand agent change
  useEffect(() => {
    if (!agentScanne) return;
    const charger = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/tri/statistiques?matricule=${agentScanne.matricule}`
        );
        if (res.ok && isMounted.current) {
          setStatistiques(await res.json());
        }
      } catch (err) {
        console.error("Erreur statistiques:", err);
      }
    };
    charger();
  }, [agentScanne]);

  const focusInput = useCallback((delay = 200) => {
    setTimeout(() => {
      if (isMounted.current && scanInputRef.current) {
        scanInputRef.current.focus();
        setIsFocused(true);
      }
    }, delay);
  }, []);

  const resetAllStates = useCallback((keepFocus = true) => {
    clearTimeout(resetTimeoutRef.current);
    clearTimeout(scanTimeoutRef.current);
    setScanValue("");
    setAgentScanne(null);
    setLingeScanne(null);
    setLotSuggere(null);
    setLotsSuggere([]);
    setHistoriqueTri([]);
    setStatistiques(STATS_INITIALES);
    setIsLoading(false);
    setShowDialog(false);
    setLingeEnCours(null);
    if (keepFocus) focusInput(150);
  }, [focusInput]);

  useEffect(() => {
    clearTimeout(scanTimeoutRef.current);
    if (scanValue.trim().length <= 2 || isLoading) return;

    scanTimeoutRef.current = setTimeout(() => {
      if (!isMounted.current) return;
      if (!agentScanne) {
        handleScanAgent();
      } else {
        handleScanLinge();
      }
    }, 400);

    return () => clearTimeout(scanTimeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanValue]);

  const handleScanAgent = useCallback(async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const code = scanValue.trim();
    if (!code) return;

    setScanValue("");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/agents/matricule/${code}`);
      if (res.ok) {
        const agent = await res.json();
        setAgentScanne(agent);
        showAlert("Agent identifié", `✅ ${agent.nom || agent.matricule}`, "success");
      } else {
        showAlert("Agent introuvable", `❌ L'agent [${code}] n'existe pas.`, "error");
      }
    } catch (err) {
      console.error(err);
      showAlert("Erreur Technique", "⚠️ Erreur lors de la recherche de l'agent.", "error");
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        focusInput();
      }
    }
  }, [scanValue, showAlert, focusInput]);

  const fetchLotsSuggere = useCallback(async (code) => {
    try {
      const res = await fetch(`${API_URL}/api/tri/lots/suggestion?codeOuTag=${encodeURIComponent(code)}`);
      if (res.ok) {
        const lots = await res.json();
        return lots;
      }
      return [];
    } catch (err) {
      console.error("Erreur suggestion lots:", err);
      return [];
    }
  }, []);

  const affecterAuLot = useCallback(async (lotId) => {
    if (!lingeEnCours || !agentScanne) return;

    setIsLoading(true);
    try {
      const payload = {
        matriculeAgent: agentScanne.matricule,
        codeOuTag: lingeEnCours.codeSuivi || lingeEnCours.codeBarre || lingeEnCours.rfidTag,
        lotId: lotId
      };

      const res = await fetch(`${API_URL}/api/tri`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const error = await res.text();
        let msg = error;
        try { msg = JSON.parse(error).message || error; } catch {}
        throw new Error(msg);
      }

      const lot = await res.json();
      setLotSuggere(lot);
      setShowDialog(false);
      setLingeEnCours(null);
      setLotsSuggere([]);

      setHistoriqueTri(prev => [{
        codeLinge: lingeEnCours.codeSuivi || lingeEnCours.codeBarre,
        categorie: lingeEnCours.categorie,
        typeCollecte: lingeEnCours.typeCollecte,
        lotCode: lot.codeLot,
        date: new Date().toLocaleTimeString(),
        poids: lingeEnCours.poids
      }, ...prev]);

      setStatistiques(prev => ({
        ...prev,
        totalTrie: prev.totalTrie + 1,
        poidsTotal: prev.poidsTotal + (lingeEnCours.poids || 0)
      }));

      showAlert(
        "Tri réussi",
        `✅ ${lingeEnCours.codeSuivi || lingeEnCours.codeBarre} affecté au lot ${lot.codeLot}\n` +
        `📦 Poids: ${lot.poidsActuel?.toFixed(2) || "0"}/${lot.capaciteMax || "0"} kg\n` +
        `📂 Catégorie: ${lot.categorie}\n` +
        `🏷️ Type: ${lot.typeCollecte}`,
        "success"
      );

      setTimeout(() => { if (isMounted.current) setLingeScanne(null); }, 2000);

    } catch (err) {
      console.error("Erreur affectation:", err);
      showAlert("Erreur", `❌ ${err.message}`, "error");
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        focusInput();
      }
    }
  }, [lingeEnCours, agentScanne, showAlert, focusInput]);

  const handleScanLinge = useCallback(async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const code = scanValue.trim();
    if (!code) return;

    setScanValue("");
    setIsLoading(true);
    try {
      const linge = await getLingeByCode(code);
      if (!linge) {
        showAlert("Linge introuvable", `❌ Le code [${code}] n'existe pas.`, "error");
        return;
      }

      if (linge.etat !== "RECEPTION") {
        showAlert(
          "État invalide",
          `⚠️ Le linge [${code}] est en état [${linge.etat}]. Seuls les linges en RECEPTION peuvent être triés.`,
          "warning"
        );
        return;
      }

      setLingeScanne(linge);
      setLingeEnCours(linge);

      const lots = await fetchLotsSuggere(code);
      
      if (lots.length === 0) {
        showAlert(
          "Aucun lot disponible",
          `⚠️ Aucun lot disponible pour ce linge.\nCatégorie: ${linge.categorie}\nType: ${linge.typeCollecte}`,
          "warning"
        );
        setLingeScanne(null);
        setLingeEnCours(null);
        return;
      }

      setLotsSuggere(lots);
      setShowDialog(true);

    } catch (err) {
      console.error("Erreur scan:", err);
      showAlert("Erreur", `❌ ${err.message}`, "error");
      setLingeScanne(null);
      setLingeEnCours(null);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        focusInput();
      }
    }
  }, [scanValue, getLingeByCode, fetchLotsSuggere, showAlert, focusInput]);

  const handleLogoutAgent = useCallback(() => {
    showConfirm("Déconnecter", "Voulez-vous déconnecter l'agent ?", "warning")
      .then(ok => {
        if (ok && isMounted.current) {
          resetAllStates(true);
          showAlert("Déconnexion", "✅ Agent déconnecté", "info");
        }
      });
  }, [showConfirm, showAlert, resetAllStates]);

  const handleResetAll = useCallback(() => {
    showConfirm("Réinitialiser", "Voulez-vous réinitialiser tout le processus de tri ?", "warning")
      .then(ok => {
        if (ok && isMounted.current) {
          resetAllStates(true);
          showAlert("Réinitialisation", "✅ Tout a été réinitialisé", "info");
        }
      });
  }, [showConfirm, showAlert, resetAllStates]);

  const DialogLotsSuggere = () => {
    if (!showDialog || lotsSuggere.length === 0) return null;

    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backdropFilter: "blur(4px)"
      }}>
        <div style={{
          background: "white",
          borderRadius: "24px",
          padding: "28px",
          maxWidth: "580px",
          width: "95%",
          boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
          maxHeight: "90vh",
          overflowY: "auto"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FaTags size={20} color="#2563eb" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "16px", color: "#0f172a" }}>
                  Choisir le lot de tri
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  {lingeEnCours?.codeSuivi || lingeEnCours?.codeBarre} • {lingeEnCours?.categorie} • {lingeEnCours?.typeCollecte}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setShowDialog(false);
                setLotsSuggere([]);
                setLingeEnCours(null);
                setLingeScanne(null);
                focusInput();
              }}
              style={{
                background: "#f1f5f9",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748b"
              }}
            >
              <FaTimes size={14} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
            {lotsSuggere.map((lot, index) => {
              const couleur = COULEURS_LOTS[index % COULEURS_LOTS.length];
              const pourcentage = lot.capaciteMax > 0 ? (lot.poidsActuel / lot.capaciteMax) * 100 : 0;
              const estPlein = pourcentage >= 80;

              return (
                <button
                  key={lot.id || index}
                  onClick={() => affecterAuLot(lot.id)}
                  style={{
                    padding: "16px 12px",
                    borderRadius: "14px",
                    border: `2px solid ${couleur.border}`,
                    background: couleur.bg,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.15s",
                    textAlign: "center",
                    position: "relative"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "scale(1.06)";
                    e.currentTarget.style.borderColor = couleur.color;
                    e.currentTarget.style.boxShadow = `0 4px 16px ${couleur.color}33`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.borderColor = couleur.border;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ fontSize: "28px", lineHeight: 1 }}>{couleur.emoji}</div>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: couleur.color }}>
                    {lot.codeLot}
                  </div>
                  
                  <div style={{ fontSize: "11px", color: "#64748b", display: "flex", flexDirection: "column", gap: "2px", width: "100%" }}>
                    <span>📂 {lot.categorie}</span>
                    <span>🏷️ {lot.typeCollecte}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: couleur.color }}>
                    <FaWarehouse size={12} />
                    <span>{lot.poidsActuel?.toFixed(1) || "0"} / {lot.capaciteMax || "0"} kg</span>
                  </div>

                  <div style={{
                    width: "100%",
                    height: "6px",
                    background: "#e2e8f0",
                    borderRadius: "3px",
                    overflow: "hidden",
                    marginTop: "4px"
                  }}>
                    <div style={{
                      width: `${Math.min(pourcentage, 100)}%`,
                      height: "100%",
                      background: estPlein ? "#ef4444" : couleur.color,
                      borderRadius: "3px",
                      transition: "width 0.3s ease"
                    }} />
                  </div>

                  {estPlein && (
                    <span style={{
                      fontSize: "9px",
                      color: "#ef4444",
                      fontWeight: 700,
                      background: "#fee2e2",
                      padding: "2px 8px",
                      borderRadius: "10px"
                    }}>
                      ⚠️ Plein
                    </span>
                  )}

                  <div style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    fontSize: "10px",
                    fontWeight: 600,
                    color: couleur.color,
                    background: "white",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    border: `1px solid ${couleur.border}`
                  }}>
                    {Math.round(pourcentage)}%
                  </div>
                </button>
              );
            })}
          </div>

          {lotsSuggere.length === 0 && (
            <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
              <FaExclamationTriangle size={32} style={{ opacity: 0.3, marginBottom: "10px" }} />
              <div>Aucun lot disponible pour ce linge</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const scanPlaceholder = agentScanne
    ? `📦 Scanner un article (${modeScan === MODE_RFID ? "RFID" : "Code-barres"})...`
    : "👤 Scanner votre badge agent...";

  const agentStep = agentScanne ? STYLES.stepCompleted : STYLES.stepActive;
  const triStep   = agentScanne
    ? (lotSuggere ? STYLES.stepCompleted : STYLES.stepActive)
    : STYLES.stepIdle;

  return (
    <div className="collecte-container">

      {/* Dialog de suggestion de lots */}
      <DialogLotsSuggere />

      {/* ── Header ── */}
      <div className="page-header" style={{ marginBottom: 0, textAlign: "left" }}>
        <h1 className="text-3xl font-extrabold" style={{ marginBottom: "4px" }}>
          🏷️ Tri de Linge
        </h1>
        <p className="text-sm" style={{ color: "#166d7c", marginBottom: "24px" }}>
          Scannez un agent puis un linge pour l'affecter à un lot de tri
        </p>
      </div>

      <div
        className="collecte-panel-grand"
        style={{
          background: "white",
          borderRadius: "20px",
          padding: "32px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
          minHeight: "600px"
        }}
      >

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ background: "#dbeafe", width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {agentScanne ? <FaTags size={18} /> : <FaUser size={18} />}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#1e3a8a", fontSize: "20px" }}>Tri automatique</div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                {agentScanne
                  ? <span>Agent: <strong>{agentScanne.nom || agentScanne.matricule}</strong></span>
                  : "En attente de scan de l'agent"
                }
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={() => setModeScan(modeScan === MODE_RFID ? MODE_CODEBARRE : MODE_RFID)}
              style={{
                padding: "8px 16px",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                background: "#f8fafc",
                color: "#64748b",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              {modeScan === MODE_RFID ? <FaRss size={14} /> : <FaBarcode size={14} />}
              {modeScan === MODE_RFID ? "RFID" : "Code-barres"}
            </button>
            {agentScanne && (
              <button onClick={handleLogoutAgent} style={btnStyle}>
                <FaUser size={14} /> Changer d'agent
              </button>
            )}
            <button onClick={handleResetAll} style={btnStyle}>
              <FaFilter /> Réinitialiser
            </button>
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <EtapesStepper 
            etapes={[
              { id: "AGENT", label: "Agent", done: !!agentScanne },
              { id: "SCAN", label: "Scan linge", done: !!lingeScanne },
              { id: "LOT", label: "Affectation lot", done: !!lotSuggere }
            ]} 
            etapeActive={!agentScanne ? "AGENT" : !lingeScanne ? "SCAN" : "LOT"} 
          />
        </div>

        {agentScanne && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "20px", padding: "16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <StatCard value={statistiques.totalTrie || 0} label="Articles triés" color="#0ea5e9" />
            <StatCard value={statistiques.lotsUtilises || 0} label="Lots utilisés" color="#22c55e" />
            <StatCard value={(statistiques.poidsTotal?.toFixed(1) || "0") + " kg"} label="Poids total" color="#8b5cf6" />
          </div>
        )}

        <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap", padding: "20px", background: "#f8fafc", borderRadius: "12px", border: agentScanne ? "2px solid #22c55e" : "2px dashed #e2e8f0" }}>
          <div style={{ flex: 1, minWidth: "300px" }}>
            <form onSubmit={agentScanne ? handleScanLinge : handleScanAgent} style={{ margin: 0 }}>
              <div style={{ position: "relative", width: "100%" }}>
                <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>
                  {modeScan === MODE_RFID ? <FaRss size={18} /> : <FaBarcode size={18} />}
                </div>
                <input
                  ref={scanInputRef}
                  type="text"
                  placeholder={scanPlaceholder}
                  value={scanValue}
                  onChange={e => setScanValue(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  disabled={isLoading || showDialog}
                  style={{
                    width: "100%",
                    padding: "16px 16px 16px 48px",
                    borderRadius: "10px",
                    border: `2px solid ${isFocused ? "#0ea5e9" : "#e2e8f0"}`,
                    fontSize: "16px",
                    background: (isLoading || showDialog) ? "#f1f5f9" : "white",
                    transition: "all 0.2s",
                    outline: "none",
                    boxShadow: isFocused ? "0 0 0 3px rgba(14,165,233,0.1)" : "none",
                    cursor: (isLoading || showDialog) ? "not-allowed" : "text",
                    boxSizing: "border-box"
                  }}
                />
                {scanValue && !showDialog && (
                  <button
                    type="button"
                    onClick={() => setScanValue("")}
                    style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "8px" }}
                  >
                    <FaTimes size={16} />
                  </button>
                )}
              </div>
            </form>

            <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#94a3b8" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: isFocused ? "#10b981" : "#9ca3af", transition: "background 0.3s" }} />
              <span>Lecteur: {isFocused ? "Prêt" : "Inactif"}</span>
              {isLoading && <span style={{ marginLeft: "16px", color: "#0ea5e9" }}>⏳ Traitement...</span>}
              <span style={{ marginLeft: "16px" }}>{agentScanne ? "📦 Scan linge" : "👤 Scan agent"}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ padding: "8px 16px", borderRadius: "10px", background: agentScanne ? "#dcfce7" : "#f1f5f9", color: agentScanne ? "#15803d" : "#94a3b8", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
              {agentScanne ? <FaCheckCircle size={16} color="#22c55e" /> : <FaTimes size={16} />}
              {agentScanne ? "Agent connecté" : "Agent non connecté"}
            </div>
            {showDialog && (
              <div style={{ padding: "8px 16px", borderRadius: "10px", background: "#fef3c7", color: "#92400e", fontSize: "13px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                <FaExclamationTriangle size={14} /> Choix du lot en cours...
              </div>
            )}
          </div>
        </div>

        {lotSuggere && (
          <div style={{ background: "linear-gradient(135deg, #dbeafe, #eff6ff)", borderRadius: "12px", padding: "20px", border: "2px solid #3b82f6", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
              <FaCheckCircle size={24} color="#2563eb" />
              <span style={{ fontWeight: 700, fontSize: "18px", color: "#1e3a8a" }}>Lot affecté</span>
              <span style={{ padding: "4px 12px", borderRadius: "20px", background: "#2563eb", color: "white", fontSize: "12px", fontWeight: 600 }}>
                {lotSuggere.codeLot}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
              <LotField label="Type" value={lotSuggere.typeCollecte} />
              <LotField label="Catégorie" value={lotSuggere.categorie} />
              <LotField label="Poids" value={`${lotSuggere.poidsActuel?.toFixed(2) || "0"} / ${lotSuggere.capaciteMax || "0"} kg`} />
              <LotField label="État" value={lotSuggere.etat} color={lotSuggere.etat === "EN_TRI" ? "#22c55e" : "#f59e0b"} />
            </div>
          </div>
        )}

        {lingeScanne && !lotSuggere && (
          <div style={{ background: "#f0fdf4", borderRadius: "12px", padding: "16px", border: "2px solid #22c55e", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <FaBarcode size={20} color="#22c55e" />
              <span style={{ fontWeight: 600 }}>Dernier linge scanné</span>
              <code style={{ padding: "4px 12px", background: "#dcfce7", borderRadius: "6px", fontSize: "14px", fontWeight: 600, color: "#15803d" }}>
                {lingeScanne.codeSuivi || lingeScanne.codeBarre}
              </code>
              <span style={{ fontSize: "13px", color: "#64748b" }}>{lingeScanne.categorie} • {lingeScanne.typeCollecte}</span>
              <span style={{ fontSize: "13px", color: "#64748b" }}>{lingeScanne.poids} kg</span>
            </div>
          </div>
        )}

        {historiqueTri.length > 0 && (
          <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0", marginTop: "16px" }}>
            <div style={{ fontWeight: 600, fontSize: "14px", color: "#1e293b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaHistory />
              Historique des tris ({historiqueTri.length})
            </div>
            <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
              {historiqueTri.map((item, index) => (
                <div
                  key={index}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "white", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", flexWrap: "wrap", gap: "4px" }}
                >
                  <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ color: "#94a3b8", fontSize: "11px" }}>#{index + 1}</span>
                    <code style={{ fontWeight: 600, color: "#0ea5e9" }}>{item.codeLinge}</code>
                    <span style={{ color: "#475569" }}>{item.categorie}</span>
                    <span style={{ padding: "2px 8px", borderRadius: "12px", background: item.typeCollecte === "BLANC" ? "#dcfce7" : "#fee2e2", color: item.typeCollecte === "BLANC" ? "#15803d" : "#dc2626", fontSize: "11px", fontWeight: 600 }}>
                      {item.typeCollecte}
                    </span>
                    <span style={{ color: "#64748b", fontSize: "11px" }}>→ {item.lotCode}</span>
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>{item.poids} kg</span>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>{item.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e2e8f0", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", gap: "20px", fontSize: "13px", color: "#64748b" }}>
            {agentScanne && (
              <>
                <span>Agent: <strong style={{ color: "#0f172a" }}>{agentScanne.nom || agentScanne.matricule}</strong></span>
                <span>Matricule: <strong style={{ color: "#0f172a" }}>{agentScanne.matricule}</strong></span>
              </>
            )}
            {lotSuggere && (
              <span>Dernier lot: <strong style={{ color: "#3b82f6" }}>{lotSuggere.codeLot}</strong></span>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px", fontSize: "12px", color: "#94a3b8" }}>
            <span>{new Date().toLocaleDateString("fr-FR")}</span>
            <span>•</span>
            <span>{new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

const btnStyle = {
  padding: "8px 20px",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  background: "white",
  color: "#64748b",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 500,
  display: "flex",
  alignItems: "center",
  gap: "6px"
};

export default function TriList() {
  return <TriProvider><TriInner /></TriProvider>;
}