import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Icons } from "../../shared/icons";
import { ActionButton } from "../../shared/ActionButton";
import { useCircuitInfecte } from "../../../../../hooks/useEstablishment";

/* ═══════════════════════════════════════════════════════════════════════════
   BOUTONS D'ACTION — déclarer un sac infecté / clôturer
   ═══════════════════════════════════════════════════════════════════════════ */
export function ActionsCollecte({ nbNonTr, loading, canClose, onDeclarerSac, onCloturer }) {
  const { t } = useTranslation();
  const circuitInfecte = useCircuitInfecte();

  return (
    <div style={{
      display: "flex", gap: 12, flexWrap: "wrap",
      alignItems: "center", justifyContent: "flex-start",
      paddingTop: 16, borderTop: "1px solid #f1f5f9",
    }}>
      {circuitInfecte && <ActionButton
        onClick={onDeclarerSac}
        icon={<Icons.Biohazard size={15} color="white" strokeWidth={2.5} />}
        label={t('collecte.declare_infected')}
        type="danger"
      />}

      {nbNonTr > 0 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", background: "#fffbeb",
            borderRadius: 10, border: "1px solid #fcd34d",
          }}
        >
          <Icons.AlertTriangle size={13} color="#d97706" strokeWidth={2.5} />
          <span style={{ fontSize: 12, fontWeight: 800, color: "#d97706" }}>
            {nbNonTr} {t('collecte.remaining').toLowerCase()}
          </span>
        </motion.div>
      )}

      {nbNonTr === 0 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", background: "#f0fdf4",
            borderRadius: 10, border: "1px solid #86efac",
          }}
        >
          <Icons.CheckCircle size={13} color="#10b981" strokeWidth={2.5} />
          <span style={{ fontSize: 12, fontWeight: 800, color: "#15803d" }}>
            {t('collecte.all_done')}
          </span>
          <Icons.Sparkles size={13} color="#10b981" strokeWidth={2.5} />
        </motion.div>
      )}

      <ActionButton
        onClick={onCloturer}
        disabled={loading || !canClose}
        loading={loading}
        icon={nbNonTr === 0
          ? <Icons.ClipboardCheck size={15} color="white" strokeWidth={2.5} />
          : <Icons.ArrowRight size={15} color="white" strokeWidth={2.5} />}
        label={nbNonTr === 0
          ? t('collecte.finish_and_close')
          : t('collecte.close_with_remaining', { count: nbNonTr })}
        type={nbNonTr === 0 ? "success" : "warning"}
        badge={nbNonTr > 0 ? `${nbNonTr}` : null}
      />
    </div>
  );
}
