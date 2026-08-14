import React, { useState } from "react";
import { FaBiohazard, FaSoap, FaPlus, FaMinus } from "react-icons/fa";
import { useLavage } from "../../contextes/LavageContext";

function EtatBadge({ etat }) {
  const MAP = {
    RECEPTIONNE:     { label: "Reçu",       color: "#f59e0b", bg: "#fef3c7" },
    EN_LAVAGE:       { label: "En lavage",  color: "#7c3aed", bg: "#ede9fe" },
    VERIFIE:         { label: "Vérifié ✅", color: "#22c55e", bg: "#dcfce7" },
    ECART_DETECTE:   { label: "Écart ⚠️",  color: "#ef4444", bg: "#fee2e2" },
    LINGES_AFFECTES: { label: "Terminé 🏁", color: "#0f766e", bg: "#ccfbf1" },
  };
  const s = MAP[etat] || { label: etat, color: "#64748b", bg: "#f1f5f9" };
  return (
    <span style={{
      padding: "2px 10px", borderRadius: "12px",
      fontSize: "11px", fontWeight: 700,
      color: s.color, background: s.bg
    }}>
      {s.label}
    </span>
  );
}

/**
 * Carte d'un sac infecté.
 * Affiche les infos du sac, le comptage inline post-lavage,
 * et les actions contextuelles selon l'état.
 */
