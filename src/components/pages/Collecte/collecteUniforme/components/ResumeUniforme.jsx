import React from "react";
import { useTranslation } from "react-i18next";
import { Icons } from "../../shared/icons";
import { ActionButton } from "../../shared/ActionButton";
import { ResumeCard, ResumeActions } from "../../shared/ResumeCard";

/* ═══════════════════════════════════════════════════════════════════════════
   RÉSUMÉ — affiché après la clôture de la collecte uniforme
   ═══════════════════════════════════════════════════════════════════════════ */
export function ResumeUniforme({ resume, personnelNom, onAutreMedecin, onTerminer }) {
  const { t } = useTranslation();

  const compteurs = [
    { icon: <Icons.CheckCheck size={22} color="#15803d" strokeWidth={2.5} />, label: t('collecte_uniforme.white'), value: resume.nbBlancs, color: "#15803d", bg: "#f0fdf4" },
    { icon: <Icons.Biohazard size={22} color="#dc2626" strokeWidth={2.2} />, label: t('collecte_uniforme.infected'), value: resume.nbInfectes, color: "#dc2626", bg: "#fef2f2" },
    { icon: <Icons.CheckCircle size={22} color="#0284c7" strokeWidth={2.5} />, label: t('collecte_uniforme.clean'), value: resume.nbPropres, color: "#0284c7", bg: "#f0f9ff" },
    { icon: <Icons.AlertTriangle size={22} color="#d97706" strokeWidth={2.2} />, label: t('collecte_uniforme.missing_short'), value: resume.nbManquants, color: "#d97706", bg: "#fffbeb" },
  ];

  return (
    <ResumeCard
      title={t('collecte_uniforme.collection_completed')}
      subtitle={personnelNom}
      compteurs={compteurs}
      minColWidth={100}
    >
      <ResumeActions>
        <ActionButton
          onClick={onAutreMedecin}
          icon={<Icons.UserMd size={15} color="white" strokeWidth={2.5} />}
          label={t('collecte_uniforme.another_doctor')}
          type="sky"
        />
        <ActionButton
          onClick={onTerminer}
          icon={null}
          label={t('collecte_uniforme.finish')}
          type="default"
        />
      </ResumeActions>
    </ResumeCard>
  );
}
