import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Icons } from "./icons";
import "./CollecteRh.css";

function StatusBox({ variant, icon, title, detail }) {
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className={`cr-status is-${variant}`}>
      <span className="cr-status__icon">{icon}</span>
      <div>
        <strong>{title}</strong>
        {detail && <small>{detail}</small>}
      </div>
    </motion.div>
  );
}

export function ScanStatus({ status, scanningLabel, successLabel }) {
  const { t } = useTranslation();
  if (!status) return null;
  if (status.loading) {
    return (
      <StatusBox
        variant="loading"
        icon={<span className="animate-spin"><Icons.Loader size={16} color="#0794a4" strokeWidth={2.5} /></span>}
        title={scanningLabel || t("collecte.scanning")}
        detail={status.code}
      />
    );
  }
  if (status.success) {
    return (
      <StatusBox
        variant="success"
        icon={<Icons.CheckCircle size={16} color="#10b981" strokeWidth={2.5} />}
        title={status.success.message || successLabel}
        detail={status.success.detail}
      />
    );
  }
  if (status.error) {
    return (
      <StatusBox
        variant="error"
        icon={<Icons.AlertTriangle size={16} color="#ef4444" strokeWidth={2.5} />}
        title={t("common.error")}
        detail={status.error}
      />
    );
  }
  return null;
}
