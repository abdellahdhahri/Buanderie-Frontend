import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Icons } from "../../shared/icons";
import { ActionButton } from "../../shared/ActionButton";
import { ResumeCard, ResumeActions } from "../../shared/ResumeCard";

/* ═══════════════════════════════════════════════════════════════════════════
   RÉSUMÉ — affiché après la clôture de la collecte service
   ═══════════════════════════════════════════════════════════════════════════ */
export function ResumeCollecte({ resume, serviceNom, nbBacs, nbInfectes, onAutreService, onTerminer }) {
  const { t } = useTranslation();

  const compteurs = [
    { icon: <Icons.CheckCheck size={22} color="#0794a4" strokeWidth={2.5} />, label: t('collecte.white'), value: resume.nbBlancs, color: "#0794a4", bg: "#ffffff" },
    { icon: <Icons.Biohazard size={22} color="#b91c1c" strokeWidth={2.2} />, label: t('collecte.infected'), value: resume.nbInfectes, color: "#b91c1c", bg: "#ffffff" },
    { icon: <Icons.CheckCircle size={22} color="#047857" strokeWidth={2.5} />, label: t('collecte.propre'), value: resume.nbPropres, color: "#047857", bg: "#ffffff" },
    { icon: <Icons.AlertTriangle size={22} color="#b45309" strokeWidth={2.2} />, label: t('collecte.missing'), value: resume.nbManquants, color: "#b45309", bg: "#ffffff" },
  ];

  return (
    <ResumeCard
      title={t('collecte.collection_completed')}
      subtitle={resume.serviceNom || serviceNom}
      compteurs={compteurs}
    >
      {nbBacs > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            padding: "12px 18px", background: "#fef2f2",
            borderRadius: 12, fontSize: 12.5, color: "#b91c1c",
            fontWeight: 700, marginBottom: 22,
            border: "1px solid #fecaca",
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 9,
          }}
        >
          <Icons.Biohazard size={15} color="#b91c1c" strokeWidth={2.5} />
          {t('collecte.bac_infecte.resume', '{{n}} pièce(s) infectée(s) déclarée(s) dans {{b}} bac(s) infecté(s)', { n: nbInfectes, b: resume.nbBacsInfectes ?? nbBacs })} → {t('collecte.waiting_for_reception')}
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
