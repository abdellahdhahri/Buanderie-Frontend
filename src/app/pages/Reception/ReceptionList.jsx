import { useState, useRef, useCallback, useEffect } from "react";
import React from "react";
import { User, CheckCircle, XCircle, RotateCcw, Package, ShieldAlert, Wifi, Eye } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { ReceptionProvider, useReception } from "../../contextes/ReceptionContext";
import ModeToggle from "../../components/utils/shared/ModeToggle";
import PanneauLinges from "../../components/utils/reception/PanneauLinges";
import Swal from "sweetalert2";

function ReceptionInner() {
  const {
    agent,
    bacsRecus = [],
    sacsInfectes = [],
    dernierRecu,
    bacEnCours,
    lingesAffichés = [],
    afficherLinges = false,
    loadingLinges = false,
    loading = false,
    scanAgent,
    deconnecterAgent,
    fetchLingesDuBac,
    fermerLinges,
    scanReception,
    passagePortique,
    reset,
  } = useReception();

  const [scanValue, setScanValue] = useState("");
  const [mode, setMode] = useState("BARCODE");
  const [rfidCodeBac, setRfidCodeBac] = useState("");
  const [rfidTags, setRfidTags] = useState("");
  const [rfidLoading, setRfidLoading] = useState(false);

  const scanInputRef = useRef(null);
  const rfidBacRef = useRef(null);
  const rfidTagsRef = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (mode !== "BARCODE") return;
    const keepFocus = () => {
      if (scanInputRef.current && !document.querySelector('[data-modal="true"]')) {
        scanInputRef.current.focus();
      }
    };
    const id = setInterval(keepFocus, 500);
    keepFocus();
    return () => clearInterval(id);
  }, [mode]);

  useEffect(() => {
    if (mode !== "BARCODE" || scanValue.trim().length < 3) return;
    const t = setTimeout(() => {
      const code = scanValue.trim();
      setScanValue("");

      if (!agent) {
        scanAgent(code);
      } else {
        scanReception(code);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [scanValue, mode, agent]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = scanValue.trim();
    if (!code) return;
    setScanValue("");

    if (!agent) {
      scanAgent(code);
    } else {
      scanReception(code);
    }
  };

  const handlePortique = async () => {
    const tags = rfidTags.split(/[\s,;\n]+/).map(t => t.trim()).filter(Boolean);
    setRfidLoading(true);
    await passagePortique(rfidCodeBac.trim(), tags);
    setRfidCodeBac("");
    setRfidTags("");
    setRfidLoading(false);
  };

  const handleReset = () => {
    setScanValue("");
    setRfidCodeBac("");
    setRfidTags("");
    reset();
    setTimeout(() => scanInputRef.current?.focus(), 100);
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Déconnecter ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#0ea5e9"
    }).then(r => {
      if (r.isConfirmed) {
        deconnecterAgent();
        handleReset();
      }
    });
  };

  const getPlaceholder = () => {
    if (!agent) return "👤 Scanner votre badge agent...";
    return "📦 Scanner un bac ou un sac infecté...";
  };

  return (
    <div className="collecte-container">
{/* ── Header ── */}
<div style={{ marginBottom: "32px" }}>
  <div style={{
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "8px"
  }}>
    <div style={{
      width: "52px",
      height: "52px",
      borderRadius: "16px",
      background: "linear-gradient(135deg, #10b981, #059669)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      boxShadow: "0 4px 16px rgba(16, 185, 129, 0.25)"
    }}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    </div>
    <div>
      <h1 style={{
        fontSize: "28px",
        fontWeight: 800,
        color: "#0f172a",
        margin: 0
      }}>
        Réception
      </h1>
      <p style={{
        fontSize: "14px",
        color: "#64748b",
        margin: "2px 0 0 0"
      }}>
        Réceptionnez les Bacs  et sacs
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

        {/* ── Barre d'info et actions ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ background: "#dbeafe", width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {agent ? <Package size={18} /> : <User size={18} />}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#1e3a8a", fontSize: "20px" }}>Réception automatique</div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                {agent
                  ? <span>Agent: <strong>{agent.nom || agent.matricule}</strong></span>
                  : "En attente de scan de l'agent"
                }
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <ModeToggle mode={mode} onChange={setMode} />
            {agent && (
              <button onClick={handleLogout} style={btnStyle}>
                <User size={14} /> Changer d'agent
              </button>
            )}
            <button onClick={handleReset} style={btnStyle}>
              <RotateCcw size={14} /> Réinitialiser
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        {agent && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "20px", padding: "16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <StatCard value={bacsRecus.length || 0} label="Bacs reçus" color="#0ea5e9" />
            <StatCard value={sacsInfectes.length || 0} label="Sacs infectés" color="#ef4444" />
            <StatCard value={dernierRecu ? (dernierRecu.type === "BAC" ? "Bac" : "Sac") : "-"} label="Dernier reçu" color="#8b5cf6" />
          </div>
        )}

        {/* ── Zone scan ── */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap", padding: "20px", background: "#f8fafc", borderRadius: "12px", border: agent ? "2px solid #22c55e" : "2px dashed #e2e8f0" }}>
          <div style={{ flex: 1, minWidth: "300px" }}>
            {mode === "BARCODE" ? (
              <form onSubmit={handleSubmit} style={{ margin: 0 }}>
                <div style={{ position: "relative", width: "100%" }}>
                  <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>
                    {!agent ? <User size={18} /> : <Package size={18} />}
                  </div>
                  <input
                    ref={scanInputRef}
                    type="text"
                    placeholder={getPlaceholder()}
                    value={scanValue}
                    onChange={e => setScanValue(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "16px 16px 16px 48px",
                      borderRadius: "10px",
                      border: `2px solid ${isFocused ? "#0ea5e9" : "#e2e8f0"}`,
                      fontSize: "16px",
                      background: loading ? "#f1f5f9" : "white",
                      transition: "all 0.2s",
                      outline: "none",
                      boxShadow: isFocused ? "0 0 0 3px rgba(14,165,233,0.1)" : "none",
                      cursor: loading ? "not-allowed" : "text",
                      boxSizing: "border-box"
                    }}
                    autoFocus
                  />
                  {scanValue && (
                    <button
                      type="button"
                      onClick={() => setScanValue("")}
                      style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "8px" }}
                    >
                      <XCircle size={16} />
                    </button>
                  )}
                </div>
              </form>
            ) : (
              /* ── Zone RFID ── */
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {!agent ? (
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="👤 Scanner badge agent..."
                      value={scanValue}
                      onChange={e => setScanValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && scanValue.trim()) {
                          scanAgent(scanValue.trim());
                          setScanValue("");
                        }
                      }}
                      ref={scanInputRef}
                      style={{
                        width: "100%",
                        padding: "16px 16px 16px 48px",
                        borderRadius: "10px",
                        border: "2px solid #e2e8f0",
                        fontSize: "16px",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "10px" }}>
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>
                        <Package size={16} />
                      </div>
                      <input
                        type="text"
                        placeholder="📦 Code bac"
                        value={rfidCodeBac}
                        onChange={e => setRfidCodeBac(e.target.value)}
                        ref={rfidBacRef}
                        style={{
                          width: "100%",
                          padding: "16px 16px 16px 40px",
                          borderRadius: "10px",
                          border: "2px solid #e2e8f0",
                          fontSize: "14px",
                          outline: "none",
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>
                        <Wifi size={16} />
                      </div>
                      <input
                        type="text"
                        placeholder="📡 Tags RFID (séparés par virgule)"
                        value={rfidTags}
                        onChange={e => setRfidTags(e.target.value)}
                        ref={rfidTagsRef}
                        onKeyDown={e => { if (e.key === "Enter") handlePortique(); }}
                        style={{
                          width: "100%",
                          padding: "16px 16px 16px 40px",
                          borderRadius: "10px",
                          border: "2px solid #e2e8f0",
                          fontSize: "14px",
                          outline: "none",
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                  </div>
                )}
                {agent && (
                  <button
                    onClick={handlePortique}
                    disabled={rfidLoading || !rfidCodeBac.trim() || !rfidTags.trim()}
                    style={{
                      padding: "12px 24px",
                      borderRadius: "10px",
                      border: "none",
                      background: rfidLoading || !rfidCodeBac.trim() || !rfidTags.trim()
                        ? "#e2e8f0"
                        : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                      color: rfidLoading || !rfidCodeBac.trim() || !rfidTags.trim()
                        ? "#94a3b8"
                        : "white",
                      fontWeight: 600,
                      fontSize: "14px",
                      cursor: rfidLoading || !rfidCodeBac.trim() || !rfidTags.trim()
                        ? "not-allowed"
                        : "pointer",
                      transition: "all 0.2s",
                      width: "100%"
                    }}
                  >
                    {rfidLoading ? "⏳ Lecture..." : "✅ Valider le passage"}
                  </button>
                )}
              </div>
            )}

            <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#94a3b8" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: isFocused ? "#10b981" : "#9ca3af", transition: "background 0.3s" }} />
              <span>Lecteur: {isFocused ? "Prêt" : "Inactif"}</span>
              {loading && <span style={{ marginLeft: "16px", color: "#0ea5e9" }}>⏳ Traitement...</span>}
              <span style={{ marginLeft: "16px" }}>{agent ? "📦 Scan bac/sac" : "👤 Scan agent"}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ padding: "8px 16px", borderRadius: "10px", background: agent ? "#dcfce7" : "#f1f5f9", color: agent ? "#15803d" : "#94a3b8", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
              {agent ? <CheckCircle size={16} color="#22c55e" /> : <XCircle size={16} />}
              {agent ? "Agent connecté" : "Agent non connecté"}
            </div>
            <div style={{ padding: "8px 16px", borderRadius: "10px", background: "#f1f5f9", color: "#64748b", fontSize: "13px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
              {mode === "RFID" ? "📡 RFID" : "📷 Code-barres"}
            </div>
          </div>
        </div>

        {/* ── Dernier reçu ── */}
        {dernierRecu && (
          <div style={{
            background: dernierRecu.type === "BAC" ? "linear-gradient(135deg, #dbeafe, #eff6ff)" : "linear-gradient(135deg, #fee2e2, #fef2f2)",
            borderRadius: "12px",
            padding: "16px",
            border: `2px solid ${dernierRecu.type === "BAC" ? "#3b82f6" : "#dc2626"}`,
            marginBottom: "20px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              {dernierRecu.type === "BAC"
                ? <Package size={20} color="#2563eb" />
                : <ShieldAlert size={20} color="#dc2626" />}
              <span style={{
                padding: "4px 12px",
                borderRadius: "20px",
                background: dernierRecu.type === "BAC" ? "#2563eb" : "#dc2626",
                color: "white",
                fontSize: "12px",
                fontWeight: 600
              }}>
                {dernierRecu.type === "BAC" ? "Bac" : "Sac infecté"}
              </span>
              <code style={{
                padding: "4px 12px",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: 700,
                background: dernierRecu.type === "BAC" ? "#dbeafe" : "#fee2e2",
                color: dernierRecu.type === "BAC" ? "#1d4ed8" : "#dc2626"
              }}>
                {dernierRecu.code}
              </code>
              {dernierRecu.type === "BAC" && bacEnCours && (
                <button
                  onClick={() => fetchLingesDuBac(bacEnCours.id)}
                  style={{
                    padding: "4px 16px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    background: "white",
                    color: "#64748b",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <Eye size={14} /> Voir linges
                </button>
              )}
              {dernierRecu.type === "SAC_INFECTE" && (
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  {dernierRecu.data?.quantiteDeclaree || 0} art.
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Panneau linges ── */}
        {afficherLinges && (
          <div style={{
            background: "#f0f9ff",
            borderRadius: "12px",
            padding: "16px",
            border: "2px solid #0ea5e9",
            marginBottom: "20px"
          }}>
            <PanneauLinges
              linges={lingesAffichés || []}
              titre={`Linges du bac ${bacEnCours?.code || ""}`}
              bacCode={bacEnCours?.code}
              isLoading={loadingLinges}
              onClose={fermerLinges}
            />
          </div>
        )}

        {/* ── Historique / Résumé ── */}
        {agent && (bacsRecus.length > 0 || sacsInfectes.length > 0) && (
          <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0", marginTop: "16px" }}>
            <div style={{ fontWeight: 600, fontSize: "14px", color: "#1e293b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Package size={16} />
              Résumé des réceptions
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
              {bacsRecus.length > 0 && (
                <div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>Bacs reçus</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                    {bacsRecus.map((bac, i) => (
                      <span key={i} style={{
                        padding: "4px 12px",
                        borderRadius: "12px",
                        background: "#dbeafe",
                        color: "#1d4ed8",
                        fontSize: "12px",
                        fontWeight: 600
                      }}>
                        {bac.codeBac || bac.code}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {sacsInfectes.length > 0 && (
                <div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>Sacs infectés</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                    {sacsInfectes.map((sac, i) => (
                      <span key={i} style={{
                        padding: "4px 12px",
                        borderRadius: "12px",
                        background: "#fee2e2",
                        color: "#dc2626",
                        fontSize: "12px",
                        fontWeight: 600
                      }}>
                        {sac.numeroSac}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e2e8f0", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", gap: "20px", fontSize: "13px", color: "#64748b" }}>
            {agent && (
              <>
                <span>Agent: <strong style={{ color: "#0f172a" }}>{agent.nom || agent.matricule}</strong></span>
                <span>Matricule: <strong style={{ color: "#0f172a" }}>{agent.matricule}</strong></span>
              </>
            )}
            {bacsRecus.length > 0 && (
              <span>Bacs: <strong style={{ color: "#3b82f6" }}>{bacsRecus.length}</strong></span>
            )}
            {sacsInfectes.length > 0 && (
              <span>Sacs: <strong style={{ color: "#dc2626" }}>{sacsInfectes.length}</strong></span>
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

// ── Composant StatCard ──
function StatCard({ value, label, color }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "12px",
      borderRadius: "10px",
      background: "white",
      border: `1px solid ${color}33`,
      textAlign: "center"
    }}>
      <span style={{
        fontSize: "24px",
        fontWeight: 800,
        color: color,
        lineHeight: 1.2
      }}>
        {value}
      </span>
      <span style={{
        fontSize: "12px",
        color: "#64748b",
        fontWeight: 500
      }}>
        {label}
      </span>
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

// État de focus pour l'input
let isFocused = true;

export default function ReceptionList() {
  return <ReceptionProvider><ReceptionInner /></ReceptionProvider>;
}