import React from "react";
import { useTranslation } from "react-i18next";
import { Icons } from "../../shared/icons";
import { InfoBar, InfoChip, ChipBadge } from "../../shared/InfoBar";

/* ═══════════════════════════════════════════════════════════════════════════
   BARRE D'INFO — agent, médecin (+ contact infectieux) + bouton reset
   ═══════════════════════════════════════════════════════════════════════════ */
export function UniformeInfoBar({ agent, collecte, onReset }) {
  const { t } = useTranslation();

  return (
    <InfoBar onReset={onReset}>
      {agent && (
        <InfoChip
          icon={<Icons.User size={14} color="#7c3aed" strokeWidth={2.2} />}
          text={agent.nomPrenom || agent.nom}
          color="#7c3aed"
          bg="#faf5ff"
          border="#e9d5ff"
        >
          <ChipBadge color="#7c3aed" bg="#ede9fe">
            {agent.codeBarre || agent.matricule}
          </ChipBadge>
        </InfoChip>
      )}
      {collecte && (
        <InfoChip
          icon={<Icons.UserMd size={14} color="#0284c7" strokeWidth={2.2} />}
          text={collecte.personnelNom}
          color="#0284c7"
          bg="#f0f9ff"
          border="#bae6fd"
          delay={0.1}
        >
          <ChipBadge color="#0284c7" bg="#e0f2fe">
            {collecte.nbUniformes} {t('collecte_uniforme.uniforms')}
          </ChipBadge>
          {collecte.estInfecte && (
            <ChipBadge
              color="#dc2626"
              bg="#fee2e2"
              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              <Icons.Biohazard size={10} color="#dc2626" strokeWidth={2.5} />
              {t('collecte_uniforme.infected')}
            </ChipBadge>
          )}
        </InfoChip>
      )}
    </InfoBar>
  );
}
