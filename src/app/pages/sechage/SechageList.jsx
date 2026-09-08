import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FaWind, FaFilter, FaBoxes, FaSpinner, FaPlay, FaUser, FaCheckCircle, FaTimes, FaExclamationTriangle } from "react-icons/fa";
import { SechageProvider, useSechage } from "../../contextes/SechageContext";
import { getAgent, isAgentConnected } from "../../services/agentService";
import ScanInput from "../../components/utils/shared/ScanInput";
import CarteLot from "../../components/utils/CarteLot";
import LotInfoDialogSechage from "../../components/utils/LotInfoDialogSechage";
import RecapSechage from "../../components/utils/RecapSechage";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import "../Linge/WorkflowList.css";

function SechageInner() {
  const { t } = useTranslation();

  const {
    agent: agentFromContext,
    identifierAgent,
    etape, machine, lotsDisponibles, lotsSelectionnes,
    loadingLots, poidsTotal,
    scannerMachine, chargerLots, scannerLot,
    retirerLot, nouveauCycle,
    loading, resetAll,
  } = useSechage();

  const [scanVal, setScanVal] = useState("");
  const [searchLot, setSearchLot] = useState("");
  const [agent, setAgent] = useState(null);

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
        poste: agentData.poste || "AGENT_SECHAGE"
      };
      setAgent(ag);
      if (identifierAgent) {
        identifierAgent(agentData.codeBarre).catch(() => {});
      }
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
    if (agent && etape === "LOTS") chargerLots();
  }, [etape, agent, chargerLots]);

  const handleScan = async (code) => {
    setScanVal("");
    if (!agent) {
      if (identifierAgent) {
        await identifierAgent(code);
      }
      return;
    }
    if (etape === "MACHINE") { await scannerMachine(code); return; }
    if (etape === "LOTS") { await scannerLot(code, poidsTotal); return; }
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

  const getAgentFullName = () => {
    if (!agent) return '';
    return agent.nomPrenom || agent.nom || agent.matricule;
  };

  const getPlaceholder = () => {
    if (!agent) return t('sechage.agent_not_connected');
    if (etape === "MACHINE") return t('sechage.scan_dryer_code');
    if (etape === "LOTS") return t('sechage.scan_lot_wash');
    return t('sechage.scan');
  };

  const getBorderColor = () => {
    if (!agent) return "#dc2626";
    return "#0ea5e9";
  };

  const getEtapeLabel = () => {
    if (etape === "MACHINE") return t('sechage.step_machine');
    if (etape === "LOTS") return t('sechage.step_lots');
    if (etape === "EN_COURS") return t('sechage.step_in_progress');
    if (etape === "TERMINE") return t('sechage.step_completed');
    return etape;
  };

  return (
    <div className="collecte-container">
      <LotInfoDialogSechage />

      {/* ─── EN-TÊTE ─────────────────────────────────────────────────────── */}
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
            background: "linear-gradient(135deg, #0891b2, #0e7490)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            boxShadow: "0 4px 16px rgba(8, 145, 178, 0.25)"
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
              <path d="M12 2v4" />
              <path d="M12 18v4" />
              <path d="M4 12H2" />
              <path d="M22 12h-2" />
              <path d="M19 5l-3 3" />
              <path d="M8 16l-3 3" />
              <path d="M16 16l3 3" />
              <path d="M5 5l3 3" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div>
            <h1 style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#0f172a",
              margin: 0
            }}>
              {t('sechage.title')}
            </h1>
            <p style={{
              fontSize: "14px",
              color: "#64748b",
              margin: "2px 0 0 0"
            }}>
              {agent 
                ? `${t('sechage.agent')}: ${getAgentFullName()}`
                : t('sechage.no_agent_connected')}
            </p>
          </div>
        </div>
      </div>

      <div className="collecte-panel-grand" style={{
        background: "white", borderRadius: "20px",
        padding: "32px", border: "1px solid #e2e8f0",
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)"
      }}>

        {/* Barre supérieure */}
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
                <FaCheckCircle color="#22c55e" size={16} />
                <span style={{ fontWeight: 700, color: "#15803d", fontSize: "14px" }}>
                  {getAgentFullName()}
                </span>
                <Badge variant="outline" style={{ fontSize: "11px" }}>
                  {agent.codeBarre || agent.matricule}
                </Badge>
                <button
                  onClick={() => {
                    resetAll();
                    setAgent(null);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer"
                  }}
                >
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setScanVal("");
                resetAll();
                setAgent(null);
              }}
            >
              {t('common.reset')}
            </Button>
          </div>
        </div>

        {/* ─── Message si agent non connecté ──────────────────────────────── */}
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
            <span style={{ fontWeight: 600 }}>{t('sechage.no_agent_connected')}</span>
            <span style={{ color: "#64748b" }}>{t('sechage.no_agent_connect_text')}</span>
          </div>
        )}

        {/* ─── ZONE DE SCAN ────────────────────────────────────────────── */}
        <Card style={{
          marginBottom: "20px",
          border: `2px dashed ${getBorderColor()}`
        }}>
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

        {/* ─── INFO AGENT ────────────────────────────────────────────────── */}
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

        {/* ─── CONTENU PRINCIPAL ────────────────────────────────────────── */}
        {agent && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px", marginTop: "16px" }}>

            {/* Colonne gauche */}
            <div>
              {etape === "MACHINE" && (
                <div style={{
                  textAlign: "center", padding: "48px", background: "#f8fafc",
                  borderRadius: "14px", border: "2px dashed #e2e8f0", color: "#94a3b8"
                }}>
                  <FaWind size={40} style={{ opacity: 0.2, marginBottom: "12px" }}/>
                  <div style={{ fontSize: "14px", fontWeight: 600 }}>{t('sechage.scan_dryer')}</div>
                  <div style={{ fontSize: "12px", marginTop: "4px" }}>
                    {t('sechage.scan_dryer_type')}
                  </div>
                </div>
              )}

              {(etape === "LOTS" || etape === "EN_COURS") && (
                <div style={{
                  background: "#f8fafc", borderRadius: "14px",
                  padding: "16px", border: "1px solid #e2e8f0"
                }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: "14px"
                  }}>
                    <div style={{
                      fontWeight: 700, fontSize: "14px",
                      display: "flex", alignItems: "center", gap: "8px"
                    }}>
                      <FaBoxes color="#64748b"/> {t('sechage.washed_lots')}
                      <span style={{
                        background: "#e2e8f0", padding: "2px 8px",
                        borderRadius: "10px", fontSize: "11px"
                      }}>{lotsFiltres.length}</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder={t('common.search')}
                        value={searchLot}
                        onChange={e=>setSearchLot(e.target.value)}
                        onFocus={e=>e.stopPropagation()}
                        style={{
                          padding: "6px 10px", borderRadius: "8px", border: "1px solid #e2e8f0",
                          fontSize: "12px", outline: "none", width: "130px"
                        }}
                      />
                      <button onClick={chargerLots} style={{
                        padding: "6px 12px", borderRadius: "8px",
                        border: "1px solid #e2e8f0", background: "white",
                        color: "#64748b", cursor: "pointer", fontSize: "12px"
                      }}>↻</button>
                    </div>
                  </div>
                  {loadingLots ? (
                    <div style={{ textAlign: "center", padding: "24px", color: "#94a3b8" }}>
                      <FaSpinner style={{ animation: "spin 1s linear infinite" }}/> {t('common.loading')}
                    </div>
                  ) : lotsFiltres.length === 0 ? (
                    <div style={{
                      textAlign: "center", padding: "32px", color: "#94a3b8", fontSize: "13px"
                    }}>
                      <FaBoxes size={28} style={{ opacity: 0.2, marginBottom: "8px" }}/>
                      <div>{t('sechage.no_washed_lots')}</div>
                    </div>
                  ) : (
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(210px,1fr))",
                      gap: "10px", maxHeight: "380px", overflowY: "auto"
                    }}>
                      {lotsFiltres.map(lot => (
                        <CarteLot
                          key={lot.id}
                          lot={lot}
                          selectionne={!!lotsSelectionnes.find(ls=>ls.lot.id===lot.id)}
                          onClick={(l) => {
                            const deja = !!lotsSelectionnes.find(ls=>ls.lot.id===l.id);
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
                  <div style={{
                    fontWeight: 800, fontSize: "20px",
                    marginBottom: "8px", color: "#15803d"
                  }}>{t('sechage.drying_completed')}</div>
                  <div style={{ color: "#64748b", marginBottom: "24px", fontSize: "14px" }}>
                    {lotsSelectionnes.length} {t('sechage.lots_dried')}
                  </div>
                  <button onClick={nouveauCycle} style={{
                    padding: "12px 28px", borderRadius: "10px", border: "none",
                    background: "linear-gradient(135deg,#0ea5e9,#0284c7)",
                    color: "white", fontWeight: 700, cursor: "pointer", fontSize: "15px",
                    display: "inline-flex", alignItems: "center", gap: "8px"
                  }}>
                    <FaPlay size={12}/> {t('sechage.new_cycle')} →
                  </button>
                </div>
              )}
            </div>

            {/* Colonne droite */}
            <RecapSechage/>
          </div>
        )}

        {/* ─── FOOTER ────────────────────────────────────────────────────── */}
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
              padding: "2px 10px", borderRadius: "8px",
              background: "#e0f2fe", color: "#0369a1", fontSize: "11px", fontWeight: 700
            }}>
              🌬️ {t('sechage.step')}: {getEtapeLabel()}
            </span>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function SechageList() {
  return <SechageProvider><SechageInner/></SechageProvider>;
}