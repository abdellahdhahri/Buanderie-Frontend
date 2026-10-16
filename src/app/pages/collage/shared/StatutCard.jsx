import React from "react";
import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════════════════
   StatutCard — carte compteur. Cliquable (filtre) si `onClick` est fourni.
   ═══════════════════════════════════════════════════════════════════════════ */
export function StatutCard({ label, value, icon, color, bg, subValue, onClick, active }) {
  const isClickable = !!onClick;
  const isActive = active || false;

  return (
    <motion.div
      whileHover={isClickable ? { y: -3, scale: 1.02 } : { y: -3 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      style={{
        padding: "16px 18px", borderRadius: 16, background: bg,
        border: `1.5px solid ${isActive ? color : `${color}25`}`,
        flex: 1, minWidth: 120, position: "relative", overflow: "hidden",
        cursor: isClickable ? "pointer" : "default",
        // Seules les cartes-filtres non sélectionnées sont atténuées
        opacity: isClickable && !isActive ? 0.9 : 1,
        boxShadow: isActive ? `0 8px 20px ${color}20` : "none",
        transition: "all 0.25s",
      }}
      onMouseEnter={(e) => {
        if (!isClickable) {
          e.currentTarget.style.transform = "translateY(-3px)";
          e.currentTarget.style.boxShadow = `0 10px 24px ${color}22`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isClickable) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      <div style={{
        position: "absolute", top: -20, right: -20,
        width: 70, height: 70, borderRadius: "50%",
        background: `${color}12`, filter: "blur(20px)",
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: isActive ? `${color}25` : `${color}15`,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: `1px solid ${color}25`,
          transition: "all 0.3s",
        }}>
          {icon}
        </div>

        <div>
          <p style={{
            fontSize: 9.5, fontWeight: 800, color: "#94a3b8",
            textTransform: "uppercase", letterSpacing: "0.7px",
            margin: 0,
          }}>
            {label}
          </p>
          <p style={{
            fontSize: 24, fontWeight: 800, color,
            margin: 0, lineHeight: 1.1, letterSpacing: "-0.02em",
          }}>
            {value}
          </p>
          {subValue && (
            <p style={{ fontSize: 10, color: "#94a3b8", margin: 0, fontWeight: 600 }}>
              {subValue}
            </p>
          )}
        </div>
      </div>

      {isActive && isClickable && (
        <div style={{
          position: "absolute", bottom: 6, right: 10,
          fontSize: 9, color, opacity: 0.6,
        }}>
          ●
        </div>
      )}
    </motion.div>
  );
}
