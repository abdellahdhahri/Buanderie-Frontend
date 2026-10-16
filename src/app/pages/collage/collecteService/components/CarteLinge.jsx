import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { cat, ST_COLORS } from "../../collecteUtils";
import { Icons } from "../../shared/icons";
import { BoutonAction } from "../../shared/BoutonAction";

/* ═══════════════════════════════════════════════════════════════════════════
   CarteLinge — Ligne de linge premium
   ═══════════════════════════════════════════════════════════════════════════ */
export function CarteLinge({ linge, bacBlanc, onBlanc, onPropre, onManquant }) {
  const { t } = useTranslation();
  const c = cat(linge.categorie);
  const col = ST_COLORS[linge.statut];
  const isTraite = !!linge.statut;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", padding: "12px 16px", borderRadius: 14,
        border: `1.5px solid ${isTraite ? col?.b || "#e2e8f0" : "#e2e8f0"}`,
        background: isTraite
          ? `linear-gradient(135deg, ${col?.bg || "#f8fafc"}, ${col?.bg || "#f1f5f9"})`
          : "linear-gradient(135deg, #ffffff, #f8fafc)",
        marginBottom: 8,
        transition: "all 0.25s",
        boxShadow: isTraite ? "none" : "0 2px 8px rgba(15,23,42,0.04)",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (!isTraite) {
          e.currentTarget.style.boxShadow = "0 6px 18px rgba(15,23,42,0.08)";
          e.currentTarget.style.borderColor = "#cbd5e1";
        }
      }}
      onMouseLeave={(e) => {
        if (!isTraite) {
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(15,23,42,0.04)";
          e.currentTarget.style.borderColor = "#e2e8f0";
        }
      }}
    >
      {!isTraite && bacBlanc?.bacId && (
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
          borderRadius: "3px 0 0 3px",
          background: "linear-gradient(180deg, #14b8a6, #0d9488)",
        }} />
      )}

      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        flex: 1, minWidth: 0,
        paddingLeft: isTraite ? 0 : 6,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: c.bg,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 19, flexShrink: 0,
          border: `1px solid ${c.color}20`,
        }}>
          {c.emoji}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 12.5, fontWeight: 700, color: c.color,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {c.label}
          </div>
          <code style={{
            fontSize: 10.5, color: "#94a3b8", fontWeight: 600,
            display: "block", overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {linge.codeBarre}
          </code>
        </div>
      </div>

      {isTraite ? (
        <span style={{
          fontSize: 10, fontWeight: 800, letterSpacing: "0.4px",
          padding: "5px 12px", borderRadius: 20,
          background: col?.tag, color: col?.tc,
          flexShrink: 0,
          textTransform: "uppercase",
          border: `1px solid ${col?.b}`,
        }}>
          {col?.lbl}
        </span>
      ) : (
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <BoutonAction
            onClick={() => onBlanc(linge)}
            disabled={!bacBlanc?.bacId}
            title={t('collecte.sale_to_white')}
            Icon={Icons.Check}
            color="#16a34a"
            bg="#dcfce7"
            border="#bbf7d0"
          />
          <BoutonAction
            onClick={() => onPropre(linge)}
            title={t('collecte.propre_keep')}
            Icon={Icons.CheckCircle}
            color="#0284c7"
            bg="#dbeafe"
            border="#bae6fd"
          />
          <BoutonAction
            onClick={() => onManquant(linge)}
            title={t('collecte.missing')}
            Icon={Icons.AlertTriangle}
            color="#d97706"
            bg="#fef3c7"
            border="#fde68a"
          />
        </div>
      )}
    </motion.div>
  );
}
