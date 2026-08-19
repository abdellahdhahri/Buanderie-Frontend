import React, { useState, useEffect, useMemo } from "react";
import {
  FaSoap, FaFilter, FaCheckCircle, FaBiohazard,
  FaCalendarAlt, FaBoxes, FaSpinner, FaPlay, FaStop
} from "react-icons/fa";
import { LavageProvider, useLavage } from "../../contextes/LavageContext";

import ScanInput              from "../../components/utils/ScanInput";
import CarteLot               from "../../components/utils/CarteLot";
import CarteSacInfecte        from "../../components/utils/CarteSacInfecte";
import LotInfoDialog          from "../../components/utils/LotInfoDialog";
import ScanLingesPropresModal from "../../components/utils/ScanLingesPropresModal";
import RecapChargement        from "../../components/utils/RecapChargement";
import GuideSacInfecte        from "../../components/utils/GuideSacInfecte";

import "../Linge/WorkflowList.css";


function LavageInner() {
  const {
    agent, identifierAgent,
    etapeBlanc, machine, lotsDisponibles, lotsSelectionnes,
    loadingLots, poidsTotal,
    scannerMachine, chargerLots, scannerLot,
    confirmerAjoutLot, retirerLot, nouveauCycleBlanc,
    sacsInfectes, loadingSacs,
    chargerSacsInfectes, scannerSacInfecte,
    loading, resetAll,
  } = useLavage();

  const [onglet,    setOnglet]    = useState("BLANC");
  const [scanVal,   setScanVal]   = useState("");
  const [searchLot, setSearchLot] = useState("");

  useEffect(() => {
    if (!agent) return;
    if (onglet === "BLANC" && etapeBlanc === "LOTS") chargerLots();
    if (onglet === "INFECTE") chargerSacsInfectes();
  }, [onglet, agent, etapeBlanc]);

  const handleScan = async (code) => {
    setScanVal("");
    if (!agent)                                        { await identifierAgent(code);   return; }
    if (onglet === "BLANC" && etapeBlanc === "MACHINE") { await scannerMachine(code);   return; }
    if (onglet === "BLANC" && etapeBlanc === "LOTS")    {
      await scannerLot(code, poidsTotal);
      return;
    }
    if (onglet === "INFECTE")                          { await scannerSacInfecte(code); return; }
  };

  const lotsFiltres = useMemo(() => {
    const ids = new Set(lotsSelectionnes.map(ls => ls.lot.id));
    return lotsDisponibles.filter(l =>
      l.etat === "EN_TRI" &&
      !ids.has(l.id) &&
      (!searchLot ||
        l.codeLot.toLowerCase().includes(searchLot.toLowerCase()) ||
        l.categorie?.toLowerCase().includes(searchLot.toLowerCase()))
    );
  }, [lotsDisponibles, lotsSelectionnes, searchLot]);

  const getPlaceholder = () => {
    if (!agent)                                        return "👤 Scanner votre badge agent...";
    if (onglet === "BLANC" && etapeBlanc === "MACHINE") return "🔧 Scanner le code de la machine...";
    if (onglet === "BLANC" && etapeBlanc === "LOTS")    return "📦 Scanner un lot...";
    if (onglet === "INFECTE")                           return "🔴 Scanner un sac infecté...";
    return "Scanner...";
  };

  const getBorderColor = () => {
    if (!agent)               return "#e2e8f0";
    if (onglet === "INFECTE") return "#ef4444";
    return "#0ea5e9";
  };

  return (
    <div className="collecte-container">

      {/* Dialogs et modals */}
      <LotInfoDialog />
      <ScanLingesPropresModal />

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
      background: "linear-gradient(135deg, #06b6d4, #0891b2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      boxShadow: "0 4px 16px rgba(6, 182, 212, 0.25)"
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
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v8" />
        <path d="M8 12h8" />
        <path d="M8 8l8 8" />
        <path d="M8 16l8-8" />
      </svg>
    </div>
    <div>
      <h1 style={{
        fontSize: "28px",
        fontWeight: 800,
        color: "#0f172a",
        margin: 0
      }}>
        Station de Lavage
      </h1>
      <p style={{
        fontSize: "14px",
        color: "#64748b",
        margin: "2px 0 0 0"
      }}>
        Linge blanc (lots triés) · Linge infecté (sacs directs)
      </p>
    </div>
  </div>
</div>

      <div className="collecte-panel-grand" style={{
        background: "white", borderRadius: "20px", padding: "32px",
        border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.06)"
      }}>

        {/* Barre agent + reset */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: "20px", flexWrap: "wrap", gap: "12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              background: "#dbeafe", width: "48px", height: "48px",
              borderRadius: "12px", display: "flex",
              alignItems: "center", justifyContent: "center"
            }}>
              <FaSoap size={22} color="#0ea5e9" />
            </div>
            <div>
              <span style={{ fontWeight: 700, color: "#1e3a8a", fontSize: "18px" }}>
                {agent ? `${agent.nom} (${agent.matricule})` : "Station de Lavage"}
              </span>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", display: "flex", alignItems: "center", gap: "8px" }}>
                <FaCalendarAlt size={10} />
                {new Date().toLocaleDateString("fr-FR")}{" "}
                {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                {machine && (
                  <span style={{ fontWeight: 600, color: "#0ea5e9", marginLeft: "6px" }}>
                    · Machine : {machine.code} ({machine.capaciteKg} kg)
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={resetAll} style={{
            padding: "8px 16px", border: "1px solid #e2e8f0",
            borderRadius: "10px", background: "white", color: "#64748b",
            cursor: "pointer", fontSize: "13px", fontWeight: 500,
            display: "flex", alignItems: "center", gap: "6px"
          }}>
            <FaFilter size={12} /> Réinitialiser
          </button>
        </div>

        {/* ── Zone de scan — focus permanent ────────────────────────────────── */}
        <div style={{
          marginBottom: "20px", padding: "18px 20px",
          background: "#f8fafc", borderRadius: "14px",
          border: `2px dashed ${getBorderColor()}`
        }}>
          <ScanInput
            placeholder={getPlaceholder()}
            value={scanVal}
            onChange={setScanVal}
            onSubmit={handleScan}
            borderColor={getBorderColor()}
            keepFocus={true}
            autoDebounce={true}
          />
        </div>

        {/* ── Onglets (si agent identifié) ──────────────────────────────────── */}
        {agent && (
          <>
            <div style={{
              display: "flex", gap: "8px", marginBottom: "20px",
              background: "#f1f5f9", padding: "5px", borderRadius: "14px"
            }}>
              {[
                { id: "BLANC",   emoji: "⬜", label: "Linge Blanc",   sub: "Lots triés",    color: "#10b981" },
                { id: "INFECTE", emoji: "🔴", label: "Linge Infecté", sub: "Sacs infectés", color: "#dc2626" },
              ].map(t => (
                <button key={t.id} onClick={() => setOnglet(t.id)} style={{
                  flex: 1, padding: "11px 16px", borderRadius: "10px",
                  border: "none", cursor: "pointer",
                  background: onglet === t.id ? "white" : "transparent",
                  transition: "all 0.2s",
                  boxShadow: onglet === t.id ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "10px"
                }}>
                  <span style={{ fontSize: "18px" }}>{t.emoji}</span>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 700, fontSize: "13px", color: onglet === t.id ? t.color : "#64748b" }}>
                      {t.label}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>{t.sub}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* ══ ONGLET BLANC ══════════════════════════════════════════════════ */}
            {onglet === "BLANC" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>

                {/* Colonne gauche */}
                <div>
                  {/* Attente machine */}
                  {etapeBlanc === "MACHINE" && (
                    <div style={{
                      textAlign: "center", padding: "40px",
                      background: "#f8fafc", borderRadius: "14px",
                      border: "2px dashed #e2e8f0", color: "#94a3b8"
                    }}>
                      <FaSoap size={36} style={{ opacity: 0.3, marginBottom: "12px" }} />
                      <div style={{ fontSize: "14px", fontWeight: 500 }}>
                        En attente du scan de la machine
                      </div>
                      <div style={{ fontSize: "12px", marginTop: "4px" }}>
                        Scannez le code de la machine dans le champ ci-dessus
                      </div>
                    </div>
                  )}

                  {/* Liste des lots */}
                  {(etapeBlanc === "LOTS" || etapeBlanc === "EN_COURS") && (
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
                          <FaBoxes color="#64748b" /> Lots prêts
                          <span style={{
                            background: "#e2e8f0", padding: "2px 8px",
                            borderRadius: "10px", fontSize: "11px", fontWeight: 500
                          }}>
                            {lotsFiltres.length}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchLot}
                            onChange={e => setSearchLot(e.target.value)}
                            onFocus={e => e.stopPropagation()} // ne pas voler le focus du ScanInput
                            style={{
                              padding: "6px 10px", borderRadius: "8px",
                              border: "1px solid #e2e8f0", fontSize: "12px",
                              outline: "none", width: "140px"
                            }}
                          />
                          <button onClick={chargerLots} style={{
                            padding: "6px 12px", borderRadius: "8px",
                            border: "1px solid #e2e8f0", background: "white",
                            color: "#64748b", cursor: "pointer", fontSize: "12px"
                          }}>
                            ↻
                          </button>
                        </div>
                      </div>

                      {loadingLots ? (
                        <div style={{ textAlign: "center", padding: "24px", color: "#94a3b8" }}>
                          <FaSpinner style={{ animation: "spin 1s linear infinite" }} /> Chargement...
                        </div>
                      ) : lotsFiltres.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8", fontSize: "13px" }}>
                          <FaBoxes size={30} style={{ opacity: 0.2, marginBottom: "8px" }} />
                          <div>Aucun lot disponible</div>
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
                              selectionne={!!lotsSelectionnes.find(ls => ls.lot.id === lot.id)}
                              onClick={(l) => {
                                const dejaSelectionne = !!lotsSelectionnes.find(ls => ls.lot.id === l.id);
                                if (dejaSelectionne) retirerLot(l.codeLot);
                                else scannerLot(l.codeLot, poidsTotal);
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Écran terminé */}
                  {etapeBlanc === "TERMINE" && (
                    <div style={{
                      textAlign: "center", padding: "48px 20px",
                      background: "#f0fdf4", borderRadius: "16px",
                      border: "2px solid #22c55e"
                    }}>
                      <div style={{ fontSize: "56px", marginBottom: "12px" }}>✅</div>
                      <div style={{ fontWeight: 800, fontSize: "20px", marginBottom: "8px", color: "#15803d" }}>
                        Lavage terminé !
                      </div>
                      <div style={{ color: "#64748b", marginBottom: "24px", fontSize: "14px" }}>
                        {lotsSelectionnes.length} lot(s) lavés avec succès
                      </div>
                      <button onClick={nouveauCycleBlanc} style={{
                        padding: "12px 28px", borderRadius: "10px", border: "none",
                        background: "linear-gradient(135deg,#10b981,#059669)",
                        color: "white", fontWeight: 700, cursor: "pointer", fontSize: "15px"
                      }}>
                        Nouveau cycle →
                      </button>
                    </div>
                  )}
                </div>

                {/* Colonne droite : RecapChargement */}
                <RecapChargement />
              </div>
            )}

            {/* ══ ONGLET INFECTÉ ════════════════════════════════════════════════ */}
            {onglet === "INFECTE" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px" }}>

                {/* Colonne gauche : liste sacs */}
                <div>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: "14px"
                  }}>
                    <div style={{
                      fontWeight: 600, fontSize: "14px", color: "#dc2626",
                      display: "flex", alignItems: "center", gap: "8px"
                    }}>
                      <FaBiohazard /> Sacs infectés
                      <span style={{
                        background: "#fee2e2", padding: "2px 8px",
                        borderRadius: "10px", fontSize: "11px", color: "#dc2626", fontWeight: 500
                      }}>
                        {sacsInfectes.length}
                      </span>
                    </div>
                    <button onClick={chargerSacsInfectes} style={{
                      padding: "6px 12px", borderRadius: "8px",
                      border: "1px solid #e2e8f0", background: "white",
                      color: "#64748b", cursor: "pointer", fontSize: "12px"
                    }}>
                      ↻ Actualiser
                    </button>
                  </div>

                  {loadingSacs ? (
                    <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                      <FaSpinner style={{ animation: "spin 1s linear infinite" }} /> Chargement...
                    </div>
                  ) : sacsInfectes.length === 0 ? (
                    <div style={{
                      textAlign: "center", padding: "48px 20px",
                      background: "#f8fafc", borderRadius: "14px",
                      border: "2px dashed #fca5a5", color: "#94a3b8"
                    }}>
                      <FaBiohazard size={36} style={{ opacity: 0.2, marginBottom: "10px" }} />
                      <div style={{ fontSize: "14px" }}>Aucun sac infecté en attente</div>
                      <div style={{ fontSize: "12px", marginTop: "4px" }}>
                        Scannez un sac ou actualisez la liste
                      </div>
                    </div>
                  ) : (
                    sacsInfectes.map(sac => (
                      <CarteSacInfecte key={sac.numeroSac} sac={sac} />
                    ))
                  )}
                </div>

                {/* Colonne droite : GuideSacInfecte */}
                <GuideSacInfecte />
              </div>
            )}

            {/* Footer */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginTop: "16px", paddingTop: "16px",
              borderTop: "1px solid #e2e8f0",
              fontSize: "12px", color: "#64748b", flexWrap: "wrap", gap: "8px"
            }}>
              <div style={{ display: "flex", gap: "16px" }}>
                {onglet === "BLANC" && (
                  <>
                    <span>⬜ Lots : <strong style={{ color: "#10b981" }}>{lotsSelectionnes.length}</strong></span>
                    <span>⚖️ Poids : <strong style={{ color: "#10b981" }}>{poidsTotal.toFixed(1)} kg</strong></span>
                  </>
                )}
                {onglet === "INFECTE" && (
                  <>
                    <span>🔴 Sacs : <strong style={{ color: "#dc2626" }}>{sacsInfectes.length}</strong></span>
                    <span>🫧 En lavage : <strong style={{ color: "#7c3aed" }}>
                      {sacsInfectes.filter(s => s.etat === "EN_LAVAGE").length}
                    </strong></span>
                  </>
                )}
              </div>
              <span style={{
                padding: "2px 10px", borderRadius: "8px",
                background: onglet === "BLANC" ? "#dbeafe" : "#fee2e2",
                color: onglet === "BLANC" ? "#0ea5e9" : "#dc2626",
                fontSize: "11px", fontWeight: 700
              }}>
                {onglet === "BLANC" ? "⬜ Linge Blanc" : "🔴 Linge Infecté"}
              </span>
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Export wrappé dans LavageProvider
// ─────────────────────────────────────────────────────────────────────────────
export default function LavageList() {
  return (
    <LavageProvider>
      <LavageInner />
    </LavageProvider>
  );
}
