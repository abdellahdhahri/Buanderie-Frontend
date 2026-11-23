import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Badge } from "../../../../ui/badge";
import { cat } from "../../collecteUtils";
import { Icons } from "../../shared/icons";

export function BacsInfectesDeclares({ declarations, nbInfectes }) {
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
      <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(220,38,38,0.15)",
        }}>
          <Icons.Biohazard size={16} color="#dc2626" strokeWidth={2.2} />
        </div>
        <span style={{ fontSize: 13.5, color: "#dc2626", fontWeight: 800 }}>
          {t("collecte.bac_infecte.declared_title", "Quantités infectées déclarées")}
        </span>
        <Badge style={{
          background: "#fee2e2", color: "#dc2626", fontSize: 10, padding: "4px 12px",
          marginLeft: "auto", borderRadius: 20, fontWeight: 800,
        }}>
          {declarations.length} {t("collecte.bac_infecte.declarations", "déclaration(s)")} · {nbInfectes} {t("collecte.pieces")}
        </Badge>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {declarations.map((d, i) => (
          <motion.div
            key={`${d.bacId}-${i}`}
            initial={{ y: 6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.04 }}
            style={{
              display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8,
              padding: "8px 12px", background: "white", borderRadius: 10,
              border: "1px solid #fecaca", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 12, color: "#0f172a" }}>
              {d.codeBac || `#${d.bacId}`}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 800, color: "#fff", background: "#dc2626",
              padding: "2px 9px", borderRadius: 20,
            }}>
              {d.quantiteTotale ?? 0}
            </span>
            <span style={{ flex: 1 }} />
            {(d.items || []).map((it) => {
              const c = cat(it.categorie);
              return (
                <span key={it.categorie} style={{
                  display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11,
                  padding: "3px 8px", borderRadius: 8, background: c.bg, color: c.color, fontWeight: 700,
                }}>
                  <span>{c.emoji}</span>
                  {t(`categories.${it.categorie}`, { defaultValue: c.label })} · {it.quantiteDeclaree}
                </span>
              );
            })}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
