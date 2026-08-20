import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  FaUser, FaRedo, FaSpinner, FaCheckDouble,
  FaCheck, FaUserTie, FaCheckCircle, FaExclamationTriangle,
  FaBoxes, FaIdBadge
} from "react-icons/fa";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import ScanInput from "../../components/utils/shared/ScanInput";
import { cat, apiCall } from "../collage/collecteUtils";
import Swal from "sweetalert2";
import "../Linge/WorkflowList.css";

// ─── Variables d'environnement ──────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

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

// ─── CarteUniforme ──────────────────────────────────────────────────────────
function CarteUniforme({ linge, onRetirer, personnelNom }) {
  const c = cat(linge.categorie);
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
        <FaCheck size={8} /> Retirer
      </button>
    </div>
  );
}

// ─── CarteUniformeDispo ──────────────────────────────────────────────────────
function CarteUniformeDispo({ linge, onDistribuer, personnelNom }) {
  const c = cat(linge.categorie);
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
        onClick={() => onDistribuer(linge)}
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
        <FaCheck size={8} /> Distribuer
      </button>
    </div>
  );
}

// ─── ResumeUniforme ──────────────────────────────────────────────────────────
function ResumeUniforme({ res, onNouvelle, onTerminer }) {
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
        Uniformes distribués
      </div>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
        {res.nbDistribues} uniforme{res.nbDistribues > 1 ? "s" : ""} pour {res.personnelNom}
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: 8,
        marginBottom: 22
      }}>
        {res.uniformes?.map((u, i) => {
          const c = cat(u.categorie);
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
          Autre personnel
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

export default function DistributionUniforme() {
  const [etape, setEtape] = useState("AGENT");
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

  useEffect(() => { agentRef.current = agent; }, [agent]);
  useEffect(() => { personnelRef.current = personnel; }, [personnel]);

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
      const res = await fetch(`${API_URL}/api/agents/matricule/${code}`);
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // ─── Clôturer la distribution (sans confirmation) ──────────────────────
  const cloturerDistribution = useCallback(async () => {
    if (distribues.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: '⚠️ Aucun uniforme distribué',
        text: 'Distribuez au moins un uniforme avant de terminer.',
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
    setScanStatus({
      loading: false,
      success: { message: "✅ Distribution terminée", detail: `${distribues.length} uniforme(s) distribué(s)` },
      error: null
    });
    setTimeout(() => setScanStatus(null), 2000);
    return true;
  }, [distribues, personnel]);

  // ─── Scan Agent ──────────────────────────────────────────────────────────
  const handleAgent = useCallback(async code => {
    setLoading(true);
    setScanStatus({ loading: true, code });
    try {
      const ag = await fetch(`${API_URL}/api/agents/matricule/${code}`)
        .then(r => r.ok ? r.json() : null);
      if (!ag) {
        setScanStatus({ loading: false, success: null, error: "Agent introuvable" });
        await Swal.fire({
          icon: 'error',
          title: '❌ Agent introuvable',
          text: code,
          timer: 1500,
          showConfirmButton: false
        });
        return;
      }
      setAgent({ nom: ag.nom, matricule: ag.matricule });
      setEtape("PERSONNEL");
      setScanStatus({
        loading: false,
        success: { message: "Agent identifié", detail: `${ag.nom} (${ag.matricule})` },
        error: null
      });
      setTimeout(() => setScanStatus(null), 2000);
      await Swal.fire({
        icon: 'success',
        title: 'Agent identifié',
        text: ag.nom,
        timer: 1500,
        showConfirmButton: false
      });
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      await Swal.fire({
        icon: 'error',
        title: 'Erreur réseau',
        text: e.message
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Scan Personnel ──────────────────────────────────────────────────────
  const handlePersonnel = useCallback(async code => {
    setLoading(true);
    setScanStatus({ loading: true, code });
    try {
      const res = await fetch(
        `${API_URL}/api/distribution/uniforme?codeBadge=${encodeURIComponent(code)}&matriculeAgent=${agentRef.current.matricule}`
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Personnel introuvable");
      }
      const data = await res.json();
      setPersonnel({
        id: data.personnelId,
        nom: data.personnelNom,
        fonction: data.personnelFonction
      });
      setEnPossession(data.enPossession || []);
      setDisponibles(data.disponibles || []);
      setDistribues([]);
      setEtape("DISTRIBUER");
      setScanStatus({
        loading: false,
        success: { message: `✅ ${data.personnelNom}`, detail: `${data.nbDisponibles} uniforme(s) disponible(s)` },
        error: null
      });
      setTimeout(() => setScanStatus(null), 2000);
      await Swal.fire({
        icon: 'success',
        title: `✅ ${data.personnelNom}`,
        text: `${data.nbDisponibles} uniforme(s) disponible(s) · ${data.nbEnPossession} en possession`,
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
  }, []);

  // ─── Scan Uniforme ──────────────────────────────────────────────────────
  const handleScanUniforme = useCallback(async code => {
    if (!personnel) {
      await Swal.fire({
        icon: 'warning',
        title: 'Scannez d\'abord un badge personnel',
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }
    setLoading(true);
    setScanStatus({ loading: true, code });
    try {
      const res = await fetch(
        `${API_URL}/api/distribution/uniforme?porteurId=${personnel.id}&porteurNom=${encodeURIComponent(personnel.nom)}&codeOuTag=${encodeURIComponent(code)}&matriculeAgent=${agentRef.current.matricule}`,
        { method: "POST" }
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Erreur lors de la distribution");
      }
      const data = await res.json();

      setDisponibles(prev => prev.filter(l => l.lingeId !== data.lingeId));
      setEnPossession(prev => [...prev, data]);
      setDistribues(prev => [...prev, data]);

      setScanStatus({
        loading: false,
        success: { message: "✓ Uniforme distribué", detail: data.codeBarre },
        error: null
      });
      setTimeout(() => setScanStatus(null), 1500);
      await Swal.fire({
        icon: 'success',
        title: '✓ Uniforme distribué',
        text: data.codeBarre,
        timer: 1000,
        showConfirmButton: false
      });
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
  }, [personnel]);

  // ─── Retirer un uniforme ──────────────────────────────────────────────
  const handleRetirer = useCallback(async (linge) => {
    setEnPossession(prev => prev.filter(l => l.lingeId !== linge.lingeId));
    setDisponibles(prev => [...prev, linge]);
    setDistribues(prev => prev.filter(l => l.lingeId !== linge.lingeId));

    await Swal.fire({
      icon: 'info',
      title: 'Uniforme retiré',
      text: linge.codeBarre,
      timer: 1000,
      showConfirmButton: false
    });
  }, []);

  // ─── Gestion scan ──────────────────────────────────────────────────────
  const handleScan = useCallback(async code => {
    if (!code || loading) return;
    setScanVal("");

    if (etape === "AGENT") {
      await handleAgent(code);
      return;
    }

    if (etape === "PERSONNEL") {
      await handlePersonnel(code);
      return;
    }

    if (etape === "DISTRIBUER") {
      const agentTrouve = await verifierSiAgent(code);
      if (agentTrouve) {
        // Clôture automatique sans confirmation
        await cloturerDistribution();
      } else {
        await handleScanUniforme(code);
      }
      return;
    }
  }, [etape, loading, handleAgent, handlePersonnel, handleScanUniforme, verifierSiAgent, cloturerDistribution]);

  // ─── Reset ──────────────────────────────────────────────────────────────
  const reset = useCallback(async () => {
    if (etape !== "AGENT" && etape !== "RESUME") {
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
    setPersonnel(null);
    setEnPossession([]);
    setDisponibles([]);
    setDistribues([]);
    setResume(null);
    setEtape("AGENT");
    setScanVal("");
    setScanStatus(null);
  }, [etape]);

  // ─── Helpers ──────────────────────────────────────────────────────────
  const getPlaceholder = () => {
    if (etape === "AGENT") return "👤 Scanner votre badge agent...";
    if (etape === "PERSONNEL") return "👔 Scanner le badge du personnel...";
    if (etape === "RESUME") return "✅ Distribution terminée";
    return "👕 Scanner un uniforme à distribuer...";
  };

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
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            boxShadow: "0 6px 20px rgba(124, 58, 237, 0.3)"
          }}>
            <FaUserTie size={26} />
          </div>
          <div>
            <h1 style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#0f172a",
              margin: 0
            }}>
              Distribution — Uniformes
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
            {etape !== "AGENT" && etape !== "RESUME" && (
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

        {/* ─── ZONE DE SCAN ────────────────────────────────────────────── */}
        <Card style={{
          marginBottom: "20px",
          border: `2px dashed ${isCloturee ? "#e2e8f0" : etape === "PERSONNEL" ? "#15803d" : etape === "DISTRIBUER" ? "#7c3aed" : "#e2e8f0"}`,
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
              borderColor={isCloturee ? "#e2e8f0" : etape === "PERSONNEL" ? "#15803d" : etape === "DISTRIBUER" ? "#7c3aed" : "#e2e8f0"}
              keepFocus={true}
              autoDebounce={true}
              disabled={isCloturee || loading}
            />
            {scanStatus && <ScanStatus {...scanStatus} />}
          </CardContent>
        </Card>

        {/* ─── INDICATEUR SCAN AGENT ────────────────────────────────────── */}
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
            <span>💡 Scanner votre badge agent pour clôturer la distribution</span>
          </div>
        )}

        {/* ─── ÉTAPES VIDE ───────────────────────────────────────────────── */}
        {etape === "AGENT" && (
          <Card style={{ background: "#faf5ff", border: "1px solid #e9d5ff", marginBottom: "16px", borderRadius: "12px" }}>
            <CardContent className="p-4">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <FaUser color="#7c3aed" size={16} />
                <span style={{ fontWeight: 600, color: "#7c3aed" }}>Scannez votre badge agent</span>
                <span style={{ color: "#64748b" }}>pour commencer la distribution</span>
              </div>
            </CardContent>
          </Card>
        )}

        {etape === "PERSONNEL" && (
          <Card style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", marginBottom: "16px", borderRadius: "12px" }}>
            <CardContent className="p-4">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <FaIdBadge color="#15803d" size={16} />
                <span style={{ fontWeight: 600, color: "#15803d" }}>Scannez le badge du personnel</span>
                <span style={{ color: "#64748b" }}>pour voir ses uniformes</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── STATUTS ────────────────────────────────────────────────────── */}
        {etape === "DISTRIBUER" && personnel && !isCloturee && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "12px",
            marginBottom: "20px"
          }}>
            <StatutCard
              label="À distribuer"
              value={disponibles.length}
              icon="📦"
              color="#0ea5e9"
              bg="#f0f9ff"
            />
            <StatutCard
              label="En possession"
              value={enPossession.length}
              icon="✅"
              color="#15803d"
              bg="#f0fdf4"
            />
            <StatutCard
              label="Distribués"
              value={distribues.length}
              icon="🎯"
              color="#7c3aed"
              bg="#faf5ff"
            />
          </div>
        )}

        {/* ─── LISTES DES UNIFORMES ────────────────────────────────────── */}
        {etape === "DISTRIBUER" && personnel && !isCloturee && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "16px"
          }}>
            {/* Disponibles */}
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
                Disponibles
                <Badge style={{ background: "#ede9fe", color: "#7c3aed", fontSize: "10px" }}>
                  {disponibles.length}
                </Badge>
              </div>
              {disponibles.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "12px" }}>
                  Aucun uniforme disponible
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

            {/* En possession */}
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
                En possession
                <Badge style={{ background: "#dcfce7", color: "#15803d", fontSize: "10px" }}>
                  {enPossession.length}
                </Badge>
              </div>
              {enPossession.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "12px" }}>
                  Aucun uniforme en possession
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

        {/* ─── RÉSUMÉ ────────────────────────────────────────────────────── */}
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
            {personnel && <span>Personnel: <strong style={{ color: "#15803d" }}>{personnel.nom}</strong></span>}
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