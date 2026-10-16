import React from "react";
import { motion } from "framer-motion";
import { Icons } from "./icons";

const THEMES = {
  primary: {
    gradient: "linear-gradient(135deg, #14b8a6, #0d9488)",
    shadow: "rgba(20,184,166,0.35)",
    hoverShadow: "rgba(20,184,166,0.5)",
    text: "white",
    border: "transparent",
  },
  sky: {
    gradient: "linear-gradient(135deg, #0ea5e9, #0284c7)",
    shadow: "rgba(14,165,233,0.35)",
    hoverShadow: "rgba(14,165,233,0.5)",
    text: "white",
    border: "transparent",
  },
  success: {
    gradient: "linear-gradient(135deg, #10b981, #059669)",
    shadow: "rgba(16,185,129,0.35)",
    hoverShadow: "rgba(16,185,129,0.5)",
    text: "white",
    border: "transparent",
  },
  danger: {
    gradient: "linear-gradient(135deg, #ef4444, #dc2626)",
    shadow: "rgba(220,38,38,0.35)",
    hoverShadow: "rgba(220,38,38,0.5)",
    text: "white",
    border: "transparent",
  },
  warning: {
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    shadow: "rgba(217,119,6,0.35)",
    hoverShadow: "rgba(217,119,6,0.5)",
    text: "white",
    border: "transparent",
  },
  default: {
    gradient: "white",
    shadow: "rgba(15,23,42,0.06)",
    hoverShadow: "rgba(15,23,42,0.1)",
    text: "#64748b",
    border: "#e2e8f0",
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   ActionButton — Bouton d'action principal
   type : primary (teal) | sky | success | danger | warning | default
   ═══════════════════════════════════════════════════════════════════════════ */
export function ActionButton({
  onClick, disabled, loading, icon, label, type = "primary", badge,
}) {
  const theme = THEMES[type] || THEMES.primary;

  return (
    <motion.button
      whileHover={!disabled && !loading ? { y: -2, scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: "13px 26px", borderRadius: 12,
        border: `1.5px solid ${theme.border}`,
        background: disabled || loading ? "#e2e8f0" : theme.gradient,
        color: disabled || loading ? "#94a3b8" : theme.text,
        fontWeight: 800, fontSize: 13,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        gap: 8,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: disabled || loading ? "none" : `0 4px 16px ${theme.shadow}`,
        position: "relative", overflow: "hidden",
        flexShrink: 0, minWidth: 130,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.boxShadow = `0 6px 22px ${theme.hoverShadow}`;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.boxShadow = `0 4px 16px ${theme.shadow}`;
        }
      }}
    >
      {loading ? (
        <div className="animate-spin">
          <Icons.Loader size={15} color={theme.text} strokeWidth={2.5} />
        </div>
      ) : (
        <>
          {icon}
          {label}
        </>
      )}
      {badge && !disabled && !loading && (
        <span style={{
          background: "rgba(255,255,255,0.25)",
          padding: "2px 9px", borderRadius: 10,
          fontSize: 10, fontWeight: 800,
        }}>
          {badge}
        </span>
      )}
    </motion.button>
  );
}
