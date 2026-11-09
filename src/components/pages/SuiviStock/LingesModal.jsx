import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BedDouble, Layers, RefreshCw, User } from "lucide-react";
import { fetchLingesSuivi } from "../../../services/suiviStockService";
import { zoneLabel, zoneMeta } from "../../../constants/zonesStock";
import { accentOf } from "../StockageArsenal/arsenalUtils";
import { Modal, Button, DataTable, Pagination, Badge, Code, DetailAlert } from "../../kit";

const SIZE = 50;

function Localisation({ l }) {
  const { t } = useTranslation();
  const style = { display: "inline-flex", alignItems: "center", gap: 6 };
  if (l.arsenalEmplacementID != null) return <span style={style}><Layers size={14} />{t("suiviStock.loc_shelf", { id: l.arsenalEmplacementID })}</span>;
  if (l.chambreId != null || l.litId != null) {
    const parts = [
      l.chambreId != null && t("suiviStock.loc_room", { id: l.chambreId }),
      l.litId != null && t("suiviStock.loc_bed", { id: l.litId }),
    ].filter(Boolean);
    return <span style={style}><BedDouble size={14} />{parts.join(" · ")}</span>;
  }
  if (l.porteurNom) return <span style={style}><User size={14} />{l.porteurNom}</span>;
  return <span className="kit-muted">—</span>;
}

const Pastille = ({ color, children }) => (
  <span className="kit-chip" style={{ borderColor: color }}>
    <i style={{ width: 8, height: 8, borderRadius: 999, background: color, display: "inline-block" }} />{children}
  </span>
);

export default function LingesModal({ filter, onClose }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [result, setResult] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchLingesSuivi({ zone: filter.zone, categorie: filter.categorie, serviceId: filter.serviceId, page, size: SIZE })
      .then((data) => !cancelled && setResult({ page, reload, data }))
      .catch((e) => !cancelled && setResult({ page, reload, error: e.message }));
    return () => { cancelled = true; };
  }, [filter, page, reload]);

  const loading = !result || result.page !== page || result.reload !== reload;
  const data = !loading ? result.data : null;
  const totalPages = Math.max(data?.totalPages || 0, 1);
  const title = [
    filter.zone ? zoneLabel(t, filter.zone) : t("suiviStock.all_zones"),
    filter.categorie && t(`categories.${filter.categorie}`, filter.categorie),
    filter.serviceName,
  ].filter(Boolean).join(" · ");

  const columns = {
    codeBarre: { label: t("suiviStock.col_code"), render: (l) => <Code>{l.codeBarre}</Code> },
    designation: { label: t("suiviStock.col_designation"), render: (l) => l.designation || "—" },
    categorie: { label: t("suiviStock.col_category"), render: (l) => (l.categorie ? <Pastille color={accentOf(l.categorie)}>{t(`categories.${l.categorie}`, l.categorie)}</Pastille> : "—") },
    etat: { label: t("suiviStock.col_state"), render: (l) => (l.etat ? <Badge variant="default">{t(`historique.etat.${l.etat}`, l.etat)}</Badge> : "—") },
    localisation: { label: t("suiviStock.col_location"), render: (l) => <Localisation l={l} /> },
  };

  return (
    <Modal
      size="xl"
      title={title}
      subtitle={data ? t("suiviStock.linges_count", { count: data.total }) : t("common.loading")}
      onClose={onClose}
      footer={<Button onClick={onClose}>{t("common.close")}</Button>}
    >
      <div className="kit-chips" style={{ marginBottom: 12 }}>
        <Pastille color={filter.zone ? zoneMeta(filter.zone).color : "#94a3b8"}>{filter.zone ? zoneLabel(t, filter.zone) : t("suiviStock.all_zones")}</Pastille>
        {filter.categorie && <Pastille color={accentOf(filter.categorie)}>{t(`categories.${filter.categorie}`, filter.categorie)}</Pastille>}
        {filter.serviceName && <Pastille color="#0794a4">{filter.serviceName}</Pastille>}
      </div>
      {result?.error && !loading ? (
        <DetailAlert title={result.error}>
          <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={() => setReload((r) => r + 1)}>{t("suiviStock.retry")}</Button>
        </DetailAlert>
      ) : (
        <div className="employee-list-section">
          <DataTable
            columns={columns}
            rows={data?.linges || []}
            rowKey={(l) => l.lingeId ?? l.codeBarre}
            loading={loading}
            loadingText={t("common.loading")}
            emptyText={t("suiviStock.no_linges")}
          />
          {data && (
            <Pagination total={data.total} page={page + 1} totalPages={totalPages} pageSize={SIZE} onPage={(p) => setPage(p - 1)} unit={t("suiviStock.col_code", "linge(s)")} />
          )}
        </div>
      )}
    </Modal>
  );
}
