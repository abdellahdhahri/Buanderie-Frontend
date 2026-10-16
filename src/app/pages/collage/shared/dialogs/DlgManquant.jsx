import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { cat } from "../../collecteUtils";
import { Icons } from "../icons";
import { ModalOverlay, BoutonFermer, BoutonSecondaire } from "./DialogParts";

/* ═══════════════════════════════════════════════════════════════════════════
   DlgManquant — Confirmation d'un linge / uniforme manquant
   title, message et confirmLabel varient selon la page.
   ═══════════════════════════════════════════════════════════════════════════ */
export function DlgManquant({ linge, onOk, onClose, title, message, confirmLabel }) {
  const { t } = useTranslation();
  if (!linge) return null;
  const c = cat(linge.categorie);

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "linear-gradient(135deg, #fef3c7, #fde68a)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(217,119,6,0.2)",
          }}>
            <Icons.AlertTriangle size={22} color="#d97706" strokeWidth={2.2} />
          </div>
          <div>
            <h3 style={{
              margin: 0, fontSize: 17, fontWeight: 800,
              color: "#0f172a", letterSpacing: "-0.01em",
            }}>
              {title}
            </h3>
            <p style={{ margin: "3px 0 0 0", fontSize: 12, color: "#64748b", fontWeight: 500 }}>
              Confirmation requise
            </p>
          </div>
        </div>
        <BoutonFermer onClick={onClose} />
      </div>

      <div style={{
        padding: 14, background: c.bg, borderRadius: 14,
        marginBottom: 18, display: "flex", alignItems: "center", gap: 12,
        border: `1px solid ${c.color}25`,
      }}>
        <span style={{ fontSize: 26 }}>{c.emoji}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: c.color }}>
            {c.label}
          </div>
          <code style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
            {linge.codeBarre}
          </code>
        </div>
      </div>

      <div style={{
        padding: "12px 14px", borderRadius: 12, marginBottom: 20,
        background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
        border: "1px solid #fde68a",
        display: "flex", alignItems: "flex-start", gap: 10,
      }}>
        <div style={{ flexShrink: 0, marginTop: 1 }}>
          <Icons.AlertTriangle size={13} color="#d97706" strokeWidth={2.5} />
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "#92400e", lineHeight: 1.5, fontWeight: 500 }}>
          {message}
        </p>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <BoutonSecondaire onClick={onClose}>
          {t('common.cancel')}
        </BoutonSecondaire>
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onOk(linge)}
          style={{
            flex: 2, padding: 13, borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            color: "white", fontWeight: 800, fontSize: 13,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(217,119,6,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          }}
        >
          <Icons.AlertTriangle size={13} color="white" strokeWidth={2.5} />
          {confirmLabel}
        </motion.button>
      </div>
    </ModalOverlay>
  );
}
