/**
 * ColageList — Collecte CHAMBRE
 * Backend : CollecteChambreController → /api/collecte/chambre/*
 * Flux : scan chambre → lits + linges
 *        scan lit → scan bac → tous les linges du lit associés
 *        bouton PROPRE individuel · bouton MANQUANT dialogue
 *        SCAN BADGE AGENT = CLÔTURE AUTOMATIQUE + RETOUR CHAMBRE
 */
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useModal } from "../../contextes/ModalContext";
import {
  FaUser, FaTimes, FaBiohazard, FaCheckCircle,
  FaExclamationTriangle, FaSpinner, FaBox, FaBed, FaRedo, FaCheckDouble,
  FaDoorOpen, FaCheck, FaBuilding, FaBoxes
} from "react-icons/fa";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import ScanInput from "../../components/utils/shared/ScanInput";
import EtapesStepper from "../../components/utils/shared/EtapesStepper";
import DialogCategorie from "../../components/utils/collecte/DialogCategorie";
import { cat, ST_COLORS, apiCall } from "./collecteUtils";
import "../Linge/WorkflowList.css";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';

// ─── COMPOSANT : Scan Status ──────────────────────────────────────────────
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

// ─── Dialogue manquant ──────────────────────────────────────────────────
function DialogueManquant({ linge, onConfirmer, onFermer }) {
  if (!linge) return null;
  const c = cat(linge.categorie);
  return (
    <div data-modal="true" style={{
      position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, backdropFilter: "blur(4px)"
    }}>
      <div style={{
        background: "white", borderRadius: "18px", padding: "24px",
        maxWidth: "320px", width: "92%",
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
            <div style={{ fontWeight: 700, fontSize: "13px", color: "#0f172a" }}>
              Linge manquant ?
            </div>
          </div>
          <button onClick={onFermer} style={{
            background: "#f1f5f9", border: "none",
            borderRadius: "50%", width: "28px", height: "28px",
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
            <code style={{ fontSize: "10px", color: "#64748b" }}>{linge.codeBarre}</code>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onFermer} style={{
            flex: 1, padding: "9px", borderRadius: "8px",
            border: "1px solid #e2e8f0", background: "white",
            color: "#64748b", fontWeight: 600, fontSize: "12px",
            cursor: "pointer"
          }}>
            Annuler
          </button>
          <button onClick={() => onConfirmer(linge)} style={{
            flex: 2, padding: "9px", borderRadius: "8px",
            border: "none", background: "linear-gradient(135deg,#d97706,#b45309)",
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

// ─── Carte lit ────────────────────────────────────────────────────────────
function CarteLit({ lit, onPropre, onManquant }) {
  const traites = lit.linges.filter(l => l.statut).length;
  const stLit = lit.statut;
  const totalLinges = lit.linges.length;

  return (
    <div style={{
      borderRadius: "12px",
      border: `1px solid ${stLit === "BLANC" ? "#86efac" : stLit === "INFECTE" ? "#fca5a5" : "#e2e8f0"}`,
      background: stLit === "BLANC" ? "#f0fdf4" : stLit === "INFECTE" ? "#fef2f2" : "white",
      overflow: "hidden",
      marginBottom: "8px"
    }}>
      <div style={{
        padding: "10px 14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: `1px solid ${stLit === "BLANC" ? "#86efac" : stLit === "INFECTE" ? "#fca5a5" : "#e2e8f0"}`,
        background: stLit ? (stLit === "BLANC" ? "#dcfce7" : "#fee2e2") : "#f8fafc"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FaBed size={14} color={stLit === "INFECTE" ? "#dc2626" : "#64748b"} />
          <span style={{ fontWeight: 700, fontSize: "13px", color: stLit === "INFECTE" ? "#dc2626" : "#0f172a" }}>
            Lit {lit.codeLit}
          </span>
          {lit.estInfecte && !stLit && (
            <span style={{
              fontSize: "9px", padding: "2px 8px", borderRadius: "12px",
              background: "#fee2e2", color: "#dc2626", fontWeight: 700
            }}>
              ⚠️ Infecté
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {stLit === "BLANC" && (
            <span style={{
              fontSize: "9px", fontWeight: 700, padding: "2px 10px",
              borderRadius: "12px", background: "#dcfce7", color: "#15803d"
            }}>
              ✅ Blanc
            </span>
          )}
          {stLit === "INFECTE" && (
            <span style={{
              fontSize: "9px", fontWeight: 700, padding: "2px 10px",
              borderRadius: "12px", background: "#fee2e2", color: "#dc2626"
            }}>
              🔴 Infecté
            </span>
          )}
          {!stLit && (
            <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>
              {traites}/{totalLinges}
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: "6px 8px" }}>
        {lit.linges.map(linge => {
          const c = cat(linge.categorie);
          const col = ST_COLORS[linge.statut];
          return (
            <div
              key={linge.lingeId}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 10px",
                borderRadius: "8px",
                marginBottom: "4px",
                background: col?.bg || "#f8fafc",
                border: `1px solid ${col?.b || "#e2e8f0"}`
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>{c.emoji}</span>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: c.color }}>{c.label}</span>
                  <code style={{ fontSize: "10px", color: "#94a3b8", marginLeft: "6px" }}>{linge.codeBarre}</code>
                </div>
              </div>
              {linge.statut ? (
                <span style={{
                  fontSize: "9px", fontWeight: 700, padding: "2px 10px",
                  borderRadius: "12px", background: col?.tag, color: col?.tc
                }}>
                  {col?.lbl}
                </span>
              ) : !stLit && (
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={() => onPropre(linge)}
                    title="Propre"
                    style={{
                      width: "28px", height: "28px", borderRadius: "50%",
                      border: "1.5px solid #bae6fd", background: "#dbeafe",
                      cursor: "pointer", display: "flex", alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <FaCheckCircle size={9} color="#0284c7" />
                  </button>
                  <button
                    onClick={() => onManquant(linge)}
                    title="Manquant"
                    style={{
                      width: "28px", height: "28px", borderRadius: "50%",
                      border: "1.5px solid #fde68a", background: "#fef3c7",
                      cursor: "pointer", display: "flex", alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <FaExclamationTriangle size={9} color="#d97706" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PAGE ──────────────────────────────────────────────────────────────────
export default function ColageList() {
  const { showAlert, showConfirm } = useModal();
  const [etape, setEtape] = useState("AGENT");
  const [agent, setAgent] = useState(null);
  const [collecte, setCollecte] = useState(null);
  const [litEnCours, setLitEnCours] = useState(null);
  const [scanVal, setScanVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [dlgManq, setDlgManq] = useState(null);
  const [scanStatus, setScanStatus] = useState(null);
  const [isFocused, setIsFocused] = useState(true);

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

  const majLit = useCallback((litId, statut) => {
    setCollecte(p => p ? {
      ...p,
      lits: p.lits.map(l =>
        l.litId !== litId ? l : {
          ...l,
          statut,
          linges: l.linges.map(lg => lg.statut ? lg : { ...lg, statut })
        }
      )
    } : p);
  }, []);

  const majLinge = useCallback((lingeId, statut) => {
    setCollecte(p => p ? {
      ...p,
      lits: p.lits.map(l => ({
        ...l,
        linges: l.linges.map(lg => lg.lingeId === lingeId ? { ...lg, statut } : lg)
      }))
    } : p);
  }, []);

  // ─── Vérifier si un code est un agent ──────────────────────────────────
  const verifierSiAgent = useCallback(async (code) => {
    try {
      const res = await fetch(`${API_URL}/api/agents/matricule/${code}`);
      if (res.ok) {
        const ag = await res.json();
        return ag;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // ─── Clôturer automatiquement et retourner à CHAMBRE ──────────────────
  const cloturerEtRetourner = useCallback(async (nouvelAgent) => {
    if (!collecte) return;
    
    setLoading(true);
    try {
      // Vérifier s'il y a des lits non traités
      const nonTr = collecte?.lits?.filter(l => !l.statut) || [];
      
      // Si des lits non traités, demander confirmation
      if (nonTr.length > 0) {
        const ok = await showConfirm(
          "⚠️ Lits non traités",
          `${nonTr.length} lit(s) non traité(s). Changer d'agent va clôturer la collecte. Continuer ?`,
          "question"
        );
        if (!ok) {
          setLoading(false);
          return false;
        }
      }

      // Clôturer la collecte
      await apiCall(`/api/collecte/chambre/${collecte.id}/cloturer`);
      
      showAlert(
        "✅ Collecte clôturée",
        `Chambre ${collecte.codeChambre} terminée`,
        "success"
      );
      
      // Réinitialiser pour une nouvelle chambre mais garder l'agent
      setCollecte(null);
      setLitEnCours(null);
      setEtape("CHAMBRE");
      
      // Mettre à jour l'agent si un nouvel agent est passé
      if (nouvelAgent) {
        setAgent({ nom: nouvelAgent.nom, matricule: nouvelAgent.matricule });
        showAlert("👤 Agent changé", `Nouvel agent: ${nouvelAgent.nom}`, "info");
      }
      
      // Focus sur l'input
      setTimeout(() => scanInputRef.current?.focus(), 300);
      
      return true;
    } catch (e) {
      showAlert("❌ Erreur", e.message, "error");
      return false;
    } finally {
      setLoading(false);
    }
  }, [collecte, showAlert, showConfirm]);

  // ─── Gestion du scan principal ──────────────────────────────────────────
  const handleScan = useCallback(async (code) => {
    if (!code) return;
    
    // 1. Vérifier si c'est un agent
    const agentTrouve = await verifierSiAgent(code);
    
    // 2. Si c'est un agent et qu'on est en cours de collecte (SCAN)
    if (agentTrouve && etape === "SCAN" && collecte) {
      await cloturerEtRetourner(agentTrouve);
      return;
    }
    
    // 3. Si c'est un agent et qu'on est à l'étape AGENT (première connexion)
    if (agentTrouve && etape === "AGENT") {
      await handleAgent(code);
      return;
    }
    
    // 4. Si c'est un agent et qu'on est à l'étape CHAMBRE (changement d'agent avant collecte)
    if (agentTrouve && etape === "CHAMBRE") {
      setAgent({ nom: agentTrouve.nom, matricule: agentTrouve.matricule });
      return;
    }
    
    // 5. Sinon, traiter normalement selon l'étape
    if (etape === "AGENT") {
      showAlert("❌ Agent introuvable", "Scannez un badge agent valide", "error");
      return;
    }
    
    if (etape === "CHAMBRE") {
      await handleChambre(code);
      return;
    }
    
    if (etape === "SCAN") {
      if (litEnCours) {
        await handleScanBac(code);
        return;
      }
      handleScanLit(code);
    }
  }, [etape, collecte, litEnCours, verifierSiAgent, cloturerEtRetourner]);

  // ─── Les handlers existants ────────────────────────────────────────────
  const handleAgent = useCallback(async (code) => {
    setLoading(true);
    setScanStatus({ loading: true, code: code });
    try {
      const ag = await fetch(`${API_URL}/api/agents/matricule/${code}`)
        .then(r => r.ok ? r.json() : null);
      if (!ag) {
        setScanStatus({ loading: false, success: null, error: "Agent introuvable" });
        showAlert("❌ Agent introuvable", code, "error");
        return;
      }
      setAgent({ nom: ag.nom, matricule: ag.matricule });
      setEtape("CHAMBRE");
      setScanStatus({
        loading: false,
        success: { message: "Agent identifié", detail: `${ag.nom} (${ag.matricule})` },
        error: null
      });
      setTimeout(() => setScanStatus(null), 2000);
      showAlert("✅ Agent identifié", ag.nom, "success");
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      showAlert("❌ Erreur", e.message, "error");
    } finally { setLoading(false); }
  }, [showAlert]);

  const handleChambre = useCallback(async (code) => {
    setLoading(true);
    setScanStatus({ loading: true, code: code });
    try {
      const ch = await fetch(
        `http://localhost:8082/api/sqlserver/chambres/code/{code}?code=${code}`
       ).then(r => r.ok ? r.json() : null);
      if (!ch) {
        setScanStatus({ loading: false, success: null, error: "Chambre introuvable" });
        showAlert("❌ Chambre introuvable", code, "error");
        return;
      }
      const res = await apiCall("/api/collecte/chambre/ouvrir", {
        codeBarre: ch.codeBarre || code,
        matriculeAgent: agentRef.current.matricule
      });
      setCollecte({
        id: res.collecteId,
        codeChambre: res.codeChambre,
        lits: (res.lits || []).map(l => ({ ...l, statut: "" }))
      });
      setLitEnCours(null);
      setEtape("SCAN");
      setScanStatus({
        loading: false,
        success: { message: `✅ ${res.codeChambre}`, detail: `${res.nbLits} lit(s), ${res.nbLinges} linge(s)` },
        error: null
      });
      setTimeout(() => setScanStatus(null), 2000);
      showAlert("✅ Chambre ouverte", `${res.codeChambre} — ${res.nbLits} lit(s), ${res.nbLinges} linge(s)`, "success");
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      showAlert("❌ Erreur", e.message, "error");
    } finally { setLoading(false); }
  }, [showAlert]);

  const handleScanLit = useCallback((code) => {
    const lit = collecteRef.current?.lits?.find(l => l.codeLit === code || String(l.litId) === code);
    if (!lit) {
      showAlert("❌ Lit introuvable", code, "error");
      return;
    }
    if (lit.statut) {
      showAlert("⚠️ Lit déjà traité", lit.codeLit, "info");
      return;
    }
    setLitEnCours(lit);
    showAlert(
      "📋 Lit scanné",
      lit.estInfecte ? "⚠️ Infecté — scannez un bac ROUGE" : "Scannez le bac",
      lit.estInfecte ? "warning" : "success"
    );
  }, [showAlert]);

  const handleScanBac = useCallback(async (code) => {
    if (!litEnCours) return;
    setLoading(true);
    setScanStatus({ loading: true, code: code });
    try {
      const res = await apiCall(`/api/collecte/chambre/${collecteRef.current?.id}/lit`, {
        litId: litEnCours.litId,
        codeBac: code
      });
      majLit(litEnCours.litId, res.typeBac === "INFECTE" ? "INFECTE" : "BLANC");
      setLitEnCours(null);
      setScanStatus({
        loading: false,
        success: {
          message: res.typeBac === "INFECTE" ? "🔴 Bac ROUGE" : "✅ Bac BLANC",
          detail: `${res.nbTraites} linge(s) du lit ${litEnCours.codeLit}`
        },
        error: null
      });
      setTimeout(() => setScanStatus(null), 2000);
      showAlert(
        res.typeBac === "INFECTE" ? "🔴 Bac ROUGE" : "✅ Bac BLANC",
        `${res.nbTraites} linge(s) du lit ${litEnCours.codeLit}`,
        res.typeBac === "INFECTE" ? "warning" : "success"
      );
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      showAlert("❌ Erreur", e.message, "error");
    } finally { setLoading(false); }
  }, [litEnCours, showAlert, majLit]);

  const handlePropre = useCallback(async (linge) => {
    setLoading(true);
    try {
      await apiCall(`/api/collecte/chambre/${collecteRef.current?.id}/propre`, { codeOuTag: linge.codeBarre });
      majLinge(linge.lingeId, "PROPRE");
      showAlert("🔵 Propre", `${linge.codeBarre} — laissé en place`, "info");
    } catch (e) { showAlert("❌ Erreur", e.message, "error"); } finally { setLoading(false); }
  }, [showAlert, majLinge]);

  const handleManquant = useCallback(async (linge) => {
    setDlgManq(null);
    setLoading(true);
    try {
      await apiCall(`/api/collecte/chambre/${collecteRef.current?.id}/manquant`, { lingeId: linge.lingeId });
      majLinge(linge.lingeId, "MANQUANT");
      showAlert("⚠️ Manquant", linge.codeBarre, "warning");
    } catch (e) { showAlert("❌ Erreur", e.message, "error"); } finally { setLoading(false); }
  }, [showAlert, majLinge]);

  const reset = () => {
    setAgent(null);
    setCollecte(null);
    setLitEnCours(null);
    setEtape("AGENT");
    setScanVal("");
    setScanStatus(null);
    setTimeout(() => scanInputRef.current?.focus(), 200);
  };

  const totalLits = collecte?.lits?.length || 0;
  const traites = collecte?.lits?.filter(l => l.statut).length || 0;
  const nonTraites = totalLits - traites;
  const nbBlancs = collecte?.lits?.filter(l => l.statut === "BLANC").length || 0;
  const nbInfectes = collecte?.lits?.filter(l => l.statut === "INFECTE").length || 0;

  const getPlaceholder = () => {
    if (!agent) return "👤 Scanner le badge agent...";
    if (!collecte) return "🏢 Scanner le code chambre...";
    if (litEnCours) return `📦 Scanner le bac pour Lit ${litEnCours.codeLit}...`;
    return "🛏️ Scanner un lit (ou badge agent pour clôturer)";
  };

  const getBorderColor = () => {
    if (litEnCours) return litEnCours.estInfecte ? "#dc2626" : "#7c3aed";
    if (etape === "AGENT") return "#7c3aed";
    if (etape === "CHAMBRE") return "#7c3aed";
    if (etape === "SCAN") return "#7c3aed";
    return "#e2e8f0";
  };

  // ─── Indicateur de scan agent ───────────────────────────────────────────
  const showAgentHint = etape === "SCAN" && collecte;

  return (
    <div className="collecte-container">
      <DialogueManquant linge={dlgManq} onConfirmer={handleManquant} onFermer={() => setDlgManq(null)} />

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
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            boxShadow: "0 6px 20px rgba(124, 58, 237, 0.3)"
          }}>
            <FaDoorOpen size={26} />
          </div>
          <div>
            <h1 style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#0f172a",
              margin: 0
            }}>
              Collecte Chambre
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
                <FaBuilding color="#0284c7" size={16} />
                <span style={{ fontWeight: 700, color: "#0284c7", fontSize: "14px" }}>{collecte.codeChambre}</span>
                <Badge style={{ background: "#e0f2fe", color: "#0284c7", fontSize: "10px", padding: "2px 10px", borderRadius: "12px" }}>
                  {totalLits} lits
                </Badge>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {etape !== "AGENT" && (
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
            )}
          </div>
        </div>

        {/* ─── ZONE DE SCAN ────────────────────────────────────────────── */}
        <Card style={{
          marginBottom: "20px",
          border: `2px dashed ${etape === "AGENT" || etape === "CHAMBRE" ? "#7c3aed" : "#7c3aed"}`,
          background: "white",
          borderRadius: "16px"
        }}>
          <CardContent className="p-5">
            <ScanInput
              ref={scanInputRef}
              placeholder={getPlaceholder()}
              value={scanVal}
              onChange={setScanVal}
              onSubmit={handleScan}
              borderColor={getBorderColor()}
              keepFocus={true}
              autoDebounce={true}
              disabled={loading}
            />
            
            {/* ─── Indicateur de scan badge agent ─────────────────────────── */}
            {showAgentHint && (
              <div style={{
                marginTop: "8px",
                padding: "6px 14px",
                borderRadius: "8px",
                background: "#fef3c7",
                border: "1px solid #fcd34d",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                color: "#92400e"
              }}>
                <FaUser size={12} />
                <span>💡 Scanner votre badge agent pour clôturer la collecte</span>
              </div>
            )}
            
            {scanStatus && <ScanStatus {...scanStatus} />}
          </CardContent>
        </Card>

        {/* ─── INFO AGENT ────────────────────────────────────────────────── */}
        {agent && !collecte && (
          <Card style={{ background: "#faf5ff", border: "1px solid #e9d5ff", marginBottom: "16px", borderRadius: "12px" }}>
            <CardContent className="p-4">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <FaBuilding color="#7c3aed" size={16} />
                <span style={{ fontWeight: 600, color: "#7c3aed" }}>Scannez le code de la chambre</span>
                <span style={{ color: "#64748b" }}>pour commencer la collecte</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── LIT EN COURS ────────────────────────────────────────────── */}
        {litEnCours && etape === "SCAN" && (
          <Card style={{
            background: litEnCours.estInfecte ? "#fef2f2" : "#faf5ff",
            border: `2px solid ${litEnCours.estInfecte ? "#fca5a5" : "#c4b5fd"}`,
            marginBottom: "16px",
            borderRadius: "12px"
          }}>
            <CardContent className="p-4">
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "10px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <FaBed size={20} color={litEnCours.estInfecte ? "#dc2626" : "#7c3aed"} />
                  <div>
                    <div style={{
                      fontWeight: 700,
                      fontSize: "14px",
                      color: litEnCours.estInfecte ? "#dc2626" : "#7c3aed"
                    }}>
                      Lit {litEnCours.codeLit}
                      {litEnCours.estInfecte && " — ⚠️ Bac ROUGE"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      Scanner le bac de destination
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setLitEnCours(null)}
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
            </CardContent>
          </Card>
        )}

        {/* ─── STATUTS ───────────────────────────────────────────────────── */}
        {etape === "SCAN" && collecte && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "12px",
            marginBottom: "20px"
          }}>
            <StatutCard
              label="Total"
              value={totalLits}
              icon="📊"
              color="#0ea5e9"
              bg="#f0f9ff"
            />
            <StatutCard
              label="Blancs"
              value={nbBlancs}
              icon="✅"
              color="#15803d"
              bg="#f0fdf4"
            />
            <StatutCard
              label="Infectés"
              value={nbInfectes}
              icon="🔴"
              color="#dc2626"
              bg="#fef2f2"
            />
            <StatutCard
              label="Restants"
              value={nonTraites}
              icon="⏳"
              color="#f59e0b"
              bg="#fffbeb"
            />
          </div>
        )}

        {/* ─── LISTE DES LITS ───────────────────────────────────────────── */}
        {etape === "SCAN" && collecte && (
          <div style={{ marginTop: "4px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
            <div style={{
              fontWeight: 600,
              fontSize: "13px",
              color: "#64748b",
              marginBottom: "8px",
              display: "flex",
              justifyContent: "space-between"
            }}>
              <span>🛏️ Lits ({totalLits})</span>
              <span style={{ color: "#7c3aed" }}>{traites} traités</span>
            </div>
            <div style={{ maxHeight: "250px", overflowY: "auto" }}>
              {collecte.lits.map(lit => (
                <CarteLit
                  key={lit.litId}
                  lit={lit}
                  onPropre={handlePropre}
                  onManquant={l => setDlgManq(l)}
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