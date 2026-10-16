import React from "react";
import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════════════════
   BoutonAction — Bouton circulaire (identique Collecte Chambre)
   ═══════════════════════════════════════════════════════════════════════════ */
export function BoutonAction({ onClick, disabled, title, Icon, color, bg, border }) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.12, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.92 } : {}}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: 36, height: 36, borderRadius: 11,
        border: `1.5px solid ${border}`,
        background: bg,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        boxShadow: disabled ? "none" : `0 3px 10px ${color}25`,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.boxShadow = `0 6px 16px ${color}40`;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.boxShadow = `0 3px 10px ${color}25`;
        }
      }}
    >
      <Icon size={14} color={color} strokeWidth={2.5} />
    </motion.button>
  );
}
