import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  FaUser, FaBed, FaRedo, FaSpinner, FaCheckDouble,
  FaCheck, FaDoorOpen, FaCheckCircle, FaExclamationTriangle
} from "react-icons/fa";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import ScanInput from "../../components/utils/shared/ScanInput";
import { cat, apiCall } from "../collage/collecteUtils";
import { getAgent, isAgentConnected } from "../../services/agentService";
import Swal from "sweetalert2";
import "../Linge/WorkflowList.css";

// ─── ScanStatus ──────────────────────────────────────────────────────────────
function ScanStatus({ loading, success, error, code }) {
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
          <p style={{ fontWeight: 600, color: "#1d4ed8", fontSize: "14px", margin: 0 }}>Scan en cours...</p>
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
          <p style={{ fontWeight: 600, color: "#15803d", fontSize: "14px", margin: 0 }}>✓ {success.message || "Succès"}</p>
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
          <p style={{ fontWeight: 600, color: "#dc2626", fontSize: "14px", margin: 0 }}>Erreur</p>
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

// ─── CarteLit ──────────────────────────────────────────────────────────────
function CarteLit({ lit, actif, onClick }) {
  const complet = !lit.litVide;
  const infecte = lit.estInfecte;
  const bg = actif ? "#ede9fe" : complet ? "#f0fdf4" : infecte ? "#fff5f5" : "#f8fafc";
  const border = actif ? "#a78bfa" : complet ? "#bbf7d0" : infecte ? "#fca5a5" : "#e2e8f0";
  const nb = lit.lingesPoses?.length || 0;

  return (
    <div onClick={onClick} style={{
      borderRadius: 13,
      border: `2px solid ${border}`,
      background: bg,
      padding: "12px 14px",
      cursor: "pointer",
      transition: "all .18s",
      boxShadow: actif ? "0 0 0 3px #c4b5fd" : "none",
    }}
    onMouseEnter={e => { if (!actif) e.currentTarget.style.borderColor = "#a78bfa"; }}
    onMouseLeave={e => { if (!actif) e.currentTarget.style.borderColor = border; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <FaBed size={13} color={infecte ? "#dc2626" : "#7c3aed"} />
          <span style={{ fontWeight: 800, fontSize: 13, color: infecte ? "#dc2626" : "#1e293b" }}>
            Lit {lit.codeLit}
          </span>
        </div>
        {infecte && <Badge style={{ background: "#fee2e2", color: "#dc2626", fontSize: 9 }}>⚠️ Infecté</Badge>}
        {complet && <Badge style={{ background: "#dcfce7", color: "#15803d", fontSize: 9 }}>✅ Fait</Badge>}
        {actif && <Badge style={{ background: "#ede9fe", color: "#7c3aed", fontSize: 9 }}>● Sélectionné</Badge>}
      </div>

      {nb > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 4 }}>
          {lit.lingesPoses.map((l, i) => {
            const c = cat(l.categorie);
            return (
              <span key={i} style={{
                fontSize: 10,
                padding: "2px 7px",
                borderRadius: 20,
                background: c.bg,
                color: c.color,
                fontWeight: 600
              }}>
                {c.emoji} {l.categorie}
              </span>
            );
          })}
        </div>
      )}
      <div style={{ fontSize: 10, color: "#94a3b8" }}>
        {nb > 0 ? `${nb} linge${nb > 1 ? "s" : ""} posé${nb > 1 ? "s" : ""}` : "Lit vide — à équiper"}
      </div>
    </div>
  );
}

// ─── Resume ──────────────────────────────────────────────────────────────
function Resume({ res, onNouvelle, onTerminer }) {
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
        Chambre {res.codeChambre} équipée
      </div>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
        {res.nbLinges} linge{res.nbLinges > 1 ? "s" : ""} distribué{res.nbLinges > 1 ? "s" : ""} sur {res.nbLits} lit{res.nbLits > 1 ? "s" : ""}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 22 }}>
        {res.litsEquipes?.map((l, i) => (
          <div key={i} style={{
            background: "white",
            borderRadius: 10,
            padding: "9px 12px",
            border: "1px solid #bbf7d0",
            fontSize: 11
          }}>
            <div style={{ fontWeight: 700, color: "#15803d" }}>🛏️ Lit {l.codeLit}</div>
            <div style={{ color: "#64748b" }}>{l.nb} linge{l.nb > 1 ? "s" : ""}</div>
          </div>
        ))}
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
          Autre chambre
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
          Terminer
        </button>
      </div>
    </div>
  );
}

