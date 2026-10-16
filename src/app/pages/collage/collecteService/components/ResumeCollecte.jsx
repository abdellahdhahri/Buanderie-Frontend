import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Icons } from "../../shared/icons";
import { ActionButton } from "../../shared/ActionButton";
import { ResumeCard, ResumeActions } from "../../shared/ResumeCard";

/* ═══════════════════════════════════════════════════════════════════════════
   RÉSUMÉ — affiché après la clôture de la collecte service
   ═══════════════════════════════════════════════════════════════════════════ */
export function ResumeCollecte({ resume, serviceNom, nbSacs, nbInfectes, onAutreService, onTerminer }) {
  const { t } = useTranslation();

  const compteurs = [
    { icon: <Icons.CheckCheck size={22} color="#15803d" strokeWidth={2.5} />, label: t('collecte.white'), value: resume.nbBlancs, color: "#15803d", bg: "#f0fdf4" },
    { icon: <Icons.Biohazard size={22} color="#dc2626" strokeWidth={2.2} />, label: t('collecte.infected'), value: resume.nbInfectes, color: "#dc2626", bg: "#fef2f2" },
    { icon: <Icons.CheckCircle size={22} color="#0284c7" strokeWidth={2.5} />, label: t('collecte.propre'), value: resume.nbPropres, color: "#0284c7", bg: "#f0f9ff" },
    { icon: <Icons.AlertTriangle size={22} color="#d97706" strokeWidth={2.2} />, label: t('collecte.missing'), value: resume.nbManquants, color: "#d97706", bg: "#fffbeb" },
  ];

  return (
    <ResumeCard
      title={t('collecte.collection_completed')}
      subtitle={resume.serviceNom || serviceNom}
      compteurs={compteurs}
    >
      {nbSacs > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            padding: "12px 18px", background: "#fef2f2",
            borderRadius: 12, fontSize: 12.5, color: "#dc2626",
            fontWeight: 700, marginBottom: 22,
            border: "1px solid #fca5a5",
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 9,
          }}
        >
          <Icons.Biohazard size={15} color="#dc2626" strokeWidth={2.5} />
          {nbSacs} {t('collecte.infected_sacs')} (
          {nbInfectes} {t('collecte.pieces')}) → {t('collecte.waiting_for_reception')}
        </motion.div>
      )}

      <ResumeActions>
        <ActionButton
          onClick={onAutreService}
          icon={<Icons.BoxOpen size={15} color="white" strokeWidth={2.5} />}
          label={`+ ${t('collecte.another_service')}`}
          type="primary"
        />
        <ActionButton
          onClick={onTerminer}
          icon={null}
          label={t('collecte.finish')}
          type="default"
        />
      </ResumeActions>
    </ResumeCard>
  );
}
