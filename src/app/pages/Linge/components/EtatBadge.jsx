import React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "../../../components/ui/badge";
import { ETAT_BADGE_VARIANTS } from "../lingeConstants";

// ═══════════════════════════════════════════════════════════════════════════
// 🏷️ BADGE ÉTAT
// ═══════════════════════════════════════════════════════════════════════════
export function EtatBadge({ etat }) {
  const { t } = useTranslation();
  const variant = ETAT_BADGE_VARIANTS[etat] || "secondary";
  return <Badge variant={variant}>{t(`linge_etat.${etat}`, etat)}</Badge>;
}
