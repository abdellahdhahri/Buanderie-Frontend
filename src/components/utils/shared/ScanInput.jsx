import React, { useRef, useEffect } from "react";
import { FaBarcode, FaTimes } from "react-icons/fa";
import { useAutoScan } from "../../../hooks/useAutoScan";
import { usePermanentFocus } from "../../../hooks/usePermanentFocus";
import { bipScan } from "../../../utils/appSettings";

/**
 * Input de scan universel.
 * - Focus permanent (keepFocus)
 * - Debounce auto 400ms (autoDebounce)
 * - Effacement automatique après soumission
 */
export default function ScanInput({
  placeholder,
  value,
  onChange,
  onSubmit,
  borderColor = "#0ea5e9",
  disabled    = false,
  keepFocus   = true,
  autoDebounce = true,
  icon,
}) {
  const inputRef = useRef(null);

  usePermanentFocus(inputRef, keepFocus && !disabled);
  useAutoScan(value, (code) => { onSubmit(code); onChange(""); }, { enabled: autoDebounce && !disabled });

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = value.trim();
    if (code) { bipScan(); onSubmit(code); onChange(""); }
  };

  return (
    <form onSubmit={handleSubmit} style={{ margin:0 }}>
      <div style={{ position:"relative" }}>
        <div style={{ position:"absolute", left:"14px", top:"50%", transform:"translateY(-50%)", color:"#9ca3af" }}>
          {icon || <FaBarcode size={18} />}
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          autoComplete="off"
          style={{
            width:"100%", padding:"14px 40px 14px 44px",
            borderRadius:"10px", border:`2px solid ${borderColor}`,
            fontSize:"15px", outline:"none", boxSizing:"border-box",
            boxShadow:`0 0 0 3px ${borderColor}22`,
            background: disabled ? "#f8fafc" : "white",
            transition:"border-color 0.2s"
          }}
        />
        {value && (
          <button type="button"
            onClick={() => { onChange(""); inputRef.current?.focus(); }}
            style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#9ca3af", display:"flex", alignItems:"center" }}>
            <FaTimes size={14} />
          </button>
        )}
      </div>
      <div style={{ marginTop:"6px", fontSize:"12px", color:"#94a3b8", display:"flex", alignItems:"center", gap:"6px" }}>
        <div style={{ width:"7px", height:"7px", borderRadius:"50%", background: disabled ? "#94a3b8" : "#10b981" }} />
        {disabled ? "Lecteur inactif" : "Lecteur prêt — scan automatique"}
      </div>
    </form>
  );
}
