import React from "react";
import { FaCheckCircle, FaBarcode, FaBox, FaTimes } from "react-icons/fa";

/**
 * Panneau linge blanc dans l'écran de collecte.
 * Affiche la liste des linges scannés et les stats par catégorie.
 */
export default function PanneauBlanc({ items, rfidItems, mode, bacBlanc, statsCategorie, onSupprimer, onVider }) {
  const liste = mode === "RFID" ? rfidItems : items;
  const total = liste.length;

  return (
    <div style={{ background:"#f0fdf4", borderRadius:"12px", border:"2px solid #22c55e", padding:"16px", minHeight:"280px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <FaCheckCircle size={17} color="#22c55e" />
          <span style={{ fontWeight:700, fontSize:"15px", color:"#15803d" }}>BLANC</span>
          <span style={{ background:"#dcfce7", padding:"2px 10px", borderRadius:"12px", fontSize:"12px", fontWeight:600, color:"#15803d" }}>
            {total}
          </span>
        </div>
        <button onClick={onVider} disabled={total === 0}
          style={{ background:"none", border:"none", color:"#94a3b8", cursor:"pointer", opacity:total===0?0.3:1, fontSize:"12px", display:"flex", alignItems:"center", gap:"4px" }}>
          <FaTimes size={12} /> Vider
        </button>
      </div>

      {bacBlanc && (
        <div style={{ padding:"5px 10px", background:"#dcfce7", borderRadius:"8px", marginBottom:"8px", fontSize:"12px", color:"#065f46", display:"flex", alignItems:"center", gap:"6px" }}>
          <FaBox size={11} /> {bacBlanc.codeBac || bacBlanc.code}
        </div>
      )}

      {Object.keys(statsCategorie).length > 0 && (
        <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", marginBottom:"8px" }}>
          {Object.entries(statsCategorie).map(([cat, d]) => (
            <span key={cat} style={{ padding:"2px 8px", borderRadius:"10px", background:"#d1fae5", fontSize:"11px", fontWeight:600, color:"#065f46" }}>
              {cat}: {d.count}
            </span>
          ))}
        </div>
      )}

      <div style={{ maxHeight:"200px", overflowY:"auto" }}>
        {total === 0 ? (
          <div style={{ textAlign:"center", padding:"28px 0", color:"#94a3b8", fontSize:"13px" }}>
            <FaBarcode size={26} style={{ opacity:0.3, marginBottom:"8px" }} />
            <div>Scannez un linge blanc</div>
          </div>
        ) : (
          liste.map((item, i) => (
            <div key={item.codeBarre || item.rfidTag || i}
              style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 8px", background:"white", borderRadius:"6px", marginBottom:"3px", border:"1px solid #d1fae5" }}>
              <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                <span style={{ fontSize:"11px", color:"#94a3b8" }}>#{i+1}</span>
                <code style={{ fontSize:"12px", fontWeight:600, color:"#0ea5e9" }}>
                  {item.codeSuivi || item.codeBarre || item.rfidTag}
                </code>
                <span style={{ fontSize:"12px", color:"#475569" }}>{item.categorie || "NC"}</span>
              </div>
              <button onClick={() => onSupprimer(i)}
                style={{ background:"none", border:"none", color:"#94a3b8", cursor:"pointer" }}>
                <FaTimes size={10} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
