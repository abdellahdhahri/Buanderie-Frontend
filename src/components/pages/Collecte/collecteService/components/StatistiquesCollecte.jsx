import React from "react";
import { useTranslation } from "react-i18next";
import { Icons } from "../../shared/icons";
import { StatutCard } from "../../shared/StatutCard";
import { useCircuitInfecte } from "../../../../../hooks/useEstablishment";

/* ═══════════════════════════════════════════════════════════════════════════
   STATISTIQUES — cartes cliquables qui filtrent la liste
   ═══════════════════════════════════════════════════════════════════════════ */
export function StatistiquesCollecte({
  nbBlancs, nbInfectes, nbPropres, nbManq, nbNonTr,
  nbAttendus, totalAttendu, nbSacs, filter, onFilter,
}) {
  const { t } = useTranslation();
  const circuitInfecte = useCircuitInfecte();
  const resteColor = nbNonTr > 0 ? "#f59e0b" : "#10b981";

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
      gap: 12, marginBottom: 20,
    }}>
      <StatutCard
        label={t('collecte.white')}
        value={nbBlancs}
        icon={<Icons.CheckCheck size={19} color="#15803d" strokeWidth={2.5} />}
        color="#15803d"
        bg="linear-gradient(135deg, #f0fdf4, #dcfce7)"
        subValue={`${nbAttendus} ${t('collecte.expected')}`}
        onClick={() => onFilter("blanc")}
        active={filter === "blanc"}
      />
      {circuitInfecte && <StatutCard
        label={t('collecte.infected')}
        value={nbInfectes}
        icon={<Icons.Biohazard size={19} color="#dc2626" strokeWidth={2.2} />}
        color="#dc2626"
        bg="linear-gradient(135deg, #fef2f2, #fee2e2)"
        subValue={`${nbSacs} ${t('collecte.sacs')}`}
      />}
      <StatutCard
        label={t('collecte.propre')}
        value={nbPropres}
        icon={<Icons.CheckCircle size={19} color="#0284c7" strokeWidth={2.5} />}
        color="#0284c7"
        bg="linear-gradient(135deg, #f0f9ff, #e0f2fe)"
        subValue={t('collecte.kept_in_place')}
        onClick={() => onFilter("propre")}
        active={filter === "propre"}
      />
      <StatutCard
        label={t('collecte.missing')}
        value={nbManq}
        icon={<Icons.AlertTriangle size={19} color="#d97706" strokeWidth={2.2} />}
        color="#d97706"
        bg="linear-gradient(135deg, #fffbeb, #fef3c7)"
        subValue={t('collecte.to_report')}
        onClick={() => onFilter("manquant")}
        active={filter === "manquant"}
      />
      <StatutCard
        label={t('collecte.remaining')}
        value={nbNonTr}
        icon={<Icons.Refresh size={19} color={resteColor} strokeWidth={2.2} />}
        color={resteColor}
        bg={nbNonTr > 0 ? "linear-gradient(135deg, #fffbeb, #fef3c7)" : "linear-gradient(135deg, #f0fdf4, #dcfce7)"}
        subValue={
          nbNonTr > 0
            ? `${Math.round((nbNonTr / totalAttendu) * 100)}%`
            : `${t('collecte.all_done')}`
        }
        onClick={() => onFilter("untreated")}
        active={filter === "untreated"}
      />
    </div>
  );
}
