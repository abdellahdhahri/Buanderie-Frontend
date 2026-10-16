import React from "react";
import { useTranslation } from "react-i18next";
import { Icons } from "../../shared/icons";
import { InfoBar, InfoChip, ChipBadge } from "../../shared/InfoBar";

/* ═══════════════════════════════════════════════════════════════════════════
   BARRE D'INFO — agent, service, bac blanc + bouton reset
   ═══════════════════════════════════════════════════════════════════════════ */
export function CollecteInfoBar({ agent, collecte, bacBlanc, totalAttendu, onReset }) {
  const { t } = useTranslation();

  return (
    <InfoBar onReset={onReset}>
      {agent && (
        <InfoChip
          icon={<Icons.User size={14} color="#15803d" strokeWidth={2.2} />}
          text={agent.nomPrenom || agent.nom}
          color="#15803d"
          bg="#f0fdf4"
          border="#bbf7d0"
        />
      )}
      {collecte && (
        <InfoChip
          icon={<Icons.Building size={14} color="#0284c7" strokeWidth={2.2} />}
          text={collecte.serviceNom}
          color="#0284c7"
          bg="#f0f9ff"
          border="#bae6fd"
          delay={0.1}
        >
          <ChipBadge color="#0284c7" bg="#dbeafe">{totalAttendu}</ChipBadge>
        </InfoChip>
      )}
      {bacBlanc && (
        <InfoChip
          icon={<Icons.Boxes size={14} color="#7c3aed" strokeWidth={2.2} />}
          text={bacBlanc.codeBac}
          color="#7c3aed"
          bg="#faf5ff"
          border="#c4b5fd"
          delay={0.2}
        >
          <ChipBadge color="#7c3aed" bg="#ede9fe">{t('collecte.white_bac')}</ChipBadge>
        </InfoChip>
      )}
    </InfoBar>
  );
}
