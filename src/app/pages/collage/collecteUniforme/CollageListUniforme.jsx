import React, { useState, useRef, useCallback, useEffect } from "react";
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
function DlgManquant({ linge, onOk, onClose }) {
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
              Uniforme manquant ?
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
            Annuler
          </button>
          <button onClick={() => onOk(linge)} style={{
            flex: 2, padding: "10px", borderRadius: "8px",
            border: "none", background: "#d97706",
            color: "white", fontWeight: 700, fontSize: "12px",
            cursor: "pointer"
          }}>
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CARTE UNIFORME ──────────────────────────────────────────────────────
function CarteUniforme({ u, uniformeEnCours, onManquant }) {
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
                Scan bac
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
          title="Manquant"
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
export default function CollageListUniforme() {
  const { showAlert, showConfirm } = useModal();

  const [etape, setEtape] = useState("AGENT");
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

  // ─── ÉTAPE 1 : Agent ──────────────────────────────────────────────────
  const handleAgent = useCallback(async (code) => {
    setLoading(true);
    setScanStatus(null);
    try {
      const ag = await fetch(`${API_URL}/api/agents/matricule/${code}`)
        .then(r => r.ok ? r.json() : null);
      if (!ag) {
        setScanStatus({ loading: false, success: null, error: "Agent introuvable" });
        showAlert("Agent introuvable", code, "error");
        return;
      }
      setAgent({ nom: ag.nom, matricule: ag.matricule });
      setEtape("BADGE");
      setScanStatus({
        loading: false,
        success: { message: "Agent identifié", detail: `${ag.nom} (${ag.matricule})` },
        error: null
      });
      setTimeout(() => setScanStatus(null), 2000);
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      showAlert("Erreur", e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  // ─── ÉTAPE 2 : Badge médecin ─────────────────────────────────────────
  const handleBadge = useCallback(async (code) => {
    setLoading(true);
    setScanStatus(null);
    try {
      const res = await apiCall("/api/collecte/uniforme/ouvrir", {
        matriculeAgent: agentRef.current.matricule,
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
          message: res.estInfecte ? "⚠️ Contact infectieux" : `✅ ${res.personnelNom}`,
          detail: res.estInfecte ? res.infoInfection || "Uniformes potentiellement infectés" : `${res.nbUniformes} uniforme(s)`
        },
        error: null
      });
      setTimeout(() => setScanStatus(null), 3000);
      
      if (res.estInfecte) {
        showAlert("⚠️ Contact infectieux", `${res.personnelNom} — ${res.infoInfection || "Uniformes potentiellement infectés"}`, "warning");
      } else {
        showAlert("Médecin identifié", `${res.personnelNom} — ${res.nbUniformes} uniforme(s)`, "success");
      }
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      showAlert("Erreur", e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  // ─── ÉTAPE 3 : Scanner uniforme ──────────────────────────────────────
  const handleScanUniforme = useCallback((code) => {
    const u = collecteRef.current?.uniformes?.find(
      x => x.codeBarre === code || String(x.lingeId) === code
    );
    if (!u) {
      showAlert("Uniforme introuvable", code, "error");
      return;
    }
    if (u.statut) {
      showAlert("Déjà traité", u.codeBarre, "info");
      return;
    }
    setUniformeEnCours(u);
    if (u.estInfecte) {
      showAlert("🔴 Uniforme infecté", "Scannez un bac ROUGE", "warning");
    } else {
      showAlert("🟢 Uniforme propre", "Scannez un bac BLANC", "success");
    }
  }, [showAlert]);

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
          message: res.statut === "INFECTE" ? "✅ Bac ROUGE" : "✅ Bac BLANC",
          detail: `${uniformeEnCours.codeBarre} → ${res.bac}`
        },
        error: null
      });
      setTimeout(() => setScanStatus(null), 2000);
      
      if (res.statut === "INFECTE") {
        showAlert("✅ Bac ROUGE", `${uniformeEnCours.codeBarre} → bac rouge`, "warning");
      } else {
        showAlert("✅ Bac BLANC", `${uniformeEnCours.codeBarre} → bac blanc`, "success");
      }
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      showAlert("Erreur", e.message || "Bac invalide", "error");
    } finally {
      setLoading(false);
    }
  }, [uniformeEnCours, showAlert, majUniforme]);

  // ─── Manquant ─────────────────────────────────────────────────────────
  const handleManquant = useCallback(async (u) => {
    setDlgManq(null);
    setLoading(true);
    try {
      await apiCall(`/api/collecte/uniforme/${collecteRef.current?.id}/manquant`, { lingeId: u.lingeId });
      majUniforme(u.lingeId, "MANQUANT");
      showAlert("Manquant", u.codeBarre, "warning");
    } catch (e) {
      showAlert("Erreur", e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showAlert, majUniforme]);

  // ─── Clôturer ─────────────────────────────────────────────────────────
  const handleCloturer = useCallback(async () => {
    const nonTr = collecte?.uniformes?.filter(u => !u.statut) || [];
    if (nonTr.length > 0) {
      const ok = await showConfirm(
        "Clôturer",
        `${nonTr.length} uniforme(s) non traité(s). Clôturer ?`,
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
      showAlert("Collecte clôturée", `${collecte.personnelNom} — ${res.nbBlancs} blancs, ${res.nbInfectes} infectés`, "success");
    } catch (e) {
      showAlert("Erreur", e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [collecte, showAlert, showConfirm]);

  const handleScan = useCallback(async (code) => {
    setScanVal("");
    if (etape === "AGENT") { await handleAgent(code); return; }
    if (etape === "BADGE") { await handleBadge(code); return; }
    if (etape === "SCAN") {
      if (uniformeEnCours) {
        await handleScanBac(code);
        return;
      }
      handleScanUniforme(code);
    }
  }, [etape, uniformeEnCours, handleAgent, handleBadge, handleScanUniforme, handleScanBac]);

  const reset = () => {
    setAgent(null);
    setCollecte(null);
    setResume(null);
    setUniformeEnCours(null);
    setEtape("AGENT");
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
    if (!agent) return "👤 Scanner votre badge agent...";
    if (!collecte) return "🩺 Scanner le badge du médecin...";
    if (uniformeEnCours) return "📦 Scanner le bac...";
    if (etape === "RESUME") return "🔒 Collecte terminée";
    return "👔 Scanner un uniforme...";
  };

  const isCloturee = etape === "RESUME";

  return (
    <div className="collecte-container">
      <DlgManquant linge={dlgManq} onOk={handleManquant} onClose={() => setDlgManq(null)} />

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
              Collecte Uniformes
            </h1>
            <p style={{
              fontSize: "14px",
              color: "#64748b",
              margin: "2px 0 0 0"
            }}>
              {agent ? `Agent: ${agent.nom}` : "Scannez votre badge pour commencer"}
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
                  {collecte.nbUniformes} uniformes
                </Badge>
                {collecte.estInfecte && (
                  <Badge style={{ background: "#fee2e2", color: "#dc2626", fontSize: "10px", padding: "2px 10px", borderRadius: "12px" }}>
                    ⚠️ Infecté
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
              Reset
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
              label="Total"
              value={total}
              icon="📊"
              color="#0ea5e9"
              bg="#f0f9ff"
            />
            <StatutCard
              label="Blancs"
              value={blancs}
              icon="✅"
              color="#15803d"
              bg="#f0fdf4"
            />
            <StatutCard
              label="Infectés"
              value={infectes}
              icon="🔴"
              color="#dc2626"
              bg="#fef2f2"
            />
            <StatutCard
              label="Manquants"
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
              disabled={isCloturee || loading}
            />
            {scanStatus && (
              <div style={{ marginTop: "12px" }}>
                <ScanStatus {...scanStatus} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── INFO ──────────────────────────────────────────────────────── */}
        {agent && !collecte && (
          <Card style={{ background: "#faf5ff", border: "1px solid #e9d5ff", marginBottom: "16px", borderRadius: "12px" }}>
            <CardContent className="p-4">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <FaUserMd color="#7c3aed" size={16} />
                <span style={{ fontWeight: 600, color: "#7c3aed" }}>Scannez le badge du médecin</span>
                <span style={{ color: "#64748b" }}>pour commencer la collecte</span>
              </div>
            </CardContent>
          </Card>
        )}

        {agent && collecte && etape === "SCAN" && !uniformeEnCours && (
          <Card style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", marginBottom: "16px", borderRadius: "12px" }}>
            <CardContent className="p-4">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", flexWrap: "wrap" }}>
                <FaCheckCircle color="#22c55e" size={16} />
                <span style={{ fontWeight: 600, color: "#15803d" }}>Prêt à collecter</span>
                <span style={{ color: "#64748b" }}>Scannez un uniforme</span>
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
                  {uniformeEnCours.estInfecte && " — ⚠️ Bac ROUGE"}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  Scannez le bac de destination
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
              Annuler
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
                  ? `⚠️ Clôturer (${nonTr} non traités)`
                  : <><FaCheckDouble size={12} /> Terminer et clôturer</>}
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
              Collecte terminée — {collecte?.personnelNom}
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "8px",
              marginBottom: "20px"
            }}>
              {[
                ["Blancs", resume.nbBlancs, "#dcfce7", "#15803d"],
                ["Infectés", resume.nbInfectes, "#fee2e2", "#dc2626"],
                ["Propres", resume.nbPropres, "#dbeafe", "#0284c7"],
                ["Manq.", resume.nbManquants, "#fef3c7", "#d97706"],
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
                + Autre médecin
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
                Terminer
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
              <span>Uniformes ({total})</span>
              <span style={{ color: "#0ea5e9" }}>{traites} traités</span>
            </div>
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              {collecte.uniformes.map(u => (
                <CarteUniforme
                  key={u.lingeId}
                  u={u}
                  uniformeEnCours={uniformeEnCours}
                  onManquant={x => setDlgManq(x)}
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

// ─── COMPOSANT : Scan Status ──────────────────────────────────────────────
function ScanStatus({ loading, success, error, code }) {
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
          <p style={{ fontWeight: 600, color: "#1d4ed8", fontSize: "13px", margin: 0 }}>Scan en cours...</p>
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
          <p style={{ fontWeight: 600, color: "#15803d", fontSize: "13px", margin: 0 }}>✓ {success.message || "Succès"}</p>
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
          <p style={{ fontWeight: 600, color: "#dc2626", fontSize: "13px", margin: 0 }}>Erreur</p>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>{error}</p>
        </div>
      </div>
    );
  }

  return null;
}