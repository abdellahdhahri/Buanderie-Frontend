import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Button } from "../../../ui/button";
import { Icons } from "./icons";
import "./CollecteRh.css";

export function ChipBadge({ children, style }) {
  return <span className="cr-chip__badge" style={style}>{children}</span>;
}

export function InfoChip({ icon, text, color, delay, children }) {
  return (
    <motion.span
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={delay ? { delay } : undefined}
      className="cr-chip"
      style={{ "--c": color }}
    >
      <span className="cr-chip__dot">{icon}</span>
      {text}
      {children}
    </motion.span>
  );
}

export function InfoBar({ children, onReset }) {
  const { t } = useTranslation();
  return (
    <div className="cr-infobar">
      <div className="cr-infobar__chips">{children}</div>
      {onReset && (
        <Button type="button" variant="outline" size="sm" onClick={onReset} className="text-red-600 hover:bg-red-50" style={{ gap: 6, borderRadius: 10, fontWeight: 700 }}>
          <Icons.Refresh size={13} strokeWidth={2.5} />
          {t("common.reset")}
        </Button>
      )}
    </div>
  );
}
