import React from "react";
import { FaSoap, FaPlay, FaStop, FaTimes, FaLayerGroup, FaSpinner } from "react-icons/fa";
import { useLavage } from "../../contextes/LavageContext";
import MinuteurLavage from "./MinuteurLavage";

const couleurJauge = (pct) =>
  pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#10b981";

/**
 * Colonne droite sticky — récapitulatif du chargement machine.
 * Affiche : jauge capacité, liste des lots sélectionnés, bouton Démarrer/Fin.
 */
export default function RecapChargement() {
  const {
    machine, lotsSelectionnes, retirerLot,
    poidsTotal, pctCharge, etapeBlanc, cycleId, cycleInfo,
    demarrerLavage, terminerLavage, loading,
  } = useLavage();

  const couleur = couleurJauge(pctCharge);

  return (
    <div style={{
      background: "white", borderRadius: "16px", padding: "20px",
      border: "1px solid #e2e8f0",
      boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
      position: "sticky", top: "20px"
    }}>
      <div style={{
        fontWeight: 700, fontSize: "14px", marginBottom: "14px",
        display: "flex", alignItems: "center", gap: "8px"
      }}>
        <FaSoap color="#0ea5e9" /> Chargement machine
      </div>

      {/* Jauge capacité */}
      {machine && (
        <div style={{ marginBottom: "14px" }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: "12px", fontWeight: 600, marginBottom: "5px"
          }}>
            <span style={{ color: "#64748b" }}>{machine.code}</span>
            <span style={{ color: couleur }}>
              {poidsTotal.toFixed(1)} / {machine.capaciteKg} kg
            </span>
          </div>
          <div style={{ height: "10px", background: "#f1f5f9", borderRadius: "5px", overflow: "hidden" }}>
            <div style={{
              width: `${pctCharge}%`, height: "100%",
              borderRadius: "5px", background: couleur,
              transition: "width 0.4s ease"
            }} />
          </div>
          {pctCharge >= 90 && (
            <div style={{ fontSize: "11px", color: "#ef4444", fontWeight: 600, marginTop: "4px" }}>
              ⚠️ Capacité presque atteinte
            </div>
          )}
        </div>
      )}

      {/* Liste lots sélectionnés */}
      {lotsSelectionnes.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "20px 0",
          color: "#94a3b8", fontSize: "13px"
        }}>
          <FaLayerGroup size={24} style={{ opacity: 0.2, marginBottom: "8px" }} />
          <div>Aucun lot sélectionné</div>
          <div style={{ fontSize: "11px", marginTop: "4px" }}>
            Scannez ou cliquez sur un lot
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
          {lotsSelectionnes.map(({ lot, scanInfo }) => (
            <div key={lot.codeLot} style={{
              padding: "9px 12px", background: "#f8fafc",
              borderRadius: "9px", border: "1px solid #e2e8f0",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "12px" }}>{lot.codeLot}</div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  {lot.categorie} · {lot.poidsActuel?.toFixed(1) || 0} kg
                  {scanInfo?.temperature && (
                    <span style={{ color: "#22c55e", marginLeft: "6px" }}>
                      · {scanInfo.temperature}°C
                    </span>
                  )}
                </div>
              </div>
              {etapeBlanc === "LOTS" && (
                <button
                  onClick={() => retirerLot(lot.codeLot)}
                  style={{
                    background: "none", border: "none",
                    color: "#94a3b8", cursor: "pointer", padding: "4px"
                  }}
                >
                  <FaTimes size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bouton Démarrer */}
      {etapeBlanc === "LOTS" && (
        <button
          onClick={() => demarrerLavage(poidsTotal)}
          disabled={loading || lotsSelectionnes.length === 0}
          style={{
            width: "100%", padding: "13px", borderRadius: "10px", border: "none",
            background: lotsSelectionnes.length === 0
              ? "#e2e8f0"
              : "linear-gradient(135deg,#10b981,#059669)",
            color: lotsSelectionnes.length === 0 ? "#94a3b8" : "white",
            fontWeight: 800, fontSize: "14px",
            cursor: lotsSelectionnes.length === 0 ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
          }}
        >
          {loading
            ? <FaSpinner style={{ animation: "spin 1s linear infinite" }} />
            : <FaPlay size={13} />}
          Démarrer le lavage
        </button>
      )}

      {/* Minuteur + Bouton Fin */}
      {etapeBlanc === "EN_COURS" && (
        <>
          <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500, marginBottom: "8px" }}>
            Cycle #{cycleId} en cours
          </div>
          {cycleInfo && (
            <MinuteurLavage
              dateDebut={cycleInfo.dateDebut}
              dureePrevue={cycleInfo.dureePrevue}
              programme={cycleInfo.programme}
              temperature={cycleInfo.temperature}
              vitesse={cycleInfo.vitesse}
            />
          )}
          <button
            onClick={terminerLavage}
            disabled={loading}
            style={{
              width: "100%", padding: "13px", borderRadius: "10px", border: "none",
              background: "linear-gradient(135deg,#ef4444,#dc2626)",
              color: "white", fontWeight: 800, fontSize: "14px", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
            }}>
            <FaStop size={13} /> Fin du lavage
          </button>
        </>
      )}

      {/* Récap bas */}
      {lotsSelectionnes.length > 0 && (
        <div style={{
          marginTop: "10px", padding: "8px 12px", background: "#f8fafc",
          borderRadius: "8px", fontSize: "12px", color: "#64748b",
          display: "flex", justifyContent: "space-between"
        }}>
          <span>{lotsSelectionnes.length} lot(s)</span>
          <span>{poidsTotal.toFixed(1)} kg</span>
          <span>
            {lotsSelectionnes.reduce((s, ls) => s + (ls.lot.nbLinges || 0), 0)} pcs
          </span>
        </div>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
