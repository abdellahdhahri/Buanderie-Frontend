import React, { useRef, useEffect } from "react";
import { FaBarcode, FaTimes } from "react-icons/fa";

/**
 * Input de scan avec focus permanent.
 * Utilisé dans toutes les étapes du lavage.
 * Le focus est maintenu même si l'utilisateur clique ailleurs.
 */
export default function ScanInput({
  placeholder,
  value,
  onChange,
  onSubmit,
  borderColor = "#0ea5e9",
  disabled = false,
  keepFocus = true,   // activer le focus permanent
  autoDebounce = true, // soumettre automatiquement après 400ms
}) {
  const inputRef = useRef(null);

  // Focus initial
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [placeholder]); // re-focus si le placeholder change (changement d'étape)

  // Focus permanent si keepFocus
  useEffect(() => {
    if (!keepFocus) return;
    const restore = () => {
      // Ne pas voler le focus si une modal/dialog est ouverte
      const modal = document.querySelector('[data-modal="true"]');
      if (!modal && inputRef.current) inputRef.current.focus();
    };
    document.addEventListener("click", restore);
    return () => document.removeEventListener("click", restore);
  }, [keepFocus]);

  // Debounce auto (lecteur code-barres envoie d'un coup)
  useEffect(() => {
    if (!autoDebounce || value.trim().length < 3) return;
    const t = setTimeout(() => onSubmit(value.trim()), 400);
    return () => clearTimeout(t);
  }, [value, autoDebounce]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = value.trim();
    if (code) onSubmit(code);
  };

  return (
    <form onSubmit={handleSubmit} style={{ margin: 0 }}>
      <div style={{ position: "relative" }}>
        <div style={{
          position: "absolute", left: "14px", top: "50%",
          transform: "translateY(-50%)", color: "#9ca3af"
        }}>
          <FaBarcode size={18} />
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
            width: "100%", padding: "14px 40px 14px 44px",
            borderRadius: "10px",
            border: `2px solid ${borderColor}`,
            fontSize: "15px", outline: "none", boxSizing: "border-box",
            boxShadow: `0 0 0 3px ${borderColor}22`,
            background: disabled ? "#f8fafc" : "white",
            transition: "border-color 0.2s"
          }}
        />
        {value && (
          <button
            type="button"
            onClick={() => { onChange(""); inputRef.current?.focus(); }}
            style={{
              position: "absolute", right: "12px", top: "50%",
              transform: "translateY(-50%)", background: "none",
              border: "none", cursor: "pointer", color: "#9ca3af",
              display: "flex", alignItems: "center"
            }}
          >
            <FaTimes size={14} />
          </button>
        )}
      </div>
      <div style={{
        marginTop: "6px", fontSize: "12px", color: "#94a3b8",
        display: "flex", alignItems: "center", gap: "6px"
      }}>
        <div style={{
          width: "7px", height: "7px", borderRadius: "50%",
          background: disabled ? "#94a3b8" : "#10b981"
        }} />
        {disabled ? "Lecteur inactif" : "Lecteur prêt — scan automatique"}
      </div>
    </form>
  );
}
