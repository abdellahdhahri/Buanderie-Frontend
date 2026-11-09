import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Icons } from "../../shared/icons";
import { ProgressionBar } from "./ProgressionBar";

/* ═══════════════════════════════════════════════════════════════════════════
   PROGRESSION — pièces traitées / attendues
   ═══════════════════════════════════════════════════════════════════════════ */
export function ProgressionCollecte({ totalTraite, totalAttendu, progression }) {
  const { t } = useTranslation();
  const isComplete = progression === 100;

  return (
    <div style={{
      padding: "16px 20px", borderRadius: 14,
      background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
      marginBottom: 20, border: "1px solid #e2e8f0",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap", gap: 8,
        marginBottom: 8,
      }}>
        <span style={{
          fontSize: 13, color: "#475569", fontWeight: 600,
          display: "flex", alignItems: "center", gap: 7,
        }}>
          <Icons.HandHoldingHeart size={15} color="#14b8a6" strokeWidth={2.2} />
          <strong style={{ color: "#0f172a" }}>{totalTraite}</strong> / {totalAttendu}{" "}
          {t('collecte.pieces_processed')}
        </span>
        <span style={{
          fontSize: 22, fontWeight: 800,
          color: isComplete ? "#10b981" : "#14b8a6",
          display: "flex", alignItems: "center", gap: 6,
          letterSpacing: "-0.02em",
        }}>
          {progression}%
          {isComplete && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500 }}
            >
              <Icons.Sparkles size={18} color="#10b981" strokeWidth={2.5} />
            </motion.div>
          )}
        </span>
      </div>
      <ProgressionBar
        value={progression}
        label=""
        color={isComplete ? "#10b981" : "#14b8a6"}
      />
    </div>
  );
}
