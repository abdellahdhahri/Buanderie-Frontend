import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { cat, ST_COLORS } from "../../collecteUtils";
import { Icons } from "../../shared/icons";
import { BoutonAction } from "../../shared/BoutonAction";

// Petite étiquette arrondie à côté du nom de catégorie
function Tag({ icon, children, color, bg, border }) {
  return (
    <span style={{
      fontSize: 9, padding: "2px 7px", borderRadius: 20,
      background: bg, color, fontWeight: 800,
      display: "inline-flex", alignItems: "center", gap: 3,
      border: `1px solid ${border}`,
      letterSpacing: "0.3px",
    }}>
      {icon}
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CarteUniforme — Ligne d'uniforme
   ═══════════════════════════════════════════════════════════════════════════ */
export function CarteUniforme({ u, uniformeEnCours, onManquant }) {
  const { t } = useTranslation();
  const c = cat(u.categorie);
  const col = ST_COLORS[u.statut];
  const estActif = uniformeEnCours?.lingeId === u.lingeId;
  const isTraite = !!u.statut;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", padding: "12px 16px", borderRadius: 14,
        border: `1.5px solid ${estActif ? "#0ea5e9" : isTraite ? (col?.b || "#e2e8f0") : "#e2e8f0"}`,
        background: estActif
          ? "linear-gradient(135deg, #e0f2fe, #bae6fd)"
          : isTraite
          ? `linear-gradient(135deg, ${col?.bg || "#f8fafc"}, ${col?.bg || "#f1f5f9"})`
          : "linear-gradient(135deg, #ffffff, #f8fafc)",
        marginBottom: 8,
        transition: "all 0.25s",
        boxShadow: estActif
          ? "0 8px 20px rgba(14,165,233,0.15)"
          : isTraite ? "none" : "0 2px 8px rgba(15,23,42,0.04)",
        position: "relative",
      }}
    >
      {estActif && (
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
          borderRadius: "3px 0 0 3px",
          background: "linear-gradient(180deg, #0ea5e9, #0284c7)",
        }} />
      )}

      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        flex: 1, minWidth: 0,
        paddingLeft: estActif ? 6 : 0,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: c.bg, display: "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 19, flexShrink: 0,
          border: `1px solid ${c.color}20`,
        }}>
          {c.emoji}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6, marginBottom: 2,
          }}>
            <span style={{
              fontSize: 12.5, fontWeight: 700, color: c.color,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {c.label}
            </span>
            {u.estInfecte && !u.statut && (
              <Tag
                icon={<Icons.Biohazard size={9} color="#dc2626" strokeWidth={2.5} />}
                color="#dc2626" bg="#fee2e2" border="#fca5a5"
              >
                INF
              </Tag>
            )}
            {estActif && (
              <Tag
                icon={<Icons.Package size={9} color="#0891b2" strokeWidth={2.5} />}
                color="#0891b2" bg="#cffafe" border="#a5f3fc"
              >
                {t('collecte_uniforme.scan_bin')}
              </Tag>
            )}
          </div>
          <code style={{
            fontSize: 10.5, color: "#94a3b8", fontWeight: 600,
            display: "block", overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {u.codeBarre}
          </code>
        </div>
      </div>

      {isTraite ? (
        <span style={{
          fontSize: 10, fontWeight: 800, letterSpacing: "0.4px",
          padding: "5px 12px", borderRadius: 20,
          background: col?.tag, color: col?.tc,
          flexShrink: 0, textTransform: "uppercase",
          border: `1px solid ${col?.b}`,
        }}>
          {col?.lbl}
        </span>
      ) : (
        <BoutonAction
          onClick={() => onManquant(u)}
          title={t('collecte_uniforme.missing')}
          Icon={Icons.AlertTriangle}
          color="#d97706"
          bg="#fef3c7"
          border="#fde68a"
        />
      )}
    </motion.div>
  );
}
