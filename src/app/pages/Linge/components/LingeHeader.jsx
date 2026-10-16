import React from "react";
import { useTranslation } from "react-i18next";
import { PageHeaderIcon } from "../../../components/layout/PageHeaderIcon";

// ═══════════════════════════════════════════════════════════════════════════
// 🧾 EN-TÊTE DE PAGE
// ═══════════════════════════════════════════════════════════════════════════
export function LingeHeader({ displayMode }) {
  const { t } = useTranslation();

  return (
    <div style={{ marginBottom: "32px" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        marginBottom: "8px"
      }}>
        <PageHeaderIcon size={52} />
        <div>
          <h1 style={{
            fontSize: "28px",
            fontWeight: 800,
            color: "#0f172a",
            margin: 0
          }}>
            {displayMode === "RFID" ? t('linge.title_rfid') : t('linge.title')}
          </h1>
          <p style={{
            fontSize: "14px",
            color: "#64748b",
            margin: "2px 0 0 0"
          }}>
            {displayMode === "RFID"
              ? t('linge.subtitle_rfid')
              : t('linge.subtitle')}
          </p>
        </div>
      </div>
    </div>
  );
}
