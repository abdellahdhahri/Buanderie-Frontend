import React from "react";

/** Carte statistique utilisée dans TriList */
export default function StatCard({ value, label, color }) {
  return (
    <div style={{ background:"white", borderRadius:"12px", padding:"14px 18px", border:"1px solid #f1f5f9", boxShadow:"0 2px 6px rgba(0,0,0,0.04)", textAlign:"center" }}>
      <div style={{ fontWeight:800, fontSize:"24px", color: color || "#0f172a" }}>{value}</div>
      <div style={{ fontSize:"11px", color:"#94a3b8", marginTop:"4px" }}>{label}</div>
    </div>
  );
}
