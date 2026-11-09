import React from "react";
import { FaCheck } from "react-icons/fa";

/**
 * Bandeau d'étapes horizontal — partagé entre Collecte, Réception, Tri…
 * etapes : [{ id, label, done }]
 * etapeActive : string id de l'étape courante
 * couleurActive : couleur hex de l'étape active (défaut bleu)
 */
export default function EtapesStepper({ etapes, etapeActive, couleurActive = "#0ea5e9" }) {
  return (
    <div style={{
      display:"flex", gap:"6px", padding:"10px 14px",
      background:"#f1f5f9", borderRadius:"12px",
      alignItems:"center", flexWrap:"wrap"
    }}>
      <span style={{ fontWeight:600, fontSize:"12px", color:"#475569" }}>Étape :</span>
      {etapes.map((step, i) => {
        const isActive = etapeActive === step.id;
        const bg = isActive ? couleurActive : step.done ? "#22c55e" : "white";
        const color = (isActive || step.done) ? "white" : "#94a3b8";
        const border = isActive
          ? `2px solid ${couleurActive}`
          : step.done ? "2px solid #22c55e" : "1px solid #e2e8f0";
        return (
          <React.Fragment key={step.id}>
            <div style={{ display:"flex", alignItems:"center", gap:"5px", padding:"4px 12px", borderRadius:"16px", fontSize:"12px", fontWeight: isActive ? 700 : 500, background:bg, color, border }}>
              {step.done && <FaCheck size={9} />} {step.label}
            </div>
            {i < etapes.length - 1 && (
              <span style={{ color:"#cbd5e1", fontSize:"10px" }}>›</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
