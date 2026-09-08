import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useModal } from "../../../contextes/ModalContext";
import {
  FaUser, FaTimes, FaBiohazard, FaCheckCircle, FaCheck,
  FaExclamationTriangle, FaSpinner, FaRedo, FaUserMd,
  FaCheckDouble, FaBox, FaBoxes
} from "react-icons/fa";
import { Card, CardContent } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import ScanInput from "../../../components/utils/shared/ScanInput";
import { cat, ST_COLORS, apiCall } from "../collecteUtils";
import { getAgent, isAgentConnected } from "../../../services/agentService";
import "../../Linge/WorkflowList.css";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';

// ─── COMPOSANT : StatutCard ──────────────────────────────────────────────
function StatutCard({ label, value, icon, color, bg, subValue }) {
  return (
    <div style={{
      padding: "14px 16px",
      borderRadius: "12px",
      background: bg,
      border: `1px solid ${color}25`,
      flex: 1,
      minWidth: "100px",
      transition: "all 0.2s ease"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          background: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px"
        }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize: "10px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>
            {label}
          </p>
          <p style={{ fontSize: "22px", fontWeight: 700, color: color, margin: 0, lineHeight: 1.2 }}>
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

// ─── DIALOGUE MANQUANT ─────────────────────────────────────────────────────
function DlgManquant({ linge, onOk, onClose, t }) {
  if (!linge) return null;
  const c = cat(linge.categorie);
  return (
    <div data-modal="true" style={{
      position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, backdropFilter: "blur(4px)"
    }}>
      <div style={{
        background: "white", borderRadius: "16px", padding: "24px",
        maxWidth: "340px", width: "92%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "14px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: "#fef3c7", display: "flex",
              alignItems: "center", justifyContent: "center"
            }}>
              <FaExclamationTriangle size={14} color="#d97706" />
            </div>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
              {t('collecte_uniforme.missing_uniform')}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "transparent", border: "1px solid #e2e8f0",
            borderRadius: "8px", width: "30px", height: "30px",
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", color: "#94a3b8"
          }}>
            <FaTimes size={12} />
          </button>
        </div>

        <div style={{
          padding: "10px 14px", background: c.bg, borderRadius: "10px",
          marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px"
        }}>
          <span style={{ fontSize: "20px" }}>{c.emoji}</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: "13px", color: c.color }}>{c.label}</div>
            <code style={{ fontSize: "11px", color: "#64748b" }}>{linge.codeBarre}</code>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "10px", borderRadius: "8px",
            border: "1px solid #e2e8f0", background: "white",
            color: "#64748b", fontWeight: 600, fontSize: "12px",
            cursor: "pointer"
          }}>
            {t('common.cancel')}
          </button>
          <button onClick={() => onOk(linge)} style={{
            flex: 2, padding: "10px", borderRadius: "8px",
            border: "none", background: "#d97706",
            color: "white", fontWeight: 700, fontSize: "12px",
            cursor: "pointer"
          }}>
            {t('collecte_uniforme.confirm_missing')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CARTE UNIFORME ──────────────────────────────────────────────────────
function CarteUniforme({ u, uniformeEnCours, onManquant, t }) {
  const c = cat(u.categorie);
  const col = ST_COLORS[u.statut];
  const estActif = uniformeEnCours?.lingeId === u.lingeId;

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 14px",
      borderRadius: "8px",
      border: `1px solid ${estActif ? "#7c3aed" : col?.b || "#e2e8f0"}`,
      background: estActif ? "#faf5ff" : col?.bg || "#f8fafc",
      transition: "all 0.15s",
      marginBottom: "4px"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "16px" }}>{c.emoji}</span>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: c.color }}>{c.label}</span>
            {u.estInfecte && !u.statut && (
              <span style={{
                fontSize: "8px", padding: "1px 6px", borderRadius: "4px",
                background: "#fee2e2", color: "#dc2626", fontWeight: 700
              }}>
                ⚠️
              </span>
            )}
            {estActif && (
              <Badge style={{ background: "#ede9fe", color: "#7c3aed", fontSize: "9px" }}>
                {t('collecte_uniforme.scan_bin')}
              </Badge>
            )}
          </div>
          <code style={{ fontSize: "10px", color: "#94a3b8" }}>{u.codeBarre}</code>
        </div>
      </div>

      {u.statut ? (
        <span style={{
          fontSize: "9px", fontWeight: 700, padding: "2px 10px",
          borderRadius: "12px", background: col?.tag, color: col?.tc
        }}>
          {col?.lbl}
        </span>
      ) : (
        <button
          onClick={() => onManquant(u)}
          title={t('collecte_uniforme.missing')}
          style={{
            width: "26px", height: "26px", borderRadius: "50%",
            border: "1px solid #fde68a", background: "#fef3c7",
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center"
          }}
        >
          <FaExclamationTriangle size={9} color="#d97706" />
        </button>
      )}
    </div>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────
