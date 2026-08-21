import React, { useState, useCallback, useRef, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import {
  FaBoxes, FaUser, FaCheckCircle, FaTimes, FaSpinner,
  FaHistory, FaExclamationTriangle, FaTshirt, FaChartLine,
  FaCheckDouble, FaClock
} from "react-icons/fa";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import ScanInput from "../../components/utils/shared/ScanInput";
import EtapesStepper from "../../components/utils/shared/EtapesStepper";
import { getAgent, isAgentConnected } from "../../services/agentService";
import "../Linge/WorkflowList.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

function ProgressionBar({ value, label }) {
  const pct = Math.min(Math.max(value, 0), 100);
  const isComplete = pct === 100;

  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
        <span style={{ fontWeight: 500, color: "#64748b" }}>{label}</span>
        <span style={{ fontWeight: 700, color: "#0f172a" }}>{pct}%</span>
      </div>
      <div style={{ height: "8px", borderRadius: "6px", background: "#f1f5f9", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            borderRadius: "6px",
            background: isComplete ? "linear-gradient(90deg, #10b981, #059669)" : "linear-gradient(90deg, #14b8a6, #0d9488)",
            width: `${pct}%`,
            transition: "width 0.5s ease-in-out"
          }}
        />
      </div>
      {isComplete && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", fontSize: "11px", color: "#059669", fontWeight: 600 }}>
          <FaCheckCircle size={12} /> Collecte terminée
        </div>
      )}
    </div>
  );
}

