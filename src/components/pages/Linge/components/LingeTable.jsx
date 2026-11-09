import React from "react";
import { useTranslation } from "react-i18next";
import { Eye, Radio, User as UserIcon, Building2 } from "lucide-react";
import { DataTable, Badge, Code, RowActions, RowButton } from "../../../kit";
import { EtatBadge } from "./EtatBadge";
import { ATTRIBUT_META, useAttributLabel } from "./LingeIncompletsBanner";

export function LingeTable({
  linges, isLoading, displayMode, selectedId, formatEPC, getServiceName,
  onRowClick, onDetail, onAssociateRfid, onAssignService, showMissing = false, selection,
}) {
  const { t } = useTranslation();
  const attributLabel = useAttributLabel();
  const aRfid = (l) => l.rfidTag && l.rfidTag !== "";

  const columns = {
    id: {
      label: t("common.id"),
      render: (l) => (
        <>
          <strong>{l.id}</strong>
          {l.source === "EXTERNE" && (
            <span className="kit-tag" title={l.idExterne ? `${t("linge.external_id", "ID externe")} : ${l.idExterne}` : undefined}>
              {t("integration.imported", "Importé")}
            </span>
          )}
        </>
      ),
    },
    code: {
      label: displayMode === "RFID" ? t("linge.rfid_tag") : t("common.code"),
      render: (l) => (displayMode === "RFID"
        ? (l.rfidTag ? <Code>{formatEPC(l.rfidTag)}</Code> : <span className="kit-muted">{t("linge.not_associated")}</span>)
        : <Code>{l.codebarre}</Code>),
    },
    categorie: { label: t("linge.category"), render: (l) => t(`categories.${l.categorie}`, l.categorie) },
    poids: { label: t("linge.weight"), align: "right", render: (l) => (l.poids != null ? `${l.poids} kg` : "—") },
    etat: { label: t("linge.status"), render: (l) => <EtatBadge etat={l.etat} /> },
    service: {
      label: t("linge.service"),
      render: (l) => (l.serviceId ? getServiceName(l.serviceId) : (
        <button
          type="button"
          className="kit-link"
          style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          onClick={(e) => { e.stopPropagation(); onAssignService?.(l); }}
          title={t("linge.assign_service", "Affecter un service")}
        >
          <Building2 size={14} /> {getServiceName(l.serviceId)}
        </button>
      )),
    },
    porteur: {
      label: t("linge.carrier"),
      render: (l) => (l.categorie !== "UNIFORME" ? "—" : l.porteurNom
        ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><UserIcon size={14} /> {l.porteurNom}</span>
        : <span className="kit-muted">{t("linge.unassigned")}</span>),
    },
    rfid: {
      label: "RFID",
      render: (l) => (aRfid(l)
        ? <Badge variant="success">{l.rfidTag.substring(0, 8)}…</Badge>
        : <Badge variant="secondary">{t("linge.not_associated")}</Badge>),
    },
    ...(showMissing ? {
      manquants: {
        label: t("linge.incomplets.missing", "Informations manquantes"),
        render: (l) => (
          <div className="kit-chips">
            {(l.attributsManquants || []).map((a) => {
              const M = ATTRIBUT_META[a];
              return <span key={a} className="kit-chip kit-chip--warning">{M && <M.Icon size={12} />}{attributLabel(a)}</span>;
            })}
          </div>
        ),
      },
    } : {}),
    actions: {
      label: t("common.actions"), align: "center",
      render: (l) => (
        <RowActions>
          <RowButton icon={Eye} title={t("common.details")} onClick={() => onDetail(l.id)} />
          {!aRfid(l) && <RowButton icon={Radio} title="RFID" onClick={() => onAssociateRfid(l)} />}
        </RowActions>
      ),
    },
  };

  return (
    <DataTable
      columns={columns}
      rows={linges}
      selection={selection}
      activeId={selectedId}
      onRowClick={(l) => onRowClick(l.id)}
      onRowDoubleClick={(l) => onDetail(l.id)}
      loading={isLoading}
      loadingText={t("common.loading")}
      emptyText={t("linge.no_articles")}
    />
  );
}
