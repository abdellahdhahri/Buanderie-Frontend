import React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "../../../../ui/badge";
import { Icons } from "../../shared/icons";
import { MessageEtape } from "../../shared/MessageEtape";

/* ═══════════════════════════════════════════════════════════════════════════
   MESSAGES D'ÉTAT — indique à l'agent la prochaine action
   ═══════════════════════════════════════════════════════════════════════════ */
export function MessagesEtape({ agent, collecte, bacBlanc, resume, modeChambre = false }) {
  const { t } = useTranslation();

  return (
    <>
      {!agent && (
        <MessageEtape
          tone="red"
          icon={<Icons.AlertTriangle size={16} color="#dc2626" strokeWidth={2.2} />}
          title={t('collecte.no_agent_connected')}
          subtitle={t('collecte.connect_to_collect')}
        />
      )}

      {agent && !collecte && (
        <MessageEtape
          tone="blue"
          icon={<Icons.Building size={16} color="#3b82f6" strokeWidth={2.2} />}
          title={modeChambre ? t('collecte.scan_room_code', 'Scannez le code-barres de la chambre') : t('collecte.scan_service_code')}
          subtitle={t('collecte.to_start_collection')}
        />
      )}

      {agent && collecte && !bacBlanc && !resume && (
        <MessageEtape
          tone="purple"
          icon={<Icons.Boxes size={16} color="#7c3aed" strokeWidth={2.2} />}
          title={t('collecte.scan_white_bac')}
          subtitle={t('collecte.to_associate_linens')}
        />
      )}

      {agent && collecte && bacBlanc && !resume && (
        <MessageEtape
          tone="green"
          animated
          icon={<Icons.CheckCircle size={16} color="#22c55e" strokeWidth={2.5} />}
          title={t('collecte.ready_to_collect')}
          subtitle={t('collecte.scan_linens_to_collect')}
          extra={
            <Badge style={{
              background: "#dcfce7", color: "#15803d",
              fontSize: 10, padding: "5px 14px", borderRadius: 20,
              fontWeight: 800,
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              <Icons.Package size={12} color="#15803d" strokeWidth={2.5} />
              {bacBlanc.codeBac}
            </Badge>
          }
        />
      )}
    </>
  );
}
