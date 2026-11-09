import React from "react";
import { useTranslation } from "react-i18next";
import { Pencil } from "lucide-react";
import { getCategorieMeta } from "../../../../constants/categoriesLinge";
import { formatDateTime } from "../../../../utils/appSettings";
import { Modal, Button, KpiTiles, DetailCard, DetailGrid, InfoList } from "../../../kit";
import { EtatBadge } from "./EtatBadge";

export function LingeDetailModal({ linge, onClose, onEdit, getServiceName, getPorteurName }) {
  const { t } = useTranslation();
  if (!linge) return null;
  const { Icon: CatIcon, accent } = getCategorieMeta(linge.categorie);
  const porteur = linge.porteurNom || (linge.porteurId ? getPorteurName(linge.porteurId) : null);

  return (
    <Modal
      size="lg"
      icon={<CatIcon size={20} color={accent} />}
      title={`${t("linge.details")} · ${linge.codebarre}`}
      subtitle={`#${linge.id}`}
      onClose={onClose}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>{t("common.close")}</Button>
          <Button icon={<Pencil size={16} />} onClick={() => onEdit(linge)}>{t("common.edit")}</Button>
        </>
      )}
    >
      <div className="kit-chips" style={{ marginBottom: 14 }}>
        <EtatBadge etat={linge.etat} />
        <span className="kit-chip" style={{ color: accent }}><CatIcon size={12} /> {t(`categories.${linge.categorie}`, linge.categorie)}</span>
      </div>
      <KpiTiles items={[
        { label: t("linge.weight"), value: linge.poids != null ? `${linge.poids} kg` : "—", tone: "blue" },
        { label: t("linge.life_cycles"), value: linge.dureVie ?? "—", tone: "green" },
      ]} />
      <DetailGrid>
        <DetailCard title={t("linge.sections.identification", "Identification")}>
          <InfoList items={[
            { label: t("linge.tracking_code"), value: linge.codebarre },
            { label: "RFID", value: linge.rfidTag || null },
            linge.source && { label: t("linge.source", "Source"), value: linge.source === "EXTERNE" ? t("integration.imported", "Importé") : linge.source },
            linge.idExterne && { label: t("linge.external_id", "ID externe"), value: linge.idExterne },
          ].filter(Boolean)} />
        </DetailCard>
        <DetailCard title={t("linge.sections.characteristics", "Caractéristiques")}>
          <InfoList items={[
            { label: t("linge.category"), value: t(`categories.${linge.categorie}`, linge.categorie) },
            { label: t("linge.life_cycles"), value: linge.dureVie ? `${linge.dureVie} ${t("common.cycles")}` : null },
            linge.typeCollecte && { label: t("linge.collection_type"), value: linge.typeCollecte },
          ].filter(Boolean)} />
        </DetailCard>
        <DetailCard title={t("linge.sections.assignment", "Affectation")}>
          <InfoList items={[
            { label: t("linge.service"), value: getServiceName(linge.serviceId) },
            porteur && { label: t("linge.carrier"), value: porteur },
          ].filter(Boolean)} />
        </DetailCard>
        <DetailCard title={t("linge.sections.tracking", "Suivi")}>
          <InfoList items={[
            { label: t("common.creation_date"), value: linge.dateCreation ? formatDateTime(linge.dateCreation) : null },
            linge.dateSynchro && { label: t("linge.sync_date", "Dernière synchronisation"), value: formatDateTime(linge.dateSynchro) },
          ].filter(Boolean)} />
        </DetailCard>
      </DetailGrid>
      {linge.observations && (
        <DetailCard title={t("linge.observations")}>
          <p className="avd-text">{linge.observations}</p>
        </DetailCard>
      )}
    </Modal>
  );
}
