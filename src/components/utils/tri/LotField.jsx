import React from "react";

/** Champ d'info lot dans TriList */
export default function LotField({ label, value, color }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
      <span style={{ fontSize:"10px", color:"#94a3b8", fontWeight:500 }}>{label}</span>
      <span style={{ fontSize:"13px", fontWeight:700, color: color || "#0f172a" }}>{value || "—"}</span>
    </div>
  );
}
