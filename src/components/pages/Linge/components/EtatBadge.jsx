import React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "../../../kit";
import { ETAT_BADGE_VARIANTS } from "../lingeConstants";

export function EtatBadge({ etat }) {
  const { t } = useTranslation();
  return <Badge variant={ETAT_BADGE_VARIANTS[etat] || "secondary"}>{t(`linge_etat.${etat}`, etat)}</Badge>;
}
