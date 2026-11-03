// pages/Distribution/DistributionUniforme.js
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FaUser, FaRedo, FaSpinner, FaCheckDouble,
  FaCheck, FaUserTie, FaCheckCircle, FaExclamationTriangle,
  FaBoxes, FaIdBadge
} from "react-icons/fa";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import ScanInput from "../../components/utils/shared/ScanInput";
import {
  getAgentFromStorage,
  isAgentConnected,
  fetchAgentByCode,
  fetchUniformesPersonnel,
  distribuerUniforme,
  getCategorie
} from "../../services/distributionUniformeService";
import Swal from "sweetalert2";
import "../Linge/WorkflowList.css";
import { PageHeaderIcon } from "../../components/layout/PageHeaderIcon";
import MuteButton from "../../components/utils/MuteButton";
import { useVoiceGuide } from "../../hooks/useVoiceGuide";
import { getSetting } from "../../utils/appSettings";

// ─── ScanStatus ──────────────────────────────────────────────────────────────
function ScanStatus({ loading, success, error, code }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div style={{
        padding: "14px 18px",
        borderRadius: "12px",
        background: "#eff6ff",
        border: "1px solid #93c5fd",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        marginTop: "12px",
        animation: "fadeIn 0.3s ease-out"
      }}>
        <FaSpinner className="animate-spin" color="#3b82f6" size={22} />
        <div>
          <p style={{ fontWeight: 600, color: "#1d4ed8", fontSize: "14px", margin: 0 }}>
            {t('distribution_uniforme.scanning')}
          </p>
          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>{code}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{
        padding: "14px 18px",
        borderRadius: "12px",
        background: "#f0fdf4",
        border: "1px solid #86efac",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        marginTop: "12px",
        animation: "fadeIn 0.3s ease-out"
      }}>
        <div style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: "#dcfce7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <FaCheckCircle color="#22c55e" size={20} />
        </div>
        <div>
          <p style={{ fontWeight: 600, color: "#15803d", fontSize: "14px", margin: 0 }}>
            ✓ {success.message || t('common.success')}
          </p>
          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>{success.detail}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: "14px 18px",
        borderRadius: "12px",
        background: "#fef2f2",
        border: "1px solid #fca5a5",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        marginTop: "12px",
        animation: "fadeIn 0.3s ease-out"
      }}>
        <div style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: "#fee2e2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <FaExclamationTriangle color="#ef4444" size={18} />
        </div>
        <div>
          <p style={{ fontWeight: 600, color: "#dc2626", fontSize: "14px", margin: 0 }}>
            {t('common.error')}
          </p>
          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>{error}</p>
        </div>
      </div>
    );
  }

  return null;
}

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

// ─── CarteUniforme ──────────────────────────────────────────────────────────
function CarteUniforme({ linge, onRetirer, personnelNom }) {
  const { t } = useTranslation();
  const c = getCategorie(linge.categorie);
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 12px",
      borderRadius: "9px",
      background: "#f8fafc",
      border: "1px solid #e2e8f0"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "16px" }}>{c.emoji}</span>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: c.color }}>{c.label}</div>
          <code style={{ fontSize: "10px", color: "#94a3b8" }}>{linge.codeBarre}</code>
        </div>
      </div>
      <button
        onClick={() => onRetirer(linge)}
        style={{
          padding: "4px 10px",
          borderRadius: "6px",
          border: "1px solid #fca5a5",
          background: "#fff5f5",
          color: "#dc2626",
          fontSize: "10px",
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "4px"
        }}
      >
        <FaCheck size={8} /> {t('distribution_uniforme.remove')}
      </button>
    </div>
  );
}

