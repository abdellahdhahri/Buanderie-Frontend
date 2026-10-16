import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FaWind, FaBoxes, FaSpinner, FaPlay, FaCheckCircle, FaTimes, FaExclamationTriangle } from "react-icons/fa";
import { SechageProvider, useSechage } from "../../contextes/SechageContext";
import { getAgent, isAgentConnected } from "../../services/agentService";
import ScanInput from "../../components/utils/shared/ScanInput";
import CarteLot from "../../components/utils/CarteLot";
import { LotBasketCard } from "../../components/utils/shared/LotBasket";
import LotInfoDialogSechage from "../../components/utils/LotInfoDialogSechage";
import RecapSechage from "../../components/utils/RecapSechage";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import "../Linge/WorkflowList.css";
import { PageHeaderIcon } from "../../components/layout/PageHeaderIcon";

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 MachineCard — carte hero de la machine (sécheur)
// ═══════════════════════════════════════════════════════════════════════════
function MachineCard({ machine }) {
  const { t } = useTranslation();
  if (!machine) return null;

  const accent   = "#0891b2";
  const accentBg = "#ecfeff";
  const accentBd = "#a5f3fc";

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "16px",
      padding: "16px 18px",
      marginBottom: "16px",
      borderRadius: "16px",
      background: `linear-gradient(135deg, ${accentBg} 0%, #ffffff 100%)`,
      border: `1px solid ${accentBd}`,
      boxShadow: `0 4px 16px ${accent}15`,
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Halo décoratif */}
      <div style={{
        position: "absolute",
        right: "-30px",
        top: "-30px",
        width: "120px",
        height: "120px",
        borderRadius: "50%",
        background: `${accent}10`,
        pointerEvents: "none"
      }} />

      {/* Icône machine */}
      <div style={{
        width: "56px",
        height: "56px",
        borderRadius: "16px",
        background: `linear-gradient(135deg, ${accent}, #0e7490)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        flexShrink: 0,
        boxShadow: `0 6px 16px ${accent}40`,
        position: "relative",
        zIndex: 1
      }}>
        <FaWind size={26} />
      </div>

      {/* Infos */}
      <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <span style={{ fontWeight: 800, fontSize: "18px", color: "#0f172a" }}>
            {machine.code}
          </span>
          <Badge style={{
            background: accent,
            color: "white",
            fontSize: "10px",
            fontWeight: 700,
            padding: "2px 8px",
            textTransform: "uppercase",
            letterSpacing: "0.3px"
          }}>
            {t('sechage.dryer')}
          </Badge>
        </div>
        <div style={{ fontSize: "12px", color: "#64748b", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {machine.marque && <span>🏷️ {machine.marque}</span>}
          {machine.capaciteKg && <span>⚖️ {machine.capaciteKg} kg</span>}
          {machine.type && <span>⚙️ {machine.type}</span>}
          {machine.etat && (
            <span style={{
              color: machine.etat === "DISPONIBLE" ? "#15803d" : "#dc2626",
              fontWeight: 600
            }}>
              ● {machine.etat}
            </span>
          )}
        </div>
      </div>

      {/* Indicateur "prête" */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
        padding: "8px 12px",
        borderRadius: "12px",
        background: "white",
        border: `1px solid ${accentBd}`,
        position: "relative",
        zIndex: 1
      }}>
        <div style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          background: "#22c55e",
          boxShadow: "0 0 0 4px #22c55e30",
          animation: "pulse 2s infinite"
        }} />
        <span style={{ fontSize: "10px", fontWeight: 700, color: "#15803d" }}>
          {t('sechage.ready_for_drying')}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 EtapeProgress — timeline des étapes du séchage
// ═══════════════════════════════════════════════════════════════════════════
function EtapeProgress({ etape }) {
  const { t } = useTranslation();

  const steps = [
    { key: "MACHINE",  label: t('sechage.step_machine'),      icon: "🌬️" },
    { key: "LOTS",     label: t('sechage.step_lots'),         icon: "🧺" },
    { key: "EN_COURS", label: t('sechage.step_in_progress'),  icon: "⏳" },
    { key: "TERMINE",  label: t('sechage.step_completed'),    icon: "✅" },
  ];

  const currentIndex = steps.findIndex(s => s.key === etape);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "0",
      padding: "16px 20px",
      marginBottom: "20px",
      borderRadius: "14px",
      background: "linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)",
      border: "1px solid #e0f2fe",
      overflowX: "auto"
    }}>
      {steps.map((step, idx) => {
        const done    = idx < currentIndex;
        const active  = idx === currentIndex;
        const pending = idx > currentIndex;

        return (
          <React.Fragment key={step.key}>
            {/* Bulle étape */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              minWidth: "70px",
              position: "relative"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: done
                  ? "#22c55e"
                  : active
                    ? "linear-gradient(135deg, #0891b2, #0e7490)"
                    : "#f1f5f9",
                color: done || active ? "white" : "#94a3b8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                fontWeight: 700,
                boxShadow: active
                  ? "0 0 0 6px rgba(8,145,178,0.15)"
                  : done
                    ? "0 2px 8px rgba(34,197,94,0.25)"
                    : "none",
                transition: "all 0.3s ease",
                animation: active ? "pulse 2s infinite" : "none"
              }}>
                {done ? "✓" : step.icon}
              </div>
              <span style={{
                fontSize: "10px",
                fontWeight: active ? 700 : 500,
                color: done ? "#15803d" : active ? "#0e7490" : "#94a3b8",
                textAlign: "center",
                whiteSpace: "nowrap",
                textTransform: "uppercase",
                letterSpacing: "0.3px"
              }}>
                {step.label}
              </span>
            </div>

            {/* Ligne de connexion */}
            {idx < steps.length - 1 && (
              <div style={{
                flex: 1,
                height: "3px",
                minWidth: "20px",
                background: idx < currentIndex
                  ? "linear-gradient(90deg, #22c55e, #22c55e)"
                  : "linear-gradient(90deg, #22c55e 0%, #e2e8f0 0%)",
                borderRadius: "2px",
                margin: "0 6px",
                marginBottom: "20px",
                transition: "all 0.3s ease"
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function SechageInner() {
  const { t } = useTranslation();

  const {
    agent,
    setAgentDirect,
    etape, machine, lotsDisponibles, lotsSelectionnes,
    loadingLots, poidsTotal,
    scannerMachine, chargerLots, scannerLot,
    retirerLot, nouveauCycle, resetAll,
  } = useSechage();

  const [scanVal, setScanVal] = useState("");
  const [searchLot, setSearchLot] = useState("");

  // ═══════════════════════════════════════════════════════════════════════
  // ✅ RÉCUPÉRATION DE L'AGENT DEPUIS localStorage → pousse dans le contexte
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const syncAgent = () => {
      const agentData = getAgent();
      if (agentData && isAgentConnected()) {
        setAgentDirect({
          ...agentData,
          matricule: agentData.matricule || agentData.codeBarre || agentData.login,
          codeBarre: agentData.codeBarre || agentData.matricule || agentData.login,
          nomPrenom: agentData.nomPrenom || agentData.nom || agentData.login || "Inconnu",
        });
      }
    };

    syncAgent();

    const handleFocus = () => syncAgent();
    const handleStorage = (e) => {
      if (e.key === "agent" || e.key === "auth") syncAgent();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorage);
    };
  }, [setAgentDirect]);

  // Charger les lots quand on entre dans l'étape LOTS
  useEffect(() => {
    if (agent && etape === "LOTS") chargerLots();
  }, [etape, agent, chargerLots]);

  const handleScan = async (code) => {
    setScanVal("");
    if (!code?.trim()) return;
    if (!agent) return;

    if (etape === "MACHINE") { await scannerMachine(code); return; }
    if (etape === "LOTS")    { await scannerLot(code, poidsTotal); return; }
  };

  const lotsFiltres = useMemo(() => {
    const ids = new Set(lotsSelectionnes.map(ls => ls.lot.id));
    return lotsDisponibles.filter(l =>
      !ids.has(l.id) &&
      (!searchLot ||
        l.codeLot.toLowerCase().includes(searchLot.toLowerCase()) ||
        l.categorie?.toLowerCase().includes(searchLot.toLowerCase()))
    );
  }, [lotsDisponibles, lotsSelectionnes, searchLot]);

  const getAgentFullName = () =>
    agent?.nomPrenom || agent?.nom || agent?.matricule || "";

  const getAgentMatricule = () =>
    agent?.matricule || agent?.codeBarre || agent?.login || "";

  const getPlaceholder = () => {
    if (!agent) return t('sechage.agent_not_connected');
    if (etape === "MACHINE") return t('sechage.scan_dryer_code');
    if (etape === "LOTS") return t('sechage.scan_lot_wash');
    return t('sechage.scan');
  };

  const getBorderColor = () => (!agent ? "#dc2626" : "#0ea5e9");

  const getEtapeLabel = () => {
    if (etape === "MACHINE")  return t('sechage.step_machine');
    if (etape === "LOTS")     return t('sechage.step_lots');
    if (etape === "EN_COURS") return t('sechage.step_in_progress');
    if (etape === "TERMINE")  return t('sechage.step_completed');
    return etape;
  };

  return (
    <div className="collecte-container">
      <LotInfoDialogSechage />

      {/* ─── EN-TÊTE ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
          <PageHeaderIcon size={52} />
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              {t('sechage.title')}
            </h1>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "2px 0 0 0" }}>
              {agent
                ? `${t('sechage.agent')}: ${getAgentFullName()}`
                : t('sechage.no_agent_connected')}
            </p>
          </div>
        </div>
      </div>

      <div className="collecte-panel-grand" style={{
        background: "white", borderRadius: "20px", padding: "32px",
        border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.06)"
      }}>

        {/* Barre supérieure */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: "20px", flexWrap: "wrap", gap: "12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {agent ? (
              <div style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "8px 16px", background: "#f0fdf4",
                borderRadius: "10px", border: "1px solid #bbf7d0"
              }}>
                <FaCheckCircle color="#22c55e" size={16} />
                <span style={{ fontWeight: 700, color: "#15803d", fontSize: "14px" }}>
                  {getAgentFullName()}
                </span>
                <Badge variant="outline" style={{ fontSize: "11px" }}>
                  {getAgentMatricule()}
                </Badge>
                <button onClick={resetAll}
                  style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                  <FaTimes size={12} />
                </button>
              </div>
            ) : (
              <div style={{ fontSize: "13px", color: "#94a3b8" }}>{t('sechage.no_agent_connected')}</div>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {machine && (
              <Badge style={{ background: "#e0f2fe", color: "#0369a1", fontSize: "11px", padding: "4px 12px" }}>
                🌬️ {machine.code}
              </Badge>
            )}
            <Button variant="outline" size="sm"
              onClick={() => { setScanVal(""); resetAll(); }}>
              {t('common.reset')}
            </Button>
          </div>
        </div>

        {/* Message si agent non connecté */}
        {!agent && (
          <div style={{
            padding: "12px 16px", borderRadius: "10px", background: "#fef2f2",
            border: "1px solid #fca5a5", marginBottom: "16px",
            display: "flex", alignItems: "center", gap: "10px",
            fontSize: "13px", color: "#dc2626"
          }}>
            <FaExclamationTriangle size={16} />
            <span style={{ fontWeight: 600 }}>{t('sechage.no_agent_connected')}</span>
            <span style={{ color: "#64748b" }}>{t('sechage.no_agent_connect_text')}</span>
          </div>
        )}

        {/* Zone de scan */}
        <Card style={{ marginBottom: "20px", border: `2px dashed ${getBorderColor()}` }}>
          <CardContent className="p-5">
            <ScanInput
              placeholder={getPlaceholder()}
              value={scanVal}
              onChange={setScanVal}
              onSubmit={handleScan}
              borderColor={getBorderColor()}
              keepFocus={true}
              autoDebounce={true}
              disabled={!agent}
            />
          </CardContent>
        </Card>

        {/* Info agent */}
        {agent && (
          <Card style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <CardContent className="p-4">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <FaWind color="#22c55e" size={16} />
                <span style={{ fontWeight: 600, color: "#15803d" }}>{t('sechage.ready_for_drying')}</span>
                <span style={{ color: "#64748b" }}>
                  {etape === "MACHINE" ? t('sechage.scan_dryer') : t('sechage.scan_lot_status')}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contenu principal */}
        {agent && (
          <>
            {/* 🎨 Timeline des étapes */}
            <div style={{ marginTop: "16px" }}>
              <EtapeProgress etape={etape} />
            </div>

            {/* 🎨 Carte machine (dès qu'elle est scannée) */}
            {machine && etape !== "MACHINE" && (
              <MachineCard machine={machine} />
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px", marginTop: "16px" }}>
              <div>
                {etape === "MACHINE" && (
                  <div style={{
                    textAlign: "center", padding: "48px", background: "#f8fafc",
                    borderRadius: "14px", border: "2px dashed #e2e8f0", color: "#94a3b8"
                  }}>
                    <FaWind size={40} style={{ opacity: 0.2, marginBottom: "12px" }} />
                    <div style={{ fontSize: "14px", fontWeight: 600 }}>{t('sechage.scan_dryer')}</div>
                    <div style={{ fontSize: "12px", marginTop: "4px" }}>{t('sechage.scan_dryer_type')}</div>
                  </div>
                )}

                {(etape === "LOTS" || etape === "EN_COURS") && (
                  <div style={{ background: "#f8fafc", borderRadius: "14px", padding: "16px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                      <div style={{ fontWeight: 700, fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <FaBoxes color="#64748b" /> {t('sechage.washed_lots')}
                        <span style={{ background: "#e2e8f0", padding: "2px 8px", borderRadius: "10px", fontSize: "11px" }}>
                          {lotsFiltres.length}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="text"
                          placeholder={t('common.search')}
                          value={searchLot}
                          onChange={e => setSearchLot(e.target.value)}
                          onFocus={e => e.stopPropagation()}
                          style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #e2e8f0",
                                   fontSize: "12px", outline: "none", width: "130px" }}
                        />
                        <button onClick={chargerLots} style={{
                          padding: "6px 12px", borderRadius: "8px", border: "1px solid #e2e8f0",
                          background: "white", color: "#64748b", cursor: "pointer", fontSize: "12px"
                        }}>↻</button>
                      </div>
                    </div>
                    {loadingLots ? (
                      <div style={{ textAlign: "center", padding: "24px", color: "#94a3b8" }}>
                        <FaSpinner style={{ animation: "spin 1s linear infinite" }} /> {t('common.loading')}
                      </div>
                    ) : lotsFiltres.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "32px", color: "#94a3b8", fontSize: "13px" }}>
                        <FaBoxes size={28} style={{ opacity: 0.2, marginBottom: "8px" }} />
                        <div>{t('sechage.no_washed_lots')}</div>
                      </div>
                    ) : (
                      <div style={{
                        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))",
                        gap: "14px", maxHeight: "560px", overflowY: "auto", padding: "4px"
                      }}>
                        {lotsFiltres.map(lot => (
                          <LotBasketCard
                            key={lot.id}
                            lot={lot}
                            t={t}
                            selected={!!lotsSelectionnes.find(ls => ls.lot.id === lot.id)}
                            onSelect={(l) => {
                              const deja = !!lotsSelectionnes.find(ls => ls.lot.id === l.id);
                              if (deja) retirerLot(l.codeLot);
                              else scannerLot(l.codeLot, poidsTotal);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {etape === "TERMINE" && (
                  <div style={{
                    textAlign: "center", padding: "48px 20px", background: "#f0fdf4",
                    borderRadius: "16px", border: "2px solid #22c55e"
                  }}>
                    <div style={{ fontSize: "52px", marginBottom: "10px" }}>✅</div>
                    <div style={{ fontWeight: 800, fontSize: "20px", marginBottom: "8px", color: "#15803d" }}>
                      {t('sechage.drying_completed')}
                    </div>
                    <div style={{ color: "#64748b", marginBottom: "24px", fontSize: "14px" }}>
                      {lotsSelectionnes.length} {t('sechage.lots_dried')}
                    </div>
                    <button onClick={nouveauCycle} style={{
                      padding: "12px 28px", borderRadius: "10px", border: "none",
                      background: "linear-gradient(135deg,#0ea5e9,#0284c7)", color: "white",
                      fontWeight: 700, cursor: "pointer", fontSize: "15px",
                      display: "inline-flex", alignItems: "center", gap: "8px"
                    }}>
                      <FaPlay size={12} /> {t('sechage.new_cycle')} →
                    </button>
                  </div>
                )}
              </div>

              <RecapSechage />
            </div>
          </>
        )}

        {/* Footer */}
        {agent && (
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e2e8f0",
            fontSize: "12px", color: "#64748b", flexWrap: "wrap", gap: "8px"
          }}>
            <div style={{ display: "flex", gap: "16px" }}>
              <span>🌬️ {t('sechage.lots')}: <strong style={{ color: "#0ea5e9" }}>{lotsSelectionnes.length}</strong></span>
              <span>⚖️ {t('sechage.weight')}: <strong style={{ color: "#0ea5e9" }}>{poidsTotal.toFixed(1)} kg</strong></span>
              {machine && <span>🔧 {t('sechage.dryer')}: <strong style={{ color: "#0ea5e9" }}>{machine.code}</strong></span>}
            </div>
            <span style={{
              padding: "2px 10px", borderRadius: "8px", background: "#e0f2fe",
              color: "#0369a1", fontSize: "11px", fontWeight: 700
            }}>
              🌬️ {t('sechage.step')}: {getEtapeLabel()}
            </span>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.6; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}

export default function SechageList() {
  return <SechageProvider><SechageInner /></SechageProvider>;
}