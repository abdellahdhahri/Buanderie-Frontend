import React from "react";
import { FaBiohazard, FaExclamationTriangle } from "react-icons/fa";
import { useLavage } from "../../contextes/LavageContext";

const ETAPES = [
  { emoji: "📦", label: "Reçu",        action: "→ Vider en machine",           color: "#f59e0b", etat: "RECEPTIONNE"     },
  { emoji: "🫧", label: "En lavage",   action: "→ Attendre puis vérifier",     color: "#7c3aed", etat: "EN_LAVAGE"       },
  { emoji: "🔍", label: "Vérifier",    action: "→ Compter les linges propres", color: "#0ea5e9", etat: null              },
  { emoji: "📷", label: "Vérifié",     action: "→ Scanner les linges propres", color: "#22c55e", etat: "VERIFIE"         },
  { emoji: "🏁", label: "Terminé",     action: "→ Flux normal réintégré",      color: "#0f766e", etat: "LINGES_AFFECTES" },
];

/**
 * Colonne droite de l'onglet infecté.
 * Affiche le guide des étapes et les compteurs par état.
 */
export default function GuideSacInfecte() {
  const { sacsInfectes } = useLavage();

  const compteurs = [
    { label: "Reçus",     count: sacsInfectes.filter(s => s.etat === "RECEPTIONNE").length,   color: "#f59e0b" },
    { label: "En lavage", count: sacsInfectes.filter(s => s.etat === "EN_LAVAGE").length,     color: "#7c3aed" },
    { label: "Vérifiés",  count: sacsInfectes.filter(s => s.etat === "VERIFIE").length,       color: "#22c55e" },
    { label: "Écarts",    count: sacsInfectes.filter(s => s.etat === "ECART_DETECTE").length, color: "#ef4444" },
  ];

  return (
    <div style={{
      background: "white", borderRadius: "16px", padding: "18px",
      border: "1px solid #e2e8f0",
      boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
      position: "sticky", top: "20px"
    }}>

      {/* Titre */}
      <div style={{
        fontWeight: 700, fontSize: "14px", marginBottom: "14px",
        color: "#dc2626", display: "flex", alignItems: "center", gap: "8px"
      }}>
        <FaBiohazard /> Guide
      </div>

      {/* Étapes */}
      {ETAPES.map(({ emoji, label, action, color }) => (
        <div key={label} style={{
          display: "flex", gap: "10px", marginBottom: "10px",
          padding: "9px 12px", borderRadius: "9px", background: "#f8fafc"
        }}>
          <span style={{ fontSize: "16px", lineHeight: 1 }}>{emoji}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: "12px", color }}>{label}</div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>{action}</div>
          </div>
        </div>
      ))}

      {/* Avertissement */}
      <div style={{
        marginTop: "14px", padding: "10px 12px", background: "#fee2e2",
        borderRadius: "9px", fontSize: "11px", color: "#991b1b",
        fontWeight: 500, display: "flex", alignItems: "flex-start", gap: "8px"
      }}>
        <FaExclamationTriangle size={13} style={{ marginTop: "1px", flexShrink: 0 }} />
        Les sacs infectés ne doivent jamais être ouverts avant le lavage.
      </div>

      {/* Compteurs */}
      <div style={{
        marginTop: "14px",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px"
      }}>
        {compteurs.map(({ label, count, color }) => (
          <div key={label} style={{
            padding: "8px", background: "#f8fafc",
            borderRadius: "8px", textAlign: "center",
            border: "1px solid #f1f5f9"
          }}>
            <div style={{ fontWeight: 800, fontSize: "20px", color }}>{count}</div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
