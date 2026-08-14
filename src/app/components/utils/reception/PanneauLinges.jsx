import React from "react";
import { Loader } from "lucide-react";
import { Package } from "lucide-react";

/**
 * Panneau affichant la liste des linges d'un bac reçu.
 * Utilisé dans ReceptionList pour la vue détail bac.
 */
export default function PanneauLinges({ linges, titre, bacCode, isLoading, onClose }) {
  if (isLoading) {
    return (
      <div style={{ padding:"30px", background:"#f8fafc", borderRadius:"12px", textAlign:"center", color:"#94a3b8" }}>
        <Loader size={32} style={{ animation:"spin 1s linear infinite", marginBottom:"12px" }} />
        <div>Chargement...</div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!linges || linges.length === 0) {
    return (
      <div style={{ padding:"20px", background:"#f8fafc", borderRadius:"12px", textAlign:"center", color:"#94a3b8" }}>
        <Package size={32} style={{ marginBottom:"8px", opacity:0.4 }} />
        <div style={{ fontSize:"14px" }}>Aucun linge dans ce bac</div>
        {onClose && (
          <button onClick={onClose} style={{ marginTop:"12px", padding:"6px 16px", borderRadius:"8px", border:"1px solid #e2e8f0", background:"white", color:"#64748b", cursor:"pointer", fontSize:"13px" }}>
            Fermer
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ background:"white", borderRadius:"12px", border:"1px solid #e2e8f0", overflow:"hidden" }}>
      <div style={{ padding:"12px 16px", background:"#f8fafc", borderBottom:"1px solid #e2e8f0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <span style={{ fontWeight:700, fontSize:"14px" }}>{titre || "Linges du bac"}</span>
          {bacCode && <span style={{ marginLeft:"8px", fontSize:"12px", color:"#64748b" }}>({bacCode})</span>}
          <span style={{ marginLeft:"8px", background:"#e2e8f0", padding:"1px 8px", borderRadius:"10px", fontSize:"11px", fontWeight:600, color:"#64748b" }}>
            {linges.length}
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#94a3b8", cursor:"pointer", fontSize:"18px" }}>×</button>
        )}
      </div>
      <div style={{ maxHeight:"300px", overflowY:"auto" }}>
        {linges.map((linge, i) => (
          <div key={linge.id || i} style={{ display:"flex", gap:"12px", padding:"8px 16px", borderBottom:"1px solid #f1f5f9", fontSize:"13px", alignItems:"center" }}>
            <span style={{ color:"#94a3b8", minWidth:"24px" }}>#{i+1}</span>
            <code style={{ fontWeight:600, color:"#0ea5e9", minWidth:"100px" }}>{linge.codeBarre || linge.codeSuivi}</code>
            <span style={{ color:"#475569", flex:1 }}>{linge.categorie}</span>
            <span style={{ padding:"2px 8px", borderRadius:"8px", fontSize:"11px", fontWeight:600, background:"#f1f5f9", color:"#64748b" }}>{linge.etat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
