import React from "react";
import { FaUser } from "react-icons/fa";

/**
 * Zone de validation par badge — remplace tout bouton de soumission.
 * L'agent scanne son badge pour déclencher la collecte automatiquement.
 */
export default function ZoneValidationBadge({ totalBlanc, totalInfecte, scanValue, onChange, inputRef, collecteEnCours }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"12px" }}>
      {/* Message visuel */}
      <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"14px 20px", background:"#f0fdf4", borderRadius:"12px", border:"2px solid #22c55e", width:"100%", boxSizing:"border-box" }}>
        <div style={{ width:"42px", height:"42px", borderRadius:"50%", background:"#22c55e", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <FaUser size={20} color="white" />
        </div>
        <div>
          <div style={{ fontWeight:800, fontSize:"15px", color:"#15803d" }}>
            Scannez votre badge pour valider
          </div>
          <div style={{ fontSize:"12px", color:"#16a34a" }}>
            {totalBlanc} blanc(s) · {totalInfecte} infecté(s) prêts à envoyer
          </div>
        </div>
        {collecteEnCours && (
          <div style={{ marginLeft:"auto", fontSize:"12px", color:"#16a34a", fontWeight:600 }}>
            ⏳ Envoi...
          </div>
        )}
      </div>

      {/* Input badge */}
      <input
        ref={inputRef}
        type="text"
        placeholder="👤 Badge agent..."
        value={scanValue}
        onChange={e => onChange(e.target.value)}
        autoFocus
        style={{
          width:"100%", padding:"13px 14px",
          borderRadius:"10px", border:"2px solid #22c55e",
          fontSize:"14px", outline:"none", boxSizing:"border-box",
          boxShadow:"0 0 0 3px rgba(34,197,94,0.15)"
        }}
      />
    </div>
  );
}
