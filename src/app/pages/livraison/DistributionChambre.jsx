// pages/Distribution/DistributionChambre.js
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FaUser, FaBed, FaRedo, FaSpinner, FaCheckDouble,
  FaCheck, FaDoorOpen, FaCheckCircle, FaExclamationTriangle,
  FaPlus, FaMinus, FaTrash, FaLayerGroup, FaClock,
  FaCircle, FaDotCircle
} from "react-icons/fa";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import ScanInput from "../../components/utils/shared/ScanInput";
import {
  getAgentFromStorage,
  isAgentConnected,
  fetchChambre,
  poserLinge,
  fetchAgentByCode,
  getCategorie
} from "../../services/distributionChambreService";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import "../Linge/WorkflowList.css";

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
            {t('distribution_chambre.scanning')}
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

function CarteLit({ lit, actif, onClick }) {
  const { t } = useTranslation();

  const complet = !lit.litVide;
  const infecte = lit.estInfecte;
  const nb = lit.lingesPoses?.length || 0;
  
  const statusConfig = complet 
    ? { label: t('distribution_chambre.completed'), color: "#10b981", bg: "#dcfce7", icon: "✅" }
    : infecte 
      ? { label: t('distribution_chambre.infected'), color: "#dc2626", bg: "#fee2e2", icon: "⚠️" }
      : nb > 0 
        ? { label: t('distribution_chambre.in_progress'), color: "#7c3aed", bg: "#ede9fe", icon: "●" }
        : { label: t('distribution_chambre.empty'), color: "#94a3b8", bg: "#f1f5f9", icon: "○" };

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={onClick}
      style={{
        borderRadius: "16px",
        cursor: "pointer",
        background: actif ? "white" : "white",
        border: `2px solid ${actif ? "#7c3aed" : complet ? "#10b981" : infecte ? "#dc2626" : "#e2e8f0"}`,
        boxShadow: actif 
          ? "0 0 0 4px rgba(124, 58, 237, 0.15), 0 8px 24px rgba(124, 58, 237, 0.12)" 
          : complet 
            ? "0 2px 8px rgba(16, 185, 129, 0.1)" 
            : "0 2px 8px rgba(0,0,0,0.04)",
        transition: "all 0.3s ease",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        background: actif ? "#7c3aed" : complet ? "#10b981" : infecte ? "#dc2626" : "#e2e8f0",
        opacity: actif ? 1 : 0.5
      }} />

      <div style={{
        padding: "16px 18px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: actif ? "#ede9fe" : complet ? "#dcfce7" : infecte ? "#fee2e2" : "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            transition: "all 0.3s"
          }}>
            <FaBed color={actif ? "#7c3aed" : complet ? "#10b981" : infecte ? "#dc2626" : "#94a3b8"} size={16} />
          </div>
          <div>
            <div style={{
              fontWeight: 700,
              fontSize: "16px",
              color: "#0f172a",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              {t('distribution_chambre.bed')} {lit.codeLit}
              <span style={{
                fontSize: "10px",
                fontWeight: 600,
                color: statusConfig.color,
                background: statusConfig.bg,
                padding: "2px 10px",
                borderRadius: "12px"
              }}>
                {statusConfig.icon} {statusConfig.label}
              </span>
            </div>
            <div style={{
              fontSize: "12px",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "2px"
            }}>
              <span>{nb} {t('distribution_chambre.linen')}{nb > 1 ? 's' : ''}</span>
              {nb > 0 && (
                <>
                  <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#d1d5db" }} />
                  <span>{lit.lingesPoses?.map(l => l.categorie).join(", ")}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {actif && (
          <div style={{
            padding: "4px 12px",
            borderRadius: "20px",
            background: "#ede9fe",
            color: "#7c3aed",
            fontSize: "10px",
            fontWeight: 700
          }}>
            ● {t('distribution_chambre.in_progress')}
          </div>
        )}
      </div>

      {nb > 0 && (
        <div style={{
          padding: "0 18px 16px",
          display: "flex",
          flexWrap: "wrap",
          gap: "6px"
        }}>
          {lit.lingesPoses.map((l, i) => {
            const c = getCategorie(l.categorie);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  background: `${c.color}12`,
                  border: `1px solid ${c.color}25`,
                  fontSize: "11px",
                  fontWeight: 500,
                  color: c.color
                }}
              >
                <span style={{ fontSize: "14px" }}>{c.emoji}</span>
                {l.categorie}
              </div>
            );
          })}
        </div>
      )}

      {nb === 0 && !complet && !infecte && (
        <div style={{
          padding: "0 18px 16px",
          fontSize: "12px",
          color: "#94a3b8",
          fontStyle: "italic"
        }}>
          {t('distribution_chambre.no_linen_placed')}
        </div>
      )}
    </motion.div>
  );
}

