import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Badge } from "../../../../ui/badge";
import { cat } from "../../collecteUtils";
import { Icons } from "../../shared/icons";

/* ═══════════════════════════════════════════════════════════════════════════
   SACS INFECTÉS DÉCLARÉS
   ═══════════════════════════════════════════════════════════════════════════ */
export function SacsDeclares({ sacs, nbInfectes }) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      style={{
        padding: "14px 18px",
        background: "linear-gradient(135deg, #fef2f2, #fff5f5)",
        borderRadius: 14, border: "1px solid #fca5a5",
        marginBottom: 18, overflow: "hidden",
      }}
    >
      <div style={{
        display: "flex", alignItems: "center",
        gap: 11, marginBottom: 12,
      }}>
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: "white", display: "flex",
            alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(220,38,38,0.15)",
          }}
        >
          <Icons.Biohazard size={16} color="#dc2626" strokeWidth={2.2} />
        </motion.div>
        <span style={{
          fontSize: 13.5, color: "#dc2626", fontWeight: 800,
        }}>
          {t('collecte.infected_sacs_declared')}
        </span>
        <Badge style={{
          background: "#fee2e2", color: "#dc2626",
          fontSize: 10, padding: "4px 12px",
          marginLeft: "auto", borderRadius: 20,
          fontWeight: 800,
        }}>
          {sacs.length} {t('collecte.sacs')} · {nbInfectes}{" "}
          {t('collecte.pieces')}
        </Badge>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {sacs.map((s, i) => {
          const c = cat(s.categorie);
          return (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 12px", background: "white",
                borderRadius: 9, border: "1px solid #fca5a5",
                fontSize: 11, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <span style={{ fontSize: 14 }}>{c.emoji}</span>
              <span style={{ fontWeight: 800, color: "#dc2626" }}>
                {s.quantite}
              </span>
              <span style={{
                color: "#94a3b8", fontSize: 10,
                fontFamily: "monospace", fontWeight: 600,
              }}>
                {s.numeroSac}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
