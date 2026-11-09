import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Badge } from "../../../ui/badge";
import { Button } from "../../../ui/button";
import { Icons } from "./icons";

// Petit badge arrondi affiché dans une pastille
export function ChipBadge({ children, color, bg, style }) {
  return (
    <Badge style={{
      background: bg, color,
      fontSize: 10, padding: "2px 10px", borderRadius: 20,
      fontWeight: 700,
      ...style,
    }}>
      {children}
    </Badge>
  );
}

// Pastille colorée (agent / service / médecin / bac…)
export function InfoChip({ icon, text, color, bg, border, delay, children }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={delay ? { delay } : undefined}
      style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: "9px 18px", background: bg,
        borderRadius: 12, border: `1px solid ${border}`,
      }}
    >
      {icon}
      <span style={{ fontSize: 13, fontWeight: 700, color }}>
        {text}
      </span>
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BARRE D'INFO — pastilles (children) + bouton reset
   ═══════════════════════════════════════════════════════════════════════════ */
export function InfoBar({ children, onReset }) {
  const { t } = useTranslation();

  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      alignItems: "center", marginBottom: 20,
      flexWrap: "wrap", gap: 10,
    }}>
      <div style={{
        display: "flex", alignItems: "center",
        gap: 10, flexWrap: "wrap",
      }}>
        {children}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        style={{
          fontSize: 12, gap: 6, borderColor: "#fca5a5",
          color: "#dc2626", borderRadius: 10, padding: "7px 15px",
          transition: "all 0.2s", fontWeight: 700,
          display: "inline-flex", alignItems: "center",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <Icons.Refresh size={13} strokeWidth={2.5} />
        {t('common.reset')}
      </Button>
    </div>
  );
}
