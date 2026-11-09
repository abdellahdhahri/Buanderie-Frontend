import React from "react";
import { FaVolumeUp, FaVolumeMute } from "react-icons/fa";

export default function MuteButton({ muted, onToggle, speaking, lang, onLangChange }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>

      {/* Indicateur parole en cours */}
      {speaking && !muted && (
        <div style={{ display:"flex", alignItems:"center", gap:5,
          padding:"4px 10px", borderRadius:20,
          background:"#ede9fe", border:"1px solid #c4b5fd" }}>
          <span style={{ display:"flex", gap:2, alignItems:"flex-end" }}>
            {[0.4, 0.7, 1, 0.7, 0.4].map((h, i) => (
              <span key={i} style={{
                display:"inline-block", width:3,
                height:`${h * 14}px`,
                background:"#7c3aed", borderRadius:2,
                animation:`wave 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
              }}/>
            ))}
          </span>
          <span style={{ fontSize:10, color:"#7c3aed", fontWeight:600 }}>
            IA parle...
          </span>
        </div>
      )}

      {/* Switch langue */}
      <div style={{ display:"flex", borderRadius:8,
        overflow:"hidden", border:"1px solid #e2e8f0" }}>
        {["fr","ar"].map(l => (
          <button key={l} onClick={() => onLangChange(l)}
            style={{ padding:"5px 11px", border:"none",
              fontSize:11, fontWeight:700, cursor:"pointer",
              background: lang === l ? "#7c3aed" : "white",
              color:      lang === l ? "white"   : "#64748b",
              transition:"all .15s" }}>
            {l === "fr" ? "🇫🇷 FR" : "🇸🇦 AR"}
          </button>
        ))}
      </div>

      {/* Bouton mute */}
      <button
        onClick={onToggle}
        title={muted ? "Activer le guide vocal" : "Couper le guide vocal"}
        style={{
          width:38, height:38, borderRadius:10,
          border:`2px solid ${muted ? "#e2e8f0" : "#7c3aed"}`,
          background: muted ? "#f8fafc" : "#ede9fe",
          cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          transition:"all .2s",
          position:"relative",
        }}
        onMouseEnter={e => e.currentTarget.style.opacity=".8"}
        onMouseLeave={e => e.currentTarget.style.opacity="1"}>
        {muted
          ? <FaVolumeMute size={16} color="#94a3b8"/>
          : <FaVolumeUp  size={16} color="#7c3aed"/>
        }
        {muted && (
          <span style={{ position:"absolute", top:-4, right:-4,
            width:10, height:10, borderRadius:"50%",
            background:"#ef4444", border:"2px solid white" }}/>
        )}
      </button>

      <style>{`
        @keyframes wave {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1);   }
        }
      `}</style>
    </div>
  );
}
