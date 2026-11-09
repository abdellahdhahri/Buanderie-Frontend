import React from "react";
import { Icons } from "../icons";

/* ═══════════════════════════════════════════════════════════════════════════
   Éléments communs aux dialogues de la collecte service
   ═══════════════════════════════════════════════════════════════════════════ */

// Fond flouté + carte centrée. Un clic sur le fond ferme le dialogue.
export function ModalOverlay({
  onClose,
  children,
  maxWidth = 400,
  backdropOpacity = 0.65,
  shadow = "0 24px 72px rgba(0,0,0,0.35)",
}) {
  return (
    <div data-modal="true" onClick={onClose} style={{
      position: "fixed", inset: 0, background: `rgba(15,23,42,${backdropOpacity})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, backdropFilter: "blur(6px)",
      animation: "fadeIn 0.2s ease-out",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "white", borderRadius: 22, padding: 28,
        maxWidth, width: "95%",
        boxShadow: shadow,
        animation: "scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        {children}
      </div>
    </div>
  );
}

export function BoutonFermer({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "#f1f5f9", border: "none", borderRadius: 10,
        width: 32, height: 32, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <Icons.X size={14} color="#64748b" strokeWidth={2.5} />
    </button>
  );
}

// Bouton secondaire blanc (Retour / Annuler). `withIcon` centre une icône + texte.
export function BoutonSecondaire({ onClick, children, withIcon, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: 13, borderRadius: 12,
        border: "1px solid #e2e8f0", background: "white",
        color: "#64748b", fontWeight: 700, fontSize: 13,
        cursor: "pointer", transition: "all 0.2s",
        ...(withIcon ? { display: "flex", alignItems: "center", justifyContent: "center", gap: 6 } : {}),
        ...style,
      }}
      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
      onMouseLeave={e => e.currentTarget.style.background = "white"}
    >
      {children}
    </button>
  );
}
