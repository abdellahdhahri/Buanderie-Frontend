import React from "react";
import { useTranslation } from "react-i18next";
import { Icons } from "../../shared/icons";
import { MessageEtape } from "../../shared/MessageEtape";

/* ═══════════════════════════════════════════════════════════════════════════
   MESSAGES D'ÉTAT — indique à l'agent la prochaine action
   ═══════════════════════════════════════════════════════════════════════════ */
export function MessagesEtapeUniforme({ agent, collecte, etape, uniformeEnCours }) {
  const { t } = useTranslation();

  return (
    <>
      {!agent && (
        <MessageEtape
          tone="red"
          icon={<Icons.AlertTriangle size={16} color="#dc2626" strokeWidth={2.2} />}
          title={t('collecte_uniforme.no_agent_connected')}
          subtitle={t('collecte_uniforme.connect_to_collect')}
        />
      )}

      {agent && !collecte && (
        <MessageEtape
          tone="purple"
          icon={<Icons.UserMd size={16} color="#7c3aed" strokeWidth={2.2} />}
          title={t('collecte_uniforme.scan_doctor_badge')}
          subtitle={t('collecte_uniforme.to_start_collection')}
        />
      )}

      {agent && collecte && etape === "SCAN" && !uniformeEnCours && (
        <MessageEtape
          tone="green"
          icon={<Icons.CheckCircle size={16} color="#22c55e" strokeWidth={2.5} />}
          title={t('collecte_uniforme.ready_to_collect')}
          subtitle={t('collecte_uniforme.scan_uniform')}
        />
      )}
    </>
  );
}
