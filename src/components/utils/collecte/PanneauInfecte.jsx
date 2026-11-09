import React from "react";
import { FaBiohazard, FaPlus, FaMinus, FaTimes, FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { CAPACITE_SAC_KG } from "../../../constants/collecte";
import CarteSac from "./CarteSac";

/**
 * Panneau linge infecté dans l'écran de collecte.
 * Gère les sacs, la jauge de capacité, les boutons dialog/voix et la modification.
 */
export default function PanneauInfecte({
  sacsInfectes, sacActifIndex, rfidInfecte, mode,
  voix,
  onOuvrirDialog, onModifier, onSupprimer, onImprimer,
}) {
  const sacActif    = sacsInfectes[sacActifIndex];
  const sacActifPct = Math.min((sacActif?.poidsEstime || 0) / CAPACITE_SAC_KG * 100, 100);
  const totalArt    = mode === "RFID"
    ? rfidInfecte.length
    : sacsInfectes.reduce((t, s) => t + s.items.reduce((a, i) => a + i.quantite, 0), 0);

  return (
    <div style={{ background:"#fef2f2", borderRadius:"12px", border:"2px solid #ef4444", padding:"16px", minHeight:"280px" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <FaBiohazard size={17} color="#ef4444" />
          <span style={{ fontWeight:700, fontSize:"15px", color:"#dc2626" }}>INFECTÉ</span>
          <span style={{ background:"#fee2e2", padding:"2px 10px", borderRadius:"12px", fontSize:"12px", fontWeight:600, color:"#dc2626" }}>
            {totalArt} · {sacsInfectes.filter(s => s.items.length > 0).length} sac(s)
          </span>
        </div>
      </div>

      {/* Jauge sac actif */}
      <div style={{ marginBottom:"10px", padding:"10px 12px", background:"white", borderRadius:"10px", border:`2px solid ${sacActifPct>=100?"#f97316":sacActifPct>=80?"#ef4444":"#fca5a5"}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"11px", fontWeight:600, marginBottom:"4px" }}>
          <span style={{ color:"#dc2626" }}>🎽 Sac #{sacActifIndex + 1}</span>
          <span style={{ color:sacActifPct>=80?"#f97316":"#dc2626" }}>
            ~{(sacActif?.poidsEstime || 0).toFixed(1)} / {CAPACITE_SAC_KG} kg
          </span>
        </div>
        <div style={{ height:"9px", background:"#fee2e2", borderRadius:"4px", overflow:"hidden" }}>
          <div style={{ height:"100%", borderRadius:"4px", width:`${sacActifPct}%`, background:sacActifPct>=100?"#f97316":sacActifPct>=80?"#ef4444":"#fca5a5", transition:"width 0.4s" }} />
        </div>
        {sacActifPct >= 80 && sacActifPct < 100 && (
          <div style={{ fontSize:"10px", color:"#f97316", fontWeight:600, marginTop:"3px" }}>⚠️ Sac presque plein</div>
        )}
      </div>

      {/* Boutons ajouter + voix */}
      <div style={{ display:"flex", gap:"8px", marginBottom:"10px" }}>
        <button onClick={onOuvrirDialog}
          style={{ flex:1, padding:"12px 8px", borderRadius:"10px", border:"2px dashed #ef4444", background:"#fff5f5", color:"#dc2626", fontWeight:700, fontSize:"13px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
          <FaPlus size={13} /> Ajouter
        </button>
        <button
          onClick={voix.actif ? voix.arreter : voix.demarrer}
          style={{
            padding:"12px 14px", borderRadius:"10px", border:"none", cursor:"pointer",
            background: voix.actif ? "#ef4444" : "#fee2e2",
            color:      voix.actif ? "white"   : "#dc2626",
            fontWeight:700, fontSize:"12px",
            display:"flex", alignItems:"center", gap:"6px",
            animation:  voix.actif ? "pulseMic 1s infinite" : "none",
            boxShadow:  voix.actif ? "0 0 0 4px rgba(239,68,68,0.2)" : "none",
          }}>
          {voix.actif ? <FaMicrophone size={16} /> : <FaMicrophoneSlash size={16} />}
          {voix.actif ? "Écoute..." : "Voix"}
        </button>
      </div>

      {/* Transcript en temps réel */}
      {voix.actif && voix.transcript && (
        <div style={{ padding:"8px 12px", background:"#fee2e2", borderRadius:"8px", marginBottom:"10px", fontSize:"12px", color:"#dc2626", fontStyle:"italic", display:"flex", alignItems:"center", gap:"8px" }}>
          <FaMicrophone size={12} /> "{voix.transcript}"
        </div>
      )}

      {/* Aide vocale */}
      {!voix.actif && (
        <div style={{ fontSize:"11px", color:"#94a3b8", marginBottom:"10px", padding:"6px 10px", background:"white", borderRadius:"8px", border:"1px solid #fecaca" }}>
          🎤 Dites : <em>"3 draps et 2 taies"</em> · <em>"annule"</em> pour supprimer
        </div>
      )}

      {/* RFID infecté */}
      {mode === "RFID" && (
        <div style={{ maxHeight:"160px", overflowY:"auto" }}>
          {rfidInfecte.length === 0 ? (
            <div style={{ textAlign:"center", padding:"20px 0", color:"#94a3b8", fontSize:"13px" }}>
              <FaBiohazard size={22} style={{ opacity:0.2, marginBottom:"6px" }} />
              <div>En attente des tags RFID infectés</div>
            </div>
          ) : rfidInfecte.map((item, i) => (
            <div key={item.rfidTag || i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 8px", background:"white", borderRadius:"6px", marginBottom:"3px", border:"1px solid #fecaca" }}>
              <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                <span style={{ fontSize:"11px", color:"#94a3b8" }}>#{i+1}</span>
                <code style={{ fontSize:"12px", fontWeight:600, color:"#dc2626" }}>{item.rfidTag || item.codeBarre}</code>
                <span style={{ fontSize:"12px", color:"#475569" }}>{item.categorie || "NC"}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mode code-barres : liste sacs */}
      {mode !== "RFID" && (
        <>
          <div style={{ maxHeight:"180px", overflowY:"auto" }}>
            {sacsInfectes.every(s => s.items.length === 0) ? (
              <div style={{ textAlign:"center", padding:"20px 0", color:"#94a3b8", fontSize:"13px" }}>
                <FaBiohazard size={22} style={{ opacity:0.2, marginBottom:"6px" }} />
                <div>Appuyez sur Ajouter ou parlez</div>
              </div>
            ) : (
              sacsInfectes.map((sac, i) => sac.items.length > 0 && (
                <CarteSac key={i} sac={sac} index={i} estActif={i === sacActifIndex} onImprimer={onImprimer} />
              ))
            )}
          </div>

          {/* Modification quantité sac actif */}
          {sacActif?.items.length > 0 && (
            <div style={{ marginTop:"8px", borderTop:"1px solid #fecaca", paddingTop:"8px" }}>
              <div style={{ fontSize:"11px", color:"#991b1b", fontWeight:600, marginBottom:"6px" }}>✏️ Modifier sac #{sacActifIndex + 1} :</div>
              {sacActif.items.map(item => (
                <div key={item.categorie} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 8px", background:"white", borderRadius:"6px", marginBottom:"3px", border:`1px solid ${item.border || "#fca5a5"}` }}>
                  <span style={{ fontSize:"12px", fontWeight:600, color:item.color }}>{item.emoji} {item.label}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                    <button onClick={() => onModifier(item.categorie, -1)}
                      style={{ width:"20px", height:"20px", borderRadius:"50%", border:`1px solid ${item.color}44`, background:item.bg, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:item.color }}>
                      <FaMinus size={8} />
                    </button>
                    <span style={{ fontWeight:700, color:item.color, minWidth:"18px", textAlign:"center", fontSize:"14px" }}>{item.quantite}</span>
                    <button onClick={() => onModifier(item.categorie, 1)}
                      style={{ width:"20px", height:"20px", borderRadius:"50%", border:`1px solid ${item.color}44`, background:item.bg, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:item.color }}>
                      <FaPlus size={8} />
                    </button>
                    <button onClick={() => onSupprimer(item.categorie)}
                      style={{ background:"#fee2e2", border:"none", color:"#ef4444", cursor:"pointer", padding:"2px 5px", borderRadius:"4px" }}>
                      <FaTimes size={9} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