// ─── COMPOSANT : Carte de statut ──────────────────────────────────────────
function StatutCard({ label, value, icon, color, bg, subValue }) {
  return (
    <div style={{
      padding: "16px 18px",
      borderRadius: "14px",
      background: bg,
      border: `1px solid ${color}25`,
      flex: 1,
      minWidth: "120px",
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

// ─── COMPOSANT : Détail catégorie ─────────────────────────────────────────
function CategorieRow({ categorie, collecte, livre, reste }) {
  const isComplete = reste === 0 && collecte > 0;
  const pct = collecte > 0 ? Math.round((livre / collecte) * 100) : 0;

  return (
    <div style={{
      padding: "12px 16px",
      borderRadius: "10px",
      background: isComplete ? "#f0fdf4" : "white",
      border: `1px solid ${isComplete ? "#bbf7d0" : "#e2e8f0"}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "8px",
      transition: "all 0.2s ease"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
        <span style={{ fontSize: "20px" }}>{categorie.emoji || '👕'}</span>
        <span style={{ fontWeight: 600, color: "#0f172a", fontSize: "14px" }}>{categorie.label || categorie}</span>
        {isComplete ? (
          <Badge style={{ background: "#dcfce7", color: "#15803d", fontSize: "9px", padding: "2px 10px", borderRadius: "12px" }}>
            ✓ Complète
          </Badge>
        ) : (
          <Badge style={{ background: "#f1f5f9", color: "#64748b", fontSize: "9px", padding: "2px 10px", borderRadius: "12px" }}>
            {pct}%
          </Badge>
        )}
      </div>
      <div style={{ display: "flex", gap: "20px", fontSize: "13px", alignItems: "center" }}>
        <span style={{ color: "#64748b" }}>
          <span style={{ fontWeight: 600, color: "#0f172a" }}>{collecte}</span>
        </span>
        <span style={{ color: "#059669", fontWeight: 600 }}>
          <FaCheckCircle size={12} style={{ display: "inline", marginRight: "4px" }} />
          {livre}
        </span>
        {reste > 0 && (
          <span style={{ color: "#d97706", fontWeight: 600 }}>
            <FaClock size={12} style={{ display: "inline", marginRight: "4px" }} />
            {reste}
          </span>
        )}
        {reste === 0 && collecte > 0 && (
          <span style={{ color: "#059669", fontWeight: 600 }}>✓</span>
        )}
      </div>
    </div>
  );
}

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
          <p style={{ fontWeight: 600, color: "#15803d", fontSize: "14px", margin: 0 }}>✓ Linge livré avec succès</p>
          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
            <strong>{success.codeBarre}</strong> · {success.categorie}
          </p>
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

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────
export default function RemiseLinge() {
  const navigate = useNavigate();

  // États principaux
  const [etape, setEtape] = useState("AGENT_REMISE");
  const [agentRemise, setAgentRemise] = useState(null);
  const [agentCollecte, setAgentCollecte] = useState(null);
  const [remise, setRemise] = useState(null);
  const [collecteId, setCollecteId] = useState(null);
  const [statut, setStatut] = useState(null);
  const [remises, setRemises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanValue, setScanValue] = useState("");
  const [scanStatus, setScanStatus] = useState(null);
  const [historiqueOuvert, setHistoriqueOuvert] = useState(false);

  const scanInputRef = useRef(null);

  // ✅ Récupérer l'agent depuis localStorage au chargement
  useEffect(() => {
    const agentData = getAgent();
    if (agentData && isAgentConnected()) {
      // Si l'agent est déjà connecté, on peut le définir comme agent de remise
      setAgentRemise(agentData);
      setEtape("AGENT_COLLECTE");
      showAlert("Agent chargé", `✅ ${agentData.nom} (${agentData.matricule})`, "success", 1500);
    }
  }, []);

  // ─── Alerte SweetAlert ──────────────────────────────────────────────────
  const showAlert = useCallback((title, text, icon = "info", timer = null) => {
    return Swal.fire({
      title,
      text,
      icon,
      timer,
      timerProgressBar: true,
      showConfirmButton: !!timer,
      confirmButtonColor: "#0d9488",
      confirmButtonText: "OK",
      ...(timer ? { showConfirmButton: false } : {})
    });
  }, []);

  // ─── Scan Agent Remise ──────────────────────────────────────────────────
  const scanAgentRemise = useCallback(async (code) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/agents/matricule/${code}`);
      if (res.ok) {
        const ag = await res.json();
        setAgentRemise(ag);
        setEtape("AGENT_COLLECTE");
        await showAlert("Agent identifié", `✅ ${ag.nom} (${ag.matricule})`, "success", 1500);
        setTimeout(() => scanInputRef.current?.focus(), 200);
        return true;
      }
      await showAlert("Agent introuvable", `❌ L'agent [${code}] n'existe pas.`, "error");
      return false;
    } catch {
      await showAlert("Erreur réseau", "Veuillez vérifier votre connexion.", "error");
      return false;
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  // ─── Scan Agent Collecte et création remise ─────────────────────────────
  const scanAgentCollecte = useCallback(async (code) => {
    setLoading(true);
    try {
      // Vérifier l'agent de collecte
      const res = await fetch(`${API_URL}/api/agents/matricule/${code}`);
      if (!res.ok) {
        await showAlert("Agent introuvable", `❌ L'agent [${code}] n'existe pas.`, "error");
        return false;
      }
      const ag = await res.json();
      setAgentCollecte(ag);

      // Créer la remise avec les paramètres en query params
      const createRes = await fetch(
        `${API_URL}/api/remises-linge?matriculeAgentRemise=${agentRemise.matricule}&matriculeAgentCollecte=${ag.matricule}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        }
      );

      if (!createRes.ok) {
        const txt = await createRes.text();
        let msg = txt;
        try { 
          const json = JSON.parse(txt);
          msg = json.message || json.error || txt;
        } catch {}
        
        // Aucune collecte disponible → simple avertissement
        if (msg.includes("Aucune collecte") || msg.includes("non clôturée")) {
          await showAlert(
            "Aucune collecte disponible",
            `L'agent ${ag.nom} n'a pas de collecte non clôturée.`,
            "info"
          );
          setAgentCollecte(null);
          setEtape("AGENT_COLLECTE");
          setTimeout(() => scanInputRef.current?.focus(), 200);
          return false;
        }
        await showAlert("❌ Erreur", msg, "error");
        return false;
      }

      const data = await createRes.json();
      setRemise(data);
      setCollecteId(data.collecte?.id);

      await chargerStatut(data.collecte?.id);
      await chargerHistorique(data.collecte?.id);

      setEtape("SCAN");
      await showAlert(
        "✅ Remise créée",
        `Remise ${data.numeroLivraison} · ${data.collecte?.numeroCollecte}`,
        "success",
        2000
      );

      setTimeout(() => scanInputRef.current?.focus(), 200);
      return true;

    } catch (err) {
      await showAlert("❌ Erreur", err.message || "Erreur lors de la création", "error");
      return false;
    } finally {
      setLoading(false);
    }
  }, [agentRemise, showAlert]);

  // ─── Charger le statut de la collecte ───────────────────────────────────
  const chargerStatut = useCallback(async (id) => {
    if (!id) return;
    try {
      const res = await fetch(`${API_URL}/api/remises-linge/collecte/${id}/statut`);
      if (res.ok) {
        const data = await res.json();
        setStatut(data);
        return data;
      }
    } catch (err) {
      console.error("Erreur chargement statut:", err);
    }
    return null;
  }, []);

  // ─── Charger l'historique des remises ──────────────────────────────────
  const chargerHistorique = useCallback(async (id) => {
    if (!id) return;
    try {
      const res = await fetch(`${API_URL}/api/remises-linge/collecte/${id}`);
      if (res.ok) {
        const data = await res.json();
        setRemises(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Erreur chargement historique:", err);
    }
  }, []);

  // ─── Scanner un linge ────────────────────────────────────────────────────
  const handleScan = useCallback(async (code) => {
    if (!code?.trim() || !remise?.id || !collecteId) {
      setScanValue("");
      return;
    }

    if (statut?.statut === "CLOTUREE" || statut?.totalRestant === 0) {
      await showAlert("Collecte terminée", "Cette collecte est déjà clôturée.", "info");
      setScanValue("");
      return;
    }

    setScanValue("");
    setScanStatus({ loading: true, code: code.trim() });

    try {
      const res = await fetch(
        `${API_URL}/api/remises-linge/${remise.id}/scanner?codeBarre=${encodeURIComponent(code.trim())}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        }
      );

      if (!res.ok) {
        const txt = await res.text();
        let msg = txt;
        try { 
          const json = JSON.parse(txt);
          msg = json.message || json.error || txt;
        } catch {}
        throw new Error(msg);
      }

      const data = await res.json();

      setScanStatus({
        loading: false,
        success: { 
          codeBarre: code.trim(), 
          categorie: data.categorie,
          quantiteRemise: data.quantiteRemise,
          quantiteRestante: data.quantiteRestante
        },
        error: null,
      });

      if (data.remise) {
        setRemise(data.remise);
      }

      // Recharger le statut après chaque scan réussi
      const nouveauStatut = await chargerStatut(collecteId);
      await chargerHistorique(collecteId);

      if (nouveauStatut?.statut === "CLOTUREE" || nouveauStatut?.totalRestant === 0) {
        await Swal.fire({
          title: "✅ Collecte terminée !",
          text: "Tous les linges ont été livrés.",
          icon: "success",
          timer: 2500,
          timerProgressBar: true,
          showConfirmButton: false,
          confirmButtonColor: "#0d9488"
        });
      }

      setTimeout(() => {
        setScanStatus(null);
      }, 2000);

    } catch (err) {
      setScanStatus({
        loading: false,
        success: null,
        error: err.message || "Erreur lors du scan",
      });

      setTimeout(() => {
        setScanStatus(null);
      }, 3000);
    }

    setTimeout(() => scanInputRef.current?.focus(), 100);
  }, [remise, collecteId, statut, chargerStatut, chargerHistorique, showAlert]);

  // ─── Déconnecter ─────────────────────────────────────────────────────────
  const resetAll = useCallback(() => {
    setAgentRemise(null);
    setAgentCollecte(null);
    setRemise(null);
    setCollecteId(null);
    setStatut(null);
    setRemises([]);
    setScanValue("");
    setScanStatus(null);
    setEtape("AGENT_REMISE");
    setTimeout(() => scanInputRef.current?.focus(), 200);
  }, []);

  // ─── Rafraîchir ──────────────────────────────────────────────────────────
  const rafraichir = useCallback(async () => {
    if (collecteId) {
      await chargerStatut(collecteId);
      await chargerHistorique(collecteId);
      await showAlert("✅ Actualisé", "Les données ont été mises à jour.", "success", 1000);
    }
  }, [collecteId, chargerStatut, chargerHistorique, showAlert]);

  // ─── RENDU ──────────────────────────────────────────────────────────────

  const ETAPES = [
    { id: "AGENT_REMISE", label: "Agent remise", done: !!agentRemise },
    { id: "AGENT_COLLECTE", label: "Agent collecte", done: !!agentCollecte },
    { id: "SCAN", label: "Scan", done: statut?.statut === "CLOTUREE" },
  ];

  const getPlaceholder = () => {
    if (!agentRemise) return "👤 Scanner badge agent de remise...";
    if (!agentCollecte) return "👤 Scanner badge agent de collecte...";
    if (statut?.statut === "CLOTUREE") return "🔒 Collecte terminée";
    return "📦 Scanner le code-barres du linge...";
  };

  const isCloturee = statut?.statut === "CLOTUREE" || statut?.totalRestant === 0;

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
            background: "linear-gradient(135deg, #14b8a6, #0d9488)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            boxShadow: "0 6px 20px rgba(20, 184, 166, 0.3)"
          }}>
            <FaBoxes size={26} />
          </div>
          <div>
            <h1 style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#0f172a",
              margin: 0
            }}>
              Remise de linge
            </h1>
            <p style={{
              fontSize: "14px",
              color: "#64748b",
              margin: "2px 0 0 0"
            }}>
              {agentRemise ? `Agent: ${agentRemise.nom}` : "Aucun agent connecté"}
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
            {agentRemise && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 18px",
                background: "#f0fdf4",
                borderRadius: "12px",
                border: "1px solid #bbf7d0"
              }}>
                <FaCheckCircle color="#22c55e" size={16} />
                <span style={{ fontWeight: 700, color: "#15803d", fontSize: "14px" }}>{agentRemise.nom}</span>
                <Badge style={{ background: "#dcfce7", color: "#15803d", fontSize: "10px", padding: "2px 10px", borderRadius: "12px" }}>
                  {agentRemise.matricule}
                </Badge>
              </div>
            )}
            {agentCollecte && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 18px",
                background: "#eff6ff",
                borderRadius: "12px",
                border: "1px solid #93c5fd"
              }}>
                <FaUser color="#3b82f6" size={16} />
                <span style={{ fontWeight: 700, color: "#1d4ed8", fontSize: "14px" }}>{agentCollecte.nom}</span>
                <Badge style={{ background: "#dbeafe", color: "#1d4ed8", fontSize: "10px", padding: "2px 10px", borderRadius: "12px" }}>
                  {agentCollecte.matricule}
                </Badge>
              </div>
            )}
            {remise && (
              <Badge style={{ background: "#f1f5f9", color: "#64748b", fontSize: "11px", padding: "4px 14px", borderRadius: "12px" }}>
                Remise {remise.numeroLivraison}
              </Badge>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {etape === "SCAN" && (
              <Button
                variant="outline"
                size="sm"
                onClick={rafraichir}
                style={{ 
                  fontSize: "12px", 
                  gap: "6px",
                  borderColor: "#e2e8f0",
                  color: "#64748b",
                  borderRadius: "10px",
                  padding: "6px 14px"
                }}
              >
                <FaSpinner className={loading ? 'animate-spin' : ''} size={10} />
                Rafraîchir
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={resetAll}
              style={{
                fontSize: "12px",
                gap: "6px",
                borderColor: "#fca5a5",
                color: "#dc2626",
                borderRadius: "10px",
                padding: "6px 14px"
              }}
            >
              <FaTimes size={10} />
              Reset
            </Button>
          </div>
        </div>

        {/* ─── ZONE DE SCAN ────────────────────────────────────────────── */}
        <Card style={{
          marginBottom: "20px",
          border: `2px dashed ${!agentRemise || (etape === "AGENT_COLLECTE" && !agentCollecte) ? "#dc2626" : isCloturee ? "#e2e8f0" : "#0ea5e9"}`,
          background: isCloturee ? "#f8fafc" : "white",
          borderRadius: "16px"
        }}>
          <CardContent className="p-5">
            <ScanInput
              ref={scanInputRef}
              placeholder={getPlaceholder()}
              value={scanValue}
              onChange={setScanValue}
              onSubmit={(code) => {
                if (!agentRemise) {
                  scanAgentRemise(code);
                } else if (!agentCollecte) {
                  scanAgentCollecte(code);
                } else {
                  handleScan(code);
                }
              }}
              borderColor={!agentRemise || (etape === "AGENT_COLLECTE" && !agentCollecte) ? "#dc2626" : isCloturee ? "#e2e8f0" : "#0ea5e9"}
              keepFocus={true}
              autoDebounce={true}
              disabled={isCloturee || loading || !agentRemise}
            />
            {scanStatus && <ScanStatus {...scanStatus} />}
          </CardContent>
        </Card>

        {/* ─── INFO AGENT ────────────────────────────────────────────────── */}

        {!agentRemise && (
          <Card style={{ background: "#fef2f2", border: "1px solid #fca5a5", marginBottom: "16px", borderRadius: "12px" }}>
            <CardContent className="p-4">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <FaExclamationTriangle color="#dc2626" size={16} />
                <span style={{ fontWeight: 600, color: "#dc2626" }}>Aucun agent connecté</span>
                <span style={{ color: "#64748b" }}>Veuillez vous connecter pour effectuer une remise</span>
              </div>
            </CardContent>
          </Card>
        )}

        {agentRemise && !agentCollecte && (
          <Card style={{ background: "#eff6ff", border: "1px solid #93c5fd", marginBottom: "16px", borderRadius: "12px" }}>
            <CardContent className="p-4">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <FaUser color="#3b82f6" size={16} />
                <span style={{ fontWeight: 600, color: "#1d4ed8" }}>Scannez l'agent de collecte</span>
                <span style={{ color: "#64748b" }}>pour créer la remise</span>
              </div>
            </CardContent>
          </Card>
        )}

        {agentRemise && agentCollecte && !isCloturee && (
          <Card style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", marginBottom: "16px", borderRadius: "12px" }}>
            <CardContent className="p-4">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <FaCheckCircle color="#22c55e" size={16} />
                <span style={{ fontWeight: 600, color: "#15803d" }}>Prêt à livrer</span>
                <span style={{ color: "#64748b" }}>Scannez les linges à remettre</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── TABLEAU DE BORD ──────────────────────────────────────────── */}
        {etape === "SCAN" && (
          <>
            {/* ─── BANNIÈRE CLÔTURE ─────────────────────────────────────── */}
            {isCloturee && (
              <div style={{
                padding: "20px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                border: "2px solid #86efac",
                textAlign: "center",
                marginBottom: "20px"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px" }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "#dcfce7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <FaCheckDouble color="#22c55e" size={24} />
                  </div>
                  <div>
                    <p style={{ fontSize: "20px", fontWeight: 700, color: "#15803d", margin: 0 }}>✓ COLLECTE TERMINÉE</p>
                    <p style={{ fontSize: "14px", color: "#059669", margin: 0 }}>
                      {statut?.totalLivre || 0} / {statut?.totalCollecte || 0} linges livrés · 100%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ─── STATUTS ───────────────────────────────────────────────── */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "14px",
              marginBottom: "20px"
            }}>
              <StatutCard
                label="Total collecté"
                value={statut?.totalCollecte || 0}
                icon="📦"
                color="#0ea5e9"
                bg="#f0f9ff"
                subValue="Linges dans la collecte"
              />
              <StatutCard
                label="Total livré"
                value={statut?.totalLivre || 0}
                icon="✅"
                color="#059669"
                bg="#f0fdf4"
                subValue={`${statut?.pourcentage || 0}% du total`}
              />
              <StatutCard
                label="Reste à livrer"
                value={statut?.totalRestant || 0}
                icon="⏳"
                color={statut?.totalRestant === 0 ? "#059669" : "#d97706"}
                bg={statut?.totalRestant === 0 ? "#f0fdf4" : "#fffbeb"}
                subValue={statut?.totalRestant === 0 ? "✓ Terminé" : "En attente"}
              />
              <StatutCard
                label="Statut"
                value={statut?.statut || '—'}
                icon={statut?.statut === "CLOTUREE" ? "🏁" : "🔄"}
                color={statut?.statut === "CLOTUREE" ? "#059669" : "#0ea5e9"}
                bg={statut?.statut === "CLOTUREE" ? "#f0fdf4" : "#f0f9ff"}
                subValue={statut?.statut === "CLOTUREE" ? "Collecte clôturée" : "En cours"}
              />
            </div>

            {/* ─── BARRE DE PROGRESSION ────────────────────────────────── */}
            <ProgressionBar
              value={statut?.pourcentage || 0}
              label="Progression de la collecte"
            />

            {/* ─── DÉTAIL PAR CATÉGORIE ────────────────────────────────── */}
            {statut?.categories && statut.categories.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "14px"
                }}>
                  <FaTshirt size={16} color="#64748b" />
                  <h3 style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#0f172a",
                    margin: 0
                  }}>
                    Détail par catégorie
                  </h3>
                  <Badge style={{ background: "#f1f5f9", color: "#64748b", fontSize: "10px", padding: "2px 10px", borderRadius: "12px" }}>
                    {statut.categories.length} catégories
                  </Badge>
                </div>
                <div>
                  {statut.categories.map((cat, i) => {
                    const categorieInfo = {
                      label: cat.categorie,
                      emoji: cat.categorie === 'DRAP' ? '🛏️' :
                             cat.categorie === 'BLOUSE' ? '👔' :
                             cat.categorie === 'PANTALON' ? '👖' :
                             cat.categorie === 'SERVIETTE' ? '🧻' :
                             cat.categorie === 'TAIE' ? '🛌' : '👕'
                    };
                    return (
                      <CategorieRow
                        key={i}
                        categorie={categorieInfo}
                        collecte={cat.quantiteCollectee}
                        livre={cat.quantiteLivree}
                        reste={cat.quantiteRestante}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── HISTORIQUE ───────────────────────────────────────────── */}
            <div>
              <button
                onClick={() => setHistoriqueOuvert(!historiqueOuvert)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#64748b",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "10px 0",
                  width: "100%",
                  borderTop: "1px solid #f1f5f9",
                  marginTop: "8px"
                }}
              >
                <FaHistory size={14} />
                {historiqueOuvert ? 'Masquer' : 'Afficher'} l'historique des remises
                <Badge style={{ 
                  background: "#f1f5f9", 
                  color: "#64748b", 
                  fontSize: "10px", 
                  padding: "2px 10px", 
                  borderRadius: "12px",
                  marginLeft: "auto"
                }}>
                  {remises.length}
                </Badge>
              </button>

              {historiqueOuvert && (
                <div style={{
                  padding: "16px",
                  borderRadius: "12px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  marginTop: "8px"
                }}>
                  {remises.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "13px" }}>
                      Aucune remise pour cette collecte
                    </div>
                  ) : (
                    <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                      {remises.map((r, i) => {
                        const statutConfig = {
                          COMPLETEE: { bg: "#f0fdf4", text: "#15803d", icon: "✅" },
                          PARTIELLE: { bg: "#fffbeb", text: "#d97706", icon: "⏳" },
                          EN_COURS: { bg: "#eff6ff", text: "#1d4ed8", icon: "🔄" },
                        }[r.etat] || { bg: "#f1f5f9", text: "#64748b", icon: "📦" };

                        return (
                          <div key={i} style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "12px 16px",
                            borderRadius: "10px",
                            background: r.etat === "COMPLETEE" ? "#f0fdf4" : "white",
                            border: `1px solid ${r.etat === "COMPLETEE" ? "#bbf7d0" : "#e2e8f0"}`,
                            marginBottom: "6px"
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <span style={{ fontFamily: "monospace", fontWeight: 600, fontSize: "13px", color: "#0f172a" }}>
                                {r.numeroLivraison || r.id}
                              </span>
                              <Badge style={{
                                background: statutConfig.bg,
                                color: statutConfig.text,
                                fontSize: "10px",
                                padding: "2px 12px",
                                borderRadius: "12px"
                              }}>
                                {statutConfig.icon} {r.etat || '—'}
                              </Badge>
                            </div>
                            <div style={{ display: "flex", gap: "16px", fontSize: "11px", color: "#94a3b8" }}>
                              <span>{r.agentRemiseNom || 'Agent'}</span>
                              <span>{r.dateRemise ? new Date(r.dateRemise).toLocaleDateString('fr-FR') : '—'}</span>
                              <span style={{ fontWeight: 600, color: "#0f172a" }}>{r.nbLinges || 0} linges</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}