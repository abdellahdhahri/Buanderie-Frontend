// pages/Reception/ReceptionList.js
import { useState, useRef, useCallback, useEffect } from "react";
import React from "react";
import { useTranslation } from "react-i18next";
import { User, CheckCircle, XCircle, RotateCcw, Package, ShieldAlert, Wifi, Eye } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { ReceptionProvider, useReception } from "../../contextes/ReceptionContext";
import ModeToggle from "../../components/utils/shared/ModeToggle";
import PanneauLinges from "../../components/utils/reception/PanneauLinges";
import ScanInput from "../../components/utils/shared/ScanInput";
import { getAgent, isAgentConnected } from "../../services/agentService";
import Swal from "sweetalert2";

function ReceptionInner() {
  const { t } = useTranslation();

  const {
    agent: agentFromContext,
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
  const [isFocused, setIsFocused] = useState(true);
  const [agent, setAgent] = useState(null);

  const scanInputRef = useRef(null);
  const rfidBacRef = useRef(null);
  const rfidTagsRef = useRef(null);
  const isMounted = useRef(true);

  // ✅ Récupérer l'agent depuis localStorage
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
        poste: agentData.poste || "AGENT_RECEPTION"
      };
      setAgent(ag);
    } else {
      setAgent(null);
    }
  }, []);

  // ✅ Si l'agent du contexte change, mettre à jour l'agent local
  useEffect(() => {
    if (agentFromContext) {
      setAgent(agentFromContext);
    }
  }, [agentFromContext]);

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
    const timer = setTimeout(() => {
      const code = scanValue.trim();
      setScanValue("");

      if (!agent) {
        const agentData = getAgent();
        if (agentData && isAgentConnected()) {
          const ag = {
            matricule: agentData.codeBarre || agentData.matricule,
            nom: agentData.nom || "Inconnu",
            prenom: agentData.prenom || "",
            nomPrenom: agentData.nomPrenom || agentData.nom || "Inconnu",
            codeBarre: agentData.codeBarre || agentData.matricule,
            id: agentData.id,
            poste: agentData.poste || "AGENT_RECEPTION"
          };
          setAgent(ag);
          scanReception(code, ag);
        } else {
          scanAgent(code);
        }
      } else {
        scanReception(code, agent);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [scanValue, mode, agent, scanAgent, scanReception]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = scanValue.trim();
    if (!code) return;
    setScanValue("");

    if (!agent) {
      const agentData = getAgent();
      if (agentData && isAgentConnected()) {
        const ag = {
          matricule: agentData.codeBarre || agentData.matricule,
          nom: agentData.nom || "Inconnu",
          prenom: agentData.prenom || "",
          nomPrenom: agentData.nomPrenom || agentData.nom || "Inconnu",
          codeBarre: agentData.codeBarre || agentData.matricule,
          id: agentData.id,
          poste: agentData.poste || "AGENT_RECEPTION"
        };
        setAgent(ag);
        scanReception(code, ag);
      } else {
        scanAgent(code);
      }
    } else {
      scanReception(code, agent);
    }
  };

  const handlePortique = async () => {
    const tags = rfidTags.split(/[\s,;\n]+/).map(t => t.trim()).filter(Boolean);
    
    if (tags.length === 0) {
      Swal.fire({
        title: t('reception_alert.rfid_no_tags'),
        text: t('reception_alert.rfid_no_tags_text'),
        icon: "warning",
        timer: 2000,
        showConfirmButton: false
      });
      return;
    }

    setRfidLoading(true);
    const result = await passagePortique(rfidCodeBac.trim(), tags, agent);
    setRfidCodeBac("");
    setRfidTags("");
    setRfidLoading(false);

    if (result?.success) {
      Swal.fire({
        title: t('reception_alert.rfid_success'),
        text: t('reception_alert.rfid_success_text', { 
          count: tags.length, 
          code: rfidCodeBac.trim() 
        }),
        icon: "success",
        timer: 2000,
        showConfirmButton: false
      });
    } else if (result?.error) {
      Swal.fire({
        title: t('reception_alert.rfid_error'),
        text: result.message || t('reception_alert.rfid_error_text'),
        icon: "error",
        timer: 2000,
        showConfirmButton: false
      });
    }
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
      title: t('reception.confirm_logout'),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t('reception.confirm_logout_yes'),
      cancelButtonText: t('reception.confirm_logout_no'),
      confirmButtonColor: "#0ea5e9"
    }).then(r => {
      if (r.isConfirmed) {
        deconnecterAgent();
        setAgent(null);
        handleReset();
      }
    });
  };

  const getPlaceholder = () => {
    if (!agent) return t('reception.scan_placeholder_no_agent');
    return t('reception.scan_placeholder');
  };

  const getBorderColor = () => {
    if (!agent) return "#dc2626";
    return "#10b981";
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
              {t('reception.title')}
            </h1>
            <p style={{
              fontSize: "14px",
              color: "#64748b",
              margin: "2px 0 0 0"
            }}>
              {agent 
                ? t('reception.subtitle', { agent: agent.nomPrenom || agent.nom || agent.matricule })
                : t('reception.subtitle_no_agent')}
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

        {/* ── Barre supérieure ── */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {agent ? (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 16px",
                background: "#f0fdf4",
                borderRadius: "10px",
                border: "1px solid #bbf7d0"
              }}>
                <CheckCircle color="#22c55e" size={16} />
                <span style={{ fontWeight: 700, color: "#15803d", fontSize: "14px" }}>
                  {agent.nomPrenom || agent.nom || agent.matricule}
                </span>
                <Badge variant="outline" style={{ fontSize: "11px" }}>
                  {agent.codeBarre || agent.matricule}
                </Badge>
                <button
                  onClick={handleLogout}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer"
                  }}
                >
                  <XCircle size={12} />
                </button>
              </div>
            ) : (
              <div style={{ fontSize: "13px", color: "#94a3b8" }}>{t('reception.no_agent_title')}</div>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <ModeToggle mode={mode} onChange={setMode} />
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
            >
              <RotateCcw size={12} style={{ marginRight: "4px" }} />
              {t('reception.reset')}
            </Button>
          </div>
        </div>

        {/* ─── Message si agent non connecté ── */}
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
            <XCircle size={16} />
            <span style={{ fontWeight: 600 }}>{t('reception.no_agent_title')}</span>
            <span style={{ color: "#64748b" }}>{t('reception.no_agent_message')}</span>
          </div>
        )}

        {/* ─── STATS ── */}
        {agent && (
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
            gap: "12px", 
            marginBottom: "20px", 
            padding: "16px", 
            background: "#f8fafc", 
            borderRadius: "12px", 
            border: "1px solid #e2e8f0" 
          }}>
            <StatCard value={bacsRecus.length || 0} label={t('reception.bacs_received')} color="#0ea5e9" />
            <StatCard value={sacsInfectes.length || 0} label={t('reception.sacs_infectes')} color="#ef4444" />
            <StatCard value={dernierRecu ? (dernierRecu.type === "BAC" ? t('reception.bac') : t('reception.sac_infecte')) : "-"} label={t('reception.last_received')} color="#8b5cf6" />
          </div>
        )}

        {/* ─── ZONE DE SCAN ────────────────────────────────────────────── */}
        <Card style={{
          marginBottom: "20px",
          border: `2px dashed ${getBorderColor()}`
        }}>
          <CardContent className="p-5">
            {mode === "BARCODE" ? (
              <ScanInput
                ref={scanInputRef}
                placeholder={getPlaceholder()}
                value={scanValue}
                onChange={setScanValue}
                onSubmit={handleSubmit}
                borderColor={getBorderColor()}
                keepFocus={true}
                autoDebounce={true}
                disabled={!agent || loading}
              />
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
                      placeholder={t('reception.scan_placeholder_no_agent')}
                      value={scanValue}
                      onChange={e => setScanValue(e.target.value)}
                      ref={scanInputRef}
                      disabled
                      style={{
                        width: "100%",
                        padding: "16px 16px 16px 48px",
                        borderRadius: "10px",
                        border: "2px solid #e2e8f0",
                        fontSize: "16px",
                        outline: "none",
                        boxSizing: "border-box",
                        background: "#f1f5f9",
                        cursor: "not-allowed"
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
                        placeholder={t('reception.rfid_bac_code')}
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
                        placeholder={t('reception.rfid_tags')}
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
                    {rfidLoading ? t('reception.rfid_loading') : t('reception.rfid_validate')}
                  </button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── INFO AGENT ── */}
        {agent && (
          <Card style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", marginBottom: "16px" }}>
            <CardContent className="p-4">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <Package color="#22c55e" size={16} />
                <span style={{ fontWeight: 600, color: "#15803d" }}>{t('reception.ready')}</span>
                <span style={{ color: "#64748b" }}>
                  {mode === "BARCODE" ? t('reception.ready_barcode') : t('reception.ready_rfid')}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── DERNIER REÇU ── */}
        {dernierRecu && agent && (
          <div style={{
            background: dernierRecu.type === "BAC" ? "linear-gradient(135deg, #dbeafe, #eff6ff)" : "linear-gradient(135deg, #fee2e2, #fef2f2)",
            borderRadius: "12px",
            padding: "16px",
            border: `2px solid ${dernierRecu.type === "BAC" ? "#3b82f6" : "#dc2626"}`,
            marginBottom: "16px"
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
                {dernierRecu.type === "BAC" ? t('reception.bac') : t('reception.sac_infecte')}
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
              
              {/* ✅ Bouton pour voir les linges */}
              {dernierRecu.type === "BAC" && bacEnCours && (
                <>
                  <button
                    onClick={async () => {
                      const bacId = bacEnCours.id || bacEnCours.bacId;
                      if (bacId) {
                        await fetchLingesDuBac(bacId);
                      }
                    }}
                    style={{
                      padding: "4px 16px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      background: afficherLinges ? "#2563eb" : "white",
                      color: afficherLinges ? "white" : "#64748b",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <Eye size={14} />
                    {afficherLinges ? t('reception.hide_linges') : t('reception.see_linges')}
                  </button>
                  
                  <span style={{ 
                    fontSize: "12px", 
                    color: "#64748b", 
                    background: "#f1f5f9", 
                    padding: "2px 10px", 
                    borderRadius: "12px" 
                  }}>
                    {lingesAffichés.length} {t('reception.linges_count')}
                  </span>
                </>
              )}
              
              {dernierRecu.type === "SAC_INFECTE" && (
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  {dernierRecu.data?.quantiteDeclaree || 0} {t('reception.items')}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ─── PANNEAU LINGES ── */}
        {afficherLinges && agent && (
          <div style={{
            background: "#f0f9ff",
            borderRadius: "12px",
            padding: "16px",
            border: "2px solid #0ea5e9",
            marginBottom: "16px"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px"
            }}>
              <div style={{
                fontWeight: 700,
                fontSize: "14px",
                color: "#0c4a6e",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <Package size={18} />
                {t('reception.bac_linges', { code: bacEnCours?.code || dernierRecu?.code || "" })}
                <Badge style={{ background: "#bae6fd", color: "#0369a1" }}>
                  {lingesAffichés.length} {t('reception.linges_count')}
                </Badge>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {loadingLinges && (
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    <svg className="animate-spin w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {t('reception.loading_linges')}
                  </span>
                )}
                <button
                  onClick={fermerLinges}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    background: "white",
                    color: "#64748b",
                    cursor: "pointer",
                    fontSize: "12px"
                  }}
                >
                  ✕ {t('common.close')}
                </button>
              </div>
            </div>

            {loadingLinges ? (
              <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>
                <svg className="animate-spin w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <p style={{ marginTop: "8px" }}>{t('reception.loading_linges')}</p>
              </div>
            ) : lingesAffichés.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "30px",
                color: "#94a3b8",
                background: "#f8fafc",
                borderRadius: "10px"
              }}>
                <Package size={32} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
                <p style={{ fontWeight: 600 }}>{t('reception.no_linge')}</p>
                <p style={{ fontSize: "13px" }}>{t('reception.empty_bac')}</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
                {lingesAffichés.map((linge, index) => {
                  const categorieColors = {
                    DRAP: { bg: "#fee2e2", color: "#dc2626" },
                    TAIE_OREILLER: { bg: "#ffedd5", color: "#ea580c" },
                    SERVIETTE_BAIN: { bg: "#fef3c7", color: "#d97706" },
                    SERVIETTE_VISAGE: { bg: "#ecfccb", color: "#65a30d" },
                    PEIGNOIR: { bg: "#cffafe", color: "#0891b2" },
                    NAPPE: { bg: "#ede9fe", color: "#7c3aed" },
                    SERVIETTE_TABLE: { bg: "#fce7f3", color: "#be185d" },
                    UNIFORME: { bg: "#ccfbf1", color: "#0f766e" },
                    AUTRE: { bg: "#f1f5f9", color: "#475569" },
                  };
                  const colors = categorieColors[linge.categorie] || categorieColors.AUTRE;
                  
                  return (
                    <div
                      key={linge.id || index}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          background: colors.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                          fontWeight: 700,
                          color: colors.color
                        }}>
                          {linge.categorie?.charAt(0) || "?"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "13px", color: "#0f172a" }}>
                            {linge.codeBarre || "N/A"}
                          </div>
                          <div style={{ fontSize: "11px", color: colors.color, fontWeight: 500 }}>
                            {linge.categorie || t('reception.non_categorise')}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {linge.rfidTag && (
                          <span style={{
                            fontSize: "9px",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            background: "#ede9fe",
                            color: "#7c3aed",
                            fontFamily: "monospace"
                          }}>
                            RFID
                          </span>
                        )}
                        <Badge 
                          variant={linge.etat === "RECEPTION" ? "success" : "secondary"}
                          style={{ fontSize: "10px" }}
                        >
                          {t(`reception_status.${linge.etat}`, linge.etat || "N/A")}
                        </Badge>
                        {linge.poids && (
                          <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                            {linge.poids} {t('reception.weight')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {afficherLinges && lingesAffichés && lingesAffichés.length === 0 && !loadingLinges && agent && (
          <div style={{
            background: "#fef3c7",
            borderRadius: "12px",
            padding: "16px",
            border: "2px solid #fcd34d",
            marginBottom: "16px",
            textAlign: "center",
            color: "#92400e"
          }}>
            <Package size={24} style={{ marginBottom: "8px", opacity: 0.5 }} />
            <p style={{ fontWeight: 600 }}>{t('reception.no_linge')}</p>
            <p style={{ fontSize: "13px" }}>{t('reception.empty_bac')} {bacEnCours?.code || ""}</p>
          </div>
        )}

        {/* ─── RÉSUMÉ ── */}
        {agent && (bacsRecus.length > 0 || sacsInfectes.length > 0) && (
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
              <Package size={16} />
              {t('reception.summary')}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
              {bacsRecus.length > 0 && (
                <div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>{t('reception.bacs_received')}</div>
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
                        {bac.codeBac || bac.code || bac.reference}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {sacsInfectes.length > 0 && (
                <div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>{t('reception.sacs_infectes')}</div>
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
                        {sac.numeroSac || sac.code}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── FOOTER ── */}
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
            {agent && (
              <>
                <span>{t('reception.agent')}: <strong style={{ color: "#0f172a" }}>{agent.nomPrenom || agent.nom || agent.matricule}</strong></span>
                <span>{t('reception.matricule')}: <strong style={{ color: "#0f172a" }}>{agent.codeBarre || agent.matricule}</strong></span>
              </>
            )}
            {!agent && (
              <span style={{ color: "#dc2626" }}>⚠️ {t('reception.no_agent_title')}</span>
            )}
            {bacsRecus.length > 0 && (
              <span>{t('reception.bacs')}: <strong style={{ color: "#3b82f6" }}>{bacsRecus.length}</strong></span>
            )}
            {sacsInfectes.length > 0 && (
              <span>{t('reception.sacs')}: <strong style={{ color: "#dc2626" }}>{sacsInfectes.length}</strong></span>
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

export default function ReceptionList() {
  return <ReceptionProvider><ReceptionInner /></ReceptionProvider>;
}