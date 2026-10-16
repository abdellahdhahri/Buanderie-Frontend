import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Icons } from "../../shared/icons";

/* ═══════════════════════════════════════════════════════════════════════════
   UNIFORME EN COURS — uniforme scanné, en attente du scan de son bac
   ═══════════════════════════════════════════════════════════════════════════ */
export function UniformeEnCours({ uniforme, onCancel }) {
  const { t } = useTranslation();
  const infecte = uniforme.estInfecte;
  const borderColor = infecte ? "#fca5a5" : "#7dd3fc";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: "14px 18px", borderRadius: 14,
        background: infecte
          ? "linear-gradient(135deg, #fef2f2, #fee2e2)"
          : "linear-gradient(135deg, #e0f2fe, #bae6fd)",
        border: `2px solid ${borderColor}`,
        marginBottom: 16,
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
        boxShadow: infecte
          ? "0 4px 16px rgba(220,38,38,0.1)"
          : "0 4px 16px rgba(14,165,233,0.1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 3px 10px rgba(15,23,42,0.1)",
          border: `1.5px solid ${borderColor}`,
        }}>
          {infecte ? (
            <Icons.Biohazard size={22} color="#dc2626" strokeWidth={2.2} />
          ) : (
            <Icons.Shirt size={22} color="#0284c7" strokeWidth={2.2} />
          )}
        </div>
        <div>
          <div style={{
            fontWeight: 800, fontSize: 14,
            color: infecte ? "#dc2626" : "#0284c7",
            letterSpacing: "-0.01em",
            display: "flex", alignItems: "center", gap: 7,
          }}>
            {uniforme.codeBarre}
            {infecte && (
              <span style={{
                fontSize: 9, padding: "2px 8px", borderRadius: 20,
                background: "#fecaca", color: "#991b1b", fontWeight: 800,
                letterSpacing: "0.3px", textTransform: "uppercase",
              }}>
                {t('collecte_uniforme.red_bin')}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 3, fontWeight: 500 }}>
            {t('collecte_uniforme.scan_destination_bin')}
          </div>
        </div>
      </div>
      <button
        onClick={onCancel}
        style={{
          padding: "9px 17px", borderRadius: 10,
          border: "1px solid #e2e8f0", background: "white",
          color: "#64748b", cursor: "pointer", fontSize: 12,
          fontWeight: 700, transition: "all 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
        onMouseLeave={e => e.currentTarget.style.background = "white"}
      >
        {t('common.cancel')}
      </button>
    </motion.div>
  );
}
