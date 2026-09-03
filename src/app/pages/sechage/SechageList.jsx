import React, { useState, useEffect, useMemo } from "react";
import { FaWind, FaFilter, FaBoxes, FaSpinner, FaPlay, FaUser, FaExclamationTriangle } from "react-icons/fa";
import { SechageProvider, useSechage } from "../../contextes/SechageContext";
import { getAgent, isAgentConnected } from "../../services/agentService";
import ScanInput            from "../../components/utils/shared/ScanInput";
import CarteLot             from "../../components/utils/CarteLot";
import LotInfoDialogSechage from "../../components/utils/LotInfoDialogSechage";
import RecapSechage         from "../../components/utils/RecapSechage";
import "../Linge/WorkflowList.css";

function SechageInner() {
  const {
    agent: agentFromContext,
    identifierAgent,
    etape, machine, lotsDisponibles, lotsSelectionnes,
    loadingLots, poidsTotal,
    scannerMachine, chargerLots, scannerLot,
    retirerLot, nouveauCycle,
    loading, resetAll,
  } = useSechage();

  const [scanVal,   setScanVal]   = useState("");
  const [searchLot, setSearchLot] = useState("");
  const [agent,     setAgent]     = useState(null);

  useEffect(() => {
    const agentData = getAgent();
    if (agentData && isAgentConnected()) {
      setAgent(agentData);
      if (identifierAgent) {
        identifierAgent(agentData.codeBarre).catch(() => {});
      }
    }
  }, []);

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
    if (etape === "MACHINE") { await scannerMachine(code);           return; }
    if (etape === "LOTS")    { await scannerLot(code, poidsTotal);   return; }
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

  const placeholder = !agent ? "👤 Agent non connecté — veuillez vous reconnecter"
    : etape === "MACHINE" ? "🌬️ Scanner le code du séchoir..."
    : etape === "LOTS"    ? "📦 Scanner un lot (LAVE)..."
    : "Scanner...";

  const borderColor = !agent ? "#dc2626" : "#0ea5e9";

  return (
    <div className="collecte-container">
      <LotInfoDialogSechage />

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
              Station de Séchage
            </h1>
            <p style={{
              fontSize: "14px",
              color: "#64748b",
              margin: "2px 0 0 0"
            }}>
              {agent ? `Agent: ${agent.nom || agent.matricule}` : "Aucun agent connecté"}
            </p>
          </div>
        </div>
      </div>

      <div className="collecte-panel-grand" style={{
        background: "white", borderRadius: "20px",
        padding: "32px", border: "1px solid #e2e8f0",
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)"
      }}>

        {/* Barre agent */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: "20px", flexWrap: "wrap", gap: "12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              background: "#e0f2fe", width: "48px", height: "48px", borderRadius: "12px",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              {agent ? <FaWind size={22} color="#0ea5e9"/> : <FaUser size={22} color="#94a3b8"/>}
            </div>
            <div>
              <span style={{ fontWeight: 700, color: "#1e3a8a", fontSize: "18px" }}>
                {agent ? `${agent.nom} (${agent.matricule})` : "Station de Séchage"}
              </span>
              {machine && (
                <div style={{ fontSize: "12px", color: "#0ea5e9", marginTop: "2px" }}>
                  Séchoir : {machine.code} · {machine.capaciteKg} kg · {machine.type}
                </div>
              )}
              {!agent && (
                <div style={{ fontSize: "12px", color: "#dc2626", marginTop: "2px" }}>
                  ⚠️ Agent non connecté
                </div>
              )}
            </div>
          </div>
          <button onClick={resetAll} style={{
            padding: "8px 16px", border: "1px solid #e2e8f0",
            borderRadius: "10px", background: "white", color: "#64748b", cursor: "pointer",
            fontSize: "13px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px"
          }}>
            <FaFilter size={12}/> Réinitialiser
          </button>
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
            <span style={{ fontWeight: 600 }}>Aucun agent connecté</span>
            <span style={{ color: "#64748b" }}>Veuillez vous connecter pour utiliser la station de séchage</span>
          </div>
        )}

        {/* Zone scan */}
        <div style={{
          marginBottom: "20px", padding: "18px 20px", background: "#f8fafc",
          borderRadius: "14px", border: `2px dashed ${borderColor}`
        }}>
          <ScanInput
            placeholder={placeholder}
            value={scanVal}
            onChange={setScanVal}
            onSubmit={handleScan}
            borderColor={borderColor}
            keepFocus
            autoDebounce
            disabled={!agent}
          />
        </div>

        {agent && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>

            {/* Colonne gauche */}
            <div>
              {etape === "MACHINE" && (
                <div style={{
                  textAlign: "center", padding: "48px", background: "#f8fafc",
                  borderRadius: "14px", border: "2px dashed #e2e8f0", color: "#94a3b8"
                }}>
                  <FaWind size={40} style={{ opacity: 0.2, marginBottom: "12px" }}/>
                  <div style={{ fontSize: "14px", fontWeight: 600 }}>Scannez le séchoir</div>
                  <div style={{ fontSize: "12px", marginTop: "4px" }}>
                    Type SECHEUR ou LAVEUR_SECHEUR
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
                      <FaBoxes color="#64748b"/> Lots lavés
                      <span style={{
                        background: "#e2e8f0", padding: "2px 8px",
                        borderRadius: "10px", fontSize: "11px"
                      }}>{lotsFiltres.length}</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder="Rechercher..."
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
                      <FaSpinner style={{ animation: "spin 1s linear infinite" }}/> Chargement...
                    </div>
                  ) : lotsFiltres.length === 0 ? (
                    <div style={{
                      textAlign: "center", padding: "32px", color: "#94a3b8", fontSize: "13px"
                    }}>
                      <FaBoxes size={28} style={{ opacity: 0.2, marginBottom: "8px" }}/>
                      <div>Aucun lot lavé disponible</div>
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
                  }}>Séchage terminé !</div>
                  <div style={{ color: "#64748b", marginBottom: "24px", fontSize: "14px" }}>
                    {lotsSelectionnes.length} lot(s) séchés · Linges en état <strong>SECHE</strong>
                  </div>
                  <button onClick={nouveauCycle} style={{
                    padding: "12px 28px", borderRadius: "10px", border: "none",
                    background: "linear-gradient(135deg,#0ea5e9,#0284c7)",
                    color: "white", fontWeight: 700, cursor: "pointer", fontSize: "15px",
                    display: "inline-flex", alignItems: "center", gap: "8px"
                  }}>
                    <FaPlay size={12}/> Nouveau cycle →
                  </button>
                </div>
              )}
            </div>

            {/* Colonne droite */}
            <RecapSechage/>
          </div>
        )}

        {agent && (
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e2e8f0",
            fontSize: "12px", color: "#64748b", flexWrap: "wrap", gap: "8px"
          }}>
            <div style={{ display: "flex", gap: "16px" }}>
              <span>🌬️ Lots : <strong style={{ color: "#0ea5e9" }}>{lotsSelectionnes.length}</strong></span>
              <span>⚖️ Poids : <strong style={{ color: "#0ea5e9" }}>{poidsTotal.toFixed(1)} kg</strong></span>
            </div>
            <span style={{
              padding: "2px 10px", borderRadius: "8px",
              background: "#e0f2fe", color: "#0369a1", fontSize: "11px", fontWeight: 700
            }}>
              🌬️ Étape : {etape}
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