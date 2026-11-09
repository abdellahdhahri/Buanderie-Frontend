import React from "react";
import { Icons } from "./icons";
import "./CollecteRh.css";

const COULEURS = {
  primary: "#0794a4",
  sky: "#0284c7",
  success: "#10b981",
  danger: "#dc2626",
  warning: "#d97706",
};

export function ActionButton({ onClick, disabled, loading, icon, label, type = "primary", badge }) {
  const defaut = type === "default";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`cr-btn ${defaut ? "cr-btn--default" : ""}`}
      style={defaut ? undefined : { "--b": COULEURS[type] || COULEURS.primary }}
    >
      {loading ? (
        <span className="animate-spin"><Icons.Loader size={15} color="currentColor" strokeWidth={2.5} /></span>
      ) : (
        <>
          {icon}
          {label}
        </>
      )}
      {badge && !disabled && !loading && <span className="cr-btn__badge">{badge}</span>}
    </button>
  );
}
