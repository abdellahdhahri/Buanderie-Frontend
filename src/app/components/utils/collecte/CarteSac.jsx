import React from "react";
import { FaTicketAlt, FaPrint } from "react-icons/fa";
import { CAPACITE_SAC_KG } from "../../../constants/collecte";

/**
 * Carte d'un sac infecté dans l'écran de collecte.
 * Affiche poids, articles et bouton d'impression.
 */
export default function CarteSac({ sac, index, onImprimer, estActif }) {
  const total = sac.items.reduce((a, i) => a + i.quantite, 0);
  const pct   = Math.min((sac.poidsEstime / CAPACITE_SAC_KG) * 100, 100);
  const estPlein = sac.poidsEstime >= CAPACITE_SAC_KG;

  return (
    <div style={{
      border:`2px solid ${estActif ? "#ef4444" : estPlein ? "#f97316" : "#fca5a5"}`,
      borderRadius:"12px", padding:"12px",
      background: estActif ? "#fff5f5" : estPlein ? "#fff7ed" : "white",
      marginBottom:"10px", position:"relative"
    }}>
      {estActif && (
        <div style={{ position:"absolute", top:"-10px", left:"12px", background:"#ef4444", color:"white", fontSize:"10px", fontWeight:700, padding:"2px 8px", borderRadius:"10px" }}>
          SAC EN COURS
        </div>
      )}
      {estPlein && !estActif && (
        <div style={{ position:"absolute", top:"-10px", left:"12px", background:"#f97316", color:"white", fontSize:"10px", fontWeight:700, padding:"2px 8px", borderRadius:"10px" }}>
          ✅ SAC FERMÉ
        </div>
      )}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
          <FaTicketAlt size={13} color="#dc2626" />
          <span style={{ fontWeight:700, fontSize:"13px", color:"#dc2626" }}>Sac #{index + 1}</span>
          <span style={{ fontSize:"11px", color:"#64748b" }}>— {total} art.</span>
        </div>
        <button onClick={() => onImprimer(sac, index)}
          style={{ background:"#fef2f2", border:"1px solid #fca5a5", color:"#dc2626", borderRadius:"6px", padding:"3px 8px", cursor:"pointer", fontSize:"11px", display:"flex", alignItems:"center", gap:"4px" }}>
          <FaPrint size={10} /> Ticket
        </button>
      </div>

      <div style={{ marginBottom:"8px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"11px", marginBottom:"3px" }}>
          <span style={{ color:"#64748b" }}>⚖️ Poids</span>
          <span style={{ fontWeight:700, color:pct>=90?"#f97316":"#dc2626" }}>
            ~{sac.poidsEstime.toFixed(1)} / {CAPACITE_SAC_KG} kg
          </span>
        </div>
        <div style={{ height:"8px", background:"#fee2e2", borderRadius:"4px", overflow:"hidden" }}>
          <div style={{ height:"100%", borderRadius:"4px", width:`${pct}%`, background:pct>=100?"#f97316":pct>=80?"#ef4444":"#fca5a5", transition:"width 0.4s" }} />
        </div>
      </div>

      <div style={{ display:"flex", flexWrap:"wrap", gap:"4px" }}>
        {sac.items.map((item, j) => (
          <span key={j} style={{ padding:"2px 8px", borderRadius:"10px", background:item.bg, color:item.color, fontSize:"11px", fontWeight:600, border:`1px solid ${item.border||"#fca5a5"}` }}>
            {item.emoji} {item.label}: {item.quantite}
          </span>
        ))}
      </div>
    </div>
  );
}
