import React from "react";
import { FaLayerGroup, FaCheckCircle, FaWeight, FaBoxes } from "react-icons/fa";

function EtatBadge({ etat }) {
  const MAP = {
    EN_TRI:    { label: "Trié",      color: "#0ea5e9", bg: "#e0f2fe" },
    EN_LAVAGE: { label: "En lavage", color: "#7c3aed", bg: "#ede9fe" },
    FERME:     { label: "Fermé",     color: "#64748b", bg: "#f1f5f9" },
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
 * Carte d'un lot dans la liste des lots disponibles.
 * Cliquable pour ouvrir LotInfoDialog et l'ajouter au chargement.
 */
export default function CarteLot({ lot, selectionne, onClick }) {
  return (
    <div
      onClick={() => onClick(lot)}
      style={{
        padding: "14px 16px", borderRadius: "12px", cursor: "pointer",
        border: selectionne ? "2px solid #10b981" : "1.5px solid #e2e8f0",
        background: selectionne ? "#f0fdf4" : "white",
        transition: "all 0.2s",
        boxShadow: selectionne
          ? "0 4px 14px rgba(16,185,129,0.12)"
          : "0 2px 6px rgba(0,0,0,0.04)"
      }}
    >
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: "8px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "9px",
            background: selectionne ? "#d1fae5" : "#f1f5f9",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <FaLayerGroup size={15} color={selectionne ? "#10b981" : "#64748b"} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "13px", color: "#0f172a" }}>
              {lot.codeLot}
            </div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>
              {lot.categorie} · {lot.typeCollecte}
            </div>
          </div>
        </div>
        {selectionne
          ? <FaCheckCircle size={16} color="#10b981" />
          : <EtatBadge etat={lot.etat} />}
      </div>

      <div style={{ display: "flex", gap: "14px", fontSize: "12px", color: "#64748b" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <FaWeight size={10} /> {lot.poidsActuel?.toFixed(1) || 0} kg
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <FaBoxes size={10} /> {lot.nbLinges || "—"} pcs
        </span>
      </div>
    </div>
  );
}