function CollageListUniformeInner() {
  const { t } = useTranslation();
  const { showAlert, showConfirm } = useModal();

  const [etape, setEtape] = useState("BADGE");
  const [agent, setAgent] = useState(null);
  const [collecte, setCollecte] = useState(null);
  const [uniformeEnCours, setUniformeEnCours] = useState(null);
  const [scanVal, setScanVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState(null);
  const [dlgManq, setDlgManq] = useState(null);
  const [scanStatus, setScanStatus] = useState(null);

  const agentRef = useRef(null);
  const collecteRef = useRef(null);
  const scanInputRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  useEffect(() => { agentRef.current = agent; }, [agent]);
  useEffect(() => { collecteRef.current = collecte; }, [collecte]);

  // ✅ Récupérer l'agent depuis localStorage au chargement
  useEffect(() => {
    const agentData = getAgent();
    if (agentData && isAgentConnected()) {
      const ag = {
        matricule: agentData.codeBarre || agentData.matricule,
        nom: agentData.nom || "Inconnu",
        prenom: agentData.prenom || "",
        nomPrenom: agentData.nomPrenom || agentData.nom || "Inconnu",
        codeBarre: agentData.codeBarre || agentData.matricule,
        id: agentData.id,
        poste: agentData.poste || "AGENT_COLLECTE"
      };
      setAgent(ag);
      setEtape("BADGE");
      setScanStatus({
        loading: false,
        success: { 
          message: `👤 ${ag.nomPrenom || ag.nom}`, 
          detail: `${t('collecte_uniforme.connected')} · ${ag.codeBarre || ag.matricule}` 
        },
        error: null
      });
      setTimeout(() => setScanStatus(null), 2000);
    } else {
      setEtape("BADGE");
      setScanStatus({
        loading: false,
        success: null,
        error: t('collecte_uniforme.no_agent_connected')
      });
    }
  }, [t]);

  // ─── Scan automatique ──────────────────────────────────────────────────
  useEffect(() => {
    if (scanVal.trim().length < 2) return;
    clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = setTimeout(() => {
      const code = scanVal.trim();
      setScanVal("");
      handleScan(code);
    }, 300);
    return () => clearTimeout(scanTimeoutRef.current);
  }, [scanVal]);

  // ─── Focus ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const keepFocus = () => {
      if (scanInputRef.current && !document.querySelector('[data-modal="true"]')) {
        scanInputRef.current.focus();
      }
    };
    const id = setInterval(keepFocus, 500);
    keepFocus();
    return () => clearInterval(id);
  }, []);

  const majUniforme = useCallback((lingeId, statut) => {
    setCollecte(p => p ? {
      ...p,
      uniformes: p.uniformes.map(u => u.lingeId === lingeId ? { ...u, statut } : u)
    } : p);
  }, []);

  // ─── ÉTAPE 2 : Badge médecin ─────────────────────────────────────────
  const handleBadge = useCallback(async (code) => {
    if (!agent) {
      showAlert(t('collecte_uniforme.errors.agent_not_connected'), t('collecte_uniforme.errors.agent_not_connected_text'), "error");
      return;
    }
    setLoading(true);
    setScanStatus(null);
    try {
      const res = await apiCall("/api/collecte/uniforme/ouvrir", {
        matriculeAgent: agent.codeBarre || agent.matricule,
        codeBadge: code
      });
      setCollecte({
        id: res.collecteId,
        personnelNom: res.personnelNom,
        personnelFonction: res.personnelFonction,
        personnelId: res.personnelId,
        estInfecte: res.estInfecte,
        infoInfection: res.infoInfection,
        nbUniformes: res.nbUniformes,
        uniformes: (res.uniformes || []).map(u => ({ ...u, statut: "" }))
      });
      setUniformeEnCours(null);
      setEtape("SCAN");
      setScanStatus({
        loading: false,
        success: {
          message: res.estInfecte ? t('collecte_uniforme.infectious_contact') : `✅ ${res.personnelNom}`,
          detail: res.estInfecte ? res.infoInfection || t('collecte_uniforme.potentially_infected') : `${res.nbUniformes} ${t('collecte_uniforme.uniforms')}`
        },
        error: null
      });
      setTimeout(() => setScanStatus(null), 3000);
      
      if (res.estInfecte) {
        showAlert(t('collecte_uniforme.infectious_contact'), `${res.personnelNom} — ${res.infoInfection || t('collecte_uniforme.potentially_infected')}`, "warning");
      } else {
        showAlert(t('collecte_uniforme.doctor_identified'), `${res.personnelNom} — ${res.nbUniformes} ${t('collecte_uniforme.uniforms')}`, "success");
      }
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      showAlert(t('common.error'), e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [agent, showAlert, t]);

  // ─── ÉTAPE 3 : Scanner uniforme ──────────────────────────────────────
  const handleScanUniforme = useCallback((code) => {
    const u = collecteRef.current?.uniformes?.find(
      x => x.codeBarre === code || String(x.lingeId) === code
    );
    if (!u) {
      showAlert(t('collecte_uniforme.errors.uniform_not_found'), code, "error");
      return;
    }
    if (u.statut) {
      showAlert(t('collecte_uniforme.already_processed'), u.codeBarre, "info");
      return;
    }
    setUniformeEnCours(u);
    if (u.estInfecte) {
      showAlert("🔴 " + t('collecte_uniforme.infected_uniform'), t('collecte_uniforme.scan_red_bin'), "warning");
    } else {
      showAlert("🟢 " + t('collecte_uniforme.clean_uniform'), t('collecte_uniforme.scan_white_bin'), "success");
    }
  }, [showAlert, t]);

  // ─── ÉTAPE 4 : Scanner bac ───────────────────────────────────────────
  const handleScanBac = useCallback(async (code) => {
    if (!uniformeEnCours) return;
    setLoading(true);
    setScanStatus({ loading: true, code: code });
    try {
      const res = await apiCall(`/api/collecte/uniforme/${collecteRef.current?.id}/traiter`, {
        codeUniforme: uniformeEnCours.codeBarre,
        codeBac: code
      });
      majUniforme(uniformeEnCours.lingeId, res.statut);
      setUniformeEnCours(null);
      setScanStatus({
        loading: false,
        success: {
          message: res.statut === "INFECTE" ? "✅ " + t('collecte_uniforme.red_bin') : "✅ " + t('collecte_uniforme.white_bin'),
          detail: `${uniformeEnCours.codeBarre} → ${res.bac}`
        },
        error: null
      });
      setTimeout(() => setScanStatus(null), 2000);
      
      if (res.statut === "INFECTE") {
        showAlert("✅ " + t('collecte_uniforme.red_bin'), `${uniformeEnCours.codeBarre} → ${t('collecte_uniforme.red_bin')}`, "warning");
      } else {
        showAlert("✅ " + t('collecte_uniforme.white_bin'), `${uniformeEnCours.codeBarre} → ${t('collecte_uniforme.white_bin')}`, "success");
      }
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      showAlert(t('common.error'), e.message || t('collecte_uniforme.errors.invalid_bin'), "error");
    } finally {
      setLoading(false);
    }
  }, [uniformeEnCours, showAlert, majUniforme, t]);

  // ─── Manquant ─────────────────────────────────────────────────────────
  const handleManquant = useCallback(async (u) => {
    setDlgManq(null);
    setLoading(true);
    try {
      await apiCall(`/api/collecte/uniforme/${collecteRef.current?.id}/manquant`, { lingeId: u.lingeId });
      majUniforme(u.lingeId, "MANQUANT");
      showAlert(t('collecte_uniforme.missing'), u.codeBarre, "warning");
    } catch (e) {
      showAlert(t('common.error'), e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showAlert, majUniforme, t]);

  // ─── Clôturer ─────────────────────────────────────────────────────────
  const handleCloturer = useCallback(async () => {
    const nonTr = collecte?.uniformes?.filter(u => !u.statut) || [];
    if (nonTr.length > 0) {
      const ok = await showConfirm(
        t('collecte_uniforme.close'),
        `${nonTr.length} ${t('collecte_uniforme.unprocessed')}. ${t('collecte_uniforme.close_confirm')}`,
        "question"
      );
      if (!ok) return;
    }
    setLoading(true);
    try {
      const res = await apiCall(`/api/collecte/uniforme/${collecte.id}/cloturer`);
      setResume(res);
      setUniformeEnCours(null);
      setEtape("RESUME");
      showAlert(t('collecte_uniforme.collection_closed'), `${collecte.personnelNom} — ${res.nbBlancs} ${t('collecte_uniforme.white')}, ${res.nbInfectes} ${t('collecte_uniforme.infected')}`, "success");
    } catch (e) {
      showAlert(t('common.error'), e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [collecte, showAlert, showConfirm, t]);

  const handleScan = useCallback(async (code) => {
    setScanVal("");
    if (etape === "BADGE") { await handleBadge(code); return; }
    if (etape === "SCAN") {
      if (uniformeEnCours) {
        await handleScanBac(code);
        return;
      }
      handleScanUniforme(code);
    }
  }, [etape, uniformeEnCours, handleBadge, handleScanUniforme, handleScanBac]);

  const reset = () => {
    setCollecte(null);
    setResume(null);
    setUniformeEnCours(null);
    setEtape("BADGE");
    setScanVal("");
    setScanStatus(null);
    setTimeout(() => scanInputRef.current?.focus(), 200);
  };

  const traites = collecte?.uniformes?.filter(u => u.statut).length || 0;
  const total = collecte?.nbUniformes || 0;
  const nonTr = total - traites;
  const infectes = collecte?.uniformes?.filter(u => u.statut === "INFECTE").length || 0;
  const blancs = collecte?.uniformes?.filter(u => u.statut === "BLANC").length || 0;
  const manquants = collecte?.uniformes?.filter(u => u.statut === "MANQUANT").length || 0;

  const getPlaceholder = () => {
    if (!agent) return "👤 " + t('collecte_uniforme.no_agent_connected');
    if (!collecte) return "🩺 " + t('collecte_uniforme.scan_doctor_badge');
    if (uniformeEnCours) return "📦 " + t('collecte_uniforme.scan_bin');
    if (etape === "RESUME") return "🔒 " + t('collecte_uniforme.collection_closed');
    return "👔 " + t('collecte_uniforme.scan_uniform');
  };

  const isCloturee = etape === "RESUME";

  return (
    <div className="collecte-container">
      <DlgManquant linge={dlgManq} onOk={handleManquant} onClose={() => setDlgManq(null)} t={t} />

      {/* ─── EN-TÊTE ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "8px"
        }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "18px",
            background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            boxShadow: "0 6px 20px rgba(14, 165, 233, 0.3)"
          }}>
            <FaUserMd size={26} />
          </div>
          <div>
            <h1 style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#0f172a",
              margin: 0
            }}>
              {t('collecte_uniforme.title')}
            </h1>
            <p style={{
              fontSize: "14px",
              color: "#64748b",
              margin: "2px 0 0 0"
            }}>
              {agent ? `${t('collecte_uniforme.agent')}: ${agent.nomPrenom || agent.nom}` : t('collecte_uniforme.no_agent_connected')}
            </p>
          </div>
        </div>
      </div>

      <div style={{
        background: "white",
        borderRadius: "20px",
        padding: "32px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)"
      }}>

        {/* ─── BARRE SUPÉRIEURE ─────────────────────────────────────────── */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {agent && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 18px",
                background: "#faf5ff",
                borderRadius: "12px",
                border: "1px solid #e9d5ff"
              }}>
                <FaUser color="#7c3aed" size={16} />
                <span style={{ fontWeight: 700, color: "#7c3aed", fontSize: "14px" }}>
                  {agent.nomPrenom || agent.nom}
                </span>
                <Badge style={{ background: "#ede9fe", color: "#7c3aed", fontSize: "10px", padding: "2px 10px", borderRadius: "12px" }}>
                  {agent.codeBarre || agent.matricule}
                </Badge>
              </div>
            )}
            {collecte && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 18px",
                background: "#f0f9ff",
                borderRadius: "12px",
                border: "1px solid #bae6fd"
              }}>
                <FaUserMd color="#0284c7" size={16} />
                <span style={{ fontWeight: 700, color: "#0284c7", fontSize: "14px" }}>{collecte.personnelNom}</span>
                <Badge style={{ background: "#e0f2fe", color: "#0284c7", fontSize: "10px", padding: "2px 10px", borderRadius: "12px" }}>
                  {collecte.nbUniformes} {t('collecte_uniforme.uniforms')}
                </Badge>
                {collecte.estInfecte && (
                  <Badge style={{ background: "#fee2e2", color: "#dc2626", fontSize: "10px", padding: "2px 10px", borderRadius: "12px" }}>
                    ⚠️ {t('collecte_uniforme.infected')}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              style={{
                fontSize: "12px",
                gap: "6px",
                borderColor: "#fca5a5",
                color: "#dc2626",
                borderRadius: "10px",
                padding: "6px 14px"
              }}
            >
              <FaRedo size={10} />
              {t('common.reset')}
            </Button>
          </div>
        </div>

        {/* ─── STATUTS ──────────────────────────────────────────────────── */}
        {(etape === "SCAN" || etape === "RESUME") && collecte && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "12px",
            marginBottom: "20px"
          }}>
            <StatutCard
              label={t('collecte_uniforme.total')}
              value={total}
              icon="📊"
              color="#0ea5e9"
              bg="#f0f9ff"
            />
            <StatutCard
              label={t('collecte_uniforme.white')}
              value={blancs}
              icon="✅"
              color="#15803d"
              bg="#f0fdf4"
            />
            <StatutCard
              label={t('collecte_uniforme.infected')}
              value={infectes}
              icon="🔴"
              color="#dc2626"
              bg="#fef2f2"
            />
            <StatutCard
              label={t('collecte_uniforme.missing')}
              value={manquants}
              icon="⚠️"
              color="#d97706"
              bg="#fffbeb"
            />
          </div>
        )}

        {/* ─── ZONE DE SCAN ────────────────────────────────────────────── */}
        <Card style={{
          marginBottom: "20px",
          border: `2px dashed ${isCloturee ? "#e2e8f0" : "#0ea5e9"}`,
          background: isCloturee ? "#f8fafc" : "white",
          borderRadius: "16px"
        }}>
          <CardContent className="p-5">
            <ScanInput
              ref={scanInputRef}
              placeholder={getPlaceholder()}
              value={scanVal}
              onChange={setScanVal}
              onSubmit={handleScan}
              borderColor={isCloturee ? "#e2e8f0" : "#0ea5e9"}
              keepFocus={true}
              autoDebounce={true}
              disabled={isCloturee || loading || !agent}
            />
            {scanStatus && (
              <div style={{ marginTop: "12px" }}>
                <ScanStatus {...scanStatus} t={t} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── INFO ──────────────────────────────────────────────────────── */}

        {!agent && (
          <Card style={{ background: "#fef2f2", border: "1px solid #fca5a5", marginBottom: "16px", borderRadius: "12px" }}>
            <CardContent className="p-4">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <FaExclamationTriangle color="#dc2626" size={16} />
                <span style={{ fontWeight: 600, color: "#dc2626" }}>{t('collecte_uniforme.no_agent_connected')}</span>
                <span style={{ color: "#64748b" }}>{t('collecte_uniforme.connect_to_collect')}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {agent && !collecte && (
          <Card style={{ background: "#faf5ff", border: "1px solid #e9d5ff", marginBottom: "16px", borderRadius: "12px" }}>
            <CardContent className="p-4">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <FaUserMd color="#7c3aed" size={16} />
                <span style={{ fontWeight: 600, color: "#7c3aed" }}>{t('collecte_uniforme.scan_doctor_badge')}</span>
                <span style={{ color: "#64748b" }}>{t('collecte_uniforme.to_start_collection')}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {agent && collecte && etape === "SCAN" && !uniformeEnCours && (
          <Card style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", marginBottom: "16px", borderRadius: "12px" }}>
            <CardContent className="p-4">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", flexWrap: "wrap" }}>
                <FaCheckCircle color="#22c55e" size={16} />
                <span style={{ fontWeight: 600, color: "#15803d" }}>{t('collecte_uniforme.ready_to_collect')}</span>
                <span style={{ color: "#64748b" }}>{t('collecte_uniforme.scan_uniform')}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {uniformeEnCours && etape === "SCAN" && (
          <div style={{
            padding: "12px 18px",
            borderRadius: "12px",
            background: uniformeEnCours.estInfecte ? "#fef2f2" : "#faf5ff",
            border: `2px solid ${uniformeEnCours.estInfecte ? "#fca5a5" : "#c4b5fd"}`,
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "22px" }}>👔</span>
              <div>
                <div style={{
                  fontWeight: 700,
                  fontSize: "14px",
                  color: uniformeEnCours.estInfecte ? "#dc2626" : "#7c3aed"
                }}>
                  {uniformeEnCours.codeBarre}
                  {uniformeEnCours.estInfecte && ` — ⚠️ ${t('collecte_uniforme.red_bin')}`}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  {t('collecte_uniforme.scan_destination_bin')}
                </div>
              </div>
            </div>
            <button
              onClick={() => setUniformeEnCours(null)}
              style={{
                padding: "4px 14px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                background: "white",
                color: "#64748b",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 500
              }}
            >
              {t('common.cancel')}
            </button>
          </div>
        )}

        {/* ─── BOUTONS ───────────────────────────────────────────────────── */}
        {etape === "SCAN" && collecte && (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button onClick={handleCloturer} disabled={loading}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "10px",
                border: "none",
                background: loading ? "#e2e8f0"
                  : nonTr > 0 ? "linear-gradient(135deg, #d97706, #b45309)"
                  : "linear-gradient(135deg, #0ea5e9, #0284c7)",
                color: loading ? "#94a3b8" : "white",
                fontWeight: 700,
                fontSize: "13px",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                minWidth: "140px"
              }}>
              {loading
                ? <FaSpinner style={{ animation: "spin 1s linear infinite" }} />
                : nonTr > 0
                  ? `⚠️ ${t('collecte_uniforme.close_with_unprocessed')} (${nonTr} ${t('collecte_uniforme.unprocessed')})`
                  : <><FaCheckDouble size={12} /> {t('collecte_uniforme.finish_and_close')}</>}
            </button>
          </div>
        )}

        {/* ─── RÉSUMÉ ────────────────────────────────────────────────────── */}
        {etape === "RESUME" && resume && (
          <div style={{
            background: "#f0fdf4",
            borderRadius: "18px",
            padding: "26px",
            border: "2px solid #22c55e",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>✅</div>
            <div style={{ fontWeight: 900, fontSize: "20px", color: "#15803d", marginBottom: "16px" }}>
              {t('collecte_uniforme.collection_completed')} — {collecte?.personnelNom}
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "8px",
              marginBottom: "20px"
            }}>
              {[
                [t('collecte_uniforme.white'), resume.nbBlancs, "#dcfce7", "#15803d"],
                [t('collecte_uniforme.infected'), resume.nbInfectes, "#fee2e2", "#dc2626"],
                [t('collecte_uniforme.clean'), resume.nbPropres, "#dbeafe", "#0284c7"],
                [t('collecte_uniforme.missing_short'), resume.nbManquants, "#fef3c7", "#d97706"],
              ].map(([l, v, bg, co]) => (
                <div key={l} style={{ background: bg, borderRadius: "10px", padding: "10px 4px" }}>
                  <div style={{ fontSize: "22px", fontWeight: 900, color: co }}>{v || 0}</div>
                  <div style={{ fontSize: "10px", color: co, fontWeight: 600 }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => {
                setCollecte(null);
                setResume(null);
                setUniformeEnCours(null);
                setEtape("BADGE");
                setTimeout(() => scanInputRef.current?.focus(), 200);
              }} style={{
                flex: 1,
                padding: "11px",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                color: "white",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer"
              }}>
                + {t('collecte_uniforme.another_doctor')}
              </button>
              <button onClick={reset} style={{
                flex: 1,
                padding: "11px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                background: "white",
                color: "#64748b",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer"
              }}>
                {t('collecte_uniforme.finish')}
              </button>
            </div>
          </div>
        )}

        {/* ─── LISTE DES UNIFORMES ──────────────────────────────────────── */}
        {etape === "SCAN" && collecte && (
          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
            <div style={{
              fontWeight: 600,
              fontSize: "13px",
              color: "#64748b",
              marginBottom: "8px",
              display: "flex",
              justifyContent: "space-between"
            }}>
              <span>{t('collecte_uniforme.uniforms')} ({total})</span>
              <span style={{ color: "#0ea5e9" }}>{traites} {t('collecte_uniforme.processed')}</span>
            </div>
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              {collecte.uniformes.map(u => (
                <CarteUniforme
                  key={u.lingeId}
                  u={u}
                  uniformeEnCours={uniformeEnCours}
                  onManquant={x => setDlgManq(x)}
                  t={t}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default function CollageListUniforme() {
  return <CollageListUniformeInner />;
}

// ─── COMPOSANT : Scan Status ──────────────────────────────────────────────
function ScanStatus({ loading, success, error, code, t }) {
  if (loading) {
    return (
      <div style={{
        padding: "12px 16px",
        borderRadius: "10px",
        background: "#eff6ff",
        border: "1px solid #93c5fd",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        animation: "fadeIn 0.3s ease-out"
      }}>
        <FaSpinner className="animate-spin" color="#3b82f6" size={20} />
        <div>
          <p style={{ fontWeight: 600, color: "#1d4ed8", fontSize: "13px", margin: 0 }}>{t('collecte_uniforme.scanning')}</p>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>{code}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{
        padding: "12px 16px",
        borderRadius: "10px",
        background: "#f0fdf4",
        border: "1px solid #86efac",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        animation: "fadeIn 0.3s ease-out"
      }}>
        <div style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: "#dcfce7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <FaCheckCircle color="#22c55e" size={18} />
        </div>
        <div>
          <p style={{ fontWeight: 600, color: "#15803d", fontSize: "13px", margin: 0 }}>✓ {success.message || t('collecte_uniforme.success')}</p>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>{success.detail}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: "12px 16px",
        borderRadius: "10px",
        background: "#fef2f2",
        border: "1px solid #fca5a5",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        animation: "fadeIn 0.3s ease-out"
      }}>
        <div style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: "#fee2e2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <FaExclamationTriangle color="#ef4444" size={16} />
        </div>
        <div>
          <p style={{ fontWeight: 600, color: "#dc2626", fontSize: "13px", margin: 0 }}>{t('common.error')}</p>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>{error}</p>
        </div>
      </div>
    );
  }

  return null;
}