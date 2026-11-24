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
    { icon: <Icons.CheckCheck size={22} color="#0794a4" strokeWidth={2.5} />, label: t('collecte_uniforme.white'), value: resume.nbBlancs, color: "#0794a4", bg: "#ffffff" },
    { icon: <Icons.Biohazard size={22} color="#b91c1c" strokeWidth={2.2} />, label: t('collecte_uniforme.infected'), value: resume.nbInfectes, color: "#b91c1c", bg: "#ffffff" },
    { icon: <Icons.CheckCircle size={22} color="#047857" strokeWidth={2.5} />, label: t('collecte_uniforme.clean'), value: resume.nbPropres, color: "#047857", bg: "#ffffff" },
    { icon: <Icons.AlertTriangle size={22} color="#b45309" strokeWidth={2.2} />, label: t('collecte_uniforme.missing_short'), value: resume.nbManquants, color: "#b45309", bg: "#ffffff" },
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
          type="primary"
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