function Resume({ res, onNouvelle, onTerminer }) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)",
        borderRadius: "20px",
        padding: "36px",
        border: "2px solid #86efac",
        boxShadow: "0 8px 32px rgba(16, 185, 129, 0.12)"
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: "#dcfce7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 12px",
          fontSize: "32px"
        }}>
          ✅
        </div>
        <h2 style={{
          fontSize: "24px",
          fontWeight: 800,
          color: "#15803d",
          margin: 0
        }}>
          {t('distribution_chambre.room_equipped', { code: res.codeChambre })}
        </h2>
        <p style={{
          fontSize: "14px",
          color: "#64748b",
          marginTop: "4px"
        }}>
          {res.nbLinges} {t('distribution_chambre.linen')}{res.nbLinges > 1 ? 's' : ''} {t('distribution_chambre.distributed_on')} {res.nbLits} {t('distribution_chambre.bed')}{res.nbLits > 1 ? 's' : ''}
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: "12px",
        marginBottom: "24px"
      }}>
        {res.litsEquipes?.map((l, i) => (
          <div key={i} style={{
            background: "white",
            borderRadius: "12px",
            padding: "14px 16px",
            border: "1px solid #bbf7d0",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "#dcfce7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#15803d"
            }}>
              <FaBed size={14} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "13px", color: "#0f172a" }}>
                {t('distribution_chambre.bed')} {l.codeLit}
              </div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>
                {l.nb} {t('distribution_chambre.linen')}{l.nb > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
        <button
          onClick={onNouvelle}
          style={{
            padding: "12px 28px",
            borderRadius: "12px",
            border: "none",
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            color: "white",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: "0 4px 16px rgba(124, 58, 237, 0.25)"
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
          {t('distribution_chambre.another_room')}
        </button>
        <button
          onClick={onTerminer}
          style={{
            padding: "12px 28px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            background: "white",
            color: "#64748b",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
          onMouseLeave={e => e.currentTarget.style.background = "white"}
        >
          {t('common.finish')}
        </button>
      </div>
    </motion.div>
  );
}

export default function DistributionChambre() {
  const { t } = useTranslation();

  const [etape, setEtape] = useState("CHAMBRE");
  const [agent, setAgent] = useState(null);
  const [chambre, setChambre] = useState(null);
  const [litActif, setLitActif] = useState(null);
  const [scanVal, setScanVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState(null);
  const [poses, setPoses] = useState([]);
  const [scanStatus, setScanStatus] = useState(null);

  const agentRef = useRef(null);
  const chambreRef = useRef(null);
  const litRef = useRef(null);
  const scanInputRef = useRef(null);

  useEffect(() => { agentRef.current = agent; }, [agent]);
  useEffect(() => { chambreRef.current = chambre; }, [chambre]);
  useEffect(() => { litRef.current = litActif; }, [litActif]);

  useEffect(() => {
    const agentData = getAgentFromStorage();
    if (agentData) {
      setAgent(agentData);
      setEtape("CHAMBRE");
      setScanStatus({
        loading: false,
        success: {
          message: `👤 ${t('distribution_chambre.agent')} ${agentData.nom}`,
          detail: `${t('distribution_chambre.connected')} · ${agentData.codeBarre || agentData.matricule}`
        },
        error: null
      });
      setTimeout(() => setScanStatus(null), 2000);
    } else {
      setEtape("CHAMBRE");
      setScanStatus({
        loading: false,
        success: null,
        error: t('distribution_chambre.no_agent_connected')
      });
    }
  }, [t]);

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

  const cloturerDistribution = useCallback(async () => {
    if (poses.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: t('distribution_chambre.no_linen_distributed_title'),
        text: t('distribution_chambre.no_linen_distributed_text'),
        timer: 1500,
        showConfirmButton: false
      });
      return false;
    }

    const result = await Swal.fire({
      icon: 'question',
      title: t('distribution_chambre.finish_distribution_title'),
      text: t('distribution_chambre.finish_distribution_text', {
        count: poses.reduce((s, p) => s + p.nb, 0),
        beds: poses.length
      }),
      showCancelButton: true,
      confirmButtonColor: '#0d9488',
      cancelButtonColor: '#64748b',
      confirmButtonText: t('distribution_chambre.yes_finish'),
      cancelButtonText: t('common.cancel')
    });

    if (!result.isConfirmed) return false;

    const nbTotal = poses.reduce((s, p) => s + p.nb, 0);
    setResume({
      codeChambre: chambre.codeChambre,
      nbLinges: nbTotal,
      nbLits: poses.length,
      litsEquipes: poses
    });
    setEtape("RESUME");
    setLitActif(null);
    return true;
  }, [poses, chambre, t]);

  const handleChambre = useCallback(async code => {
    if (!agent) {
      await Swal.fire({
        icon: 'warning',
        title: t('distribution_chambre.agent_not_connected_title'),
        text: t('distribution_chambre.agent_not_connected_text'),
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }
    setLoading(true);
    setScanStatus({ loading: true, code });
    try {
      const res = await fetchChambre(code);
      
      setChambre({
        chambreId: res.chambreId,
        codeChambre: res.codeChambre,
        lits: res.lits || [],
        disponibles: (res.disponibles || []).map(l => ({ ...l, lingeId: l.lingeId || l.id })),
      });
      setLitActif(null);
      setPoses([]);
      setEtape("DISTRIBUER");
      setScanStatus({
        loading: false,
        success: { 
          message: `✅ ${t('distribution_chambre.room')} ${res.codeChambre}`, 
          detail: `${res.lits?.length} ${t('distribution_chambre.bed')}s · ${res.disponibles?.length || 0} ${t('distribution_chambre.linen')}s` 
        },
        error: null
      });
      setTimeout(() => setScanStatus(null), 2000);
      await Swal.fire({
        icon: 'success',
        title: `✅ ${t('distribution_chambre.room')} ${res.codeChambre}`,
        text: `${res.lits?.length} ${t('distribution_chambre.bed')}s · ${res.disponibles?.length || 0} ${t('distribution_chambre.linen')}s ${t('distribution_chambre.available')}`,
        timer: 1500,
        showConfirmButton: false
      });
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      await Swal.fire({
        icon: 'error',
        title: t('common.error'),
        text: e.message
      });
    } finally {
      setLoading(false);
    }
  }, [agent, t]);

  const handleScanLinge = useCallback(async code => {
    const lit = litRef.current;
    if (!lit) {
      await Swal.fire({
        icon: 'warning',
        title: t('distribution_chambre.select_bed_first_title'),
        text: t('distribution_chambre.select_bed_first_text'),
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }
    setLoading(true);
    setScanStatus({ loading: true, code });
    try {
      const c = chambreRef.current;
      const res = await poserLinge(c.chambreId, lit.litId, code);
      
      const linge = c.disponibles.find(l => l.codeBarre === code || l.lingeId === res.lingeId)
        || { lingeId: res.lingeId, codeBarre: res.codeBarre, categorie: res.categorie };

      setChambre(p => p ? {
        ...p,
        disponibles: p.disponibles.filter(l => l.lingeId !== linge.lingeId),
        lits: p.lits.map(l => l.litId !== lit.litId ? l : {
          ...l,
          litVide: false,
          lingesPoses: [...(l.lingesPoses || []), { ...linge }]
        })
      } : p);

      setPoses(p => {
        const ex = p.find(x => x.litId === lit.litId);
        if (ex) return p.map(x => x.litId === lit.litId ? { ...x, nb: x.nb + 1 } : x);
        return [...p, { litId: lit.litId, codeLit: lit.codeLit, nb: 1 }];
      });

      setScanStatus({
        loading: false,
        success: { 
          message: t('distribution_chambre.linen_placed'), 
          detail: `${t('distribution_chambre.bed')} ${lit.codeLit}` 
        },
        error: null
      });
      setTimeout(() => setScanStatus(null), 1500);
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
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
  }, [t]);

  const handleScan = useCallback(async code => {
    if (!code || loading) return;
    setScanVal("");

    if (etape === "CHAMBRE") {
      await handleChambre(code);
      return;
    }

    // if (etape === "DISTRIBUER") {
    //   try {
    //     const agentTrouve = await fetchAgentByCode(code.trim());
    //     if (agentTrouve) {
    //       await cloturerDistribution();
    //       return;
    //     }
    //   } catch (e) {}
      
    //   await handleScanLinge(code);
    // }
     if (etape === "DISTRIBUER") {
         await handleScanLinge(code.trim());

    }
  }, [etape, loading, handleChambre, handleScanLinge, cloturerDistribution]);

  const reset = useCallback(async () => {
    if (etape !== "CHAMBRE" && etape !== "RESUME") {
      const result = await Swal.fire({
        icon: 'warning',
        title: t('distribution_chambre.reset_title'),
        text: t('distribution_chambre.reset_text'),
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: t('distribution_chambre.yes_reset'),
        cancelButtonText: t('common.cancel')
      });
      if (!result.isConfirmed) return;
    }
    setChambre(null);
    setLitActif(null);
    setPoses([]);
    setResume(null);
    setEtape("CHAMBRE");
    setScanVal("");
    setScanStatus(null);
  }, [etape, t]);

  const getPlaceholder = () => {
    if (!agent) return t('distribution_chambre.agent_not_connected_placeholder');
    if (etape === "CHAMBRE") return t('distribution_chambre.scan_room_code');
    if (etape === "RESUME") return t('distribution_chambre.distribution_completed');
    if (litActif) return t('distribution_chambre.scan_linen_to_bed', { code: litActif.codeLit });
    return t('distribution_chambre.select_bed_hint');
  };

  const getBorderColor = () => {
    if (!agent) return "#dc2626";
    if (litActif) return litActif.estInfecte ? "#dc2626" : "#7c3aed";
    if (etape === "CHAMBRE") return "#0d9488";
    if (etape === "DISTRIBUER") return "#7c3aed";
    return "#e2e8f0";
  };

  const nbPoses = poses.reduce((s, p) => s + p.nb, 0);
  const nbDispo = chambre?.disponibles?.length || 0;
  const litsVides = chambre?.lits?.filter(l => l.litVide).length || 0;
  const nbTotal = nbPoses + nbDispo;
  const pctAvancement = nbTotal > 0 ? Math.round((nbPoses / nbTotal) * 100) : 0;
  const isCloturee = etape === "RESUME";

  return (
    <div className="collecte-container">
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
            background: "linear-gradient(135deg, #0d9488, #0f766e)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            boxShadow: "0 6px 20px rgba(13, 148, 136, 0.3)"
          }}>
            <FaBed size={26} />
          </div>
          <div>
            <h1 style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#0f172a",
              margin: 0
            }}>
              {t('distribution_chambre.title')}
            </h1>
            <p style={{
              fontSize: "14px",
              color: "#64748b",
              margin: "2px 0 0 0"
            }}>
              {agent ? `${t('distribution_chambre.agent')}: ${agent.nom}` : t('distribution_chambre.no_agent_connected')}
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
            {chambre && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 18px",
                background: "#f0fdfa",
                borderRadius: "12px",
                border: "1px solid #99f6e4"
              }}>
                <FaDoorOpen color="#0d9488" size={16} />
                <span style={{ fontWeight: 700, color: "#0d9488", fontSize: "14px" }}>
                  {t('distribution_chambre.room')} {chambre.codeChambre}
                </span>
                <Badge style={{ background: "#ccfbf1", color: "#0d9488", fontSize: "10px", padding: "2px 10px", borderRadius: "12px" }}>
                  {chambre.lits?.length || 0} {t('distribution_chambre.bed')}s
                </Badge>
              </div>
            )}
            {etape === "DISTRIBUER" && litActif && (
              <Badge style={{ background: "#ede9fe", color: "#7c3aed", fontSize: "11px", padding: "4px 14px", borderRadius: "12px" }}>
                🛏️ {t('distribution_chambre.bed')} {litActif.codeLit}
              </Badge>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {etape !== "CHAMBRE" && etape !== "RESUME" && (
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
            <span style={{ fontWeight: 600, color: "#dc2626" }}>{t('distribution_chambre.no_agent_connected')}</span>
            <span style={{ color: "#64748b" }}>{t('distribution_chambre.no_agent_connect_text')}</span>
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

        {etape === "DISTRIBUER" && chambre && !isCloturee && (
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
            <span>💡 {t('distribution_chambre.scan_agent_to_close')}</span>
          </div>
        )}

        {agent && etape === "CHAMBRE" && (
          <Card style={{ background: "#f0fdfa", border: "1px solid #99f6e4", marginBottom: "16px", borderRadius: "12px" }}>
            <CardContent className="p-4">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <FaDoorOpen color="#0d9488" size={16} />
                <span style={{ fontWeight: 600, color: "#0d9488" }}>{t('distribution_chambre.scan_room_to_load')}</span>
                <span style={{ color: "#64748b" }}>{t('distribution_chambre.to_load_beds')}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {etape === "DISTRIBUER" && chambre && !isCloturee && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "12px",
            marginBottom: "20px"
          }}>
            <StatutCard
              label={t('distribution_chambre.distributed')}
              value={nbPoses}
              icon="✅"
              color="#15803d"
              bg="#f0fdf4"
            />
            <StatutCard
              label={t('distribution_chambre.available')}
              value={nbDispo}
              icon="📦"
              color="#0ea5e9"
              bg="#f0f9ff"
            />
            <StatutCard
              label={t('distribution_chambre.empty_beds')}
              value={litsVides}
              icon="🛏️"
              color="#d97706"
              bg="#fef3c7"
            />
            <StatutCard
              label={t('distribution_chambre.progress')}
              value={`${pctAvancement}%`}
              icon="📊"
              color="#7c3aed"
              bg="#faf5ff"
              subValue={pctAvancement === 100 ? `✅ ${t('distribution_chambre.complete')}` : ""}
            />
          </div>
        )}

        {etape === "DISTRIBUER" && chambre && !isCloturee && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "14px"
          }}>
            {chambre.lits.map(lit => (
              <CarteLit
                key={lit.litId}
                lit={lit}
                actif={litActif?.litId === lit.litId}
                onClick={() => {
                  setLitActif(l => l?.litId === lit.litId ? null : lit);
                }}
              />
            ))}
          </div>
        )}

        {etape === "RESUME" && resume && (
          <Resume
            res={resume}
            onNouvelle={() => {
              setChambre(null);
              setLitActif(null);
              setPoses([]);
              setResume(null);
              setEtape("CHAMBRE");
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
            {agent && <span>{t('distribution_chambre.agent')}: <strong style={{ color: "#0f172a" }}>{agent.nom}</strong></span>}
            {chambre && <span>{t('distribution_chambre.room')}: <strong style={{ color: "#0d9488" }}>{chambre.codeChambre}</strong></span>}
            {litActif && <span style={{ color: "#7c3aed" }}>🛏️ {t('distribution_chambre.bed')} {litActif.codeLit}</span>}
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