import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Icons } from "./icons";

// Apparence de chaque état du scan
const VARIANTS = {
  loading: {
    background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
    border: "#93c5fd",
    shadow: "rgba(59,130,246,0.08)",
    iconShadow: "rgba(59,130,246,0.15)",
    titleColor: "#1d4ed8",
  },
  success: {
    background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
    border: "#86efac",
    shadow: "rgba(34,197,94,0.08)",
    iconShadow: "rgba(34,197,94,0.15)",
    titleColor: "#15803d",
  },
  error: {
    background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
    border: "#fca5a5",
    shadow: "rgba(239,68,68,0.08)",
    iconShadow: "rgba(239,68,68,0.15)",
    titleColor: "#dc2626",
  },
};

function StatusBox({ variant, icon, title, detail }) {
  const v = VARIANTS[variant];
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: "14px 18px", borderRadius: 12,
        background: v.background,
        border: `1px solid ${v.border}`,
        display: "flex", alignItems: "center", gap: 14, marginTop: 12,
        boxShadow: `0 4px 12px ${v.shadow}`,
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        background: "white", display: "flex",
        alignItems: "center", justifyContent: "center",
        boxShadow: `0 2px 8px ${v.iconShadow}`,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontWeight: 700, color: v.titleColor, fontSize: 14, margin: 0 }}>
          {title}
        </p>
        <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
          {detail}
        </p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ScanStatus — résultat du dernier scan (chargement / succès / erreur)
   status = { loading, code, success: { message, detail }, error }
   ═══════════════════════════════════════════════════════════════════════════ */
export function ScanStatus({ status, scanningLabel, successLabel }) {
  const { t } = useTranslation();
  if (!status) return null;

  if (status.loading) {
    return (
      <StatusBox
        variant="loading"
        icon={
          <div className="animate-spin">
            <Icons.Loader size={20} color="#3b82f6" strokeWidth={2.5} />
          </div>
        }
        title={scanningLabel || t('collecte.scanning')}
        detail={status.code}
      />
    );
  }

  if (status.success) {
    return (
      <StatusBox
        variant="success"
        icon={<Icons.CheckCircle size={20} color="#22c55e" strokeWidth={2.5} />}
        title={status.success.message || successLabel}
        detail={status.success.detail}
      />
    );
  }

  if (status.error) {
    return (
      <StatusBox
        variant="error"
        icon={<Icons.AlertTriangle size={20} color="#ef4444" strokeWidth={2.5} />}
        title={t('common.error')}
        detail={status.error}
      />
    );
  }

  return null;
}