export default function CarteSacInfecte({ sac }) {
  const { laverSac, verifierSac, setScanPropresNumerosac } = useLavage();
  const [showComptage, setShowComptage] = useState(false);
  const [comptage,     setComptage]     = useState({});

  const ajusterComptage = (cat, delta) => {
    setComptage(prev => {
      const base = prev[cat] ?? (sac.items?.find(i => i.categorie === cat)?.quantiteDeclaree ?? 0);
      return { ...prev, [cat]: Math.max(0, base + delta) };
    });
  };

  const handleValiderComptage = () => {
    const itemsComptes = (sac.items || []).map(i => ({
      categorie:       i.categorie,
      quantiteComptee: comptage[i.categorie] ?? i.quantiteDeclaree,
    }));
    verifierSac(sac.numeroSac, itemsComptes);
    setShowComptage(false);
    setComptage({});
  };

  return (
    <div style={{
      padding: "16px", borderRadius: "14px", marginBottom: "10px",
      border: sac.etat === "EN_LAVAGE" ? "2px solid #8b5cf6" : "1.5px solid #fca5a5",
      background: sac.etat === "EN_LAVAGE" ? "#faf5ff" : "#fff8f8",
      transition: "all 0.2s"
    }}>

      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: "10px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FaBiohazard size={15} color="#dc2626" />
          <span style={{ fontWeight: 700, fontSize: "13px", color: "#dc2626" }}>
            {sac.numeroSac}
          </span>
        </div>
        <EtatBadge etat={sac.etat} />
      </div>

      {/* Infos */}
      <div style={{
        fontSize: "12px", color: "#64748b", marginBottom: "10px",
        display: "flex", flexWrap: "wrap", gap: "10px"
      }}>
        <span>🏥 {sac.serviceNom}</span>
        <span>👤 {sac.agentCollecteNom}</span>
        <span>📦 {sac.quantiteDeclaree} article(s)</span>
      </div>

      {/* Items déclarés + comptés */}
      {sac.items?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "12px" }}>
          {sac.items.map((item, j) => (
            <span key={j} style={{
              padding: "2px 9px", borderRadius: "10px",
              background: "#fee2e2", color: "#991b1b",
              fontSize: "11px", fontWeight: 600
            }}>
              {item.categorie}: {item.quantiteDeclaree}
              {item.quantiteComptee != null && (
                <span style={{
                  marginLeft: "4px",
                  color: item.ecart === 0 ? "#22c55e" : "#ef4444"
                }}>
                  → {item.quantiteComptee}
                  {item.ecart !== 0 && ` (${item.ecart > 0 ? "+" : ""}${item.ecart})`}
                  {item.ecart === 0 && " ✓"}
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Panneau comptage post-lavage */}
      {showComptage && (
        <div style={{
          background: "white", borderRadius: "10px", padding: "14px",
          marginBottom: "12px", border: "1px solid #fecaca"
        }}>
          <div style={{
            fontWeight: 700, fontSize: "13px",
            color: "#991b1b", marginBottom: "12px"
          }}>
            🔍 Comptage après lavage
          </div>

          {(sac.items || []).map(item => (
            <div key={item.categorie} style={{
              display: "flex", alignItems: "center",
              gap: "10px", marginBottom: "8px"
            }}>
              <span style={{ flex: 1, fontSize: "13px", color: "#475569", fontWeight: 500 }}>
                {item.categorie}
              </span>
              <span style={{ fontSize: "11px", color: "#94a3b8", minWidth: "80px" }}>
                déclaré : {item.quantiteDeclaree}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  onClick={() => ajusterComptage(item.categorie, -1)}
                  style={{
                    width: "26px", height: "26px", borderRadius: "50%",
                    border: "1px solid #fca5a5", background: "#fee2e2",
                    cursor: "pointer", display: "flex", alignItems: "center",
                    justifyContent: "center", color: "#dc2626"
                  }}
                >
                  <FaMinus size={9} />
                </button>
                <span style={{
                  fontWeight: 800, fontSize: "16px", color: "#dc2626",
                  minWidth: "24px", textAlign: "center"
                }}>
                  {comptage[item.categorie] ?? item.quantiteDeclaree}
                </span>
                <button
                  onClick={() => ajusterComptage(item.categorie, 1)}
                  style={{
                    width: "26px", height: "26px", borderRadius: "50%",
                    border: "1px solid #fca5a5", background: "#fee2e2",
                    cursor: "pointer", display: "flex", alignItems: "center",
                    justifyContent: "center", color: "#dc2626"
                  }}
                >
                  <FaPlus size={9} />
                </button>
              </div>
            </div>
          ))}

          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <button
              onClick={handleValiderComptage}
              style={{
                flex: 1, padding: "9px", borderRadius: "9px", border: "none",
                background: "#22c55e", color: "white",
                fontWeight: 700, fontSize: "13px", cursor: "pointer"
              }}
            >
              ✅ Valider le comptage
            </button>
            <button
              onClick={() => { setShowComptage(false); setComptage({}); }}
              style={{
                padding: "9px 14px", borderRadius: "9px",
                border: "1px solid #e2e8f0", background: "white",
                color: "#64748b", cursor: "pointer", fontSize: "13px"
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Actions contextuelles */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {sac.etat === "RECEPTIONNE" && (
          <button
            onClick={() => laverSac(sac.numeroSac)}
            style={{
              padding: "7px 16px", borderRadius: "8px", border: "none",
              background: "#7c3aed", color: "white",
              fontWeight: 700, fontSize: "12px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "6px"
            }}
          >
            <FaSoap size={11} /> Vider en machine
          </button>
        )}

        {sac.etat === "EN_LAVAGE" && !showComptage && (
          <button
            onClick={() => setShowComptage(true)}
            style={{
              padding: "7px 16px", borderRadius: "8px", border: "none",
              background: "#f59e0b", color: "white",
              fontWeight: 700, fontSize: "12px", cursor: "pointer"
            }}
          >
            🔍 Vérifier après lavage
          </button>
        )}

        {(sac.etat === "VERIFIE" || sac.etat === "ECART_DETECTE") && (
          <button
            onClick={() => setScanPropresNumerosac(sac.numeroSac)}
            style={{
              padding: "7px 16px", borderRadius: "8px", border: "none",
              background: "#0ea5e9", color: "white",
              fontWeight: 700, fontSize: "12px", cursor: "pointer"
            }}
          >
            📷 Scanner linges propres
          </button>
        )}

        {sac.etat === "LINGES_AFFECTES" && (
          <span style={{
            fontSize: "12px", color: "#0f766e",
            fontWeight: 600, padding: "7px 0"
          }}>
            🏁 {sac.nombreLingesAffectes} linge(s) réintégré(s)
          </span>
        )}
      </div>
    </div>
  );
}
