import React from "react";
import { motion } from "framer-motion";

// Couleurs prédéfinies des bandeaux
const TONES = {
  red:    { titleColor: "#dc2626", background: "linear-gradient(135deg, #fef2f2, #fee2e2)", border: "#fca5a5", iconShadow: "rgba(220,38,38,0.15)" },
  blue:   { titleColor: "#1d4ed8", background: "linear-gradient(135deg, #eff6ff, #dbeafe)", border: "#93c5fd", iconShadow: "rgba(59,130,246,0.15)" },
  purple: { titleColor: "#7c3aed", background: "linear-gradient(135deg, #faf5ff, #ede9fe)", border: "#c4b5fd", iconShadow: "rgba(124,58,237,0.15)" },
  green:  { titleColor: "#15803d", background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "#bbf7d0", iconShadow: "rgba(34,197,94,0.15)" },
};

/* ═══════════════════════════════════════════════════════════════════════════
   MessageEtape — bandeau « prochaine action » (icône + titre + sous-titre)
   ═══════════════════════════════════════════════════════════════════════════ */
export function MessageEtape({ tone, icon, title, subtitle, extra, animated }) {
  const { titleColor, background, border, iconShadow } = TONES[tone];
  const Wrapper = animated ? motion.div : "div";
  const animProps = animated ? { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 } } : {};

  return (
    <Wrapper
      {...animProps}
      style={{
        padding: "13px 17px", borderRadius: 12,
        background, border: `1px solid ${border}`, marginBottom: 16,
        display: "flex", alignItems: "center", gap: 11,
        ...(extra ? { flexWrap: "wrap" } : {}),
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: "white", display: "flex",
        alignItems: "center", justifyContent: "center",
        boxShadow: `0 2px 8px ${iconShadow}`,
      }}>
        {icon}
      </div>
      <div style={extra ? { flex: 1 } : undefined}>
        <div style={{ fontSize: 13.5, color: titleColor, fontWeight: 800 }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, fontWeight: 500 }}>
          {subtitle}
        </div>
      </div>
      {extra}
    </Wrapper>
  );
}
