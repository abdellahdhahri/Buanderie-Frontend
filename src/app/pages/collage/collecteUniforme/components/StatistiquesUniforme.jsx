import React from "react";
import { useTranslation } from "react-i18next";
import { Icons } from "../../shared/icons";
import { StatutCard } from "../../shared/StatutCard";

/* ═══════════════════════════════════════════════════════════════════════════
   STATISTIQUES — total / blancs / infectés / manquants
   ═══════════════════════════════════════════════════════════════════════════ */
export function StatistiquesUniforme({ total, blancs, infectes, manquants }) {
  const { t } = useTranslation();

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
      gap: 12, marginBottom: 20,
    }}>
      <StatutCard
        label={t('collecte_uniforme.total')}
        value={total}
        icon={<Icons.Layers size={19} color="#0ea5e9" strokeWidth={2.2} />}
        color="#0ea5e9"
        bg="linear-gradient(135deg, #f0f9ff, #e0f2fe)"
      />
      <StatutCard
        label={t('collecte_uniforme.white')}
        value={blancs}
        icon={<Icons.CheckCheck size={19} color="#15803d" strokeWidth={2.5} />}
        color="#15803d"
        bg="linear-gradient(135deg, #f0fdf4, #dcfce7)"
      />
      <StatutCard
        label={t('collecte_uniforme.infected')}
        value={infectes}
        icon={<Icons.Biohazard size={19} color="#dc2626" strokeWidth={2.2} />}
        color="#dc2626"
        bg="linear-gradient(135deg, #fef2f2, #fee2e2)"
      />
      <StatutCard
        label={t('collecte_uniforme.missing')}
        value={manquants}
        icon={<Icons.AlertTriangle size={19} color="#d97706" strokeWidth={2.2} />}
        color="#d97706"
        bg="linear-gradient(135deg, #fffbeb, #fef3c7)"
      />
    </div>
  );
}
