import React from "react";
import { useTranslation } from "react-i18next";

export const GROUPES_LAVAGE = ["BLANC", "COULEUR"];

const STYLES = {
  BLANC: { background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1" },
  COULEUR: { background: "#dbeafe", color: "#1d4ed8", border: "1px solid #93c5fd" },
  LIBRE: { background: "transparent", color: "#64748b", border: "1px dashed #cbd5e1" },
};

const BASE = {
  display: "inline-flex",
  alignItems: "center",
  padding: "1px 8px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: ".03em",
  lineHeight: 1.6,
  whiteSpace: "nowrap",
};

export function libelleGroupeLavage(t, groupe) {
  return groupe ? t(`groupe_lavage.${groupe}`, groupe === "BLANC" ? "Blanc" : groupe === "COULEUR" ? "Couleur" : groupe) : "";
}

export default function GroupeLavageBadge({ groupe, libre = false, vide = null, style }) {
  const { t } = useTranslation();
  if (!groupe) {
    if (libre) return <span style={{ ...BASE, ...STYLES.LIBRE, ...style }}>{t("groupe_lavage.libre", "Libre")}</span>;
    return vide;
  }
  const s = STYLES[groupe] || STYLES.BLANC;
  return <span style={{ ...BASE, ...s, ...style }}>{libelleGroupeLavage(t, groupe)}</span>;
}

export const ORIGINES_PROGRAMME = {
  GROUPE: ["origine_programme.GROUPE", "Programme du groupe"],
  DEFAUT: ["origine_programme.DEFAUT", "Programme par défaut"],
  CATEGORIE: ["origine_programme.CATEGORIE", "Programme de catégorie"],
};

export function libelleOrigineProgramme(t, origine) {
  const o = ORIGINES_PROGRAMME[origine];
  return o ? t(o[0], o[1]) : origine || "";
}