// ─── CarteUniformeDispo ──────────────────────────────────────────────────────
function CarteUniformeDispo({ linge, onDistribuer, personnelNom }) {
  const { t } = useTranslation();
  const c = getCategorie(linge.categorie);
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 12px",
      borderRadius: "9px",
      background: "#faf5ff",
      border: "1px solid #e9d5ff"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "16px" }}>{c.emoji}</span>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: c.color }}>{c.label}</div>
          <code style={{ fontSize: "10px", color: "#94a3b8" }}>{linge.codeBarre}</code>
        </div>
      </div>
      <button
        onClick={() => onDistribuer(linge.codeBarre)}
        style={{
          padding: "4px 10px",
          borderRadius: "6px",
          border: "none",
          background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
          color: "white",
          fontSize: "10px",
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "4px"
        }}
      >
        <FaCheck size={8} /> {t('distribution_uniforme.distribute')}
      </button>
    </div>
  );
}

// ─── ResumeUniforme ──────────────────────────────────────────────────────────
function ResumeUniforme({ res, onNouvelle, onTerminer }) {
  const { t } = useTranslation();

  return (
    <div style={{
      background: "#f0fdf4",
      borderRadius: 18,
      padding: 28,
      border: "2px solid #22c55e",
      textAlign: "center"
    }}>
      <div style={{ fontSize: 44, marginBottom: 10 }}>✅</div>
      <div style={{ fontWeight: 900, fontSize: 18, color: "#15803d", marginBottom: 6 }}>
        {t('distribution_uniforme.uniforms_distributed')}
      </div>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
        {res.nbDistribues} {t('distribution_uniforme.uniform')}{res.nbDistribues > 1 ? 's' : ''} {t('distribution_uniforme.for')} {res.personnelNom}
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: 8,
        marginBottom: 22
      }}>
        {res.uniformes?.map((u, i) => {
          const c = getCategorie(u.categorie);
          return (
            <div key={i} style={{
              background: "white",
              borderRadius: 10,
              padding: "8px 12px",
              border: "1px solid #bbf7d0",
              fontSize: 11,
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <span>{c.emoji}</span>
              <span style={{ fontWeight: 600, color: "#15803d" }}>{u.codeBarre}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onNouvelle} style={{
          flex: 1,
          padding: "11px",
          borderRadius: 10,
          border: "none",
          background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
          color: "white",
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer"
        }}>
          {t('distribution_uniforme.another_personnel')}
        </button>
        <button onClick={onTerminer} style={{
          flex: 1,
          padding: "11px",
          borderRadius: 10,
          border: "1px solid #e2e8f0",
          background: "white",
          color: "#64748b",
          fontWeight: 600,
          fontSize: 13,
          cursor: "pointer"
        }}>
          {t('common.finish')}
        </button>
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────
export default function DistributionUniforme() {
  const { t } = useTranslation();

  const [etape, setEtape] = useState("PERSONNEL");
  const [agent, setAgent] = useState(null);
  const [personnel, setPersonnel] = useState(null);
  const [enPossession, setEnPossession] = useState([]);
  const [disponibles, setDisponibles] = useState([]);
  const [scanVal, setScanVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState(null);
  const [scanStatus, setScanStatus] = useState(null);
  const [distribues, setDistribues] = useState([]);

  const agentRef = useRef(null);
  const personnelRef = useRef(null);
  const scanInputRef = useRef(null);

  // Assistant vocal
  const [voiceLang, setVoiceLang] = useState(() => getSetting("voice.lang"));
  const voice = useVoiceGuide(voiceLang);
  const voiceRef = useRef(voice);
  useEffect(() => { voiceRef.current = voice; }, [voice]);
  useEffect(() => () => voiceRef.current.cancel(), []);

  useEffect(() => { agentRef.current = agent; }, [agent]);
  useEffect(() => { personnelRef.current = personnel; }, [personnel]);

  // ✅ Récupérer l'agent depuis localStorage (clé 'auth')
  useEffect(() => {
    console.log("🔍 Recherche de l'agent dans le stockage...");
    const agentData = getAgentFromStorage();
    
    if (agentData) {
      console.log("✅ Agent trouvé:", agentData);
      setAgent(agentData);
      setEtape("PERSONNEL");
      setScanStatus({
        loading: false,
        success: {
          message: `👤 ${t('distribution_uniforme.agent')} ${agentData.nom}`,
          detail: `${t('distribution_uniforme.connected')} · ${agentData.codeBarre || agentData.matricule}`
        },
        error: null
      });
      setTimeout(() => setScanStatus(null), 2000);
      setTimeout(() => voiceRef.current.sayBienvenueDistributionUniforme(agentData.nomPrenom || agentData.nom || ""), 600);
    } else {
      console.warn("⚠️ Aucun agent trouvé dans le stockage");
      setEtape("PERSONNEL");
      setScanStatus({
        loading: false,
        success: null,
        error: t('distribution_uniforme.no_agent_connected')
      });
    }
  }, [t]);

  // ─── Focus permanent ──────────────────────────────────────────────────
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

  // ─── Clôturer la distribution ──────────────────────────────────────────
  const cloturerDistribution = useCallback(async () => {
    if (distribues.length === 0) {
      voice.sayAucunUniformeDistribue();
      await Swal.fire({
        icon: 'warning',
        title: t('distribution_uniforme.no_uniform_distributed_title'),
        text: t('distribution_uniforme.no_uniform_distributed_text'),
        timer: 1500,
        showConfirmButton: false
      });
      return false;
    }

    setResume({
      personnelNom: personnel.nom,
      nbDistribues: distribues.length,
      uniformes: distribues
    });
    setEtape("RESUME");
    voice.sayDistributionUniformeTerminee(personnel.nom, distribues.length);
    setScanStatus({
      loading: false,
      success: { 
        message: "✅ " + t('distribution_uniforme.distribution_completed'), 
        detail: `${distribues.length} ${t('distribution_uniforme.uniform')}s ${t('distribution_uniforme.distributed')}` 
      },
      error: null
    });
    setTimeout(() => setScanStatus(null), 2000);
    return true;
  }, [distribues, personnel, t, voice]);

  // ─── Scan Personnel ──────────────────────────────────────────────────────
  const handlePersonnel = useCallback(async code => {
    if (!agent) {
      await Swal.fire({
        icon: 'warning',
        title: t('distribution_uniforme.agent_not_connected_title'),
        text: t('distribution_uniforme.agent_not_connected_text'),
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }
    setLoading(true);
    setScanStatus({ loading: true, code });
    try {
      const data = await fetchUniformesPersonnel(code, agent.matricule);
      
      setPersonnel({
        id: data.personnelId,
        nom: data.personnelNom,
        fonction: data.personnelFonction
      });
      setEnPossession(data.enPossession || []);
      setDisponibles(data.disponibles || []);
      setDistribues([]);
      setEtape("DISTRIBUER");
      voice.sayPersonnelDistribution(data.personnelNom, data.disponibles?.length || 0);
      setScanStatus({
        loading: false,
        success: { 
          message: `✅ ${data.personnelNom}`, 
          detail: `${data.disponibles?.length || 0} ${t('distribution_uniforme.uniform')}s ${t('distribution_uniforme.available')}` 
        },
        error: null
      });
      setTimeout(() => setScanStatus(null), 2000);
      await Swal.fire({
        icon: 'success',
        title: `✅ ${data.personnelNom}`,
        text: `${data.disponibles?.length || 0} ${t('distribution_uniforme.uniform')}s ${t('distribution_uniforme.available')} · ${data.enPossession?.length || 0} ${t('distribution_uniforme.in_possession')}`,
        timer: 1500,
        showConfirmButton: false
      });
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      if (/réseau|network|fetch/i.test(e.message || "")) voice.sayErreurReseau();
      else voice.sayErreurGenerique(e.message);
      await Swal.fire({
        icon: 'error',
        title: t('common.error'),
        text: e.message
      });
    } finally {
      setLoading(false);
    }
  }, [agent, t, voice]);

  // ─── Scan Uniforme ──────────────────────────────────────────────────────
  const handleScanUniforme = useCallback(async code => {
    if (!personnel) {
      voice.sayScannerPersonnelDabord();
      await Swal.fire({
        icon: 'warning',
        title: t('distribution_uniforme.scan_personnel_first_title'),
        text: t('distribution_uniforme.scan_personnel_first_text'),
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }
    setLoading(true);
    setScanStatus({ loading: true, code });
    try {
      const data = await distribuerUniforme(
        personnel.id,
        personnel.nom,
        code,
        agent.matricule
      );

      setDisponibles(prev => prev.filter(l => l.lingeId !== data.lingeId));
      setEnPossession(prev => [...prev, data]);
      setDistribues(prev => [...prev, data]);
      voice.sayUniformeDistribue(distribues.length + 1);

      setScanStatus({
        loading: false,
        success: { 
          message: t('distribution_uniforme.uniform_distributed'), 
          detail: data.codeBarre 
        },
        error: null
      });
      setTimeout(() => setScanStatus(null), 1500);
      await Swal.fire({
        icon: 'success',
        title: t('distribution_uniforme.uniform_distributed'),
        text: data.codeBarre,
        timer: 1000,
        showConfirmButton: false
      });
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      voice.sayErreurGenerique(e.message);
      await Swal.fire({
        icon: 'error',
        title: t('common.error'),
        text: e.message,
        timer: 1500,
        showConfirmButton: false
      });
    } finally {
      setLoading(false);
    }
  }, [personnel, agent, distribues.length, t, voice]);

  // ─── Retirer un uniforme ──────────────────────────────────────────────
  const handleRetirer = useCallback(async (linge) => {
    setEnPossession(prev => prev.filter(l => l.lingeId !== linge.lingeId));
    setDisponibles(prev => [...prev, linge]);
    setDistribues(prev => prev.filter(l => l.lingeId !== linge.lingeId));
    voice.sayUniformeRetire();

    await Swal.fire({
      icon: 'info',
      title: t('distribution_uniforme.uniform_removed'),
      text: linge.codeBarre,
      timer: 1000,
      showConfirmButton: false
    });
  }, [t, voice]);

  // ─── Gestion scan ──────────────────────────────────────────────────────
  const handleScan = useCallback(async code => {
    if (!code || loading) return;
    setScanVal("");

    console.log("🔍 Scan reçu:", code, "Étape:", etape);

    if (etape === "PERSONNEL") {
      console.log("👔 Scan personnel:", code);
      await handlePersonnel(code);
      return;
    }

    if (etape === "DISTRIBUER") {
      try {
        const agentTrouve = await fetchAgentByCode(code.trim());
        if (agentTrouve) {
          console.log("🔄 Agent trouvé, clôture de la distribution");
          await cloturerDistribution();
          return;
        }
      } catch (e) {
        console.log("❌ Ce n'est pas un agent valide:", e.message);
      }
      
      console.log("👕 Distribution de l'uniforme:", code);
      await handleScanUniforme(code);
    }
  }, [etape, loading, handlePersonnel, handleScanUniforme, cloturerDistribution]);

  // ─── Reset ──────────────────────────────────────────────────────────────
  const reset = useCallback(async () => {
    if (etape !== "PERSONNEL" && etape !== "RESUME") {
      const result = await Swal.fire({
        icon: 'warning',
        title: t('distribution_uniforme.reset_title'),
        text: t('distribution_uniforme.reset_text'),
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: t('distribution_uniforme.yes_reset'),
        cancelButtonText: t('common.cancel')
      });
      if (!result.isConfirmed) return;
    }
    setPersonnel(null);
    setEnPossession([]);
    setDisponibles([]);
    setDistribues([]);
    setResume(null);
    setEtape("PERSONNEL");
    setScanVal("");
    setScanStatus(null);
  }, [etape, t]);

  const getPlaceholder = () => {
    if (!agent) return t('distribution_uniforme.agent_not_connected_placeholder');
    if (etape === "PERSONNEL") return t('distribution_uniforme.scan_personnel_badge');
    if (etape === "RESUME") return t('distribution_uniforme.distribution_completed');
    return t('distribution_uniforme.scan_uniform_to_distribute');
  };

  const getBorderColor = () => {
    if (!agent) return "#dc2626";
    if (etape === "PERSONNEL") return "#15803d";
    if (etape === "DISTRIBUER") return "#7c3aed";
    return "#e2e8f0";
  };

  const isCloturee = etape === "RESUME";

  return (
    <div className="collecte-container">

      <div className="page-head" style={{
        marginBottom: "32px", display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: "12px"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "16px"
        }}>
          <PageHeaderIcon size={56} />
          <div>
            <h1 style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#0f172a",
              margin: 0
            }}>
              {t('distribution_uniforme.title')}
            </h1>
            <p style={{
              fontSize: "14px",
              color: "#64748b",
              margin: "2px 0 0 0"
            }}>
              {agent ? `${t('distribution_uniforme.agent')}: ${agent.nom}` : t('distribution_uniforme.no_agent_connected')}
            </p>
          </div>
        </div>

        <MuteButton
          muted={voice.muted}
          onToggle={voice.toggleMute}
          speaking={voice.speaking}
          lang={voiceLang}
          onLangChange={setVoiceLang}
        />
      </div>

      <div style={{
        background: "white",
        borderRadius: "20px",
        padding: "32px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)"
      }}>

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
                <span style={{ fontWeight: 700, color: "#7c3aed", fontSize: "14px" }}>{agent.nom}</span>
                <Badge style={{ background: "#ede9fe", color: "#7c3aed", fontSize: "10px", padding: "2px 10px", borderRadius: "12px" }}>
                  {agent.codeBarre || agent.matricule}
                </Badge>
              </div>
            )}
            {personnel && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 18px",
                background: "#f0fdf4",
                borderRadius: "12px",
                border: "1px solid #bbf7d0"
              }}>
                <FaIdBadge color="#15803d" size={16} />
                <span style={{ fontWeight: 700, color: "#15803d", fontSize: "14px" }}>{personnel.nom}</span>
                {personnel.fonction && (
                  <Badge style={{ background: "#dcfce7", color: "#15803d", fontSize: "10px", padding: "2px 10px", borderRadius: "12px" }}>
                    {personnel.fonction}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {etape !== "PERSONNEL" && etape !== "RESUME" && (
              <button
                onClick={reset}
                style={{
                  padding: "6px 14px",
                  borderRadius: "10px",
                  border: "1px solid #fca5a5",
                  background: "#fff5f5",
                  color: "#dc2626",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <FaRedo size={10} />
                {t('common.reset')}
              </button>
            )}
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
            <span style={{ fontWeight: 600, color: "#dc2626" }}>{t('distribution_uniforme.no_agent_connected')}</span>
            <span style={{ color: "#64748b" }}>{t('distribution_uniforme.no_agent_connect_text')}</span>
          </div>
        )}

        <Card style={{
          marginBottom: "20px",
          border: `2px dashed ${isCloturee ? "#e2e8f0" : getBorderColor()}`,
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
              borderColor={isCloturee ? "#e2e8f0" : getBorderColor()}
              keepFocus={true}
              autoDebounce={true}
              disabled={isCloturee || loading || !agent}
            />
            {scanStatus && <ScanStatus {...scanStatus} />}
          </CardContent>
        </Card>

        {etape === "DISTRIBUER" && personnel && !isCloturee && (
          <div style={{
            padding: "8px 16px",
            borderRadius: "10px",
            background: "#fef3c7",
            border: "1px solid #fcd34d",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            color: "#92400e"
          }}>
            <FaUser size={14} />
            <span>💡 {t('distribution_uniforme.scan_agent_to_close')}</span>
          </div>
        )}

        {agent && etape === "PERSONNEL" && (
          <Card style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", marginBottom: "16px", borderRadius: "12px" }}>
            <CardContent className="p-4">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <FaIdBadge color="#15803d" size={16} />
                <span style={{ fontWeight: 600, color: "#15803d" }}>{t('distribution_uniforme.scan_personnel_badge_prompt')}</span>
                <span style={{ color: "#64748b" }}>{t('distribution_uniforme.to_see_uniforms')}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {etape === "DISTRIBUER" && personnel && !isCloturee && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "12px",
            marginBottom: "20px"
          }}>
            <StatutCard
              label={t('distribution_uniforme.to_distribute')}
              value={disponibles.length}
              icon="📦"
              color="#0ea5e9"
              bg="#f0f9ff"
            />
            <StatutCard
              label={t('distribution_uniforme.in_possession')}
              value={enPossession.length}
              icon="✅"
              color="#15803d"
              bg="#f0fdf4"
            />
            <StatutCard
              label={t('distribution_uniforme.distributed')}
              value={distribues.length}
              icon="🎯"
              color="#7c3aed"
              bg="#faf5ff"
            />
          </div>
        )}

        {etape === "DISTRIBUER" && personnel && !isCloturee && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "16px"
          }}>
            <div style={{
              background: "#faf5ff",
              borderRadius: "12px",
              border: "1px solid #e9d5ff",
              padding: "16px"
            }}>
              <div style={{
                fontWeight: 700,
                fontSize: "13px",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "7px",
                color: "#7c3aed"
              }}>
                <FaBoxes size={14} />
                {t('distribution_uniforme.available')}
                <Badge style={{ background: "#ede9fe", color: "#7c3aed", fontSize: "10px" }}>
                  {disponibles.length}
                </Badge>
              </div>
              {disponibles.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "12px" }}>
                  {t('distribution_uniforme.no_uniform_available')}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "250px", overflowY: "auto" }}>
                  {disponibles.map(l => (
                    <CarteUniformeDispo
                      key={l.lingeId}
                      linge={l}
                      onDistribuer={handleScanUniforme}
                      personnelNom={personnel.nom}
                    />
                  ))}
                </div>
              )}
            </div>

            <div style={{
              background: "#f0fdf4",
              borderRadius: "12px",
              border: "1px solid #bbf7d0",
              padding: "16px"
            }}>
              <div style={{
                fontWeight: 700,
                fontSize: "13px",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "7px",
                color: "#15803d"
              }}>
                <FaUserTie size={14} />
                {t('distribution_uniforme.in_possession')}
                <Badge style={{ background: "#dcfce7", color: "#15803d", fontSize: "10px" }}>
                  {enPossession.length}
                </Badge>
              </div>
              {enPossession.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "12px" }}>
                  {t('distribution_uniforme.no_uniform_in_possession')}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "250px", overflowY: "auto" }}>
                  {enPossession.map(l => (
                    <CarteUniforme
                      key={l.lingeId}
                      linge={l}
                      onRetirer={handleRetirer}
                      personnelNom={personnel.nom}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {etape === "RESUME" && resume && (
          <ResumeUniforme
            res={resume}
            onNouvelle={() => {
              setPersonnel(null);
              setEnPossession([]);
              setDisponibles([]);
              setDistribues([]);
              setResume(null);
              setEtape("PERSONNEL");
              setScanStatus(null);
              setTimeout(() => scanInputRef.current?.focus(), 300);
            }}
            onTerminer={reset}
          />
        )}

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "16px",
          borderTop: "1px solid #e2e8f0",
          fontSize: "12px",
          color: "#64748b",
          flexWrap: "wrap",
          gap: "8px",
          marginTop: "16px"
        }}>
          <div style={{ display: "flex", gap: "16px" }}>
            {agent && <span>{t('distribution_uniforme.agent')}: <strong style={{ color: "#0f172a" }}>{agent.nom}</strong></span>}
            {personnel && <span>{t('distribution_uniforme.personnel')}: <strong style={{ color: "#15803d" }}>{personnel.nom}</strong></span>}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <span>{new Date().toLocaleDateString("fr-FR")}</span>
            <span>•</span>
            <span>{new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>

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