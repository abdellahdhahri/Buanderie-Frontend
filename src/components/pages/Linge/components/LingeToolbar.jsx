import React from "react";
import { useTranslation } from "react-i18next";
import { History, RefreshCw, Radio, Building2 } from "lucide-react";
import { LabelIcon } from "../../../ui/LabelIcon";
import { SynchroniserButton } from "../../../ui/SynchroniserButton";
import { ActionBar, ActionButton } from "../../../kit";
import { IconAjouter, IconDetails, IconModifier, IconSupprimer } from "../../../kit/ActionIcons";

export function LingeToolbar({
  hasSelection, isLoading, canCreate = true, onNew, onSynchronised, onAssociateRfid,
  onDetail, onEdit, onDelete, onPrintLabel, onHistory, onRefresh, onAssignService,
}) {
  const { t } = useTranslation();
  return (
    <ActionBar>
      {canCreate && <ActionButton icon={IconAjouter} label={t("linge.new_article")} variant="ajouter" onClick={onNew} />}
      <SynchroniserButton referentiel="LINGE" onTermine={onSynchronised} variant="action" />
      <ActionButton icon={IconDetails} label={t("common.details")} variant="details" disabled={!hasSelection} onClick={onDetail} />
      <ActionButton icon={IconModifier} label={t("common.edit")} variant="modifier" disabled={!hasSelection} onClick={onEdit} />
      <ActionButton icon={IconSupprimer} label={t("common.delete")} variant="supprimer" disabled={!hasSelection} onClick={onDelete} />
      {onAssignService && <ActionButton icon={<Building2 size={18} />} label={t("linge.assign.button", "Affecter à un service")} variant="etat-accepter" onClick={onAssignService} />}
      <ActionButton icon={<Radio size={18} />} label={t("linge.associate_rfid")} variant="rapport-global" disabled={!hasSelection} onClick={onAssociateRfid} />
      <ActionButton icon={<LabelIcon className="w-[18px] h-[18px]" strokeWidth={2} />} label={t("linge.label")} variant="imprimer" disabled={!hasSelection} onClick={onPrintLabel} />
      <ActionButton icon={History} label={t("linge.history")} variant="imprimer" disabled={!hasSelection} onClick={onHistory} />
      <ActionButton icon={<RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />} label={t("common.refresh")} variant="details" onClick={onRefresh} />
    </ActionBar>
  );
}
