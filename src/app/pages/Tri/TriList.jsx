import React, { useState, useContext, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { LingeContext } from "../../contextes/LingeContext";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../contextes/ModalContext";
import {
  FaBarcode, FaFilter, FaCheck, FaTimes, FaUser,
  FaTags, FaHistory, FaCheckCircle, FaBox,
  FaExclamationTriangle, FaPlus, FaMinus, FaArrowRight
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import "../Linge/WorkflowList.css";
import { STATS_INITIALES, STYLES_ETAPE as STYLES, MODE_RFID, MODE_CODEBARRE } from "../../constants/tri";
import StatCard from "../../components/utils/tri/StatCard";
import LotField from "../../components/utils/tri/LotField";
import { LotBasketCard } from "../../components/utils/shared/LotBasket";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { TriProvider, useTri } from "../../contextes/TriContext";
import EtapesStepper from "../../components/utils/shared/EtapesStepper";
import ScanInput from "../../components/utils/shared/ScanInput";
import { getAgent, isAgentConnected } from "../../services/agentService";
import { PageHeaderIcon } from "../../components/layout/PageHeaderIcon";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

function TriInner() {
  const { t } = useTranslation();

  const { getLingeByCode, isRfidMode } = useContext(LingeContext);
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
  // Mode de lecture réglé dans Paramètres › Lecture / Scan
  const modeScan = isRfidMode ? MODE_RFID : MODE_CODEBARRE;
  const [lotsSuggere,   setLotsSuggere]   = useState([]);
  const [showDialog,    setShowDialog]    = useState(false);
  const [lingeEnCours,  setLingeEnCours]  = useState(null);

  const scanInputRef    = useRef(null);
  const isMounted       = useRef(true);
  const resetTimeoutRef = useRef(null);
  const scanTimeoutRef  = useRef(null);

  // ✅ Récupérer l'agent depuis localStorage
  useEffect(() => {
    const agentData = getAgent();
    if (agentData && isAgentConnected()) {
      const ag = {
        matricule: agentData.codeBarre || agentData.matricule || '',
        nom: agentData.nom || 'Inconnu',
        prenom: agentData.prenom || '',
        nomPrenom: agentData.nomPrenom || agentData.nom || 'Inconnu',
        codeBarre: agentData.codeBarre || agentData.matricule || '',
        id: agentData.id || null,
        poste: agentData.poste || 'AGENT_TRI'
      };
      setAgentScanne(ag);
      chargerStatistiques(ag.matricule);
    }
  }, []);

  const chargerStatistiques = useCallback(async (matricule) => {
    try {
      const res = await fetch(
        `${API_URL}/api/tri/statistiques?matricule=${matricule}`
      );
      if (res.ok && isMounted.current) {
        setStatistiques(await res.json());
      }
    } catch (err) {
      console.error("Erreur statistiques:", err);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      clearTimeout(resetTimeoutRef.current);
      clearTimeout(scanTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMounted.current && scanInputRef.current) {
        scanInputRef.current.focus();
        setIsFocused(true);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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

  const getAgentFullName = () => {
    if (!agentScanne) return '';
    return agentScanne.nomPrenom || agentScanne.nom || agentScanne.matricule;
  };

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
        const agentWithName = {
          ...agent,
          nomPrenom: agent.nomPrenom || agent.nom || agent.matricule
        };
        setAgentScanne(agentWithName);
        await chargerStatistiques(agentWithName.matricule);
        showAlert(
          t('tri.agent_identified'),
          `✅ ${agentWithName.nomPrenom} (${agentWithName.matricule})`,
          "success"
        );
      } else {
        showAlert(
          t('tri.agent_not_found'),
          t('tri.agent_not_found_text', { code: code }),
          "error"
        );
      }
    } catch (err) {
      console.error(err);
      showAlert(t('tri.technical_error'), t('tri.technical_error_text'), "error");
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        focusInput();
      }
    }
  }, [scanValue, showAlert, focusInput, chargerStatistiques, t]);

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
        t('tri.tri_success'),
        t('tri.tri_success_text', {
          code: lingeEnCours.codeSuivi || lingeEnCours.codeBarre,
          lotCode: lot.codeLot,
          poids: lot.poidsActuel?.toFixed(2) || "0",
          capacite: lot.capaciteMax || "0",
          categorie: lot.categorie,
          typeCollecte: lot.typeCollecte
        }),
        "success"
      );

      setTimeout(() => { if (isMounted.current) setLingeScanne(null); }, 2000);

    } catch (err) {
      console.error("Erreur affectation:", err);
      showAlert(t('tri.tri_error'), t('tri.tri_error_text', { message: err.message }), "error");
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        focusInput();
      }
    }
  }, [lingeEnCours, agentScanne, showAlert, focusInput, t]);

  const handleScanLinge = useCallback(async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const code = scanValue.trim();
    if (!code) return;

    setScanValue("");
    setIsLoading(true);
    try {
      const linge = await getLingeByCode(code);
      if (!linge) {
        showAlert(t('tri.linge_not_found'), t('tri.linge_not_found_text', { code: code }), "error");
        return;
      }

      if (linge.etat !== "RECEPTION") {
        showAlert(
          t('tri.invalid_state'),
          t('tri.invalid_state_text', { code: code, etat: linge.etat }),
          "warning"
        );
        return;
      }

      setLingeScanne(linge);
      setLingeEnCours(linge);

      const lots = await fetchLotsSuggere(code);
      
      if (lots.length === 0) {
        showAlert(
          t('tri.no_lot_available_title'),
          t('tri.no_lot_available_message', {
            categorie: linge.categorie,
            typeCollecte: linge.typeCollecte
          }),
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
      showAlert(t('tri.tri_error'), t('tri.tri_error_text', { message: err.message }), "error");
      setLingeScanne(null);
      setLingeEnCours(null);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        focusInput();
      }
    }
  }, [scanValue, getLingeByCode, fetchLotsSuggere, showAlert, focusInput, t]);

  const handleLogoutAgent = useCallback(() => {
    showConfirm(t('tri.confirm_logout'), t('tri.confirm_logout_text'), "warning")
      .then(ok => {
        if (ok && isMounted.current) {
          resetAllStates(true);
          showAlert(t('tri.logout_success'), "✅ Agent déconnecté", "info");
        }
      });
  }, [showConfirm, showAlert, resetAllStates, t]);

  const handleResetAll = useCallback(() => {
    showConfirm(t('tri.confirm_reset'), t('tri.confirm_reset_text'), "warning")
      .then(ok => {
        if (ok && isMounted.current) {
          resetAllStates(true);
          showAlert(t('tri.reset_success'), "✅ Tout a été réinitialisé", "info");
        }
      });
  }, [showConfirm, showAlert, resetAllStates, t]);

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
          maxWidth: lotsSuggere.length > 2 ? "760px" : "580px",
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
                  {t('tri.choose_lot')}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  {lingeEnCours?.codeSuivi || lingeEnCours?.codeBarre} • {t(`categories.${lingeEnCours?.categorie}`, lingeEnCours?.categorie || "")} • {lingeEnCours?.typeCollecte}
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

          <div className="lot-basket-grid">
            {lotsSuggere.map((lot, index) => (
              <LotBasketCard key={lot.id || index} lot={lot} t={t} onSelect={() => affecterAuLot(lot.id)} />
            ))}
          </div>

          {lotsSuggere.length === 0 && (
            <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
              <FaExclamationTriangle size={32} style={{ opacity: 0.3, marginBottom: "10px" }} />
              <div>{t('tri.no_lot_available')}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const getPlaceholder = () => {
    if (!agentScanne) return t('tri.scan_placeholder_no_agent');
    return modeScan === MODE_RFID ? t('tri.scan_placeholder_rfid') : t('tri.scan_placeholder');
  };

  const getBorderColor = () => {
    if (!agentScanne) return "#dc2626";
    return "#f59e0b";
  };

  return (
    <div className="collecte-container">

      <DialogLotsSuggere />

      {/* ── Header ── */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "8px"
        }}>
          <PageHeaderIcon size={52} />
          <div>
            <h1 style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#0f172a",
              margin: 0
            }}>
              {t('tri.title')}
            </h1>
            <p style={{
              fontSize: "14px",
              color: "#64748b",
              margin: "2px 0 0 0"
            }}>
              {agentScanne 
                ? t('tri.subtitle', { agent: getAgentFullName() })
                : t('tri.subtitle_no_agent')}
            </p>
          </div>
        </div>
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

        {/* Barre supérieure */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {agentScanne ? (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 16px",
                background: "#f0fdf4",
                borderRadius: "10px",
                border: "1px solid #bbf7d0"
              }}>
                <FaCheckCircle color="#22c55e" size={16} />
                <span style={{ fontWeight: 700, color: "#15803d", fontSize: "14px" }}>
                  {getAgentFullName()}
                </span>
                <Badge variant="outline" style={{ fontSize: "11px" }}>
                  {agentScanne.codeBarre || agentScanne.matricule}
                </Badge>
                <button
                  onClick={handleLogoutAgent}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer"
                  }}
                >
                  <FaTimes size={12} />
                </button>
              </div>
            ) : (
              <div style={{ fontSize: "13px", color: "#94a3b8" }}>{t('tri.no_agent_title')}</div>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetAll}
            >
              {t('tri.reset')}
            </Button>
          </div>
        </div>

        {/* ─── Message si agent non connecté ──────────────────────────────── */}
        {!agentScanne && (
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
            <span style={{ fontWeight: 600 }}>{t('tri.no_agent_title')}</span>
            <span style={{ color: "#64748b" }}>{t('tri.no_agent_message')}</span>
          </div>
        )}

        {/* ─── ZONE DE SCAN ────────────────────────────────────────────── */}
        <Card style={{
          marginBottom: "20px",
          border: `2px dashed ${getBorderColor()}`
        }}>
          <CardContent className="p-5">
            <ScanInput
              ref={scanInputRef}
              placeholder={getPlaceholder()}
              value={scanValue}
              onChange={setScanValue}
              onSubmit={agentScanne ? handleScanLinge : handleScanAgent}
              borderColor={getBorderColor()}
              keepFocus={true}
              autoDebounce={true}
              disabled={!agentScanne || isLoading || showDialog}
            />
          </CardContent>
        </Card>

        {/* ─── INFO AGENT ────────────────────────────────────────────────── */}
        {agentScanne && (
          <Card style={{ background: "#fef3c7", border: "1px solid #fcd34d", marginBottom: "16px" }}>
            <CardContent className="p-4">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <FaTags color="#d97706" size={16} />
                <span style={{ fontWeight: 600, color: "#92400e" }}>{t('tri.ready')}</span>
                <span style={{ color: "#64748b" }}>{t('tri.ready_text')}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── STATISTIQUES ────────────────────────────────────────────────── */}
        {agentScanne && (
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
            gap: "12px", 
            marginBottom: "20px"
          }}>
            <StatCard value={statistiques.totalTrie || 0} label={t('tri.articles_tried')} color="#0ea5e9" />
            <StatCard value={statistiques.lotsUtilises || 0} label={t('tri.lots_used')} color="#22c55e" />
            <StatCard value={(statistiques.poidsTotal?.toFixed(1) || "0") + " " + t('tri.weight')} label={t('tri.total_weight')} color="#8b5cf6" />
          </div>
        )}

        {/* ─── LOT AFFECTÉ ────────────────────────────────────────────────── */}
        {lotSuggere && (
          <div style={{ 
            background: "linear-gradient(135deg, #dbeafe, #eff6ff)", 
            borderRadius: "12px", 
            padding: "16px", 
            border: "2px solid #3b82f6", 
            marginBottom: "16px" 
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
              <FaCheckCircle size={20} color="#2563eb" />
              <span style={{ fontWeight: 700, fontSize: "16px", color: "#1e3a8a" }}>{t('tri.lot_affected')}</span>
              <Badge style={{ background: "#2563eb", color: "white", fontSize: "11px" }}>
                {lotSuggere.codeLot}
              </Badge>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "8px" }}>
              <LotField label={t('tri.type')} value={lotSuggere.typeCollecte} />
              <LotField label={t('tri.category')} value={lotSuggere.categorie} />
              <LotField label={t('tri.weight')} value={`${lotSuggere.poidsActuel?.toFixed(2) || "0"} / ${lotSuggere.capaciteMax || "0"} kg`} />
              <LotField label={t('tri.status')} value={lotSuggere.etat} color={lotSuggere.etat === "EN_TRI" ? "#22c55e" : "#f59e0b"} />
            </div>
          </div>
        )}

        {/* ─── LINGE SCANNÉ ───────────────────────────────────────────────── */}
        {lingeScanne && !lotSuggere && (
          <div style={{ 
            background: "#f0fdf4", 
            borderRadius: "12px", 
            padding: "12px 16px", 
            border: "2px solid #22c55e", 
            marginBottom: "16px" 
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <FaBarcode size={18} color="#22c55e" />
              <span style={{ fontWeight: 600 }}>{t('tri.last_scanned')}</span>
              <code style={{ 
                padding: "2px 10px", 
                background: "#dcfce7", 
                borderRadius: "6px", 
                fontSize: "13px", 
                fontWeight: 600, 
                color: "#15803d" 
              }}>
                {lingeScanne.codeSuivi || lingeScanne.codeBarre}
              </code>
              <span style={{ fontSize: "12px", color: "#64748b" }}>{lingeScanne.categorie} • {lingeScanne.typeCollecte}</span>
              <span style={{ fontSize: "12px", color: "#64748b" }}>{lingeScanne.poids} kg</span>
            </div>
          </div>
        )}

        {/* ─── HISTORIQUE ────────────────────────────────────────────────── */}
        {historiqueTri.length > 0 && (
          <div style={{ 
            background: "#f8fafc", 
            borderRadius: "12px", 
            padding: "16px", 
            border: "1px solid #e2e8f0", 
            marginTop: "16px" 
          }}>
            <div style={{ 
              fontWeight: 600, 
              fontSize: "14px", 
              color: "#1e293b", 
              marginBottom: "12px", 
              display: "flex", 
              alignItems: "center", 
              gap: "8px" 
            }}>
              <FaHistory />
              {t('tri.history')} ({historiqueTri.length})
            </div>
            <div style={{ 
              maxHeight: "200px", 
              overflowY: "auto", 
              display: "flex", 
              flexDirection: "column", 
              gap: "4px" 
            }}>
              {historiqueTri.map((item, index) => (
                <div
                  key={index}
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between", 
                    padding: "6px 12px", 
                    background: "white", 
                    borderRadius: "8px", 
                    border: "1px solid #e2e8f0", 
                    fontSize: "12px", 
                    flexWrap: "wrap", 
                    gap: "4px" 
                  }}
                >
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ color: "#94a3b8", fontSize: "10px" }}>#{index + 1}</span>
                    <code style={{ fontWeight: 600, color: "#0ea5e9", fontSize: "12px" }}>{item.codeLinge}</code>
                    <span style={{ color: "#475569", fontSize: "12px" }}>{item.categorie}</span>
                    <Badge style={{ 
                      background: item.typeCollecte === "BLANC" ? "#dcfce7" : "#fee2e2", 
                      color: item.typeCollecte === "BLANC" ? "#15803d" : "#dc2626", 
                      fontSize: "9px" 
                    }}>
                      {item.typeCollecte}
                    </Badge>
                    <span style={{ color: "#64748b", fontSize: "11px" }}>→ {item.lotCode}</span>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ fontSize: "10px", color: "#94a3b8" }}>{item.poids} kg</span>
                    <span style={{ fontSize: "10px", color: "#94a3b8" }}>{item.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── FOOTER ────────────────────────────────────────────────────── */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "16px",
          paddingTop: "16px",
          borderTop: "1px solid #e2e8f0",
          flexWrap: "wrap",
          gap: "8px"
        }}>
          <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#64748b" }}>
            {agentScanne && (
              <>
                <span>{t('tri.agent')}: <strong style={{ color: "#0f172a" }}>{getAgentFullName()}</strong></span>
                <span>{t('tri.matricule')}: <strong style={{ color: "#0f172a" }}>{agentScanne.matricule}</strong></span>
              </>
            )}
            {!agentScanne && (
              <span style={{ color: "#dc2626" }}>⚠️ {t('tri.no_agent_title')}</span>
            )}
            {lotSuggere && (
              <span>{t('tri.last_lot')}: <strong style={{ color: "#3b82f6" }}>{lotSuggere.codeLot}</strong></span>
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

export default function TriList() {
  return <TriProvider><TriInner /></TriProvider>;
}