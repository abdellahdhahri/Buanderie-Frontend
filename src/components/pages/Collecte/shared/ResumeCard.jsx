import React from "react";
import { motion } from "framer-motion";
import { Icons } from "./icons";

/* ═══════════════════════════════════════════════════════════════════════════
   ResumeCard — écran de fin après clôture
   compteurs : [{ icon, label, value, color, bg }]
   children  : contenu additionnel + boutons
   ═══════════════════════════════════════════════════════════════════════════ */
export function ResumeCard({ title, subtitle, compteurs, minColWidth = 110, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{
        background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
        borderRadius: 20, padding: 32,
        border: "2px solid #86efac", textAlign: "center",
        position: "relative", overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: 140, height: 140,
        background: "radial-gradient(circle, rgba(16,185,129,0.12), transparent)",
        borderRadius: "50%", transform: "translate(60px, -60px)",
      }} />

      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.2 }}
        style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
          boxShadow: "0 12px 32px rgba(16,185,129,0.25)",
          border: "2px solid #86efac",
        }}
      >
        <Icons.CheckCheck size={38} color="#15803d" strokeWidth={2.5} />
      </motion.div>

      <h2 style={{
        fontSize: 24, fontWeight: 800, color: "#15803d",
        margin: 0, marginBottom: 6, letterSpacing: "-0.02em",
      }}>
        {title}
      </h2>
      <p style={{ fontSize: 13.5, color: "#059669", marginBottom: 22, fontWeight: 600 }}>
        {subtitle}
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(${minColWidth}px, 1fr))`,
        gap: 12, marginBottom: 22,
        background: "white", borderRadius: 16, padding: 18,
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        border: "1px solid #bbf7d0",
      }}>
        {compteurs.map(({ icon, label, value, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            style={{
              background: bg, borderRadius: 12,
              padding: "14px 8px", border: `1px solid ${color}25`,
            }}
          >
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "center", marginBottom: 8,
            }}>
              {icon}
            </div>
            <div style={{
              fontSize: 24, fontWeight: 800, color,
              lineHeight: 1, letterSpacing: "-0.02em",
            }}>
              {value || 0}
            </div>
            <div style={{
              fontSize: 10, color: "#64748b",
              fontWeight: 800, marginTop: 6,
              textTransform: "uppercase", letterSpacing: "0.5px",
            }}>
              {label}
            </div>
          </motion.div>
        ))}
      </div>

      {children}
    </motion.div>
  );
}

// Rangée de boutons centrés en bas du résumé
export function ResumeActions({ children }) {
  return (
    <div style={{
      display: "flex", gap: 12, flexWrap: "wrap",
      justifyContent: "center",
    }}>
      {children}
    </div>
  );
}
