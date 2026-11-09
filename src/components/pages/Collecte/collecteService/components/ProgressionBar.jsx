import React from "react";
import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════════════════
   ProgressionBar
   ═══════════════════════════════════════════════════════════════════════════ */
export function ProgressionBar({ value, label, color = "#14b8a6", emoji }) {
  const pct = Math.min(Math.max(value, 0), 100);
  const isComplete = pct === 100;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontSize: 12, marginBottom: 4,
      }}>
        <span style={{
          fontWeight: 600, color: "#64748b",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          {emoji && <span>{emoji}</span>} {label}
        </span>
        <span style={{
          fontWeight: 800,
          color: isComplete ? "#10b981" : "#0f172a",
        }}>
          {pct}%
        </span>
      </div>
      <div style={{
        height: 6, borderRadius: 4, background: "#f1f5f9",
        overflow: "hidden", position: "relative",
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            height: "100%", borderRadius: 4,
            background: isComplete
              ? "linear-gradient(90deg, #10b981, #059669)"
              : `linear-gradient(90deg, ${color}, ${color}dd)`,
            boxShadow: isComplete ? "0 0 12px rgba(16,185,129,0.3)" : "none",
          }}
        />
      </div>
    </div>
  );
}