export default function DistributionChambre() {
  const [etape, setEtape] = useState("CHAMBRE"); // ✅ Changé de "AGENT" à "CHAMBRE"
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

  // ✅ Récupérer l'agent depuis localStorage au chargement
  useEffect(() => {
    const agentData = getAgent();
    if (agentData && isAgentConnected()) {
      setAgent(agentData);
      setEtape("CHAMBRE");
      setScanStatus({
        loading: false,
        success: { 
          message: `👤 Agent ${agentData.nom}`, 
          detail: `Connecté · ${agentData.matricule}` 
        },
        error: null
      });
      setTimeout(() => setScanStatus(null), 2000);
    } else {
      setEtape("CHAMBRE");
      setScanStatus({
        loading: false,
        success: null,
        error: "Aucun agent connecté — veuillez vous reconnecter"
      });
    }
  }, []);

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

  // ─── Vérifier si un code est un agent ──────────────────────────────────
  const verifierSiAgent = useCallback(async (code) => {
    try {
      const res = await fetch(`http://localhost:8082/api/agents/matricule/${code}`);
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // ─── Clôturer la distribution ──────────────────────────────────────────
  const cloturerDistribution = useCallback(async () => {
    if (poses.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: '⚠️ Aucun linge distribué',
        text: 'Posez au moins un linge avant de terminer.',
        timer: 1500,
        showConfirmButton: false
      });
      return false;
    }

    const result = await Swal.fire({
      icon: 'question',
      title: 'Terminer la distribution ?',
      text: `${poses.reduce((s, p) => s + p.nb, 0)} linge(s) distribués sur ${poses.length} lit(s)`,
      showCancelButton: true,
      confirmButtonColor: '#0d9488',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Oui, terminer',
      cancelButtonText: 'Annuler'
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
  }, [poses, chambre]);

  // ─── Scan Chambre ──────────────────────────────────────────────────────
  const handleChambre = useCallback(async code => {
    if (!agent) {
      await Swal.fire({
        icon: 'warning',
        title: 'Agent non connecté',
        text: 'Veuillez vous reconnecter.',
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }
    setLoading(true);
    setScanStatus({ loading: true, code });
    try {
      const res = await apiCall("/api/distribution/chambre", {
        codeBarre: code,
        matriculeAgent: agent.matricule // ✅ Utiliser agent du localStorage
      }, "GET");
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
        success: { message: `✅ Chambre ${res.codeChambre}`, detail: `${res.lits?.length} lit(s) · ${res.disponibles?.length || 0} linge(s)` },
        error: null
      });
      setTimeout(() => setScanStatus(null), 2000);
      await Swal.fire({
        icon: 'success',
        title: `✅ Chambre ${res.codeChambre}`,
        text: `${res.lits?.length} lit(s) · ${res.disponibles?.length || 0} linge(s) disponibles`,
        timer: 1500,
        showConfirmButton: false
      });
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: e.message
      });
    } finally {
      setLoading(false);
    }
  }, [agent]);

  // ─── Scan Linge ──────────────────────────────────────────────────────
  const handleScanLinge = useCallback(async code => {
    const lit = litRef.current;
    if (!lit) {
      await Swal.fire({
        icon: 'warning',
        title: '🛏️ Sélectionnez d\'abord un lit',
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }
    setLoading(true);
    setScanStatus({ loading: true, code });
    try {
      const c = chambreRef.current;
      const res = await apiCall("/api/distribution/chambre/lit", {
        chambreId: c.chambreId,
        litId: lit.litId,
        codeOuTag: code,
        matriculeAgent: agent.matricule // ✅ Utiliser agent du localStorage
      });
      const linge = c.disponibles.find(l => l.codeBarre === code || l.lingeId === res.lingeId)
        || { lingeId: res.lingeId, codeBarre: res.codeBarre, categorie: res.categorie };

      // Mettre à jour l'état local
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
        success: { message: "✓ Linge posé", detail: `Lit ${lit.codeLit}` },
        error: null
      });
      setTimeout(() => setScanStatus(null), 1500);
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: e.message,
        timer: 1500,
        showConfirmButton: false
      });
    } finally {
      setLoading(false);
    }
  }, [agent]);

  // ─── Gestion scan ──────────────────────────────────────────────────────
  const handleScan = useCallback(async code => {
    if (!code || loading) return;
    setScanVal("");

    // ✅ Étape CHAMBRE : scan directement la chambre
    if (etape === "CHAMBRE") {
      await handleChambre(code);
      return;
    }

    // ✅ Étape DISTRIBUER : détecter agent pour clôturer
    if (etape === "DISTRIBUER") {
      const agentTrouve = await verifierSiAgent(code);
      if (agentTrouve) {
        await cloturerDistribution();
      } else {
        await handleScanLinge(code);
      }
      return;
    }
  }, [etape, loading, handleChambre, handleScanLinge, verifierSiAgent, cloturerDistribution]);

  // ─── Reset ──────────────────────────────────────────────────────────────
  const reset = useCallback(async () => {
    if (etape !== "CHAMBRE" && etape !== "RESUME") {
      const result = await Swal.fire({
        icon: 'warning',
        title: 'Réinitialiser',
        text: 'La distribution en cours sera abandonnée.',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Oui, réinitialiser',
        cancelButtonText: 'Annuler'
      });
      if (!result.isConfirmed) return;
    }
    setAgent(null);
    setChambre(null);
    setLitActif(null);
    setPoses([]);
    setResume(null);
    setEtape("CHAMBRE");
    setScanVal("");
    setScanStatus(null);
  }, [etape]);

  // ─── Helpers ──────────────────────────────────────────────────────────
  const getPlaceholder = () => {
    if (!agent) return "👤 Agent non connecté — veuillez vous reconnecter";
    if (etape === "CHAMBRE") return "🚪 Scanner le code chambre...";
    if (etape === "RESUME") return "✅ Distribution terminée";
    if (litActif) return `🏷️ Scanner un linge → Lit ${litActif.codeLit}`;
    return "🛏️ Cliquez sur un lit pour le sélectionner";
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
              Distribution — Chambre
            </h1>
            <p style={{
              fontSize: "14px",
              color: "#64748b",
              margin: "2px 0 0 0"
            }}>
              {agent ? `Agent: ${agent.nom}` : "Aucun agent connecté"}
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
                <span style={{ fontWeight: 700, color: "#7c3aed", fontSize: "14px" }}>{agent.nom}</span>
                <Badge style={{ background: "#ede9fe", color: "#7c3aed", fontSize: "10px", padding: "2px 10px", borderRadius: "12px" }}>
                  {agent.matricule}
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
                <span style={{ fontWeight: 700, color: "#0d9488", fontSize: "14px" }}>Chambre {chambre.codeChambre}</span>
                <Badge style={{ background: "#ccfbf1", color: "#0d9488", fontSize: "10px", padding: "2px 10px", borderRadius: "12px" }}>
                  {chambre.lits?.length || 0} lits
                </Badge>
              </div>
            )}
            {etape === "DISTRIBUER" && litActif && (
              <Badge style={{ background: "#ede9fe", color: "#7c3aed", fontSize: "11px", padding: "4px 14px", borderRadius: "12px" }}>
                🛏️ Lit {litActif.codeLit}
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
                Reset
              </button>
            )}
          </div>
        </div>

        {/* ─── Message si agent non connecté ────────────────────────────── */}
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
            <span style={{ fontWeight: 600, color: "#dc2626" }}>Aucun agent connecté</span>
            <span style={{ color: "#64748b" }}>Veuillez vous connecter pour effectuer une distribution</span>
          </div>
        )}

        {/* ─── ZONE DE SCAN ────────────────────────────────────────────── */}
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

        {/* ─── INDICATEUR SCAN AGENT ────────────────────────────────────── */}
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
            <span>💡 Scanner votre badge agent pour clôturer la distribution</span>
          </div>
        )}

        {/* ─── ÉTAPES VIDE ───────────────────────────────────────────────── */}
        {agent && etape === "CHAMBRE" && (
          <Card style={{ background: "#f0fdfa", border: "1px solid #99f6e4", marginBottom: "16px", borderRadius: "12px" }}>
            <CardContent className="p-4">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <FaDoorOpen color="#0d9488" size={16} />
                <span style={{ fontWeight: 600, color: "#0d9488" }}>Scannez le code de la chambre</span>
                <span style={{ color: "#64748b" }}>pour charger les lits</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── STATUTS ────────────────────────────────────────────────────── */}
        {etape === "DISTRIBUER" && chambre && !isCloturee && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "12px",
            marginBottom: "20px"
          }}>
            <StatutCard
              label="Distribués"
              value={nbPoses}
              icon="✅"
              color="#15803d"
              bg="#f0fdf4"
            />
            <StatutCard
              label="Disponibles"
              value={nbDispo}
              icon="📦"
              color="#0ea5e9"
              bg="#f0f9ff"
            />
            <StatutCard
              label="Lits vides"
              value={litsVides}
              icon="🛏️"
              color="#d97706"
              bg="#fef3c7"
            />
            <StatutCard
              label="Avancement"
              value={`${pctAvancement}%`}
              icon="📊"
              color="#7c3aed"
              bg="#faf5ff"
              subValue={pctAvancement === 100 ? "✅ Complet" : ""}
            />
          </div>
        )}

        {/* ─── DISTRIBUER : LITS ────────────────────────────────────────── */}
        {etape === "DISTRIBUER" && chambre && !isCloturee && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "10px"
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

        {/* ─── RÉSUMÉ ────────────────────────────────────────────────────── */}
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

        {/* ─── FOOTER ────────────────────────────────────────────────────── */}
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
            {agent && <span>Agent: <strong style={{ color: "#0f172a" }}>{agent.nom}</strong></span>}
            {chambre && <span>Chambre: <strong style={{ color: "#0d9488" }}>{chambre.codeChambre}</strong></span>}
            {litActif && <span style={{ color: "#7c3aed" }}>🛏️ Lit {litActif.codeLit}</span>}
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