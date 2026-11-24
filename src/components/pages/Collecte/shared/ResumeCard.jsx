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
        background: "#ffffff",
        borderRadius: 20, padding: 32,
        border: "1px solid #e2e8f0", borderTop: "4px solid #0794a4", textAlign: "center",
        boxShadow: "0 4px 20px rgba(15,23,42,0.04)",
        position: "relative", overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: 140, height: 140,
        background: "radial-gradient(circle, rgba(7,148,164,0.08), transparent)",
        borderRadius: "50%", transform: "translate(60px, -60px)",
      }} />

      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.2 }}
        style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "#e6f6f8",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
          boxShadow: "0 8px 24px rgba(7,148,164,0.18)",
          border: "4px solid #ffffff",
        }}
      >
        <Icons.CheckCheck size={38} color="#0794a4" strokeWidth={2.5} />
      </motion.div>

      <h2 style={{
        fontSize: 24, fontWeight: 800, color: "#0f172a",
        margin: 0, marginBottom: 6, letterSpacing: "-0.02em",
      }}>
        {title}
      </h2>
      <p style={{ fontSize: 13.5, color: "#067a87", marginBottom: 22, fontWeight: 600 }}>
        {subtitle}
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(${minColWidth}px, 1fr))`,
        gap: 12, marginBottom: 22,
        background: "#f8fafc", borderRadius: 16, padding: 18,
        border: "1px solid #eef2f6",
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
