import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BedDouble, ChevronLeft, ChevronRight, Layers, RefreshCw, User } from "lucide-react";
import { Modal } from "../../components/ui/modal";
import { fetchLingesSuivi } from "../../services/suiviStockService";
import { zoneLabel, zoneMeta } from "../../constants/zonesStock";
import { accentOf } from "../stockageArsenal/arsenalUtils";
import { EmptyState, Loading } from "../stockageArsenal/arsenalUi";

const SIZE = 50;

function Localisation({ l }) {
  const { t } = useTranslation();
  if (l.arsenalEmplacementID != null) {
    return <span className="ss-loc"><Layers size={14} />{t("suiviStock.loc_shelf", { id: l.arsenalEmplacementID })}</span>;
  }
  if (l.chambreId != null || l.litId != null) {
    const parts = [
      l.chambreId != null && t("suiviStock.loc_room", { id: l.chambreId }),
      l.litId != null && t("suiviStock.loc_bed", { id: l.litId }),
    ].filter(Boolean);
    return <span className="ss-loc"><BedDouble size={14} />{parts.join(" · ")}</span>;
  }
  if (l.porteurNom) {
    return <span className="ss-loc"><User size={14} />{l.porteurNom}</span>;
  }
  return <span className="ss-zero">—</span>;
}

/**
 * Linges correspondant à un filtre { zone?, categorie?, serviceId?, serviceName? }.
 * Le parent remonte ce composant (key) à chaque nouveau filtre.
 */
export default function LingesModal({ filter, onClose }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [result, setResult] = useState(null); // { page, data } | { page, error }
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchLingesSuivi({ zone: filter.zone, categorie: filter.categorie, serviceId: filter.serviceId, page, size: SIZE })
      .then((data) => !cancelled && setResult({ page, reload, data }))
      .catch((e) => !cancelled && setResult({ page, reload, error: e.message }));
    return () => {
      cancelled = true;
    };
  }, [filter, page, reload]);

  const loading = !result || result.page !== page || result.reload !== reload;
  const data = !loading ? result.data : null;
  const totalPages = data?.totalPages || 0;

  const title = [
    filter.zone ? zoneLabel(t, filter.zone) : t("suiviStock.all_zones"),
    filter.categorie && t(`categories.${filter.categorie}`, filter.categorie),
    filter.serviceName,
  ].filter(Boolean).join(" · ");

  return (
    <Modal
      isOpen
      onClose={onClose}
      variant="detail"
      size="xl"
      title={title}
      subtitle={data ? t("suiviStock.linges_count", { count: data.total }) : t("common.loading")}
    >
      <div className="sa-page ss-page" style={{ gap: 0 }}>
        <div className="ss-filters">
          <span className="ss-filter" style={filter.zone ? { "--z": zoneMeta(filter.zone).color } : undefined}>
            <i />{filter.zone ? zoneLabel(t, filter.zone) : t("suiviStock.all_zones")}
          </span>
          {filter.categorie && (
            <span className="ss-filter" style={{ "--z": accentOf(filter.categorie) }}>
              <i />{t(`categories.${filter.categorie}`, filter.categorie)}
            </span>
          )}
          {filter.serviceName && (
            <span className="ss-filter"><i />{filter.serviceName}</span>
          )}
        </div>

        {loading ? (
          <Loading />
        ) : result.error ? (
          <div className="sa-error ss-error">
            <span>{result.error}</span>
            <button type="button" className="sa-btn sa-btn--sm" onClick={() => setReload((r) => r + 1)}>
              <RefreshCw size={14} /> {t("suiviStock.retry")}
            </button>
          </div>
        ) : data.linges.length === 0 ? (
          <EmptyState title={t("suiviStock.no_linges")} />
        ) : (
          <>
            <div className="ss-table-wrap" style={{ maxHeight: "58vh" }}>
              <table className="ss-table ss-linges">
                <thead>
                  <tr>
                    <th>{t("suiviStock.col_code")}</th>
                    <th>{t("suiviStock.col_designation")}</th>
                    <th>{t("suiviStock.col_category")}</th>
                    <th>{t("suiviStock.col_state")}</th>
                    <th>{t("suiviStock.col_location")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.linges.map((l) => (
                    <tr key={l.lingeId ?? l.codeBarre}>
                      <td>{l.codeBarre || "—"}</td>
                      <td style={{ fontWeight: 500, color: "var(--sa-text-2)" }}>{l.designation || "—"}</td>
                      <td>
                        {l.categorie ? (
                          <span className="ss-filter" style={{ "--z": accentOf(l.categorie) }}>
                            <i />{t(`categories.${l.categorie}`, l.categorie)}
                          </span>
                        ) : "—"}
                      </td>
                      <td>{l.etat ? <span className="sa-tag">{t(`historique.etat.${l.etat}`, l.etat)}</span> : "—"}</td>
                      <td><Localisation l={l} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ss-pager">
              <span>
                {t("suiviStock.page_of", { page: page + 1, total: Math.max(totalPages, 1) })} · {t("suiviStock.linges_count", { count: data.total })}
              </span>
              <div className="ss-pager__btns">
                <button type="button" className="sa-btn sa-btn--sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft size={15} /> {t("common.previous")}
                </button>
                <button type="button" className="sa-btn sa-btn--sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  {t("common.next")} <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
