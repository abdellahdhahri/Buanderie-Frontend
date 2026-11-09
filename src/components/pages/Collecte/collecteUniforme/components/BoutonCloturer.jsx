import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Icons } from "../../shared/icons";

// Carré / pastille translucide sur fond coloré
const glass = {
  background: "rgba(255,255,255,0.2)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.3)",
  position: "relative", zIndex: 1,
  flexShrink: 0,
};

/* ═══════════════════════════════════════════════════════════════════════════
   BoutonCloturer — bouton pleine largeur : icône, libellé, badge %
   Vert si tout est traité, orange s'il reste des uniformes.
   ═══════════════════════════════════════════════════════════════════════════ */
export function BoutonCloturer({ onClick, loading, nonTr, total }) {
  const { t } = useTranslation();
  const isComplete = nonTr === 0;
  const pct = total > 0 ? Math.round(((total - nonTr) / total) * 100) : 0;

  const theme = isComplete
    ? {
        gradient: "linear-gradient(135deg, #10b981, #059669)",
        shadow: "rgba(16,185,129,0.35)",
        hoverShadow: "rgba(16,185,129,0.5)",
        Icon: Icons.ClipboardCheck,
        title: t('collecte_uniforme.finish_and_close'),
        subtitle: "Tous les uniformes traités",
        badgeText: "100%",
      }
    : {
        gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
        shadow: "rgba(217,119,6,0.35)",
        hoverShadow: "rgba(217,119,6,0.5)",
        Icon: Icons.AlertOctagon,
        title: t('collecte_uniforme.close_with_unprocessed'),
        subtitle: `${nonTr} ${t('collecte_uniforme.unprocessed')} restant${nonTr > 1 ? "s" : ""}`,
        badgeText: `${pct}%`,
      };

  const IconComponent = theme.Icon;

  return (
    <motion.button
      whileHover={!loading ? { y: -2 } : {}}
      whileTap={!loading ? { scale: 0.985 } : {}}
      onClick={onClick}
      disabled={loading}
      style={{
        width: "100%",
        padding: "18px 24px",
        borderRadius: 16,
        border: "none",
        background: loading ? "#e2e8f0" : theme.gradient,
        color: loading ? "#94a3b8" : "white",
        cursor: loading ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", gap: 16,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: loading ? "none" : `0 8px 24px ${theme.shadow}`,
        position: "relative", overflow: "hidden",
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.boxShadow = `0 12px 32px ${theme.hoverShadow}`;
        }
      }}
      onMouseLeave={(e) => {
        if (!loading) {
          e.currentTarget.style.boxShadow = `0 8px 24px ${theme.shadow}`;
        }
      }}
    >
      {/* Halo décoratif */}
      <div style={{
        position: "absolute", top: -40, right: -40,
        width: 140, height: 140, borderRadius: "50%",
        background: "rgba(255,255,255,0.12)",
        filter: "blur(20px)", pointerEvents: "none",
      }} />

      {/* Icône dans un carré */}
      <div style={{
        ...glass,
        width: 52, height: 52, borderRadius: 14,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {loading ? (
          <div className="animate-spin">
            <Icons.Loader size={24} color="white" strokeWidth={2.5} />
          </div>
        ) : (
          <IconComponent size={26} color="white" strokeWidth={2.2} />
        )}
      </div>

      {/* Textes */}
      <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
        <div style={{
          fontSize: 15, fontWeight: 800,
          letterSpacing: "-0.01em", marginBottom: 3,
        }}>
          {loading ? "Traitement..." : theme.title}
        </div>
        <div style={{
          fontSize: 12, fontWeight: 600,
          opacity: 0.85,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          {!loading && isComplete && (
            <Icons.Sparkles size={12} color="white" strokeWidth={2.5} />
          )}
          {theme.subtitle}
        </div>
      </div>

      {/* Badge progression */}
      {!loading && (
        <div style={{
          ...glass,
          padding: "8px 16px", borderRadius: 20,
          fontSize: 14, fontWeight: 800,
          letterSpacing: "-0.01em",
        }}>
          {theme.badgeText}
        </div>
      )}
    </motion.button>
  );
}
