import React from "react";
import { FaBarcode, FaWifi } from "react-icons/fa";

/**
 * Toggle Code-barres / RFID — partagé entre Collecte, Réception, Tri…
 */
export default function ModeToggle({ mode, onChange }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"6px", padding:"5px", background:"#f1f5f9", borderRadius:"10px" }}>
      <button
        onClick={() => onChange("BARCODE")}
        style={{
          display:"flex", alignItems:"center", gap:"6px",
          padding:"7px 14px", borderRadius:"8px", border:"none",
          cursor:"pointer", fontWeight:700, fontSize:"12px", transition:"all 0.2s",
          background: mode === "BARCODE" ? "white" : "transparent",
          color:      mode === "BARCODE" ? "#0ea5e9" : "#94a3b8",
          boxShadow:  mode === "BARCODE" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
        }}
      >
        <FaBarcode size={14} /> Code-barres
      </button>
      <button
        onClick={() => onChange("RFID")}
        style={{
          display:"flex", alignItems:"center", gap:"6px",
          padding:"7px 14px", borderRadius:"8px", border:"none",
          cursor:"pointer", fontWeight:700, fontSize:"12px", transition:"all 0.2s",
          background: mode === "RFID" ? "#7c3aed" : "transparent",
          color:      mode === "RFID" ? "white"   : "#94a3b8",
          boxShadow:  mode === "RFID" ? "0 2px 8px rgba(124,58,237,0.3)" : "none",
        }}
      >
        <FaWifi size={14} /> RFID
      </button>
    </div>
  );
}
