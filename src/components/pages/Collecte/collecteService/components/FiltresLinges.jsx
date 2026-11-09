import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Icons } from "../../shared/icons";

// Filtre → clé de traduction
const FILTRES = [
  ["all", "collecte.all"],
  ["untreated", "collecte.to_treat"],
  ["blanc", "collecte.white"],
  ["propre", "collecte.propre"],
  ["manquant", "collecte.missing"],
];

/* ═══════════════════════════════════════════════════════════════════════════
   FILTRES — boutons de filtre + compteur
   ═══════════════════════════════════════════════════════════════════════════ */
export function FiltresLinges({ filter, onFilter, count }) {
  const { t } = useTranslation();

  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      alignItems: "center", flexWrap: "wrap", gap: 8,
      marginBottom: 14,
    }}>
      <div style={{
        display: "flex", alignItems: "center",
        gap: 7, flexWrap: "wrap",
      }}>
        <Icons.Filter size={14} color="#94a3b8" strokeWidth={2.2} />
        <span style={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 700 }}>
          {t('collecte.filter')}:
        </span>
        {FILTRES.map(([f, labelKey]) => (
          <motion.button
            key={f}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onFilter(f)}
            style={{
              padding: "5px 14px", borderRadius: 12,
              border: filter === f ? "1.5px solid #14b8a6" : "1px solid #e2e8f0",
              background: filter === f ? "#ccfbf1" : "transparent",
              color: filter === f ? "#0d9488" : "#64748b",
              fontSize: 11.5, fontWeight: filter === f ? 800 : 600,
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            {t(labelKey)}
          </motion.button>
        ))}
      </div>
      <span style={{
        fontSize: 11, color: "#94a3b8",
        fontWeight: 800, padding: "4px 13px",
        background: "#f1f5f9", borderRadius: 10,
      }}>
        {count}
      </span>
    </div>
  );
}
